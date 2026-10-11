export const playScanBeep = (success: boolean = true) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = success ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(success ? 1400 : 320, audioCtx.currentTime);
    if (success) {
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.06);
    }
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + (success ? 0.09 : 0.22));

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + (success ? 0.09 : 0.22));
  } catch {
    // Audio Context might be restricted before user interaction
  }
};
