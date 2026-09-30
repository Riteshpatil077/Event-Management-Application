from django.db import models
from django.contrib.auth.models import User



class Event(models.Model):

    title = models.CharField(max_length=200)

    description = models.TextField()

    location = models.CharField(max_length=255)

    event_date = models.DateTimeField()

    capacity = models.PositiveIntegerField()

    organizer = models.ForeignKey(
        User,
        on_delete = models.CASCADE,
        related_name='events'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["event_date"], name="event_date_idx")]

    def __str__(self):
        return self.title
