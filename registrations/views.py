from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from events.models import Event
from .models import Registration
from .serializers import RegistrationSerializer


@api_view(["POST"])
def create_registration(request):
    event_id = request.data.get("event")
    if isinstance(event_id, bool) or not (
        isinstance(event_id, int)
        or (isinstance(event_id, str) and event_id.strip().isdecimal())
    ):
        return Response(
            {"event": "Provide a valid event ID."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        event_id = int(event_id)
    except (TypeError, ValueError):
        return Response(
            {"event": "Provide a valid event ID."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():
            event = get_object_or_404(Event.objects.select_for_update(), pk=event_id)
            if event.event_date <= timezone.now():
                return Response(
                    {"detail": "Registration for this event has closed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            registration = (
                Registration.objects.select_for_update()
                .filter(user=request.user, event=event)
                .first()
            )
            created = registration is None
            if registration and registration.status in {"confirmed", "waitlist"}:
                return Response(
                    {"detail": "You already have an active registration for this event."},
                    status=status.HTTP_409_CONFLICT,
                )

            confirmed_count = Registration.objects.filter(
                event=event, status="confirmed"
            ).count()
            new_status = "confirmed" if confirmed_count < event.capacity else "waitlist"
            if registration:
                registration.status = new_status
                registration.registered_at = timezone.now()
                registration.save(update_fields=["status", "registered_at"])
            else:
                registration = Registration.objects.create(
                    user=request.user,
                    event=event,
                    status=new_status,
                )
    except IntegrityError:
        return Response(
            {"detail": "You already have a registration for this event."},
            status=status.HTTP_409_CONFLICT,
        )

    return Response(
        RegistrationSerializer(registration).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["GET"])
def registration_list(request):
    registrations = (
        Registration.objects.filter(user=request.user)
        .select_related("event", "event__organizer")
        .order_by("-registered_at", "-id")
    )
    return Response(RegistrationSerializer(registrations, many=True).data)


@api_view(["GET"])
def registration_detail(request, pk):
    registration = get_object_or_404(
        Registration.objects.select_related("event", "event__organizer"),
        pk=pk,
        user=request.user,
    )
    return Response(RegistrationSerializer(registration).data)


@api_view(["PATCH"])
def cancel_registration(request, pk):
    with transaction.atomic():
        registration = get_object_or_404(
            Registration.objects.select_related("event"),
            pk=pk,
            user=request.user,
        )
        Event.objects.select_for_update().get(pk=registration.event_id)
        registration = Registration.objects.select_for_update().select_related(
            "event"
        ).get(pk=registration.pk)
        if registration.status == "cancelled":
            return Response(
                {"detail": "This registration has already been cancelled."},
                status=status.HTTP_409_CONFLICT,
            )

        was_confirmed = registration.status == "confirmed"
        registration.status = "cancelled"
        registration.save(update_fields=["status"])

        if was_confirmed and registration.event.event_date > timezone.now():
            next_waitlisted = (
                Registration.objects.select_for_update()
                .filter(event=registration.event, status="waitlist")
                .order_by("registered_at", "id")
                .first()
            )
            if next_waitlisted:
                next_waitlisted.status = "confirmed"
                next_waitlisted.save(update_fields=["status"])

    registration = Registration.objects.select_related(
        "event", "event__organizer"
    ).get(pk=registration.pk)
    return Response(RegistrationSerializer(registration).data)
