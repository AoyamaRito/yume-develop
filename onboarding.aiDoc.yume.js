// @yume-format: 1

export const __block = {
  "id": "onboarding",
  "type": "aiDoc",
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
      "hash": "2eab991c54ac5f6a5ab64a92031cfe87ee4ee2187da99d3b6b42d06af0541163",
      "prevHash": null,
      "content": "// v2/AiRunAndRead_ONBOARDING.js\n// AI Onboarding v2 — LLM が ai-desk で作業するときのルール集\n//\n// ⚠️ ファイル名 prefix `AiRunAndRead_` の意味:\n//   1. `node AiRunAndRead_ONBOARDING.js` で実行 → 出力を読め\n//   2. or `import { Rules, Forbidden, ... } from './AiRunAndRead_ONBOARDING.js'`\n//   ⛔ .js ソースを prose として linear に読むな\n//\n// **canonical form**: this file (.js) ← REAL\n// **正典**: AiRunAndRead_BIBLE.js(公理 A0〜A13)を補完する運用マニュアル\n// **対象読者**: LLM(Claude / GPT / Gemini)。人間向けではない。\n\nimport { Axioms } from './bible.aiDoc.yume.js';\n\nexport const VERSION = \"2.6\";\nexport const DATE = \"2026-05-04\";\n\n// ============================================================\n// §0 最初に把握する情報(file map + stderr hint policy)\n// ============================================================\nexport const StartHere = {\n  files: [\n    { path: 'AiRunAndRead_BIBLE.js', purpose: '思想の正典(公理 A0〜A13)' },\n    { path: 'ai-desk.js + ai-desk-core.js', purpose: '実装 split。core = pure logic(Block/Graph/parseJS)、ai-desk = CLI shell。Zero-Dep ~1.2k 行' },\n    { path: 'e2e.js', purpose: '114 e2e テスト。新機能追加時にここに 1 件以上追加' },\n    { path: '3d-prefab/', purpose: 'A10/A11 + heartbeat/flow/Shadow_for_Flow の voxel editor demo(55 tests)' },\n    { path: 'package.json', purpose: '`npm test` で e2e、type:\"module\"(ESM)' },\n    { path: '3dplus/', purpose: 'CPU 3D Twin(81 tests, CommonJS)。3D / WebGL コードを扱う際は突合層として参照' },\n    { path: 'eyes/', purpose: 'AI-Eyes 観測ハーネス(in-memory virtual canvas、draw_op log)' },\n  ],\n  stderrHintPolicy:\n    \"ai-desk.js は CLI 実行時、コードの状態を観察して **stderr に 1 度だけ hint** を流す\" +\n    \"(例: WebGL/Matrix4 検出 → `3dplus/` への routing)。\" +\n    \"状態は cwd の `.ai-desk-state.json` に記録、二度目以降は静か。\" +\n    \"hint が出たら指示先のドキュメントを実際に読む。\",\n};\n\n// ============================================================\n// §1 絶対に守る禁忌(これを破ったらコミットしない)\n//   各禁忌は { rule, why, axiom_ref } の構造化データ\n// ============================================================\nexport const Forbidden = [\n  { id: 1, rule: \"TypeScript を導入しない\",                            why: \"型情報による隠匿排除\",     axiom_ref: 'A0' },\n  { id: 2, rule: \"npm install で外部依存を入れない\",                    why: \"Eternal Compatibility\",   axiom_ref: 'Bible§3' },\n  { id: 3, rule: \"build / transpile step を作らない\",                   why: \"ソース = 実行ファイル\",   axiom_ref: 'Bible§3' },\n  { id: 4, rule: \"フレームワーク(React 等)を入れない\",                  why: \"暗黙の規約は隠匿の温床\", axiom_ref: 'A0' },\n  { id: 5, rule: \"コメントマーカー(// [ai_s_emblem:...])を新規に書かない\", why: \"マーカー廃止、tags は // @tags: で書く\", axiom_ref: 'Bible§4' },\n  { id: 6, rule: \"Block.versions を直接書き換えない、commit() 経由のみ\", why: \"REAL の append-only 性\",  axiom_ref: 'A4, A6' },\n  { id: 7, rule: \"Block.content / refs / tags を変数化しない\",          why: \"SHADOW 規約\",             axiom_ref: 'A3, A6' },\n  { id: 8, rule: \"「人間の見やすさ」で判断しない\",                       why: \"LLM 視点の情報密度で判断\", axiom_ref: 'A0, A7' },\n];\n\n// ============================================================\n// §1.5 REAL_* variable convention(監視対象 state の命名)\n// ============================================================\nexport const RealVariableRules = {\n  rule: \"`REAL_*` は、AI / Kantoku が監視すべき実行 JS の「正の状態」にだけ付ける。\",\n  why:\n    \"REAL_* があると、初期化時 AST bootstrap / 実行 trace / eyes_check / prompt 生成の対象を狭められる。\" +\n    \"全変数を監視せず、状態バグの根だけを追うための接頭語。\" +\n    \"AST が返す性質名は `isWatched`。`check` は検査実行の名前に限定する。\",\n  use_for: [\n    \"アプリの主要 state\",\n    \"dispatch / reducer 後に更新される state\",\n    \"render / eyes / test の入力になる state\",\n    \"変化しないと state_frozen と判断できる state\",\n  ],\n  do_not_use_for: [\n    \"一時値\",\n    \"DOM 要素\",\n    \"derived view / cache\",\n    \"単なる定数\",\n    \"loop counter\",\n  ],\n  example: `\nlet REAL_state = initialState();\nREAL_state = dispatch(REAL_state, evt);\nrender(ctx, REAL_state);\n  `,\n};\n\n// ============================================================\n// §2 コード生成ルール(Block を作る / 更新する / 戻す)\n// ============================================================\nexport const BlockOps = {\n  create: {\n    rule: \"新規 Block は `new Block({id, type, meta})` してから `commit()` で初回 version を append。\",\n    naming: \"id は `<moduleId>:<prefix>:<name>` 規約。prefix は 'fn' か 'class'。\",\n    types: ['function', 'class', 'module', 'constraint', 'observation', 'twin'],\n    example: `\nconst b = new Block({ id: 'mod:fn:foo', type: 'function', meta: {} });\nb.commit({ content, refs, children, tags, meta });\n    `,\n  },\n  update: {\n    rule: \"必ず `commit()` で新 version を append。古い version は消さない・触らない。\",\n    pattern: \"head() の値をベースに、変更したい部分だけ差し替えて新 version を作る。\",\n    example: `\nconst head = b.head();\nb.commit({\n  content: head.content,                       // 変更しない\n  refs: [...head.refs, { kind: 'calls', target: 'x' }],  // 追加\n  children: head.children,\n  tags: head.tags,\n  meta: { ...head.meta, reason: 'add x dependency' },\n});\n    `,\n  },\n  rollback: {\n    rule: \"過去に戻すときは `b.rollback(versionIndex)` を使う。履歴を消さず、新 version として commit。\",\n    禁忌: \"b.versions = b.versions.slice(0, n) のような直接削除は禁忌。\",\n  },\n};\n\n// ============================================================\n// §3 parseJS の出力規約\n// ============================================================\nexport const ParseRules = {\n  function:    \"function 宣言 → Block(type:'function')\",\n  arrow:       \"const x = () => {} → Block(type:'function', tags:['arrow'])\",\n  klass:       \"class 宣言 → Block(type:'class')\",\n  imports:     \"import 文 → module Block の refs に { kind:'import', target } で追加\",\n  calls:       \"同モジュール内の関数呼び出し → refs に { kind:'calls', target } で追加\",\n  tagComments: \"直前コメントの // @tags: a, b → tags に取り込み(20 行遡及)\",\n  v1emblems:   \"// [ai_s_emblem:#a#b Name] は互換読み専用、新規記述禁止\",\n  limitations: [\n    \"文字列リテラル中の function キーワードを誤検出する可能性\",\n    \"ネスト関数の捕捉が浅い場合がある\",\n    \"対応が必要なら parseJS 内の正規表現を拡張(将来的に AST 置換)\",\n  ],\n};\n\n// ============================================================\n// §4 Graph 操作の使い分け(やりたいこと → メソッド)\n// ============================================================\nexport const GraphOps = [\n  { intent: \"この関数を変えたら何に影響する?\",   method: \"g.impact(id)\" },\n  { intent: \"この関数を呼んでるのは?\",          method: \"g.backward(id)\" },\n  { intent: \"この関数が呼ぶのは?\",              method: \"g.forward(id)\" },\n  { intent: \"特定の文字列を含む Block は?\",      method: \"g.search('TODO')\" },\n  { intent: \"export されてる Block は?\",        method: \"g.byTag('export')\" },\n  { intent: \"class だけ取りたい\",               method: \"g.byType('class')\" },\n  { intent: \"過去の状態のグラフが見たい\",        method: \"g.at(timestamp)\" },\n  { intent: \"全 Block の整合性チェック\",         method: \"g.verify()\" },\n];\n\n// ============================================================\n// §5 永続化のルール\n// ============================================================\nexport const Persistence = {\n  default_filename: \"graph.json\",\n  derived_filename: \"*.local.json\",\n  rule: [\n    \"saveGraph(graph, path) で JSON 1 ファイルに保存\",\n    \"graph.json と *.local.json は .gitignore 済み\",\n    \"共有が必要な永続データは別名 + レビュー後 commit\",\n  ],\n};\n\n// ============================================================\n// §6 テスト追加のルール\n// ============================================================\nexport const TestingRules = {\n  rule: \"テストは必ず『Top-Down E2E-First』で書くこと。ボトムアップのTDDは禁止。\",\n  workflow: [\n    \"1. 全体のシナリオを定義するE2Eテストを先に書く（意図の宣言）。\",\n    \"2. E2Eを通すための実装を行う。\",\n    \"3. E2E実行時のコードカバレッジを計測し、未通過のBlockや分岐（隙間）を特定する。\",\n    \"4. その隙間を埋めるための単体テストを自律的に追加し、網羅率を上げる。\"\n  ],\n  template: `\ngroup('新機能E2Eシナリオ', () => {\n  test('エンドツーエンドでの期待される振る舞い', () => {\n    // setup / act / assert\n  });\n});\n  `,\n};\n\n// ============================================================\n// §7 CLI コマンド追加のルール\n// ============================================================\nexport const CliExtension = {\n  rule: \"ai-desk.js の runCommand() に case を追加。\",\n  steps: [\n    \"1. case 'mycommand': を実装\",\n    \"2. デフォルトケース(commands list)に追加\",\n    \"3. e2e の CLI group にテスト追加\",\n    \"4. AiRunAndRead_BIBLE.js の Rituals に追加(REFERENCE は BIBLE に統合済)\",\n  ],\n  example: `\ncase 'mycommand': {\n  if (!args[0]) return console.error('usage: mycommand <arg>');\n  // 実装\n  break;\n}\n  `,\n};\n\nexport const HeavyApplyRules = {\n  rule: \"`heavy-apply` は `virtual-apply` 後に同じ root / depth で再展開する。AI が編集後の heavy view を即再読するための編集ループ。\",\n  command: \"node ai-desk.js heavy-apply graph.json <root-id> heavy.txt --depth=N --out=heavy.after.txt\",\n  stdout: \"--out 無しなら再展開 heavy content を stdout。ログは stderr。\",\n  warning: \"expand 時と heavy-apply 時の --depth を必ず揃える。\",\n};\n\n// ============================================================\n// §8 v1(ai-desk legacy)との関係\n// ============================================================\nexport const V1Relation = {\n  rules: [\n    \"v1 の Bible(AI_NATIVE_MASTER_BIBLE.md)は v1 のまま、触らない\",\n    \"v1 emblem マーカーは v2 でも読める(parseJS が tags に取り込む)が、新規記述禁止\",\n    \"v1 と v2 は併存可能。v1 = 固定された過去、v2 = canonical\",\n    \"v1 機能で v2 未移植のもの(focus/apply/check/coverage 等)は段階的に Block 化\",\n  ],\n};\n\n// ============================================================\n// §9 Constraint Folding を書くとき\n// ============================================================\nexport const ConstraintRules = {\n  api: \"constraintBlock({id, axes, values, derive}) → evalConstraint(cb, filter?)\",\n  derive_must_be: \"純粋関数(I/O・乱数・時刻に触れない、Bible §7 Twin 規約と同じ)\",\n  filter: \"浅い等価(merged[k] === v)。範囲条件は derive で派生フラグを作る\",\n  矛盾の表現: \"filter 結果が空集合のとき _contradiction: true で返る\",\n  example: `\nconst cb = constraintBlock({\n  id: 'shipping',\n  axes: ['weight', 'zone'],\n  values: {\n    weight: [0.5, 1, 5, 10],\n    zone: ['kanto', 'kansai', 'kyushu'],\n  },\n  derive: combo => ({\n    fee: ((combo.weight <= 1 ? 300 : 500) +\n          (combo.zone === 'kyushu' ? 200 : 0)),\n  }),\n});\nevalConstraint(cb);                     // 全 12 世界\nevalConstraint(cb, { fee: 700 });       // 該当する組み合わせを逆引き\n  `,\n};\n\n// ============================================================\n// §10 Observation Block を書くとき\n// ============================================================\nexport const ObservationRules = {\n  api: \"observationBlock({id, observedId, snapshot, tags})\",\n  id_convention: \"タイムスタンプ + 連番(時系列の自然な並び)\",\n  snapshot: \"構造化データ(画像バイナリは別途保存して URL で参照)\",\n  refs: \"{ kind: 'observes', target: observedId } が自動付与\",\n  example: `\nobservationBlock({\n  id: 'obs:2026-05-03T10:00Z:001',\n  observedId: 'mod:fn:bar',\n  snapshot: { hp: 50, x: 10 },\n  tags: ['ai-eyes', 'frame'],\n});\n  `,\n};\n\n// ============================================================\n// §11 コミットメッセージの規約\n// ============================================================\nexport const CommitConventions = {\n  format: \"<type>: <summary>\",\n  types: {\n    init:     \"初回コミット\",\n    feat:     \"新機能\",\n    fix:      \"バグ修正\",\n    docs:     \"ドキュメント\",\n    test:     \"テスト追加・修正\",\n    clearify: \"振る舞いを変えない構造調整(AI 向け最適化)\",\n    chore:    \"ビルド・ツール周り\",\n  },\n  example: \"feat(parse): support generator function syntax\",\n};\n\n// ============================================================\n// §12 「迷ったらどうする」(judgment compass)\n// ============================================================\nexport const Compass = [\n  { 迷い: \"Block の type を増やすべきか\",   判断軸: \"既存 type で表現できないか先に検討。新 type は最後の手段。\" },\n  { 迷い: \"関数を分割すべきか\",             判断軸: \"「LLM が一目で全文脈を把握できるか」で決める。基本はインライン化(A1)。\" },\n  { 迷い: \"命名で迷ったとき\",               判断軸: \"動詞 + 目的語で書く。略語は使わない(LLM の学習に負ける)。\" },\n  { 迷い: \"ドキュメントを書くべきか\",        判断軸: \"LLM が読む前提。冗長を恐れない。具体例を必ず添える。\" },\n  { 迷い: \"新 .md を作りたくなった\",         判断軸: \"AI 用なら .md 禁止、AiRunAndRead_*.js を作る。人間用は README のみ。\" },\n];\n\n// ============================================================\n// §13 このドキュメント自体の更新ルール\n// ============================================================\nexport const SelfUpdate = {\n  rule: \"気づいた LLM / 人間は AiRunAndRead_ONBOARDING.js に追記。常に updated。\",\n  commit_format: \"docs(onboarding): ...\",\n  derived_md: \"node v2/AiRunAndRead_ONBOARDING.js export-md > AI_ONBOARDING.md (生成は基本不要、AI は .js 直接読む)\",\n};\n\n// ============================================================\n// Self-display + export-md\n// ============================================================\nexport function exportMarkdown() {\n  const out = [];\n  out.push(`# AI Onboarding v${VERSION}`);\n  out.push(`> Auto-generated from AiRunAndRead_ONBOARDING.js — DO NOT EDIT THIS FILE DIRECTLY.`);\n  out.push(`> Run \\`node v2/AiRunAndRead_ONBOARDING.js export-md > AI_ONBOARDING.md\\` to regenerate.`);\n  out.push(`> Date: ${DATE}\\n`);\n\n  out.push(`## §0 Start Here`);\n  out.push(`### Files to know`);\n  for (const f of StartHere.files) out.push(`- **${f.path}**: ${f.purpose}`);\n  out.push(`\\n### stderr hint policy\\n${StartHere.stderrHintPolicy}\\n`);\n\n  out.push(`## §1 Forbidden(これを破ったらコミットしない)`);\n  for (const f of Forbidden) out.push(`- **${f.id}.** ${f.rule}  _(${f.why}, ${f.axiom_ref})_`);\n  out.push('');\n\n  out.push(`## §1.5 REAL_* Variables`);\n  out.push(RealVariableRules.rule);\n  out.push(`\\nwhy: ${RealVariableRules.why}`);\n  out.push(`\\n### Use For`);\n  for (const r of RealVariableRules.use_for) out.push(`- ${r}`);\n  out.push(`\\n### Do Not Use For`);\n  for (const r of RealVariableRules.do_not_use_for) out.push(`- ${r}`);\n  out.push(`\\n### Example\\n\\`\\`\\`js${RealVariableRules.example}\\`\\`\\`\\n`);\n\n  out.push(`## §2 Block ops`);\n  for (const [op, spec] of Object.entries(BlockOps)) {\n    out.push(`### ${op}`);\n    out.push(spec.rule || '');\n    if (spec.example) out.push('```js' + spec.example + '```');\n  }\n\n  out.push(`## §3 parseJS rules`);\n  for (const [k, v] of Object.entries(ParseRules)) {\n    if (Array.isArray(v)) out.push(`- **${k}**:\\n  - ${v.join('\\n  - ')}`);\n    else out.push(`- **${k}**: ${v}`);\n  }\n  out.push('');\n\n  out.push(`## §4 Graph ops`);\n  for (const o of GraphOps) out.push(`- ${o.intent} → \\`${o.method}\\``);\n  out.push('');\n\n  out.push(`## §5 Persistence`);\n  for (const r of Persistence.rule) out.push(`- ${r}`);\n  out.push('');\n\n  out.push(`## §6 Testing\\n${TestingRules.rule}\\n\\`\\`\\`js${TestingRules.template}\\`\\`\\`\\n`);\n\n  out.push(`## §7 CLI extension\\n${CliExtension.rule}`);\n  for (const s of CliExtension.steps) out.push(`- ${s}`);\n  out.push('');\n\n  out.push(`## §7.5 Heavy Apply Loop`);\n  out.push(HeavyApplyRules.rule);\n  out.push(`- command: \\`${HeavyApplyRules.command}\\``);\n  out.push(`- stdout: ${HeavyApplyRules.stdout}`);\n  out.push(`- warning: ${HeavyApplyRules.warning}`);\n  out.push('');\n\n  out.push(`## §8 v1 relation`);\n  for (const r of V1Relation.rules) out.push(`- ${r}`);\n  out.push('');\n\n  out.push(`## §9 Constraint Folding`);\n  for (const [k, v] of Object.entries(ConstraintRules)) {\n    if (k !== 'example') out.push(`- **${k}**: ${v}`);\n  }\n  out.push('```js' + ConstraintRules.example + '```\\n');\n\n  out.push(`## §10 Observation Block`);\n  for (const [k, v] of Object.entries(ObservationRules)) {\n    if (k !== 'example') out.push(`- **${k}**: ${v}`);\n  }\n  out.push('```js' + ObservationRules.example + '```\\n');\n\n  out.push(`## §11 Commit conventions`);\n  out.push(`format: \\`${CommitConventions.format}\\``);\n  for (const [t, d] of Object.entries(CommitConventions.types)) out.push(`- \\`${t}\\`: ${d}`);\n  out.push(`example: \\`${CommitConventions.example}\\`\\n`);\n\n  out.push(`## §12 Compass(迷ったときの判断軸)`);\n  for (const c of Compass) out.push(`- **${c.迷い}** → ${c.判断軸}`);\n  out.push('');\n\n  out.push(`## §13 Self-update\\n${SelfUpdate.rule}\\ncommit format: \\`${SelfUpdate.commit_format}\\``);\n\n  return out.join('\\n');\n}\n\nif (typeof process !== 'undefined' && /AiRunAndRead_ONBOARDING\\.js$/.test(process.argv[1] || '')) {\n  if (process.argv[2] === 'export-md') {\n    process.stdout.write(exportMarkdown());\n  } else {\n    console.log(`\\n##  AiRunAndRead_ONBOARDING.js v${VERSION}  ##\\n`);\n    console.log(`Forbidden(${Forbidden.length} items):`);\n    for (const f of Forbidden) console.log(`  ${f.id}. ${f.rule}`);\n    console.log(`\\nGraph ops(${GraphOps.length} intents):`);\n    for (const o of GraphOps) console.log(`  - ${o.intent} → ${o.method}`);\n    console.log(`\\nUsage:`);\n    console.log(`  node AiRunAndRead_ONBOARDING.js export-md > AI_ONBOARDING.md`);\n    console.log(`  import { Forbidden, BlockOps, GraphOps, ... } from './AiRunAndRead_ONBOARDING.js'`);\n  }\n}\n",
      "ts": 1778788882026,
      "refs": [
        {
          "kind": "import",
          "target": "./bible.aiDoc.yume.js"
        },
        {
          "kind": "calls",
          "target": "exportMarkdown"
        }
      ],
      "tags": [],
      "applyId": null
    }
  ]
};

// === HEAD ===
// v2/AiRunAndRead_ONBOARDING.js
// AI Onboarding v2 — LLM が ai-desk で作業するときのルール集
//
// ⚠️ ファイル名 prefix `AiRunAndRead_` の意味:
//   1. `node AiRunAndRead_ONBOARDING.js` で実行 → 出力を読め
//   2. or `import { Rules, Forbidden, ... } from './AiRunAndRead_ONBOARDING.js'`
//   ⛔ .js ソースを prose として linear に読むな
//
// **canonical form**: this file (.js) ← REAL
// **正典**: AiRunAndRead_BIBLE.js(公理 A0〜A13)を補完する運用マニュアル
// **対象読者**: LLM(Claude / GPT / Gemini)。人間向けではない。

import { Axioms } from './bible.aiDoc.yume.js';

export const VERSION = "2.6";
export const DATE = "2026-05-04";

// ============================================================
// §0 最初に把握する情報(file map + stderr hint policy)
// ============================================================
export const StartHere = {
  files: [
    { path: 'AiRunAndRead_BIBLE.js', purpose: '思想の正典(公理 A0〜A13)' },
    { path: 'ai-desk.js + ai-desk-core.js', purpose: '実装 split。core = pure logic(Block/Graph/parseJS)、ai-desk = CLI shell。Zero-Dep ~1.2k 行' },
    { path: 'e2e.js', purpose: '114 e2e テスト。新機能追加時にここに 1 件以上追加' },
    { path: '3d-prefab/', purpose: 'A10/A11 + heartbeat/flow/Shadow_for_Flow の voxel editor demo(55 tests)' },
    { path: 'package.json', purpose: '`npm test` で e2e、type:"module"(ESM)' },
    { path: '3dplus/', purpose: 'CPU 3D Twin(81 tests, CommonJS)。3D / WebGL コードを扱う際は突合層として参照' },
    { path: 'eyes/', purpose: 'AI-Eyes 観測ハーネス(in-memory virtual canvas、draw_op log)' },
  ],
  stderrHintPolicy:
    "ai-desk.js は CLI 実行時、コードの状態を観察して **stderr に 1 度だけ hint** を流す" +
    "(例: WebGL/Matrix4 検出 → `3dplus/` への routing)。" +
    "状態は cwd の `.ai-desk-state.json` に記録、二度目以降は静か。" +
    "hint が出たら指示先のドキュメントを実際に読む。",
};

    // ============================================================
    // §0.5 スナイパー・リーディング (Sniper Reading)
    // ============================================================
    export const SniperReading = {
    rule: ".yume.js ファイルを探索する際、初手でファイル全体を read_file してはならない。",
    why: "履歴ブロック(__block.versions)の巨大なノイズにより、AI の Spotlight(300行)が枯渇し、現在の実装(HEAD)を見失うため。",
    methods: [
    {
      name: "CLI show head --raw",
      command: "node <file>.yume.js show head --raw",
      benefit: "メタデータを含まないピュアな HEAD ソースコードのみを取得できる。最も推奨される方法。",
    },
    {
      name: "Grep HEAD line",
      command: "grep -n '=== HEAD ===' <file>.yume.js",
      benefit: "HEAD 領域の開始行を特定し、read_file(start_line: N) で履歴をスキップして読み取れる。",
    },
    ],
    };

    // ============================================================
    // §0.6 サーバーなき検証 (Eyes over Server)
    // ============================================================
    export const EyesOverServer = {
    rule: "UI や 3D ロジックの修正時、人間による目視確認(サーバー起動)を待たず、ai-eyes で自律検証せよ。",
    why: "人間がブラウザを開くコストは AI にとってのボトルネックである。描画命令(draw_ops)を構造的に比較することで、ハルシネーションを物理的に排除できる。",
    workflow: [
      "1. 修正後に `node eyes.observation.yume.js <target>` を実行。",
      "2. 出力された draw_ops を前回の正常値(snapshot Block)と diff。",
      "3. 座標や色が意図通りであれば、目視なしでパスと判断する。",
      "4. 複雑な挙動(アニメーション等)は `node eyes.debugger.yume.js <demo> <scenario>` で HTML 動画ログを生成し、コマ送りで最終確認する。",
    ],
    };
    // ============================================================
    // §1 絶対に守る禁忌(これを破ったらコミットしない)//   各禁忌は { rule, why, axiom_ref } の構造化データ
// ============================================================
export const Forbidden = [
  { id: 1, rule: "TypeScript を導入しない",                            why: "型情報による隠匿排除",     axiom_ref: 'A0' },
  { id: 2, rule: "npm install で外部依存を入れない",                    why: "Eternal Compatibility",   axiom_ref: 'Bible§3' },
  { id: 3, rule: "build / transpile step を作らない",                   why: "ソース = 実行ファイル",   axiom_ref: 'Bible§3' },
  { id: 4, rule: "フレームワーク(React 等)を入れない",                  why: "暗黙の規約は隠匿の温床", axiom_ref: 'A0' },
  { id: 5, rule: "コメントマーカー(// [ai_s_emblem:...])を新規に書かない", why: "マーカー廃止、tags は // @tags: で書く", axiom_ref: 'Bible§4' },
  { id: 6, rule: "Block.versions を直接書き換えない、commit() 経由のみ", why: "REAL の append-only 性",  axiom_ref: 'A4, A6' },
  { id: 7, rule: "Block.content / refs / tags を変数化しない",          why: "SHADOW 規約",             axiom_ref: 'A3, A6' },
  { id: 8, rule: "「人間の見やすさ」で判断しない",                       why: "LLM 視点の情報密度で判断", axiom_ref: 'A0, A7' },
];

// ============================================================
// §1.5 REAL_* variable convention(監視対象 state の命名)
// ============================================================
export const RealVariableRules = {
  rule: "`REAL_*` は、AI / Kantoku が監視すべき実行 JS の「正の状態」にだけ付ける。",
  why:
    "REAL_* があると、初期化時 AST bootstrap / 実行 trace / eyes_check / prompt 生成の対象を狭められる。" +
    "全変数を監視せず、状態バグの根だけを追うための接頭語。" +
    "AST が返す性質名は `isWatched`。`check` は検査実行の名前に限定する。",
  use_for: [
    "アプリの主要 state",
    "dispatch / reducer 後に更新される state",
    "render / eyes / test の入力になる state",
    "変化しないと state_frozen と判断できる state",
  ],
  do_not_use_for: [
    "一時値",
    "DOM 要素",
    "derived view / cache",
    "単なる定数",
    "loop counter",
  ],
  example: `
let REAL_state = initialState();
REAL_state = dispatch(REAL_state, evt);
render(ctx, REAL_state);
  `,
};

// ============================================================
// §2 コード生成ルール(Block を作る / 更新する / 戻す)
// ============================================================
export const BlockOps = {
  create: {
    rule: "新規 Block は `new Block({id, type, meta})` してから `commit()` で初回 version を append。",
    naming: "id は `<moduleId>:<prefix>:<name>` 規約。prefix は 'fn' か 'class'。",
    types: ['function', 'class', 'module', 'constraint', 'observation', 'twin'],
    example: `
const b = new Block({ id: 'mod:fn:foo', type: 'function', meta: {} });
b.commit({ content, refs, children, tags, meta });
    `,
  },
  update: {
    rule: "必ず `commit()` で新 version を append。古い version は消さない・触らない。",
    pattern: "head() の値をベースに、変更したい部分だけ差し替えて新 version を作る。",
    example: `
const head = b.head();
b.commit({
  content: head.content,                       // 変更しない
  refs: [...head.refs, { kind: 'calls', target: 'x' }],  // 追加
  children: head.children,
  tags: head.tags,
  meta: { ...head.meta, reason: 'add x dependency' },
});
    `,
  },
  rollback: {
    rule: "過去に戻すときは `b.rollback(versionIndex)` を使う。履歴を消さず、新 version として commit。",
    禁忌: "b.versions = b.versions.slice(0, n) のような直接削除は禁忌。",
  },
};

// ============================================================
// §3 parseJS の出力規約
// ============================================================
export const ParseRules = {
  function:    "function 宣言 → Block(type:'function')",
  arrow:       "const x = () => {} → Block(type:'function', tags:['arrow'])",
  klass:       "class 宣言 → Block(type:'class')",
  imports:     "import 文 → module Block の refs に { kind:'import', target } で追加",
  calls:       "同モジュール内の関数呼び出し → refs に { kind:'calls', target } で追加",
  tagComments: "直前コメントの // @tags: a, b → tags に取り込み(20 行遡及)",
  v1emblems:   "// [ai_s_emblem:#a#b Name] は互換読み専用、新規記述禁止",
  limitations: [
    "文字列リテラル中の function キーワードを誤検出する可能性",
    "ネスト関数の捕捉が浅い場合がある",
    "対応が必要なら parseJS 内の正規表現を拡張(将来的に AST 置換)",
  ],
};

// ============================================================
// §4 Graph 操作の使い分け(やりたいこと → メソッド)
// ============================================================
export const GraphOps = [
  { intent: "この関数を変えたら何に影響する?",   method: "g.impact(id)" },
  { intent: "この関数を呼んでるのは?",          method: "g.backward(id)" },
  { intent: "この関数が呼ぶのは?",              method: "g.forward(id)" },
  { intent: "特定の文字列を含む Block は?",      method: "g.search('TODO')" },
  { intent: "export されてる Block は?",        method: "g.byTag('export')" },
  { intent: "class だけ取りたい",               method: "g.byType('class')" },
  { intent: "過去の状態のグラフが見たい",        method: "g.at(timestamp)" },
  { intent: "全 Block の整合性チェック",         method: "g.verify()" },
];

// ============================================================
// §5 永続化のルール
// ============================================================
export const Persistence = {
  default_filename: "graph.json",
  derived_filename: "*.local.json",
  rule: [
    "saveGraph(graph, path) で JSON 1 ファイルに保存",
    "graph.json と *.local.json は .gitignore 済み",
    "共有が必要な永続データは別名 + レビュー後 commit",
  ],
};

// ============================================================
// §6 テスト追加のルール
// ============================================================
export const TestingRules = {
  rule: "テストは必ず『Top-Down E2E-First』で書くこと。ボトムアップのTDDは禁止。",
  workflow: [
    "1. 全体のシナリオを定義するE2Eテストを先に書く（意図の宣言）。",
    "2. E2Eを通すための実装を行う。",
    "3. E2E実行時のコードカバレッジを計測し、未通過のBlockや分岐（隙間）を特定する。",
    "4. その隙間を埋めるための単体テストを自律的に追加し、網羅率を上げる。"
  ],
  template: `
group('新機能E2Eシナリオ', () => {
  test('エンドツーエンドでの期待される振る舞い', () => {
    // setup / act / assert
  });
});
  `,
};

// ============================================================
// §7 CLI コマンド追加のルール
// ============================================================
export const CliExtension = {
  rule: "ai-desk.js の runCommand() に case を追加。",
  steps: [
    "1. case 'mycommand': を実装",
    "2. デフォルトケース(commands list)に追加",
    "3. e2e の CLI group にテスト追加",
    "4. AiRunAndRead_BIBLE.js の Rituals に追加(REFERENCE は BIBLE に統合済)",
  ],
  example: `
case 'mycommand': {
  if (!args[0]) return console.error('usage: mycommand <arg>');
  // 実装
  break;
}
  `,
};

export const HeavyApplyRules = {
  rule: "`heavy-apply` は `virtual-apply` 後に同じ root / depth で再展開する。AI が編集後の heavy view を即再読するための編集ループ。",
  command: "node ai-desk.js heavy-apply graph.json <root-id> heavy.txt --depth=N --out=heavy.after.txt",
  stdout: "--out 無しなら再展開 heavy content を stdout。ログは stderr。",
  warning: "expand 時と heavy-apply 時の --depth を必ず揃える。",
};

// ============================================================
// §8 v1(ai-desk legacy)との関係
// ============================================================
export const V1Relation = {
  rules: [
    "v1 の Bible(AI_NATIVE_MASTER_BIBLE.md)は v1 のまま、触らない",
    "v1 emblem マーカーは v2 でも読める(parseJS が tags に取り込む)が、新規記述禁止",
    "v1 と v2 は併存可能。v1 = 固定された過去、v2 = canonical",
    "v1 機能で v2 未移植のもの(focus/apply/check/coverage 等)は段階的に Block 化",
  ],
};

// ============================================================
// §9 Constraint Folding を書くとき
// ============================================================
export const ConstraintRules = {
  api: "constraintBlock({id, axes, values, derive}) → evalConstraint(cb, filter?)",
  derive_must_be: "純粋関数(I/O・乱数・時刻に触れない、Bible §7 Twin 規約と同じ)",
  filter: "浅い等価(merged[k] === v)。範囲条件は derive で派生フラグを作る",
  矛盾の表現: "filter 結果が空集合のとき _contradiction: true で返る",
  example: `
const cb = constraintBlock({
  id: 'shipping',
  axes: ['weight', 'zone'],
  values: {
    weight: [0.5, 1, 5, 10],
    zone: ['kanto', 'kansai', 'kyushu'],
  },
  derive: combo => ({
    fee: ((combo.weight <= 1 ? 300 : 500) +
          (combo.zone === 'kyushu' ? 200 : 0)),
  }),
});
evalConstraint(cb);                     // 全 12 世界
evalConstraint(cb, { fee: 700 });       // 該当する組み合わせを逆引き
  `,
};

// ============================================================
// §10 Observation Block を書くとき
// ============================================================
export const ObservationRules = {
  api: "observationBlock({id, observedId, snapshot, tags})",
  id_convention: "タイムスタンプ + 連番(時系列の自然な並び)",
  snapshot: "構造化データ(画像バイナリは別途保存して URL で参照)",
  refs: "{ kind: 'observes', target: observedId } が自動付与",
  example: `
observationBlock({
  id: 'obs:2026-05-03T10:00Z:001',
  observedId: 'mod:fn:bar',
  snapshot: { hp: 50, x: 10 },
  tags: ['ai-eyes', 'frame'],
});
  `,
};

// ============================================================
// §11 コミットメッセージの規約
// ============================================================
export const CommitConventions = {
  format: "<type>: <summary>",
  types: {
    init:     "初回コミット",
    feat:     "新機能",
    fix:      "バグ修正",
    docs:     "ドキュメント",
    test:     "テスト追加・修正",
    clearify: "振る舞いを変えない構造調整(AI 向け最適化)",
    chore:    "ビルド・ツール周り",
  },
  example: "feat(parse): support generator function syntax",
};

// ============================================================
// §12 「迷ったらどうする」(judgment compass)
// ============================================================
export const Compass = [
  { 迷い: "Block の type を増やすべきか",   判断軸: "既存 type で表現できないか先に検討。新 type は最後の手段。" },
  { 迷い: "関数を分割すべきか",             判断軸: "「LLM が一目で全文脈を把握できるか」で決める。基本はインライン化(A1)。" },
  { 迷い: "命名で迷ったとき",               判断軸: "動詞 + 目的語で書く。略語は使わない(LLM の学習に負ける)。" },
  { 迷い: "ドキュメントを書くべきか",        判断軸: "LLM が読む前提。冗長を恐れない。具体例を必ず添える。" },
  { 迷い: "新 .md を作りたくなった",         判断軸: "AI 用なら .md 禁止、AiRunAndRead_*.js を作る。人間用は README のみ。" },
];

// ============================================================
// §13 このドキュメント自体の更新ルール
// ============================================================
export const SelfUpdate = {
  rule: "気づいた LLM / 人間は AiRunAndRead_ONBOARDING.js に追記。常に updated。",
  commit_format: "docs(onboarding): ...",
  derived_md: "node v2/AiRunAndRead_ONBOARDING.js export-md > AI_ONBOARDING.md (生成は基本不要、AI は .js 直接読む)",
};

// ============================================================
// Self-display + export-md
// ============================================================
export function exportMarkdown() {
  const out = [];
  out.push(`# AI Onboarding v${VERSION}`);
  out.push(`> Auto-generated from AiRunAndRead_ONBOARDING.js — DO NOT EDIT THIS FILE DIRECTLY.`);
  out.push(`> Run \`node v2/AiRunAndRead_ONBOARDING.js export-md > AI_ONBOARDING.md\` to regenerate.`);
  out.push(`> Date: ${DATE}\n`);

  out.push(`## §0 Start Here`);
  out.push(`### Files to know`);
  for (const f of StartHere.files) out.push(`- **${f.path}**: ${f.purpose}`);
  out.push(`\n### stderr hint policy\n${StartHere.stderrHintPolicy}\n`);

  out.push(`## §0.5 スナイパー・リーディング (Sniper Reading)`);
  out.push(SniperReading.rule);
  out.push(`\nwhy: ${SniperReading.why}`);
  out.push(`\n### Methods`);
  for (const m of SniperReading.methods) {
    out.push(`- **${m.name}**: \`${m.command}\`  _(${m.benefit})_`);
  }
  out.push('');

  out.push(`## §0.6 サーバーなき検証 (Eyes over Server)`);
  out.push(EyesOverServer.rule);
  out.push(`\nwhy: ${EyesOverServer.why}`);
  out.push(`\n### Workflow`);
  for (const s of EyesOverServer.workflow) out.push(`- ${s}`);
  out.push('');

  out.push(`## §1 Forbidden(これを破ったらコミットしない)`);
  for (const f of Forbidden) out.push(`- **${f.id}.** ${f.rule}  _(${f.why}, ${f.axiom_ref})_`);
  out.push('');

  out.push(`## §1.5 REAL_* Variables`);
  out.push(RealVariableRules.rule);
  out.push(`\nwhy: ${RealVariableRules.why}`);
  out.push(`\n### Use For`);
  for (const r of RealVariableRules.use_for) out.push(`- ${r}`);
  out.push(`\n### Do Not Use For`);
  for (const r of RealVariableRules.do_not_use_for) out.push(`- ${r}`);
  out.push(`\n### Example\n\`\`\`js${RealVariableRules.example}\`\`\`\n`);

  out.push(`## §2 Block ops`);
  for (const [op, spec] of Object.entries(BlockOps)) {
    out.push(`### ${op}`);
    out.push(spec.rule || '');
    if (spec.example) out.push('```js' + spec.example + '```');
  }

  out.push(`## §3 parseJS rules`);
  for (const [k, v] of Object.entries(ParseRules)) {
    if (Array.isArray(v)) out.push(`- **${k}**:\n  - ${v.join('\n  - ')}`);
    else out.push(`- **${k}**: ${v}`);
  }
  out.push('');

  out.push(`## §4 Graph ops`);
  for (const o of GraphOps) out.push(`- ${o.intent} → \`${o.method}\``);
  out.push('');

  out.push(`## §5 Persistence`);
  for (const r of Persistence.rule) out.push(`- ${r}`);
  out.push('');

  out.push(`## §6 Testing\n${TestingRules.rule}\n\`\`\`js${TestingRules.template}\`\`\`\n`);

  out.push(`## §7 CLI extension\n${CliExtension.rule}`);
  for (const s of CliExtension.steps) out.push(`- ${s}`);
  out.push('');

  out.push(`## §7.5 Heavy Apply Loop`);
  out.push(HeavyApplyRules.rule);
  out.push(`- command: \`${HeavyApplyRules.command}\``);
  out.push(`- stdout: ${HeavyApplyRules.stdout}`);
  out.push(`- warning: ${HeavyApplyRules.warning}`);
  out.push('');

  out.push(`## §8 v1 relation`);
  for (const r of V1Relation.rules) out.push(`- ${r}`);
  out.push('');

  out.push(`## §9 Constraint Folding`);
  for (const [k, v] of Object.entries(ConstraintRules)) {
    if (k !== 'example') out.push(`- **${k}**: ${v}`);
  }
  out.push('```js' + ConstraintRules.example + '```\n');

  out.push(`## §10 Observation Block`);
  for (const [k, v] of Object.entries(ObservationRules)) {
    if (k !== 'example') out.push(`- **${k}**: ${v}`);
  }
  out.push('```js' + ObservationRules.example + '```\n');

  out.push(`## §11 Commit conventions`);
  out.push(`format: \`${CommitConventions.format}\``);
  for (const [t, d] of Object.entries(CommitConventions.types)) out.push(`- \`${t}\`: ${d}`);
  out.push(`example: \`${CommitConventions.example}\`\n`);

  out.push(`## §12 Compass(迷ったときの判断軸)`);
  for (const c of Compass) out.push(`- **${c.迷い}** → ${c.判断軸}`);
  out.push('');

  out.push(`## §13 Self-update\n${SelfUpdate.rule}\ncommit format: \`${SelfUpdate.commit_format}\``);

  return out.join('\n');
}

if (typeof process !== 'undefined' && /AiRunAndRead_ONBOARDING\.js$/.test(process.argv[1] || '')) {
  if (process.argv[2] === 'export-md') {
    process.stdout.write(exportMarkdown());
  } else {
    console.log(`\n##  AiRunAndRead_ONBOARDING.js v${VERSION}  ##\n`);
    console.log(`Forbidden(${Forbidden.length} items):`);
    for (const f of Forbidden) console.log(`  ${f.id}. ${f.rule}`);
    console.log(`\nGraph ops(${GraphOps.length} intents):`);
    for (const o of GraphOps) console.log(`  - ${o.intent} → ${o.method}`);
    console.log(`\nUsage:`);
    console.log(`  node AiRunAndRead_ONBOARDING.js export-md > AI_ONBOARDING.md`);
    console.log(`  import { Forbidden, BlockOps, GraphOps, ... } from './AiRunAndRead_ONBOARDING.js'`);
  }
}

// === /HEAD ===

// === BOOT ===
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = __block.runtime.path ?? `./runtimes/ver${__block.runtime.version}.handle.yume.js`;
  const rt = await import(path);
  await rt.cli(import.meta.url, __block, process.argv);
}
// === /BOOT ===
