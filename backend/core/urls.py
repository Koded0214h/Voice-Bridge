from django.urls import path
from .views import CreateAnnouncementView, AnnouncementHistoryView, TranscribeAnnouncementView

urlpatterns = [
    path("announce/", CreateAnnouncementView.as_view(), name="announce"),
    path("transcribe/", TranscribeAnnouncementView.as_view(), name="transcribe"),
    path("history/", AnnouncementHistoryView.as_view(), name="history"),
]
