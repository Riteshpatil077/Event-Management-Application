from datetime import timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from registrations.models import Registration
from .models import Event


class EventApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.organizer = User.objects.create_user("organizer", password="ExamplePass123!")
        self.other_user = User.objects.create_user("another", password="ExamplePass123!")
        self.event = Event.objects.create(
            title="Community supper",
            description="An evening around one table.",
            location="Town hall",
            event_date=timezone.now() + timedelta(days=10),
            capacity=12,
            organizer=self.organizer,
        )

    def test_event_list_and_detail_are_public_and_include_capacity(self):
        response = self.client.get("/api/events/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["remaining_capacity"], 12)
        self.assertEqual(response.data["results"][0]["registered_count"], 0)
        self.assertEqual(self.client.get(f"/api/events/{self.event.pk}/").status_code, 200)

    def test_event_search_matches_location(self):
        response = self.client.get("/api/events/?search=town")
        self.assertEqual([row["id"] for row in response.data["results"]], [self.event.pk])

    def test_creating_events_requires_login_and_sets_organizer_from_token(self):
        payload = {
            "title": "Book club",
            "description": "Read together.",
            "location": "Library",
            "event_date": (timezone.now() + timedelta(days=14)).isoformat(),
            "capacity": 8,
        }
        self.assertEqual(self.client.post("/api/events/", payload, format="json").status_code, 401)
        self.client.force_authenticate(self.organizer)
        response = self.client.post("/api/events/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["organizer"], self.organizer.pk)

    def test_only_organizer_can_edit_event_and_patch_is_supported(self):
        self.client.force_authenticate(self.other_user)
        denied = self.client.patch(
            f"/api/events/{self.event.pk}/", {"title": "Changed"}, format="json"
        )
        self.assertEqual(denied.status_code, 403)
        self.client.force_authenticate(self.organizer)
        allowed = self.client.patch(
            f"/api/events/{self.event.pk}/", {"title": "A better supper"}, format="json"
        )
        self.assertEqual(allowed.status_code, 200)
        self.event.refresh_from_db()
        self.assertEqual(self.event.title, "A better supper")

    def test_invalid_capacity_and_past_event_dates_are_rejected(self):
        self.client.force_authenticate(self.organizer)
        payload = {
            "title": "No seats",
            "description": "Nothing available.",
            "location": "Somewhere",
            "event_date": (timezone.now() + timedelta(days=4)).isoformat(),
            "capacity": 0,
        }
        response = self.client.post("/api/events/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        payload["capacity"] = 4
        payload["event_date"] = (timezone.now() - timedelta(days=1)).isoformat()
        response = self.client.post("/api/events/", payload, format="json")
        self.assertEqual(response.status_code, 400)

    def test_event_delete_requires_owner_and_preserves_registered_events(self):
        self.client.force_authenticate(self.organizer)
        Registration.objects.create(user=self.other_user, event=self.event)
        response = self.client.delete(f"/api/events/{self.event.pk}/")
        self.assertEqual(response.status_code, 409)
        self.event.refresh_from_db()
        self.assertTrue(self.event.registrations.exists())

        empty = Event.objects.create(
            title="Unclaimed idea",
            description="No attendees yet.",
            location="Somewhere",
            event_date=timezone.now() + timedelta(days=5),
            capacity=4,
            organizer=self.organizer,
        )
        self.assertEqual(self.client.delete(f"/api/events/{empty.pk}/").status_code, 204)
