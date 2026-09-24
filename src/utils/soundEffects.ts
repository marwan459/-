// Web Audio API ambient & interaction sounds
class SoundController {
  private ctx: AudioContext | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private heartbeatTimer: number | null = null;
  private currentMode: string = 'off';

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a soft bubble message pop
  playMessageSent() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Play a soft sensual whisper chime
  playWhisperChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C Major warmth
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + idx * 0.06 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.06);
        osc.stop(this.ctx.currentTime + idx * 0.06 + 0.65);
      });
    } catch {}
  }

  // Play dice roll click effect
  playDiceRoll() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      for (let i = 0; i < 6; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200 + Math.random() * 300, this.ctx.currentTime + i * 0.05);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.05 + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.05);
        osc.stop(this.ctx.currentTime + i * 0.05 + 0.05);
      }
    } catch {}
  }

  // Set ambient atmosphere
  setAmbientMode(mode: 'off' | 'heartbeat' | 'soft_melodic') {
    this.stopAmbient();
    this.currentMode = mode;
    if (mode === 'off') return;

    this.initCtx();
    if (!this.ctx) return;

    if (mode === 'soft_melodic') {
      try {
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        masterGain.connect(this.ctx.destination);
        this.ambientGain = masterGain;

        // Warm chord frequencies (F minor romantic warmth)
        const chord = [174.61, 220.00, 261.63, 349.23];
        this.ambientOscillators = chord.map(freq => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
          osc.connect(masterGain);
          osc.start();
          return osc;
        });
      } catch {}
    } else if (mode === 'heartbeat') {
      const beat = () => {
        if (this.currentMode !== 'heartbeat' || !this.ctx) return;
        try {
          // First thump
          const osc1 = this.ctx.createOscillator();
          const gain1 = this.ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(65, this.ctx.currentTime);
          osc1.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.12);

          gain1.gain.setValueAtTime(0.2, this.ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
          osc1.connect(gain1);
          gain1.connect(this.ctx.destination);
          osc1.start();
          osc1.stop(this.ctx.currentTime + 0.13);

          // Second thump after 180ms
          setTimeout(() => {
            if (this.currentMode !== 'heartbeat' || !this.ctx) return;
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(60, this.ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.14);

            gain2.gain.setValueAtTime(0.25, this.ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);
            osc2.start();
            osc2.stop(this.ctx.currentTime + 0.15);
          }, 180);
        } catch {}
      };

      beat();
      this.heartbeatTimer = window.setInterval(beat, 1100);
    }
  }

  stopAmbient() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      } catch {}
    }
    setTimeout(() => {
      this.ambientOscillators.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch {}
      });
      this.ambientOscillators = [];
      this.ambientGain = null;
    }, 350);
  }
}

export const soundFx = new SoundController();
