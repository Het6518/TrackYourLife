from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Day


class DayAPITests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="pw12345678")
        self.bob = User.objects.create_user("bob", password="pw12345678")
        self.alice_token = Token.objects.create(user=self.alice)

    def auth_as_alice(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.alice_token.key}")

    def test_days_require_authentication(self):
        self.assertEqual(self.client.get("/api/days/").status_code, 401)

    def test_create_day_assigns_current_user(self):
        self.auth_as_alice()
        response = self.client.post(
            "/api/days/", {"date": "2026-01-01", "score": 7, "note": "ok"}
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Day.objects.get().user, self.alice)

    def test_score_must_be_between_1_and_10(self):
        self.auth_as_alice()
        for score in (0, 11):
            response = self.client.post(
                "/api/days/", {"date": "2026-01-01", "score": score}
            )
            self.assertEqual(response.status_code, 400)

    def test_one_entry_per_day_via_api(self):
        self.auth_as_alice()
        payload = {"date": "2026-01-01", "score": 5}
        self.assertEqual(self.client.post("/api/days/", payload).status_code, 201)
        self.assertEqual(self.client.post("/api/days/", payload).status_code, 400)

    def test_one_entry_per_day_db_constraint(self):
        Day.objects.create(user=self.alice, date="2026-01-01", score=5)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Day.objects.create(user=self.alice, date="2026-01-01", score=6)

    def test_users_only_see_their_own_days(self):
        Day.objects.create(user=self.bob, date="2026-01-01", score=5)
        mine = Day.objects.create(user=self.alice, date="2026-01-02", score=6)
        self.auth_as_alice()
        response = self.client.get("/api/days/")
        self.assertEqual([d["id"] for d in response.json()], [mine.id])

    def test_cannot_modify_another_users_day(self):
        theirs = Day.objects.create(user=self.bob, date="2026-01-01", score=5)
        self.auth_as_alice()
        self.assertEqual(self.client.delete(f"/api/days/{theirs.id}/").status_code, 404)
        self.assertTrue(Day.objects.filter(pk=theirs.pk).exists())


class PublicAPITests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="pw12345678")
        self.bob = User.objects.create_user("bob", password="pw12345678")
        Day.objects.create(user=self.alice, date="2026-01-01", score=8, note="public", visibility="public")
        Day.objects.create(user=self.alice, date="2026-01-02", score=3, note="secret", visibility="private")

    def test_public_days_exclude_private_entries(self):
        response = self.client.get("/api/public/users/alice/days/")
        self.assertEqual(response.status_code, 200)
        notes = [d["note"] for d in response.json()["days"]]
        self.assertEqual(notes, ["public"])

    def test_public_users_lists_only_users_with_public_entries(self):
        response = self.client.get("/api/public/users/")
        self.assertEqual([u["username"] for u in response.json()], ["alice"])

    def test_unknown_public_user_returns_404(self):
        self.assertEqual(self.client.get("/api/public/users/nobody/days/").status_code, 404)
