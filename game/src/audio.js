// Thanksgiving Heist — synthesized sound: no audio files, all WebAudio.
// One job: every beep, gobble, alarm and fanfare the game plays.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, vol, when, slideTo) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  pickup() {
    this.tone(660, 0.09, 'sine', 0.14);
    this.tone(990, 0.14, 'sine', 0.14, 0.07);
  }

  key() {
    this.tone(523, 0.1, 'triangle', 0.16);
    this.tone(659, 0.1, 'triangle', 0.16, 0.09);
    this.tone(784, 0.18, 'triangle', 0.16, 0.18);
  }

  spotted() {
    // Two-note alarm: the farmer saw you.
    this.tone(440, 0.12, 'square', 0.1);
    this.tone(587, 0.12, 'square', 0.1, 0.12);
    this.tone(440, 0.12, 'square', 0.1, 0.24);
  }

  gobble() {
    // The turkey's own nervous gobble: fast low blips.
    for (let i = 0; i < 4; i++) {
      this.tone(300 - i * 25, 0.07, 'sawtooth', 0.07, i * 0.07, 180);
    }
  }

  hurt() {
    this.tone(320, 0.3, 'sawtooth', 0.14, 0, 110);
  }

  door() {
    this.tone(392, 0.12, 'triangle', 0.13);
    this.tone(523, 0.2, 'triangle', 0.13, 0.1);
  }

  win() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((n, i) => this.tone(n, 0.22, 'triangle', 0.15, i * 0.13));
  }

  lose() {
    const notes = [392, 330, 262, 196];
    notes.forEach((n, i) => this.tone(n, 0.3, 'sawtooth', 0.09, i * 0.18));
  }

  click() {
    this.tone(800, 0.05, 'square', 0.06);
  }

  startMusic() {
    // A slow, sleepy autumn loop: low triangle arpeggio, quiet, every bar.
    if (this.musicTimer) return;
    const notes = [262, 330, 392, 330];
    let i = 0;
    const step = () => {
      if (this.muted) return;
      this.tone(notes[i % 4], 0.5, 'triangle', 0.035);
      i += 1;
    };
    step();
    this.musicTimer = setInterval(step, 520);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
