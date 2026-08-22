// ===========================================================
//  PHYSICS — simulasi bola sederhana (gravity + collision)
//  Ditulis dari nol, ringan, cukup untuk gameplay "merge orbs".
// ===========================================================

const TIER_COLORS = [
  ['#8fd8ff', '#2f8fd6'], // tier 0
  ['#9dffd0', '#22b876'], // tier 1
  ['#ffe08a', '#d69a1f'], // tier 2
  ['#ffb2e0', '#d1439c'], // tier 3
  ['#c6a6ff', '#7c4fd6'], // tier 4
  ['#ff9d9d', '#d43e3e'], // tier 5
  ['#ffd27a', '#e08a1c'], // tier 6
  ['#a6f5ff', '#22b7c9'], // tier 7
  ['#ffffff', '#ffcc66'], // tier 8 (max, golden)
];

function radiusForTier(tier){
  return CONFIG.BASE_RADIUS * Math.pow(CONFIG.RADIUS_GROWTH, tier);
}

let _ballId = 0;

class Ball {
  constructor(x, y, tier){
    this.id = ++_ballId;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.tier = tier;
    this.r = radiusForTier(tier);
    this.settledSince = null;
    this.merging = false;
    this.scaleFx = 1; // for merge pop animation
  }
}

class World {
  constructor(w, h){
    this.w = w; this.h = h;
    this.balls = [];
  }

  spawnAt(x, tier){
    const r = radiusForTier(tier);
    const cx = Math.min(Math.max(x, r+2), this.w - r - 2);
    const b = new Ball(cx, r+2, tier);
    this.balls.push(b);
    return b;
  }

  step(onMerge, onWallHit){
    const g = CONFIG.GRAVITY;
    const damp = CONFIG.BOUNCE_DAMPING;
    const fric = CONFIG.FRICTION;

    // integrate
    for(const b of this.balls){
      if(b.merging) continue;
      b.vy += g;
      b.vx *= fric;
      b.x += b.vx;
      b.y += b.vy;

      // walls
      if(b.x - b.r < 0){ b.x = b.r; b.vx *= -damp; }
      if(b.x + b.r > this.w){ b.x = this.w - b.r; b.vx *= -damp; }
      if(b.y + b.r > this.h){
        if(Math.abs(b.vy) > 2 && onWallHit) onWallHit(b);
        b.y = this.h - b.r; b.vy *= -damp;
      }
      if(b.y - b.r < 0){ b.y = b.r; b.vy *= -damp; }

      // settle tracking (for game-over detection)
      const slow = Math.abs(b.vx) < 0.15 && Math.abs(b.vy) < 0.15;
      if(slow){
        if(b.settledSince === null) b.settledSince = performance.now();
      }else{
        b.settledSince = null;
      }

      // ease scale fx back to 1
      if(b.scaleFx !== 1){
        b.scaleFx += (1 - b.scaleFx) * 0.25;
        if(Math.abs(b.scaleFx-1) < 0.01) b.scaleFx = 1;
      }
    }

    // collisions (O(n^2), fine for the ball counts here)
    const n = this.balls.length;
    const toMerge = [];
    for(let i=0;i<n;i++){
      const a = this.balls[i];
      if(a.merging) continue;
      for(let j=i+1;j<n;j++){
        const b = this.balls[j];
        if(b.merging) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.r + b.r;
        if(dist < minDist && dist > 0.0001){
          if(a.tier === b.tier && a.tier < CONFIG.TIER_COUNT - 1){
            toMerge.push([a, b]);
            continue;
          }
          // positional correction (push apart)
          const overlap = (minDist - dist) / 2;
          const nx = dx/dist, ny = dy/dist;
          a.x -= nx*overlap; a.y -= ny*overlap;
          b.x += nx*overlap; b.y += ny*overlap;

          // simple velocity exchange along normal
          const avn = a.vx*nx + a.vy*ny;
          const bvn = b.vx*nx + b.vy*ny;
          const diff = (bvn - avn) * 0.5;
          a.vx += nx*diff; a.vy += ny*diff;
          b.vx -= nx*diff; b.vy -= ny*diff;
        }
      }
    }

    const mergedIds = new Set();
    for(const [a,b] of toMerge){
      if(mergedIds.has(a.id) || mergedIds.has(b.id)) continue;
      mergedIds.add(a.id); mergedIds.add(b.id);
      a.merging = true; b.merging = true;
      const nx = (a.x + b.x)/2, ny = (a.y + b.y)/2;
      const newTier = a.tier + 1;
      this.balls = this.balls.filter(ball => ball.id !== a.id && ball.id !== b.id);
      const nb = this.spawnMerged(nx, ny, newTier);
      if(onMerge) onMerge(nb, (a.x+b.x)/2, (a.y+b.y)/2);
    }
  }

  spawnMerged(x, y, tier){
    const b = new Ball(x, y, tier);
    b.scaleFx = 0.5; // pop-in animation
    this.balls.push(b);
    return b;
  }

  highestSettledAbove(lineY, holdMs){
    const now = performance.now();
    for(const b of this.balls){
      if(b.y - b.r < lineY && b.settledSince !== null && (now - b.settledSince) > holdMs){
        return true;
      }
    }
    return false;
  }

  clearAll(){
    this.balls = [];
  }
}
