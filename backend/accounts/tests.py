import io
import shutil
import tempfile

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from days.models import Day

MEDIA = tempfile.mkdtemp()


def make_image(name="a.png", size=(10, 10)):
    buf = io.BytesIO()
    Image.new("RGB", size, "teal").save(buf, "PNG")
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/png")


@override_settings(MEDIA_ROOT=MEDIA)
class AvatarTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def setUp(self):
        self.user = User.objects.create_user("alice", password="pw12345678")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_me_has_no_avatar_by_default(self):
        self.assertIsNone(self.client.get("/api/auth/me/").json()["avatar_url"])

    def test_upload_sets_avatar_url(self):
        response = self.client.post("/api/auth/me/avatar/", {"avatar": make_image()}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertIn("/media/avatars/", response.json()["avatar_url"])
        self.assertEqual(self.client.get("/api/auth/me/").json()["avatar_url"], response.json()["avatar_url"])

    def test_rejects_non_image(self):
        bad = SimpleUploadedFile("a.txt", b"not an image", content_type="text/plain")
        response = self.client.post("/api/auth/me/avatar/", {"avatar": bad}, format="multipart")
        self.assertEqual(response.status_code, 400)

    def test_rejects_oversized_image(self):
        big = SimpleUploadedFile("a.png", make_image().read() + b"0" * (2 * 1024 * 1024), content_type="image/png")
        response = self.client.post("/api/auth/me/avatar/", {"avatar": big}, format="multipart")
        self.assertEqual(response.status_code, 400)

    def test_delete_removes_avatar(self):
        self.client.post("/api/auth/me/avatar/", {"avatar": make_image()}, format="multipart")
        self.assertEqual(self.client.delete("/api/auth/me/avatar/").status_code, 204)
        self.assertIsNone(self.client.get("/api/auth/me/").json()["avatar_url"])

    def test_requires_authentication(self):
        self.client.credentials()
        self.assertEqual(self.client.post("/api/auth/me/avatar/", {"avatar": make_image()}, format="multipart").status_code, 401)

    def test_public_endpoints_include_avatar_url(self):
        Day.objects.create(user=self.user, date="2026-01-01", score=5, visibility="public")
        self.client.post("/api/auth/me/avatar/", {"avatar": make_image()}, format="multipart")
        self.client.credentials()
        listed = self.client.get("/api/public/users/").json()[0]
        profile = self.client.get("/api/public/users/alice/days/").json()["user"]
        self.assertIn("/media/avatars/", listed["avatar_url"])
        self.assertEqual(profile["avatar_url"], listed["avatar_url"])
