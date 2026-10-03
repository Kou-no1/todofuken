"""Edit real browser recordings into a captioned, 47-second vertical Short."""
import json
import math
import os
from pathlib import Path
import struct
import subprocess
import sys
import wave

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "short"
sys.path.insert(0, str(ROOT / ".codex" / "media-tools"))
if os.environ.get("FFMPEG_PATH"):
    FFMPEG = os.environ["FFMPEG_PATH"]
else:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FONT = os.environ.get("VIDEO_FONT", "C:/Windows/Fonts/meiryob.ttc")
CYAN, ORANGE, INK = "#00C8E0", "#FF6B1A", "#27324A"
PLAN = [
    ("hook", 3.6, "高知県、どこにはめる？", "ピタッ！ここにはまる。", "形を見て、場所を思い出そう"),
    ("menu", 4.4, "はめて覚える、都道府県。", "まずは地方から、少しずつ。", "色あり・色なし・赤いガイドつき"),
    ("gameplay", 22.0, "運んで、ピタッ！", "中国・四国 9ピースにちょうせん", "実際のプレイ／一部早送り"),
    ("clear", 4.0, "最後まで…クリア！", "じぶんのベストに、もう一回。", "全国ハードモードでは、しょうごうも！"),
    ("quiz", 7.0, "市名クイズもあそべる！", "県名→市名 ／ 市名→県名", "県庁所在地も、楽しく練習"),
    ("ending", 6.0, "きみは何秒でクリア？", "kou-no1.github.io/todofuken/", "無料・登録なし｜リンクはプロフィールへ"),
]

def text(draw, y, value, size=62, fill=INK, limit=932):
    font = ImageFont.truetype(FONT, size)
    while draw.textbbox((0, 0), value, font=font)[2] > limit:
        size -= 1
        font = ImageFont.truetype(FONT, size)
    box = draw.textbbox((0, 0), value, font=font)
    draw.text(((1080 - box[2]) / 2, y - box[1]), value, font=font, fill=fill)

def overlay(name, title, footer, sub):
    image = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 1080, 292), fill="#F3FBFF")
    draw.rectangle((0, 1732, 1080, 1920), fill="#F3FBFF")
    draw.polygon([(0, 64), (370, 44), (362, 82), (0, 102)], fill=CYAN)
    draw.polygon([(860, 276), (1080, 250), (1080, 290), (836, 294)], fill=ORANGE)
    text(draw, 110, "パズルでおぼえる「都道府県」", 36)
    text(draw, 186, title, 72)
    draw.rectangle((76, 1737, 1004, 1744), fill=CYAN)
    text(draw, 1781, footer, 48, limit=932)
    text(draw, 1860, sub, 31, fill="#526176")
    image.save(OUT / f"overlay-{name}.png")

def command(args):
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "warning", "-y", *map(str, args)], check=True)

recording = json.loads((OUT / "shots.json").read_text(encoding="utf-8"))
shots = {shot["id"]: shot for shot in recording["shots"]}
parts = []
subtitle_lines = []
timeline = 0.0

def timestamp(seconds):
    ms = round(seconds * 1000)
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"

for index, (name, duration, title, footer, sub) in enumerate(PLAN):
    shot = shots[name]
    overlay(name, title, footer, sub)
    clip = OUT / f"clip-{name}.mp4"
    # Keep every recorded action. Only elapsed presentation speed is edited.
    scale = duration / (shot["end"] - shot["start"])
    filters = (
        f"[0:v]setpts={scale:.9f}*(PTS-STARTPTS),tpad=stop_mode=clone:stop_duration=2,fps=30,scale=972:1440:flags=lanczos,"
        f"pad=1080:1920:54:292:color=0xF3FBFF[screen];"
        "[screen][1:v]overlay=0:0:format=auto,format=yuv420p[v]"
    )
    if "--ending-only" not in sys.argv or name == "ending" or not clip.exists():
        command(["-ss", shot["start"], "-t", shot["end"] - shot["start"], "-i", recording["raw"],
                 "-loop", "1", "-i", OUT / f"overlay-{name}.png", "-filter_complex", filters,
                 "-map", "[v]", "-an", "-t", duration, "-c:v", "libx264", "-threads", "2",
                 "-preset", "fast", "-crf", "19", clip])
    parts.append(clip)
    subtitle_lines.extend([str(index + 1), f"{timestamp(timeline)} --> {timestamp(timeline + duration)}", title, footer, ""])
    timeline += duration
    print(f"Edited {name}: {duration:.1f}s", flush=True)

(OUT / "concat.txt").write_text("\n".join(f"file '{part.as_posix()}'" for part in parts), encoding="utf-8")
(OUT / "todofuken-short.srt").write_text("\n".join(subtitle_lines), encoding="utf-8")

# An original quiet, plucked tune and success chimes. No licensed music samples.
rate = 44100
notes = [60, 64, 67, 72, 69, 67, 64, 67, 62, 65, 69, 74, 71, 69, 65, 67]
duration = sum(item[1] for item in PLAN)
with wave.open(str(OUT / "original-bgm.wav"), "wb") as audio:
    audio.setnchannels(1); audio.setsampwidth(2); audio.setframerate(rate)
    frames = bytearray()
    beat = 60 / 112
    for i in range(round(duration * rate)):
        t = i / rate
        step = int(t / beat)
        age = t % beat
        freq = 440 * 2 ** ((notes[step % len(notes)] - 69) / 12)
        value = 0.10 * math.sin(2 * math.pi * freq * age) * math.exp(-age * 6)
        value += 0.035 * math.sin(2 * math.pi * (freq / 2) * age) * math.exp(-age * 4)
        # The clear moment is at 30 seconds in the edited timeline.
        for at, hz in [(30.1, 659.25), (30.27, 783.99), (30.44, 1046.5)]:
            dt = t - at
            if 0 <= dt < 0.4: value += 0.10 * math.sin(2 * math.pi * hz * dt) * math.exp(-dt * 9)
        fade = min(1, t / 0.2, (duration - t) / 0.8)
        frames.extend(struct.pack("<h", round(max(-1, min(1, value * fade)) * 32767)))
    audio.writeframes(frames)

final = OUT / "todofuken-short-47s.mp4"
command(["-f", "concat", "-safe", "0", "-i", OUT / "concat.txt", "-i", OUT / "original-bgm.wav",
         "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
         "-t", duration, "-movflags", "+faststart", final])
for name, seconds in [("opening", 1.5), ("gameplay", 17), ("clear", 32), ("quiz", 37), ("ending", 44)]:
    command(["-ss", seconds, "-i", final, "-frames:v", "1", "-update", "1", OUT / f"frame-{name}.png"])

# A poster made from actual gameplay, using the same legible hook.
poster = Image.open(OUT / "frame-opening.png").convert("RGBA")
poster.alpha_composite(Image.open(OUT / "overlay-hook.png"))
poster.convert("RGB").save(OUT / "todofuken-thumbnail.jpg", quality=94)
summary = {"durationSeconds": duration, "width": 1080, "height": 1920, "fps": 30,
           "source": "Real Chromium gameplay with CDP touch input; edited speed; original generated music", "file": str(final)}
(OUT / "video-info.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
print(json.dumps(summary), flush=True)
