import { WeaponID } from '../types';

let audioCtx: AudioContext | null = null;
let engineOscillator: OscillatorNode | null = null;
let engineGain: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate procedurally filtered white noise for explosions
function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

let isMuted = typeof window !== 'undefined' ? localStorage.getItem('asteroid_game_muted') === 'true' : false;

export const playSound = {
  getMuted: () => isMuted,
  setMuted: (val: boolean) => {
    isMuted = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('asteroid_game_muted', String(val));
    }
    if (isMuted) {
      playSound.stopEngine();
    } else {
      playSound.startEngine();
    }
  },

  laser: (type: WeaponID) => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      if (type === WeaponID.PLASMA_LASER) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === WeaponID.PROTON_TORPEDO) {
        // Deep charging boom
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.setValueAtTime(0.5, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === WeaponID.ION_BEAM) {
        // Continuous beam chirp/zap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(1100, now + 0.05);

        // Quick hum
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.06);

        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === WeaponID.FLAK_CANNON) {
        // Spread burst click/crack
        const osc = ctx.createOscillator();
        const noise = ctx.createBufferSource();
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();

        noise.buffer = createNoiseBuffer(ctx);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1000, now);
        noiseFilter.frequency.linearRampToValueAtTime(300, now + 0.12);

        noiseGain.gain.setValueAtTime(0.35, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        // Core visual pop
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        const oscGain = ctx.createGain();
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        oscGain.gain.setValueAtTime(0.15, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        noise.start(now);
        osc.start(now);

        noise.stop(now + 0.12);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  },

  explosion: (isHeavy: boolean = false) => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Low rumble
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(20, now + (isHeavy ? 1.0 : 0.5));

      oscGain.gain.setValueAtTime(isHeavy ? 0.4 : 0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + (isHeavy ? 1.0 : 0.5));

      osc.start(now);
      osc.stop(now + (isHeavy ? 1.0 : 0.5));

      // White noise blast
      const noiseSource = ctx.createBufferSource();
      const noiseFilter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();

      noiseSource.buffer = createNoiseBuffer(ctx);
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(isHeavy ? 400 : 700, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(40, now + (isHeavy ? 1.2 : 0.6));

      noiseGain.gain.setValueAtTime(isHeavy ? 0.5 : 0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.02, now + (isHeavy ? 1.2 : 0.6));

      noiseSource.start(now);
      noiseSource.stop(now + (isHeavy ? 1.2 : 0.6));
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  },

  shieldHit: () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.3);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(650, now);
      osc2.frequency.exponentialRampToValueAtTime(150, now + 0.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  },

  warp: () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 1.2);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(100, now);
      filter.frequency.exponentialRampToValueAtTime(2500, now + 1.2);
      filter.Q.setValueAtTime(4, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

      osc.start(now);
      osc.stop(now + 1.6);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  },

  upgrade: () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const notes = [440, 554.37, 659.25, 880]; // A Major arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.15, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.25);
      });
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  },

  alarm: () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Beep tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(780, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  },

  overdriveReady: () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.45);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  },

  overdriveFire: () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const timeOffset = i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200 - i * 150, now + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(150, now + timeOffset + 0.25);
        gain.gain.setValueAtTime(0.25, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + 0.25);
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.25);
      }
    } catch (e) {}
  },

  startEngine: () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      if (engineOscillator) return; // already running

      engineOscillator = ctx.createOscillator();
      engineGain = ctx.createGain();

      engineOscillator.type = 'triangle';
      engineOscillator.frequency.value = 55; // Low power rumble

      // Add minor low frequency oscillator for rumble pulsation
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 6; // 6 Hz pulsation
      lfoGain.gain.value = 8; // oscillate frequency back and forth by 8 Hz

      lfo.connect(lfoGain);
      lfoGain.connect(engineOscillator.frequency);

      engineOscillator.connect(engineGain);
      engineGain.connect(ctx.destination);

      engineGain.gain.setValueAtTime(0.06, now);

      lfo.start(now);
      engineOscillator.start(now);
    } catch (e) {
      console.warn('Engine audio launch failed', e);
    }
  },

  updateEnginePitch: (warpFactor: number) => {
    if (isMuted) return;
    try {
      if (engineOscillator && engineGain) {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        // Map warp factor to pitch & volume
        engineOscillator.frequency.setTargetAtTime(55 * warpFactor, now, 0.2);
        engineGain.gain.setTargetAtTime(0.06 + Math.min(0.05, warpFactor * 0.01), now, 0.2);
      }
    } catch (e) {
      // ignore
    }
  },

  stopEngine: () => {
    try {
      if (engineOscillator) {
        engineOscillator.stop();
        engineOscillator.disconnect();
        engineOscillator = null;
      }
      if (engineGain) {
        engineGain.disconnect();
        engineGain = null;
      }
    } catch (e) {
      // ignore
    }
  }
};
