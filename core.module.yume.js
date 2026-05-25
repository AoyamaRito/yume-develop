// @yume-format: 1

export const __block = {
  "id": "ai-desk-core",
  "type": "module",
  "schemaVersion": 1,
  "runtime": {
    "name": "yume",
    "version": "002"
  },
  "api": [
    "commit",
    "history",
    "heavy",
    "heavyApply",
    "show",
    "diff",
    "rollback",
    "validate",
    "refs",
    "tags",
    "impact",
    "refsCheck",
    "noteAdd",
    "noteList",
    "notesSearch",
    "applyList",
    "applyShow",
    "applyIndex",
    "applySearch"
  ],
  "versions": [
    {
      "hash": "74f28695b4114c4d26a9bd947789ffa067c922f57c469f28f7168f3c9080b77a",
      "prevHash": null,
      "content": "// ai-desk-core.js\n// Pure domain logic for ai-desk v2 (Platform Agnostic)\n//\n// This file contains the core data structures and logic for Block-based \n// code management. It has ZERO dependencies on Node.js or any other runtime.\n// It can run in Browsers, Deno, Bun, or any standard JS environment.\n\n// ============================================================\n// Version — Block の状態スナップショット(これが REAL)\n// ============================================================\n\nexport function makeVersion({ content, refs = [], children = [], tags = [], meta = {} }, prev = null) {\n  const v = {\n    timestamp: Date.now(),\n    prevHash: prev ? prev.hash : null,\n    content,\n    refs,\n    children,\n    tags,\n    meta,\n  };\n  v.hash = hashVersion(v);\n  return v;\n}\n\n// refs / 配列の浅い比較(applyPatch の unchanged 判定用)\nexport function sameArr(a, b) {\n  if (a.length !== b.length) return false;\n  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;\n  return true;\n}\n\nexport function sameRefs(a, b) {\n  if (a.length !== b.length) return false;\n  const key = r => `${r.kind}:${r.target}`;\n  const aKeys = a.map(key).sort();\n  const bKeys = b.map(key).sort();\n  for (let i = 0; i < aKeys.length; i++) if (aKeys[i] !== bKeys[i]) return false;\n  return true;\n}\n\n// 軽量 FNV-1a 32bit。Zero-Dep。\nexport function hashVersion(v) {\n  const { hash, ...rest } = v;\n  const stable = JSON.stringify(rest, Object.keys(rest).sort());\n  let h = 0x811c9dc5;\n  for (let i = 0; i < stable.length; i++) {\n    h ^= stable.charCodeAt(i);\n    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;\n  }\n  return h.toString(16).padStart(8, '0');\n}\n\n// ============================================================\n// Block — versions の羅列が本体\n// ============================================================\n\nexport class Block {\n  constructor({ id, type, versions = [], meta = {} }) {\n    if (!id) throw new Error('Block requires id');\n    if (!type) throw new Error('Block requires type');\n    this.id = id;\n    this.type = type;\n    this.versions = versions;\n    this.meta = meta;\n  }\n\n  commit({ content = null, refs = [], children = [], tags = [], meta = {} } = {}) {\n    const prev = this.head();\n    const v = makeVersion({ content, refs, children, tags, meta }, prev);\n    this.versions.push(v);\n    return v;\n  }\n\n  head() {\n    return this.versions.length > 0 ? this.versions[this.versions.length - 1] : null;\n  }\n\n  at(timestamp) {\n    let result = null;\n    for (const v of this.versions) {\n      if (v.timestamp > timestamp) break;\n      result = v;\n    }\n    return result;\n  }\n\n  get content() { return this.head()?.content ?? null; }\n  get refs()    { return this.head()?.refs    ?? []; }\n  get children(){ return this.head()?.children?? []; }\n  get tags()    { return this.head()?.tags    ?? []; }\n\n  hasTag(tag) { return this.tags.includes(tag); }\n  hasAllTags(tags) { return tags.every(t => this.tags.includes(t)); }\n  hasAnyTag(tags) { return tags.some(t => this.tags.includes(t)); }\n\n  verify() {\n    for (let i = 0; i < this.versions.length; i++) {\n      const v = this.versions[i];\n      const expectedPrev = i === 0 ? null : this.versions[i - 1].hash;\n      if (v.prevHash !== expectedPrev) {\n        return { ok: false, brokenAt: i, reason: 'prevHash mismatch' };\n      }\n      if (v.hash !== hashVersion(v)) {\n        return { ok: false, brokenAt: i, reason: 'hash mismatch' };\n      }\n    }\n    return { ok: true };\n  }\n\n  diff(i, j) {\n    if (this.versions.length < 2) return null;\n    if (i == null) i = this.versions.length - 2;\n    if (j == null) j = this.versions.length - 1;\n    const a = this.versions[i];\n    const b = this.versions[j];\n    if (!a || !b) return null;\n    const refKey = r => `${r.kind}:${r.target}`;\n    const aRefs = new Set(a.refs.map(refKey));\n    const bRefs = new Set(b.refs.map(refKey));\n    return {\n      contentChanged: a.content !== b.content,\n      content: { from: a.content, to: b.content },\n      refsAdded: b.refs.filter(r => !aRefs.has(refKey(r))),\n      refsRemoved: a.refs.filter(r => !bRefs.has(refKey(r))),\n      tagsAdded: b.tags.filter(t => !a.tags.includes(t)),\n      tagsRemoved: a.tags.filter(t => !b.tags.includes(t)),\n      timeDelta: b.timestamp - a.timestamp,\n    };\n  }\n\n  blame(predicate) {\n    for (let i = 0; i < this.versions.length; i++) {\n      const v = this.versions[i];\n      if (predicate(v)) return { version: v, index: i };\n    }\n    return null;\n  }\n\n  blameRef(target, kind = null) {\n    return this.blame(v =>\n      v.refs.some(r => r.target === target && (kind == null || r.kind === kind))\n    );\n  }\n\n  applyPatch(content, opts = {}) {\n    const head = this.head();\n    if (head && head.content === content\n        && (opts.refs == null || sameRefs(opts.refs, head.refs))\n        && (opts.tags == null || sameArr(opts.tags, head.tags))) {\n      return { action: 'unchanged', block: this };\n    }\n    this.commit({\n      content,\n      refs: opts.refs ?? head?.refs ?? [],\n      children: opts.children ?? head?.children ?? [],\n      tags: opts.tags ?? head?.tags ?? [],\n      meta: { ...(head?.meta ?? {}), ...(opts.meta ?? {}), appliedAt: Date.now() },\n    });\n    return { action: head ? 'updated' : 'created', block: this };\n  }\n\n  rollback(versionIndex) {\n    const target = this.versions[versionIndex];\n    if (!target) throw new Error(`no such version: ${versionIndex}`);\n    return this.commit({\n      content: target.content,\n      refs: target.refs,\n      children: target.children,\n      tags: target.tags,\n      meta: { ...target.meta, rollbackFrom: target.hash, rollbackIndex: versionIndex },\n    });\n  }\n\n  toJSON() {\n    return { id: this.id, type: this.type, versions: this.versions, meta: this.meta };\n  }\n\n  static fromJSON(json) {\n    return new Block({\n      id: json.id,\n      type: json.type,\n      versions: json.versions || [],\n      meta: json.meta || {},\n    });\n  }\n}\n\n// ============================================================\n// Graph — Block の集合 + 双方向走査\n// ============================================================\n\nexport class Graph {\n  constructor(blocks = []) {\n    this.blocks = new Map();\n    for (const b of blocks) this.add(b);\n  }\n\n  add(block) {\n    if (!(block instanceof Block)) block = Block.fromJSON(block);\n    this.blocks.set(block.id, block);\n    return this;\n  }\n\n  get(id) { return this.blocks.get(id); }\n  has(id) { return this.blocks.has(id); }\n  remove(id) { return this.blocks.delete(id); }\n\n  ids() { return Array.from(this.blocks.keys()); }\n  all() { return Array.from(this.blocks.values()); }\n\n  byTag(tag)         { return this.all().filter(b => b.hasTag(tag)); }\n  byAllTags(tags)    { return this.all().filter(b => b.hasAllTags(tags)); }\n  byAnyTag(tags)     { return this.all().filter(b => b.hasAnyTag(tags)); }\n  byType(type)       { return this.all().filter(b => b.type === type); }\n\n  lint(opts = {}) {\n    const enable = key => opts[key] !== false;\n    const issues = [];\n    const ids = new Set(this.blocks.keys());\n\n    if (enable('broken')) {\n      for (const b of this.blocks.values()) {\n        for (const r of b.refs) {\n          if (r.kind === 'import') {\n            const isExternal = !r.target.startsWith('.') && !r.target.startsWith('/');\n            if (isExternal || r.target.startsWith('.')) continue;\n          }\n          if (!ids.has(r.target)) {\n            issues.push({ kind: 'broken-ref', from: b.id, ref: r });\n          }\n        }\n      }\n    }\n\n    if (enable('orphan')) {\n      for (const b of this.blocks.values()) {\n        if (b.type === 'module') continue;\n        if (this.backward(b.id).length === 0) {\n          issues.push({ kind: 'orphan', id: b.id, type: b.type });\n        }\n      }\n    }\n\n    if (enable('circular')) {\n      for (const b of this.blocks.values()) {\n        const cycle = this._findCycle(b.id);\n        if (cycle) issues.push({ kind: 'circular', cycle });\n      }\n    }\n\n    if (enable('brace')) {\n      for (const b of this.blocks.values()) {\n        if (!b.content) continue;\n        const r = checkBraces(b.content);\n        if (r) issues.push({ kind: 'brace-mismatch', id: b.id, ...r });\n      }\n    }\n\n    if (enable('calls')) {\n      const moduleNameMap = new Map();\n      for (const b of this.blocks.values()) {\n        if (!b.meta?.name) continue;\n        if (b.type !== 'function' && b.type !== 'class') continue;\n        const moduleId = b.id.split(':').slice(0, -2).join(':');\n        if (!moduleNameMap.has(moduleId)) moduleNameMap.set(moduleId, new Map());\n        moduleNameMap.get(moduleId).set(b.meta.name, b.id);\n      }\n      for (const b of this.blocks.values()) {\n        if (!b.content || !b.meta?.name) continue;\n        const moduleId = b.id.split(':').slice(0, -2).join(':');\n        const peers = moduleNameMap.get(moduleId);\n        if (!peers) continue;\n        const declared = new Set(b.refs.filter(r => r.kind === 'calls').map(r => r.target));\n        for (const [name, id] of peers) {\n          if (id === b.id) continue;\n          const re = new RegExp(`\\\\b${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\\\s*\\\\(`);\n          if (re.test(b.content) && !declared.has(id)) {\n            issues.push({ kind: 'calls-leak', from: b.id, missing: id, name });\n          }\n        }\n      }\n    }\n\n    if (enable('tags')) {\n      for (const b of this.blocks.values()) {\n        if (b.type === 'function' && !b.tags.includes('function')) {\n          issues.push({ kind: 'tag-mismatch', id: b.id, expected: 'function', actual: b.tags });\n        }\n        if (b.type === 'class' && !b.tags.includes('class')) {\n          issues.push({ kind: 'tag-mismatch', id: b.id, expected: 'class', actual: b.tags });\n        }\n      }\n    }\n\n    if (enable('empty')) {\n      for (const b of this.blocks.values()) {\n        if (b.type === 'module') continue;\n        if (!b.content && b.refs.length === 0 && b.children.length === 0) {\n          issues.push({ kind: 'empty-block', id: b.id });\n        }\n      }\n    }\n\n    if (enable('hash')) {\n      for (const b of this.blocks.values()) {\n        const r = b.verify();\n        if (!r.ok) {\n          issues.push({ kind: 'hash-broken', id: b.id, reason: r.reason, brokenAt: r.brokenAt });\n        }\n      }\n    }\n\n    return issues;\n  }\n\n  _findCycle(startId, path = [], localVisited = new Set()) {\n    if (path.includes(startId)) return [...path, startId].slice(path.indexOf(startId));\n    if (localVisited.has(startId)) return null;\n    localVisited.add(startId);\n    const next = this.forward(startId);\n    for (const b of next) {\n      const cycle = this._findCycle(b.id, [...path, startId], localVisited);\n      if (cycle) return cycle;\n    }\n    return null;\n  }\n\n  search(query, opts = {}) {\n    const { type = null, tag = null, includeOldVersions = false } = opts;\n    const re = query instanceof RegExp ? query : new RegExp(query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'));\n    const result = [];\n    for (const b of this.blocks.values()) {\n      if (type && b.type !== type) continue;\n      if (tag && !b.hasTag(tag)) continue;\n      if (includeOldVersions) {\n        for (let i = 0; i < b.versions.length; i++) {\n          if (b.versions[i].content && re.test(b.versions[i].content)) {\n            result.push({ block: b, versionIndex: i });\n          }\n        }\n      } else {\n        if (b.content && re.test(b.content)) {\n          result.push({ block: b, versionIndex: b.versions.length - 1 });\n        }\n      }\n    }\n    return result;\n  }\n\n  forward(id, kind = null) {\n    const b = this.blocks.get(id);\n    if (!b) return [];\n    return b.refs.filter(r => kind == null || r.kind === kind).map(r => this.blocks.get(r.target)).filter(x => x != null);\n  }\n\n  backward(id, kind = null) {\n    const result = [];\n    for (const b of this.blocks.values()) {\n      if (b.id === id) continue;\n      const hit = b.refs.some(r => r.target === id && (kind == null || r.kind === kind));\n      if (hit) result.push(b);\n    }\n    return result;\n  }\n\n  impact(id, kind = null, visited = new Set()) {\n    if (visited.has(id)) return [];\n    visited.add(id);\n    const direct = this.backward(id, kind);\n    const result = [...direct];\n    for (const b of direct) result.push(...this.impact(b.id, kind, visited));\n    return result;\n  }\n\n  at(timestamp) {\n    const snapshot = new Graph();\n    for (const b of this.blocks.values()) {\n      const v = b.at(timestamp);\n      if (v == null) continue;\n      const cloned = new Block({\n        id: b.id, type: b.type, meta: b.meta,\n        versions: b.versions.filter(x => x.timestamp <= timestamp),\n      });\n      snapshot.add(cloned);\n    }\n    return snapshot;\n  }\n\n  toJSON() { return Array.from(this.blocks.values()).map(b => b.toJSON()); }\n  static fromJSON(json) { return new Graph(json.map(Block.fromJSON)); }\n  verify() {\n    for (const b of this.blocks.values()) {\n      const r = b.verify();\n      if (!r.ok) return { ok: false, blockId: b.id, ...r };\n    }\n    return { ok: true };\n  }\n}\n\n// ============================================================\n// Parse — JS ソースから Block を抽出\n// ============================================================\n\nexport function parseJS(source, moduleId = 'mod') {\n  const blocks = [];\n  const moduleBlock = new Block({ id: moduleId, type: 'module', meta: { source: moduleId } });\n  const imports = [];\n  for (const m of source.matchAll(/(?:^|(?<=[;}]))\\s*import\\s+[^'\"]*['\"]([^'\"]+)['\"]/gm)) {\n    imports.push({ kind: 'import', target: m[1] });\n  }\n\n  for (const m of source.matchAll(/(?:^|(?<=[;}{]))\\s*(?:export\\s+(?:default\\s+)?)?(?:async\\s+)?function\\s*\\*?\\s+(\\w+)\\s*\\(/gm)) {\n    const name = m[1];\n    const bodyStart = findFunctionBody(source, m.index);\n    if (bodyStart < 0) continue;\n    const end = matchBrace(source, bodyStart);\n    const content = source.slice(m.index, end + 1);\n    const head = m[0];\n    const tags = ['function'];\n    if (/\\basync\\b/.test(head)) tags.push('async');\n    if (/\\bexport\\b/.test(head)) tags.push('export');\n    if (/function\\s*\\*/.test(head)) tags.push('generator');\n    tags.push(...extractInlineTags(source, m.index));\n    pushBlock(blocks, moduleId, 'function', name, content, tags);\n  }\n\n  for (const m of source.matchAll(/(?:^|(?<=[;}{]))\\s*(?:export\\s+)?(?:const|let|var)\\s+(\\w+)\\s*=\\s*(?:async\\s+)?\\([^)]*\\)\\s*=>\\s*\\{/gm)) {\n    const name = m[1];\n    const bodyStart = findFunctionBody(source, m.index);\n    if (bodyStart < 0) continue;\n    const end = matchBrace(source, bodyStart);\n    const content = source.slice(m.index, end + 1);\n    const head = m[0];\n    const tags = ['function', 'arrow'];\n    if (/\\basync\\b/.test(head)) tags.push('async');\n    if (/\\bexport\\b/.test(head)) tags.push('export');\n    tags.push(...extractInlineTags(source, m.index));\n    pushBlock(blocks, moduleId, 'function', name, content, tags);\n  }\n\n  for (const m of source.matchAll(/(?:^|(?<=[;}{]))\\s*(?:export\\s+(?:default\\s+)?)?class\\s+(\\w+)/gm)) {\n    const name = m[1];\n    const bodyStart = source.indexOf('{', m.index);\n    if (bodyStart < 0) continue;\n    const end = matchBrace(source, bodyStart);\n    const content = source.slice(m.index, end + 1);\n    const head = m[0];\n    const tags = ['class'];\n    if (/\\bexport\\b/.test(head)) tags.push('export');\n    if (/\\bdefault\\b/.test(head)) tags.push('default');\n    tags.push(...extractInlineTags(source, m.index));\n    pushBlock(blocks, moduleId, 'class', name, content, tags);\n  }\n\n  const nameToId = new Map(blocks.map(b => [b.meta.name, b.id]));\n  for (const b of blocks) {\n    const calls = new Set();\n    for (const [name, id] of nameToId) {\n      if (id === b.id) continue;\n      const re = new RegExp(`\\\\b${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\\\s*\\\\(`);\n      if (re.test(b.content)) calls.add(id);\n    }\n    if (calls.size === 0) continue;\n    const head = b.head();\n    b.commit({\n      content: head.content,\n      refs: [...head.refs, ...Array.from(calls).map(target => ({ kind: 'calls', target }))],\n      children: head.children,\n      tags: head.tags,\n      meta: head.meta,\n    });\n  }\n\n  moduleBlock.commit({ content: null, refs: [...imports, ...blocks.map(b => ({ kind: 'contains', target: b.id }))] });\n  return [moduleBlock, ...blocks];\n}\n\nfunction pushBlock(arr, moduleId, type, name, content, tags = []) {\n  const prefix = type === 'class' ? 'class' : 'fn';\n  const id = `${moduleId}:${prefix}:${name}`;\n  if (arr.some(b => b.id === id)) return;\n  const b = new Block({ id, type, meta: { name } });\n  b.commit({ content, tags });\n  arr.push(b);\n}\n\nexport function extractInlineTags(source, declStart) {\n  const tags = new Set();\n  let lineEnd = source.lastIndexOf('\\n', declStart - 1);\n  for (let i = 0; i < 20 && lineEnd > 0; i++) {\n    const lineStart = source.lastIndexOf('\\n', lineEnd - 1) + 1;\n    const line = source.slice(lineStart, lineEnd);\n    if (!line.trim()) break;\n    const emblem = line.match(/\\[(?:ai_s_emblem|EMBLEM):([^\\s\\]]+)\\s+\\w+/);\n    if (emblem) for (const t of emblem[1].split('#').filter(Boolean)) tags.add(t);\n    const at = line.match(/@tags\\s*[:=]\\s*([\\w\\s,]+)/);\n    if (at) for (const t of at[1].split(',').map(s => s.trim()).filter(Boolean)) tags.add(t);\n    lineEnd = lineStart - 1;\n  }\n  return Array.from(tags);\n}\n\nexport function matchBrace(source, openIdx) { return matchPair(source, openIdx, '{', '}'); }\nexport function matchParen(source, openIdx) { return matchPair(source, openIdx, '(', ')'); }\n\nexport function matchPair(source, openIdx, openCh, closeCh) {\n  let depth = 0, inString = null, escape = false, inTemplate = 0;\n  for (let i = openIdx; i < source.length; i++) {\n    const c = source[i];\n    if (escape) { escape = false; continue; }\n    if (c === '\\\\') { escape = true; continue; }\n    if (inString) {\n      if (c === inString) inString = null;\n      else if (inString === '`' && c === '$' && source[i + 1] === '{') { inTemplate++; i++; }\n      continue;\n    }\n    if (inTemplate > 0 && c === '}') { inTemplate--; continue; }\n    if (c === '\"' || c === \"'\" || c === '`') { inString = c; continue; }\n    if (c === '/' && source[i + 1] === '/') {\n      const nl = source.indexOf('\\n', i);\n      i = nl < 0 ? source.length : nl;\n      continue;\n    }\n    if (c === '/' && source[i + 1] === '*') {\n      const end = source.indexOf('*/', i + 2);\n      i = end < 0 ? source.length : end + 1;\n      continue;\n    }\n    if (c === '/' && isRegexContext(source, i)) { i = skipRegex(source, i); continue; }\n    if (c === openCh) depth++;\n    else if (c === closeCh) { depth--; if (depth === 0) return i; }\n  }\n  return source.length - 1;\n}\n\nfunction isRegexContext(source, slashIdx) {\n  for (let j = slashIdx - 1; j >= 0; j--) {\n    const c = source[j];\n    if (c === ' ' || c === '\\t') continue;\n    if (c === '\\n') return true;\n    if (/[\\w$\\]\\)]/.test(c)) return false;\n    return true;\n  }\n  return true;\n}\n\nfunction skipRegex(source, startIdx) {\n  let inClass = false, escape = false;\n  for (let i = startIdx + 1; i < source.length; i++) {\n    const c = source[i];\n    if (escape) { escape = false; continue; }\n    if (c === '\\\\') { escape = true; continue; }\n    if (c === '[') inClass = true;\n    else if (c === ']') inClass = false;\n    else if (c === '/' && !inClass) {\n      let j = i + 1;\n      while (j < source.length && /[gimuysd]/.test(source[j])) j++;\n      return j - 1;\n    }\n    if (c === '\\n') return i;\n  }\n  return source.length - 1;\n}\n\nexport function findFunctionBody(source, declStart) {\n  const argStart = source.indexOf('(', declStart);\n  if (argStart < 0) return -1;\n  const argEnd = matchParen(source, argStart);\n  return source.indexOf('{', argEnd);\n}\n\nexport function checkBraces(content) {\n  let depth = 0, inString = null, escape = false, inTemplate = 0;\n  for (let i = 0; i < content.length; i++) {\n    const c = content[i];\n    if (escape) { escape = false; continue; }\n    if (c === '\\\\') { escape = true; continue; }\n    if (inString) {\n      if (c === inString) inString = null;\n      else if (inString === '`' && c === '$' && content[i + 1] === '{') { inTemplate++; i++; }\n      continue;\n    }\n    if (inTemplate > 0 && c === '}') { inTemplate--; continue; }\n    if (c === '\"' || c === \"'\" || c === '`') { inString = c; continue; }\n    if (c === '/' && content[i + 1] === '/') {\n      const nl = content.indexOf('\\n', i);\n      i = nl < 0 ? content.length : nl;\n      continue;\n    }\n    if (c === '/' && content[i + 1] === '*') {\n      const end = content.indexOf('*/', i + 2);\n      i = end < 0 ? content.length : end + 1;\n      continue;\n    }\n    if (c === '/' && isRegexContext(content, i)) { i = skipRegex(content, i); continue; }\n    if (c === '{') depth++;\n    else if (c === '}') { depth--; if (depth < 0) return { error: 'extra-closing-brace', at: i }; }\n  }\n  if (depth !== 0) return { error: 'unbalanced-braces', remaining: depth };\n  return null;\n}\n\n// ============================================================\n// parseMD — Markdown を Block に分解\n// ============================================================\n\nexport function parseMD(source, moduleId = 'doc') {\n  const blocks = [];\n  const lines = source.split('\\n');\n  const moduleBlock = new Block({ id: moduleId, type: 'document', meta: { source: moduleId } });\n  const sections = [];\n  let current = null, inCode = false, codeLang = null, codeBuf = [];\n\n  for (const line of lines) {\n    const codeStart = line.match(/^```(\\w*)/);\n    if (codeStart && !inCode) { inCode = true; codeLang = codeStart[1] || 'text'; codeBuf = []; continue; }\n    if (inCode && /^```\\s*$/.test(line)) {\n      inCode = false;\n      if (current) current.codeBlocks.push({ lang: codeLang, content: codeBuf.join('\\n') });\n      continue;\n    }\n    if (inCode) { codeBuf.push(line); continue; }\n    const h = line.match(/^(#{1,6})\\s+(.+)$/);\n    if (h) {\n      current = { level: h[1].length, title: h[2].trim(), content: [], codeBlocks: [], refs: [] };\n      sections.push(current);\n      continue;\n    }\n    if (current) {\n      current.content.push(line);\n      for (const m of line.matchAll(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g)) current.refs.push({ kind: 'link', target: m[2], label: m[1] });\n    }\n  }\n\n  const slugCount = new Map(), moduleRefs = [];\n  for (const s of sections) {\n    let slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);\n    const n = (slugCount.get(slug) || 0) + 1; slugCount.set(slug, n);\n    if (n > 1) slug = `${slug}-${n}`;\n    const id = `${moduleId}:sec:${slug}`;\n    const sb = new Block({ id, type: 'section', meta: { title: s.title, level: s.level } });\n    const childRefs = [];\n    for (let j = 0; j < s.codeBlocks.length; j++) {\n      const cb = s.codeBlocks[j], codeId = `${id}:code:${j}`;\n      const codeBlock = new Block({ id: codeId, type: 'code', meta: { lang: cb.lang, parent: id } });\n      codeBlock.commit({ content: cb.content, tags: ['code', cb.lang] });\n      blocks.push(codeBlock);\n      childRefs.push({ kind: 'contains', target: codeId });\n    }\n    sb.commit({ content: s.content.join('\\n').trim(), refs: [...s.refs, ...childRefs], tags: ['section', `h${s.level}`] });\n    blocks.push(sb);\n    moduleRefs.push({ kind: 'contains', target: id });\n  }\n  moduleBlock.commit({ content: null, refs: moduleRefs });\n  return [moduleBlock, ...blocks];\n}\n\n// ============================================================\n// Mermaid output — Graph を mermaid フローチャートに\n// ============================================================\n\nexport function exportMermaid(graph, opts = {}) {\n  const { kind = null, type = null, maxBlocks = 50 } = opts;\n  const lines = ['flowchart LR'];\n  const filtered = graph.all().filter(b => !type || b.type === type);\n  const visible = filtered.slice(0, maxBlocks);\n  const visibleIds = new Set(visible.map(b => b.id));\n\n  for (const b of visible) {\n    const short = b.id.split(':').slice(-2).join(':');\n    const label = `${short}<br/><i>${b.type}</i>`;\n    lines.push(`  ${nodeId(b.id)}[\"${label.replace(/\"/g, \"'\")}\"]`);\n  }\n\n  for (const b of visible) {\n    for (const r of b.refs) {\n      if (kind && r.kind !== kind) continue;\n      if (!visibleIds.has(r.target)) continue;\n      lines.push(`  ${nodeId(b.id)} -->|${r.kind}| ${nodeId(r.target)}`);\n    }\n  }\n\n  return lines.join('\\n');\n}\n\nfunction nodeId(id) {\n  return 'n_' + id.replace(/[^a-zA-Z0-9_]/g, '_');\n}\n\n// ============================================================\n// inferTags — content から自動的にタグを推論\n// ============================================================\n\nexport function inferTags(content, type = null) {\n  const tags = new Set();\n  if (!content) return [];\n  if (/\\b(test|describe|it)\\s*\\(\\s*['\"]/.test(content)) tags.add('test');\n  if (/\\bassert\\b/.test(content)) tags.add('assertion');\n  if (/\\b(readFileSync|writeFileSync|readFile|writeFile|fs\\.)/.test(content)) tags.add('io');\n  if (/\\bfetch\\s*\\(|\\bXMLHttpRequest\\b/.test(content)) tags.add('network');\n  if (/\\bconsole\\./.test(content)) tags.add('logging');\n  if (/\\basync\\b|\\bawait\\b/.test(content)) tags.add('async');\n  if (/\\bnew\\s+RegExp|\\/[^\\/\\n]+\\/[gimuy]*/.test(content)) tags.add('regex');\n  if (/\\bclass\\s+\\w+\\s+extends\\b/.test(content)) tags.add('inheritance');\n  if (/\\bMap\\s*\\(|\\bSet\\s*\\(/.test(content)) tags.add('collection');\n  if (!/\\b(console\\.|fs\\.|writeFileSync|readFileSync|fetch\\(|process\\.)/.test(content) && type === 'function') tags.add('pure');\n  const numLines = content.split('\\n').length;\n  if (numLines > 50) tags.add('large');\n  if (numLines < 10 && type === 'function') tags.add('small');\n  return Array.from(tags);\n}\n\n// ============================================================\n// Virtual Heavy Function — 仮想重厚関数\n// ============================================================\n\nexport function virtualHeavy(graph, rootId, opts = {}) {\n  const { depth = Infinity, kind = 'calls' } = opts;\n  const collected = new Map();\n  function collect(id, d) {\n    if (collected.has(id) || d > depth) return;\n    const b = graph.get(id); if (!b) return;\n    collected.set(id, b);\n    for (const r of b.refs) if (kind == null || r.kind === kind) collect(r.target, d + 1);\n  }\n  collect(rootId, 0);\n  return Array.from(collected.values());\n}\n\nexport function expandVirtualHeavy(graph, rootId, opts = {}) {\n  const blocks = virtualHeavy(graph, rootId, opts);\n  const lines = [`// === Virtual Heavy Function rooted at ${rootId} ===`, `// ${blocks.length} blocks combined into one logical heavy function`, '// Edit the bodies; do not change the boundary headers.', ''];\n  for (const b of blocks) {\n    lines.push(`// --- BLOCK: ${b.id} (${b.type}) ---`);\n    if (b.tags.length) lines.push(`// tags: ${b.tags.join(', ')}`);\n    if (b.refs.length) lines.push(`// refs: ${b.refs.map(r => `${r.kind}->${r.target}`).join(', ')}`);\n    if (b.content) lines.push(b.content);\n    lines.push('');\n  }\n  lines.push('// === end of virtual heavy ===');\n  return lines.join('\\n');\n}\n\nexport function virtualApply(graph, rootId, expandedContent, opts = {}) {\n  const heavyBlocks = virtualHeavy(graph, rootId, opts);\n  const heavyById = new Map(heavyBlocks.map(b => [b.id, b]));\n  const re = /^\\s*\\/\\/\\s*---\\s*BLOCK:\\s*(\\S+)\\s*\\(([^)]+)\\)\\s*---\\s*$/gm;\n  const updates = [];\n  let m, lastEnd = 0, lastId = null;\n  while ((m = re.exec(expandedContent)) !== null) {\n    if (lastId) {\n      const body = expandedContent.slice(lastEnd, m.index).replace(/\\n?\\/\\/\\s*===\\s*end of virtual heavy\\s*===\\s*$/, '').replace(/^\\s*\\/\\/\\s*(tags|refs):.*$/gm, '').trim();\n      const target = heavyById.get(lastId);\n      if (target) updates.push({ id: lastId, ...target.applyPatch(body) });\n      else updates.push({ id: lastId, action: 'skipped-out-of-scope' });\n    }\n    lastId = m[1]; lastEnd = m.index + m[0].length;\n  }\n  if (lastId) {\n    const body = expandedContent.slice(lastEnd).replace(/\\n?\\/\\/\\s*===\\s*end of virtual heavy\\s*===\\s*$/, '').replace(/^\\s*\\/\\/\\s*(tags|refs):.*$/gm, '').trim();\n    const target = heavyById.get(lastId);\n    if (target) updates.push({ id: lastId, ...target.applyPatch(body) });\n    else updates.push({ id: lastId, action: 'skipped-out-of-scope' });\n  }\n  return updates;\n}\n\nexport function heavyApply(graph, rootId, expandedContent, opts = {}) {\n  const updates = virtualApply(graph, rootId, expandedContent, opts);\n  const expanded = expandVirtualHeavy(graph, rootId, opts);\n  return {\n    updates,\n    expanded,\n    stats: summarizeUpdates(updates),\n    blocks: virtualHeavy(graph, rootId, opts).length,\n  };\n}\n\nfunction summarizeUpdates(updates) {\n  const stats = {};\n  for (const u of updates) stats[u.action] = (stats[u.action] || 0) + 1;\n  return stats;\n}\n\n// ============================================================\n// Codegen — Graph から JS ファイルを再生成\n// ============================================================\n\nexport function exportModule(graph, moduleId) {\n  const m = graph.get(moduleId); if (!m || m.type !== 'module') throw new Error(`invalid module: ${moduleId}`);\n  const lines = [];\n  for (const r of m.refs.filter(r => r.kind === 'import')) lines.push(`import './${(r.originalTarget || r.target).replace(/^\\.\\//, '')}';`);\n  if (lines.length) lines.push('');\n  for (const r of m.refs.filter(r => r.kind === 'contains')) {\n    const child = graph.get(r.target);\n    if (child && child.content) { lines.push(child.content); lines.push(''); }\n  }\n  return lines.join('\\n').replace(/\\n{3,}/g, '\\n\\n').trim() + '\\n';\n}\n\n// ============================================================\n// Stats / Context / Block Apply\n// ============================================================\n\nexport function graphStats(graph) {\n  const all = graph.all();\n  const byType = {}, byTag = {};\n  let v = 0, r = 0, c = 0;\n  for (const b of all) {\n    byType[b.type] = (byType[b.type] || 0) + 1;\n    for (const t of b.tags) byTag[t] = (byTag[t] || 0) + 1;\n    v += b.versions.length; r += b.refs.length; if (b.content) c += b.content.length;\n  }\n  return { blocks: all.length, versions: v, refs: r, contentChars: c, avgVersions: +(v/all.length||0).toFixed(2), avgRefs: +(r/all.length||0).toFixed(2), byType, byTag };\n}\n\nexport function blockContext(graph, blockId, opts = {}) {\n  const { depth = 1, includeBackward = true, includeForward = true } = opts;\n  const target = graph.get(blockId); if (!target) throw new Error(`not found: ${blockId}`);\n  const collected = new Map(); collected.set(target.id, target);\n  function expand(id, d) {\n    if (d >= depth) return;\n    const n = []; if (includeForward) n.push(...graph.forward(id)); if (includeBackward) n.push(...graph.backward(id));\n    for (const b of n) if (!collected.has(b.id)) { collected.set(b.id, b); expand(b.id, d + 1); }\n  }\n  expand(blockId, 0); return Array.from(collected.values());\n}\n\nexport function formatContextForLLM(blocks, targetId) {\n  const lines = [`# Context for ${targetId}\\nTotal ${blocks.length} blocks.\\n`];\n  for (const b of blocks) {\n    lines.push(`## ${b.id === targetId ? '⭐ ' : ''}${b.id}\\n- type: ${b.type}${b.tags.length ? `\\n- tags: ${b.tags.join(', ')}` : ''}\\n- versions: ${b.versions.length}`);\n    if (b.refs.length) lines.push(`- refs:\\n${b.refs.map(r => `  - ${r.kind} → ${r.target}`).join('\\n')}`);\n    if (b.content) lines.push(`\\n\\`\\`\\`js\\n${b.content}\\n\\`\\`\\`\\n`);\n  }\n  return lines.join('\\n');\n}\n\nexport function applyToBlock(graph, blockId, content, opts = {}) {\n  const b = graph.get(blockId); if (!b) throw new Error(`not found: ${blockId}`);\n  return b.applyPatch(content, opts);\n}\n\nexport function applyBlockSmart(graph, blockId, content) {\n  const target = graph.get(blockId); if (!target) throw new Error(`not found: ${blockId}`);\n  const parsed = parseJS(content, `__patch__${Date.now()}`);\n  const fnBlock = parsed.find(b => b.type !== 'module');\n  if (!fnBlock) return target.applyPatch(content);\n  return target.applyPatch(fnBlock.content, { refs: fnBlock.refs.filter(r => r.kind !== 'calls'), tags: fnBlock.tags });\n}\n\nexport function applyPatch(graph, source, moduleId) {\n  const patched = parseJS(source, moduleId), updates = [];\n  for (const nb of patched) {\n    const existing = graph.get(nb.id), nh = nb.head(); if (!nh) continue;\n    if (existing) {\n      const eh = existing.head();\n      if (eh?.content === nh.content && eh?.refs?.length === nh.refs.length && eh?.tags?.length === nh.tags.length) updates.push({ id: existing.id, action: 'unchanged' });\n      else { existing.commit({ content: nh.content, refs: nh.refs, children: nh.children, tags: nh.tags, meta: { ...nh.meta, appliedAt: Date.now() } }); updates.push({ id: existing.id, action: 'updated' }); }\n    } else { graph.add(nb); updates.push({ id: nb.id, action: 'added' }); }\n  }\n  return updates;\n}\n\n// Pure Resolve Imports (No node:path)\nexport function resolveImportsPure(graph, resolvePathFn) {\n  const resolved = [];\n  for (const m of graph.byType('module')) {\n    const head = m.head(); if (!head) continue;\n    let changed = false;\n    const newRefs = head.refs.map(r => {\n      if (r.kind !== 'import' || !r.target.startsWith('.')) return r;\n      const resolvedTarget = resolvePathFn(m.id, r.target);\n      if (resolvedTarget && graph.has(resolvedTarget)) { changed = true; return { ...r, target: resolvedTarget, originalTarget: r.target }; }\n      return r;\n    });\n    if (changed) { m.commit({ content: head.content, refs: newRefs, children: head.children, tags: head.tags, meta: { ...head.meta, importsResolved: true } }); resolved.push(m.id); }\n  }\n  return resolved;\n}\n\n// ============================================================\n// Constraint / Observation\n// ============================================================\n\nexport function constraintBlock({ id, axes, values, derive, tags = [] }) {\n  if (typeof derive !== 'function') throw new Error('derive must be a function');\n  const b = new Block({ id, type: 'constraint', meta: { axes } });\n  b.commit({ content: JSON.stringify({ axes, values, derive: derive.toString() }), tags: ['constraint', ...tags] });\n  return b;\n}\n\nexport function evalConstraint(block, filter = {}) {\n  const data = JSON.parse(block.content), { axes, values } = data;\n  const derive = new Function('combo', `return (${data.derive})(combo);`);\n  function* gen(idx, current) {\n    if (idx === axes.length) { yield current; return; }\n    const axis = axes[idx]; for (const v of values[axis]) yield* gen(idx + 1, { ...current, [axis]: v });\n  }\n  const worlds = [];\n  for (const w of gen(0, {})) {\n    const derived = derive(w) || {}, merged = { ...w, ...derived };\n    let pass = true; for (const [k, v] of Object.entries(filter)) if (!k.startsWith('_') && merged[k] !== v) { pass = false; break; }\n    if (pass) worlds.push(merged);\n  }\n  return worlds.length === 0 ? { _contradiction: true } : { _worlds: worlds.length, worlds };\n}\n\nexport function observationBlock({ id, observedId, snapshot, tags = [] }) {\n  const b = new Block({ id, type: 'observation', meta: { observedId } });\n  b.commit({ content: JSON.stringify(snapshot), refs: [{ kind: 'observes', target: observedId }], tags: ['observation', ...tags] });\n  return b;\n}\n",
      "ts": 1778788881994,
      "refs": [
        {
          "kind": "calls",
          "target": "hashVersion"
        },
        {
          "kind": "calls",
          "target": "Error"
        },
        {
          "kind": "calls",
          "target": "makeVersion"
        },
        {
          "kind": "calls",
          "target": "Set"
        },
        {
          "kind": "calls",
          "target": "refKey"
        },
        {
          "kind": "calls",
          "target": "predicate"
        },
        {
          "kind": "calls",
          "target": "sameRefs"
        },
        {
          "kind": "calls",
          "target": "sameArr"
        },
        {
          "kind": "calls",
          "target": "Block"
        },
        {
          "kind": "calls",
          "target": "Map"
        },
        {
          "kind": "calls",
          "target": "enable"
        },
        {
          "kind": "calls",
          "target": "checkBraces"
        },
        {
          "kind": "calls",
          "target": "RegExp"
        },
        {
          "kind": "calls",
          "target": "Graph"
        },
        {
          "kind": "calls",
          "target": "findFunctionBody"
        },
        {
          "kind": "calls",
          "target": "matchBrace"
        },
        {
          "kind": "calls",
          "target": "pushBlock"
        },
        {
          "kind": "calls",
          "target": "matchPair"
        },
        {
          "kind": "calls",
          "target": "isRegexContext"
        },
        {
          "kind": "calls",
          "target": "skipRegex"
        },
        {
          "kind": "calls",
          "target": "matchParen"
        },
        {
          "kind": "calls",
          "target": "nodeId"
        },
        {
          "kind": "calls",
          "target": "collect"
        },
        {
          "kind": "calls",
          "target": "virtualHeavy"
        },
        {
          "kind": "calls",
          "target": "virtualApply"
        },
        {
          "kind": "calls",
          "target": "expandVirtualHeavy"
        },
        {
          "kind": "calls",
          "target": "summarizeUpdates"
        },
        {
          "kind": "calls",
          "target": "expand"
        },
        {
          "kind": "calls",
          "target": "parseJS"
        },
        {
          "kind": "calls",
          "target": "resolvePathFn"
        },
        {
          "kind": "calls",
          "target": "Function"
        },
        {
          "kind": "calls",
          "target": "gen"
        },
        {
          "kind": "calls",
          "target": "derive"
        }
      ],
      "tags": [],
      "applyId": null
    },
    {
      "content": "// ai-desk-core.js\n// Pure domain logic for ai-desk v2 (Platform Agnostic)\n//\n// This file contains the core data structures and logic for Block-based \n// code management. It has ZERO dependencies on Node.js or any other runtime.\n// It can run in Browsers, Deno, Bun, or any standard JS environment.\n\n// ============================================================\n// Version — Block の状態スナップショット(これが REAL)\n// ============================================================\n\nexport function makeVersion({ content, refs = [], children = [], tags = [], meta = {} }, prev = null) {\n  const v = {\n    timestamp: Date.now(),\n    prevHash: prev ? prev.hash : null,\n    content,\n    refs,\n    children,\n    tags,\n    meta,\n  };\n  v.hash = hashVersion(v);\n  return v;\n}\n\n// refs / 配列の浅い比較(applyPatch の unchanged 判定用)\nexport function sameArr(a, b) {\n  if (a.length !== b.length) return false;\n  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;\n  return true;\n}\n\nexport function sameRefs(a, b) {\n  if (a.length !== b.length) return false;\n  const key = r => `${r.kind}:${r.target}`;\n  const aKeys = a.map(key).sort();\n  const bKeys = b.map(key).sort();\n  for (let i = 0; i < aKeys.length; i++) if (aKeys[i] !== bKeys[i]) return false;\n  return true;\n}\n\n// 軽量 FNV-1a 32bit。Zero-Dep。\nexport function hashVersion(v) {\n  const { hash, ...rest } = v;\n  const stable = JSON.stringify(rest, Object.keys(rest).sort());\n  let h = 0x811c9dc5;\n  for (let i = 0; i < stable.length; i++) {\n    h ^= stable.charCodeAt(i);\n    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;\n  }\n  return h.toString(16).padStart(8, '0');\n}\n\n// ============================================================\n// Block — versions の羅列が本体\n// ============================================================\n\nexport class Block {\n  constructor({ id, type, versions = [], meta = {} }) {\n    if (!id) throw new Error('Block requires id');\n    if (!type) throw new Error('Block requires type');\n    this.id = id;\n    this.type = type;\n    this.versions = versions;\n    this.meta = meta;\n  }\n\n  commit({ content = null, refs = [], children = [], tags = [], meta = {} } = {}) {\n    const prev = this.head();\n    const v = makeVersion({ content, refs, children, tags, meta }, prev);\n    this.versions.push(v);\n    return v;\n  }\n\n  head() {\n    return this.versions.length > 0 ? this.versions[this.versions.length - 1] : null;\n  }\n\n  at(timestamp) {\n    let result = null;\n    for (const v of this.versions) {\n      if (v.timestamp > timestamp) break;\n      result = v;\n    }\n    return result;\n  }\n\n  get content() { return this.head()?.content ?? null; }\n  get refs()    { return this.head()?.refs    ?? []; }\n  get children(){ return this.head()?.children?? []; }\n  get tags()    { return this.head()?.tags    ?? []; }\n\n  hasTag(tag) { return this.tags.includes(tag); }\n  hasAllTags(tags) { return tags.every(t => this.tags.includes(t)); }\n  hasAnyTag(tags) { return tags.some(t => this.tags.includes(t)); }\n\n  verify() {\n    for (let i = 0; i < this.versions.length; i++) {\n      const v = this.versions[i];\n      const expectedPrev = i === 0 ? null : this.versions[i - 1].hash;\n      if (v.prevHash !== expectedPrev) {\n        return { ok: false, brokenAt: i, reason: 'prevHash mismatch' };\n      }\n      if (v.hash !== hashVersion(v)) {\n        return { ok: false, brokenAt: i, reason: 'hash mismatch' };\n      }\n    }\n    return { ok: true };\n  }\n\n  diff(i, j) {\n    if (this.versions.length < 2) return null;\n    if (i == null) i = this.versions.length - 2;\n    if (j == null) j = this.versions.length - 1;\n    const a = this.versions[i];\n    const b = this.versions[j];\n    if (!a || !b) return null;\n    const refKey = r => `${r.kind}:${r.target}`;\n    const aRefs = new Set(a.refs.map(refKey));\n    const bRefs = new Set(b.refs.map(refKey));\n    return {\n      contentChanged: a.content !== b.content,\n      content: { from: a.content, to: b.content },\n      refsAdded: b.refs.filter(r => !aRefs.has(refKey(r))),\n      refsRemoved: a.refs.filter(r => !bRefs.has(refKey(r))),\n      tagsAdded: b.tags.filter(t => !a.tags.includes(t)),\n      tagsRemoved: a.tags.filter(t => !b.tags.includes(t)),\n      timeDelta: b.timestamp - a.timestamp,\n    };\n  }\n\n  blame(predicate) {\n    for (let i = 0; i < this.versions.length; i++) {\n      const v = this.versions[i];\n      if (predicate(v)) return { version: v, index: i };\n    }\n    return null;\n  }\n\n  blameRef(target, kind = null) {\n    return this.blame(v =>\n      v.refs.some(r => r.target === target && (kind == null || r.kind === kind))\n    );\n  }\n\n  applyPatch(content, opts = {}) {\n    const head = this.head();\n    if (head && head.content === content\n        && (opts.refs == null || sameRefs(opts.refs, head.refs))\n        && (opts.tags == null || sameArr(opts.tags, head.tags))) {\n      return { action: 'unchanged', block: this };\n    }\n    this.commit({\n      content,\n      refs: opts.refs ?? head?.refs ?? [],\n      children: opts.children ?? head?.children ?? [],\n      tags: opts.tags ?? head?.tags ?? [],\n      meta: { ...(head?.meta ?? {}), ...(opts.meta ?? {}), appliedAt: Date.now() },\n    });\n    return { action: head ? 'updated' : 'created', block: this };\n  }\n\n  rollback(versionIndex) {\n    const target = this.versions[versionIndex];\n    if (!target) throw new Error(`no such version: ${versionIndex}`);\n    return this.commit({\n      content: target.content,\n      refs: target.refs,\n      children: target.children,\n      tags: target.tags,\n      meta: { ...target.meta, rollbackFrom: target.hash, rollbackIndex: versionIndex },\n    });\n  }\n\n  toJSON() {\n    return { id: this.id, type: this.type, versions: this.versions, meta: this.meta };\n  }\n\n  static fromJSON(json) {\n    return new Block({\n      id: json.id,\n      type: json.type,\n      versions: json.versions || [],\n      meta: json.meta || {},\n    });\n  }\n}\n\n// ============================================================\n// Graph — Block の集合 + 双方向走査\n// ============================================================\n\nexport class Graph {\n  constructor(blocks = []) {\n    this.blocks = new Map();\n    for (const b of blocks) this.add(b);\n  }\n\n  add(block) {\n    if (!(block instanceof Block)) block = Block.fromJSON(block);\n    this.blocks.set(block.id, block);\n    return this;\n  }\n\n  get(id) { return this.blocks.get(id); }\n  has(id) { return this.blocks.has(id); }\n  remove(id) { return this.blocks.delete(id); }\n\n  ids() { return Array.from(this.blocks.keys()); }\n  all() { return Array.from(this.blocks.values()); }\n\n  byTag(tag)         { return this.all().filter(b => b.hasTag(tag)); }\n  byAllTags(tags)    { return this.all().filter(b => b.hasAllTags(tags)); }\n  byAnyTag(tags)     { return this.all().filter(b => b.hasAnyTag(tags)); }\n  byType(type)       { return this.all().filter(b => b.type === type); }\n\n  lint(opts = {}) {\n    const enable = key => opts[key] !== false;\n    const issues = [];\n    const ids = new Set(this.blocks.keys());\n\n    if (enable('broken')) {\n      for (const b of this.blocks.values()) {\n        for (const r of b.refs) {\n          if (r.kind === 'import') {\n            const isExternal = !r.target.startsWith('.') && !r.target.startsWith('/');\n            if (isExternal || r.target.startsWith('.')) continue;\n          }\n          if (!ids.has(r.target)) {\n            issues.push({ kind: 'broken-ref', from: b.id, ref: r });\n          }\n        }\n      }\n    }\n\n    if (enable('orphan')) {\n      for (const b of this.blocks.values()) {\n        if (b.type === 'module') continue;\n        if (this.backward(b.id).length === 0) {\n          issues.push({ kind: 'orphan', id: b.id, type: b.type });\n        }\n      }\n    }\n\n    if (enable('circular')) {\n      for (const b of this.blocks.values()) {\n        const cycle = this._findCycle(b.id);\n        if (cycle) issues.push({ kind: 'circular', cycle });\n      }\n    }\n\n    if (enable('brace')) {\n      for (const b of this.blocks.values()) {\n        if (!b.content) continue;\n        const r = checkBraces(b.content);\n        if (r) issues.push({ kind: 'brace-mismatch', id: b.id, ...r });\n      }\n    }\n\n    if (enable('calls')) {\n      const moduleNameMap = new Map();\n      for (const b of this.blocks.values()) {\n        if (!b.meta?.name) continue;\n        if (b.type !== 'function' && b.type !== 'class') continue;\n        const moduleId = b.id.split(':').slice(0, -2).join(':');\n        if (!moduleNameMap.has(moduleId)) moduleNameMap.set(moduleId, new Map());\n        moduleNameMap.get(moduleId).set(b.meta.name, b.id);\n      }\n      for (const b of this.blocks.values()) {\n        if (!b.content || !b.meta?.name) continue;\n        const moduleId = b.id.split(':').slice(0, -2).join(':');\n        const peers = moduleNameMap.get(moduleId);\n        if (!peers) continue;\n        const declared = new Set(b.refs.filter(r => r.kind === 'calls').map(r => r.target));\n        for (const [name, id] of peers) {\n          if (id === b.id) continue;\n          const re = new RegExp(`\\\\b${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\\\s*\\\\(`);\n          if (re.test(b.content) && !declared.has(id)) {\n            issues.push({ kind: 'calls-leak', from: b.id, missing: id, name });\n          }\n        }\n      }\n    }\n\n    if (enable('tags')) {\n      for (const b of this.blocks.values()) {\n        if (b.type === 'function' && !b.tags.includes('function')) {\n          issues.push({ kind: 'tag-mismatch', id: b.id, expected: 'function', actual: b.tags });\n        }\n        if (b.type === 'class' && !b.tags.includes('class')) {\n          issues.push({ kind: 'tag-mismatch', id: b.id, expected: 'class', actual: b.tags });\n        }\n      }\n    }\n\n    if (enable('empty')) {\n      for (const b of this.blocks.values()) {\n        if (b.type === 'module') continue;\n        if (!b.content && b.refs.length === 0 && b.children.length === 0) {\n          issues.push({ kind: 'empty-block', id: b.id });\n        }\n      }\n    }\n\n    if (enable('hash')) {\n      for (const b of this.blocks.values()) {\n        const r = b.verify();\n        if (!r.ok) {\n          issues.push({ kind: 'hash-broken', id: b.id, reason: r.reason, brokenAt: r.brokenAt });\n        }\n      }\n    }\n\n    return issues;\n  }\n\n  _findCycle(startId, path = [], localVisited = new Set()) {\n    if (path.includes(startId)) return [...path, startId].slice(path.indexOf(startId));\n    if (localVisited.has(startId)) return null;\n    localVisited.add(startId);\n    const next = this.forward(startId);\n    for (const b of next) {\n      const cycle = this._findCycle(b.id, [...path, startId], localVisited);\n      if (cycle) return cycle;\n    }\n    return null;\n  }\n\n  search(query, opts = {}) {\n    const { type = null, tag = null, includeOldVersions = false } = opts;\n    const re = query instanceof RegExp ? query : new RegExp(query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'));\n    const result = [];\n    for (const b of this.blocks.values()) {\n      if (type && b.type !== type) continue;\n      if (tag && !b.hasTag(tag)) continue;\n      if (includeOldVersions) {\n        for (let i = 0; i < b.versions.length; i++) {\n          if (b.versions[i].content && re.test(b.versions[i].content)) {\n            result.push({ block: b, versionIndex: i });\n          }\n        }\n      } else {\n        if (b.content && re.test(b.content)) {\n          result.push({ block: b, versionIndex: b.versions.length - 1 });\n        }\n      }\n    }\n    return result;\n  }\n\n  forward(id, kind = null) {\n    const b = this.blocks.get(id);\n    if (!b) return [];\n    return b.refs.filter(r => kind == null || r.kind === kind).map(r => this.blocks.get(r.target)).filter(x => x != null);\n  }\n\n  backward(id, kind = null) {\n    const result = [];\n    for (const b of this.blocks.values()) {\n      if (b.id === id) continue;\n      const hit = b.refs.some(r => r.target === id && (kind == null || r.kind === kind));\n      if (hit) result.push(b);\n    }\n    return result;\n  }\n\n  impact(id, kind = null, visited = new Set()) {\n    if (visited.has(id)) return [];\n    visited.add(id);\n    const direct = this.backward(id, kind);\n    const result = [...direct];\n    for (const b of direct) result.push(...this.impact(b.id, kind, visited));\n    return result;\n  }\n\n  at(timestamp) {\n    const snapshot = new Graph();\n    for (const b of this.blocks.values()) {\n      const v = b.at(timestamp);\n      if (v == null) continue;\n      const cloned = new Block({\n        id: b.id, type: b.type, meta: b.meta,\n        versions: b.versions.filter(x => x.timestamp <= timestamp),\n      });\n      snapshot.add(cloned);\n    }\n    return snapshot;\n  }\n\n  toJSON() { return Array.from(this.blocks.values()).map(b => b.toJSON()); }\n  static fromJSON(json) { return new Graph(json.map(Block.fromJSON)); }\n  verify() {\n    for (const b of this.blocks.values()) {\n      const r = b.verify();\n      if (!r.ok) return { ok: false, blockId: b.id, ...r };\n    }\n    return { ok: true };\n  }\n}\n\n// ============================================================\n// Parse — JS ソースから Block を抽出\n// ============================================================\n\nexport function parseJS(source, moduleId = 'mod') {\n  const blocks = [];\n  const moduleBlock = new Block({ id: moduleId, type: 'module', meta: { source: moduleId } });\n  const imports = [];\n  for (const m of source.matchAll(/(?:^|(?<=[;}]))\\s*import\\s+[^'\"]*['\"]([^'\"]+)['\"]/gm)) {\n    imports.push({ kind: 'import', target: m[1] });\n  }\n\n  for (const m of source.matchAll(/(?:^|(?<=[;}{]))\\s*(?:export\\s+(?:default\\s+)?)?(?:async\\s+)?function\\s*\\*?\\s+(\\w+)\\s*\\(/gm)) {\n    const name = m[1];\n    const bodyStart = findFunctionBody(source, m.index);\n    if (bodyStart < 0) continue;\n    const end = matchBrace(source, bodyStart);\n    const content = source.slice(m.index, end + 1);\n    const head = m[0];\n    const tags = ['function'];\n    if (/\\basync\\b/.test(head)) tags.push('async');\n    if (/\\bexport\\b/.test(head)) tags.push('export');\n    if (/function\\s*\\*/.test(head)) tags.push('generator');\n    tags.push(...extractInlineTags(source, m.index));\n    pushBlock(blocks, moduleId, 'function', name, content, tags);\n  }\n\n  for (const m of source.matchAll(/(?:^|(?<=[;}{]))\\s*(?:export\\s+)?(?:const|let|var)\\s+(\\w+)\\s*=\\s*(?:async\\s+)?\\([^)]*\\)\\s*=>\\s*\\{/gm)) {\n    const name = m[1];\n    const bodyStart = findFunctionBody(source, m.index);\n    if (bodyStart < 0) continue;\n    const end = matchBrace(source, bodyStart);\n    const content = source.slice(m.index, end + 1);\n    const head = m[0];\n    const tags = ['function', 'arrow'];\n    if (/\\basync\\b/.test(head)) tags.push('async');\n    if (/\\bexport\\b/.test(head)) tags.push('export');\n    tags.push(...extractInlineTags(source, m.index));\n    pushBlock(blocks, moduleId, 'function', name, content, tags);\n  }\n\n  for (const m of source.matchAll(/(?:^|(?<=[;}{]))\\s*(?:export\\s+(?:default\\s+)?)?class\\s+(\\w+)/gm)) {\n    const name = m[1];\n    const bodyStart = source.indexOf('{', m.index);\n    if (bodyStart < 0) continue;\n    const end = matchBrace(source, bodyStart);\n    const content = source.slice(m.index, end + 1);\n    const head = m[0];\n    const tags = ['class'];\n    if (/\\bexport\\b/.test(head)) tags.push('export');\n    if (/\\bdefault\\b/.test(head)) tags.push('default');\n    tags.push(...extractInlineTags(source, m.index));\n    pushBlock(blocks, moduleId, 'class', name, content, tags);\n  }\n\n  const nameToId = new Map(blocks.map(b => [b.meta.name, b.id]));\n  for (const b of blocks) {\n    const calls = new Set();\n    for (const [name, id] of nameToId) {\n      if (id === b.id) continue;\n      const re = new RegExp(`\\\\b${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\\\s*\\\\(`);\n      if (re.test(b.content)) calls.add(id);\n    }\n    if (calls.size === 0) continue;\n    const head = b.head();\n    b.commit({\n      content: head.content,\n      refs: [...head.refs, ...Array.from(calls).map(target => ({ kind: 'calls', target }))],\n      children: head.children,\n      tags: head.tags,\n      meta: head.meta,\n    });\n  }\n\n  moduleBlock.commit({ content: null, refs: [...imports, ...blocks.map(b => ({ kind: 'contains', target: b.id }))] });\n  return [moduleBlock, ...blocks];\n}\n\nfunction pushBlock(arr, moduleId, type, name, content, tags = []) {\n  const prefix = type === 'class' ? 'class' : 'fn';\n  const id = `${moduleId}:${prefix}:${name}`;\n  if (arr.some(b => b.id === id)) return;\n  const b = new Block({ id, type, meta: { name } });\n  b.commit({ content, tags });\n  arr.push(b);\n}\n\nexport function extractInlineTags(source, declStart) {\n  const tags = new Set();\n  let lineEnd = source.lastIndexOf('\\n', declStart - 1);\n  for (let i = 0; i < 20 && lineEnd > 0; i++) {\n    const lineStart = source.lastIndexOf('\\n', lineEnd - 1) + 1;\n    const line = source.slice(lineStart, lineEnd);\n    if (!line.trim()) break;\n    const emblem = line.match(/\\[(?:ai_s_emblem|EMBLEM):([^\\s\\]]+)\\s+\\w+/);\n    if (emblem) for (const t of emblem[1].split('#').filter(Boolean)) tags.add(t);\n    const at = line.match(/@tags\\s*[:=]\\s*([\\w\\s,]+)/);\n    if (at) for (const t of at[1].split(',').map(s => s.trim()).filter(Boolean)) tags.add(t);\n    lineEnd = lineStart - 1;\n  }\n  return Array.from(tags);\n}\n\nexport function matchBrace(source, openIdx) { return matchPair(source, openIdx, '{', '}'); }\nexport function matchParen(source, openIdx) { return matchPair(source, openIdx, '(', ')'); }\n\nexport function matchPair(source, openIdx, openCh, closeCh) {\n  let depth = 0, inString = null, escape = false, inTemplate = 0;\n  for (let i = openIdx; i < source.length; i++) {\n    const c = source[i];\n    if (escape) { escape = false; continue; }\n    if (c === '\\\\') { escape = true; continue; }\n    if (inString) {\n      if (c === inString) inString = null;\n      else if (inString === '`' && c === '$' && source[i + 1] === '{') { inTemplate++; i++; }\n      continue;\n    }\n    if (inTemplate > 0 && c === '}') { inTemplate--; continue; }\n    if (c === '\"' || c === \"'\" || c === '`') { inString = c; continue; }\n    if (c === '/' && source[i + 1] === '/') {\n      const nl = source.indexOf('\\n', i);\n      i = nl < 0 ? source.length : nl;\n      continue;\n    }\n    if (c === '/' && source[i + 1] === '*') {\n      const end = source.indexOf('*/', i + 2);\n      i = end < 0 ? source.length : end + 1;\n      continue;\n    }\n    if (c === '/' && isRegexContext(source, i)) { i = skipRegex(source, i); continue; }\n    if (c === openCh) depth++;\n    else if (c === closeCh) { depth--; if (depth === 0) return i; }\n  }\n  return source.length - 1;\n}\n\nfunction isRegexContext(source, slashIdx) {\n  for (let j = slashIdx - 1; j >= 0; j--) {\n    const c = source[j];\n    if (c === ' ' || c === '\\t') continue;\n    if (c === '\\n') return true;\n    if (/[\\w$\\]\\)]/.test(c)) return false;\n    return true;\n  }\n  return true;\n}\n\nfunction skipRegex(source, startIdx) {\n  let inClass = false, escape = false;\n  for (let i = startIdx + 1; i < source.length; i++) {\n    const c = source[i];\n    if (escape) { escape = false; continue; }\n    if (c === '\\\\') { escape = true; continue; }\n    if (c === '[') inClass = true;\n    else if (c === ']') inClass = false;\n    else if (c === '/' && !inClass) {\n      let j = i + 1;\n      while (j < source.length && /[gimuysd]/.test(source[j])) j++;\n      return j - 1;\n    }\n    if (c === '\\n') return i;\n  }\n  return source.length - 1;\n}\n\nexport function findFunctionBody(source, declStart) {\n  const argStart = source.indexOf('(', declStart);\n  if (argStart < 0) return -1;\n  const argEnd = matchParen(source, argStart);\n  return source.indexOf('{', argEnd);\n}\n\nexport function checkBraces(content) {\n  let depth = 0, inString = null, escape = false, inTemplate = 0;\n  for (let i = 0; i < content.length; i++) {\n    const c = content[i];\n    if (escape) { escape = false; continue; }\n    if (c === '\\\\') { escape = true; continue; }\n    if (inString) {\n      if (c === inString) inString = null;\n      else if (inString === '`' && c === '$' && content[i + 1] === '{') { inTemplate++; i++; }\n      continue;\n    }\n    if (inTemplate > 0 && c === '}') { inTemplate--; continue; }\n    if (c === '\"' || c === \"'\" || c === '`') { inString = c; continue; }\n    if (c === '/' && content[i + 1] === '/') {\n      const nl = content.indexOf('\\n', i);\n      i = nl < 0 ? content.length : nl;\n      continue;\n    }\n    if (c === '/' && content[i + 1] === '*') {\n      const end = content.indexOf('*/', i + 2);\n      i = end < 0 ? content.length : end + 1;\n      continue;\n    }\n    if (c === '/' && isRegexContext(content, i)) { i = skipRegex(content, i); continue; }\n    if (c === '{') depth++;\n    else if (c === '}') { depth--; if (depth < 0) return { error: 'extra-closing-brace', at: i }; }\n  }\n  if (depth !== 0) return { error: 'unbalanced-braces', remaining: depth };\n  return null;\n}\n\n// ============================================================\n// parseMD — Markdown を Block に分解\n// ============================================================\n\nexport function parseMD(source, moduleId = 'doc') {\n  const blocks = [];\n  const lines = source.split('\\n');\n  const moduleBlock = new Block({ id: moduleId, type: 'document', meta: { source: moduleId } });\n  const sections = [];\n  let current = null, inCode = false, codeLang = null, codeBuf = [];\n\n  for (const line of lines) {\n    const codeStart = line.match(/^```(\\w*)/);\n    if (codeStart && !inCode) { inCode = true; codeLang = codeStart[1] || 'text'; codeBuf = []; continue; }\n    if (inCode && /^```\\s*$/.test(line)) {\n      inCode = false;\n      if (current) current.codeBlocks.push({ lang: codeLang, content: codeBuf.join('\\n') });\n      continue;\n    }\n    if (inCode) { codeBuf.push(line); continue; }\n    const h = line.match(/^(#{1,6})\\s+(.+)$/);\n    if (h) {\n      current = { level: h[1].length, title: h[2].trim(), content: [], codeBlocks: [], refs: [] };\n      sections.push(current);\n      continue;\n    }\n    if (current) {\n      current.content.push(line);\n      for (const m of line.matchAll(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g)) current.refs.push({ kind: 'link', target: m[2], label: m[1] });\n    }\n  }\n\n  const slugCount = new Map(), moduleRefs = [];\n  for (const s of sections) {\n    let slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);\n    const n = (slugCount.get(slug) || 0) + 1; slugCount.set(slug, n);\n    if (n > 1) slug = `${slug}-${n}`;\n    const id = `${moduleId}:sec:${slug}`;\n    const sb = new Block({ id, type: 'section', meta: { title: s.title, level: s.level } });\n    const childRefs = [];\n    for (let j = 0; j < s.codeBlocks.length; j++) {\n      const cb = s.codeBlocks[j], codeId = `${id}:code:${j}`;\n      const codeBlock = new Block({ id: codeId, type: 'code', meta: { lang: cb.lang, parent: id } });\n      codeBlock.commit({ content: cb.content, tags: ['code', cb.lang] });\n      blocks.push(codeBlock);\n      childRefs.push({ kind: 'contains', target: codeId });\n    }\n    sb.commit({ content: s.content.join('\\n').trim(), refs: [...s.refs, ...childRefs], tags: ['section', `h${s.level}`] });\n    blocks.push(sb);\n    moduleRefs.push({ kind: 'contains', target: id });\n  }\n  moduleBlock.commit({ content: null, refs: moduleRefs });\n  return [moduleBlock, ...blocks];\n}\n\n// ============================================================\n// Mermaid output — Graph を mermaid フローチャートに\n// ============================================================\n\nexport function exportMermaid(graph, opts = {}) {\n  const { kind = null, type = null, maxBlocks = 50 } = opts;\n  const lines = ['flowchart LR'];\n  const filtered = graph.all().filter(b => !type || b.type === type);\n  const visible = filtered.slice(0, maxBlocks);\n  const visibleIds = new Set(visible.map(b => b.id));\n\n  for (const b of visible) {\n    const short = b.id.split(':').slice(-2).join(':');\n    const label = `${short}<br/><i>${b.type}</i>`;\n    lines.push(`  ${nodeId(b.id)}[\"${label.replace(/\"/g, \"'\")}\"]`);\n  }\n\n  for (const b of visible) {\n    for (const r of b.refs) {\n      if (kind && r.kind !== kind) continue;\n      if (!visibleIds.has(r.target)) continue;\n      lines.push(`  ${nodeId(b.id)} -->|${r.kind}| ${nodeId(r.target)}`);\n    }\n  }\n\n  return lines.join('\\n');\n}\n\nfunction nodeId(id) {\n  return 'n_' + id.replace(/[^a-zA-Z0-9_]/g, '_');\n}\n\n// ============================================================\n// inferTags — content から自動的にタグを推論\n// ============================================================\n\nexport function inferTags(content, type = null) {\n  const tags = new Set();\n  if (!content) return [];\n  if (/\\b(test|describe|it)\\s*\\(\\s*['\"]/.test(content)) tags.add('test');\n  if (/\\bassert\\b/.test(content)) tags.add('assertion');\n  if (/\\b(readFileSync|writeFileSync|readFile|writeFile|fs\\.)/.test(content)) tags.add('io');\n  if (/\\bfetch\\s*\\(|\\bXMLHttpRequest\\b/.test(content)) tags.add('network');\n  if (/\\bconsole\\./.test(content)) tags.add('logging');\n  if (/\\basync\\b|\\bawait\\b/.test(content)) tags.add('async');\n  if (/\\bnew\\s+RegExp|\\/[^\\/\\n]+\\/[gimuy]*/.test(content)) tags.add('regex');\n  if (/\\bclass\\s+\\w+\\s+extends\\b/.test(content)) tags.add('inheritance');\n  if (/\\bMap\\s*\\(|\\bSet\\s*\\(/.test(content)) tags.add('collection');\n  if (!/\\b(console\\.|fs\\.|writeFileSync|readFileSync|fetch\\(|process\\.)/.test(content) && type === 'function') tags.add('pure');\n  const numLines = content.split('\\n').length;\n  if (numLines > 50) tags.add('large');\n  if (numLines < 10 && type === 'function') tags.add('small');\n  return Array.from(tags);\n}\n\n// ============================================================\n// Virtual Heavy Function — 仮想重厚関数\n// ============================================================\n\nexport function virtualHeavy(graph, rootId, opts = {}) {\n  const { depth = Infinity, kind = 'calls' } = opts;\n  const collected = new Map();\n  function collect(id, d) {\n    if (collected.has(id) || d > depth) return;\n    const b = graph.get(id); if (!b) return;\n    collected.set(id, b);\n    for (const r of b.refs) if (kind == null || r.kind === kind) collect(r.target, d + 1);\n  }\n  collect(rootId, 0);\n  return Array.from(collected.values());\n}\n\nexport function expandVirtualHeavy(graph, rootId, opts = {}) {\n  const blocks = virtualHeavy(graph, rootId, opts);\n  const lines = [`// === Virtual Heavy Function rooted at ${rootId} ===`, `// ${blocks.length} blocks combined into one logical heavy function`, '// Edit the bodies; do not change the boundary headers.', ''];\n  for (const b of blocks) {\n    lines.push(`// --- BLOCK: ${b.id} (${b.type}) ---`);\n    if (b.tags.length) lines.push(`// tags: ${b.tags.join(', ')}`);\n    if (b.refs.length) lines.push(`// refs: ${b.refs.map(r => `${r.kind}->${r.target}`).join(', ')}`);\n    if (b.content) lines.push(b.content);\n    lines.push('');\n  }\n  lines.push('// === end of virtual heavy ===');\n  return lines.join('\\n');\n}\n\nexport function virtualApply(graph, rootId, expandedContent, opts = {}) {\n  const heavyBlocks = virtualHeavy(graph, rootId, opts);\n  const heavyById = new Map(heavyBlocks.map(b => [b.id, b]));\n  const re = /^\\s*\\/\\/\\s*---\\s*BLOCK:\\s*(\\S+)\\s*\\(([^)]+)\\)\\s*---\\s*$/gm;\n  const updates = [];\n  let m, lastEnd = 0, lastId = null;\n  while ((m = re.exec(expandedContent)) !== null) {\n    if (lastId) {\n      const body = expandedContent.slice(lastEnd, m.index).replace(/\\n?\\/\\/\\s*===\\s*end of virtual heavy\\s*===\\s*$/, '').replace(/^\\s*\\/\\/\\s*(tags|refs):.*$/gm, '').trim();\n      const target = heavyById.get(lastId);\n      if (target) updates.push({ id: lastId, ...target.applyPatch(body) });\n      else updates.push({ id: lastId, action: 'skipped-out-of-scope' });\n    }\n    lastId = m[1]; lastEnd = m.index + m[0].length;\n  }\n  if (lastId) {\n    const body = expandedContent.slice(lastEnd).replace(/\\n?\\/\\/\\s*===\\s*end of virtual heavy\\s*===\\s*$/, '').replace(/^\\s*\\/\\/\\s*(tags|refs):.*$/gm, '').trim();\n    const target = heavyById.get(lastId);\n    if (target) updates.push({ id: lastId, ...target.applyPatch(body) });\n    else updates.push({ id: lastId, action: 'skipped-out-of-scope' });\n  }\n  return updates;\n}\n\nexport function heavyApply(graph, rootId, expandedContent, opts = {}) {\n  const updates = virtualApply(graph, rootId, expandedContent, opts);\n  const expanded = expandVirtualHeavy(graph, rootId, opts);\n  return {\n    updates,\n    expanded,\n    stats: summarizeUpdates(updates),\n    blocks: virtualHeavy(graph, rootId, opts).length,\n  };\n}\n\nfunction summarizeUpdates(updates) {\n  const stats = {};\n  for (const u of updates) stats[u.action] = (stats[u.action] || 0) + 1;\n  return stats;\n}\n\n// ============================================================\n// Codegen — Graph から JS ファイルを再生成\n// ============================================================\n\nexport function exportModule(graph, moduleId) {\n  const m = graph.get(moduleId); if (!m || m.type !== 'module') throw new Error(`invalid module: ${moduleId}`);\n  const lines = [];\n  for (const r of m.refs.filter(r => r.kind === 'import')) lines.push(`import './${(r.originalTarget || r.target).replace(/^\\.\\//, '')}';`);\n  if (lines.length) lines.push('');\n  for (const r of m.refs.filter(r => r.kind === 'contains')) {\n    const child = graph.get(r.target);\n    if (child && child.content) { lines.push(child.content); lines.push(''); }\n  }\n  return lines.join('\\n').replace(/\\n{3,}/g, '\\n\\n').trim() + '\\n';\n}\n\n// ============================================================\n// Stats / Context / Block Apply\n// ============================================================\n\nexport function graphStats(graph) {\n  const all = graph.all();\n  const byType = {}, byTag = {};\n  let v = 0, r = 0, c = 0;\n  for (const b of all) {\n    byType[b.type] = (byType[b.type] || 0) + 1;\n    for (const t of b.tags) byTag[t] = (byTag[t] || 0) + 1;\n    v += b.versions.length; r += b.refs.length; if (b.content) c += b.content.length;\n  }\n  return { blocks: all.length, versions: v, refs: r, contentChars: c, avgVersions: +(v/all.length||0).toFixed(2), avgRefs: +(r/all.length||0).toFixed(2), byType, byTag };\n}\n\nexport function blockContext(graph, blockId, opts = {}) {\n  const { depth = 1, includeBackward = true, includeForward = true } = opts;\n  const target = graph.get(blockId); if (!target) throw new Error(`not found: ${blockId}`);\n  const collected = new Map(); collected.set(target.id, target);\n  function expand(id, d) {\n    if (d >= depth) return;\n    const n = []; if (includeForward) n.push(...graph.forward(id)); if (includeBackward) n.push(...graph.backward(id));\n    for (const b of n) if (!collected.has(b.id)) { collected.set(b.id, b); expand(b.id, d + 1); }\n  }\n  expand(blockId, 0); return Array.from(collected.values());\n}\n\nexport function formatContextForLLM(blocks, targetId) {\n  const lines = [`# Context for ${targetId}\\nTotal ${blocks.length} blocks.\\n`];\n  for (const b of blocks) {\n    lines.push(`## ${b.id === targetId ? '⭐ ' : ''}${b.id}\\n- type: ${b.type}${b.tags.length ? `\\n- tags: ${b.tags.join(', ')}` : ''}\\n- versions: ${b.versions.length}`);\n    if (b.refs.length) lines.push(`- refs:\\n${b.refs.map(r => `  - ${r.kind} → ${r.target}`).join('\\n')}`);\n    if (b.content) lines.push(`\\n\\`\\`\\`js\\n${b.content}\\n\\`\\`\\`\\n`);\n  }\n  return lines.join('\\n');\n}\n\nexport function applyToBlock(graph, blockId, content, opts = {}) {\n  const b = graph.get(blockId); if (!b) throw new Error(`not found: ${blockId}`);\n  return b.applyPatch(content, opts);\n}\n\nexport function applyBlockSmart(graph, blockId, content) {\n  const target = graph.get(blockId); if (!target) throw new Error(`not found: ${blockId}`);\n  const parsed = parseJS(content, `__patch__${Date.now()}`);\n  const fnBlock = parsed.find(b => b.type !== 'module');\n  if (!fnBlock) return target.applyPatch(content);\n  return target.applyPatch(fnBlock.content, { refs: fnBlock.refs.filter(r => r.kind !== 'calls'), tags: fnBlock.tags });\n}\n\nexport function applyPatch(graph, source, moduleId) {\n  const patched = parseJS(source, moduleId), updates = [];\n  for (const nb of patched) {\n    const existing = graph.get(nb.id), nh = nb.head(); if (!nh) continue;\n    if (existing) {\n      const eh = existing.head();\n      if (eh?.content === nh.content && eh?.refs?.length === nh.refs.length && eh?.tags?.length === nh.tags.length) updates.push({ id: existing.id, action: 'unchanged' });\n      else { existing.commit({ content: nh.content, refs: nh.refs, children: nh.children, tags: nh.tags, meta: { ...nh.meta, appliedAt: Date.now() } }); updates.push({ id: existing.id, action: 'updated' }); }\n    } else { graph.add(nb); updates.push({ id: nb.id, action: 'added' }); }\n  }\n  return updates;\n}\n\n// Pure Resolve Imports (No node:path)\nexport function resolveImportsPure(graph, resolvePathFn) {\n  const resolved = [];\n  for (const m of graph.byType('module')) {\n    const head = m.head(); if (!head) continue;\n    let changed = false;\n    const newRefs = head.refs.map(r => {\n      if (r.kind !== 'import' || !r.target.startsWith('.')) return r;\n      const resolvedTarget = resolvePathFn(m.id, r.target);\n      if (resolvedTarget && graph.has(resolvedTarget)) { changed = true; return { ...r, target: resolvedTarget, originalTarget: r.target }; }\n      return r;\n    });\n    if (changed) { m.commit({ content: head.content, refs: newRefs, children: head.children, tags: head.tags, meta: { ...head.meta, importsResolved: true } }); resolved.push(m.id); }\n  }\n  return resolved;\n}\n\n// ============================================================\n// Constraint / Observation\n// ============================================================\n\nexport function constraintBlock({ id, axes, values, derive, tags = [] }) {\n  if (typeof derive !== 'function') throw new Error('derive must be a function');\n  const worlds = [];\n  function* gen(idx, current) {\n    if (idx === axes.length) { yield current; return; }\n    const axis = axes[idx];\n    for (const v of values[axis]) yield* gen(idx + 1, { ...current, [axis]: v });\n  }\n  for (const w of gen(0, {})) {\n    const derived = derive(w) || {};\n    worlds.push({ ...w, ...derived });\n  }\n  const b = new Block({ id, type: 'constraint', meta: { axes } });\n  b.commit({ content: JSON.stringify({ axes, values, worlds }), tags: ['constraint', ...tags] });\n  return b;\n}\n\nexport function evalConstraint(block, filter = {}) {\n  const data = JSON.parse(block.content);\n  if (!Array.isArray(data.worlds)) throw new Error('evalConstraint: constraint content must include materialized worlds');\n  const worlds = [];\n  for (const w of data.worlds) {\n    let pass = true; for (const [k, v] of Object.entries(filter)) if (!k.startsWith('_') && w[k] !== v) { pass = false; break; }\n    if (pass) worlds.push(w);\n  }\n  return worlds.length === 0 ? { _contradiction: true } : { _worlds: worlds.length, worlds };\n}\n\nexport function observationBlock({ id, observedId, snapshot, tags = [] }) {\n  const b = new Block({ id, type: 'observation', meta: { observedId } });\n  b.commit({ content: JSON.stringify(snapshot), refs: [{ kind: 'observes', target: observedId }], tags: ['observation', ...tags] });\n  return b;\n}\n",
      "ts": 1779711547023,
      "refs": [
        {
          "kind": "calls",
          "target": "hashVersion"
        },
        {
          "kind": "calls",
          "target": "Error"
        },
        {
          "kind": "calls",
          "target": "makeVersion"
        },
        {
          "kind": "calls",
          "target": "Set"
        },
        {
          "kind": "calls",
          "target": "refKey"
        },
        {
          "kind": "calls",
          "target": "predicate"
        },
        {
          "kind": "calls",
          "target": "sameRefs"
        },
        {
          "kind": "calls",
          "target": "sameArr"
        },
        {
          "kind": "calls",
          "target": "Block"
        },
        {
          "kind": "calls",
          "target": "Map"
        },
        {
          "kind": "calls",
          "target": "enable"
        },
        {
          "kind": "calls",
          "target": "checkBraces"
        },
        {
          "kind": "calls",
          "target": "RegExp"
        },
        {
          "kind": "calls",
          "target": "Graph"
        },
        {
          "kind": "calls",
          "target": "findFunctionBody"
        },
        {
          "kind": "calls",
          "target": "matchBrace"
        },
        {
          "kind": "calls",
          "target": "pushBlock"
        },
        {
          "kind": "calls",
          "target": "matchPair"
        },
        {
          "kind": "calls",
          "target": "isRegexContext"
        },
        {
          "kind": "calls",
          "target": "skipRegex"
        },
        {
          "kind": "calls",
          "target": "matchParen"
        },
        {
          "kind": "calls",
          "target": "nodeId"
        },
        {
          "kind": "calls",
          "target": "collect"
        },
        {
          "kind": "calls",
          "target": "virtualHeavy"
        },
        {
          "kind": "calls",
          "target": "virtualApply"
        },
        {
          "kind": "calls",
          "target": "expandVirtualHeavy"
        },
        {
          "kind": "calls",
          "target": "summarizeUpdates"
        },
        {
          "kind": "calls",
          "target": "expand"
        },
        {
          "kind": "calls",
          "target": "parseJS"
        },
        {
          "kind": "calls",
          "target": "resolvePathFn"
        },
        {
          "kind": "calls",
          "target": "gen"
        },
        {
          "kind": "calls",
          "target": "derive"
        }
      ],
      "tags": [],
      "applyId": "apply-2026-05-25-5d816bef",
      "hash": "5375a16b1797dabe67d7ad64526711ca30bb00bfe2e9f0a53372a8664b85b628",
      "prevHash": "74f28695b4114c4d26a9bd947789ffa067c922f57c469f28f7168f3c9080b77a"
    }
  ],
  "notes": {
    "apply:apply-2026-05-25-5d816bef": [
      {
        "id": "n-4f826be6-efdf-4007-ad30-c30e8d2624cb",
        "author": "human",
        "ts": 1779711547039,
        "text": "A9: materialize constraint worlds without runtime code generation"
      }
    ]
  }
};

// === HEAD ===
// ai-desk-core.js
// Pure domain logic for ai-desk v2 (Platform Agnostic)
//
// This file contains the core data structures and logic for Block-based 
// code management. It has ZERO dependencies on Node.js or any other runtime.
// It can run in Browsers, Deno, Bun, or any standard JS environment.

// ============================================================
// Version — Block の状態スナップショット(これが REAL)
// ============================================================

export function makeVersion({ content, refs = [], children = [], tags = [], meta = {} }, prev = null) {
  const v = {
    timestamp: Date.now(),
    prevHash: prev ? prev.hash : null,
    content,
    refs,
    children,
    tags,
    meta,
  };
  v.hash = hashVersion(v);
  return v;
}

// refs / 配列の浅い比較(applyPatch の unchanged 判定用)
export function sameArr(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function sameRefs(a, b) {
  if (a.length !== b.length) return false;
  const key = r => `${r.kind}:${r.target}`;
  const aKeys = a.map(key).sort();
  const bKeys = b.map(key).sort();
  for (let i = 0; i < aKeys.length; i++) if (aKeys[i] !== bKeys[i]) return false;
  return true;
}

// 軽量 FNV-1a 32bit。Zero-Dep。
export function hashVersion(v) {
  const { hash, ...rest } = v;
  const stable = JSON.stringify(rest, Object.keys(rest).sort());
  let h = 0x811c9dc5;
  for (let i = 0; i < stable.length; i++) {
    h ^= stable.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// ============================================================
// Block — versions の羅列が本体
// ============================================================

export class Block {
  constructor({ id, type, versions = [], meta = {} }) {
    if (!id) throw new Error('Block requires id');
    if (!type) throw new Error('Block requires type');
    this.id = id;
    this.type = type;
    this.versions = versions;
    this.meta = meta;
  }

  commit({ content = null, refs = [], children = [], tags = [], meta = {} } = {}) {
    const prev = this.head();
    const v = makeVersion({ content, refs, children, tags, meta }, prev);
    this.versions.push(v);
    return v;
  }

  head() {
    return this.versions.length > 0 ? this.versions[this.versions.length - 1] : null;
  }

  at(timestamp) {
    let result = null;
    for (const v of this.versions) {
      if (v.timestamp > timestamp) break;
      result = v;
    }
    return result;
  }

  get content() { return this.head()?.content ?? null; }
  get refs()    { return this.head()?.refs    ?? []; }
  get children(){ return this.head()?.children?? []; }
  get tags()    { return this.head()?.tags    ?? []; }

  hasTag(tag) { return this.tags.includes(tag); }
  hasAllTags(tags) { return tags.every(t => this.tags.includes(t)); }
  hasAnyTag(tags) { return tags.some(t => this.tags.includes(t)); }

  verify() {
    for (let i = 0; i < this.versions.length; i++) {
      const v = this.versions[i];
      const expectedPrev = i === 0 ? null : this.versions[i - 1].hash;
      if (v.prevHash !== expectedPrev) {
        return { ok: false, brokenAt: i, reason: 'prevHash mismatch' };
      }
      if (v.hash !== hashVersion(v)) {
        return { ok: false, brokenAt: i, reason: 'hash mismatch' };
      }
    }
    return { ok: true };
  }

  diff(i, j) {
    if (this.versions.length < 2) return null;
    if (i == null) i = this.versions.length - 2;
    if (j == null) j = this.versions.length - 1;
    const a = this.versions[i];
    const b = this.versions[j];
    if (!a || !b) return null;
    const refKey = r => `${r.kind}:${r.target}`;
    const aRefs = new Set(a.refs.map(refKey));
    const bRefs = new Set(b.refs.map(refKey));
    return {
      contentChanged: a.content !== b.content,
      content: { from: a.content, to: b.content },
      refsAdded: b.refs.filter(r => !aRefs.has(refKey(r))),
      refsRemoved: a.refs.filter(r => !bRefs.has(refKey(r))),
      tagsAdded: b.tags.filter(t => !a.tags.includes(t)),
      tagsRemoved: a.tags.filter(t => !b.tags.includes(t)),
      timeDelta: b.timestamp - a.timestamp,
    };
  }

  blame(predicate) {
    for (let i = 0; i < this.versions.length; i++) {
      const v = this.versions[i];
      if (predicate(v)) return { version: v, index: i };
    }
    return null;
  }

  blameRef(target, kind = null) {
    return this.blame(v =>
      v.refs.some(r => r.target === target && (kind == null || r.kind === kind))
    );
  }

  applyPatch(content, opts = {}) {
    const head = this.head();
    if (head && head.content === content
        && (opts.refs == null || sameRefs(opts.refs, head.refs))
        && (opts.tags == null || sameArr(opts.tags, head.tags))) {
      return { action: 'unchanged', block: this };
    }
    this.commit({
      content,
      refs: opts.refs ?? head?.refs ?? [],
      children: opts.children ?? head?.children ?? [],
      tags: opts.tags ?? head?.tags ?? [],
      meta: { ...(head?.meta ?? {}), ...(opts.meta ?? {}), appliedAt: Date.now() },
    });
    return { action: head ? 'updated' : 'created', block: this };
  }

  rollback(versionIndex) {
    const target = this.versions[versionIndex];
    if (!target) throw new Error(`no such version: ${versionIndex}`);
    return this.commit({
      content: target.content,
      refs: target.refs,
      children: target.children,
      tags: target.tags,
      meta: { ...target.meta, rollbackFrom: target.hash, rollbackIndex: versionIndex },
    });
  }

  toJSON() {
    return { id: this.id, type: this.type, versions: this.versions, meta: this.meta };
  }

  static fromJSON(json) {
    return new Block({
      id: json.id,
      type: json.type,
      versions: json.versions || [],
      meta: json.meta || {},
    });
  }
}

// ============================================================
// Graph — Block の集合 + 双方向走査
// ============================================================

export class Graph {
  constructor(blocks = []) {
    this.blocks = new Map();
    for (const b of blocks) this.add(b);
  }

  add(block) {
    if (!(block instanceof Block)) block = Block.fromJSON(block);
    this.blocks.set(block.id, block);
    return this;
  }

  get(id) { return this.blocks.get(id); }
  has(id) { return this.blocks.has(id); }
  remove(id) { return this.blocks.delete(id); }

  ids() { return Array.from(this.blocks.keys()); }
  all() { return Array.from(this.blocks.values()); }

  byTag(tag)         { return this.all().filter(b => b.hasTag(tag)); }
  byAllTags(tags)    { return this.all().filter(b => b.hasAllTags(tags)); }
  byAnyTag(tags)     { return this.all().filter(b => b.hasAnyTag(tags)); }
  byType(type)       { return this.all().filter(b => b.type === type); }

  lint(opts = {}) {
    const enable = key => opts[key] !== false;
    const issues = [];
    const ids = new Set(this.blocks.keys());

    if (enable('broken')) {
      for (const b of this.blocks.values()) {
        for (const r of b.refs) {
          if (r.kind === 'import') {
            const isExternal = !r.target.startsWith('.') && !r.target.startsWith('/');
            if (isExternal || r.target.startsWith('.')) continue;
          }
          if (!ids.has(r.target)) {
            issues.push({ kind: 'broken-ref', from: b.id, ref: r });
          }
        }
      }
    }

    if (enable('orphan')) {
      for (const b of this.blocks.values()) {
        if (b.type === 'module') continue;
        if (this.backward(b.id).length === 0) {
          issues.push({ kind: 'orphan', id: b.id, type: b.type });
        }
      }
    }

    if (enable('circular')) {
      for (const b of this.blocks.values()) {
        const cycle = this._findCycle(b.id);
        if (cycle) issues.push({ kind: 'circular', cycle });
      }
    }

    if (enable('brace')) {
      for (const b of this.blocks.values()) {
        if (!b.content) continue;
        const r = checkBraces(b.content);
        if (r) issues.push({ kind: 'brace-mismatch', id: b.id, ...r });
      }
    }

    if (enable('calls')) {
      const moduleNameMap = new Map();
      for (const b of this.blocks.values()) {
        if (!b.meta?.name) continue;
        if (b.type !== 'function' && b.type !== 'class') continue;
        const moduleId = b.id.split(':').slice(0, -2).join(':');
        if (!moduleNameMap.has(moduleId)) moduleNameMap.set(moduleId, new Map());
        moduleNameMap.get(moduleId).set(b.meta.name, b.id);
      }
      for (const b of this.blocks.values()) {
        if (!b.content || !b.meta?.name) continue;
        const moduleId = b.id.split(':').slice(0, -2).join(':');
        const peers = moduleNameMap.get(moduleId);
        if (!peers) continue;
        const declared = new Set(b.refs.filter(r => r.kind === 'calls').map(r => r.target));
        for (const [name, id] of peers) {
          if (id === b.id) continue;
          const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(`);
          if (re.test(b.content) && !declared.has(id)) {
            issues.push({ kind: 'calls-leak', from: b.id, missing: id, name });
          }
        }
      }
    }

    if (enable('tags')) {
      for (const b of this.blocks.values()) {
        if (b.type === 'function' && !b.tags.includes('function')) {
          issues.push({ kind: 'tag-mismatch', id: b.id, expected: 'function', actual: b.tags });
        }
        if (b.type === 'class' && !b.tags.includes('class')) {
          issues.push({ kind: 'tag-mismatch', id: b.id, expected: 'class', actual: b.tags });
        }
      }
    }

    if (enable('empty')) {
      for (const b of this.blocks.values()) {
        if (b.type === 'module') continue;
        if (!b.content && b.refs.length === 0 && b.children.length === 0) {
          issues.push({ kind: 'empty-block', id: b.id });
        }
      }
    }

    if (enable('hash')) {
      for (const b of this.blocks.values()) {
        const r = b.verify();
        if (!r.ok) {
          issues.push({ kind: 'hash-broken', id: b.id, reason: r.reason, brokenAt: r.brokenAt });
        }
      }
    }

    return issues;
  }

  _findCycle(startId, path = [], localVisited = new Set()) {
    if (path.includes(startId)) return [...path, startId].slice(path.indexOf(startId));
    if (localVisited.has(startId)) return null;
    localVisited.add(startId);
    const next = this.forward(startId);
    for (const b of next) {
      const cycle = this._findCycle(b.id, [...path, startId], localVisited);
      if (cycle) return cycle;
    }
    return null;
  }

  search(query, opts = {}) {
    const { type = null, tag = null, includeOldVersions = false } = opts;
    const re = query instanceof RegExp ? query : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const result = [];
    for (const b of this.blocks.values()) {
      if (type && b.type !== type) continue;
      if (tag && !b.hasTag(tag)) continue;
      if (includeOldVersions) {
        for (let i = 0; i < b.versions.length; i++) {
          if (b.versions[i].content && re.test(b.versions[i].content)) {
            result.push({ block: b, versionIndex: i });
          }
        }
      } else {
        if (b.content && re.test(b.content)) {
          result.push({ block: b, versionIndex: b.versions.length - 1 });
        }
      }
    }
    return result;
  }

  forward(id, kind = null) {
    const b = this.blocks.get(id);
    if (!b) return [];
    return b.refs.filter(r => kind == null || r.kind === kind).map(r => this.blocks.get(r.target)).filter(x => x != null);
  }

  backward(id, kind = null) {
    const result = [];
    for (const b of this.blocks.values()) {
      if (b.id === id) continue;
      const hit = b.refs.some(r => r.target === id && (kind == null || r.kind === kind));
      if (hit) result.push(b);
    }
    return result;
  }

  impact(id, kind = null, visited = new Set()) {
    if (visited.has(id)) return [];
    visited.add(id);
    const direct = this.backward(id, kind);
    const result = [...direct];
    for (const b of direct) result.push(...this.impact(b.id, kind, visited));
    return result;
  }

  at(timestamp) {
    const snapshot = new Graph();
    for (const b of this.blocks.values()) {
      const v = b.at(timestamp);
      if (v == null) continue;
      const cloned = new Block({
        id: b.id, type: b.type, meta: b.meta,
        versions: b.versions.filter(x => x.timestamp <= timestamp),
      });
      snapshot.add(cloned);
    }
    return snapshot;
  }

  toJSON() { return Array.from(this.blocks.values()).map(b => b.toJSON()); }
  static fromJSON(json) { return new Graph(json.map(Block.fromJSON)); }
  verify() {
    for (const b of this.blocks.values()) {
      const r = b.verify();
      if (!r.ok) return { ok: false, blockId: b.id, ...r };
    }
    return { ok: true };
  }
}

// ============================================================
// Parse — JS ソースから Block を抽出
// ============================================================

export function parseJS(source, moduleId = 'mod') {
  const blocks = [];
  const moduleBlock = new Block({ id: moduleId, type: 'module', meta: { source: moduleId } });
  const imports = [];
  for (const m of source.matchAll(/(?:^|(?<=[;}]))\s*import\s+[^'"]*['"]([^'"]+)['"]/gm)) {
    imports.push({ kind: 'import', target: m[1] });
  }

  for (const m of source.matchAll(/(?:^|(?<=[;}{]))\s*(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s*\*?\s+(\w+)\s*\(/gm)) {
    const name = m[1];
    const bodyStart = findFunctionBody(source, m.index);
    if (bodyStart < 0) continue;
    const end = matchBrace(source, bodyStart);
    const content = source.slice(m.index, end + 1);
    const head = m[0];
    const tags = ['function'];
    if (/\basync\b/.test(head)) tags.push('async');
    if (/\bexport\b/.test(head)) tags.push('export');
    if (/function\s*\*/.test(head)) tags.push('generator');
    tags.push(...extractInlineTags(source, m.index));
    pushBlock(blocks, moduleId, 'function', name, content, tags);
  }

  for (const m of source.matchAll(/(?:^|(?<=[;}{]))\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/gm)) {
    const name = m[1];
    const bodyStart = findFunctionBody(source, m.index);
    if (bodyStart < 0) continue;
    const end = matchBrace(source, bodyStart);
    const content = source.slice(m.index, end + 1);
    const head = m[0];
    const tags = ['function', 'arrow'];
    if (/\basync\b/.test(head)) tags.push('async');
    if (/\bexport\b/.test(head)) tags.push('export');
    tags.push(...extractInlineTags(source, m.index));
    pushBlock(blocks, moduleId, 'function', name, content, tags);
  }

  for (const m of source.matchAll(/(?:^|(?<=[;}{]))\s*(?:export\s+(?:default\s+)?)?class\s+(\w+)/gm)) {
    const name = m[1];
    const bodyStart = source.indexOf('{', m.index);
    if (bodyStart < 0) continue;
    const end = matchBrace(source, bodyStart);
    const content = source.slice(m.index, end + 1);
    const head = m[0];
    const tags = ['class'];
    if (/\bexport\b/.test(head)) tags.push('export');
    if (/\bdefault\b/.test(head)) tags.push('default');
    tags.push(...extractInlineTags(source, m.index));
    pushBlock(blocks, moduleId, 'class', name, content, tags);
  }

  const nameToId = new Map(blocks.map(b => [b.meta.name, b.id]));
  for (const b of blocks) {
    const calls = new Set();
    for (const [name, id] of nameToId) {
      if (id === b.id) continue;
      const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(`);
      if (re.test(b.content)) calls.add(id);
    }
    if (calls.size === 0) continue;
    const head = b.head();
    b.commit({
      content: head.content,
      refs: [...head.refs, ...Array.from(calls).map(target => ({ kind: 'calls', target }))],
      children: head.children,
      tags: head.tags,
      meta: head.meta,
    });
  }

  moduleBlock.commit({ content: null, refs: [...imports, ...blocks.map(b => ({ kind: 'contains', target: b.id }))] });
  return [moduleBlock, ...blocks];
}

function pushBlock(arr, moduleId, type, name, content, tags = []) {
  const prefix = type === 'class' ? 'class' : 'fn';
  const id = `${moduleId}:${prefix}:${name}`;
  if (arr.some(b => b.id === id)) return;
  const b = new Block({ id, type, meta: { name } });
  b.commit({ content, tags });
  arr.push(b);
}

export function extractInlineTags(source, declStart) {
  const tags = new Set();
  let lineEnd = source.lastIndexOf('\n', declStart - 1);
  for (let i = 0; i < 20 && lineEnd > 0; i++) {
    const lineStart = source.lastIndexOf('\n', lineEnd - 1) + 1;
    const line = source.slice(lineStart, lineEnd);
    if (!line.trim()) break;
    const emblem = line.match(/\[(?:ai_s_emblem|EMBLEM):([^\s\]]+)\s+\w+/);
    if (emblem) for (const t of emblem[1].split('#').filter(Boolean)) tags.add(t);
    const at = line.match(/@tags\s*[:=]\s*([\w\s,]+)/);
    if (at) for (const t of at[1].split(',').map(s => s.trim()).filter(Boolean)) tags.add(t);
    lineEnd = lineStart - 1;
  }
  return Array.from(tags);
}

export function matchBrace(source, openIdx) { return matchPair(source, openIdx, '{', '}'); }
export function matchParen(source, openIdx) { return matchPair(source, openIdx, '(', ')'); }

export function matchPair(source, openIdx, openCh, closeCh) {
  let depth = 0, inString = null, escape = false, inTemplate = 0;
  for (let i = openIdx; i < source.length; i++) {
    const c = source[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (inString) {
      if (c === inString) inString = null;
      else if (inString === '`' && c === '$' && source[i + 1] === '{') { inTemplate++; i++; }
      continue;
    }
    if (inTemplate > 0 && c === '}') { inTemplate--; continue; }
    if (c === '"' || c === "'" || c === '`') { inString = c; continue; }
    if (c === '/' && source[i + 1] === '/') {
      const nl = source.indexOf('\n', i);
      i = nl < 0 ? source.length : nl;
      continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 1;
      continue;
    }
    if (c === '/' && isRegexContext(source, i)) { i = skipRegex(source, i); continue; }
    if (c === openCh) depth++;
    else if (c === closeCh) { depth--; if (depth === 0) return i; }
  }
  return source.length - 1;
}

function isRegexContext(source, slashIdx) {
  for (let j = slashIdx - 1; j >= 0; j--) {
    const c = source[j];
    if (c === ' ' || c === '\t') continue;
    if (c === '\n') return true;
    if (/[\w$\]\)]/.test(c)) return false;
    return true;
  }
  return true;
}

function skipRegex(source, startIdx) {
  let inClass = false, escape = false;
  for (let i = startIdx + 1; i < source.length; i++) {
    const c = source[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '[') inClass = true;
    else if (c === ']') inClass = false;
    else if (c === '/' && !inClass) {
      let j = i + 1;
      while (j < source.length && /[gimuysd]/.test(source[j])) j++;
      return j - 1;
    }
    if (c === '\n') return i;
  }
  return source.length - 1;
}

export function findFunctionBody(source, declStart) {
  const argStart = source.indexOf('(', declStart);
  if (argStart < 0) return -1;
  const argEnd = matchParen(source, argStart);
  return source.indexOf('{', argEnd);
}

export function checkBraces(content) {
  let depth = 0, inString = null, escape = false, inTemplate = 0;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (inString) {
      if (c === inString) inString = null;
      else if (inString === '`' && c === '$' && content[i + 1] === '{') { inTemplate++; i++; }
      continue;
    }
    if (inTemplate > 0 && c === '}') { inTemplate--; continue; }
    if (c === '"' || c === "'" || c === '`') { inString = c; continue; }
    if (c === '/' && content[i + 1] === '/') {
      const nl = content.indexOf('\n', i);
      i = nl < 0 ? content.length : nl;
      continue;
    }
    if (c === '/' && content[i + 1] === '*') {
      const end = content.indexOf('*/', i + 2);
      i = end < 0 ? content.length : end + 1;
      continue;
    }
    if (c === '/' && isRegexContext(content, i)) { i = skipRegex(content, i); continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth < 0) return { error: 'extra-closing-brace', at: i }; }
  }
  if (depth !== 0) return { error: 'unbalanced-braces', remaining: depth };
  return null;
}

// ============================================================
// parseMD — Markdown を Block に分解
// ============================================================

export function parseMD(source, moduleId = 'doc') {
  const blocks = [];
  const lines = source.split('\n');
  const moduleBlock = new Block({ id: moduleId, type: 'document', meta: { source: moduleId } });
  const sections = [];
  let current = null, inCode = false, codeLang = null, codeBuf = [];

  for (const line of lines) {
    const codeStart = line.match(/^```(\w*)/);
    if (codeStart && !inCode) { inCode = true; codeLang = codeStart[1] || 'text'; codeBuf = []; continue; }
    if (inCode && /^```\s*$/.test(line)) {
      inCode = false;
      if (current) current.codeBlocks.push({ lang: codeLang, content: codeBuf.join('\n') });
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      current = { level: h[1].length, title: h[2].trim(), content: [], codeBlocks: [], refs: [] };
      sections.push(current);
      continue;
    }
    if (current) {
      current.content.push(line);
      for (const m of line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) current.refs.push({ kind: 'link', target: m[2], label: m[1] });
    }
  }

  const slugCount = new Map(), moduleRefs = [];
  for (const s of sections) {
    let slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    const n = (slugCount.get(slug) || 0) + 1; slugCount.set(slug, n);
    if (n > 1) slug = `${slug}-${n}`;
    const id = `${moduleId}:sec:${slug}`;
    const sb = new Block({ id, type: 'section', meta: { title: s.title, level: s.level } });
    const childRefs = [];
    for (let j = 0; j < s.codeBlocks.length; j++) {
      const cb = s.codeBlocks[j], codeId = `${id}:code:${j}`;
      const codeBlock = new Block({ id: codeId, type: 'code', meta: { lang: cb.lang, parent: id } });
      codeBlock.commit({ content: cb.content, tags: ['code', cb.lang] });
      blocks.push(codeBlock);
      childRefs.push({ kind: 'contains', target: codeId });
    }
    sb.commit({ content: s.content.join('\n').trim(), refs: [...s.refs, ...childRefs], tags: ['section', `h${s.level}`] });
    blocks.push(sb);
    moduleRefs.push({ kind: 'contains', target: id });
  }
  moduleBlock.commit({ content: null, refs: moduleRefs });
  return [moduleBlock, ...blocks];
}

// ============================================================
// Mermaid output — Graph を mermaid フローチャートに
// ============================================================

export function exportMermaid(graph, opts = {}) {
  const { kind = null, type = null, maxBlocks = 50 } = opts;
  const lines = ['flowchart LR'];
  const filtered = graph.all().filter(b => !type || b.type === type);
  const visible = filtered.slice(0, maxBlocks);
  const visibleIds = new Set(visible.map(b => b.id));

  for (const b of visible) {
    const short = b.id.split(':').slice(-2).join(':');
    const label = `${short}<br/><i>${b.type}</i>`;
    lines.push(`  ${nodeId(b.id)}["${label.replace(/"/g, "'")}"]`);
  }

  for (const b of visible) {
    for (const r of b.refs) {
      if (kind && r.kind !== kind) continue;
      if (!visibleIds.has(r.target)) continue;
      lines.push(`  ${nodeId(b.id)} -->|${r.kind}| ${nodeId(r.target)}`);
    }
  }

  return lines.join('\n');
}

function nodeId(id) {
  return 'n_' + id.replace(/[^a-zA-Z0-9_]/g, '_');
}

// ============================================================
// inferTags — content から自動的にタグを推論
// ============================================================

export function inferTags(content, type = null) {
  const tags = new Set();
  if (!content) return [];
  if (/\b(test|describe|it)\s*\(\s*['"]/.test(content)) tags.add('test');
  if (/\bassert\b/.test(content)) tags.add('assertion');
  if (/\b(readFileSync|writeFileSync|readFile|writeFile|fs\.)/.test(content)) tags.add('io');
  if (/\bfetch\s*\(|\bXMLHttpRequest\b/.test(content)) tags.add('network');
  if (/\bconsole\./.test(content)) tags.add('logging');
  if (/\basync\b|\bawait\b/.test(content)) tags.add('async');
  if (/\bnew\s+RegExp|\/[^\/\n]+\/[gimuy]*/.test(content)) tags.add('regex');
  if (/\bclass\s+\w+\s+extends\b/.test(content)) tags.add('inheritance');
  if (/\bMap\s*\(|\bSet\s*\(/.test(content)) tags.add('collection');
  if (!/\b(console\.|fs\.|writeFileSync|readFileSync|fetch\(|process\.)/.test(content) && type === 'function') tags.add('pure');
  const numLines = content.split('\n').length;
  if (numLines > 50) tags.add('large');
  if (numLines < 10 && type === 'function') tags.add('small');
  return Array.from(tags);
}

// ============================================================
// Virtual Heavy Function — 仮想重厚関数
// ============================================================

export function virtualHeavy(graph, rootId, opts = {}) {
  const { depth = Infinity, kind = 'calls' } = opts;
  const collected = new Map();
  function collect(id, d) {
    if (collected.has(id) || d > depth) return;
    const b = graph.get(id); if (!b) return;
    collected.set(id, b);
    for (const r of b.refs) if (kind == null || r.kind === kind) collect(r.target, d + 1);
  }
  collect(rootId, 0);
  return Array.from(collected.values());
}

export function expandVirtualHeavy(graph, rootId, opts = {}) {
  const blocks = virtualHeavy(graph, rootId, opts);
  const lines = [`// === Virtual Heavy Function rooted at ${rootId} ===`, `// ${blocks.length} blocks combined into one logical heavy function`, '// Edit the bodies; do not change the boundary headers.', ''];
  for (const b of blocks) {
    lines.push(`// --- BLOCK: ${b.id} (${b.type}) ---`);
    if (b.tags.length) lines.push(`// tags: ${b.tags.join(', ')}`);
    if (b.refs.length) lines.push(`// refs: ${b.refs.map(r => `${r.kind}->${r.target}`).join(', ')}`);
    if (b.content) lines.push(b.content);
    lines.push('');
  }
  lines.push('// === end of virtual heavy ===');
  return lines.join('\n');
}

export function virtualApply(graph, rootId, expandedContent, opts = {}) {
  const heavyBlocks = virtualHeavy(graph, rootId, opts);
  const heavyById = new Map(heavyBlocks.map(b => [b.id, b]));
  const re = /^\s*\/\/\s*---\s*BLOCK:\s*(\S+)\s*\(([^)]+)\)\s*---\s*$/gm;
  const updates = [];
  let m, lastEnd = 0, lastId = null;
  while ((m = re.exec(expandedContent)) !== null) {
    if (lastId) {
      const body = expandedContent.slice(lastEnd, m.index).replace(/\n?\/\/\s*===\s*end of virtual heavy\s*===\s*$/, '').replace(/^\s*\/\/\s*(tags|refs):.*$/gm, '').trim();
      const target = heavyById.get(lastId);
      if (target) updates.push({ id: lastId, ...target.applyPatch(body) });
      else updates.push({ id: lastId, action: 'skipped-out-of-scope' });
    }
    lastId = m[1]; lastEnd = m.index + m[0].length;
  }
  if (lastId) {
    const body = expandedContent.slice(lastEnd).replace(/\n?\/\/\s*===\s*end of virtual heavy\s*===\s*$/, '').replace(/^\s*\/\/\s*(tags|refs):.*$/gm, '').trim();
    const target = heavyById.get(lastId);
    if (target) updates.push({ id: lastId, ...target.applyPatch(body) });
    else updates.push({ id: lastId, action: 'skipped-out-of-scope' });
  }
  return updates;
}

export function heavyApply(graph, rootId, expandedContent, opts = {}) {
  const updates = virtualApply(graph, rootId, expandedContent, opts);
  const expanded = expandVirtualHeavy(graph, rootId, opts);
  return {
    updates,
    expanded,
    stats: summarizeUpdates(updates),
    blocks: virtualHeavy(graph, rootId, opts).length,
  };
}

function summarizeUpdates(updates) {
  const stats = {};
  for (const u of updates) stats[u.action] = (stats[u.action] || 0) + 1;
  return stats;
}

// ============================================================
// Codegen — Graph から JS ファイルを再生成
// ============================================================

export function exportModule(graph, moduleId) {
  const m = graph.get(moduleId); if (!m || m.type !== 'module') throw new Error(`invalid module: ${moduleId}`);
  const lines = [];
  for (const r of m.refs.filter(r => r.kind === 'import')) lines.push(`import './${(r.originalTarget || r.target).replace(/^\.\//, '')}';`);
  if (lines.length) lines.push('');
  for (const r of m.refs.filter(r => r.kind === 'contains')) {
    const child = graph.get(r.target);
    if (child && child.content) { lines.push(child.content); lines.push(''); }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// ============================================================
// Stats / Context / Block Apply
// ============================================================

export function graphStats(graph) {
  const all = graph.all();
  const byType = {}, byTag = {};
  let v = 0, r = 0, c = 0;
  for (const b of all) {
    byType[b.type] = (byType[b.type] || 0) + 1;
    for (const t of b.tags) byTag[t] = (byTag[t] || 0) + 1;
    v += b.versions.length; r += b.refs.length; if (b.content) c += b.content.length;
  }
  return { blocks: all.length, versions: v, refs: r, contentChars: c, avgVersions: +(v/all.length||0).toFixed(2), avgRefs: +(r/all.length||0).toFixed(2), byType, byTag };
}

export function blockContext(graph, blockId, opts = {}) {
  const { depth = 1, includeBackward = true, includeForward = true } = opts;
  const target = graph.get(blockId); if (!target) throw new Error(`not found: ${blockId}`);
  const collected = new Map(); collected.set(target.id, target);
  function expand(id, d) {
    if (d >= depth) return;
    const n = []; if (includeForward) n.push(...graph.forward(id)); if (includeBackward) n.push(...graph.backward(id));
    for (const b of n) if (!collected.has(b.id)) { collected.set(b.id, b); expand(b.id, d + 1); }
  }
  expand(blockId, 0); return Array.from(collected.values());
}

export function formatContextForLLM(blocks, targetId) {
  const lines = [`# Context for ${targetId}\nTotal ${blocks.length} blocks.\n`];
  for (const b of blocks) {
    lines.push(`## ${b.id === targetId ? '⭐ ' : ''}${b.id}\n- type: ${b.type}${b.tags.length ? `\n- tags: ${b.tags.join(', ')}` : ''}\n- versions: ${b.versions.length}`);
    if (b.refs.length) lines.push(`- refs:\n${b.refs.map(r => `  - ${r.kind} → ${r.target}`).join('\n')}`);
    if (b.content) lines.push(`\n\`\`\`js\n${b.content}\n\`\`\`\n`);
  }
  return lines.join('\n');
}

export function applyToBlock(graph, blockId, content, opts = {}) {
  const b = graph.get(blockId); if (!b) throw new Error(`not found: ${blockId}`);
  return b.applyPatch(content, opts);
}

export function applyBlockSmart(graph, blockId, content) {
  const target = graph.get(blockId); if (!target) throw new Error(`not found: ${blockId}`);
  const parsed = parseJS(content, `__patch__${Date.now()}`);
  const fnBlock = parsed.find(b => b.type !== 'module');
  if (!fnBlock) return target.applyPatch(content);
  return target.applyPatch(fnBlock.content, { refs: fnBlock.refs.filter(r => r.kind !== 'calls'), tags: fnBlock.tags });
}

export function applyPatch(graph, source, moduleId) {
  const patched = parseJS(source, moduleId), updates = [];
  for (const nb of patched) {
    const existing = graph.get(nb.id), nh = nb.head(); if (!nh) continue;
    if (existing) {
      const eh = existing.head();
      if (eh?.content === nh.content && eh?.refs?.length === nh.refs.length && eh?.tags?.length === nh.tags.length) updates.push({ id: existing.id, action: 'unchanged' });
      else { existing.commit({ content: nh.content, refs: nh.refs, children: nh.children, tags: nh.tags, meta: { ...nh.meta, appliedAt: Date.now() } }); updates.push({ id: existing.id, action: 'updated' }); }
    } else { graph.add(nb); updates.push({ id: nb.id, action: 'added' }); }
  }
  return updates;
}

// Pure Resolve Imports (No node:path)
export function resolveImportsPure(graph, resolvePathFn) {
  const resolved = [];
  for (const m of graph.byType('module')) {
    const head = m.head(); if (!head) continue;
    let changed = false;
    const newRefs = head.refs.map(r => {
      if (r.kind !== 'import' || !r.target.startsWith('.')) return r;
      const resolvedTarget = resolvePathFn(m.id, r.target);
      if (resolvedTarget && graph.has(resolvedTarget)) { changed = true; return { ...r, target: resolvedTarget, originalTarget: r.target }; }
      return r;
    });
    if (changed) { m.commit({ content: head.content, refs: newRefs, children: head.children, tags: head.tags, meta: { ...head.meta, importsResolved: true } }); resolved.push(m.id); }
  }
  return resolved;
}

// ============================================================
// Constraint / Observation
// ============================================================

export function constraintBlock({ id, axes, values, derive, tags = [] }) {
  if (typeof derive !== 'function') throw new Error('derive must be a function');
  const worlds = [];
  function* gen(idx, current) {
    if (idx === axes.length) { yield current; return; }
    const axis = axes[idx];
    for (const v of values[axis]) yield* gen(idx + 1, { ...current, [axis]: v });
  }
  for (const w of gen(0, {})) {
    const derived = derive(w) || {};
    worlds.push({ ...w, ...derived });
  }
  const b = new Block({ id, type: 'constraint', meta: { axes } });
  b.commit({ content: JSON.stringify({ axes, values, worlds }), tags: ['constraint', ...tags] });
  return b;
}

export function evalConstraint(block, filter = {}) {
  const data = JSON.parse(block.content);
  if (!Array.isArray(data.worlds)) throw new Error('evalConstraint: constraint content must include materialized worlds');
  const worlds = [];
  for (const w of data.worlds) {
    let pass = true; for (const [k, v] of Object.entries(filter)) if (!k.startsWith('_') && w[k] !== v) { pass = false; break; }
    if (pass) worlds.push(w);
  }
  return worlds.length === 0 ? { _contradiction: true } : { _worlds: worlds.length, worlds };
}

export function observationBlock({ id, observedId, snapshot, tags = [] }) {
  const b = new Block({ id, type: 'observation', meta: { observedId } });
  b.commit({ content: JSON.stringify(snapshot), refs: [{ kind: 'observes', target: observedId }], tags: ['observation', ...tags] });
  return b;
}

// === /HEAD ===
