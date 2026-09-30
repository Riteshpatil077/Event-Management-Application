from rest_framework import serializers

from events.serializers import EventSerializer
from .models import Registration


class RegistrationSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)

    class Meta:
        model = Registration
        fields = ["id", "event", "status", "registered_at"]
        read_only_fields = fields
