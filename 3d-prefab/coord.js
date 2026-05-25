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
// parsers : parseCoord / requireDomain
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
