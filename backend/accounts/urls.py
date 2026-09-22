from django.urls import path

from .views import AvatarView, BoardStyleView, LocationView, LoginView, LogoutView, MeView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("me/avatar/", AvatarView.as_view(), name="avatar"),
    path("me/location/", LocationView.as_view(), name="location"),
    path("me/board-style/", BoardStyleView.as_view(), name="board-style"),
]
