from django.urls import path

from .views import (
    FriendRequestsView,
    FriendsListView,
    RemoveFriendView,
    RespondFriendRequestView,
    SearchUsersView,
)

urlpatterns = [
    # specific literal paths must come before the <str:username> catch-all below
    path("friends/requests/", FriendRequestsView.as_view(), name="friend-requests"),
    path("friends/requests/<int:pk>/<str:action>/", RespondFriendRequestView.as_view(), name="friend-request-respond"),
    path("friends/search/", SearchUsersView.as_view(), name="friends-search"),
    path("friends/", FriendsListView.as_view(), name="friends-list"),
    path("friends/<str:username>/", RemoveFriendView.as_view(), name="friends-remove"),
]
