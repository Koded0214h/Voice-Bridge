from spitch import Spitch

API_KEY = "sk_BPjdxQDAEZTRjKGn1U7kDAAwK4N4mp3XueVSenyq"  # replace with your real key
spitch = Spitch(api_key=API_KEY)

print("=== Testing Translation ===")
translation = spitch.text.translate(
    text="Flight 220 is now boarding",
    source="en",
    target="yo"  # Yoruba
)
print("Original:", "Flight 220 is now boarding")
print("Translated (yo):", translation.text)

print("\n=== Testing TTS ===")
try:
    resp = spitch.speech.generate(
        text=translation.text,
        language="yo",
        voice="femi"  # Yoruba voice
    )

    # Extract raw audio bytes
    audio_bytes = resp.http_response.content

    # Save to file
    with open("output.wav", "wb") as f:
        f.write(audio_bytes)

    print("✅ Saved Yoruba audio to output.wav")

except Exception as e:
    print("TTS Error:", e)
