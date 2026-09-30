from django.utils import timezone
from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    registered_count = serializers.IntegerField(read_only=True)
    remaining_capacity = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'location',
            'event_date',
            'capacity',
            'organizer',
            'created_at',
            'updated_at',
            'registered_count',
            'remaining_capacity',
        ]

        read_only_fields = [
            'id',
            'organizer',
            'created_at',
            'updated_at',
        ]

    def validate_capacity(self, value):
        if value < 1:
            raise serializers.ValidationError("Capacity must be at least 1.")
        event = getattr(self, "instance", None)
        if event and value < event.registrations.filter(status="confirmed").count():
            raise serializers.ValidationError(
                "Capacity cannot be lower than the number of confirmed registrations."
            )
        return value

    def validate_event_date(self, value):
        current_value = getattr(self.instance, "event_date", None)
        if value <= timezone.now() and value != current_value:
            raise serializers.ValidationError("Event date must be in the future.")
        return value
    
