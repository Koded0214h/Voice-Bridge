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
import tempfile
import subprocess

# Import Cloudinary
try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False

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

    def _upload_to_cloudinary(self, audio_bytes, filename, language):
        """Upload audio bytes to Cloudinary"""
        try:
            if not CLOUDINARY_AVAILABLE:
                raise Exception("Cloudinary not available")
            
            # Create a temporary file to upload
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
                temp_file.write(audio_bytes)
                temp_file_path = temp_file.name

            try:
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    temp_file_path,
                    resource_type = "video",  # Use "video" for audio files
                    public_id = f"voicebridge/announcements/{filename}",
                    folder = "voicebridge/announcements",
                    overwrite = True,
                    resource_type = "raw"  # Use "raw" for non-image files
                )
                
                print(f"Cloudinary upload successful: {upload_result['secure_url']}")
                return upload_result['secure_url']
                
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
                
        except Exception as e:
            print(f"Cloudinary upload failed: {e}")
            # Fallback to local storage if Cloudinary fails
            return self._save_locally(audio_bytes, filename, request)

    def _save_locally(self, audio_bytes, filename, request):
        """Fallback to local storage"""
        try:
            file_path = os.path.join(settings.MEDIA_ROOT, filename)
            os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

            with open(file_path, "wb") as f:
                f.write(audio_bytes)

            audio_url = request.build_absolute_uri(f"{settings.MEDIA_URL}{filename}")
            print(f"Local storage fallback: {audio_url}")
            return audio_url
            
        except Exception as e:
            print(f"Local storage also failed: {e}")
            raise e

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

            # 2. TTS (generate audio bytes) and upload to Cloudinary
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

                # Generate unique filename
                filename = f"announcement_{lang}_{uuid.uuid4().hex}.wav"
                
                # Upload to Cloudinary
                try:
                    audio_url = self._upload_to_cloudinary(audio_bytes, filename, lang)
                    audio_files[lang] = audio_url
                    print(f"Audio uploaded to Cloudinary for {lang}: {audio_url}")
                    
                except Exception as upload_error:
                    print(f"Cloudinary upload failed, using local storage: {upload_error}")
                    audio_url = self._save_locally(audio_bytes, filename, request)
                    audio_files[lang] = audio_url

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

        # 1. Transcribe - WITH AUDIO CONVERSION
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