"""Cloudinary-backed media storage that serves files through this API.

Some ISPs reset every connection to *.cloudinary.com, so a browser on those
networks can't load res.cloudinary.com URLs even though uploads (which go
server-to-server from the host) succeed. With CLOUDINARY_PROXY_MEDIA on (the
default), file URLs point at /api/media/... on this backend instead, and the
view below streams the bytes from Cloudinary. Only imported when Cloudinary is
enabled — cloudinary_storage refuses to import without credentials.
"""

import cloudinary
import requests
from cloudinary_storage import app_settings
from cloudinary_storage.storage import MediaCloudinaryStorage, VideoMediaCloudinaryStorage
from django.conf import settings
from django.http import Http404, HttpResponse, StreamingHttpResponse
from django.urls import reverse
from django.utils.deconstruct import deconstructible
from django.views.decorators.http import require_safe

PROXIED_RESOURCE_TYPES = {"image", "video"}  # audio is filed under "video"
PASSTHROUGH_HEADERS = ("Content-Type", "Content-Length", "Content-Range", "Accept-Ranges", "ETag", "Last-Modified")
CHUNK_BYTES = 64 * 1024

_session = requests.Session()  # keep-alive to Cloudinary across requests


class ProxiedUrlMixin:
    def url(self, name):
        if not settings.CLOUDINARY_PROXY_MEDIA:
            return super().url(name)
        public_id = self._prepend_prefix(self._normalise_name(name))
        return reverse("media-proxy", kwargs={"resource_type": self.RESOURCE_TYPE, "public_id": public_id})


@deconstructible
class ProxiedMediaCloudinaryStorage(ProxiedUrlMixin, MediaCloudinaryStorage):
    pass


@deconstructible
class ProxiedVideoMediaCloudinaryStorage(ProxiedUrlMixin, VideoMediaCloudinaryStorage):
    pass


def _media_prefix():
    return app_settings.PREFIX.lstrip("/")


@require_safe
def media_proxy(request, resource_type, public_id):
    # only ever this app's own uploads — never an arbitrary asset or URL
    if resource_type not in PROXIED_RESOURCE_TYPES or not public_id.startswith(_media_prefix()) or ".." in public_id:
        raise Http404

    upstream_url = cloudinary.CloudinaryResource(public_id, default_resource_type=resource_type).url
    # identity encoding keeps Content-Length/Content-Range valid for the raw bytes we relay
    headers = {"Accept-Encoding": "identity"}
    if "HTTP_RANGE" in request.META:  # <audio> seeks with byte ranges
        headers["Range"] = request.META["HTTP_RANGE"]

    try:
        upstream = _session.get(upstream_url, headers=headers, stream=True, timeout=(5, 30))
    except requests.RequestException:
        return HttpResponse(status=502)
    if upstream.status_code >= 400:
        upstream.close()
        raise Http404

    def body():
        try:
            yield from upstream.iter_content(CHUNK_BYTES)
        finally:
            upstream.close()

    if request.method == "HEAD":
        upstream.close()
        response = HttpResponse(status=upstream.status_code)
    else:
        response = StreamingHttpResponse(body(), status=upstream.status_code)
    for header in PASSTHROUGH_HEADERS:
        if header in upstream.headers:
            response[header] = upstream.headers[header]
    # public ids carry a random suffix and never change content, so cache hard
    response["Cache-Control"] = "public, max-age=604800, immutable"
    return response
