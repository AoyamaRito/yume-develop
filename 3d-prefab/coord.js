// coord.js — A11 Domain-Tagged Coordinates の実装。
//
// すべての coord 値は domain 接頭辞付き string で表現する:
//   "world:5,0,2" / "local:0,1,0" / "screen:300,200" / "ortho:0.7,0.85"
//
// 性能が必要なとき、`REAL_TAGS_ON` を false に設定することで、
// 文字列タグなしの生の数値配列（TWIN変数）として高速パスを走行できる。
// TWINはSHADOW（派生値）ではなく、同じ論理計算を共有するもう一つの真のREALである。
//
// builders: w / l / s / o
// parsers : parseCoord / requireDomain / equal
// structures: TwinQueue / TwinStack
//
// pure / Zero-Dep / crystallize 整合(Go の string ↔ struct と 1:1)。

export let REAL_TAGS_ON = true;

export function setRealTagsOn(val) {
  REAL_TAGS_ON = val;
}

export const w = (...v) => REAL_TAGS_ON ? `world:${v.join(',')}` : v;
export const l = (...v) => REAL_TAGS_ON ? `local:${v.join(',')}` : v;
export const s = (...v) => REAL_TAGS_ON ? `screen:${v.join(',')}` : v;
export const o = (...v) => REAL_TAGS_ON ? `ortho:${v.join(',')}` : v;

export function parseCoord(str) {
  if (!REAL_TAGS_ON && Array.isArray(str)) {
    return { domain: 'world', values: str };
  }
  if (typeof str !== 'string') {
    throw new Error(`coord must be string, got ${typeof str}`);
  }
  const idx = str.indexOf(':');
  if (idx < 0) throw new Error(`coord missing domain prefix: "${str}"`);
  const domain = str.slice(0, idx);
  const parts = str.slice(idx + 1).split(',');
  const values = parts.map(Number);
  if (values.some(Number.isNaN)) {
    throw new Error(`coord parse failed: "${str}"`);
  }
  return { domain, values };
}

export function requireDomain(str, expected) {
  if (!REAL_TAGS_ON && Array.isArray(str)) {
    return str; // 高速パス：文字列パースを完全スキップ
  }
  const c = parseCoord(str);
  if (c.domain !== expected) {
    throw new Error(`coord domain mismatch: expected "${expected}", got "${c.domain}" in "${str}"`);
  }
  return c.values;
}

// builders は array でも受け取れる(便利、入力境界用)
export const wArr = (arr) => w(...arr);
export const lArr = (arr) => l(...arr);

// === equal 関数 ===
// 2つの座標値（またはタグ付き文字列）を比較する
export function equal(a, b) {
  if (a === b) return true;
  const aIsArr = Array.isArray(a);
  const bIsArr = Array.isArray(b);
  if (aIsArr && bIsArr) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  if (aIsArr && typeof b === 'string') {
    try { return equal(a, parseCoord(b).values); } catch { return false; }
  }
  if (typeof a === 'string' && bIsArr) {
    try { return equal(parseCoord(a).values, b); } catch { return false; }
  }
  return false;
}

// === GCフリーな TWIN Queue (リングバッファ) ===
export class TwinQueue {
  constructor(capacity = 256) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  enqueue(item) {
    if (this.size >= this.capacity) throw new Error("Queue overflow");
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.size++;
  }

  dequeue() {
    if (this.size === 0) return undefined;
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined; // GCを助ける
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return item;
  }

  clear() {
    this.buffer.fill(undefined);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  // TWIN (リングバッファ) ➔ REAL_QUE (シリアライズ文字列)
  toRealString() {
    const items = [];
    let idx = this.head;
    for (let i = 0; i < this.size; i++) {
      const item = this.buffer[idx];
      if (Array.isArray(item)) {
        items.push(`world:${item.join(',')}`);
      } else {
        items.push(String(item));
      }
      idx = (idx + 1) % this.capacity;
    }
    return `queue:${items.join(';')}`;
  }

  // REAL_QUE (文字列) ➔ TWIN (リングバッファ)
  static fromRealString(str, capacity = 256) {
    const q = new TwinQueue(capacity);
    if (!str || typeof str !== 'string' || !str.startsWith('queue:')) return q;
    const body = str.slice(6);
    if (!body) return q;
    const parts = body.split(';');
    for (const part of parts) {
      if (!part) continue;
      if (!REAL_TAGS_ON) {
        if (part.includes(':')) {
          const idx = part.indexOf(':');
          const vals = part.slice(idx + 1).split(',').map(Number);
          q.enqueue(vals);
        } else {
          if (part.includes(',')) {
            q.enqueue(part.split(',').map(Number));
          } else {
            q.enqueue(part);
          }
        }
      } else {
        q.enqueue(part);
      }
    }
    return q;
  }
}

// === GCフリーな TWIN Stack ===
export class TwinStack {
  constructor(capacity = 256) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
    this.top = 0;
  }

  push(item) {
    if (this.top >= this.capacity) throw new Error("Stack overflow");
    this.buffer[this.top++] = item;
  }

  pop() {
    if (this.top === 0) return undefined;
    const item = this.buffer[--this.top];
    this.buffer[this.top] = undefined; // GCを助ける
    return item;
  }

  isEmpty() {
    return this.top === 0;
  }

  clear() {
    this.buffer.fill(undefined);
    this.top = 0;
  }

  // TWIN (配列) ➔ REAL_STACK (シリアライズ文字列)
  toRealString() {
    const items = [];
    for (let i = 0; i < this.top; i++) {
      const item = this.buffer[i];
      if (Array.isArray(item)) {
        items.push(`world:${item.join(',')}`);
      } else {
        items.push(String(item));
      }
    }
    return `stack:${items.join(';')}`;
  }

  // REAL_STACK (文字列) ➔ TWIN (配列)
  static fromRealString(str, capacity = 256) {
    const s = new TwinStack(capacity);
    if (!str || typeof str !== 'string' || !str.startsWith('stack:')) return s;
    const body = str.slice(6);
    if (!body) return s;
    const parts = body.split(';');
    for (const part of parts) {
      if (!part) continue;
      if (!REAL_TAGS_ON) {
        if (part.includes(':')) {
          const idx = part.indexOf(':');
          const vals = part.slice(idx + 1).split(',').map(Number);
          s.push(vals);
        } else {
          if (part.includes(',')) {
            s.push(part.split(',').map(Number));
          } else {
            s.push(part);
          }
        }
      } else {
        s.push(part);
      }
    }
    return s;
  }
}
