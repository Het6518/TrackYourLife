from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DayViewSet, public_user_days, public_users

router = DefaultRouter()
router.register("days", DayViewSet, basename="day")

urlpatterns = [
    path("", include(router.urls)),
    path("public/users/", public_users, name="public-users"),
    path("public/users/<str:username>/days/", public_user_days, name="public-user-days"),
]
