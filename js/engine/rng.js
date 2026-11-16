// Kleiner, schneller und reproduzierbarer Zufallsgenerator (mulberry32).
export function createRng(seed) {
  let s = (seed >>> 0) || 0x9e3779b9;
  return {
    next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(n) {
      return Math.floor(this.next() * n);
    },
  };
}

export function randomSeed() {
  return (Math.random() * 0xffffffff) >>> 0;
}
