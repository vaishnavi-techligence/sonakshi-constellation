import os
import subprocess
import glob

PUBLIC_DIR = os.path.join("d:\\Sonakshi", "public")
FFMPEG = os.path.join("d:\\Sonakshi", "ffmpeg.exe")

def get_size(path):
    return os.path.getsize(path) / (1024 * 1024)

def compress_file(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    temp_filepath = filepath + ".tmp.mp4" if ext in ['.mp4', '.webm'] else filepath + ".tmp" + ext
    
    orig_size = get_size(filepath)
    if orig_size < 1.0:
        print(f"Skipping {filepath} (already small: {orig_size:.2f}MB)")
        return
        
    if ext in ['.mp4', '.webm']:
        cmd = [
            FFMPEG, "-y", "-i", filepath,
            "-vf", "scale='min(1280,iw)':min'(720,ih)':force_original_aspect_ratio=decrease",
            "-vcodec", "libx264", "-crf", "30", "-preset", "fast",
            "-acodec", "aac", "-b:a", "96k",
            temp_filepath
        ]
        
    print(f"Compressing {filepath} ({orig_size:.2f}MB)...")
    try:
        # Run ffmpeg
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Replace original with compressed. If it was webm, we output mp4, so we rename accordingly.
        # But wait, React code expects .webm! So we should output webm?
        # Re-encoding to webm is very slow with libvpx. We can just keep it as it is, or if it's .webm we just lower bitrate with libvpx-vp9?
        # Actually it's easier to just use libx264 and keep the .webm extension (browsers will still play an mp4 container named .webm, but it's bad practice).
        pass
    except Exception as e:
        print(f"Failed to compress {filepath}: {e}")
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
        return

    new_size = get_size(temp_filepath)
    os.replace(temp_filepath, filepath)
    print(f" -> Compressed to {new_size:.2f}MB")

files_to_compress = []
files_to_compress.extend(glob.glob(os.path.join(PUBLIC_DIR, "media", "vlive", "*.mp4")))
files_to_compress.extend(glob.glob(os.path.join(PUBLIC_DIR, "Tape", "*.mp4")))
files_to_compress.extend(glob.glob(os.path.join(PUBLIC_DIR, "*.mp4")))

# Only compress webm if it's large, but let's do libx264 into a .webm container? No, ffmpeg will error.
# Let's skip webm for now unless they are huge. blue_and_grey.webm is 4MB. 
# 4MB is fine. The 16MB mp4s are the problem.

for f in files_to_compress:
    compress_file(f)
