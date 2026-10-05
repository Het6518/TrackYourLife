"""
Django settings for config project.
"""

import os
import sys
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# local dev convenience; on the host, real environment variables take precedence
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-o9rdm3c(nr*o!7okl1dvd2^u^fa7gq2xm@#j)2hr#t0u*s%0h%",
)
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

if not DEBUG and SECRET_KEY.startswith("django-insecure-"):
    raise RuntimeError("Set DJANGO_SECRET_KEY when DJANGO_DEBUG is not True.")
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "accounts",
    "days",
    "music",
    "visionboard",
    "friends",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # serves static files directly, no separate web server needed
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

if not os.environ.get("DATABASE_URL"):
    raise RuntimeError("Set DATABASE_URL (see backend/.env.example).")

# a single postgres:// URL — local docker in dev, Neon's connection string in production
DATABASES = {
    "default": dj_database_url.config(
        conn_max_age=600,  # reuse connections instead of reconnecting per request
        conn_health_checks=True,  # Neon suspends idle computes; drop dead connections cleanly
    )
}
# Neon's pooled endpoint (-pooler host) runs PgBouncer in transaction mode,
# which doesn't support the server-side cursors Django uses for .iterator()
DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"  # `collectstatic` target for production
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# uploads (avatars, songs, backgrounds, vision-board images) go to Cloudinary when
# its credentials are set — the host's disk is wiped on every deploy. Without them
# (or under `manage.py test`) files stay in MEDIA_ROOT. cloudinary_storage reads
# CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET straight from the environment.
CLOUDINARY_ENABLED = bool(os.environ.get("CLOUDINARY_CLOUD_NAME")) and "test" not in sys.argv[1:2]
# serve uploads via this API (/api/media/...) instead of res.cloudinary.com,
# which some ISPs block outright — see config/cloudinary_media.py
CLOUDINARY_PROXY_MEDIA = os.environ.get("CLOUDINARY_PROXY_MEDIA", "True") == "True"

STORAGES = {
    "default": {
        "BACKEND": (
            "config.cloudinary_media.ProxiedMediaCloudinaryStorage"
            if CLOUDINARY_ENABLED
            else "django.core.files.storage.FileSystemStorage"
        ),
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# comma-separated list of allowed frontend origins in production, e.g.
# DJANGO_CORS_ORIGINS=https://trackyourlife.example.com,https://www.trackyourlife.example.com
_cors_env = os.environ.get("DJANGO_CORS_ORIGINS", "")
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in _cors_env.split(",") if origin.strip()] or [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# needed for the Django admin's login (session + CSRF) when served from a real domain
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# production hardening — inert in local dev since DEBUG defaults to True there
if not DEBUG:
    SECURE_SSL_REDIRECT = os.environ.get("DJANGO_SSL_REDIRECT", "True") == "True"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 7  # 1 week; raise once you're confident HTTPS is solid
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")  # most PaaS hosts sit behind a proxy

MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.console.EmailBackend",
    },
}

