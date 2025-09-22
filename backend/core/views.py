from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from spitch import Spitch
from .models import Announcement
from .serializers import AnnouncementSerializer
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import os
import uuid
import json
import tempfile
import subprocess

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

        # Create announcement first to get ID
        announcement = Announcement.objects.create(
            text=text,
            languages=languages,
            translations={},
            tone=tone,
            audio_files={},
        )

        try:
            for lang in languages:
                # 1. Translate
                try:
                    print(f"Translating to {lang}...")
                    translation = spitch.text.translate(
                        text=text,
                        source="en",
                        target=lang
                    )
                    translated_text = translation.text
                    translations[lang] = translated_text
                    print(f"Translation for {lang} successful: {translated_text[:100]}...")
                except Exception as e:
                    error_msg = f"Translation failed for {lang}: {str(e)}"
                    print(error_msg)
                    continue

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

                    # Generate unique filename for Cloudinary
                    filename = f"announcement_{announcement.id}_{lang}_{uuid.uuid4().hex}.wav"
                    
                    # Save using Django's file storage (should upload to Cloudinary)
                    content_file = ContentFile(audio_bytes)
                    saved_path = default_storage.save(filename, content_file)
                    
                    # Get the FULL Cloudinary URL
                    audio_url = default_storage.url(saved_path)
                    
                    # Ensure it's a full URL (not relative path)
                    if not audio_url.startswith(('http://', 'https://')):
                        # If it's a relative path, construct full URL
                        from django.urls import reverse
                        audio_url = request.build_absolute_uri(audio_url)
                    
                    audio_files[lang] = audio_url
                    print(f"Audio uploaded to Cloudinary for {lang}: {audio_url}")

                except Exception as e:
                    error_msg = f"TTS failed for {lang}: {str(e)}"
                    print(error_msg)
                    # Continue with other languages

            # Update the announcement with translations and audio files
            announcement.translations = translations
            announcement.audio_files = audio_files
            announcement.save()

            print(f"Announcement completed successfully with ID: {announcement.id}")

        except Exception as e:
            # If something goes wrong, delete the partially created announcement
            announcement.delete()
            error_msg = f"Announcement processing failed: {str(e)}"
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

        # 1. Transcribe
        try:
            print(f"Transcribing audio file: {audio_file.name}, size: {audio_file.size} bytes, type: {audio_file.content_type}")

            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_webm:
                for chunk in audio_file.chunks():
                    temp_webm.write(chunk)
                webm_path = temp_webm.name

            # Convert WebM to WAV (supported by Spitch)
            wav_path = self.convert_webm_to_wav(webm_path)
            
            try:
                # Read the converted WAV file
                with open(wav_path, "rb") as f:
                    audio_content = f.read()
                
                print(f"Converted audio size: {len(audio_content)} bytes, format: WAV")

                # Transcribe using Spitch
                resp = spitch.speech.transcribe(
                    content=audio_content,
                    language="en"  # Source language for transcription
                )
                
                text = resp.text
                print(f"Transcription successful: {text}")

            finally:
                # Clean up temporary files
                os.unlink(webm_path)
                if os.path.exists(wav_path):
                    os.unlink(wav_path)

        except Exception as e:
            error_msg = f"Transcription failed: {str(e)}"
            print(error_msg)
            return Response(
                {"error": error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # 2. Reuse pipeline
        return self._process_announcement(request, text, languages, tone)

    def convert_webm_to_wav(self, webm_path):
        """Convert WebM audio to WAV format using ffmpeg"""
        wav_path = webm_path.replace('.webm', '.wav')
        
        try:
            # Use ffmpeg to convert WebM to WAV
            cmd = [
                'ffmpeg',
                '-i', webm_path,
                '-ac', '1',        # Mono channel
                '-ar', '16000',    # 16kHz sample rate
                '-acodec', 'pcm_s16le',  # 16-bit PCM
                '-y',              # Overwrite output file
                wav_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"FFmpeg conversion failed: {result.stderr}")
            
            print(f"Audio converted successfully: {webm_path} -> {wav_path}")
            return wav_path
            
        except Exception as e:
            print(f"FFmpeg conversion failed: {e}")
            return self.fallback_audio_conversion(webm_path)

    def fallback_audio_conversion(self, webm_path):
        """Fallback conversion method without ffmpeg"""
        print("Using fallback conversion - trying direct upload")
        return webm_path


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