import os
import subprocess
import sys
import urllib.request
import zipfile
import io

ffmpeg_url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
ffmpeg_exe = "ffmpeg.exe"

if not os.path.exists(ffmpeg_exe):
    print("Downloading ffmpeg...")
    response = urllib.request.urlopen(ffmpeg_url)
    with zipfile.ZipFile(io.BytesIO(response.read())) as z:
        for file_info in z.infolist():
            if file_info.filename.endswith('ffmpeg.exe'):
                file_info.filename = os.path.basename(file_info.filename)
                z.extract(file_info, path='.')
                break
    print("ffmpeg extracted!")

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
    if os.path.exists(out_path):
        print(f"Skipping {item['key']}, already exists.")
        continue

    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--ffmpeg-location", ffmpeg_exe,
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
