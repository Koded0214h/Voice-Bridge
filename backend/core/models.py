from django.db import models

# Create your models here.

class Announcement(models.Model):
    text = models.TextField()
    languages = models.JSONField(default=list)   # e.g. ["en", "fr"]
    translations = models.JSONField(default=dict)  # {"fr": "...", "en": "..."}
    tone = models.CharField(max_length=50, default="neutral")
    audio_files = models.JSONField(default=dict)  # {"fr": "url", "en": "url"}
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Announcement {self.id} ({self.created_at})"