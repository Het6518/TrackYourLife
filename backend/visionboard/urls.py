from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import GoalPinViewSet

router = DefaultRouter()
router.register("goals", GoalPinViewSet, basename="goal")

urlpatterns = [path("", include(router.urls))]
