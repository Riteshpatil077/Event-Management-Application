from datetime import timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from events.models import Event
from .models import Registration


class RegistrationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.alice = User.objects.create_user("alice", password="ExamplePass123!")
        self.bob = User.objects.create_user("bob", password="ExamplePass123!")
        self.event = Event.objects.create(
            title="Tiny concert",
            description="Live music outside.",
            location="Garden",
            event_date=timezone.now() + timedelta(days=10),
            capacity=1,
            organizer=self.alice,
        )

    def test_registration_endpoints_require_authentication(self):
        self.assertEqual(self.client.get("/api/registrations/").status_code, 401)
        self.assertEqual(self.client.post("/api/registrations/create/").status_code, 401)

    def test_confirmation_waitlist_cancellation_and_promotion(self):
        self.client.force_authenticate(self.alice)
        first = self.client.post(
            "/api/registrations/create/", {"event": self.event.pk}, format="json"
        )
        self.assertEqual(first.status_code, 201)
        self.assertEqual(first.data["status"], "confirmed")
        duplicate = self.client.post(
            "/api/registrations/create/", {"event": self.event.pk}, format="json"
        )
        self.assertEqual(duplicate.status_code, 409)

        self.client.force_authenticate(self.bob)
        queued = self.client.post(
            "/api/registrations/create/", {"event": self.event.pk}, format="json"
        )
        self.assertEqual(queued.status_code, 201)
        self.assertEqual(queued.data["status"], "waitlist")
        cancelled = self.client.patch(
            f"/api/registrations/{first.data['id']}/cancel/", {}, format="json"
        )
        self.assertEqual(cancelled.status_code, 404)

        self.client.force_authenticate(self.alice)
        cancelled = self.client.patch(
            f"/api/registrations/{first.data['id']}/cancel/", {}, format="json"
        )
        self.assertEqual(cancelled.status_code, 200)
        self.assertEqual(cancelled.data["status"], "cancelled")
        self.assertEqual(
            Registration.objects.get(user=self.bob, event=self.event).status,
            "confirmed",
        )

    def test_registration_list_is_private_and_cancelled_registration_can_rejoin(self):
        self.client.force_authenticate(self.alice)
        created = self.client.post(
            "/api/registrations/create/", {"event": self.event.pk}, format="json"
        )
        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.get("/api/registrations/").data, [])
        self.assertEqual(
            self.client.get(f"/api/registrations/{created.data['id']}/").status_code,
            404,
        )
        self.client.force_authenticate(self.alice)
        self.client.patch(f"/api/registrations/{created.data['id']}/cancel/", {}, format="json")
        rejoined = self.client.post(
            "/api/registrations/create/", {"event": self.event.pk}, format="json"
        )
        self.assertEqual(rejoined.status_code, 200)
        self.assertEqual(rejoined.data["status"], "confirmed")

    def test_bad_or_expired_event_cannot_be_registered(self):
        self.client.force_authenticate(self.bob)
        bad = self.client.post("/api/registrations/create/", {"event": "bad"}, format="json")
        self.assertEqual(bad.status_code, 400)
        expired = Event.objects.create(
            title="Past concert",
            description="Already over.",
            location="Garden",
            event_date=timezone.now() - timedelta(days=1),
            capacity=4,
            organizer=self.alice,
        )
        response = self.client.post(
            "/api/registrations/create/", {"event": expired.pk}, format="json"
        )
        self.assertEqual(response.status_code, 400)
