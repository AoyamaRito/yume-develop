// @yume-format: 1

export const __block = {
  "id": "manual",
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
      "hash": "d9abd3fa66dce9edf1aa116d73c091152f0667a4dbbd8b0ca70b952b58e5ff44",
      "prevHash": null,
      "content": "// v2/AiRunAndRead_MANUAL.js\n// ai-desk 操作マニュアル — 何を、どの順で、どう叩くか\n//\n// ⚠️ ファイル名 prefix `AiRunAndRead_` の意味:\n//   1. `node AiRunAndRead_MANUAL.js` で実行 → 出力を読め\n//   2. or `import { Workflow, VirtualHeavy, CliCommands, ... } from './AiRunAndRead_MANUAL.js'`\n//   ⛔ .js ソースを prose として linear に読むな\n//\n// **canonical form**: this file (.js) ← REAL\n//\n// 思想: AiRunAndRead_BIBLE.js\n// 規律: AiRunAndRead_ONBOARDING.js\n// CLI 早見表: AiRunAndRead_BIBLE.js の Rituals(REFERENCE.md は廃止、Bible に統合済)\n//\n// 🚨 §VirtualHeavy が v2 の心臓。展開だけでなく **Apply(逆配分)の規律**を守ること。\n\nexport const VERSION = \"2.6\";\nexport const DATE = \"2026-05-04\";\n\n// ============================================================\n// §0 用語の最短定義\n// ============================================================\nexport const Glossary = {\n  Block:    \"{ id, type, versions[], meta }。すべての構成要素の単位\",\n  Version:  \"{ content, refs, children, tags, timestamp, prevHash, hash }。append-only、これが REAL\",\n  head:     \"最新 Version。block.content 等の getter は head() から派生(SHADOW)\",\n  Graph:    \"Block の集合 + 双方向走査(forward / backward / impact)\",\n  ref:      \"{ kind, target }。kind は import / calls / contains / link / observes 等\",\n  VirtualHeavy: \"root + forward 推移閉包を 1 content に展開して LLM に渡し、戻りを各 Block に逆配分する機構\",\n  REALVariable: \"`REAL_*`。実行 JS 内で AI / Kantoku が監視すべき正の状態を示す変数名接頭語\",\n};\n\n// ============================================================\n// §0.5 REAL_* variable convention\n// ============================================================\nexport const RealVariableConvention = {\n  purpose:\n    \"`REAL_*` は、実行 JS 内で AI / Kantoku が変化を追跡すべき「正の状態」を示す。\" +\n    \"型や単位の表現ではなく、観測・検証・prompt 生成の起点を示す命名規約。\",\n  useFor: [\n    \"アプリの主要状態\",\n    \"reducer / dispatch 後に更新される状態\",\n    \"render / eyes / test の入力になる状態\",\n    \"失われると挙動判断が壊れる状態\",\n  ],\n  avoidFor: [\n    \"一時変数\",\n    \"派生表示値\",\n    \"DOM 要素\",\n    \"キャッシュ\",\n    \"ループ内の小さな値\",\n    \"単なる定数\",\n  ],\n  rules: [\n    \"AST で `REAL_*` を検出した結果は `isWatched: true` と表現する\",\n    \"`check` は検査実行の動詞なので、監視対象かどうかの boolean 名には使わない\",\n    \"`REAL_*` は初期化時に記録可能である\",\n    \"`REAL_*` の再代入は trace 対象にできる\",\n    \"`REAL_*` は JSON serializable を推奨する\",\n    \"event / dispatch 後に `REAL_*` が変化しない場合、Kantoku は state_frozen 系の警告を出せる\",\n    \"`REAL_*` が変わった後、古い eyes / test / verification は stale とみなす\",\n  ],\n  example: `\nlet REAL_state = initialState();\n\nfor (const evt of events) {\n  REAL_state = dispatch(REAL_state, evt);\n  render(ctx, REAL_state);\n}\n  `,\n};\n\n// ============================================================\n// §1 30 秒で動かす\n// ============================================================\nexport const QuickStart = [\n  { cmd: \"cd /Users/AoyamaRito/PJs/ai-desk/v2\", desc: \"v2 フォルダへ\" },\n  { cmd: \"npm test\", desc: \"114 e2e + 71 3d-prefab tests, all green\" },\n  { cmd: \"node ai-desk.js\", desc: \"self-test(Block / Graph / parseJS の動作デモ)\" },\n  { cmd: \"node ai-desk.js self\", desc: \"自分自身を解析(自己読み込み)\" },\n];\n\n// ============================================================\n// §2 基本ワークフロー(典型的な 1 セッション、7 段)\n// ============================================================\nexport const Workflow = [\n  {\n    step: 1, name: \"既存 JS を Graph 化して保存\",\n    cmds: [\n      \"node ai-desk.js save graph.json src/foo.js src/bar.js\",\n      \"node ai-desk.js resolve graph.json\",\n    ],\n    note: \"graph.json が永続のソース。以降の apply / virtual-apply はこれを書き換える(append のみ)\",\n  },\n  {\n    step: 2, name: \"構造を把握\",\n    cmds: [\n      \"node ai-desk.js skeleton src/foo.js\",\n      \"node ai-desk.js stats src/foo.js\",\n      \"node ai-desk.js tags src/foo.js\",\n      \"node ai-desk.js mermaid src/foo.js\",\n    ],\n  },\n  {\n    step: 3, name: \"1 Block にズーム\",\n    cmds: [\n      \"node ai-desk.js focus src/foo.js src/foo.js:fn:bar\",\n      \"node ai-desk.js context src/foo.js src/foo.js:fn:bar 1\",\n    ],\n    note: \"context は target + 1 段の forward/backward を markdown で出す(LLM プロンプト用)\",\n  },\n  {\n    step: 4, name: \"影響範囲を見る(変更前のリスク評価)\",\n    cmds: [\"node ai-desk.js impact src/foo.js src/foo.js:fn:bar\"],\n    note: \"bar を変えると壊れうる Block 全部(backward の推移閉包)\",\n  },\n  {\n    step: 5, name: \"編集して反映 — 3 つの粒度\",\n    sub: [\n      { granularity: \"ファイル全体 patch\",          cmd: \"apply graph.json patch.js <moduleId>\",         what: \"patch を parseJS → Block 単位で diff → 変更分だけ commit\" },\n      { granularity: \"1 関数だけ patch\",             cmd: \"apply-block graph.json <blockId> patch.js\",   what: \"mini-parse して refs/tags 自動再計算 → 1 Block に commit\" },\n      { granularity: \"重厚関数(root + 依存)patch\", cmd: \"virtual-apply graph.json <rootId> patch.txt\", what: \"BLOCK ヘッダで分割 → 各 Block に逆配分 commit\" },\n    ],\n  },\n  {\n    step: 6, name: \"履歴を見る\",\n    cmds: [\n      \"node ai-desk.js diff src/foo.js src/foo.js:fn:bar\",\n      \"node ai-desk.js diff src/foo.js src/foo.js:fn:bar 0 3\",\n      \"node ai-desk.js blame src/foo.js src/foo.js:fn:bar src/foo.js:fn:baz\",\n    ],\n  },\n  {\n    step: 7, name: \"Graph をコードに戻す\",\n    cmds: [\"node ai-desk.js export graph.json src/foo.js out.js\"],\n    note: \"module Block の contains 順に Block の content を結合して再生成。import の named/default/namespace 区別は完全 round-trip しない(MVP の限界)\",\n  },\n];\n\n// ============================================================\n// §3 CLI コマンド全 24 種(用途別)\n// ============================================================\nexport const CliCommands = {\n  observe: [\n    { cmd: \"skeleton <file>\",              use: \"Block 一覧 + refs\" },\n    { cmd: \"focus <file> <id>\",            use: \"指定 Block の content\" },\n    { cmd: \"context <file> <id> [depth]\",  use: \"target + 近傍を LLM 用 markdown に整形\" },\n    { cmd: \"stats <file>\",                 use: \"集計(block / version / byType / byTag)\" },\n    { cmd: \"tags <file>\",                  use: \"全タグと件数\" },\n    { cmd: \"tag <file> <tag>\",             use: \"あるタグを持つ Block 一覧\" },\n    { cmd: \"search <file> <query>\",        use: \"content の部分一致検索\" },\n    { cmd: \"impact <file> <id>\",           use: \"backward 推移閉包(変更時の影響範囲)\" },\n    { cmd: \"diff <file> <id> [i] [j]\",     use: \"version 間差分\" },\n    { cmd: \"blame <file> <id> <ref>\",      use: \"ref が初めて追加された version\" },\n    { cmd: \"mermaid <file>\",               use: \"flowchart LR を stdout\" },\n    { cmd: \"infer-tags <file> <id>\",       use: \"content からタグ推論(test/io/pure 等)\" },\n    { cmd: \"lint <file> [--summary] [--only=K1,K2]\", use: \"8 種の整合性チェック\" },\n    { cmd: \"self\",                          use: \"自分自身(ai-desk.js)を解析\" },\n  ],\n  persist: [\n    { cmd: \"save <out.json> <files...>\",   use: \"ファイル群 → Graph → JSON\" },\n    { cmd: \"load <in.json>\",                use: \"JSON 読み込み + verify\" },\n    { cmd: \"graph <files...>\",              use: \"parseJS 結果を JSON で stdout\" },\n    { cmd: \"resolve <graph.json>\",          use: \"import の相対パスを Block ID に解決\" },\n    { cmd: \"export <graph.json> <moduleId> [out.js]\", use: \"Graph から JS 再生成\" },\n  ],\n  edit_append_only: [\n    { cmd: \"apply <graph.json> <patch.js> <moduleId>\",  use: \"ファイル単位 patch\" },\n    { cmd: \"apply-block <graph.json> <blockId> <patch>\", use: \"1 Block 単位 patch(- で stdin)\" },\n    { cmd: \"virtual-apply <graph.json> <rootId> <patch>\", use: \"仮想重厚関数の逆配分(- で stdin)\" },\n    { cmd: \"heavy-apply <graph.json> <rootId> <patch|-> [--depth=N] [--out=after.txt]\", use: \"virtual-apply 後に同じ scope を再展開\" },\n  ],\n  virtualHeavy: [\n    { cmd: \"heavy <file|graph.json> <root-id> [--depth=N]\", use: \"root + 依存を 1 content に展開して stdout\" },\n  ],\n  verify: [\n    { cmd: \"e2e\", use: \"テスト実行(npm test と同じ)\" },\n  ],\n};\n\n// ============================================================\n// §4 Virtual Heavy Function — v2 のキラー機能(心臓部)\n// ============================================================\nexport const VirtualHeavy = {\n\n  // §4.1 解く問題\n  problem: {\n    description: \"LLM は全文脈集約された方が間違えない(重厚関数原則)。ただし Block 分割は履歴・検索・refs に必要。普通は二者択一。\",\n    layers: {\n      物理層:    \"graph.json 上の状態。細粒度 Block + versions + refs。最適化対象: 管理 / 履歴 / 影響分析\",\n      論理層:    \"LLM に渡す content。root + forward 推移閉包を 1 つの巨大 content に展開。最適化対象: LLM の認知(全文脈集約)\",\n    },\n    insight: \"両者を往復させる機構が Virtual Heavy Function。展開だけでは半分。逆配分があって初めて閉じる。\",\n  },\n\n  // §4.2 全体フロー\n  flow: `\n[graph.json]                                                 [graph.json]\n  ├─ Block A (root) ─┐                                         ├─ Block A (root) ← v+1\n  ├─ Block B        ├─→ heavy.txt ──→ LLM ──→ heavy.txt' ──→  ├─ Block B        ← v+1\n  ├─ Block C        │   (1 content)         (編集済 1 content)  ├─ Block C        ← unchanged\n  └─ Block D ───────┘                                          └─ Block D        ← v+1\n        ↑                  ↑                                              ↑\n   virtualHeavy        expandVirtualHeavy                          virtualApply\n   (forward閉包を集める)   (1 content に連結)                       (各 Block に逆配分 commit)\n  `.trim(),\n\n  // §4.3 ワークフロー\n  workflow: [\n    \"1. node ai-desk.js save graph.json src/foo.js\",\n    \"2. node ai-desk.js resolve graph.json\",\n    \"3. node ai-desk.js heavy src/foo.js src/foo.js:fn:render --depth=3 > heavy.txt\",\n    \"4. heavy.txt を LLM に投げる(BLOCK ヘッダを残したまま content だけ編集して返してもらう)\",\n    \"5. node ai-desk.js virtual-apply graph.json src/foo.js:fn:render heavy.txt\",\n    \"6. 連続編集するときは node ai-desk.js heavy-apply graph.json src/foo.js:fn:render heavy.txt --depth=3 --out=heavy.after.txt\",\n    \"7. node ai-desk.js diff src/foo.js src/foo.js:fn:render\",\n    \"8. node ai-desk.js lint src/foo.js --summary\",\n  ],\n\n  // §4.4 展開フォーマット\n  expandedFormat: {\n    template: `\n// === Virtual Heavy Function rooted at <rootId> ===\n// N blocks combined into one logical heavy function\n// Edit the bodies; do not change the boundary headers.\n\n// --- BLOCK: <id1> (<type>) ---\n// tags: ...\n// refs: ...\n<content1>\n\n// --- BLOCK: <id2> (<type>) ---\n<content2>\n\n// === end of virtual heavy ===\n    `.trim(),\n    rules: [\n      { line: \"// === Virtual Heavy Function ... ===\",  role: \"全体ヘッダ\",                     editable: \"❌ 残す\" },\n      { line: \"// --- BLOCK: <id> (<type>) ---\",         role: \"境界ヘッダ。Apply の分割キー\",   editable: \"❌ 絶対に変えない・消さない・追加しない\" },\n      { line: \"// tags: ... / // refs: ...\",              role: \"参考表示(commit 時に除去)\",    editable: \"⚪ 触っても無視される\" },\n      { line: \"<content>\",                                role: \"Block の本体\",                   editable: \"✅ ここを編集する\" },\n      { line: \"// === end of virtual heavy ===\",          role: \"終端マーカー\",                   editable: \"❌ 残す\" },\n    ],\n  },\n\n  // §4.5 Apply(virtualApply)— 逆配分の正確な挙動\n  applyMechanics: {\n    summary: \"virtualApply(graph, rootId, expandedContent, opts = {}) の動作\",\n    steps: [\n      {\n        step: \"Step 1 スコープ集合の再計算\",\n        what: \"expand と同じ opts(depth, kind)で virtualHeavy を呼び直す。これが Apply のスコープになる Block 集合。\",\n        warn: \"🚨 expand と apply で opts(特に depth)が違うとスコープがズレる。expand 時に --depth=3 なら apply も同じ depth で。\",\n      },\n      {\n        step: \"Step 2 入力 content を BLOCK ヘッダで分割\",\n        regex: /^\\s*\\/\\/\\s*---\\s*BLOCK:\\s*(\\S+)\\s*\\(([^)]+)\\)\\s*---\\s*$/.toString(),\n        what: \"行頭からヘッダを検出、次のヘッダ(または末尾)までを 1 segment の body とする。body から末尾の === end === と // tags: / // refs: 行を除去。\",\n      },\n      {\n        step: \"Step 3 各 segment を Block に逆配分\",\n        what: \"heavyById.get(seg.id) で対応 Block を探し、target.applyPatch(seg.content) を呼ぶ。スコープ外 id は静かに skip(skipped-out-of-scope)。\",\n      },\n      {\n        step: \"Step 4 applyPatch の中身(Block 単位)\",\n        rules: [\n          \"head().content と同一 + refs/tags も opts と一致 → action: 'unchanged'(新 version 作らない)\",\n          \"違っていれば commit({content, refs: opts.refs ?? head.refs, tags: opts.tags ?? head.tags, meta:{appliedAt}})\",\n          \"→ action: 'updated'(既存 head あり)or 'created'(なし)\",\n        ],\n      },\n    ],\n    behaviors: [\n      \"スコープ内 + content 変化あり → 新 version を append(refs/tags は head 継承)\",\n      \"スコープ内 + content 同じ → 何もしない(version 履歴を汚さない)\",\n      \"スコープ外 id → 静かに skip(エラー出さず、log だけ)\",\n    ],\n  },\n\n  // §4.6 「依存性ごと撃つ」が成立する仕組み\n  dependencyShot: {\n    description: \"virtualHeavy(graph, rootId, { kind: 'calls' }) は forward の推移閉包。root を 1 個指定すると呼ぶ先(forward)を再帰的に集めて 1 content に。\",\n    comparison: [\n      { axis: \"LLM が見える文脈\",         v1: \"1 関数のみ\",            v2: \"root + 全依存先\" },\n      { axis: \"整合の取り方\",              v1: \"編集後に他関数を別途修正\", v2: \"同一プロンプト内で同時に\" },\n      { axis: \"物理ファイル\",              v1: \"各関数は分散したまま\",   v2: \"同上(分散したまま)\" },\n      { axis: \"履歴\",                       v1: \"各関数 1 commit\",       v2: \"全関連 Block が同時に新 version\" },\n      { axis: \"v1 の共有ヘルパー禁止\",     v1: \"維持\",                  v2: \"維持(物理は分散、論理だけ統合)\" },\n    ],\n    note: \"1 root を撃つと refs で繋がる関連 Block 全てが 1 トランザクションのように更新。append-only なので rollback も自然(各 Block を rollback(prev_index) で)。\",\n  },\n\n  // §4.7 Apply の戻り値(updates 配列)を必ず読む\n  updateActions: [\n    { action: \"updated\",              meaning: \"既存 Block に新 version が append された\",                          do: \"✅ 期待通り\" },\n    { action: \"created\",              meaning: \"Block が無かったので新規作成された\",                                do: \"⚠ 本来あり得ない(virtualHeavy は既存 Block を集めるため)。発生したら設計バグ\" },\n    { action: \"unchanged\",            meaning: \"content が head と同一だったので何もしなかった\",                    do: \"✅ 履歴を汚さない正しい挙動\" },\n    { action: \"skipped-out-of-scope\", meaning: \"入力に virtualHeavy 集合に無い id のヘッダがあった\",                do: \"🚨 要確認。LLM がヘッダを勝手に追加 / 改変した可能性\" },\n  ],\n\n  heavyApply: {\n    rule: \"`heavy-apply` は `virtual-apply` + graph 保存 + 同一 root/depth の再 `heavy` 展開を 1 コマンドに畳む。\",\n    why: \"AI が編集後の更新済み文脈をすぐ再読できる。Virtual Heavy を一回きりの patch pack ではなく編集ループにする。\",\n    stdout: \"--out 無しなら再展開 content を stdout に出す。--out 指定時は after file に書く。\",\n    stderr: \"apply updates / stats / out path は stderr に出すので stdout の heavy content を汚さない。\",\n  },\n\n  // §4.8 Apply を壊す 6 パターン\n  failureModes: [\n    { id: 1, mistake: \"LLM が BLOCK ヘッダを書き換え/翻訳した\",                       result: \"その segment が skipped-out-of-scope で消える\",         fix: \"プロンプトに「ヘッダ行は絶対変更しない」を明記\" },\n    { id: 2, mistake: \"LLM が新規 BLOCK ヘッダを追加して関数を生やした\",              result: \"skipped-out-of-scope で消える(既存セットに無い)\",   fix: \"別途 apply-block で新規追加、または apply で patch.js として渡す\" },\n    { id: 3, mistake: \"expand と apply で --depth が違う\",                              result: \"スコープ集合がズレる、一部 segment が skip\",            fix: \"同じ depth・同じ kind を必ず使う(opts を変数に切り出して両方に渡す)\" },\n    { id: 4, mistake: \"apply 後に元の root を消した / id を改名した\",                  result: \"次回 expand で全く違う集合が出る\",                       fix: \"rename は rollback + 新 id 作成 → 旧 id 非推奨化、で段階的に\" },\n    { id: 5, mistake: \"content の { } が崩れた\",                                         result: \"commit 自体は通るが lint の brace-mismatch が出る\",     fix: \"lint --only=brace で即検出、再 expand → 修正 → re-apply\" },\n    { id: 6, mistake: \"refs/tags 行を本気で書き換えた\",                                  result: \"無視される(commit 時に head から継承)\",                fix: \"refs/tags を変えたいなら apply-block で smart 再計算 / 手動 commit\" },\n  ],\n\n  // §4.9 Apply の正しい使い方チェックリスト\n  checklist: {\n    beforeExpand: [\n      \"node ai-desk.js impact src/foo.js <rootId>     # 影響範囲を把握\",\n      \"node ai-desk.js heavy  src/foo.js <rootId> --depth=N | head -50   # 何 Block 入るか目視\",\n    ],\n    llmPromptTemplate:\n      \"以下は Virtual Heavy Function。`// --- BLOCK: <id> (<type>) ---` のヘッダ行は絶対に変えない・消さない・追加しない。\\n\" +\n      \"各 BLOCK の content だけを編集して返してください。新規関数を追加したい場合は別途指示します。\",\n    afterApply: [\n      \"node ai-desk.js virtual-apply graph.json <rootId> heavy.txt | tee apply.log\",\n      \"grep skipped apply.log\",\n      \"node ai-desk.js lint src/foo.js --summary\",\n      \"node ai-desk.js diff src/foo.js <rootId>\",\n      \"node ai-desk.js load graph.json     # verify を最後に必ず\",\n    ],\n    safetyNet: \"Apply は append-only なので何度やり直しても履歴は壊れない。失敗を恐れずに往復を回す。万一の時は b.rollback(prevIndex) で過去 version を新 version として復元。\",\n  },\n\n  // §4.10 プログラマティック API\n  programmaticUsage: `\nimport { loadGraph, saveGraph, expandVirtualHeavy, virtualApply } from './ai-desk.js';\n\nconst g = loadGraph('graph.json');\nconst rootId = 'src/foo.js:fn:render';\nconst opts = { depth: 3, kind: 'calls' };   // ← expand と apply で同じ opts を使う\n\nconst expanded = expandVirtualHeavy(g, rootId, opts);\nconst edited = await callLLM(expanded);\nconst updates = virtualApply(g, rootId, edited, opts);\n\nconst dropped = updates.filter(u => u.action === 'skipped-out-of-scope');\nif (dropped.length) console.warn('dropped segments:', dropped);\n\nsaveGraph(g, 'graph.json');\n  `.trim(),\n};\n\n// ============================================================\n// §5 プログラマティック API\n// ============================================================\nexport const ProgrammaticApi = {\n  imports: [\n    \"Block, Graph\",\n    \"parseJS, parseMD, loadProject, checkBraces\",\n    \"saveGraph, loadGraph, buildAndSave\",\n    \"applyPatch, applyToBlock, applyBlockSmart, resolveImports\",\n    \"virtualHeavy, expandVirtualHeavy, virtualApply\",\n    \"exportModule, exportToFile, exportMermaid\",\n    \"inferTags, graphStats, blockContext, formatContextForLLM\",\n    \"constraintBlock, evalConstraint\",\n    \"observationBlock\",\n  ],\n  blockOps: [\n    \"b.versions.length / b.content / b.head() / b.at(timestamp)\",\n    \"b.diff(0, 1) / b.blameRef('x')\",\n    \"b.rollback(0)  // 過去状態を新しい past として commit、履歴は保持\",\n    \"b.verify()      // hash チェーン検証\",\n  ],\n  graphOps: [\n    \"g.forward(id, kind?) / g.backward(id, kind?) / g.impact(id, kind?)\",\n    \"g.byType('function') / g.byTag('export')\",\n    \"g.search('TODO', { type, tag, includeOldVersions })\",\n    \"g.at(timestamp) / g.lint({orphan:false}) / g.verify()\",\n  ],\n};\n\n// ============================================================\n// §6 lint(整合性チェック 8 種)\n// ============================================================\nexport const LintKinds = [\n  { kind: 'broken-ref',     detects: \"target が存在しない ref(import の外部モジュールは除外)\", offFlag: \"{ broken: false }\" },\n  { kind: 'orphan',         detects: \"誰からも参照されない非 module Block\",                       offFlag: \"{ orphan: false }\" },\n  { kind: 'circular',       detects: \"forward の循環\",                                              offFlag: \"{ circular: false }\" },\n  { kind: 'brace-mismatch', detects: \"content の { } が不揃い(文字列・regex は skip)\",         offFlag: \"{ brace: false }\" },\n  { kind: 'calls-leak',     detects: \"他関数呼び出しの形跡があるが calls ref が無い\",              offFlag: \"{ calls: false }\" },\n  { kind: 'tag-mismatch',   detects: \"type と tags が不整合(function なのに tags に function なし 等)\", offFlag: \"{ tags: false }\" },\n  { kind: 'empty-block',    detects: \"content / refs / children がすべて空\",                        offFlag: \"{ empty: false }\" },\n  { kind: 'hash-broken',    detects: \"version の prevHash チェーン破損\",                            offFlag: \"{ hash: false }\" },\n];\n\n// ============================================================\n// §7 parseJS の挙動と限界\n// ============================================================\nexport const ParseJSRules = [\n  { syntax: \"ファイル全体\",                                              produces: \"module Block。refs に import と contains\" },\n  { syntax: \"function foo(){} / export function / async function\",      produces: \"function Block(tags: function, async?, export?, generator?)\" },\n  { syntax: \"const foo = () => {}\",                                       produces: \"function Block(tags: function, arrow)\" },\n  { syntax: \"class Foo {} / export class\",                                produces: \"class Block(tags: class, export?, default?)\" },\n  { syntax: \"import ... from 'x'\",                                         produces: \"module の refs に { kind: 'import', target: 'x' }\" },\n  { syntax: \"同モジュール内の関数呼び出し\",                              produces: \"calls ref(名前ベース、後段で再 commit)\" },\n  { syntax: \"// [ai_s_emblem:#a#b Name] / // @tags: a, b\",                 produces: \"tags に取込(v1 互換、20 行遡及)\" },\n];\n\n// ============================================================\n// Self-display + export-md\n// ============================================================\nexport function exportMarkdown() {\n  const out = [];\n  out.push(`# ai-desk 操作マニュアル v${VERSION}`);\n  out.push(`> Auto-generated from AiRunAndRead_MANUAL.js — DO NOT EDIT THIS FILE DIRECTLY.`);\n  out.push(`> Run \\`node v2/AiRunAndRead_MANUAL.js export-md > MANUAL.md\\` to regenerate.`);\n  out.push(`> Date: ${DATE}\\n`);\n  out.push(`> ⚡ §VirtualHeavy が v2 の心臓。Apply の規律を守ること。\\n`);\n\n  out.push(`## §0 Glossary`);\n  for (const [k, v] of Object.entries(Glossary)) out.push(`- **${k}**: ${v}`);\n  out.push('');\n\n  out.push(`## §0.5 REAL_* Variable Convention`);\n  out.push(RealVariableConvention.purpose);\n  out.push(`\\n### Use For`);\n  for (const r of RealVariableConvention.useFor) out.push(`- ${r}`);\n  out.push(`\\n### Avoid For`);\n  for (const r of RealVariableConvention.avoidFor) out.push(`- ${r}`);\n  out.push(`\\n### Rules`);\n  for (const r of RealVariableConvention.rules) out.push(`- ${r}`);\n  out.push(`\\n### Example\\n\\`\\`\\`js${RealVariableConvention.example}\\`\\`\\`\\n`);\n\n  out.push(`## §1 Quick Start`);\n  for (const q of QuickStart) out.push(`- \\`${q.cmd}\\` — ${q.desc}`);\n  out.push('');\n\n  out.push(`## §2 Workflow(7 段)`);\n  for (const w of Workflow) {\n    out.push(`### ${w.step}. ${w.name}`);\n    if (w.cmds) for (const c of w.cmds) out.push(`- \\`${c}\\``);\n    if (w.sub) {\n      for (const s of w.sub) out.push(`- ${s.granularity}: \\`${s.cmd}\\` — ${s.what}`);\n    }\n    if (w.note) out.push(`> ${w.note}`);\n    out.push('');\n  }\n\n  out.push(`## §3 CLI Commands`);\n  for (const [cat, cmds] of Object.entries(CliCommands)) {\n    out.push(`### ${cat}`);\n    for (const c of cmds) out.push(`- \\`${c.cmd}\\` — ${c.use}`);\n    out.push('');\n  }\n\n  out.push(`## §4 Virtual Heavy Function`);\n  out.push(`### 4.1 Problem`);\n  out.push(VirtualHeavy.problem.description);\n  out.push(`- 物理層: ${VirtualHeavy.problem.layers.物理層}`);\n  out.push(`- 論理層: ${VirtualHeavy.problem.layers.論理層}`);\n  out.push(`> ${VirtualHeavy.problem.insight}\\n`);\n  out.push(`### 4.2 Flow\\n\\`\\`\\`\\n${VirtualHeavy.flow}\\n\\`\\`\\`\\n`);\n  out.push(`### 4.3 Workflow`);\n  for (const s of VirtualHeavy.workflow) out.push(`- ${s}`);\n  out.push(`\\n### 4.4 Expanded Format\\n\\`\\`\\`\\n${VirtualHeavy.expandedFormat.template}\\n\\`\\`\\``);\n  for (const r of VirtualHeavy.expandedFormat.rules) out.push(`- \\`${r.line}\\` — ${r.role}(${r.editable})`);\n  out.push(`\\n### 4.5 Apply Mechanics`);\n  for (const s of VirtualHeavy.applyMechanics.steps) {\n    out.push(`#### ${s.step}`);\n    if (s.what) out.push(s.what);\n    if (s.warn) out.push(`> ${s.warn}`);\n    if (s.rules) for (const r of s.rules) out.push(`- ${r}`);\n  }\n  out.push(`\\n**Behaviors**:`);\n  for (const b of VirtualHeavy.applyMechanics.behaviors) out.push(`- ${b}`);\n  out.push(`\\n### 4.6 Dependency Shot`);\n  out.push(VirtualHeavy.dependencyShot.description);\n  out.push(`> ${VirtualHeavy.dependencyShot.note}`);\n  out.push(`\\n### 4.7 Update Actions`);\n  for (const a of VirtualHeavy.updateActions) out.push(`- **${a.action}**: ${a.meaning} → ${a.do}`);\n  out.push(`\\n### 4.7.5 Heavy Apply Loop`);\n  out.push(VirtualHeavy.heavyApply.rule);\n  out.push(`- why: ${VirtualHeavy.heavyApply.why}`);\n  out.push(`- stdout: ${VirtualHeavy.heavyApply.stdout}`);\n  out.push(`- stderr: ${VirtualHeavy.heavyApply.stderr}`);\n  out.push(`\\n### 4.8 Failure Modes`);\n  for (const f of VirtualHeavy.failureModes) out.push(`${f.id}. **${f.mistake}** → ${f.result}\\n   fix: ${f.fix}`);\n  out.push(`\\n### 4.9 Checklist`);\n  out.push(`**before expand**:`);\n  for (const c of VirtualHeavy.checklist.beforeExpand) out.push(`- ${c}`);\n  out.push(`\\n**LLM prompt template**:\\n> ${VirtualHeavy.checklist.llmPromptTemplate}\\n`);\n  out.push(`**after apply**:`);\n  for (const c of VirtualHeavy.checklist.afterApply) out.push(`- ${c}`);\n  out.push(`\\n${VirtualHeavy.checklist.safetyNet}`);\n  out.push(`\\n### 4.10 Programmatic\\n\\`\\`\\`js\\n${VirtualHeavy.programmaticUsage}\\n\\`\\`\\``);\n  out.push('');\n\n  out.push(`## §5 Programmatic API`);\n  out.push(`### imports`);\n  for (const i of ProgrammaticApi.imports) out.push(`- ${i}`);\n  out.push(`\\n### Block ops`);\n  for (const i of ProgrammaticApi.blockOps) out.push(`- \\`${i}\\``);\n  out.push(`\\n### Graph ops`);\n  for (const i of ProgrammaticApi.graphOps) out.push(`- \\`${i}\\``);\n  out.push('');\n\n  out.push(`## §6 Lint(8 種)`);\n  for (const l of LintKinds) out.push(`- **${l.kind}**: ${l.detects} _(off: \\`${l.offFlag}\\`)_`);\n  out.push('');\n\n  out.push(`## §7 parseJS rules`);\n  for (const r of ParseJSRules) out.push(`- \\`${r.syntax}\\` → ${r.produces}`);\n\n  return out.join('\\n');\n}\n\nif (typeof process !== 'undefined' && /AiRunAndRead_MANUAL\\.js$/.test(process.argv[1] || '')) {\n  if (process.argv[2] === 'export-md') {\n    process.stdout.write(exportMarkdown());\n  } else {\n    console.log(`\\n##  AiRunAndRead_MANUAL.js v${VERSION}  ##\\n`);\n    console.log(`Workflow(${Workflow.length} steps), Virtual Heavy Function を中心とした 7 章構成`);\n    console.log(`CLI: ${Object.values(CliCommands).flat().length} commands`);\n    console.log(`Virtual Heavy: ${VirtualHeavy.applyMechanics.steps.length} apply steps + ${VirtualHeavy.failureModes.length} failure modes`);\n    console.log(`Lint: ${LintKinds.length} kinds\\n`);\n    console.log(`Usage:`);\n    console.log(`  node AiRunAndRead_MANUAL.js export-md > MANUAL.md`);\n    console.log(`  import { Workflow, VirtualHeavy, CliCommands, LintKinds } from './AiRunAndRead_MANUAL.js'`);\n  }\n}\n",
      "ts": 1778788882032,
      "refs": [
        {
          "kind": "calls",
          "target": "exportMarkdown"
        }
      ],
      "tags": [],
      "applyId": null
    },
    {
      "content": "// @tags: standalone reference\n// v2/AiRunAndRead_MANUAL.js\n// ai-desk 操作マニュアル — 何を、どの順で、どう叩くか\n//\n// ⚠️ ファイル名 prefix `AiRunAndRead_` の意味:\n//   1. `node AiRunAndRead_MANUAL.js` で実行 → 出力を読め\n//   2. or `import { Workflow, VirtualHeavy, CliCommands, ... } from './AiRunAndRead_MANUAL.js'`\n//   ⛔ .js ソースを prose として linear に読むな\n//\n// **canonical form**: this file (.js) ← REAL\n//\n// 思想: AiRunAndRead_BIBLE.js\n// 規律: AiRunAndRead_ONBOARDING.js\n// CLI 早見表: AiRunAndRead_BIBLE.js の Rituals(REFERENCE.md は廃止、Bible に統合済)\n//\n// 🚨 §VirtualHeavy が v2 の心臓。展開だけでなく **Apply(逆配分)の規律**を守ること。\n\nexport const VERSION = \"2.6\";\nexport const DATE = \"2026-05-04\";\n\n// ============================================================\n// §0 用語の最短定義\n// ============================================================\nexport const Glossary = {\n  Block:    \"{ id, type, versions[], meta }。すべての構成要素の単位\",\n  Version:  \"{ content, refs, children, tags, timestamp, prevHash, hash }。append-only、これが REAL\",\n  head:     \"最新 Version。block.content 等の getter は head() から派生(SHADOW)\",\n  Graph:    \"Block の集合 + 双方向走査(forward / backward / impact)\",\n  ref:      \"{ kind, target }。kind は import / calls / contains / link / observes 等\",\n  VirtualHeavy: \"root + forward 推移閉包を 1 content に展開して LLM に渡し、戻りを各 Block に逆配分する機構\",\n  REALVariable: \"`REAL_*`。実行 JS 内で AI / Kantoku が監視すべき正の状態を示す変数名接頭語\",\n};\n\n// ============================================================\n// §0.5 REAL_* variable convention\n// ============================================================\nexport const RealVariableConvention = {\n  purpose:\n    \"`REAL_*` は、実行 JS 内で AI / Kantoku が変化を追跡すべき「正の状態」を示す。\" +\n    \"型や単位の表現ではなく、観測・検証・prompt 生成の起点を示す命名規約。\",\n  useFor: [\n    \"アプリの主要状態\",\n    \"reducer / dispatch 後に更新される状態\",\n    \"render / eyes / test の入力になる状態\",\n    \"失われると挙動判断が壊れる状態\",\n  ],\n  avoidFor: [\n    \"一時変数\",\n    \"派生表示値\",\n    \"DOM 要素\",\n    \"キャッシュ\",\n    \"ループ内の小さな値\",\n    \"単なる定数\",\n  ],\n  rules: [\n    \"AST で `REAL_*` を検出した結果は `isWatched: true` と表現する\",\n    \"`check` は検査実行の動詞なので、監視対象かどうかの boolean 名には使わない\",\n    \"`REAL_*` は初期化時に記録可能である\",\n    \"`REAL_*` の再代入は trace 対象にできる\",\n    \"`REAL_*` は JSON serializable を推奨する\",\n    \"event / dispatch 後に `REAL_*` が変化しない場合、Kantoku は state_frozen 系の警告を出せる\",\n    \"`REAL_*` が変わった後、古い eyes / test / verification は stale とみなす\",\n  ],\n  example: `\nlet REAL_state = initialState();\n\nfor (const evt of events) {\n  REAL_state = dispatch(REAL_state, evt);\n  render(ctx, REAL_state);\n}\n  `,\n};\n\n// ============================================================\n// §1 30 秒で動かす\n// ============================================================\nexport const QuickStart = [\n  { cmd: \"cd /Users/AoyamaRito/PJs/ai-desk/v2\", desc: \"v2 フォルダへ\" },\n  { cmd: \"npm test\", desc: \"114 e2e + 71 3d-prefab tests, all green\" },\n  { cmd: \"node ai-desk.js\", desc: \"self-test(Block / Graph / parseJS の動作デモ)\" },\n  { cmd: \"node ai-desk.js self\", desc: \"自分自身を解析(自己読み込み)\" },\n];\n\n// ============================================================\n// §2 基本ワークフロー(典型的な 1 セッション、7 段)\n// ============================================================\nexport const Workflow = [\n  {\n    step: 1, name: \"既存 JS を Graph 化して保存\",\n    cmds: [\n      \"node ai-desk.js save graph.json src/foo.js src/bar.js\",\n      \"node ai-desk.js resolve graph.json\",\n    ],\n    note: \"graph.json が永続のソース。以降の apply / virtual-apply はこれを書き換える(append のみ)\",\n  },\n  {\n    step: 2, name: \"構造を把握\",\n    cmds: [\n      \"node ai-desk.js skeleton src/foo.js\",\n      \"node ai-desk.js stats src/foo.js\",\n      \"node ai-desk.js tags src/foo.js\",\n      \"node ai-desk.js mermaid src/foo.js\",\n    ],\n  },\n  {\n    step: 3, name: \"1 Block にズーム\",\n    cmds: [\n      \"node ai-desk.js focus src/foo.js src/foo.js:fn:bar\",\n      \"node ai-desk.js context src/foo.js src/foo.js:fn:bar 1\",\n    ],\n    note: \"context は target + 1 段の forward/backward を markdown で出す(LLM プロンプト用)\",\n  },\n  {\n    step: 4, name: \"影響範囲を見る(変更前のリスク評価)\",\n    cmds: [\"node ai-desk.js impact src/foo.js src/foo.js:fn:bar\"],\n    note: \"bar を変えると壊れうる Block 全部(backward の推移閉包)\",\n  },\n  {\n    step: 5, name: \"編集して反映 — 3 つの粒度\",\n    sub: [\n      { granularity: \"ファイル全体 patch\",          cmd: \"apply graph.json patch.js <moduleId>\",         what: \"patch を parseJS → Block 単位で diff → 変更分だけ commit\" },\n      { granularity: \"1 関数だけ patch\",             cmd: \"apply-block graph.json <blockId> patch.js\",   what: \"mini-parse して refs/tags 自動再計算 → 1 Block に commit\" },\n      { granularity: \"重厚関数(root + 依存)patch\", cmd: \"virtual-apply graph.json <rootId> patch.txt\", what: \"BLOCK ヘッダで分割 → 各 Block に逆配分 commit\" },\n    ],\n  },\n  {\n    step: 6, name: \"履歴を見る\",\n    cmds: [\n      \"node ai-desk.js diff src/foo.js src/foo.js:fn:bar\",\n      \"node ai-desk.js diff src/foo.js src/foo.js:fn:bar 0 3\",\n      \"node ai-desk.js blame src/foo.js src/foo.js:fn:bar src/foo.js:fn:baz\",\n    ],\n  },\n  {\n    step: 7, name: \"Graph をコードに戻す\",\n    cmds: [\"node ai-desk.js export graph.json src/foo.js out.js\"],\n    note: \"module Block の contains 順に Block の content を結合して再生成。import の named/default/namespace 区別は完全 round-trip しない(MVP の限界)\",\n  },\n];\n\n// ============================================================\n// §3 CLI コマンド全 24 種(用途別)\n// ============================================================\nexport const CliCommands = {\n  observe: [\n    { cmd: \"skeleton <file>\",              use: \"Block 一覧 + refs\" },\n    { cmd: \"focus <file> <id>\",            use: \"指定 Block の content\" },\n    { cmd: \"context <file> <id> [depth]\",  use: \"target + 近傍を LLM 用 markdown に整形\" },\n    { cmd: \"stats <file>\",                 use: \"集計(block / version / byType / byTag)\" },\n    { cmd: \"tags <file>\",                  use: \"全タグと件数\" },\n    { cmd: \"tag <file> <tag>\",             use: \"あるタグを持つ Block 一覧\" },\n    { cmd: \"search <file> <query>\",        use: \"content の部分一致検索\" },\n    { cmd: \"impact <file> <id>\",           use: \"backward 推移閉包(変更時の影響範囲)\" },\n    { cmd: \"diff <file> <id> [i] [j]\",     use: \"version 間差分\" },\n    { cmd: \"blame <file> <id> <ref>\",      use: \"ref が初めて追加された version\" },\n    { cmd: \"mermaid <file>\",               use: \"flowchart LR を stdout\" },\n    { cmd: \"infer-tags <file> <id>\",       use: \"content からタグ推論(test/io/pure 等)\" },\n    { cmd: \"lint <file> [--summary] [--only=K1,K2]\", use: \"8 種の整合性チェック\" },\n    { cmd: \"self\",                          use: \"自分自身(ai-desk.js)を解析\" },\n  ],\n  persist: [\n    { cmd: \"save <out.json> <files...>\",   use: \"ファイル群 → Graph → JSON\" },\n    { cmd: \"load <in.json>\",                use: \"JSON 読み込み + verify\" },\n    { cmd: \"graph <files...>\",              use: \"parseJS 結果を JSON で stdout\" },\n    { cmd: \"resolve <graph.json>\",          use: \"import の相対パスを Block ID に解決\" },\n    { cmd: \"export <graph.json> <moduleId> [out.js]\", use: \"Graph から JS 再生成\" },\n  ],\n  edit_append_only: [\n    { cmd: \"apply <graph.json> <patch.js> <moduleId>\",  use: \"ファイル単位 patch\" },\n    { cmd: \"apply-block <graph.json> <blockId> <patch>\", use: \"1 Block 単位 patch(- で stdin)\" },\n    { cmd: \"virtual-apply <graph.json> <rootId> <patch>\", use: \"仮想重厚関数の逆配分(- で stdin)\" },\n    { cmd: \"heavy-apply <graph.json> <rootId> <patch|-> [--depth=N] [--out=after.txt]\", use: \"virtual-apply 後に同じ scope を再展開\" },\n  ],\n  virtualHeavy: [\n    { cmd: \"heavy <file|graph.json> <root-id> [--depth=N]\", use: \"root + 依存を 1 content に展開して stdout\" },\n  ],\n  verify: [\n    { cmd: \"e2e\", use: \"テスト実行(npm test と同じ)\" },\n  ],\n};\n\n// ============================================================\n// §4 Virtual Heavy Function — v2 のキラー機能(心臓部)\n// ============================================================\nexport const VirtualHeavy = {\n\n  // §4.1 解く問題\n  problem: {\n    description: \"LLM は全文脈集約された方が間違えない(重厚関数原則)。ただし Block 分割は履歴・検索・refs に必要。普通は二者択一。\",\n    layers: {\n      物理層:    \"graph.json 上の状態。細粒度 Block + versions + refs。最適化対象: 管理 / 履歴 / 影響分析\",\n      論理層:    \"LLM に渡す content。root + forward 推移閉包を 1 つの巨大 content に展開。最適化対象: LLM の認知(全文脈集約)\",\n    },\n    insight: \"両者を往復させる機構が Virtual Heavy Function。展開だけでは半分。逆配分があって初めて閉じる。\",\n  },\n\n  // §4.2 全体フロー\n  flow: `\n[graph.json]                                                 [graph.json]\n  ├─ Block A (root) ─┐                                         ├─ Block A (root) ← v+1\n  ├─ Block B        ├─→ heavy.txt ──→ LLM ──→ heavy.txt' ──→  ├─ Block B        ← v+1\n  ├─ Block C        │   (1 content)         (編集済 1 content)  ├─ Block C        ← unchanged\n  └─ Block D ───────┘                                          └─ Block D        ← v+1\n        ↑                  ↑                                              ↑\n   virtualHeavy        expandVirtualHeavy                          virtualApply\n   (forward閉包を集める)   (1 content に連結)                       (各 Block に逆配分 commit)\n  `.trim(),\n\n  // §4.3 ワークフロー\n  workflow: [\n    \"1. node ai-desk.js save graph.json src/foo.js\",\n    \"2. node ai-desk.js resolve graph.json\",\n    \"3. node ai-desk.js heavy src/foo.js src/foo.js:fn:render --depth=3 > heavy.txt\",\n    \"4. heavy.txt を LLM に投げる(BLOCK ヘッダを残したまま content だけ編集して返してもらう)\",\n    \"5. node ai-desk.js virtual-apply graph.json src/foo.js:fn:render heavy.txt\",\n    \"6. 連続編集するときは node ai-desk.js heavy-apply graph.json src/foo.js:fn:render heavy.txt --depth=3 --out=heavy.after.txt\",\n    \"7. node ai-desk.js diff src/foo.js src/foo.js:fn:render\",\n    \"8. node ai-desk.js lint src/foo.js --summary\",\n  ],\n\n  // §4.4 展開フォーマット\n  expandedFormat: {\n    template: `\n// === Virtual Heavy Function rooted at <rootId> ===\n// N blocks combined into one logical heavy function\n// Edit the bodies; do not change the boundary headers.\n\n// --- BLOCK: <id1> (<type>) ---\n// tags: ...\n// refs: ...\n<content1>\n\n// --- BLOCK: <id2> (<type>) ---\n<content2>\n\n// === end of virtual heavy ===\n    `.trim(),\n    rules: [\n      { line: \"// === Virtual Heavy Function ... ===\",  role: \"全体ヘッダ\",                     editable: \"❌ 残す\" },\n      { line: \"// --- BLOCK: <id> (<type>) ---\",         role: \"境界ヘッダ。Apply の分割キー\",   editable: \"❌ 絶対に変えない・消さない・追加しない\" },\n      { line: \"// tags: ... / // refs: ...\",              role: \"参考表示(commit 時に除去)\",    editable: \"⚪ 触っても無視される\" },\n      { line: \"<content>\",                                role: \"Block の本体\",                   editable: \"✅ ここを編集する\" },\n      { line: \"// === end of virtual heavy ===\",          role: \"終端マーカー\",                   editable: \"❌ 残す\" },\n    ],\n  },\n\n  // §4.5 Apply(virtualApply)— 逆配分の正確な挙動\n  applyMechanics: {\n    summary: \"virtualApply(graph, rootId, expandedContent, opts = {}) の動作\",\n    steps: [\n      {\n        step: \"Step 1 スコープ集合の再計算\",\n        what: \"expand と同じ opts(depth, kind)で virtualHeavy を呼び直す。これが Apply のスコープになる Block 集合。\",\n        warn: \"🚨 expand と apply で opts(特に depth)が違うとスコープがズレる。expand 時に --depth=3 なら apply も同じ depth で。\",\n      },\n      {\n        step: \"Step 2 入力 content を BLOCK ヘッダで分割\",\n        regex: /^\\s*\\/\\/\\s*---\\s*BLOCK:\\s*(\\S+)\\s*\\(([^)]+)\\)\\s*---\\s*$/.toString(),\n        what: \"行頭からヘッダを検出、次のヘッダ(または末尾)までを 1 segment の body とする。body から末尾の === end === と // tags: / // refs: 行を除去。\",\n      },\n      {\n        step: \"Step 3 各 segment を Block に逆配分\",\n        what: \"heavyById.get(seg.id) で対応 Block を探し、target.applyPatch(seg.content) を呼ぶ。スコープ外 id は静かに skip(skipped-out-of-scope)。\",\n      },\n      {\n        step: \"Step 4 applyPatch の中身(Block 単位)\",\n        rules: [\n          \"head().content と同一 + refs/tags も opts と一致 → action: 'unchanged'(新 version 作らない)\",\n          \"違っていれば commit({content, refs: opts.refs ?? head.refs, tags: opts.tags ?? head.tags, meta:{appliedAt}})\",\n          \"→ action: 'updated'(既存 head あり)or 'created'(なし)\",\n        ],\n      },\n    ],\n    behaviors: [\n      \"スコープ内 + content 変化あり → 新 version を append(refs/tags は head 継承)\",\n      \"スコープ内 + content 同じ → 何もしない(version 履歴を汚さない)\",\n      \"スコープ外 id → 静かに skip(エラー出さず、log だけ)\",\n    ],\n  },\n\n  // §4.6 「依存性ごと撃つ」が成立する仕組み\n  dependencyShot: {\n    description: \"virtualHeavy(graph, rootId, { kind: 'calls' }) は forward の推移閉包。root を 1 個指定すると呼ぶ先(forward)を再帰的に集めて 1 content に。\",\n    comparison: [\n      { axis: \"LLM が見える文脈\",         v1: \"1 関数のみ\",            v2: \"root + 全依存先\" },\n      { axis: \"整合の取り方\",              v1: \"編集後に他関数を別途修正\", v2: \"同一プロンプト内で同時に\" },\n      { axis: \"物理ファイル\",              v1: \"各関数は分散したまま\",   v2: \"同上(分散したまま)\" },\n      { axis: \"履歴\",                       v1: \"各関数 1 commit\",       v2: \"全関連 Block が同時に新 version\" },\n      { axis: \"v1 の共有ヘルパー禁止\",     v1: \"維持\",                  v2: \"維持(物理は分散、論理だけ統合)\" },\n    ],\n    note: \"1 root を撃つと refs で繋がる関連 Block 全てが 1 トランザクションのように更新。append-only なので rollback も自然(各 Block を rollback(prev_index) で)。\",\n  },\n\n  // §4.7 Apply の戻り値(updates 配列)を必ず読む\n  updateActions: [\n    { action: \"updated\",              meaning: \"既存 Block に新 version が append された\",                          do: \"✅ 期待通り\" },\n    { action: \"created\",              meaning: \"Block が無かったので新規作成された\",                                do: \"⚠ 本来あり得ない(virtualHeavy は既存 Block を集めるため)。発生したら設計バグ\" },\n    { action: \"unchanged\",            meaning: \"content が head と同一だったので何もしなかった\",                    do: \"✅ 履歴を汚さない正しい挙動\" },\n    { action: \"skipped-out-of-scope\", meaning: \"入力に virtualHeavy 集合に無い id のヘッダがあった\",                do: \"🚨 要確認。LLM がヘッダを勝手に追加 / 改変した可能性\" },\n  ],\n\n  heavyApply: {\n    rule: \"`heavy-apply` は `virtual-apply` + graph 保存 + 同一 root/depth の再 `heavy` 展開を 1 コマンドに畳む。\",\n    why: \"AI が編集後の更新済み文脈をすぐ再読できる。Virtual Heavy を一回きりの patch pack ではなく編集ループにする。\",\n    stdout: \"--out 無しなら再展開 content を stdout に出す。--out 指定時は after file に書く。\",\n    stderr: \"apply updates / stats / out path は stderr に出すので stdout の heavy content を汚さない。\",\n  },\n\n  // §4.8 Apply を壊す 6 パターン\n  failureModes: [\n    { id: 1, mistake: \"LLM が BLOCK ヘッダを書き換え/翻訳した\",                       result: \"その segment が skipped-out-of-scope で消える\",         fix: \"プロンプトに「ヘッダ行は絶対変更しない」を明記\" },\n    { id: 2, mistake: \"LLM が新規 BLOCK ヘッダを追加して関数を生やした\",              result: \"skipped-out-of-scope で消える(既存セットに無い)\",   fix: \"別途 apply-block で新規追加、または apply で patch.js として渡す\" },\n    { id: 3, mistake: \"expand と apply で --depth が違う\",                              result: \"スコープ集合がズレる、一部 segment が skip\",            fix: \"同じ depth・同じ kind を必ず使う(opts を変数に切り出して両方に渡す)\" },\n    { id: 4, mistake: \"apply 後に元の root を消した / id を改名した\",                  result: \"次回 expand で全く違う集合が出る\",                       fix: \"rename は rollback + 新 id 作成 → 旧 id 非推奨化、で段階的に\" },\n    { id: 5, mistake: \"content の { } が崩れた\",                                         result: \"commit 自体は通るが lint の brace-mismatch が出る\",     fix: \"lint --only=brace で即検出、再 expand → 修正 → re-apply\" },\n    { id: 6, mistake: \"refs/tags 行を本気で書き換えた\",                                  result: \"無視される(commit 時に head から継承)\",                fix: \"refs/tags を変えたいなら apply-block で smart 再計算 / 手動 commit\" },\n  ],\n\n  // §4.9 Apply の正しい使い方チェックリスト\n  checklist: {\n    beforeExpand: [\n      \"node ai-desk.js impact src/foo.js <rootId>     # 影響範囲を把握\",\n      \"node ai-desk.js heavy  src/foo.js <rootId> --depth=N | head -50   # 何 Block 入るか目視\",\n    ],\n    llmPromptTemplate:\n      \"以下は Virtual Heavy Function。`// --- BLOCK: <id> (<type>) ---` のヘッダ行は絶対に変えない・消さない・追加しない。\\n\" +\n      \"各 BLOCK の content だけを編集して返してください。新規関数を追加したい場合は別途指示します。\",\n    afterApply: [\n      \"node ai-desk.js virtual-apply graph.json <rootId> heavy.txt | tee apply.log\",\n      \"grep skipped apply.log\",\n      \"node ai-desk.js lint src/foo.js --summary\",\n      \"node ai-desk.js diff src/foo.js <rootId>\",\n      \"node ai-desk.js load graph.json     # verify を最後に必ず\",\n    ],\n    safetyNet: \"Apply は append-only なので何度やり直しても履歴は壊れない。失敗を恐れずに往復を回す。万一の時は b.rollback(prevIndex) で過去 version を新 version として復元。\",\n  },\n\n  // §4.10 プログラマティック API\n  programmaticUsage: `\nimport { loadGraph, saveGraph, expandVirtualHeavy, virtualApply } from './ai-desk.js';\n\nconst g = loadGraph('graph.json');\nconst rootId = 'src/foo.js:fn:render';\nconst opts = { depth: 3, kind: 'calls' };   // ← expand と apply で同じ opts を使う\n\nconst expanded = expandVirtualHeavy(g, rootId, opts);\nconst edited = await callLLM(expanded);\nconst updates = virtualApply(g, rootId, edited, opts);\n\nconst dropped = updates.filter(u => u.action === 'skipped-out-of-scope');\nif (dropped.length) console.warn('dropped segments:', dropped);\n\nsaveGraph(g, 'graph.json');\n  `.trim(),\n};\n\n// ============================================================\n// §5 プログラマティック API\n// ============================================================\nexport const ProgrammaticApi = {\n  imports: [\n    \"Block, Graph\",\n    \"parseJS, parseMD, loadProject, checkBraces\",\n    \"saveGraph, loadGraph, buildAndSave\",\n    \"applyPatch, applyToBlock, applyBlockSmart, resolveImports\",\n    \"virtualHeavy, expandVirtualHeavy, virtualApply\",\n    \"exportModule, exportToFile, exportMermaid\",\n    \"inferTags, graphStats, blockContext, formatContextForLLM\",\n    \"constraintBlock, evalConstraint\",\n    \"observationBlock\",\n  ],\n  blockOps: [\n    \"b.versions.length / b.content / b.head() / b.at(timestamp)\",\n    \"b.diff(0, 1) / b.blameRef('x')\",\n    \"b.rollback(0)  // 過去状態を新しい past として commit、履歴は保持\",\n    \"b.verify()      // hash チェーン検証\",\n  ],\n  graphOps: [\n    \"g.forward(id, kind?) / g.backward(id, kind?) / g.impact(id, kind?)\",\n    \"g.byType('function') / g.byTag('export')\",\n    \"g.search('TODO', { type, tag, includeOldVersions })\",\n    \"g.at(timestamp) / g.lint({orphan:false}) / g.verify()\",\n  ],\n};\n\n// ============================================================\n// §6 lint(整合性チェック 8 種)\n// ============================================================\nexport const LintKinds = [\n  { kind: 'broken-ref',     detects: \"target が存在しない ref(import の外部モジュールは除外)\", offFlag: \"{ broken: false }\" },\n  { kind: 'orphan',         detects: \"誰からも参照されない非 module Block\",                       offFlag: \"{ orphan: false }\" },\n  { kind: 'circular',       detects: \"forward の循環\",                                              offFlag: \"{ circular: false }\" },\n  { kind: 'brace-mismatch', detects: \"content の { } が不揃い(文字列・regex は skip)\",         offFlag: \"{ brace: false }\" },\n  { kind: 'calls-leak',     detects: \"他関数呼び出しの形跡があるが calls ref が無い\",              offFlag: \"{ calls: false }\" },\n  { kind: 'tag-mismatch',   detects: \"type と tags が不整合(function なのに tags に function なし 等)\", offFlag: \"{ tags: false }\" },\n  { kind: 'empty-block',    detects: \"content / refs / children がすべて空\",                        offFlag: \"{ empty: false }\" },\n  { kind: 'hash-broken',    detects: \"version の prevHash チェーン破損\",                            offFlag: \"{ hash: false }\" },\n];\n\n// ============================================================\n// §7 parseJS の挙動と限界\n// ============================================================\nexport const ParseJSRules = [\n  { syntax: \"ファイル全体\",                                              produces: \"module Block。refs に import と contains\" },\n  { syntax: \"function foo(){} / export function / async function\",      produces: \"function Block(tags: function, async?, export?, generator?)\" },\n  { syntax: \"const foo = () => {}\",                                       produces: \"function Block(tags: function, arrow)\" },\n  { syntax: \"class Foo {} / export class\",                                produces: \"class Block(tags: class, export?, default?)\" },\n  { syntax: \"import ... from 'x'\",                                         produces: \"module の refs に { kind: 'import', target: 'x' }\" },\n  { syntax: \"同モジュール内の関数呼び出し\",                              produces: \"calls ref(名前ベース、後段で再 commit)\" },\n  { syntax: \"// [ai_s_emblem:#a#b Name] / // @tags: a, b\",                 produces: \"tags に取込(v1 互換、20 行遡及)\" },\n];\n\n// ============================================================\n// Self-display + export-md\n// ============================================================\nexport function exportMarkdown() {\n  const out = [];\n  out.push(`# ai-desk 操作マニュアル v${VERSION}`);\n  out.push(`> Auto-generated from AiRunAndRead_MANUAL.js — DO NOT EDIT THIS FILE DIRECTLY.`);\n  out.push(`> Run \\`node v2/AiRunAndRead_MANUAL.js export-md > MANUAL.md\\` to regenerate.`);\n  out.push(`> Date: ${DATE}\\n`);\n  out.push(`> ⚡ §VirtualHeavy が v2 の心臓。Apply の規律を守ること。\\n`);\n\n  out.push(`## §0 Glossary`);\n  for (const [k, v] of Object.entries(Glossary)) out.push(`- **${k}**: ${v}`);\n  out.push('');\n\n  out.push(`## §0.5 REAL_* Variable Convention`);\n  out.push(RealVariableConvention.purpose);\n  out.push(`\\n### Use For`);\n  for (const r of RealVariableConvention.useFor) out.push(`- ${r}`);\n  out.push(`\\n### Avoid For`);\n  for (const r of RealVariableConvention.avoidFor) out.push(`- ${r}`);\n  out.push(`\\n### Rules`);\n  for (const r of RealVariableConvention.rules) out.push(`- ${r}`);\n  out.push(`\\n### Example\\n\\`\\`\\`js${RealVariableConvention.example}\\`\\`\\`\\n`);\n\n  out.push(`## §1 Quick Start`);\n  for (const q of QuickStart) out.push(`- \\`${q.cmd}\\` — ${q.desc}`);\n  out.push('');\n\n  out.push(`## §2 Workflow(7 段)`);\n  for (const w of Workflow) {\n    out.push(`### ${w.step}. ${w.name}`);\n    if (w.cmds) for (const c of w.cmds) out.push(`- \\`${c}\\``);\n    if (w.sub) {\n      for (const s of w.sub) out.push(`- ${s.granularity}: \\`${s.cmd}\\` — ${s.what}`);\n    }\n    if (w.note) out.push(`> ${w.note}`);\n    out.push('');\n  }\n\n  out.push(`## §3 CLI Commands`);\n  for (const [cat, cmds] of Object.entries(CliCommands)) {\n    out.push(`### ${cat}`);\n    for (const c of cmds) out.push(`- \\`${c.cmd}\\` — ${c.use}`);\n    out.push('');\n  }\n\n  out.push(`## §4 Virtual Heavy Function`);\n  out.push(`### 4.1 Problem`);\n  out.push(VirtualHeavy.problem.description);\n  out.push(`- 物理層: ${VirtualHeavy.problem.layers.物理層}`);\n  out.push(`- 論理層: ${VirtualHeavy.problem.layers.論理層}`);\n  out.push(`> ${VirtualHeavy.problem.insight}\\n`);\n  out.push(`### 4.2 Flow\\n\\`\\`\\`\\n${VirtualHeavy.flow}\\n\\`\\`\\`\\n`);\n  out.push(`### 4.3 Workflow`);\n  for (const s of VirtualHeavy.workflow) out.push(`- ${s}`);\n  out.push(`\\n### 4.4 Expanded Format\\n\\`\\`\\`\\n${VirtualHeavy.expandedFormat.template}\\n\\`\\`\\``);\n  for (const r of VirtualHeavy.expandedFormat.rules) out.push(`- \\`${r.line}\\` — ${r.role}(${r.editable})`);\n  out.push(`\\n### 4.5 Apply Mechanics`);\n  for (const s of VirtualHeavy.applyMechanics.steps) {\n    out.push(`#### ${s.step}`);\n    if (s.what) out.push(s.what);\n    if (s.warn) out.push(`> ${s.warn}`);\n    if (s.rules) for (const r of s.rules) out.push(`- ${r}`);\n  }\n  out.push(`\\n**Behaviors**:`);\n  for (const b of VirtualHeavy.applyMechanics.behaviors) out.push(`- ${b}`);\n  out.push(`\\n### 4.6 Dependency Shot`);\n  out.push(VirtualHeavy.dependencyShot.description);\n  out.push(`> ${VirtualHeavy.dependencyShot.note}`);\n  out.push(`\\n### 4.7 Update Actions`);\n  for (const a of VirtualHeavy.updateActions) out.push(`- **${a.action}**: ${a.meaning} → ${a.do}`);\n  out.push(`\\n### 4.7.5 Heavy Apply Loop`);\n  out.push(VirtualHeavy.heavyApply.rule);\n  out.push(`- why: ${VirtualHeavy.heavyApply.why}`);\n  out.push(`- stdout: ${VirtualHeavy.heavyApply.stdout}`);\n  out.push(`- stderr: ${VirtualHeavy.heavyApply.stderr}`);\n  out.push(`\\n### 4.8 Failure Modes`);\n  for (const f of VirtualHeavy.failureModes) out.push(`${f.id}. **${f.mistake}** → ${f.result}\\n   fix: ${f.fix}`);\n  out.push(`\\n### 4.9 Checklist`);\n  out.push(`**before expand**:`);\n  for (const c of VirtualHeavy.checklist.beforeExpand) out.push(`- ${c}`);\n  out.push(`\\n**LLM prompt template**:\\n> ${VirtualHeavy.checklist.llmPromptTemplate}\\n`);\n  out.push(`**after apply**:`);\n  for (const c of VirtualHeavy.checklist.afterApply) out.push(`- ${c}`);\n  out.push(`\\n${VirtualHeavy.checklist.safetyNet}`);\n  out.push(`\\n### 4.10 Programmatic\\n\\`\\`\\`js\\n${VirtualHeavy.programmaticUsage}\\n\\`\\`\\``);\n  out.push('');\n\n  out.push(`## §5 Programmatic API`);\n  out.push(`### imports`);\n  for (const i of ProgrammaticApi.imports) out.push(`- ${i}`);\n  out.push(`\\n### Block ops`);\n  for (const i of ProgrammaticApi.blockOps) out.push(`- \\`${i}\\``);\n  out.push(`\\n### Graph ops`);\n  for (const i of ProgrammaticApi.graphOps) out.push(`- \\`${i}\\``);\n  out.push('');\n\n  out.push(`## §6 Lint(8 種)`);\n  for (const l of LintKinds) out.push(`- **${l.kind}**: ${l.detects} _(off: \\`${l.offFlag}\\`)_`);\n  out.push('');\n\n  out.push(`## §7 parseJS rules`);\n  for (const r of ParseJSRules) out.push(`- \\`${r.syntax}\\` → ${r.produces}`);\n\n  return out.join('\\n');\n}\n\nif (typeof process !== 'undefined' && /AiRunAndRead_MANUAL\\.js$/.test(process.argv[1] || '')) {\n  if (process.argv[2] === 'export-md') {\n    process.stdout.write(exportMarkdown());\n  } else {\n    console.log(`\\n##  AiRunAndRead_MANUAL.js v${VERSION}  ##\\n`);\n    console.log(`Workflow(${Workflow.length} steps), Virtual Heavy Function を中心とした 7 章構成`);\n    console.log(`CLI: ${Object.values(CliCommands).flat().length} commands`);\n    console.log(`Virtual Heavy: ${VirtualHeavy.applyMechanics.steps.length} apply steps + ${VirtualHeavy.failureModes.length} failure modes`);\n    console.log(`Lint: ${LintKinds.length} kinds\\n`);\n    console.log(`Usage:`);\n    console.log(`  node AiRunAndRead_MANUAL.js export-md > MANUAL.md`);\n    console.log(`  import { Workflow, VirtualHeavy, CliCommands, LintKinds } from './AiRunAndRead_MANUAL.js'`);\n  }\n}\n",
      "ts": 1779867864900,
      "refs": [
        {
          "kind": "calls",
          "target": "exportMarkdown"
        }
      ],
      "tags": [
        "standalone",
        "reference"
      ],
      "applyId": "apply-2026-05-27-e6d24d22",
      "hash": "90c8f1d5760dd002af24ade7b60b644c5c9333296ebc09230ce2b212efff76dc",
      "prevHash": "d9abd3fa66dce9edf1aa116d73c091152f0667a4dbbd8b0ca70b952b58e5ff44"
    }
  ],
  "notes": {
    "apply:apply-2026-05-27-e6d24d22": [
      {
        "id": "n-bed8be90-5c02-4307-acba-978e18c3d870",
        "author": "human",
        "ts": 1779867864911,
        "text": "add @tags: standalone reference"
      }
    ]
  }
};

// === HEAD ===
// @tags: standalone reference
// v2/AiRunAndRead_MANUAL.js
// ai-desk 操作マニュアル — 何を、どの順で、どう叩くか
//
// ⚠️ ファイル名 prefix `AiRunAndRead_` の意味:
//   1. `node AiRunAndRead_MANUAL.js` で実行 → 出力を読め
//   2. or `import { Workflow, VirtualHeavy, CliCommands, ... } from './AiRunAndRead_MANUAL.js'`
//   ⛔ .js ソースを prose として linear に読むな
//
// **canonical form**: this file (.js) ← REAL
//
// 思想: AiRunAndRead_BIBLE.js
// 規律: AiRunAndRead_ONBOARDING.js
// CLI 早見表: AiRunAndRead_BIBLE.js の Rituals(REFERENCE.md は廃止、Bible に統合済)
//
// 🚨 §VirtualHeavy が v2 の心臓。展開だけでなく **Apply(逆配分)の規律**を守ること。

export const VERSION = "2.6";
export const DATE = "2026-05-04";

// ============================================================
// §0 用語の最短定義
// ============================================================
export const Glossary = {
  Block:    "{ id, type, versions[], meta }。すべての構成要素の単位",
  Version:  "{ content, refs, children, tags, timestamp, prevHash, hash }。append-only、これが REAL",
  head:     "最新 Version。block.content 等の getter は head() から派生(SHADOW)",
  Graph:    "Block の集合 + 双方向走査(forward / backward / impact)",
  ref:      "{ kind, target }。kind は import / calls / contains / link / observes 等",
  VirtualHeavy: "root + forward 推移閉包を 1 content に展開して LLM に渡し、戻りを各 Block に逆配分する機構",
  REALVariable: "`REAL_*`。実行 JS 内で AI / Kantoku が監視すべき正の状態を示す変数名接頭語",
};

// ============================================================
// §0.5 REAL_* variable convention
// ============================================================
export const RealVariableConvention = {
  purpose:
    "`REAL_*` は、実行 JS 内で AI / Kantoku が変化を追跡すべき「正の状態」を示す。" +
    "型や単位の表現ではなく、観測・検証・prompt 生成の起点を示す命名規約。",
  useFor: [
    "アプリの主要状態",
    "reducer / dispatch 後に更新される状態",
    "render / eyes / test の入力になる状態",
    "失われると挙動判断が壊れる状態",
  ],
  avoidFor: [
    "一時変数",
    "派生表示値",
    "DOM 要素",
    "キャッシュ",
    "ループ内の小さな値",
    "単なる定数",
  ],
  rules: [
    "AST で `REAL_*` を検出した結果は `isWatched: true` と表現する",
    "`check` は検査実行の動詞なので、監視対象かどうかの boolean 名には使わない",
    "`REAL_*` は初期化時に記録可能である",
    "`REAL_*` の再代入は trace 対象にできる",
    "`REAL_*` は JSON serializable を推奨する",
    "event / dispatch 後に `REAL_*` が変化しない場合、Kantoku は state_frozen 系の警告を出せる",
    "`REAL_*` が変わった後、古い eyes / test / verification は stale とみなす",
  ],
  example: `
let REAL_state = initialState();

for (const evt of events) {
  REAL_state = dispatch(REAL_state, evt);
  render(ctx, REAL_state);
}
  `,
};

// ============================================================
// §1 30 秒で動かす
// ============================================================
export const QuickStart = [
  { cmd: "cd /Users/AoyamaRito/PJs/ai-desk/v2", desc: "v2 フォルダへ" },
  { cmd: "npm test", desc: "114 e2e + 71 3d-prefab tests, all green" },
  { cmd: "node ai-desk.js", desc: "self-test(Block / Graph / parseJS の動作デモ)" },
  { cmd: "node ai-desk.js self", desc: "自分自身を解析(自己読み込み)" },
];

// ============================================================
// §2 基本ワークフロー(典型的な 1 セッション、7 段)
// ============================================================
export const Workflow = [
  {
    step: 1, name: "既存 JS を Graph 化して保存",
    cmds: [
      "node ai-desk.js save graph.json src/foo.js src/bar.js",
      "node ai-desk.js resolve graph.json",
    ],
    note: "graph.json が永続のソース。以降の apply / virtual-apply はこれを書き換える(append のみ)",
  },
  {
    step: 2, name: "構造を把握",
    cmds: [
      "node ai-desk.js skeleton src/foo.js",
      "node ai-desk.js stats src/foo.js",
      "node ai-desk.js tags src/foo.js",
      "node ai-desk.js mermaid src/foo.js",
    ],
  },
  {
    step: 3, name: "1 Block にズーム",
    cmds: [
      "node ai-desk.js focus src/foo.js src/foo.js:fn:bar",
      "node ai-desk.js context src/foo.js src/foo.js:fn:bar 1",
    ],
    note: "context は target + 1 段の forward/backward を markdown で出す(LLM プロンプト用)",
  },
  {
    step: 4, name: "影響範囲を見る(変更前のリスク評価)",
    cmds: ["node ai-desk.js impact src/foo.js src/foo.js:fn:bar"],
    note: "bar を変えると壊れうる Block 全部(backward の推移閉包)",
  },
  {
    step: 5, name: "編集して反映 — 3 つの粒度",
    sub: [
      { granularity: "ファイル全体 patch",          cmd: "apply graph.json patch.js <moduleId>",         what: "patch を parseJS → Block 単位で diff → 変更分だけ commit" },
      { granularity: "1 関数だけ patch",             cmd: "apply-block graph.json <blockId> patch.js",   what: "mini-parse して refs/tags 自動再計算 → 1 Block に commit" },
      { granularity: "重厚関数(root + 依存)patch", cmd: "virtual-apply graph.json <rootId> patch.txt", what: "BLOCK ヘッダで分割 → 各 Block に逆配分 commit" },
    ],
  },
  {
    step: 6, name: "履歴を見る",
    cmds: [
      "node ai-desk.js diff src/foo.js src/foo.js:fn:bar",
      "node ai-desk.js diff src/foo.js src/foo.js:fn:bar 0 3",
      "node ai-desk.js blame src/foo.js src/foo.js:fn:bar src/foo.js:fn:baz",
    ],
  },
  {
    step: 7, name: "Graph をコードに戻す",
    cmds: ["node ai-desk.js export graph.json src/foo.js out.js"],
    note: "module Block の contains 順に Block の content を結合して再生成。import の named/default/namespace 区別は完全 round-trip しない(MVP の限界)",
  },
];

// ============================================================
// §3 CLI コマンド全 24 種(用途別)
// ============================================================
export const CliCommands = {
  observe: [
    { cmd: "skeleton <file>",              use: "Block 一覧 + refs" },
    { cmd: "focus <file> <id>",            use: "指定 Block の content" },
    { cmd: "context <file> <id> [depth]",  use: "target + 近傍を LLM 用 markdown に整形" },
    { cmd: "stats <file>",                 use: "集計(block / version / byType / byTag)" },
    { cmd: "tags <file>",                  use: "全タグと件数" },
    { cmd: "tag <file> <tag>",             use: "あるタグを持つ Block 一覧" },
    { cmd: "search <file> <query>",        use: "content の部分一致検索" },
    { cmd: "impact <file> <id>",           use: "backward 推移閉包(変更時の影響範囲)" },
    { cmd: "diff <file> <id> [i] [j]",     use: "version 間差分" },
    { cmd: "blame <file> <id> <ref>",      use: "ref が初めて追加された version" },
    { cmd: "mermaid <file>",               use: "flowchart LR を stdout" },
    { cmd: "infer-tags <file> <id>",       use: "content からタグ推論(test/io/pure 等)" },
    { cmd: "lint <file> [--summary] [--only=K1,K2]", use: "8 種の整合性チェック" },
    { cmd: "self",                          use: "自分自身(ai-desk.js)を解析" },
  ],
  persist: [
    { cmd: "save <out.json> <files...>",   use: "ファイル群 → Graph → JSON" },
    { cmd: "load <in.json>",                use: "JSON 読み込み + verify" },
    { cmd: "graph <files...>",              use: "parseJS 結果を JSON で stdout" },
    { cmd: "resolve <graph.json>",          use: "import の相対パスを Block ID に解決" },
    { cmd: "export <graph.json> <moduleId> [out.js]", use: "Graph から JS 再生成" },
  ],
  edit_append_only: [
    { cmd: "apply <graph.json> <patch.js> <moduleId>",  use: "ファイル単位 patch" },
    { cmd: "apply-block <graph.json> <blockId> <patch>", use: "1 Block 単位 patch(- で stdin)" },
    { cmd: "virtual-apply <graph.json> <rootId> <patch>", use: "仮想重厚関数の逆配分(- で stdin)" },
    { cmd: "heavy-apply <graph.json> <rootId> <patch|-> [--depth=N] [--out=after.txt]", use: "virtual-apply 後に同じ scope を再展開" },
  ],
  virtualHeavy: [
    { cmd: "heavy <file|graph.json> <root-id> [--depth=N]", use: "root + 依存を 1 content に展開して stdout" },
  ],
  verify: [
    { cmd: "e2e", use: "テスト実行(npm test と同じ)" },
  ],
};

// ============================================================
// §4 Virtual Heavy Function — v2 のキラー機能(心臓部)
// ============================================================
export const VirtualHeavy = {

  // §4.1 解く問題
  problem: {
    description: "LLM は全文脈集約された方が間違えない(重厚関数原則)。ただし Block 分割は履歴・検索・refs に必要。普通は二者択一。",
    layers: {
      物理層:    "graph.json 上の状態。細粒度 Block + versions + refs。最適化対象: 管理 / 履歴 / 影響分析",
      論理層:    "LLM に渡す content。root + forward 推移閉包を 1 つの巨大 content に展開。最適化対象: LLM の認知(全文脈集約)",
    },
    insight: "両者を往復させる機構が Virtual Heavy Function。展開だけでは半分。逆配分があって初めて閉じる。",
  },

  // §4.2 全体フロー
  flow: `
[graph.json]                                                 [graph.json]
  ├─ Block A (root) ─┐                                         ├─ Block A (root) ← v+1
  ├─ Block B        ├─→ heavy.txt ──→ LLM ──→ heavy.txt' ──→  ├─ Block B        ← v+1
  ├─ Block C        │   (1 content)         (編集済 1 content)  ├─ Block C        ← unchanged
  └─ Block D ───────┘                                          └─ Block D        ← v+1
        ↑                  ↑                                              ↑
   virtualHeavy        expandVirtualHeavy                          virtualApply
   (forward閉包を集める)   (1 content に連結)                       (各 Block に逆配分 commit)
  `.trim(),

  // §4.3 ワークフロー
  workflow: [
    "1. node ai-desk.js save graph.json src/foo.js",
    "2. node ai-desk.js resolve graph.json",
    "3. node ai-desk.js heavy src/foo.js src/foo.js:fn:render --depth=3 > heavy.txt",
    "4. heavy.txt を LLM に投げる(BLOCK ヘッダを残したまま content だけ編集して返してもらう)",
    "5. node ai-desk.js virtual-apply graph.json src/foo.js:fn:render heavy.txt",
    "6. 連続編集するときは node ai-desk.js heavy-apply graph.json src/foo.js:fn:render heavy.txt --depth=3 --out=heavy.after.txt",
    "7. node ai-desk.js diff src/foo.js src/foo.js:fn:render",
    "8. node ai-desk.js lint src/foo.js --summary",
  ],

  // §4.4 展開フォーマット
  expandedFormat: {
    template: `
// === Virtual Heavy Function rooted at <rootId> ===
// N blocks combined into one logical heavy function
// Edit the bodies; do not change the boundary headers.

// --- BLOCK: <id1> (<type>) ---
// tags: ...
// refs: ...
<content1>

// --- BLOCK: <id2> (<type>) ---
<content2>

// === end of virtual heavy ===
    `.trim(),
    rules: [
      { line: "// === Virtual Heavy Function ... ===",  role: "全体ヘッダ",                     editable: "❌ 残す" },
      { line: "// --- BLOCK: <id> (<type>) ---",         role: "境界ヘッダ。Apply の分割キー",   editable: "❌ 絶対に変えない・消さない・追加しない" },
      { line: "// tags: ... / // refs: ...",              role: "参考表示(commit 時に除去)",    editable: "⚪ 触っても無視される" },
      { line: "<content>",                                role: "Block の本体",                   editable: "✅ ここを編集する" },
      { line: "// === end of virtual heavy ===",          role: "終端マーカー",                   editable: "❌ 残す" },
    ],
  },

  // §4.5 Apply(virtualApply)— 逆配分の正確な挙動
  applyMechanics: {
    summary: "virtualApply(graph, rootId, expandedContent, opts = {}) の動作",
    steps: [
      {
        step: "Step 1 スコープ集合の再計算",
        what: "expand と同じ opts(depth, kind)で virtualHeavy を呼び直す。これが Apply のスコープになる Block 集合。",
        warn: "🚨 expand と apply で opts(特に depth)が違うとスコープがズレる。expand 時に --depth=3 なら apply も同じ depth で。",
      },
      {
        step: "Step 2 入力 content を BLOCK ヘッダで分割",
        regex: /^\s*\/\/\s*---\s*BLOCK:\s*(\S+)\s*\(([^)]+)\)\s*---\s*$/.toString(),
        what: "行頭からヘッダを検出、次のヘッダ(または末尾)までを 1 segment の body とする。body から末尾の === end === と // tags: / // refs: 行を除去。",
      },
      {
        step: "Step 3 各 segment を Block に逆配分",
        what: "heavyById.get(seg.id) で対応 Block を探し、target.applyPatch(seg.content) を呼ぶ。スコープ外 id は静かに skip(skipped-out-of-scope)。",
      },
      {
        step: "Step 4 applyPatch の中身(Block 単位)",
        rules: [
          "head().content と同一 + refs/tags も opts と一致 → action: 'unchanged'(新 version 作らない)",
          "違っていれば commit({content, refs: opts.refs ?? head.refs, tags: opts.tags ?? head.tags, meta:{appliedAt}})",
          "→ action: 'updated'(既存 head あり)or 'created'(なし)",
        ],
      },
    ],
    behaviors: [
      "スコープ内 + content 変化あり → 新 version を append(refs/tags は head 継承)",
      "スコープ内 + content 同じ → 何もしない(version 履歴を汚さない)",
      "スコープ外 id → 静かに skip(エラー出さず、log だけ)",
    ],
  },

  // §4.6 「依存性ごと撃つ」が成立する仕組み
  dependencyShot: {
    description: "virtualHeavy(graph, rootId, { kind: 'calls' }) は forward の推移閉包。root を 1 個指定すると呼ぶ先(forward)を再帰的に集めて 1 content に。",
    comparison: [
      { axis: "LLM が見える文脈",         v1: "1 関数のみ",            v2: "root + 全依存先" },
      { axis: "整合の取り方",              v1: "編集後に他関数を別途修正", v2: "同一プロンプト内で同時に" },
      { axis: "物理ファイル",              v1: "各関数は分散したまま",   v2: "同上(分散したまま)" },
      { axis: "履歴",                       v1: "各関数 1 commit",       v2: "全関連 Block が同時に新 version" },
      { axis: "v1 の共有ヘルパー禁止",     v1: "維持",                  v2: "維持(物理は分散、論理だけ統合)" },
    ],
    note: "1 root を撃つと refs で繋がる関連 Block 全てが 1 トランザクションのように更新。append-only なので rollback も自然(各 Block を rollback(prev_index) で)。",
  },

  // §4.7 Apply の戻り値(updates 配列)を必ず読む
  updateActions: [
    { action: "updated",              meaning: "既存 Block に新 version が append された",                          do: "✅ 期待通り" },
    { action: "created",              meaning: "Block が無かったので新規作成された",                                do: "⚠ 本来あり得ない(virtualHeavy は既存 Block を集めるため)。発生したら設計バグ" },
    { action: "unchanged",            meaning: "content が head と同一だったので何もしなかった",                    do: "✅ 履歴を汚さない正しい挙動" },
    { action: "skipped-out-of-scope", meaning: "入力に virtualHeavy 集合に無い id のヘッダがあった",                do: "🚨 要確認。LLM がヘッダを勝手に追加 / 改変した可能性" },
  ],

  heavyApply: {
    rule: "`heavy-apply` は `virtual-apply` + graph 保存 + 同一 root/depth の再 `heavy` 展開を 1 コマンドに畳む。",
    why: "AI が編集後の更新済み文脈をすぐ再読できる。Virtual Heavy を一回きりの patch pack ではなく編集ループにする。",
    stdout: "--out 無しなら再展開 content を stdout に出す。--out 指定時は after file に書く。",
    stderr: "apply updates / stats / out path は stderr に出すので stdout の heavy content を汚さない。",
  },

  // §4.8 Apply を壊す 6 パターン
  failureModes: [
    { id: 1, mistake: "LLM が BLOCK ヘッダを書き換え/翻訳した",                       result: "その segment が skipped-out-of-scope で消える",         fix: "プロンプトに「ヘッダ行は絶対変更しない」を明記" },
    { id: 2, mistake: "LLM が新規 BLOCK ヘッダを追加して関数を生やした",              result: "skipped-out-of-scope で消える(既存セットに無い)",   fix: "別途 apply-block で新規追加、または apply で patch.js として渡す" },
    { id: 3, mistake: "expand と apply で --depth が違う",                              result: "スコープ集合がズレる、一部 segment が skip",            fix: "同じ depth・同じ kind を必ず使う(opts を変数に切り出して両方に渡す)" },
    { id: 4, mistake: "apply 後に元の root を消した / id を改名した",                  result: "次回 expand で全く違う集合が出る",                       fix: "rename は rollback + 新 id 作成 → 旧 id 非推奨化、で段階的に" },
    { id: 5, mistake: "content の { } が崩れた",                                         result: "commit 自体は通るが lint の brace-mismatch が出る",     fix: "lint --only=brace で即検出、再 expand → 修正 → re-apply" },
    { id: 6, mistake: "refs/tags 行を本気で書き換えた",                                  result: "無視される(commit 時に head から継承)",                fix: "refs/tags を変えたいなら apply-block で smart 再計算 / 手動 commit" },
  ],

  // §4.9 Apply の正しい使い方チェックリスト
  checklist: {
    beforeExpand: [
      "node ai-desk.js impact src/foo.js <rootId>     # 影響範囲を把握",
      "node ai-desk.js heavy  src/foo.js <rootId> --depth=N | head -50   # 何 Block 入るか目視",
    ],
    llmPromptTemplate:
      "以下は Virtual Heavy Function。`// --- BLOCK: <id> (<type>) ---` のヘッダ行は絶対に変えない・消さない・追加しない。\n" +
      "各 BLOCK の content だけを編集して返してください。新規関数を追加したい場合は別途指示します。",
    afterApply: [
      "node ai-desk.js virtual-apply graph.json <rootId> heavy.txt | tee apply.log",
      "grep skipped apply.log",
      "node ai-desk.js lint src/foo.js --summary",
      "node ai-desk.js diff src/foo.js <rootId>",
      "node ai-desk.js load graph.json     # verify を最後に必ず",
    ],
    safetyNet: "Apply は append-only なので何度やり直しても履歴は壊れない。失敗を恐れずに往復を回す。万一の時は b.rollback(prevIndex) で過去 version を新 version として復元。",
  },

  // §4.10 プログラマティック API
  programmaticUsage: `
import { loadGraph, saveGraph, expandVirtualHeavy, virtualApply } from './ai-desk.js';

const g = loadGraph('graph.json');
const rootId = 'src/foo.js:fn:render';
const opts = { depth: 3, kind: 'calls' };   // ← expand と apply で同じ opts を使う

const expanded = expandVirtualHeavy(g, rootId, opts);
const edited = await callLLM(expanded);
const updates = virtualApply(g, rootId, edited, opts);

const dropped = updates.filter(u => u.action === 'skipped-out-of-scope');
if (dropped.length) console.warn('dropped segments:', dropped);

saveGraph(g, 'graph.json');
  `.trim(),
};

// ============================================================
// §5 プログラマティック API
// ============================================================
export const ProgrammaticApi = {
  imports: [
    "Block, Graph",
    "parseJS, parseMD, loadProject, checkBraces",
    "saveGraph, loadGraph, buildAndSave",
    "applyPatch, applyToBlock, applyBlockSmart, resolveImports",
    "virtualHeavy, expandVirtualHeavy, virtualApply",
    "exportModule, exportToFile, exportMermaid",
    "inferTags, graphStats, blockContext, formatContextForLLM",
    "constraintBlock, evalConstraint",
    "observationBlock",
  ],
  blockOps: [
    "b.versions.length / b.content / b.head() / b.at(timestamp)",
    "b.diff(0, 1) / b.blameRef('x')",
    "b.rollback(0)  // 過去状態を新しい past として commit、履歴は保持",
    "b.verify()      // hash チェーン検証",
  ],
  graphOps: [
    "g.forward(id, kind?) / g.backward(id, kind?) / g.impact(id, kind?)",
    "g.byType('function') / g.byTag('export')",
    "g.search('TODO', { type, tag, includeOldVersions })",
    "g.at(timestamp) / g.lint({orphan:false}) / g.verify()",
  ],
};

// ============================================================
// §6 lint(整合性チェック 8 種)
// ============================================================
export const LintKinds = [
  { kind: 'broken-ref',     detects: "target が存在しない ref(import の外部モジュールは除外)", offFlag: "{ broken: false }" },
  { kind: 'orphan',         detects: "誰からも参照されない非 module Block",                       offFlag: "{ orphan: false }" },
  { kind: 'circular',       detects: "forward の循環",                                              offFlag: "{ circular: false }" },
  { kind: 'brace-mismatch', detects: "content の { } が不揃い(文字列・regex は skip)",         offFlag: "{ brace: false }" },
  { kind: 'calls-leak',     detects: "他関数呼び出しの形跡があるが calls ref が無い",              offFlag: "{ calls: false }" },
  { kind: 'tag-mismatch',   detects: "type と tags が不整合(function なのに tags に function なし 等)", offFlag: "{ tags: false }" },
  { kind: 'empty-block',    detects: "content / refs / children がすべて空",                        offFlag: "{ empty: false }" },
  { kind: 'hash-broken',    detects: "version の prevHash チェーン破損",                            offFlag: "{ hash: false }" },
];

// ============================================================
// §7 parseJS の挙動と限界
// ============================================================
export const ParseJSRules = [
  { syntax: "ファイル全体",                                              produces: "module Block。refs に import と contains" },
  { syntax: "function foo(){} / export function / async function",      produces: "function Block(tags: function, async?, export?, generator?)" },
  { syntax: "const foo = () => {}",                                       produces: "function Block(tags: function, arrow)" },
  { syntax: "class Foo {} / export class",                                produces: "class Block(tags: class, export?, default?)" },
  { syntax: "import ... from 'x'",                                         produces: "module の refs に { kind: 'import', target: 'x' }" },
  { syntax: "同モジュール内の関数呼び出し",                              produces: "calls ref(名前ベース、後段で再 commit)" },
  { syntax: "// [ai_s_emblem:#a#b Name] / // @tags: a, b",                 produces: "tags に取込(v1 互換、20 行遡及)" },
];

// ============================================================
// Self-display + export-md
// ============================================================
export function exportMarkdown() {
  const out = [];
  out.push(`# ai-desk 操作マニュアル v${VERSION}`);
  out.push(`> Auto-generated from AiRunAndRead_MANUAL.js — DO NOT EDIT THIS FILE DIRECTLY.`);
  out.push(`> Run \`node v2/AiRunAndRead_MANUAL.js export-md > MANUAL.md\` to regenerate.`);
  out.push(`> Date: ${DATE}\n`);
  out.push(`> ⚡ §VirtualHeavy が v2 の心臓。Apply の規律を守ること。\n`);

  out.push(`## §0 Glossary`);
  for (const [k, v] of Object.entries(Glossary)) out.push(`- **${k}**: ${v}`);
  out.push('');

  out.push(`## §0.5 REAL_* Variable Convention`);
  out.push(RealVariableConvention.purpose);
  out.push(`\n### Use For`);
  for (const r of RealVariableConvention.useFor) out.push(`- ${r}`);
  out.push(`\n### Avoid For`);
  for (const r of RealVariableConvention.avoidFor) out.push(`- ${r}`);
  out.push(`\n### Rules`);
  for (const r of RealVariableConvention.rules) out.push(`- ${r}`);
  out.push(`\n### Example\n\`\`\`js${RealVariableConvention.example}\`\`\`\n`);

  out.push(`## §1 Quick Start`);
  for (const q of QuickStart) out.push(`- \`${q.cmd}\` — ${q.desc}`);
  out.push('');

  out.push(`## §2 Workflow(7 段)`);
  for (const w of Workflow) {
    out.push(`### ${w.step}. ${w.name}`);
    if (w.cmds) for (const c of w.cmds) out.push(`- \`${c}\``);
    if (w.sub) {
      for (const s of w.sub) out.push(`- ${s.granularity}: \`${s.cmd}\` — ${s.what}`);
    }
    if (w.note) out.push(`> ${w.note}`);
    out.push('');
  }

  out.push(`## §3 CLI Commands`);
  for (const [cat, cmds] of Object.entries(CliCommands)) {
    out.push(`### ${cat}`);
    for (const c of cmds) out.push(`- \`${c.cmd}\` — ${c.use}`);
    out.push('');
  }

  out.push(`## §4 Virtual Heavy Function`);
  out.push(`### 4.1 Problem`);
  out.push(VirtualHeavy.problem.description);
  out.push(`- 物理層: ${VirtualHeavy.problem.layers.物理層}`);
  out.push(`- 論理層: ${VirtualHeavy.problem.layers.論理層}`);
  out.push(`> ${VirtualHeavy.problem.insight}\n`);
  out.push(`### 4.2 Flow\n\`\`\`\n${VirtualHeavy.flow}\n\`\`\`\n`);
  out.push(`### 4.3 Workflow`);
  for (const s of VirtualHeavy.workflow) out.push(`- ${s}`);
  out.push(`\n### 4.4 Expanded Format\n\`\`\`\n${VirtualHeavy.expandedFormat.template}\n\`\`\``);
  for (const r of VirtualHeavy.expandedFormat.rules) out.push(`- \`${r.line}\` — ${r.role}(${r.editable})`);
  out.push(`\n### 4.5 Apply Mechanics`);
  for (const s of VirtualHeavy.applyMechanics.steps) {
    out.push(`#### ${s.step}`);
    if (s.what) out.push(s.what);
    if (s.warn) out.push(`> ${s.warn}`);
    if (s.rules) for (const r of s.rules) out.push(`- ${r}`);
  }
  out.push(`\n**Behaviors**:`);
  for (const b of VirtualHeavy.applyMechanics.behaviors) out.push(`- ${b}`);
  out.push(`\n### 4.6 Dependency Shot`);
  out.push(VirtualHeavy.dependencyShot.description);
  out.push(`> ${VirtualHeavy.dependencyShot.note}`);
  out.push(`\n### 4.7 Update Actions`);
  for (const a of VirtualHeavy.updateActions) out.push(`- **${a.action}**: ${a.meaning} → ${a.do}`);
  out.push(`\n### 4.7.5 Heavy Apply Loop`);
  out.push(VirtualHeavy.heavyApply.rule);
  out.push(`- why: ${VirtualHeavy.heavyApply.why}`);
  out.push(`- stdout: ${VirtualHeavy.heavyApply.stdout}`);
  out.push(`- stderr: ${VirtualHeavy.heavyApply.stderr}`);
  out.push(`\n### 4.8 Failure Modes`);
  for (const f of VirtualHeavy.failureModes) out.push(`${f.id}. **${f.mistake}** → ${f.result}\n   fix: ${f.fix}`);
  out.push(`\n### 4.9 Checklist`);
  out.push(`**before expand**:`);
  for (const c of VirtualHeavy.checklist.beforeExpand) out.push(`- ${c}`);
  out.push(`\n**LLM prompt template**:\n> ${VirtualHeavy.checklist.llmPromptTemplate}\n`);
  out.push(`**after apply**:`);
  for (const c of VirtualHeavy.checklist.afterApply) out.push(`- ${c}`);
  out.push(`\n${VirtualHeavy.checklist.safetyNet}`);
  out.push(`\n### 4.10 Programmatic\n\`\`\`js\n${VirtualHeavy.programmaticUsage}\n\`\`\``);
  out.push('');

  out.push(`## §5 Programmatic API`);
  out.push(`### imports`);
  for (const i of ProgrammaticApi.imports) out.push(`- ${i}`);
  out.push(`\n### Block ops`);
  for (const i of ProgrammaticApi.blockOps) out.push(`- \`${i}\``);
  out.push(`\n### Graph ops`);
  for (const i of ProgrammaticApi.graphOps) out.push(`- \`${i}\``);
  out.push('');

  out.push(`## §6 Lint(8 種)`);
  for (const l of LintKinds) out.push(`- **${l.kind}**: ${l.detects} _(off: \`${l.offFlag}\`)_`);
  out.push('');

  out.push(`## §7 parseJS rules`);
  for (const r of ParseJSRules) out.push(`- \`${r.syntax}\` → ${r.produces}`);

  return out.join('\n');
}

if (typeof process !== 'undefined' && /AiRunAndRead_MANUAL\.js$/.test(process.argv[1] || '')) {
  if (process.argv[2] === 'export-md') {
    process.stdout.write(exportMarkdown());
  } else {
    console.log(`\n##  AiRunAndRead_MANUAL.js v${VERSION}  ##\n`);
    console.log(`Workflow(${Workflow.length} steps), Virtual Heavy Function を中心とした 7 章構成`);
    console.log(`CLI: ${Object.values(CliCommands).flat().length} commands`);
    console.log(`Virtual Heavy: ${VirtualHeavy.applyMechanics.steps.length} apply steps + ${VirtualHeavy.failureModes.length} failure modes`);
    console.log(`Lint: ${LintKinds.length} kinds\n`);
    console.log(`Usage:`);
    console.log(`  node AiRunAndRead_MANUAL.js export-md > MANUAL.md`);
    console.log(`  import { Workflow, VirtualHeavy, CliCommands, LintKinds } from './AiRunAndRead_MANUAL.js'`);
  }
}

// === /HEAD ===
