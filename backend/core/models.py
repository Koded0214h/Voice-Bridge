# models.py
from django.db import models
from cloudinary_storage.storage import MediaCloudinaryStorage

class Announcement(models.Model):
    text = models.TextField()
    languages = models.JSONField(default=list)
    translations = models.JSONField(default=dict)
    tone = models.CharField(max_length=50, default="neutral")
    audio_files = models.JSONField(default=dict)  # We'll keep this for now
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Announcement {self.id} ({self.created_at})"