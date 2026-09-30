from django.db.models import Count, F, Q, Value
from django.db.models.functions import Greatest
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Event
from .serializers import EventSerializer


def event_queryset():
    return Event.objects.annotate(
        registered_count=Count(
            "registrations",
            filter=Q(registrations__status="confirmed"),
            distinct=True,
        ),
    ).annotate(
        remaining_capacity=Greatest(F("capacity") - F("registered_count"), Value(0)),
    ).select_related("organizer")


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def event_list(request):
    if request.method == "GET":
        events = event_queryset().filter(event_date__gte=timezone.now()).order_by("event_date", "id")
        query = request.query_params.get("search", "").strip()
        if query:
            events = events.filter(
                Q(title__icontains=query)
                | Q(description__icontains=query)
                | Q(location__icontains=query)
            )
        paginator = PageNumberPagination()
        paginator.page_size = 12
        page = paginator.paginate_queryset(events, request)
        return paginator.get_paginated_response(EventSerializer(page, many=True).data)

    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    serializer = EventSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    event = serializer.save(organizer=request.user)
    return Response(
        EventSerializer(event_queryset().get(pk=event.pk)).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([AllowAny])
def event_detail(request, pk):
    event = get_object_or_404(event_queryset(), pk=pk)
    if request.method == "GET":
        return Response(EventSerializer(event).data)

    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if event.organizer_id != request.user.id:
        return Response(
            {"detail": "Only the event organizer can modify this event."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "DELETE":
        if event.registrations.exists():
            return Response(
                {"detail": "Events with registrations cannot be deleted."},
                status=status.HTTP_409_CONFLICT,
            )
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = EventSerializer(
        event,
        data=request.data,
        partial=request.method == "PATCH",
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(EventSerializer(event_queryset().get(pk=event.pk)).data)
