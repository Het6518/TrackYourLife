from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("days.urls")),
    path("api/", include("music.urls")),
    path("api/", include("visionboard.urls")),
    path("api/", include("friends.urls")),
]

if settings.CLOUDINARY_ENABLED:
    from .cloudinary_media import media_proxy

    urlpatterns.append(path("api/media/<str:resource_type>/<path:public_id>", media_proxy, name="media-proxy"))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
