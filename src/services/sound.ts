/**
 * Web Audio API synthesizer for realistic truck engine, air brakes, horn, rain and alerts.
 * Fully procedural - zero external audio assets required.
 */

class TruckAudioEngine {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(muted ? 0 : 0.18, this.ctx.currentTime);
    }
  }

  public startEngine() {
    if (this.isEngineRunning || this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(42, this.ctx.currentTime); // Low idle RPM rumble

      this.engineSubOsc.type = 'triangle';
      this.engineSubOsc.frequency.setValueAtTime(28, this.ctx.currentTime); // Deep V8 bass

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(260, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.engineSubOsc.start();
      this.isEngineRunning = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      }
      if (this.engineSubOsc) {
        this.engineSubOsc.stop();
        this.engineSubOsc.disconnect();
      }
    } catch {
      // Ignored
    }
    this.isEngineRunning = false;
  }

  public updateEngineRPM(rpmPercent: number) { // 0.0 to 1.0
    if (!this.isEngineRunning || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const baseFreq = 42 + rpmPercent * 88; // 42Hz idle to ~130Hz high rev
    const filterFreq = 260 + rpmPercent * 550;

    if (this.engineOsc) {
      this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.08);
    }
    if (this.engineSubOsc) {
      this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.65, now, 0.08);
    }
    if (this.engineFilter) {
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
    }
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0.15 + rpmPercent * 0.12, now, 0.08);
    }
  }

  public playAirBrake() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      // Procedural pneumatic air brake hiss using white noise burst
      const bufferSize = this.ctx.sampleRate * 0.45;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Audio context error
    }
  }

  public playHorn() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Dual-tone heavy European truck air horn
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(185, now); // F#3
      osc2.frequency.setValueAtTime(233, now); // Bb3 (classic freight horn chord)

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);
    } catch {
      // Error
    }
  }

  public playTurnSignal() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Error
    }
  }

  public playCrash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.6;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // Error
    }
  }

  public playRadarFine() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.setValueAtTime(650, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Error
    }
  }

  public playCashPayout() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + idx * 0.09;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {
      // Error
    }
  }

  public setRain(active: boolean) {
    if (this.isMuted || !active) {
      if (this.rainSource) {
        try {
          this.rainSource.stop();
          this.rainSource.disconnect();
        } catch {
          // Ignored
        }
        this.rainSource = null;
      }
      return;
    }

    if (this.rainSource) return; // Already running
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }

      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = buffer;
      this.rainSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.rainSource.connect(filter);
      filter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);

      this.rainSource.start();
    } catch {
      // Error
    }
  }
}

export const truckAudio = new TruckAudioEngine();
