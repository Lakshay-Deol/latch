"""Generate voiceover audio files and subtle UI sound effects for Remotion video."""
import math
import os
import pathlib
import struct
import wave
import win32com.client

PUBLIC = pathlib.Path(__file__).resolve().parent / "public"
PUBLIC.mkdir(exist_ok=True)

# 1. Voiceover narration scripts for each phase
VOICEOVERS = {
    "voice_phase1.wav": (
        "Welcome to Latch. As autonomous AI agents transition from text chat to executing real shell commands "
        "and automating browsers, conventional architectures grant them dangerous, uncontained access. "
        "A single prompt injection can steal cloud credentials, spawn infinite fork bombs, or corrupt critical databases. "
        "At Latch, containment is not just a feature. It is the product."
    ),
    "voice_phase2.wav": (
        "Latch is built ground up on Vultr Cloud infrastructure. "
        "Our control plane and air-gapped workers run on high-performance Vultr Cloud Compute at IP 155.138.217.237. "
        "We leverage Vultr Serverless Inference powered by DeepSeek v4.1 for autonomous task planning and code synthesis. "
        "And all published APIs, OpenAPI specs, and cryptographic execution receipts are durably stored across our dedicated "
        "Vultr Object Storage buckets in Atlanta."
    ),
    "voice_phase3.wav": (
        "Instead of fragile visual clicking and DOM scraping that breaks on UI shifts, "
        "DeepSeek v4.1 on Vultr Serverless Inference explores web applications inside an isolated container "
        "and synthesizes clean, typed Python operations. "
        "User session cookies never touch agent prompt context. "
        "Agents interact strictly through scoped Bearer tokens, while irreversible writes are halted "
        "at the human-in-the-loop Operator Gate until explicitly approved."
    ),
    "voice_phase4.wav": (
        "In Challenge 1, Latch demonstrates deterministic containment moments against live attack vectors. "
        "When an agent attempts to exfiltrate secrets via the environment, reading /proc/1/environ returns empty. "
        "When rogue code attempts command and control egress, packets are dropped at the kernel level by network mode none. "
        "And when a runaway loop spawns a fork bomb, cgroup limits halt process creation at 128 PIDs, keeping the host VM completely safe."
    ),
    "voice_phase5.wav": (
        "Every single execution on Latch produces an immutable, cryptographically signed SHA-256 receipt. "
        "Whether querying books on toscrape.com, searching real-time stories on hn.algolia.com, or scheduling events on luma.com, "
        "the agent receives clean verified JSON data while the proof is logged to Vultr S3 for instant auditability."
    ),
    "voice_phase6.wav": (
        "Latch is fully open source and deployed live on Vultr at 155.138.217.237. "
        "With 13 passing automated security tests, zero plain secrets, and kernel-hardened isolation, "
        "Latch provides the deterministic containment foundation needed for production AI agents. "
        "Experience Latch live today."
    )
}

def make_voiceovers():
    speaker = win32com.client.Dispatch("SAPI.SpVoice")
    # Use English voice (prefer David or Zira)
    speaker.Rate = 0  # Natural speed
    speaker.Volume = 100

    durations = {}
    for filename, text in VOICEOVERS.items():
        filepath = str(PUBLIC / filename)
        stream = win32com.client.Dispatch("SAPI.SpFileStream")
        stream.Open(filepath, 3)  # 3 = SSFMCreateForWrite
        speaker.AudioOutputStream = stream
        speaker.Speak(text)
        stream.Close()
        
        # Get duration
        with wave.open(filepath, "r") as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            dur = frames / float(rate)
            durations[filename] = dur
            print(f"Generated {filename}: {dur:.2f}s ({frames} frames)")
            
    return durations

# 2. Generate subtle modern UI sound effects (sine/frequency sweeps)
def create_sfx(filename, duration, freq_func, volume=0.25):
    sample_rate = 44100
    n_samples = int(sample_rate * duration)
    filepath = str(PUBLIC / filename)
    with wave.open(filepath, "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        raw_data = bytearray()
        for i in range(n_samples):
            t = float(i) / sample_rate
            freq = freq_func(t, duration)
            # Smooth attack and decay envelope
            envelope = math.sin(math.pi * (t / duration)) ** 1.5
            val = int(volume * 32767.0 * envelope * math.sin(2.0 * math.pi * freq * t))
            val = max(-32768, min(32767, val))
            raw_data.extend(struct.pack("<h", val))
        wav_file.writeframes(raw_data)
    print(f"Generated SFX: {filename}")

def make_sound_effects():
    # Whoosh transition: pitch drops from 600Hz to 180Hz
    create_sfx("whoosh.wav", 0.45, lambda t, d: 600 - (420 * (t / d)), volume=0.2)
    # Shield activation: rising resonance 220Hz to 880Hz
    create_sfx("shield_on.wav", 0.6, lambda t, d: 220 + (660 * (t / d)), volume=0.25)
    # Success chime: bright harmonic 880Hz
    create_sfx("chime.wav", 0.5, lambda t, d: 880 + (40 * math.sin(20 * t)), volume=0.25)
    # Digital click: short blip 1200Hz
    create_sfx("click.wav", 0.08, lambda t, d: 1200, volume=0.15)

if __name__ == "__main__":
    durs = make_voiceovers()
    make_sound_effects()
    print("All audio generated successfully!")

