import asyncio
import os
import edge_tts
import wave
import contextlib
import subprocess
from pathlib import Path

VOICE = "en-US-GuyNeural"
RATE = "+4%"
PITCH = "+2Hz"

SCRIPTS = {
    "voice_phase1": (
        "Autonomous AI agents are rapidly moving from simple chatbots to executing real, powerful actions on the web. "
        "But handing an uncontained agent raw access to private credentials, system shells, and open networks is a recipe for disaster. "
        "At Latch, we believe containment is not a feature — it is the product. "
        "We replace fragile, vulnerable web bots with deterministic, sandboxed execution powered by Vultr Cloud."
    ),
    "voice_phase2": (
        "Latch is engineered ground up on Vultr's composable cloud infrastructure. "
        "Our control plane and runner daemons run in high availability on Vultr Cloud Compute. "
        "For intelligence, we integrate Vultr Serverless Inference powered by DeepSeek v4.1, delivering lightning fast task planning and code synthesis. "
        "And for rock-solid auditability, Vultr Object Storage persists our verified API connectors, lessons, and signed execution receipts across three Atlanta S3 buckets."
    ),
    "voice_phase3": (
        "Here is Latch in action with a live interactive demo. "
        "When an agent needs to extract book catalog records from ToScrape, DeepSeek v4.1 synthesizes a typed, tested Python connector in under four hundred milliseconds. "
        "The operation launches inside a disposable, air-gapped Vultr runner with zero network egress. "
        "It queries the target site through a protected proxy, extracts verified JSON records, and returns clean data without exposing a single session token."
    ),
    "voice_phase4": (
        "In Challenge One, Latch demonstrates deterministic containment against live hostile exploits in our Attack Lab. "
        "Watch our kernel-enforced sandboxing in action: prompt-injected secret exfiltration attempts fail because the environment is stripped clean. "
        "Outbound command-and-control requests are dropped at the packet level. "
        "Fork bomb attacks are halted by a strict cgroup limit of one hundred twenty-eight processes. "
        "And root filesystem tampering is completely blocked. Every containment moment produces an immutable cryptographic proof."
    ),
    "voice_phase5": (
        "Back on the live platform, operators can browse verified connectors for Algolia, Luma, Partiful, and ToScrape, or generate custom integrations on the fly. "
        "Every single execution outputs a canonical SHA-256 receipt stored directly in Vultr S3. "
        "And whenever an agent requests a sensitive state mutation, our human-in-the-loop operator gate halts execution until explicitly approved."
    ),
    "voice_phase6": (
        "Latch proves that autonomous AI agents can be fast, capable, and completely contained. "
        "Try deterministic agent containment for yourself today on our live link, or explore the open-source codebase on GitHub. "
        "Built for the Vultr Cloud Hackathon. Thank you!"
    ),
}

OUT_DIR = Path("d:/skeleton_key-main/latch/remotion-video/public")
OUT_DIR.mkdir(parents=True, exist_ok=True)

async def main():
    durations = {}
    print("Generating energetic neural voice tracks...")
    for key, text in SCRIPTS.items():
        mp3_path = OUT_DIR / f"{key}.mp3"
        wav_path = OUT_DIR / f"{key}.wav"
        
        comm = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
        await comm.save(str(mp3_path))
        
        # Convert MP3 to WAV using Python or keep MP3
        # Remotion handles MP3 directly and flawlessly with <Audio src={staticFile("...mp3")} />
        # Let's also check duration using mutagen or wave/ffprobe
        import mutagen.mp3
        audio = mutagen.mp3.MP3(str(mp3_path))
        dur_sec = audio.info.length
        frames = int((dur_sec + 2.0) * 30)  # Add 2 seconds padding for breathing room
        durations[key] = (dur_sec, frames)
        print(f"Generated {key}.mp3: {dur_sec:.2f}s -> {frames} frames at 30fps")

    print("\nSummary of durations:")
    total_frames = sum(f for _, f in durations.values())
    print(f"Total video frames: {total_frames} ({total_frames/30:.1f}s / {total_frames/1800:.2f} mins)")

if __name__ == "__main__":
    asyncio.run(main())

