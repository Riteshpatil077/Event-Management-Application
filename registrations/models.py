from django.db import models
from django.contrib.auth.models import User
from events.models import Event


class Registration(models.Model):
    STATUS_CHOICES = [
        ('confirmed','Confirmed'),
        ('waitlist','Waitlist'),
        ('cancelled','Cancelled'),
    ]

    user = models.ForeignKey(
        User,
        on_delete = models.CASCADE,
        related_name='registrations'
    )
    
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='registrations'
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='confirmed'
    )

    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user','event'],
                name='unique_user_event_registration'
            )
        ]
        indexes = [
            models.Index(
                fields=["event", "status", "registered_at"],
                name="reg_event_status_idx",
            ),
            models.Index(
                fields=["user", "registered_at"],
                name="reg_user_recent_idx",
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.event.title} ({self.status})"
