from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from spitch import Spitch
from .models import Announcement
from .serializers import AnnouncementSerializer
import os
import uuid
import json

# Init Spitch client
spitch = Spitch(api_key=settings.SPITCH_API_KEY)


class CreateAnnouncementView(APIView):
    def post(self, request):
        text = request.data.get("text")
        languages = request.data.get("languages", [])
        tone = request.data.get("tone", "neutral")

        print(f"CreateAnnouncementView received - text: {text[:100] if text else 'None'}, languages: {languages}")

        if not text or not languages:
            return Response(
                {"error": "Text and languages are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return self._process_announcement(request, text, languages, tone)

    def _process_announcement(self, request, text, languages, tone):
        translations = {}
        audio_files = {}

        print(f"Processing announcement: text='{text[:100]}...', languages={languages}, tone={tone}")

        # Validate languages is a list
        if not isinstance(languages, list):
            return Response(
                {"error": "Languages must be a list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for lang in languages:
            # 1. Translate
            try:
                print(f"Translating to {lang}...")
                translation = spitch.text.translate(
                    text=text,
                    source="en",  # Assuming source is always English
                    target=lang
                )
                translated_text = translation.text
                translations[lang] = translated_text
                print(f"Translation for {lang} successful: {translated_text[:100]}...")
            except Exception as e:
                error_msg = f"Translation failed for {lang}: {str(e)}"
                print(error_msg)
                return Response(
                    {"error": error_msg},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # 2. TTS (generate audio bytes)
            try:
                voice_map = {
                    "yo": "femi",
                    "ig": "obinna",
                    "ha": "aliyu",
                    "en": "john",
                }
                voice = voice_map.get(lang, "john")
                print(f"Generating TTS for {lang} with voice {voice}...")

                resp = spitch.speech.generate(
                    text=translated_text,
                    language=lang,
                    voice=voice
                )

                audio_bytes = resp.http_response.content
                print(f"TTS generated for {lang}, audio size: {len(audio_bytes)} bytes")

                # Save audio file with unique name
                filename = f"announcement_{lang}_{uuid.uuid4().hex}.wav"
                file_path = os.path.join(settings.MEDIA_ROOT, filename)
                os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

                with open(file_path, "wb") as f:
                    f.write(audio_bytes)

                audio_files[lang] = request.build_absolute_uri(
                    f"{settings.MEDIA_URL}{filename}"
                )
                print(f"Audio saved for {lang}: {audio_files[lang]}")

            except Exception as e:
                error_msg = f"TTS failed for {lang}: {str(e)}"
                print(error_msg)
                return Response(
                    {"error": error_msg},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        # 3. Save to DB
        try:
            announcement = Announcement.objects.create(
                text=text,
                languages=languages,
                translations=translations,
                tone=tone,
                audio_files=audio_files,
            )
            print(f"Announcement saved successfully with ID: {announcement.id}")
        except Exception as e:
            error_msg = f"Database save failed: {str(e)}"
            print(error_msg)
            return Response(
                {"error": error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            AnnouncementSerializer(announcement).data,
            status=status.HTTP_201_CREATED,
        )


class TranscribeAnnouncementView(CreateAnnouncementView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        audio_file = request.FILES.get("audio")
        languages_str = request.data.get("languages", "[]")
        tone = request.data.get("tone", "neutral")

        print(f"TranscribeAnnouncementView received - audio_file: {audio_file}, languages_str: {languages_str}")

        if not audio_file:
            return Response(
                {"error": "Audio file is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Parse languages from JSON string to list
        try:
            languages = json.loads(languages_str)
            if not isinstance(languages, list):
                return Response(
                    {"error": "Languages must be a JSON array."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            return Response(
                {"error": "Invalid JSON format for languages."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not languages:
            return Response(
                {"error": "At least one language is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Transcribe - CORRECTED BASED ON SPITCH DOCS
        try:
            print(f"Transcribing audio file: {audio_file.name}, size: {audio_file.size} bytes, type: {audio_file.content_type}")

            # Read the audio file content
            audio_content = b''
            for chunk in audio_file.chunks():
                audio_content += chunk

            print(f"Audio content size: {len(audio_content)} bytes")

            # Convert WebM to WAV if needed (Spitch supports wav, mp3, m4a, ogg)
            # For now, let's try with the original content
            resp = spitch.speech.transcribe(
                content=audio_content,  # ✅ Correct parameter name
                language="en"  # Default language for transcription
            )
            
            text = resp.text
            print(f"Transcription successful: {text}")

        except Exception as e:
            error_msg = f"Transcription failed: {str(e)}"
            print(error_msg)
            return Response(
                {"error": error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # 2. Reuse pipeline
        return self._process_announcement(request, text, languages, tone)


class AnnouncementHistoryView(APIView):
    def get(self, request):
        try:
            announcements = Announcement.objects.order_by("-created_at")[:20]
            print(f"Retrieved {len(announcements)} announcements from history")
            return Response(AnnouncementSerializer(announcements, many=True).data)
        except Exception as e:
            error_msg = f"Failed to retrieve history: {str(e)}"
            print(error_msg)
            return Response(
                {"error": error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )