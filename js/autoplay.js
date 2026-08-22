// ===========================================================
//  AUTOPLAY AI
//  Game ini dimainkan otomatis (cocok untuk live streaming
//  non-stop) — AI memilih posisi jatuh yang paling mungkin
//  menghasilkan merge biar terlihat "satisfying" & rapi.
// ===========================================================

function weightedRandomTier(){
  const weights = CONFIG.SPAWN_WEIGHTS;
  const total = weights.reduce((a,b)=>a+b,0);
  let r = Math.random() * total;
  for(let i=0;i<weights.length;i++){
    if(r < weights[i]) return i;
    r -= weights[i];
  }
  return 0;
}

class AutoplayAI {
  constructor(world){
    this.world = world;
    this.nextTier = weightedRandomTier();
  }

  peekNextTier(){
    return this.nextTier;
  }

  rollNextTier(){
    this.nextTier = weightedRandomTier();
  }

  // Cari posisi x terbaik untuk drop supaya kemungkinan besar merge
  chooseDropX(radius){
    const w = this.world.w;
    const balls = this.world.balls;
    const margin = radius + 4;

    // 1) cari bola dengan tier sama yang "kesepian" (tidak sedang menempel
    //    dengan bola tier sama lain) -> jatuhkan di dekatnya
    const sameTier = balls.filter(b => b.tier === this.nextTier && !b.merging);
    if(sameTier.length > 0){
      // pilih yang paling tinggi (y terkecil, paling gampang dijangkau drop)
      sameTier.sort((a,b)=> a.y - b.y);
      const target = sameTier[Math.floor(Math.random()*Math.min(3,sameTier.length))];
      const jitter = (Math.random()-0.5) * radius * 0.6;
      return clamp(target.x + jitter, margin, w - margin);
    }

    // 2) tidak ada kandidat -> jatuhkan di kolom yang paling "rendah" tumpukannya
    const columns = 6;
    const colWidth = w / columns;
    const heights = new Array(columns).fill(this.world.h);
    for(const b of balls){
      const col = clamp(Math.floor(b.x / colWidth), 0, columns-1);
      heights[col] = Math.min(heights[col], b.y - b.r);
    }
    let bestCol = 0, bestHeight = -Infinity;
    heights.forEach((h,i)=>{ if(h > bestHeight){ bestHeight = h; bestCol = i; } });
    const x = (bestCol + 0.5) * colWidth + (Math.random()-0.5) * colWidth * 0.4;
    return clamp(x, margin, w - margin);
  }
}

function clamp(v, min, max){
  return Math.min(Math.max(v, min), max);
}
