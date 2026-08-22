// ===========================================================
//  BACKGROUND — starfield ambient halus, murni digambar
//  dengan canvas (tidak pakai gambar/aset eksternal).
// ===========================================================
class Starfield {
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.resize();
    window.addEventListener('resize', ()=> this.resize());
  }

  resize(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.w = rect.width; this.h = rect.height;

    const count = Math.floor((this.w*this.h)/9000);
    this.stars = Array.from({length: count}, ()=> ({
      x: Math.random()*this.w,
      y: Math.random()*this.h,
      r: Math.random()*1.4 + 0.3,
      s: Math.random()*0.6 + 0.2,
      phase: Math.random()*Math.PI*2,
    }));
  }

  draw(t){
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.w,this.h);
    for(const st of this.stars){
      const tw = 0.5 + 0.5*Math.sin(t*0.001*st.s + st.phase);
      ctx.globalAlpha = 0.15 + tw*0.55;
      ctx.fillStyle = '#cdd3ff';
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
