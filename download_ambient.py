import os
import subprocess
import sys

FFMPEG_PATH = "node_modules/ffmpeg-static/ffmpeg.exe"

downloads = [
    {"key": "rainy", "url": "https://youtu.be/gP9sGBywjks?si=TsZGUA0Ijj36sexk", "filename": "rain_roof.mp3"},
    {"key": "fireplace", "url": "https://youtu.be/DyMGs50qhDs?si=30Qn0xsLN6kVBMY4", "filename": "fire.mp3"},
    {"key": "starry", "url": "https://youtu.be/g1w3IT5WnYw?si=7nBOdZiPR5HucaE_", "filename": "waves.mp3"},
    {"key": "golden", "url": "https://www.youtube.com/live/vfQbLYQXl9k?si=iR0nDm33Bx7ddmgS", "filename": "birds.mp3"},
    {"key": "cosmic", "url": "https://youtu.be/5dhxKwr6G5c?si=IeAf_1OeoYpYJNI8", "filename": "crickets.mp3"},
    {"key": "cherry", "url": "https://youtu.be/QRkzZ_SrB-8?si=Lx4pawVbSYYUyN1t", "filename": "stream.mp3"}
]

out_dir = os.path.join("public", "ambient")
if not os.path.exists(out_dir):
    os.makedirs(out_dir)

for item in downloads:
    out_path = os.path.join(out_dir, item["filename"])
    # Download first 5 minutes (00:00:00-00:05:00)
    # Using python -m yt_dlp
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--ffmpeg-location", FFMPEG_PATH,
        "--extract-audio",
        "--audio-format", "mp3",
        "--download-sections", "*00:00:00-00:05:00",
        "-o", out_path,
        "--force-overwrites",
        item["url"]
    ]
    print(f"Downloading {item['key']}...")
    subprocess.run(cmd)

print("Done downloading ambient tracks!")
