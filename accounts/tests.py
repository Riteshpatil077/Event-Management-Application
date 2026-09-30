from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient


class AccountApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_signup_token_login_and_current_user(self):
        created = self.client.post("/api/accounts/signup/", {
            "username": "new-member",
            "email": "new@example.com",
            "password": "ExamplePass123!",
        }, format="json")
        self.assertEqual(created.status_code, 201)
        self.assertEqual(User.objects.count(), 1)
        token = self.client.post("/api/token/", {
            "username": "new-member",
            "password": "ExamplePass123!",
        }, format="json")
        self.assertEqual(token.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.data['access']}")
        current = self.client.get("/api/accounts/me/")
        self.assertEqual(current.status_code, 200)
        self.assertEqual(current.data["email"], "new@example.com")

    def test_duplicate_account_fields_are_rejected(self):
        User.objects.create_user("member", email="member@example.com", password="ExamplePass123!")
        response = self.client.post("/api/accounts/signup/", {
            "username": "member",
            "email": "member@example.com",
            "password": "ExamplePass123!",
        }, format="json")
        self.assertEqual(response.status_code, 400)
