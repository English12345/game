// ===========================================================
//  AUDIO ENGINE
//  Semua efek suara di-generate langsung lewat Web Audio API
//  (oscillator + noise sintesis), TIDAK memakai sample/file
//  eksternal apa pun -> 100% aman untuk monetisasi YouTube.
// ===========================================================
class SfxEngine {
  constructor(){
    this.ctx = null;
    this.master = null;
    this._unlocked = false;
  }

  _ensureCtx(){
    if(this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = CONFIG.SFX_MASTER_VOLUME;
    this.master.connect(this.ctx.destination);
  }

  unlock(){
    this._ensureCtx();
    if(this.ctx.state === 'suspended') this.ctx.resume();
    this._unlocked = true;
  }

  _env(gainNode, t0, attack, sustain, decay, peak){
    gainNode.gain.cancelScheduledValues(t0);
    gainNode.gain.setValueAtTime(0.0001, t0);
    gainNode.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(peak*0.5,0.0001), t0 + attack + sustain);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + sustain + decay);
  }

  // Soft pop when a ball drops / lands
  drop(pitch=1){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260*pitch, t);
    osc.frequency.exponentialRampToValueAtTime(120*pitch, t+0.12);
    this._env(gain, t, 0.005, 0.05, 0.12, 0.5);
    osc.connect(gain).connect(this.master);
    osc.start(t); osc.stop(t+0.2);
  }

  // Satisfying "merge" chime, pitch rises with tier
  merge(tier=0){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    const base = 320 + tier*46;
    [1, 1.5, 2].forEach((mult,i)=>{
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i===0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(base*mult, t);
      osc.frequency.exponentialRampToValueAtTime(base*mult*1.6, t+0.18);
      this._env(gain, t + i*0.02, 0.008, 0.09, 0.22, 0.35/(i+1));
      osc.connect(gain).connect(this.master);
      osc.start(t); osc.stop(t+0.4);
    });
  }

  // Rising combo stinger
  combo(streak=1){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    for(let i=0;i<Math.min(streak,5);i++){
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const f = 440 * Math.pow(1.15, i);
      osc.frequency.setValueAtTime(f, t + i*0.06);
      this._env(gain, t + i*0.06, 0.004, 0.05, 0.15, 0.3);
      osc.connect(gain).connect(this.master);
      osc.start(t + i*0.06); osc.stop(t + i*0.06 + 0.25);
    }
  }

  // Soft wall/floor thud
  thud(){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++){
      data[i] = (Math.random()*2-1) * Math.pow(1 - i/bufferSize, 3);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.18;
    noise.connect(filter).connect(gain).connect(this.master);
    noise.start(t);
  }

  // Whoosh + reset for game-over / board clear
  reset(){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(60, t+0.6);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t+0.6);
    this._env(gain, t, 0.02, 0.3, 0.35, 0.35);
    osc.connect(filter).connect(gain).connect(this.master);
    osc.start(t); osc.stop(t+0.7);
  }
}

const sfx = new SfxEngine();
