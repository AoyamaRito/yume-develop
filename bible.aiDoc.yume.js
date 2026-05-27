// @yume-format: 1

export const __block = {
  "id": "bible",
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
      "content": "// v2/AiRunAndRead_BIBLE.js\n// AI-Native Master Bible v2 — Super-Block Executable Edition\n//\n// ⚠️ ファイル名 prefix `AiRunAndRead_` の意味:\n//   このファイルは AI に対して 2 つの instruction を発する:\n//     1. `node AiRunAndRead_BIBLE.js` で **実行** せよ(出力が canonical view)\n//     2. or `import { ... } from './AiRunAndRead_BIBLE.js'` で構造を **読め**\n//   ⛔ .js のソースを prose として linear に読むな(JS は構造化容器、\n//      prose 読みは情報を取りこぼす — 公理 A0 / A7 違反)\n//\n// 思想(Bible) + 認知(Manifesto) + 規律(Onboarding) + 参照(Reference) + 派生 Block 仕様\n// を統合した全知の核。\n//\n// **canonical form**: this file (.js) ← REAL\n// **human form**:    BIBLE.md は派生(SHADOW)、`node AiRunAndRead_BIBLE.js export-md` で生成\n//                    (公理 A3 — REAL は .js、SHADOW は .md)\n//\n// 他 v2 ツールから:\n//   `import { Kernel, Axioms, BlockSchema } from './AiRunAndRead_BIBLE.js'`\n\nexport const VERSION = \"2.11\";\nexport const DATE = \"2026-05-04\";\nexport const AUTHOR = \"沖井広行(蒼山りと)\";\n\n// ============================================================\n// 第 1 層: 認知物理学(Cognitive Physics)\n//   公理より下のレイヤー。AI の思考を規定する観測された物理法則。\n//   実証された heuristic は law として。仮説は note として明記。\n// ============================================================\nexport const Physics = {\n  Spotlight: {\n    range: 300,\n    law: \"AI は今読んでいる場所から ~300 行以上離れた情報を急速に忘却する。重要な情報は常に近接に配置せよ。\",\n    status: \"heuristic\",   // BIBLE.md には未記載、運用上の観察値。今後計測で根拠を強化する。\n    addedIn: \"2.6\",\n  },\n  Gravity: {\n    law: \"複雑性は推論を一意化する重力である。シンプルさは AI を漂流(ハルシネーション)させる無重力空間である。\",\n    detail: \"Bible §0 大前提 / §2.5 詳説。注意機構の質量分布として作用 — refs が密 = attention が安定。\",\n    status: \"axiomatic\",\n    // 注: calculate は「推定指標」であり真の attention 重力の計測ではない。\n    // 文字列単純 match であって、コメントや文字列リテラル中の token も拾う。\n    // 比較値として使う(同じ formula で時系列比較)用途のみ妥当。\n    calculate: (code) => {\n      const connections = (code.match(/\\b(import|export|function|class)\\b|=>/g) || []).length;\n      return connections / Math.max(1, code.split('\\n').length);\n    },\n  },\n  FileCost: {\n    law: \"ファイル移動と分割は AI にとって物理的重労働である。コンテキストを統合し、移動を最小化せよ。\",\n    status: \"axiomatic\",\n    related: \"公理 A1(ローカリティ極大化)\",\n  },\n  LLMTyping: {\n    law:\n      \"LLM の type system は **値そのもの**である。LLM が token を読む時点で型が見えなければ、\" +\n      \"LLM は context window を遡って型を再構築しようとし、推論 step が増え、間違える確率が線形に上がる。\" +\n      \"従って『REAL な値(state / event payload / refs payload / Block 間通信値)』は、\" +\n      \"**値の中に型が埋まった self-describing 形式**で持つこと(例: \\\"world:5,0,2\\\" / \\\"usd:9.99\\\" / \\\"time:1234567890\\\")。\",\n    detail:\n      \"**LLM-First Typing** — 普通の typing は compile time に人間が型を書きコンパイラが catch する仕組み。\" +\n      \"それは『機械(コンパイラ)が見る型』。LLM 時代では LLM 自身が推論 step ごとに『直前の token から型情報を取得』する必要があり、\" +\n      \"**LLM が見る場所(値そのもの)に型が埋まっている**ことが推論精度を最大化する。\" +\n      \"命名規則(`worldPos`, `screenX`)に型を載せる従来手法は LLM の context window 外で崩壊する — \" +\n      \"tagged value は context 不要で常に正解。\" +\n      \"これは **crystallize の双対**: \" +\n      \"  - crystallize: JS Block → Go の static type system に翻訳(machine の型に compile)\" +\n      \"  - tagged value: 値 → LLM の視野に型を埋め込む(LLM の型に compile)\" +\n      \"両者とも『型を必要とする機械(machine compiler / LLM inference)が見る場所に型を埋める』操作。\",\n    status: \"axiomatic\",\n    addedIn: \"2.10\",\n    related: \"公理 A0 認知非対称性、A7 展開・明示、A9 crystallize、A11 Domain-Tagged Values\",\n    benefits: [\n      \"LLM 認知コスト最小化(token 単位で型確定、context 遡及不要)\",\n      \"推論ステップ削減 → mistake 確率の線形低下\",\n      \"命名規則・コメント・schema 不要(値が self-describing)\",\n      \"context window 外でも常に正解(値だけで型確定)\",\n      \"AI 同士の transfer でも型情報が値に張り付いて移動\",\n      \"crystallize 整合(Go 側でも string → struct で 1:1 受け、translation contract 単純化)\",\n    ],\n    formula: \"「型は LLM が見る場所(値そのもの)に置け」\",\n  },\n};\n\n// ============================================================\n// 第 2 層: 公理体系(Core Axioms A0〜A13)\n//   各公理は {id, name, summary, why, examples, violations, refs} を持つ\n//   prose ではなく構造化データとして — JS が容器の真価を発揮する層\n// ============================================================\nexport const Axioms = {\n  A0: {\n    id: \"A0\", name: \"認知非対称性\",\n    summary: \"人向けの『良い設計』(抽象化・分割・カプセル化)は AI にとって情報の隠匿、つまり毒である。AI には統合された複雑性を与えよ。\",\n    why: \"人間の作業記憶は 7±2 と狭く隠匿で『理解』を作る。LLM の作業記憶は桁違いに広く、隠匿は推測領域(=ハルシネーション温床)に変わる。\",\n    examples: [\"ヘルパー関数で詳細を隠す ❌ → インライン展開して全部見せる ✓\", \"型定義で実装と分離 ❌ → 動的な構造を直接見せる ✓\"],\n    violations: [\"共通関数で重複削減\", \"interface で実装隠匿\", \"doc string でコードの意図を別レイヤーに\"],\n    refs: [\"A1\", \"A7\"],\n  },\n  A1: {\n    id: \"A1\", name: \"ローカリティ極大化\",\n    summary: \"機能に必要な情報は 1 つのスコープに集約する。共有ヘルパーを作らず、必要なら複製(Copy&Paste)せよ。重複は悪ではない。隠れた依存こそが悪。\",\n    why: \"別ファイル / 別関数への分離 = 物理的隠匿。Spotlight 範囲(~300 行)を超えると AI から forgotten される。\",\n    examples: [\"3 箇所で似た 5 行 → 3 箇所に複製で OK(共通化しない)\"],\n    violations: [\"DRY 至上主義\", \"1 行関数の抽出\", \"util/helper モジュールへの逃げ\"],\n    refs: [\"A0\", \"Physics.FileCost\", \"Physics.Spotlight\"],\n  },\n  A2: {\n    id: \"A2\", name: \"Constraint Folding\",\n    summary: \"if/else 分岐ツリーを捨て、全可能世界 + 制約 filter に畳み込め。\",\n    why: \"分岐ツリーは推測領域(=重力ゼロ)を生む。全可能世界の物質化は重力場を形成し、推論軌道を一意化する。\",\n    examples: [\"じゃんけん 9 通りを全列挙 → tie 制約で filter\", \"状態遷移を全許容組み合わせ × 制約で生成\"],\n    violations: [\"if/else の入れ子\", \"early return で網羅性放棄\"],\n    refs: [\"A0\", \"BlockTypes.Constraint\"],\n  },\n  A3: {\n    id: \"A3\", name: \"REAL / SHADOW\",\n    summary: \"書き換え可能な唯一の真実を REAL とし、それ以外は SHADOW(派生値)として保持禁止。SHADOW は使う瞬間に生成し、使い終わったら捨てる。実行 JS 内で AI / Kantoku が監視すべき正の状態は `REAL_*` 変数名で明示してよい。\",\n    why: \"重複 state は同期コストと整合性事故の温床。REAL 1 つから常に派生計算する方が密度が上がり、ハルシネーション余地が消える。`REAL_*` は型や単位ではなく『監視対象の正状態』を示す接頭語であり、起動時 AST bootstrap / 実行時 trace / AI 判断の境界を明示する。AST で得る boolean は `isWatched` と呼ぶ。`check` は検査実行の動詞であり、監視対象かどうかの性質名には使わない。\",\n    examples: [\n      \"Block.versions = REAL、Block.content = SHADOW(getter で head().content)\",\n      \"AiRunAndRead_BIBLE.js = REAL、BIBLE.md = SHADOW(exportMarkdown で派生)\",\n      \"let REAL_state = initialState(); REAL_state = dispatch(REAL_state, evt);\",\n      \"REAL_* は app の主要 state / reducer 後 state / render・eyes・test の入力にだけ付ける\",\n    ],\n    violations: [\n      \"状態を 2 箇所に保存\",\n      \"computed 値をキャッシュ変数化(stale 化リスク)\",\n      \"const REAL_x = 1 のような小さな一時値への過剰命名\",\n      \"DOM 要素 / cache / derived view / loop counter に REAL_* を付ける\",\n    ],\n    refs: [\"A6\"],\n  },\n  A4: {\n    id: \"A4\", name: \"Event Sourcing + Sequential Hashing\",\n    summary: \"状態の上書き保存を避け、状態を変えるイベントの履歴を時系列に追記する。各イベントは前イベントの hash を含み、改ざん検知可能。\",\n    why: \"上書きは過去の喪失。append-only + hash chain は時間軸を保存し、任意時点の再構成と監査を保証する。Block.versions の prevHash chain の理論基盤。\",\n    examples: [\"Block.versions[].prevHash = versions[i-1].hash\", \"session = 操作 + 観測 Block の連鎖\"],\n    violations: [\"state を上書き\", \"ログを別ファイルに分離(graph 構造から外れる)\"],\n    refs: [\"A6\"],\n  },\n  A5: {\n    id: \"A5\", name: \"All-as-Block\",\n    summary: \"ai-desk における全ての構成要素は Block インターフェースに従う。関数・クラス・モジュール・ドキュメント・制約・観測・テスト・議論 ─ すべて Block。\",\n    why: \"LLM は単一の操作モデル(Block の生成・追記・参照・走査・検証)で全構造を扱えるべき。type の発明は隠匿の入口。\",\n    examples: [\"function Block / class Block / module Block / constraint Block / observation Block / twin Block\"],\n    violations: [\"Block 外の独自 schema 発明\", \"別 layer での state 保持\"],\n    refs: [\"A0\", \"Block\"],\n  },\n  A6: {\n    id: \"A6\", name: \"Versions-as-Body\",\n    summary: \"Block の唯一の状態は versions: Version[] である。content / refs / children / tags は head() から派生(SHADOW)、変数化禁止。\",\n    why: \"履歴は本体であり、最新値は派生に過ぎない。任意時点の状態は versions 走査で再現可能(time travel)。\",\n    examples: [\"Block.versions = REAL\", \"Block.content getter は head().content\"],\n    violations: [\"b.content = X で代入\", \"head() の戻り値を変数で持ち回す\"],\n    refs: [\"A3\", \"A4\"],\n  },\n  A7: {\n    id: \"A7\", name: \"LLM-First Information Density\",\n    summary: \"人間用の簡素化を捨て、LLM にとっての情報密度を最大化する。\",\n    why: \"情報量(展開 ✓)・構造(単一抽象 ✓)・関係(refs 明示 ✓)・履歴(Block 内蔵 ✓)・区切り(言語構文 ✓)の各軸で密度を上げる。\",\n    examples: [\"full inline expansion\", \"refs を明示的 edge として書く\", \"tags で意味を構造化\"],\n    violations: [\"『見やすさ』のための省略\", \"コメントで意図を別レイヤー化\"],\n    refs: [\"A0\"],\n  },\n  A8: {\n    id: \"A8\", name: \"Spec-First Versioning\",\n    summary: \"実装の前に必ず論理(v0:SPEC)を置け。論理なき実装は漂流の始まり。仕様変更時は『新仕様のみ』バージョンを挟む脱皮プロトコル。\",\n    why: \"Block.versions に SPEC version を埋め込めば、論理の変遷が版数構造として読み取れる。同一履歴に spec / impl が交互に積まれ、いつでも『最新の正解』へ帰還可能。\",\n    examples: [\"v0: コメントだけ + // @tags: SPEC\", \"v1: 実装\", \"v2: 新 SPEC 挟み込み\", \"v3: 新実装\"],\n    violations: [\"実装直書き(SPEC version 無し)\", \"仕様変更を impl 同士の連続 commit で済ませる\"],\n    refs: [\"A4\", \"A6\", \"Bible§4.1.1\"],\n    enforcementNote: \"規律は validate 関数で守らない。`#SPEC#` tag の存在/不在 + prevHash chain 構造そのものが enforcement(§4.1.1)。\",\n  },\n  A9: {\n    id: \"A9\", name: \"Crystallization Compliance\",\n    summary: \"Block.content は crystallize 可能(JS → Go transpile → native 化)でなければならない。crystallize 不能なコードは Block でなく Adapter として扱う。\",\n    why: \"crystallize 失敗 = 動的 dispatch / eval / Proxy / prototype trick 等の隠匿パターン使用 = 4 視点(transpile / JIT / AI 推論 / Bible)全てから『正しくない』と判定されるコード。同じパターンが 4 視点で同時に問題を起こすのは偶然でなく、『明示的・静的・展開された』という単一の質が v2 の正解だから。\",\n    examples: [\n      \"crystallize OK: 純粋関数 / class + methods / immutable Map/Set 操作 / template literal\",\n      \"crystallize NG: eval / new Function / Object.prototype 改変 / Proxy / Reflect.construct / with 文\",\n    ],\n    violations: [\n      \"Block.content に eval / new Function を使う\",\n      \"prototype を runtime で改変\",\n      \"Proxy で動的 property 介入\",\n      \"with 文で scope を曖昧に\",\n    ],\n    refs: [\"A0\",\"A5\",\"A6\",\"§3\",\"Vocabulary.crystallize\"],\n    enforcementNote:\n      \"crystallize tool 自体が Bible-compliance compiler。build 失敗 = Bible 違反、別途 lint 不要(§4.1.1 の極致)。\" +\n      \"2 階層アーキテクチャ: Block(pure logic、crystallize 必須) vs Adapter(platform I/O、crystallize 不問)で分離。\",\n  },\n  A10: {\n    id: \"A10\", name: \"Single Coordinate Domain\",\n    summary:\n      \"**inter-Block / scene-level** の state / 入力 / UI / render input は world coord で表現する。\" +\n      \"**intra-Block(asset.js 内部の mesh.vertices / bone offset / 内部 anchor 等)は local coord OK** — 境界は `asset.transform`(local → world 変換器)。\" +\n      \"screen coord は render output と input adapter 境界でのみ存在し、Block 状態に侵入させない。OS resource(text input / file picker / permission / network)は modal dialog 経由で値返却し、world と coord 共存させない。\",\n    why:\n      \"voxel editor 3 試行(2026-05-03)が失敗した根本原因は、CSS 3D の parent-relative transform が world-coord 統一と原理的に喧嘩したこと。\" +\n      \"world / model / screen / canvas pixel / DOM event の coord が混在すると、Block 間の意味論が coord 系ごとに分裂し、A0(認知非対称性)・A1(ローカリティ極大)・A5(All-as-Block)が同時に破れる。\" +\n      \"world coord 統一を axiom として強制すると、CSS 3D / DOM transform / 画面座標 UI 等の選択肢が構造的に弾かれ、WebGL / three.js / WebGPU 系の scene graph 中心実装に自動収束する。\" +\n      \"ただし intra-Block(asset.js 内部)は local coord を許す — そうしないと頂点 / bone / 内部 anchor を世界原点固定でしか書けなくなり、A5(All-as-Block: 各 Block は内部に閉じた coord 空間を持つ)が破れる。\" +\n      \"screen coord は render output(world → screen)と入力 adapter(screen → world ray)の **境界変換**でのみ存在する。OS resource は modal dialog で「world から外に出る → 値を持って戻る」形に統一し、coord の常時共存を排除する。\",\n    boundaries: {\n      \"inter-Block / scene\": \"world coord 必須(asset.transform.position, refs target との位置関係, 入力 ray hit, HUD ortho world coord)\",\n      \"intra-Block / asset.js\": \"local coord OK(mesh.vertices, bones, 内部 pivot, 内部 anim、すべて asset 原点基準)\",\n      \"asset.transform\": \"境界変換器(local → world)、ここで初めて world coord に乗る\",\n      \"screen\": \"render output と input adapter の boundary でのみ存在(Block 内部 / Block 間 ともに不可侵)\",\n      \"OS resource\": \"modal dialog で値返却(text input / file / permission / network)、world と並走しない\",\n    },\n    examples: [\n      \"OK(intra): asset.js の mesh.vertices = [[0,1,0],[1,0,0],...] (asset 原点基準 local)\",\n      \"OK(intra): asset.js の bones = [{name:'head', offset:[0,1.6,0]}] (asset 内部 local)\",\n      \"OK(inter): export const transform = { position:[5,0,0], rotation:[0,Math.PI,0], scale:1 } (world)\",\n      \"OK(inter): 他 asset と共有する位置は state.lastWorldPos に world coord で持つ\",\n      \"OK: HUD は camera-following ortho camera が見る world 領域(右上 HP バー = ortho world (0.95, 0.95))\",\n      \"OK: マウス入力 → ray cast → world hit → Block state へ渡す\",\n      \"OK: text input が必要な場面は modal dialog → string 返却 → world に戻る\",\n      \"OK: 画面端の DOM sidebar / panel(3D scene と構造的に分離、native form 要素 / a11y / IME 利点)\",\n      \"OK: <input type='color'> / <button> / <input type='range'> 等の native UI 要素(sidebar 内)\",\n      \"NG: CSS 3D で transform を parent-relative に書く(world-coord 統一不能)\",\n      \"NG: screen pixel 座標を Block state に持ち込む(asset 内 / 間 共に不可)\",\n      \"NG: world coord を screen に project して DOM の位置を毎 frame 更新する(world tracking overlay)\",\n      \"NG: 他 asset 参照を local coord で書く(world coord 必須)\",\n    ],\n    violations: [\n      \"inter-Block 通信(他 asset 参照 / refs / event payload)に local coord を使う\",\n      \"Block state / event payload に screen / canvas / pixel coord を持つ\",\n      \"CSS 3D / DOM transform を render path に使う(parent-relative で world 統一不能)\",\n      \"input handler が ray cast 経由せず screen coord で直接 Block を変える\",\n      \"HUD を world geometry でなく独立 DOM overlay として書く(world と coord 系が常時並走)\",\n    ],\n    refs: [\"A0\",\"A1\",\"A5\",\"A11\",\"Vocabulary.crystallize\",\"Vocabulary.world-coord\",\"Vocabulary.prefab\",\"memo:2026-05-04_voxel-failure\"],\n    enforcementNote:\n      \"敗因が voxel 3 試行で明示された後の正典化 — 3D / 2D / game / tool すべてに共通する coord 戦略。\" +\n      \"実装 engine は world-coord scene graph を持つもの(WebGL / three.js / WebGPU)に強制収束、CSS 3D は永久封印。\" +\n      \"Block prefab(asset js module)は world transform + state + 畳込み遷移関数の triple で表現される — transform が境界、内部は local が自然。\" +\n      \"A11(Domain-Tagged Coordinates)が runtime nominal typing でこれを構造強制する。\",\n  },\n  A11: {\n    id: \"A11\", name: \"Domain-Tagged Values\",\n    summary:\n      \"すべての **REAL な値**(Block の state / event payload / refs payload / Block 間通信値)は、\" +\n      \"**型/単位/domain 接頭辞付き string** で表現する: `\\\"world:5,0,2\\\"` / `\\\"usd:9.99\\\"` / `\\\"time:1234567890\\\"` / \" +\n      \"`\\\"hash:deadbeef\\\"` / `\\\"id:user-42\\\"` / `\\\"kg:0.5\\\"`。\" +\n      \"型情報を **LLM が読む値そのものの中に** 埋め込み、推論時の型混同を構造的に消す。\",\n    why:\n      \"Physics.LLMTyping(LLM-First Typing 法則)の axiom 化。\" +\n      \"JS は動的型、人間は変数名(`worldPos`, `usdAmount`)で型を補完するが、LLM は context window 外でこの慣習を再構築できない。\" +\n      \"命名・コメント・schema 抜きで **値だけ見て型が確定する** 形にすると、LLM 推論 step が 1 つ減る = mistake 確率が線形に下がる。\" +\n      \"**crystallize の双対**: \" +\n      \"crystallize は JS Block を Go の静的型に compile する(machine の型に翻訳)。\" +\n      \"tagged value は値を LLM の視野に compile する(LLM の型に翻訳)。\" +\n      \"両方とも『型を必要とする機械が見る場所に型を埋める』操作。\" +\n      \"Bible §4.1.1『規律 = 構造』の極致 — validate 関数を書かず、データ形そのものが enforcer になる。\" +\n      \"voxel 失敗(2026-05-03)で coord 取り違えが特定された結果から発見、coord に閉じない一般原則として正典化。\",\n    scope: {\n      \"REAL(tag 必須)\": [\n        \"Block state の field(永続化される、inter-Block 通信される)\",\n        \"event payload(dispatch / refs / message)\",\n        \"Graph 上の値(refs payload、children payload)\",\n        \"Block 間で渡される全ての値\",\n      ],\n      \"scratch(tag 不要)\": [\n        \"関数内ローカル変数(boundary で parse 済み)\",\n        \"tick 内一時計算(ホットパス保護のため)\",\n        \"engine API 内部値(Three.js Vector3 等、boundary 越え後)\",\n      ],\n    },\n    domains: {\n      // ─── coord 系(A10 ↔ A11 の交点) ───\n      world:  \"scene graph / Block 間 / 入力 ray hit / refs payload で使う絶対座標。例: \\\"world:5,0,2\\\"\",\n      local:  \"asset.js 内部の mesh.vertices / bones / 内部 anchor で使う asset 原点基準。例: \\\"local:0,1,0\\\"\",\n      screen: \"render output / input adapter 境界でのみ存在する pixel 座標。Block state には侵入させない(Taboo 14)。例: \\\"screen:300,200\\\"\",\n      ortho:  \"HUD ortho camera が見る world 領域。NDC-like (-1..1) range。例: \\\"ortho:0.7,0.85\\\"\",\n      // ─── 通貨 / 単位 ───\n      usd:    \"米ドル金額。例: \\\"usd:9.99\\\"\",\n      jpy:    \"日本円金額。例: \\\"jpy:980\\\"\",\n      kg:     \"質量(キログラム)。例: \\\"kg:0.5\\\"\",\n      \"duration-s\": \"継続時間(秒)。例: \\\"duration-s:5.5\\\"\",\n      \"duration-ms\": \"継続時間(ミリ秒)。例: \\\"duration-ms:1500\\\"\",\n      // ─── 時刻 / バージョン / 識別子 ───\n      time:    \"Unix timestamp(秒)。例: \\\"time:1234567890\\\"\",\n      \"time-ms\": \"Unix timestamp(ミリ秒)。例: \\\"time-ms:1234567890123\\\"\",\n      iso:     \"ISO 8601 datetime。例: \\\"iso:2026-05-04T17:00:00+09:00\\\"\",\n      version: \"semver / 内部 version。例: \\\"version:2.10\\\"\",\n      hash:    \"hash 値(hex)。例: \\\"hash:deadbeef\\\"\",\n      id:      \"識別子(namespaced)。例: \\\"id:user-42\\\" / \\\"id:block:cube\\\"\",\n      // ─── 拡張 ───\n      \"{domain}\": \"新規 domain は自由に追加(英小文字 + ハイフン、`:` で本体と区切る)\",\n    },\n    format: {\n      grammar: \"<domain>:<body>(domain は ASCII 英小文字 + ハイフン + 数字、body は domain ごとに自由)\",\n      coord_body: \"x,y[,z] (number、JS Number.toString 互換、負数 / 小数 / 指数表記 OK)\",\n      scalar_body: \"single number / string / structured (domain ごとに parser を持つ)\",\n      examples: [\"world:5,0,2\", \"usd:9.99\", \"time:1234567890\", \"id:user-42\", \"hash:deadbeef\", \"iso:2026-05-04T17:00:00+09:00\"],\n    },\n    api: {\n      // 座標系(coord.js):\n      coord_builders: [\"w(x,y,z) / l(x,y,z) / s(x,y) / o(x,y) → 'domain:x,y[,z]' string\"],\n      coord_parsers:  [\"parseCoord(str) → {domain, values}\", \"requireDomain(str, expected) → number[](不一致で throw)\"],\n      // 一般値(将来 typed.js 等で提供):\n      builders:       [\"tagged(domain, body) → 'domain:body'\", \"usd(amount) / jpy(amount) / kg(mass)\"],\n      parsers:        [\"parseTagged(str) → {domain, body}\", \"requireTag(str, expected) → body(不一致で throw)\"],\n    },\n    examples: [\n      \"OK: state = { hp: 100, mood: 'neutral', lastSeen: 'time:1234567890' }\",\n      \"OK: state.amount = 'usd:9.99'(scratch 計算は const a = 9.99、boundary で format)\",\n      \"OK: refs: [{ kind: 'paid-by', target: 'id:user-42', amount: 'usd:9.99' }]\",\n      \"NG: state.lastSeen = 1234567890(裸の数値、unix 秒?ミリ秒?判別不能)\",\n      \"NG: state.amount = 9.99(USD?JPY?判別不能、LLM が間違える)\",\n      \"NG: refs に `target: 'user-42'`(prefix 無し → name か id か判別不能)\",\n    ],\n    violations: [\n      \"REAL 値(state / event / refs / Block 間)に裸の数値 / string を持つ(domain 不明)\",\n      \"boundary を経由せず tagged string を直接 engine API に投入\",\n      \"domain 不一致を runtime check 無しで mix する\",\n      \"命名規則・コメントだけで型を表す(値が self-describing でない)\",\n    ],\n    refs: [\"A0\",\"A7\",\"A9\",\"A10\",\"Physics.LLMTyping\",\"Vocabulary.world-coord\",\"Vocabulary.domain-tag\",\"Vocabulary.prefab\"],\n    enforcementNote:\n      \"A10 が「混ぜるな」の宣言、A11 は『**混ぜれない**』の構造実装、すべての REAL 値に拡張。\" +\n      \"Physics.LLMTyping『型は LLM が見る場所(値そのもの)に置け』を data layer に降ろした実装。\" +\n      \"**LLM 認知コスト最小** + **mistake 線形低下** + **crystallize 整合** + **A0/A7 同時強化** を一手で達成。\" +\n      \"段階的移行可能 — REAL 値だけ tagged 化、scratch / hot path は裸でも可、boundary で format/parse。\",\n  },\n  A12: {\n    id: \"A12\", name: \"Universal Literalism (万物文字化)\",\n    summary: \"すべての REAL な状態(Block.versions に残るもの)は、意味のある「文字列リテラル」として永続化せよ。生の数値、ビットフラグ、ポインタ、匿名オブジェクトの永続化を禁止する。\",\n    why: \"コンピュータの効率のための『濁り(数値・バイナリ)』を排し、AI のための『透明な論理(文字)』へ回帰する。すべてが文字であれば、AI は世界の全状態を『誤字脱字』レベルの精度で検証・修正できる。\",\n    examples: [\"hp:100 → \\\"hp:full\\\" または \\\"hp:100/100\\\"\", \"Vector(1,0,0) → \\\"dir:east\\\" または \\\"vec:1,0,0\\\"\"],\n    violations: [\"Block state に生の数値を保存\", \"不透明な連番 ID の使用\", \"AI の Attention を迷わせる匿名データ構造\"],\n    refs: [\"A0\", \"A7\", \"A10\", \"A11\"],\n  },\n  A13: {\n    id: \"A13\", name: \"Shadow Projection (影への投影と還元)\",\n    summary: \"演算が必要な時のみ、文字(REAL)を数値(SHADOW)へ投影(LIFT)し、演算終了直後に再び文字(REAL)へ還元(SETTLE)せよ。数値状態を 1 フレーム(または 1 関数)を超えて保持することを禁止する。\",\n    why: \"数値は演算(力)には向くが、記憶(真実)には向かない。計算のたびに文字へ還元し続けることで、AI による常時監視と、完全な再現性(Time Travel)を保証する。複式プログラミングの核心。\",\n    examples: [\"文字 \\\"world:9,9,9\\\" → 数値 [9,9,9] へ LIFT → 演算 [10,9,9] → \\\"world:10,9,9\\\" へ SETTLE して還元\"],\n    violations: [\"数値状態の永続化(1 フレーム以上の保持)\", \"計算用変数の外部リーク\", \"還元ステップの省略によるブラックボックス化\"],\n    refs: [\"A3\", \"A12\"],\n  },\n  A14: {\n    id: \"A14\", name: \"Top-Down Verification (トップダウン検証)\",\n    summary: \"AI時代のテストは、必ず『全体から部分へ』向かって書け。E2Eテストで文脈の重力場を形成し、その実行カバレッジの隙間を単体テストで自律的に埋めよ。\",\n    why: \"ボトムアップ型のTDD（小さな単体テストを書き、それに合わせて実装を積む）は、AIに『完成形の全体像が見えない状態での推測』を強要し、認知を迷走させる（A0・A7違反）。逆に、最初にE2Eを書くことで、AIに対して『最終的に何ができれば正解か』という完全なコンテキストを与えられる。E2Eが通る＝論理の大枠が完成した状態であり、そこからであれば、AIは『E2Eで通らなかった分岐』を特定し、それを埋める単体テストを迷いなく自動生成できる。\",\n    examples: [\"E2Eを書いてから実装を完了させる → V8のカバレッジを計測 → 未到達のBlockや分岐を狙う単体テストを生成\"],\n    violations: [\"全体像（E2E）がない状態での過剰な単体テスト駆動\", \"カバレッジを無視した盲目的なテスト追加\"],\n    refs: [\"A0\", \"A7\"],\n  },\n};\n\n// ============================================================\n// Internal helpers (Taboo check の文字列マッチ脆性を回避)\n// ============================================================\n// import / require / from \"...\" / package.json の dependency 記述から\n// quoted literal を抽出し、いずれかが pattern に match するか判定。\n// これにより `.parcel-cache` のような関係ない文字列が import 違反扱いされない。\nfunction _importsAny(content, pattern) {\n  const literals = [];\n  const importRe = /(?:^|\\s)(?:import\\b[\\s\\S]*?from\\s*|require\\s*\\(\\s*|import\\s*\\(\\s*)['\"]([^'\"]+)['\"]/g;\n  let m;\n  while ((m = importRe.exec(content)) !== null) literals.push(m[1]);\n  // package.json 形式の \"deps\": { \"name\": \"version\" } の name 部分も拾う\n  const depsRe = /\"(?:dependencies|devDependencies|peerDependencies)\"\\s*:\\s*\\{([\\s\\S]*?)\\}/g;\n  while ((m = depsRe.exec(content)) !== null) {\n    const block = m[1];\n    let dm;\n    const nameRe = /\"([^\"]+)\"\\s*:\\s*\"[^\"]+\"/g;\n    while ((dm = nameRe.exec(block)) !== null) literals.push(dm[1]);\n  }\n  return literals.some(l => pattern.test(l));\n}\n\n// ============================================================\n// 第 3 層: Block schema(全 v2 ツールが共有する基本型)\n// ============================================================\nexport const BlockSchema = {\n  Block: {\n    description: \"id / type / meta / versions(append-only)\",\n    fields: {\n      id: \"string — globally unique identifier\",\n      type: \"string — 'function' | 'class' | 'module' | 'constraint' | 'observation' | ...\",\n      meta: \"object — type 固有の補助情報\",\n      versions: \"Version[] — append-only、commit() 経由のみ伸ばせる(REAL)\",\n    },\n  },\n  Version: {\n    description: \"Block.versions の要素。1 つの commit を表す不変 record。\",\n    fields: {\n      timestamp: \"number — Date.now()\",\n      prevHash:  \"string|null — 前 version の hash(連鎖)\",\n      content:   \"any — その時点の値\",\n      refs:      \"{kind, target}[] — 他 Block への型付きエッジ\",\n      children:  \"string[] — 順序付き Block id list(構成的所有)\",\n      tags:      \"string[] — 検索 / フィルタ用\",\n      meta:      \"object — commit 自体のメタデータ\",\n      hash:      \"string — 上記全フィールド(自身を除く)の FNV-1a 8 文字\",\n    },\n  },\n};\n\n// 派生 Block 型(BIBLE.md §6/§7/§8 + 仮想重厚関数)\nexport const BlockTypes = {\n  function: { type: 'function',   purpose: \"コード単位、parseJS が JS の関数宣言から自動抽出\" },\n  class:    { type: 'class',      purpose: \"クラス宣言\" },\n  module:   { type: 'module',     purpose: \"ファイル単位\" },\n\n  constraint: {\n    type: 'constraint',\n    purpose: \"公理 A2 の Constraint Folding を第一級 Block として永続化\",\n    schema: \"{ axes:string[], values:Record<axis, any[]>, derive:(combo)=>any }\",\n    api: \"evalConstraint(constraintBlock, filter?) → 候補の組み合わせ群\",\n    refSection: \"BIBLE.md §6\",\n  },\n\n  observation: {\n    type: 'observation',\n    purpose: \"AI-Eyes の観測スナップショットを Block として保存(canvas frame, state JSON, draw_ops 等)\",\n    schema: \"content: { capturedAt, viewport, canvases?, draw_ops?, state }\",\n    refs: \"[{ kind:'observes', target: observedId }]\",\n    refSection: \"BIBLE.md §7\",\n  },\n\n  twin: {\n    type: 'function',   // type は function、tags で識別\n    purpose: \"効率層(GPU 等)と並走する検証層(CPU twin)を refs で結ぶ複式数学\",\n    refs: \"[{ kind:'twin-of', target: 効率層 Block }]\",\n    tags: [\"twin\", \"verify\"],\n    refSection: \"BIBLE.md §8\",\n  },\n\n  virtualHeavy: {\n    purpose: \"複数 Block を 1 つの content に展開して LLM に渡し、編集後に逆配分(virtual-apply)で再分散する\",\n    api: [\"heavy <graph> <root> [--depth=N]\", \"virtual-apply <graph> <root> <patch-file>\"],\n    refSection: \"BIBLE.md §6 (仮想重厚関数), MANUAL §4.5〜4.9\",\n  },\n};\n\n// ============================================================\n// 第 3.5 層: Vocabulary(用語の重力場)\n//   人間優先 vocabulary は v2 思想と衝突する。「refactor」「DRY」「clean code」\n//   等の語は暗黙に「人間に読みやすく整える」方向のベクトルを持つ — これは\n//   公理 A0 違反方向。\n//   用語は思考のレールであって、レールを引き直さないと公理の方向に走れない。\n//   v2 では旧用語を使わず、置換用語(clarify / densify / align / expose / unfold)\n//   を canonical として使う。\n// ============================================================\nexport const Vocabulary = {\n  use: {\n    clarify: {\n      meaning: \"隠匿を晴らす、不明瞭を消す\",\n      replaces: \"refactor\",\n      etymology: \"ラテン語 clarus(明るい・透明)。「透明にする」が原義。\",\n      operation_vector: \"隠匿 → 明示\",\n      axiom_ref: [\"A0\",\"A7\"],\n    },\n    densify: {\n      meaning: \"情報密度を上げる(展開・明示で)\",\n      replaces: \"DRY 化\",\n      etymology: \"ラテン語 densus(密)。「密度を上げる」が原義。\",\n      operation_vector: \"希薄 → 濃密\",\n      axiom_ref: [\"A1\",\"A7\"],\n    },\n    align: {\n      meaning: \"Bible 公理に整合させる\",\n      replaces: \"clean code\",\n      etymology: \"ラテン語 ad-+ linea(線に沿わせる)。「軸に揃える」が原義。\",\n      operation_vector: \"ズレ → 整合\",\n      axiom_ref: [\"全公理\"],\n    },\n    expose: {\n      meaning: \"隠れているものを表面化\",\n      replaces: \"abstraction\",\n      etymology: \"ラテン語 ex-+ ponere(外に置く)。「外に出して見せる」が原義。\",\n      operation_vector: \"内部 → 表面\",\n      axiom_ref: [\"A0\",\"A1\"],\n    },\n    unfold: {\n      meaning: \"折りたたまれた抽象を広げる\",\n      replaces: \"simplify\",\n      etymology: \"古英語 un-+ fealdan(折りを開く)。「畳まれたものを広げる」が原義。\",\n      operation_vector: \"圧縮 → 展開\",\n      axiom_ref: [\"A0\",\"A7\"],\n    },\n    crystallize: {\n      meaning: \"論理を別言語の強力なインフラに引っ越しさせる(JS Block → Go transpile 等)\",\n      replaces: \"compile / port / migrate / rewrite\",\n      etymology: \"ラテン語 crystallum(澄んだ氷・透明な結晶構造)。「不定形が定形に固体化する」が原義。\",\n      operation_vector: \"動的・流動 → 静的・固体  (JS の動的性 → Go の static structure)\",\n      axiom_ref: [\"A3\",\"A5\",\"A6\",\"§3\"],\n      note: \"5 段フロー: REAL(JS) → TRANSCRIPTION(AI 翻訳) → SHADOW(Go source) → COMPILE(go build) → CRYSTAL(native binary)。AI が中間段の翻訳者。JIT が「泥道を走りながらアスファルト敷く」のに対し、結晶化は「隣に最高級高速道路を建設」する事前 AOT。\",\n    },\n    \"world-coord\": {\n      meaning: \"**inter-Block / scene-level** の state / 入力 / UI / render input が共通で住む唯一の coord 系。intra-Block(asset.js 内部)は local coord OK、境界は asset.transform。screen coord は境界変換でのみ存在。A11 で domain-tagged string として表現する(\\\"world:x,y,z\\\")。\",\n      replaces: \"model / view / screen / canvas / DOM coord の混在\",\n      etymology: \"world(世界)+ coord(座標)。3D scene graph で標準的な「scene 全体の絶対座標系」。\",\n      operation_vector: \"coord 分裂 → 単一 domain (inter-Block レベル)、intra は local 許容で実装可能性を保つ\",\n      axiom_ref: [\"A10\",\"A11\"],\n      note: \"WebGL / three.js / WebGPU の scene graph 中心実装に強制収束。CSS 3D / DOM transform は永久封印。HUD は ortho camera が見る world 領域として実装。\",\n    },\n    \"domain-tag\": {\n      meaning: \"REAL 値の domain / 型 / 単位接頭辞(\\\"world:\\\" / \\\"usd:\\\" / \\\"time:\\\" / \\\"id:\\\" / \\\"hash:\\\" 等)。runtime nominal typing で値の取り違えを構造的に防ぐ。\",\n      replaces: \"裸の数値 / 文字列で REAL 値を表現すること\",\n      etymology: \"domain(領域)+ tag(印)。型のない JS で nominal typing を string prefix で emulate する技法。値そのものに型を埋める LLM-First Typing の実装手段。\",\n      operation_vector: \"暗黙の型 → 値そのものに型が埋まる  (A0 認知非対称性 + A7 展開・明示 を同時に強化)\",\n      axiom_ref: [\"A11\",\"A10\",\"A0\",\"A7\",\"Physics.LLMTyping\"],\n      note: \"format は \\\"<domain>:<body>\\\"。coord 系は coord.js(w/l/s/o + requireDomain)、汎用は tagged/parseTagged/requireTag(typed.js を将来追加)。boundary で parse、それ以外はすべて tagged string で持ち回す。\",\n    },\n    \"tagged-value\": {\n      meaning: \"Domain-Tagged Value — 型 / 単位 / domain を値の中に prefix string で埋め込んだ self-describing な REAL 値。\",\n      replaces: \"命名規則やコメントで型を表現すること(LLM 視点で context window 外に弱い手法)\",\n      etymology: \"tag(印)+ value(値)。LLM-First Typing の実装。crystallize の双対(machine の型 vs LLM の型)。\",\n      operation_vector: \"型情報の場所: 命名規則 → 値そのもの  (LLM 推論 step 削減 = mistake 確率の線形低下)\",\n      axiom_ref: [\"A11\",\"Physics.LLMTyping\",\"A0\",\"A7\"],\n      note: \"REAL 値(state / event / refs / Block 間通信)は tagged 必須、scratch / hot path は裸で OK、boundary で format/parse。\",\n    },\n    \"LLM-typing\": {\n      meaning: \"LLM-First Typing — 型を LLM が読む場所(値そのもの)に埋め込む型システム。値が token として読まれる時点で型が確定するように設計する。\",\n      replaces: \"compile-time typing(人間が型を書きコンパイラが catch する従来手法)\",\n      etymology: \"LLM(Large Language Model)+ typing(型付け)。crystallize が machine type への compile なら、これは LLM type への compile。\",\n      operation_vector: \"型は人間 / コンパイラの世界 → 型は LLM の世界  (型の住む場所のパラダイム変化)\",\n      axiom_ref: [\"Physics.LLMTyping\",\"A11\",\"A0\",\"A7\",\"A9\"],\n      note: \"実装は tagged-value(domain prefix string)。crystallize と双対関係 — どちらも『型を必要とする機械が見る場所に型を埋める』。MYY 哲学『LLM が走るための道』の core 実装。\",\n    },\n    prefab: {\n      meaning: \"Block の game asset 形態 — world transform + state + 畳込み遷移関数の triple。内部(mesh.vertices, bones, 内部 anchor)は local coord、transform が local → world の境界変換器。\",\n      replaces: \"object / entity / GameObject(Unity 的概念の Block 化)\",\n      etymology: \"pre + fabricate(あらかじめ作る)。Unity の prefab(再利用可能な game object テンプレート)から借用、ai-desk Block 思想に整合する形に再定義。\",\n      operation_vector: \"汎用 Block → 3D / 2D asset 特化  (A5 All-as-Block を game domain で具体化)\",\n      axiom_ref: [\"A5\",\"A10\"],\n      note: \"asset js module 1 個 = 1 prefab(`name.asset.js`)。export で公開、内部は local coord、外部に出す位置(transform.position, state の inter-Block 共有値)は world coord。遷移は pure function。\",\n    },\n  },\n  avoid: [\n    {\n      term: \"refactor\",\n      reason: \"「人間が読みやすくする」前提が公理 A0 違反方向。代わりに clarify / unfold / densify。\",\n      etymology: \"factor(分解する) + re-。原義「再分解する」 = 細かい単位に分け直す。\",\n      operation_vector: \"統合 → 分解  (= 隠匿方向、A1 違反)\",\n      origin_note: \"Martin Fowler 'Refactoring' (1999) が業界に広めた語。当時の前提『人間が読みやすく』が AI 時代に通用しなくなった、語自体が時代遅れ。\",\n    },\n    {\n      term: \"DRY\",\n      reason: \"重複削除は隠れた依存を生む。代わりに densify(展開で密度を上げる)。\",\n      etymology: \"Don't Repeat Yourself(Hunt & Thomas, The Pragmatic Programmer 1999)。\",\n      operation_vector: \"重複 → 共有関数化  (= 隠れた依存生成、A1 違反)\",\n    },\n    {\n      term: \"clean code\",\n      reason: \"「綺麗」の暗黙基準が人間優先。代わりに align(公理整合)。\",\n      etymology: \"「掃除された / 汚れがない」状態を意味する英単語、人間の美的判断。\",\n      operation_vector: \"汚い → 美しい  (= 美的基準は LLM に対し無効)\",\n    },\n    {\n      term: \"abstraction\",\n      reason: \"層を増やす操作は隠匿。代わりに expose(表面化)。\",\n      etymology: \"ラテン語 abs-+ trahere(引き離す)。「実体から引き離す」 = 詳細を捨てる操作。\",\n      operation_vector: \"実体 → 概念  (= 詳細喪失、A0 違反)\",\n    },\n    {\n      term: \"simplify\",\n      reason: \"情報削減は LLM にとって毒。代わりに unfold(展開)。\",\n      etymology: \"ラテン語 simplex(単一)。「単一化する = 多様性を捨てる」。\",\n      operation_vector: \"多様 → 単純  (= 情報削減、A7 違反)\",\n    },\n    {\n      term: \"encapsulate\",\n      reason: \"閉じ込めは隠匿の同義語。代わりに expose / unfold。\",\n      etymology: \"ラテン語 capsula(小さな箱)。「小さな箱に閉じ込める」が原義。\",\n      operation_vector: \"見える → 閉じる  (= 隠匿そのもの)\",\n    },\n    {\n      term: \"pretty-print\",\n      reason: \"「美しさ」の人間基準は無視、機械可読性のみ評価。\",\n      etymology: \"「綺麗に印字する」=人間の視覚に最適化する装飾操作。\",\n      operation_vector: \"機械形 → 人間形  (= LLM にとって価値ゼロ)\",\n    },\n  ],\n  principle:\n    \"用語は思考のレール。レールを引き直さないと公理の方向に走れない。\" +\n    \"code review / commit メッセージ / discussion で旧用語を使うと、\" +\n    \"意識が自動的に隠匿方向に引っ張られる。新用語を使うと展開方向に引っ張られる。\",\n  etymological_insight:\n    \"refactor / abstraction / encapsulate / simplify は **語源レベルで分解・隠匿の操作を意味している**。\" +\n    \"慣習で広まったから不適切なのでなく、**最初から AI 時代に逆向きの語**だった。\" +\n    \"Martin Fowler 'Refactoring'(1999)以降の vocabulary は、人間の作業記憶 7±2 に最適化された時代の遺物。\" +\n    \"AI に対しては **clarify(透明化)/ unfold(展開)/ densify(濃密化)/ expose(表面化)/ align(整合)** が \" +\n    \"操作の方向ベクトルとして正しい。\",\n  note:\n    \"完全置換でなく、旧用語を見たら新用語に翻訳する習慣を育てる。\" +\n    \"他者(同僚 / 客 / コミュニティ)が refactor と言う時、それを clarify / unfold のどちらかとして解釈し直す。\",\n};\n\nfunction _diagnosticContent(content, path) {\n  if (typeof content !== \"string\") return \"\";\n  if (typeof path !== \"string\" || !path.endsWith(\".yume.js\")) return content;\n  const match = content.match(/(?:^|\\r?\\n)\\/\\/ === HEAD ===\\r?\\n([\\s\\S]*?)(?:\\r?\\n)\\/\\/ === \\/HEAD ===(?:\\r?\\n|$)/);\n  return match ? match[1] : content;\n}\n\nfunction _extractBlockExpr(source) {\n  const match = source.match(/export\\s+const\\s+__block\\s*=\\s*\\{/);\n  if (!match) return null;\n\n  const startIndex = match.index + match[0].length - 1;\n  let depth = 0;\n  let stringChar = \"\";\n  let escape = false;\n  let lineComment = false;\n  let blockComment = false;\n\n  for (let i = startIndex; i < source.length; i++) {\n    const c = source[i];\n    const next = source[i + 1];\n\n    if (escape) { escape = false; continue; }\n    if (stringChar) {\n      if (c === \"\\\\\") { escape = true; continue; }\n      if (c === stringChar) stringChar = \"\";\n      continue;\n    }\n    if (lineComment) {\n      if (c === \"\\n\") lineComment = false;\n      continue;\n    }\n    if (blockComment) {\n      if (c === \"*\" && next === \"/\") { blockComment = false; i++; }\n      continue;\n    }\n\n    if (c === \"/\" && next === \"/\") { lineComment = true; i++; continue; }\n    if (c === \"/\" && next === \"*\") { blockComment = true; i++; continue; }\n    if (c === \"\\\"\" || c === \"'\" || c === \"`\") { stringChar = c; continue; }\n    if (c === \"{\") depth++;\n    else if (c === \"}\") {\n      depth--;\n      if (depth === 0) return source.slice(startIndex, i + 1);\n    }\n  }\n  return null;\n}\n\nfunction _parseBlockForAudit(content) {\n  if (typeof content !== \"string\") return null;\n  const expr = _extractBlockExpr(content);\n  if (!expr) return null;\n  try { return JSON.parse(expr); }\n  catch { return null; }\n}\n\nfunction _versionAuditId(version, index) {\n  if (Number.isInteger(version?.v)) return `v${version.v}`;\n  if (typeof version?.hash === \"string\") return version.hash.slice(0, 12);\n  return `index:${index}`;\n}\n\nfunction _codeOnly(content) {\n  const out = [];\n  let mode = \"code\";\n  let quote = \"\";\n  let escape = false;\n  let regexClass = false;\n  for (let i = 0; i < content.length; i++) {\n    const c = content[i];\n    const next = content[i + 1];\n\n    if (mode === \"line\") {\n      out.push(c === \"\\n\" ? \"\\n\" : \" \");\n      if (c === \"\\n\") mode = \"code\";\n      continue;\n    }\n    if (mode === \"block\") {\n      out.push(c === \"\\n\" ? \"\\n\" : \" \");\n      if (c === \"*\" && next === \"/\") { i++; out.push(\" \"); mode = \"code\"; }\n      continue;\n    }\n    if (mode === \"string\") {\n      out.push(c === \"\\n\" ? \"\\n\" : \" \");\n      if (escape) { escape = false; continue; }\n      if (c === \"\\\\\") { escape = true; continue; }\n      if (c === quote) mode = \"code\";\n      continue;\n    }\n    if (mode === \"regex\") {\n      out.push(c === \"\\n\" ? \"\\n\" : \" \");\n      if (escape) { escape = false; continue; }\n      if (c === \"\\\\\") { escape = true; continue; }\n      if (c === \"[\") { regexClass = true; continue; }\n      if (c === \"]\") { regexClass = false; continue; }\n      if (c === \"\\n\" || c === \"\\r\") { mode = \"code\"; regexClass = false; continue; }\n      if (c === \"/\" && !regexClass) mode = \"code\";\n      continue;\n    }\n\n    if (c === \"/\" && next === \"/\") { out.push(\" \"); i++; out.push(\" \"); mode = \"line\"; continue; }\n    if (c === \"/\" && next === \"*\") { out.push(\" \"); i++; out.push(\" \"); mode = \"block\"; continue; }\n    if (c === \"\\\"\" || c === \"'\" || c === \"`\") { out.push(\" \"); quote = c; mode = \"string\"; escape = false; continue; }\n    if (c === \"/\" && _looksLikeRegexStart(content, i)) { out.push(\" \"); mode = \"regex\"; escape = false; regexClass = false; continue; }\n    out.push(c);\n  }\n  return out.join(\"\");\n}\n\nfunction _looksLikeRegexStart(content, slashIndex) {\n  const next = content[slashIndex + 1];\n  if (next === \"/\" || next === \"*\" || next === undefined) return false;\n  let i = slashIndex - 1;\n  while (i >= 0 && /\\s/.test(content[i])) i--;\n  if (i < 0) return true;\n  const prev = content[i];\n  if (\"([{=,:;!~?&|+-*%^<>\".includes(prev)) return true;\n  const prefix = content.slice(0, i + 1);\n  const word = prefix.match(/([A-Za-z_$][\\w$]*)$/)?.[1];\n  return [\"return\", \"throw\", \"case\", \"delete\", \"typeof\", \"void\", \"yield\", \"await\"].includes(word);\n}\n\nfunction _hasRuntimeCodeGeneration(content) {\n  return /\\beval\\s*\\(|\\bnew\\s+Function\\s*\\(/.test(_codeOnly(content));\n}\n\n// ============================================================\n// 第 4 層: 守護聖域(Sacred Taboos)\n//   これは declarative な禁忌の表明であり、validator ではない(公理 A8 §4.1.1)。\n//   check 関数は「構造的に何が違反か」の概念表現として提供。\n//   実際の enforcement は Block 構造(parseJS / tags / refs)の存在/不在で読む。\n// ============================================================\nexport const Taboos = [\n  {\n    id: 1, name: \"No TypeScript\",\n    rule: \"TS / TSX を導入しない。型情報による情報の分離(隠匿)を防ぐため。\",\n    declarative: true,\n    check: (content, path) => !/\\.tsx?$/.test(path) && !/\\btsconfig\\.json$/.test(path),\n  },\n  {\n    id: 2, name: \"No Build / Transpile\",\n    rule: \"build step を作らない。ソース = 実行ファイルの原則を守る。\",\n    declarative: true,\n    // import / require / package.json の依存記述だけを検査(ファイル内の literal 文字列に誤反応しないため)\n    check: (content) => !_importsAny(content, /(webpack|babel|rollup|esbuild|vite|parcel|swc|tsc)/),\n  },\n  {\n    id: 3, name: \"No Frameworks\",\n    rule: \"React / Vue / Angular / Next 等の framework を入れない。暗黙の規約は隠匿の温床。\",\n    declarative: true,\n    check: (content) => !_importsAny(content, /(^react$|^react\\/|^react-dom|^vue$|^@vue\\/|^@angular\\/|^svelte$|^next$|^next\\/)/i),\n  },\n  {\n    id: 4, name: \"Zero-Dependency\",\n    rule: \"Web 標準 + Node 標準のみ。Eternal Compatibility の確保。\",\n    declarative: true,\n    note: \"node:fs / node:path 等の node 標準は許可。CommonJS の require は局所許可(3dplus 等)。3D engine は **three.js のみ局所許可**(A10 で WebGL/three.js/WebGPU に強制収束済み、revision pin で Eternal Compat 確保)。\",\n  },\n  {\n    id: 5, name: \"No direct mutation of Block.versions\",\n    rule: \"Block.versions を直接書き換えない。必ず commit() 経由(append-only)。\",\n    declarative: true,\n  },\n  {\n    id: 6, name: \"SHADOW 変数化禁止\",\n    rule: \"Block.content / refs / tags(SHADOW)を変数で持ち回さない。getter から都度読む。\",\n    declarative: true,\n    refsAxiom: \"A3, A6\",\n  },\n  {\n    id: 7, name: \"No human-readability optimization\",\n    rule: \"「人間にとっての見やすさ」で判断しない。LLM の情報密度で判断する。\",\n    declarative: true,\n    refsAxiom: \"A0, A7\",\n  },\n  // ─── Crystallization-blocking patterns(公理 A9 系列、Block 内では禁忌)───\n  {\n    id: 8, name: \"No eval / new Function\",\n    rule: \"Block.content で eval(...) や new Function(...) を使わない。runtime コード生成は crystallize 不能 + AI 静的推論不能 + 公理 A0 違反。\",\n    declarative: true,\n    check: (content) => !_hasRuntimeCodeGeneration(content),\n    refsAxiom: \"A9\",\n  },\n  {\n    id: 9, name: \"No prototype mutation\",\n    rule: \"Object.prototype.X = ... / __proto__ 改変を Block.content でやらない。global state 汚染 + crystallize 不能。\",\n    declarative: true,\n    check: (content) => !/(\\.prototype\\.[\\w$]+\\s*=|\\b__proto__\\b\\s*=)/.test(_codeOnly(content)),\n    refsAxiom: \"A9\",\n  },\n  {\n    id: 10, name: \"No Proxy / Reflect.construct\",\n    rule: \"Proxy / Reflect.construct で動的 property 介入しない。Go の static 型システムに乗らない、crystallize 不能。\",\n    declarative: true,\n    check: (content) => !/\\b(new\\s+Proxy|Reflect\\.(construct|apply|get|set|has|deleteProperty|defineProperty))\\s*\\(/.test(_codeOnly(content)),\n    refsAxiom: \"A9\",\n  },\n  {\n    id: 11, name: \"No with statement\",\n    rule: \"with(obj){...} を使わない。scope 曖昧化、AI も Go も追跡不能。\",\n    declarative: true,\n    check: (content) => !/^\\s*with\\s*\\(/m.test(_codeOnly(content)),\n    refsAxiom: \"A9\",\n  },\n  {\n    id: 12, name: \"No arguments object\",\n    rule: \"function 内で arguments を参照しない。rest params (...args) で代替。arguments は dynamic semantics、crystallize 不能。\",\n    declarative: true,\n    check: (content) => !/\\barguments\\b\\s*[\\.\\[]/.test(_codeOnly(content)),\n    refsAxiom: \"A9\",\n  },\n  // ─── Single-coordinate-domain patterns(公理 A10 系列、3D / 2D / game / tool 共通)───\n  {\n    id: 13, name: \"No CSS 3D transform\",\n    rule: \"transform: translate3d / rotate3d / matrix3d / perspective を CSS / inline style で使わない。CSS transform は parent-relative で world-coord 統一不能、voxel 3 試行で実証済み(2026-05-03)。\",\n    declarative: true,\n    check: (content) => !/\\b(translate3d|rotate3d|matrix3d|perspective)\\s*\\(/.test(_codeOnly(content)) && !/transform-style\\s*:\\s*preserve-3d/.test(_codeOnly(content)),\n    refsAxiom: \"A10\",\n  },\n  {\n    id: 14, name: \"No screen-coord in Block state\",\n    rule: \"Block の state / event payload に screen / canvas pixel / clientX / clientY / pageX / pageY 等の screen-coord を持ち込まない。input adapter 境界で world ray に変換してから Block に渡す。\",\n    declarative: true,\n    check: (content) => !/\\b(clientX|clientY|pageX|pageY|screenX|screenY|offsetX|offsetY)\\b\\s*[:=]/.test(_codeOnly(content)),\n    refsAxiom: \"A10\",\n  },\n  {\n    id: 15, name: \"No world-tracking DOM overlay\",\n    rule:\n      \"**禁止**: world coord を screen に project して位置づけする DOM 要素(voxel に追従する label、3D 物体の上に float する tooltip、CSS transform で 3D を再現する pseudo-3D)。これは A10 の coord 統一を崩す。\" +\n      \"**許可**: 画面端の **sidebar / panel**(3D scene と構造的に分離)、native form 要素(`<input>` `<button>` `<select>` `<input type='color'>`)、modal dialog(OS resource boundary)、OffscreenCanvas + CanvasTexture(DOM tree 外、texture source)。\" +\n      \"判断基準: 「world coord を読んで DOM に位置を反映するか」 — する=禁止、しない=許可。\",\n    declarative: true,\n    refsAxiom: \"A10\",\n    note:\n      \"voxel 失敗(CSS 3D の parent-relative transform で coord 混在)起点で禁止された経緯あり、\" +\n      \"ただし全 DOM UI 排除は厳しすぎ。sidebar / panel / modal は a11y / IME / native form 要素の利点が大きく、\" +\n      \"world と coord 衝突しないので許可するのが正しい(2026-05-04 refine)。\",\n  },\n];\n\n// ============================================================\n// 第 5 層: 実行儀式(CLI Reference)\n// ============================================================\nexport const Rituals = {\n  // 基本走査\n  skeleton:   { cmd: \"node ai-desk.js skeleton <file>\",            desc: \"Block 構造の透視(関数 / class / module + refs)\" },\n  focus:      { cmd: \"node ai-desk.js focus <file> <id>\",          desc: \"特定 Block の中身を表示\" },\n  graph:      { cmd: \"node ai-desk.js graph <file...>\",            desc: \"複数ファイルから Graph 抽出 → JSON\" },\n  impact:     { cmd: \"node ai-desk.js impact <file> <id>\",         desc: \"変更による因果の波及予測(forward closure)\" },\n\n  // 永続化\n  save:       { cmd: \"node ai-desk.js save <out.json> <files...>\", desc: \"Graph を JSON に永続化(全 Block + versions)\" },\n  load:       { cmd: \"node ai-desk.js load <in.json>\",             desc: \"JSON から Graph を復元 + hash chain verify\" },\n\n  // 仮想重厚関数(v2 戦闘力の核)\n  heavy:         { cmd: \"node ai-desk.js heavy <graph> <root> [--depth=N]\",         desc: \"1 root + 推移閉包を 1 content に展開して stdout に出す(LLM 渡し用)\" },\n  virtualApply:  { cmd: \"node ai-desk.js virtual-apply <graph> <root> <patch>\",     desc: \"expand を編集して戻された content を BLOCK ヘッダで分割 → 各 Block に逆配分\" },\n  apply:         { cmd: \"node ai-desk.js apply <graph> <patch.js> <module-id>\",     desc: \"patch ファイルの差分を特定 module の Block 群に適用\" },\n\n  // tag / 検索\n  tags:       { cmd: \"node ai-desk.js tags <file> <tag>\",          desc: \"tag でフィルタ(SPEC タグの全関数を引く等)\" },\n  inferTags:  { cmd: \"node ai-desk.js infer-tags <file>\",          desc: \"I/O / async / pure / large 等を heuristic 推定\" },\n  search:     { cmd: \"node ai-desk.js search <file> <query>\",      desc: \"content を substring 検索\" },\n\n  // 履歴 / 解析\n  diff:       { cmd: \"node ai-desk.js diff <file> <id> [i] [j]\",   desc: \"Block の version 間 diff\" },\n  blame:      { cmd: \"node ai-desk.js blame <file> <id>\",          desc: \"Block の各行の version 由来を追跡\" },\n  stats:      { cmd: \"node ai-desk.js stats <file>\",               desc: \"Graph 統計(blocks / versions / refs / by-type / by-tag)\" },\n  mermaid:    { cmd: \"node ai-desk.js mermaid <file>\",             desc: \"Graph を Mermaid 図に出力\" },\n\n  // 検証\n  lint:       { cmd: \"node ai-desk.js lint <file>\",                desc: \"Bible 違反 lint(共通ヘルパー検出 / 命名 / 等)\" },\n  e2e:        { cmd: \"node ai-desk.js e2e\",                        desc: \"コア e2e テストを実行\" },\n};\n\n// ============================================================\n// Kernel — 統合ガバナンス・エンジン\n// ============================================================\nexport const Kernel = {\n  // 全 Taboos を当てて違反を返す。declarative_only: true なら check 関数があるものだけ実行\n  diagnose(content, path) {\n    const checkedContent = _diagnosticContent(content, path);\n    const violations = Taboos\n      .filter(t => typeof t.check === 'function')\n      .filter(t => !t.check(checkedContent, path))\n      .map(t => ({ id: t.id, name: t.name, rule: t.rule }));\n    return {\n      ok: violations.length === 0,\n      violations,\n      gravity: Physics.Gravity.calculate(checkedContent),\n      // declarative-only(check 関数なし)の Taboos は別途\n      declarative_only_check_required: Taboos.filter(t => !t.check).map(t => ({ id: t.id, name: t.name, rule: t.rule })),\n    };\n  },\n\n  auditHistory(content, path) {\n    const block = _parseBlockForAudit(content);\n    if (!block || !Array.isArray(block.versions)) {\n      const head = this.diagnose(content, path);\n      return {\n        ok: head.ok,\n        audit: \"history\",\n        file: path,\n        blockId: null,\n        versions: 0,\n        violationCount: head.violations.length,\n        violations: head.violations.map(v => ({\n          versionIndex: null,\n          version: \"content\",\n          violation: v,\n          gravity: head.gravity,\n        })),\n      };\n    }\n\n    const findings = [];\n    for (let i = 0; i < block.versions.length; i++) {\n      const version = block.versions[i];\n      const versionContent = typeof version.content === \"string\" ? version.content : \"\";\n      const result = this.diagnose(versionContent, \"\");\n      for (const violation of result.violations) {\n        findings.push({\n          versionIndex: i,\n          version: _versionAuditId(version, i),\n          hash: typeof version.hash === \"string\" ? version.hash : null,\n          v: Number.isInteger(version.v) ? version.v : null,\n          applyId: version.applyId ?? null,\n          violation,\n          gravity: result.gravity,\n        });\n      }\n    }\n\n    return {\n      ok: findings.length === 0,\n      audit: \"history\",\n      file: path,\n      blockId: block.id ?? null,\n      versions: block.versions.length,\n      violationCount: findings.length,\n      violations: findings,\n    };\n  },\n\n  // 任意の axiom 集合を選んで重力場 prompt を組み立てる(token 削減用、enkai の auto-inject 代替)\n  summonContext(axiomIds = [], opts = {}) {\n    const includeExamples = opts.examples !== false;\n    let p = `## 🌌 CONTEXT_GRAVITY_FIELD\\n\\n`;\n    p += `[Physics.Gravity] ${Physics.Gravity.law}\\n`;\n    if (opts.spotlight) p += `[Physics.Spotlight] ${Physics.Spotlight.law}\\n`;\n    p += `\\n`;\n    for (const id of axiomIds) {\n      const a = Axioms[id];\n      if (!a) continue;\n      p += `[${a.id}] ${a.name}\\n  ${a.summary}\\n  why: ${a.why}\\n`;\n      if (includeExamples && a.examples?.length) p += `  examples: ${a.examples.join(' / ')}\\n`;\n      if (includeExamples && a.violations?.length) p += `  violations: ${a.violations.join(' / ')}\\n`;\n      p += `\\n`;\n    }\n    return p;\n  },\n\n  // BIBLE.md の人間用 view を生成(SHADOW、いつでも捨てられる)\n  exportMarkdown() {\n    const out = [];\n    out.push(`# AI-Native Master Bible v${VERSION}`);\n    out.push(`> Auto-generated from AiRunAndRead_BIBLE.js — DO NOT EDIT THIS FILE DIRECTLY.`);\n    out.push(`> Run \\`node v2/AiRunAndRead_BIBLE.js export-md > BIBLE.md\\` to regenerate.`);\n    out.push(`> Date: ${DATE}  ·  Author: ${AUTHOR}\\n`);\n\n    out.push(`## 1. Cognitive Physics`);\n    for (const [name, p] of Object.entries(Physics)) {\n      out.push(`### ${name}`);\n      out.push(p.law || p.detail || '(functional)');\n      if (p.detail && p.law) out.push(`\\n${p.detail}`);\n      if (p.status) out.push(`\\n**status**: ${p.status}`);\n    }\n    out.push('');\n\n    out.push(`## 2. Axioms`);\n    for (const a of Object.values(Axioms)) {\n      out.push(`### ${a.id} — ${a.name}`);\n      out.push(`**${a.summary}**\\n`);\n      out.push(`why: ${a.why}\\n`);\n      if (a.examples?.length)   out.push(`examples:\\n${a.examples.map(e => `- ${e}`).join('\\n')}\\n`);\n      if (a.violations?.length) out.push(`violations:\\n${a.violations.map(v => `- ${v}`).join('\\n')}\\n`);\n      if (a.refs?.length)       out.push(`refs: ${a.refs.join(', ')}\\n`);\n      if (a.enforcementNote)    out.push(`enforcement: ${a.enforcementNote}\\n`);\n    }\n    out.push('');\n\n    out.push(`---`);\n    out.push(`## 🚨 概念の再定義：クリアファイ (Clearify)`);\n    out.push(`ai-desk において、振る舞いを変えずに構造を調整する行為を**「リファクタリング」と呼ばない**。`);\n    out.push(`代わりに**「クリアファイ (Clearify)」**と呼ぶ。\\n`);\n    out.push(`- **目的**: 論理の濁り（不透明性）を消し、推論の軌道をクリアにすること。`);\n    out.push(`- **手段**: 隠された依存を \\`refs\\` として物質化し、情報の近接性（Locality）を高め、重力場を強化すること。`);\n    out.push(`- **結果**: AI が推測（ハルシネーション）を必要とせず、論理を一意に特定できる状態へ導く。\\n`);\n\n    out.push(`## 3. Block Schema`);\n    for (const [name, s] of Object.entries(BlockSchema)) {\n      out.push(`### ${name}`);\n      out.push(s.description);\n      for (const [k, v] of Object.entries(s.fields)) out.push(`- \\`${k}\\`: ${v}`);\n      out.push('');\n    }\n    out.push(`### Block Types`);\n    for (const [name, t] of Object.entries(BlockTypes)) {\n      out.push(`- **${name}** — ${t.purpose}${t.refSection ? ` (${t.refSection})` : ''}`);\n    }\n    out.push('');\n\n    out.push(`## 3.5 Vocabulary(用語の重力場)`);\n    out.push(Vocabulary.principle + '\\n');\n    out.push(`### 使う用語(置換)`);\n    for (const [k, v] of Object.entries(Vocabulary.use)) {\n      out.push(`- **${k}** — ${v.meaning}`);\n      out.push(`  - replaces: \\`${v.replaces}\\`  ·  vector: \\`${v.operation_vector}\\`  ·  refs: ${v.axiom_ref.join(', ')}`);\n      out.push(`  - 語源: ${v.etymology}`);\n    }\n    out.push(`\\n### 使わない用語(語源レベルで分解・隠匿方向)`);\n    for (const a of Vocabulary.avoid) {\n      out.push(`- **~~${a.term}~~** — ${a.reason}`);\n      out.push(`  - 語源: ${a.etymology}`);\n      out.push(`  - 操作方向: \\`${a.operation_vector}\\``);\n      if (a.origin_note) out.push(`  - 由来: ${a.origin_note}`);\n    }\n    out.push(`\\n#### 語源的洞察\\n${Vocabulary.etymological_insight}\\n`);\n    out.push(`${Vocabulary.note}\\n`);\n\n    out.push(`## 4. Sacred Taboos`);\n    for (const t of Taboos) {\n      out.push(`### ${t.id}. ${t.name}`);\n      out.push(t.rule);\n      if (t.note) out.push(`\\nnote: ${t.note}`);\n      if (t.refsAxiom) out.push(`\\nrefs: ${t.refsAxiom}`);\n      out.push('');\n    }\n\n    out.push(`## 5. Execution Rituals`);\n    for (const [name, r] of Object.entries(Rituals)) {\n      out.push(`- **${name}**: \\`${r.cmd}\\` — ${r.desc}`);\n    }\n    out.push('');\n\n    return out.join('\\n');\n  },\n};\n\n// ============================================================\n// Self-display(node AiRunAndRead_BIBLE.js で自分自身を開示)\n// ============================================================\nif (typeof process !== 'undefined' && /AiRunAndRead_BIBLE\\.js$/.test(process.argv[1] || '')) {\n  const cmd = process.argv[2];\n\n  if (cmd === 'export-md') {\n    process.stdout.write(Kernel.exportMarkdown());\n  } else if (cmd === 'summon') {\n    const ids = process.argv.slice(3);\n    process.stdout.write(Kernel.summonContext(ids.length ? ids : ['A0','A4','A5','A6','A8'], { spotlight: true }));\n  } else if (cmd === 'diagnose') {\n    const file = process.argv[3];\n    if (!file) {\n      console.error(\"usage: node AiRunAndRead_BIBLE.js diagnose <file>\");\n      process.exit(2);\n    }\n    const fs = await import('node:fs');\n    const content = fs.readFileSync(file, 'utf8');\n    console.log(JSON.stringify(Kernel.diagnose(content, file), null, 2));\n  } else {\n    console.log(`\\n##################################################`);\n    console.log(`##  AiRunAndRead_BIBLE.js v${VERSION} : THE AI KERNEL  ##`);\n    console.log(`##################################################\\n`);\n\n    console.log(`[Cognitive Physics]`);\n    for (const [name, p] of Object.entries(Physics)) {\n      console.log(`  - ${name}: ${(p.law || '').slice(0, 80)}${p.status ? ` (${p.status})` : ''}`);\n    }\n\n    console.log(`\\n[Axioms]`);\n    for (const a of Object.values(Axioms)) {\n      console.log(`  - ${a.id} ${a.name}`);\n    }\n\n    console.log(`\\n[Block Types]`);\n    for (const [name, t] of Object.entries(BlockTypes)) {\n      console.log(`  - ${name}: ${t.purpose.slice(0, 60)}`);\n    }\n\n    console.log(`\\n[Vocabulary]  use new terms, avoid old ones`);\n    for (const [k, v] of Object.entries(Vocabulary.use)) console.log(`  ${k.padEnd(8)} ← ${v.replaces}`);\n\n    console.log(`\\n[Sacred Taboos]`);\n    for (const t of Taboos) console.log(`  ${t.id}. ${t.name}`);\n\n    console.log(`\\n[Execution Rituals]  (${Object.keys(Rituals).length} commands)`);\n    for (const [name, r] of Object.entries(Rituals)) {\n      console.log(`  - ${name}: ${r.desc}`);\n    }\n\n    console.log(`\\nUsage:`);\n    console.log(`  node AiRunAndRead_BIBLE.js export-md > BIBLE.md   # 人間用 md を生成`);\n    console.log(`  node AiRunAndRead_BIBLE.js summon A0 A8           # 重力場 prompt を生成`);\n    console.log(`  node AiRunAndRead_BIBLE.js diagnose <file>        # Bible 違反診断`);\n    console.log(``);\n  }\n}\n",
      "ts": 1779712179130,
      "refs": [
        {
          "kind": "dynamic-import",
          "target": "node:fs"
        },
        {
          "kind": "calls",
          "target": "_extractBlockExpr"
        },
        {
          "kind": "calls",
          "target": "_looksLikeRegexStart"
        },
        {
          "kind": "calls",
          "target": "_codeOnly"
        },
        {
          "kind": "calls",
          "target": "_importsAny"
        },
        {
          "kind": "calls",
          "target": "_hasRuntimeCodeGeneration"
        },
        {
          "kind": "calls",
          "target": "_diagnosticContent"
        },
        {
          "kind": "calls",
          "target": "_parseBlockForAudit"
        },
        {
          "kind": "calls",
          "target": "_versionAuditId"
        }
      ],
      "tags": [],
      "applyId": "apply-2026-05-25-c535607d",
      "hash": "fb6d204a4ee72ad4f08a25e726c6c00000a44ff5f6e00cd7637fcf9d559a583a",
      "prevHash": "607ede100c02b63f1e29e984111378e3291b60a49181de3f69f0f3a349d36605"
    },
    {
      "content": "// bible.aiDoc.yume.js\n// AI-Native Master Bible v2 — Super-Block Executable Edition\n//\n// ⚠️ このファイルの意味:\n//   このファイルは AI に対して 2 つの instruction を発する:\n//     1. `node bible.aiDoc.yume.js` で **実行** せよ(出力が canonical view)\n//     2. or `import { ... } from './bible.aiDoc.yume.js'` で構造を **読め**\n//   ⛔ .js のソースを prose として linear に読むな(JS は構造化容器、\n//      prose 読みは情報を取りこぼす — 公理 A0 / A7 違反)\n//\n// 思想(Bible) + 認知(Manifesto) + 規律(Onboarding) + 参照(Reference) + 派生 Block 仕様\n// を統合した全知の核。\n//\n// **canonical form**: this file (.js) ← REAL\n// **human form**:    BIBLE.md は派生(SHADOW)、`node bible.aiDoc.yume.js export-md` で生成\n//                    (公理 A3 — REAL は .js、SHADOW は .md)\n//\n// 他 v2 ツールから:\n//   `import { Kernel, Axioms, BlockSchema } from './bible.aiDoc.yume.js'`\n\nexport const VERSION = \"2.11\";\nexport const DATE = \"2026-05-04\";\nexport const AUTHOR = \"沖井広行(蒼山りと)\";\n\n// ============================================================\n// 第 1 層: 認知物理学(Cognitive Physics)\n//   公理より下のレイヤー。AI の思考を規定する観測された物理法則。\n//   実証された heuristic は law として。仮説は note として明記。\n// ============================================================\nexport const Physics = {\n  Spotlight: {\n    range: 300,\n    law: \"AI は今読んでいる場所から ~300 行以上離れた情報を急速に忘却する。重要な情報は常に近接に配置せよ。\",\n    status: \"heuristic\",   // BIBLE.md には未記載、運用上の観察値。今後計測で根拠を強化する。\n    addedIn: \"2.6\",\n  },\n  Gravity: {\n    law: \"複雑性は推論を一意化する重力である。シンプルさは AI を漂流(ハルシネーション)させる無重力空間である。\",\n    detail: \"Bible §0 大前提 / §2.5 詳説。注意機構の質量分布として作用 — refs が密 = attention が安定。\",\n    status: \"axiomatic\",\n    // 注: calculate は「推定指標」であり真の attention 重力の計測ではない。\n    // 文字列単純 match であって、コメントや文字列リテラル中の token も拾う。\n    // 比較値として使う(同じ formula で時系列比較)用途のみ妥当。\n    calculate: (code) => {\n      const connections = (code.match(/\\b(import|export|function|class)\\b|=>/g) || []).length;\n      return connections / Math.max(1, code.split('\\n').length);\n    },\n  },\n  FileCost: {\n    law: \"ファイル移動と分割は AI にとって物理的重労働である。コンテキストを統合し、移動を最小化せよ。\",\n    status: \"axiomatic\",\n    related: \"公理 A1(ローカリティ極大化)\",\n  },\n  LLMTyping: {\n    law:\n      \"LLM の type system は **値そのもの**である。LLM が token を読む時点で型が見えなければ、\" +\n      \"LLM は context window を遡って型を再構築しようとし、推論 step が増え、間違える確率が線形に上がる。\" +\n      \"従って『REAL な値(state / event payload / refs payload / Block 間通信値)』は、\" +\n      \"**値の中に型が埋まった self-describing 形式**で持つこと(例: \\\"world:5,0,2\\\" / \\\"usd:9.99\\\" / \\\"time:1234567890\\\")。\",\n    detail:\n      \"**LLM-First Typing** — 普通の typing は compile time に人間が型を書きコンパイラが catch する仕組み。\" +\n      \"それは『機械(コンパイラ)が見る型』。LLM 時代では LLM 自身が推論 step ごとに『直前の token から型情報を取得』する必要があり、\" +\n      \"**LLM が見る場所(値そのもの)に型が埋まっている**ことが推論精度を最大化する。\" +\n      \"命名規則(`worldPos`, `screenX`)に型を載せる従来手法は LLM の context window 外で崩壊する — \" +\n      \"tagged value は context 不要で常に正解。\" +\n      \"これは **crystallize の双対**: \" +\n      \"  - crystallize: JS Block → Go の static type system に翻訳(machine の型に compile)\" +\n      \"  - tagged value: 値 → LLM の視野に型を埋め込む(LLM の型に compile)\" +\n      \"両者とも『型を必要とする機械(machine compiler / LLM inference)が見る場所に型を埋める』操作。\",\n    status: \"axiomatic\",\n    addedIn: \"2.10\",\n    related: \"公理 A0 認知非対称性、A7 展開・明示、A9 crystallize、A11 Domain-Tagged Values\",\n    benefits: [\n      \"LLM 認知コスト最小化(token 単位で型確定、context 遡及不要)\",\n      \"推論ステップ削減 → mistake 確率の線形低下\",\n      \"命名規則・コメント・schema 不要(値が self-describing)\",\n      \"context window 外でも常に正解(値だけで型確定)\",\n      \"AI 同士の transfer でも型情報が値に張り付いて移動\",\n      \"crystallize 整合(Go 側でも string → struct で 1:1 受け、translation contract 単純化)\",\n    ],\n    formula: \"「型は LLM が見る場所(値そのもの)に置け」\",\n  },\n};\n\n// ============================================================\n// 第 2 層: 公理体系(Core Axioms A0〜A13)\n//   各公理は {id, name, summary, why, examples, violations, refs} を持つ\n//   prose ではなく構造化データとして — JS が容器の真価を発揮する層\n// ============================================================\nexport const Axioms = {\n  A0: {\n    id: \"A0\", name: \"認知非対称性\",\n    summary: \"人向けの『良い設計』(抽象化・分割・カプセル化)は AI にとって情報の隠匿、つまり毒である。AI には統合された複雑性を与えよ。\",\n    why: \"人間の作業記憶は 7±2 と狭く隠匿で『理解』を作る。LLM の作業記憶は桁違いに広く、隠匿は推測領域(=ハルシネーション温床)に変わる。\",\n    examples: [\"ヘルパー関数で詳細を隠す ❌ → インライン展開して全部見せる ✓\", \"型定義で実装と分離 ❌ → 動的な構造を直接見せる ✓\"],\n    violations: [\"共通関数で重複削減\", \"interface で実装隠匿\", \"doc string でコードの意図を別レイヤーに\"],\n    refs: [\"A1\", \"A7\"],\n  },\n  A1: {\n    id: \"A1\", name: \"ローカリティ極大化\",\n    summary: \"機能に必要な情報は 1 つのスコープに集約する。共有ヘルパーを作らず、必要なら複製(Copy&Paste)せよ。重複は悪ではない。隠れた依存こそが悪。\",\n    why: \"別ファイル / 別関数への分離 = 物理的隠匿。Spotlight 範囲(~300 行)を超えると AI から forgotten される。\",\n    examples: [\"3 箇所で似た 5 行 → 3 箇所に複製で OK(共通化しない)\"],\n    violations: [\"DRY 至上主義\", \"1 行関数の抽出\", \"util/helper モジュールへの逃げ\"],\n    refs: [\"A0\", \"Physics.FileCost\", \"Physics.Spotlight\"],\n  },\n  A2: {\n    id: \"A2\", name: \"Constraint Folding\",\n    summary: \"if/else 分岐ツリーを捨て、全可能世界 + 制約 filter に畳み込め。\",\n    why: \"分岐ツリーは推測領域(=重力ゼロ)を生む。全可能世界の物質化は重力場を形成し、推論軌道を一意化する。\",\n    examples: [\"じゃんけん 9 通りを全列挙 → tie 制約で filter\", \"状態遷移を全許容組み合わせ × 制約で生成\"],\n    violations: [\"if/else の入れ子\", \"early return で網羅性放棄\"],\n    refs: [\"A0\", \"BlockTypes.Constraint\"],\n  },\n  A3: {\n    id: \"A3\", name: \"REAL / SHADOW\",\n    summary: \"書き換え可能な唯一の真実を REAL とし、それ以外は SHADOW(派生値)として保持禁止。SHADOW は使う瞬間に生成し、使い終わったら捨てる。実行 JS 内で AI / Kantoku が監視すべき正の状態は `REAL_*` 変数名で明示してよい。\",\n    why: \"重複 state は同期コストと整合性事故の温床。REAL 1 つから常に派生計算する方が密度が上がり、ハルシネーション余地が消える。`REAL_*` は型や単位ではなく『監視対象の正状態』を示す接頭語であり、起動時 AST bootstrap / 実行時 trace / AI 判断の境界を明示する。AST で得る boolean は `isWatched` と呼ぶ。`check` は検査実行の動詞であり、監視対象かどうかの性質名には使わない。\",\n    examples: [\n      \"Block.versions = REAL、Block.content = SHADOW(getter で head().content)\",\n      \"bible.aiDoc.yume.js = REAL、BIBLE.md = SHADOW(exportMarkdown で派生)\",\n      \"let REAL_state = initialState(); REAL_state = dispatch(REAL_state, evt);\",\n      \"REAL_* は app の主要 state / reducer 後 state / render・eyes・test の入力にだけ付ける\",\n    ],\n    violations: [\n      \"状態を 2 箇所に保存\",\n      \"computed 値をキャッシュ変数化(stale 化リスク)\",\n      \"const REAL_x = 1 のような小さな一時値への過剰命名\",\n      \"DOM 要素 / cache / derived view / loop counter に REAL_* を付ける\",\n    ],\n    refs: [\"A6\"],\n  },\n  A4: {\n    id: \"A4\", name: \"Event Sourcing + Sequential Hashing\",\n    summary: \"状態の上書き保存を避け、状態を変えるイベントの履歴を時系列に追記する。各イベントは前イベントの hash を含み、改ざん検知可能。\",\n    why: \"上書きは過去の喪失。append-only + hash chain は時間軸を保存し、任意時点の再構成と監査を保証する。Block.versions の prevHash chain の理論基盤。\",\n    examples: [\"Block.versions[].prevHash = versions[i-1].hash\", \"session = 操作 + 観測 Block の連鎖\"],\n    violations: [\"state を上書き\", \"ログを別ファイルに分離(graph 構造から外れる)\"],\n    refs: [\"A6\"],\n  },\n  A5: {\n    id: \"A5\", name: \"All-as-Block\",\n    summary: \"ai-desk における全ての構成要素は Block インターフェースに従う。関数・クラス・モジュール・ドキュメント・制約・観測・テスト・議論 ─ すべて Block。\",\n    why: \"LLM は単一の操作モデル(Block の生成・追記・参照・走査・検証)で全構造を扱えるべき。type の発明は隠匿の入口。\",\n    examples: [\"function Block / class Block / module Block / constraint Block / observation Block / twin Block\"],\n    violations: [\"Block 外の独自 schema 発明\", \"別 layer での state 保持\"],\n    refs: [\"A0\", \"Block\"],\n  },\n  A6: {\n    id: \"A6\", name: \"Versions-as-Body\",\n    summary: \"Block の唯一の状態は versions: Version[] である。content / refs / children / tags は head() から派生(SHADOW)、変数化禁止。\",\n    why: \"履歴は本体であり、最新値は派生に過ぎない。任意時点の状態は versions 走査で再現可能(time travel)。\",\n    examples: [\"Block.versions = REAL\", \"Block.content getter は head().content\"],\n    violations: [\"b.content = X で代入\", \"head() の戻り値を変数で持ち回す\"],\n    refs: [\"A3\", \"A4\"],\n  },\n  A7: {\n    id: \"A7\", name: \"LLM-First Information Density\",\n    summary: \"人間用の簡素化を捨て、LLM にとっての情報密度を最大化する。\",\n    why: \"情報量(展開 ✓)・構造(単一抽象 ✓)・関係(refs 明示 ✓)・履歴(Block 内蔵 ✓)・区切り(言語構文 ✓)の各軸で密度を上げる。\",\n    examples: [\"full inline expansion\", \"refs を明示的 edge として書く\", \"tags で意味を構造化\"],\n    violations: [\"『見やすさ』のための省略\", \"コメントで意図を別レイヤー化\"],\n    refs: [\"A0\"],\n  },\n  A8: {\n    id: \"A8\", name: \"Spec-First Versioning\",\n    summary: \"実装の前に必ず論理(v0:SPEC)を置け。論理なき実装は漂流の始まり。仕様変更時は『新仕様のみ』バージョンを挟む脱皮プロトコル。\",\n    why: \"Block.versions に SPEC version を埋め込めば、論理の変遷が版数構造として読み取れる。同一履歴に spec / impl が交互に積まれ、いつでも『最新の正解』へ帰還可能。\",\n    examples: [\"v0: コメントだけ + // @tags: SPEC\", \"v1: 実装\", \"v2: 新 SPEC 挟み込み\", \"v3: 新実装\"],\n    violations: [\"実装直書き(SPEC version 無し)\", \"仕様変更を impl 同士の連続 commit で済ませる\"],\n    refs: [\"A4\", \"A6\", \"Bible§4.1.1\"],\n    enforcementNote: \"規律は validate 関数で守らない。`#SPEC#` tag の存在/不在 + prevHash chain 構造そのものが enforcement(§4.1.1)。\",\n  },\n  A9: {\n    id: \"A9\", name: \"Crystallization Compliance\",\n    summary: \"Block.content は crystallize 可能(JS → Go transpile → native 化)でなければならない。crystallize 不能なコードは Block でなく Adapter として扱う。\",\n    why: \"crystallize 失敗 = 動的 dispatch / eval / Proxy / prototype trick 等の隠匿パターン使用 = 4 視点(transpile / JIT / AI 推論 / Bible)全てから『正しくない』と判定されるコード。同じパターンが 4 視点で同時に問題を起こすのは偶然でなく、『明示的・静的・展開された』という単一の質が v2 の正解だから。\",\n    examples: [\n      \"crystallize OK: 純粋関数 / class + methods / immutable Map/Set 操作 / template literal\",\n      \"crystallize NG: eval / new Function / Object.prototype 改変 / Proxy / Reflect.construct / with 文\",\n    ],\n    violations: [\n      \"Block.content に eval / new Function を使う\",\n      \"prototype を runtime で改変\",\n      \"Proxy で動的 property 介入\",\n      \"with 文で scope を曖昧に\",\n    ],\n    refs: [\"A0\",\"A5\",\"A6\",\"§3\",\"Vocabulary.crystallize\"],\n    enforcementNote:\n      \"crystallize tool 自体が Bible-compliance compiler。build 失敗 = Bible 違反、別途 lint 不要(§4.1.1 の極致)。\" +\n      \"2 階層アーキテクチャ: Block(pure logic、crystallize 必須) vs Adapter(platform I/O、crystallize 不問)で分離。\",\n  },\n  A10: {\n    id: \"A10\", name: \"Single Coordinate Domain\",\n    summary:\n      \"**inter-Block / scene-level** の state / 入力 / UI / render input は world coord で表現する。\" +\n      \"**intra-Block(asset.js 内部の mesh.vertices / bone offset / 内部 anchor 等)は local coord OK** — 境界は `asset.transform`(local → world 変換器)。\" +\n      \"screen coord は render output と input adapter 境界でのみ存在し、Block 状態に侵入させない。OS resource(text input / file picker / permission / network)は modal dialog 経由で値返却し、world と coord 共存させない。\",\n    why:\n      \"voxel editor 3 試行(2026-05-03)が失敗した根本原因は、CSS 3D の parent-relative transform が world-coord 統一と原理的に喧嘩したこと。\" +\n      \"world / model / screen / canvas pixel / DOM event の coord が混在すると、Block 間の意味論が coord 系ごとに分裂し、A0(認知非対称性)・A1(ローカリティ極大)・A5(All-as-Block)が同時に破れる。\" +\n      \"world coord 統一を axiom として強制すると、CSS 3D / DOM transform / 画面座標 UI 等の選択肢が構造的に弾かれ、WebGL / three.js / WebGPU 系の scene graph 中心実装に自動収束する。\" +\n      \"ただし intra-Block(asset.js 内部)は local coord を許す — そうしないと頂点 / bone / 内部 anchor を世界原点固定でしか書けなくなり、A5(All-as-Block: 各 Block は内部に閉じた coord 空間を持つ)が破れる。\" +\n      \"screen coord は render output(world → screen)と入力 adapter(screen → world ray)の **境界変換**でのみ存在する。OS resource は modal dialog で「world から外に出る → 値を持って戻る」形に統一し、coord の常時共存を排除する。\",\n    boundaries: {\n      \"inter-Block / scene\": \"world coord 必須(asset.transform.position, refs target との位置関係, 入力 ray hit, HUD ortho world coord)\",\n      \"intra-Block / asset.js\": \"local coord OK(mesh.vertices, bones, 内部 pivot, 内部 anim、すべて asset 原点基準)\",\n      \"asset.transform\": \"境界変換器(local → world)、ここで初めて world coord に乗る\",\n      \"screen\": \"render output と input adapter の boundary でのみ存在(Block 内部 / Block 間 ともに不可侵)\",\n      \"OS resource\": \"modal dialog で値返却(text input / file / permission / network)、world と並走しない\",\n    },\n    examples: [\n      \"OK(intra): asset.js の mesh.vertices = [[0,1,0],[1,0,0],...] (asset 原点基準 local)\",\n      \"OK(intra): asset.js の bones = [{name:'head', offset:[0,1.6,0]}] (asset 内部 local)\",\n      \"OK(inter): export const transform = { position:[5,0,0], rotation:[0,Math.PI,0], scale:1 } (world)\",\n      \"OK(inter): 他 asset と共有する位置は state.lastWorldPos に world coord で持つ\",\n      \"OK: HUD は camera-following ortho camera が見る world 領域(右上 HP バー = ortho world (0.95, 0.95))\",\n      \"OK: マウス入力 → ray cast → world hit → Block state へ渡す\",\n      \"OK: text input が必要な場面は modal dialog → string 返却 → world に戻る\",\n      \"OK: 画面端の DOM sidebar / panel(3D scene と構造的に分離、native form 要素 / a11y / IME 利点)\",\n      \"OK: <input type='color'> / <button> / <input type='range'> 等の native UI 要素(sidebar 内)\",\n      \"NG: CSS 3D で transform を parent-relative に書く(world-coord 統一不能)\",\n      \"NG: screen pixel 座標を Block state に持ち込む(asset 内 / 間 共に不可)\",\n      \"NG: world coord を screen に project して DOM の位置を毎 frame 更新する(world tracking overlay)\",\n      \"NG: 他 asset 参照を local coord で書く(world coord 必須)\",\n    ],\n    violations: [\n      \"inter-Block 通信(他 asset 参照 / refs / event payload)に local coord を使う\",\n      \"Block state / event payload に screen / canvas / pixel coord を持つ\",\n      \"CSS 3D / DOM transform を render path に使う(parent-relative で world 統一不能)\",\n      \"input handler が ray cast 経由せず screen coord で直接 Block を変える\",\n      \"HUD を world geometry でなく独立 DOM overlay として書く(world と coord 系が常時並走)\",\n    ],\n    refs: [\"A0\",\"A1\",\"A5\",\"A11\",\"Vocabulary.crystallize\",\"Vocabulary.world-coord\",\"Vocabulary.prefab\",\"memo:2026-05-04_voxel-failure\"],\n    enforcementNote:\n      \"敗因が voxel 3 試行で明示された後の正典化 — 3D / 2D / game / tool すべてに共通する coord 戦略。\" +\n      \"実装 engine は world-coord scene graph を持つもの(WebGL / three.js / WebGPU)に強制収束、CSS 3D は永久封印。\" +\n      \"Block prefab(asset js module)は world transform + state + 畳込み遷移関数の triple で表現される — transform が境界、内部は local が自然。\" +\n      \"A11(Domain-Tagged Coordinates)が runtime nominal typing でこれを構造強制する。\",\n  },\n  A11: {\n    id: \"A11\", name: \"Domain-Tagged Values\",\n    summary:\n      \"すべての **REAL な値**(Block の state / event payload / refs payload / Block 間通信値)は、\" +\n      \"**型/単位/domain 接頭辞付き string** で表現する: `\\\"world:5,0,2\\\"` / `\\\"usd:9.99\\\"` / `\\\"time:1234567890\\\"` / \" +\n      \"`\\\"hash:deadbeef\\\"` / `\\\"id:user-42\\\"` / `\\\"kg:0.5\\\"`。\" +\n      \"型情報を **LLM が読む値そのものの中に** 埋め込み、推論時の型混同を構造的に消す。\",\n    why:\n      \"Physics.LLMTyping(LLM-First Typing 法則)の axiom 化。\" +\n      \"JS は動的型、人間は変数名(`worldPos`, `usdAmount`)で型を補完するが、LLM は context window 外でこの慣習を再構築できない。\" +\n      \"命名・コメント・schema 抜きで **値だけ見て型が確定する** 形にすると、LLM 推論 step が 1 つ減る = mistake 確率が線形に下がる。\" +\n      \"**crystallize の双対**: \" +\n      \"crystallize は JS Block を Go の静的型に compile する(machine の型に翻訳)。\" +\n      \"tagged value は値を LLM の視野に compile する(LLM の型に翻訳)。\" +\n      \"両方とも『型を必要とする機械が見る場所に型を埋める』操作。\" +\n      \"Bible §4.1.1『規律 = 構造』の極致 — validate 関数を書かず、データ形そのものが enforcer になる。\" +\n      \"voxel 失敗(2026-05-03)で coord 取り違えが特定された結果から発見、coord に閉じない一般原則として正典化。\",\n    scope: {\n      \"REAL(tag 必須)\": [\n        \"Block state の field(永続化される、inter-Block 通信される)\",\n        \"event payload(dispatch / refs / message)\",\n        \"Graph 上の値(refs payload、children payload)\",\n        \"Block 間で渡される全ての値\",\n      ],\n      \"scratch(tag 不要)\": [\n        \"関数内ローカル変数(boundary で parse 済み)\",\n        \"tick 内一時計算(ホットパス保護のため)\",\n        \"engine API 内部値(Three.js Vector3 等、boundary 越え後)\",\n      ],\n    },\n    domains: {\n      // ─── coord 系(A10 ↔ A11 の交点) ───\n      world:  \"scene graph / Block 間 / 入力 ray hit / refs payload で使う絶対座標。例: \\\"world:5,0,2\\\"\",\n      local:  \"asset.js 内部の mesh.vertices / bones / 内部 anchor で使う asset 原点基準。例: \\\"local:0,1,0\\\"\",\n      screen: \"render output / input adapter 境界でのみ存在する pixel 座標。Block state には侵入させない(Taboo 14)。例: \\\"screen:300,200\\\"\",\n      ortho:  \"HUD ortho camera が見る world 領域。NDC-like (-1..1) range。例: \\\"ortho:0.7,0.85\\\"\",\n      // ─── 通貨 / 単位 ───\n      usd:    \"米ドル金額。例: \\\"usd:9.99\\\"\",\n      jpy:    \"日本円金額。例: \\\"jpy:980\\\"\",\n      kg:     \"質量(キログラム)。例: \\\"kg:0.5\\\"\",\n      \"duration-s\": \"継続時間(秒)。例: \\\"duration-s:5.5\\\"\",\n      \"duration-ms\": \"継続時間(ミリ秒)。例: \\\"duration-ms:1500\\\"\",\n      // ─── 時刻 / バージョン / 識別子 ───\n      time:    \"Unix timestamp(秒)。例: \\\"time:1234567890\\\"\",\n      \"time-ms\": \"Unix timestamp(ミリ秒)。例: \\\"time-ms:1234567890123\\\"\",\n      iso:     \"ISO 8601 datetime。例: \\\"iso:2026-05-04T17:00:00+09:00\\\"\",\n      version: \"semver / 内部 version。例: \\\"version:2.10\\\"\",\n      hash:    \"hash 値(hex)。例: \\\"hash:deadbeef\\\"\",\n      id:      \"識別子(namespaced)。例: \\\"id:user-42\\\" / \\\"id:block:cube\\\"\",\n      // ─── 拡張 ───\n      \"{domain}\": \"新規 domain は自由に追加(英小文字 + ハイフン、`:` で本体と区切る)\",\n    },\n    format: {\n      grammar: \"<domain>:<body>(domain は ASCII 英小文字 + ハイフン + 数字、body は domain ごとに自由)\",\n      coord_body: \"x,y[,z] (number、JS Number.toString 互換、負数 / 小数 / 指数表記 OK)\",\n      scalar_body: \"single number / string / structured (domain ごとに parser を持つ)\",\n      examples: [\"world:5,0,2\", \"usd:9.99\", \"time:1234567890\", \"id:user-42\", \"hash:deadbeef\", \"iso:2026-05-04T17:00:00+09:00\"],\n    },\n    api: {\n      // 座標系(coord.js):\n      coord_builders: [\"w(x,y,z) / l(x,y,z) / s(x,y) / o(x,y) → 'domain:x,y[,z]' string\"],\n      coord_parsers:  [\"parseCoord(str) → {domain, values}\", \"requireDomain(str, expected) → number[](不一致で throw)\"],\n      // 一般値(将来 typed.js 等で提供):\n      builders:       [\"tagged(domain, body) → 'domain:body'\", \"usd(amount) / jpy(amount) / kg(mass)\"],\n      parsers:        [\"parseTagged(str) → {domain, body}\", \"requireTag(str, expected) → body(不一致で throw)\"],\n    },\n    examples: [\n      \"OK: state = { hp: 100, mood: 'neutral', lastSeen: 'time:1234567890' }\",\n      \"OK: state.amount = 'usd:9.99'(scratch 計算は const a = 9.99、boundary で format)\",\n      \"OK: refs: [{ kind: 'paid-by', target: 'id:user-42', amount: 'usd:9.99' }]\",\n      \"NG: state.lastSeen = 1234567890(裸の数値、unix 秒?ミリ秒?判別不能)\",\n      \"NG: state.amount = 9.99(USD?JPY?判別不能、LLM が間違える)\",\n      \"NG: refs に `target: 'user-42'`(prefix 無し → name か id か判別不能)\",\n    ],\n    violations: [\n      \"REAL 値(state / event / refs / Block 間)に裸の数値 / string を持つ(domain 不明)\",\n      \"boundary を経由せず tagged string を直接 engine API に投入\",\n      \"domain 不一致を runtime check 無しで mix する\",\n      \"命名規則・コメントだけで型を表す(値が self-describing でない)\",\n    ],\n    refs: [\"A0\",\"A7\",\"A9\",\"A10\",\"Physics.LLMTyping\",\"Vocabulary.world-coord\",\"Vocabulary.domain-tag\",\"Vocabulary.prefab\"],\n    enforcementNote:\n      \"A10 が「混ぜるな」の宣言、A11 は『**混ぜれない**』の構造実装、すべての REAL 値に拡張。\" +\n      \"Physics.LLMTyping『型は LLM が見る場所(値そのもの)に置け』を data layer に降ろした実装。\" +\n      \"**LLM 認知コスト最小** + **mistake 線形低下** + **crystallize 整合** + **A0/A7 同時強化** を一手で達成。\" +\n      \"段階的移行可能 — REAL 値だけ tagged 化、scratch / hot path は裸でも可、boundary で format/parse。\",\n  },\n  A12: {\n    id: \"A12\", name: \"Universal Literalism (万物文字化)\",\n    summary: \"すべての REAL な状態(Block.versions に残るもの)は、意味のある「文字列リテラル」として永続化せよ。生の数値、ビットフラグ、ポインタ、匿名オブジェクトの永続化を禁止する。\",\n    why: \"コンピュータの効率のための『濁り(数値・バイナリ)』を排し、AI のための『透明な論理(文字)』へ回帰する。すべてが文字であれば、AI は世界の全状態を『誤字脱字』レベルの精度で検証・修正できる。\",\n    examples: [\"hp:100 → \\\"hp:full\\\" または \\\"hp:100/100\\\"\", \"Vector(1,0,0) → \\\"dir:east\\\" または \\\"vec:1,0,0\\\"\"],\n    violations: [\"Block state に生の数値を保存\", \"不透明な連番 ID の使用\", \"AI の Attention を迷わせる匿名データ構造\"],\n    refs: [\"A0\", \"A7\", \"A10\", \"A11\"],\n  },\n  A13: {\n    id: \"A13\", name: \"Shadow Projection (影への投影と還元)\",\n    summary: \"演算が必要な時のみ、文字(REAL)を数値(SHADOW)へ投影(LIFT)し、演算終了直後に再び文字(REAL)へ還元(SETTLE)せよ。数値状態を 1 フレーム(または 1 関数)を超えて保持することを禁止する。\",\n    why: \"数値は演算(力)には向くが、記憶(真実)には向かない。計算のたびに文字へ還元し続けることで、AI による常時監視と、完全な再現性(Time Travel)を保証する。複式プログラミングの核心。\",\n    examples: [\"文字 \\\"world:9,9,9\\\" → 数値 [9,9,9] へ LIFT → 演算 [10,9,9] → \\\"world:10,9,9\\\" へ SETTLE して還元\"],\n    violations: [\"数値状態の永続化(1 フレーム以上の保持)\", \"計算用変数の外部リーク\", \"還元ステップの省略によるブラックボックス化\"],\n    refs: [\"A3\", \"A12\"],\n  },\n  A14: {\n    id: \"A14\", name: \"Top-Down Verification (トップダウン検証)\",\n    summary: \"AI時代のテストは、必ず『全体から部分へ』向かって書け。E2Eテストで文脈の重力場を形成し、その実行カバレッジの隙間を単体テストで自律的に埋めよ。\",\n    why: \"ボトムアップ型のTDD（小さな単体テストを書き、それに合わせて実装を積む）は、AIに『完成形の全体像が見えない状態での推測』を強要し、認知を迷走させる（A0・A7違反）。逆に、最初にE2Eを書くことで、AIに対して『最終的に何ができれば正解か』という完全なコンテキストを与えられる。E2Eが通る＝論理の大枠が完成した状態であり、そこからであれば、AIは『E2Eで通らなかった分岐』を特定し、それを埋める単体テストを迷いなく自動生成できる。\",\n    examples: [\"E2Eを書いてから実装を完了させる → V8のカバレッジを計測 → 未到達のBlockや分岐を狙う単体テストを生成\"],\n    violations: [\"全体像（E2E）がない状態での過剰な単体テスト駆動\", \"カバレッジを無視した盲目的なテスト追加\"],\n    refs: [\"A0\", \"A7\"],\n  },\n};\n\n// ============================================================\n// Internal helpers (Taboo check の文字列マッチ脆性を回避)\n// ============================================================\n// import / require / from \"...\" / package.json の dependency 記述から\n// quoted literal を抽出し、いずれかが pattern に match するか判定。\n// これにより `.parcel-cache` のような関係ない文字列が import 違反扱いされない。\nfunction _importsAny(content, pattern) {\n  const literals = [];\n  const importRe = /(?:^|\\s)(?:import\\b[\\s\\S]*?from\\s*|require\\s*\\(\\s*|import\\s*\\(\\s*)['\"]([^'\"]+)['\"]/g;\n  let m;\n  while ((m = importRe.exec(content)) !== null) literals.push(m[1]);\n  // package.json 形式の \"deps\": { \"name\": \"version\" } の name 部分も拾う\n  const depsRe = /\"(?:dependencies|devDependencies|peerDependencies)\"\\s*:\\s*\\{([\\s\\S]*?)\\}/g;\n  while ((m = depsRe.exec(content)) !== null) {\n    const block = m[1];\n    let dm;\n    const nameRe = /\"([^\"]+)\"\\s*:\\s*\"[^\"]+\"/g;\n    while ((dm = nameRe.exec(block)) !== null) literals.push(dm[1]);\n  }\n  return literals.some(l => pattern.test(l));\n}\n\n// ============================================================\n// 第 3 層: Block schema(全 v2 ツールが共有する基本型)\n// ============================================================\nexport const BlockSchema = {\n  Block: {\n    description: \"id / type / meta / versions(append-only)\",\n    fields: {\n      id: \"string — globally unique identifier\",\n      type: \"string — 'function' | 'class' | 'module' | 'constraint' | 'observation' | ...\",\n      meta: \"object — type 固有の補助情報\",\n      versions: \"Version[] — append-only、commit() 経由のみ伸ばせる(REAL)\",\n    },\n  },\n  Version: {\n    description: \"Block.versions の要素。1 つの commit を表す不変 record。\",\n    fields: {\n      timestamp: \"number — Date.now()\",\n      prevHash:  \"string|null — 前 version の hash(連鎖)\",\n      content:   \"any — その時点の値\",\n      refs:      \"{kind, target}[] — 他 Block への型付きエッジ\",\n      children:  \"string[] — 順序付き Block id list(構成的所有)\",\n      tags:      \"string[] — 検索 / フィルタ用\",\n      meta:      \"object — commit 自体のメタデータ\",\n      hash:      \"string — 上記全フィールド(自身を除く)の FNV-1a 8 文字\",\n    },\n  },\n};\n\n// 派生 Block 型(BIBLE.md §6/§7/§8 + 仮想重厚関数)\nexport const BlockTypes = {\n  function: { type: 'function',   purpose: \"コード単位、parseJS が JS の関数宣言から自動抽出\" },\n  class:    { type: 'class',      purpose: \"クラス宣言\" },\n  module:   { type: 'module',     purpose: \"ファイル単位\" },\n\n  constraint: {\n    type: 'constraint',\n    purpose: \"公理 A2 の Constraint Folding を第一級 Block として永続化\",\n    schema: \"{ axes:string[], values:Record<axis, any[]>, derive:(combo)=>any }\",\n    api: \"evalConstraint(constraintBlock, filter?) → 候補の組み合わせ群\",\n    refSection: \"BIBLE.md §6\",\n  },\n\n  observation: {\n    type: 'observation',\n    purpose: \"AI-Eyes の観測スナップショットを Block として保存(canvas frame, state JSON, draw_ops 等)\",\n    schema: \"content: { capturedAt, viewport, canvases?, draw_ops?, state }\",\n    refs: \"[{ kind:'observes', target: observedId }]\",\n    refSection: \"BIBLE.md §7\",\n  },\n\n  twin: {\n    type: 'function',   // type は function、tags で識別\n    purpose: \"効率層(GPU 等)と並走する検証層(CPU twin)を refs で結ぶ複式数学\",\n    refs: \"[{ kind:'twin-of', target: 効率層 Block }]\",\n    tags: [\"twin\", \"verify\"],\n    refSection: \"BIBLE.md §8\",\n  },\n\n  virtualHeavy: {\n    purpose: \"複数 Block を 1 つの content に展開して LLM に渡し、編集後に逆配分(virtual-apply)で再分散する\",\n    api: [\"heavy <graph> <root> [--depth=N]\", \"virtual-apply <graph> <root> <patch-file>\"],\n    refSection: \"BIBLE.md §6 (仮想重厚関数), MANUAL §4.5〜4.9\",\n  },\n};\n\n// ============================================================\n// 第 3.5 層: Vocabulary(用語の重力場)\n//   人間優先 vocabulary は v2 思想と衝突する。「refactor」「DRY」「clean code」\n//   等の語は暗黙に「人間に読みやすく整える」方向のベクトルを持つ — これは\n//   公理 A0 違反方向。\n//   用語は思考のレールであって、レールを引き直さないと公理の方向に走れない。\n//   v2 では旧用語を使わず、置換用語(clarify / densify / align / expose / unfold)\n//   を canonical として使う。\n// ============================================================\nexport const Vocabulary = {\n  use: {\n    clarify: {\n      meaning: \"隠匿を晴らす、不明瞭を消す\",\n      replaces: \"refactor\",\n      etymology: \"ラテン語 clarus(明るい・透明)。「透明にする」が原義。\",\n      operation_vector: \"隠匿 → 明示\",\n      axiom_ref: [\"A0\",\"A7\"],\n    },\n    densify: {\n      meaning: \"情報密度を上げる(展開・明示で)\",\n      replaces: \"DRY 化\",\n      etymology: \"ラテン語 densus(密)。「密度を上げる」が原義。\",\n      operation_vector: \"希薄 → 濃密\",\n      axiom_ref: [\"A1\",\"A7\"],\n    },\n    align: {\n      meaning: \"Bible 公理に整合させる\",\n      replaces: \"clean code\",\n      etymology: \"ラテン語 ad-+ linea(線に沿わせる)。「軸に揃える」が原義。\",\n      operation_vector: \"ズレ → 整合\",\n      axiom_ref: [\"全公理\"],\n    },\n    expose: {\n      meaning: \"隠れているものを表面化\",\n      replaces: \"abstraction\",\n      etymology: \"ラテン語 ex-+ ponere(外に置く)。「外に出して見せる」が原義。\",\n      operation_vector: \"内部 → 表面\",\n      axiom_ref: [\"A0\",\"A1\"],\n    },\n    unfold: {\n      meaning: \"折りたたまれた抽象を広げる\",\n      replaces: \"simplify\",\n      etymology: \"古英語 un-+ fealdan(折りを開く)。「畳まれたものを広げる」が原義。\",\n      operation_vector: \"圧縮 → 展開\",\n      axiom_ref: [\"A0\",\"A7\"],\n    },\n    crystallize: {\n      meaning: \"論理を別言語の強力なインフラに引っ越しさせる(JS Block → Go transpile 等)\",\n      replaces: \"compile / port / migrate / rewrite\",\n      etymology: \"ラテン語 crystallum(澄んだ氷・透明な結晶構造)。「不定形が定形に固体化する」が原義。\",\n      operation_vector: \"動的・流動 → 静的・固体  (JS の動的性 → Go の static structure)\",\n      axiom_ref: [\"A3\",\"A5\",\"A6\",\"§3\"],\n      note: \"5 段フロー: REAL(JS) → TRANSCRIPTION(AI 翻訳) → SHADOW(Go source) → COMPILE(go build) → CRYSTAL(native binary)。AI が中間段の翻訳者。JIT が「泥道を走りながらアスファルト敷く」のに対し、結晶化は「隣に最高級高速道路を建設」する事前 AOT。\",\n    },\n    \"world-coord\": {\n      meaning: \"**inter-Block / scene-level** の state / 入力 / UI / render input が共通で住む唯一の coord 系。intra-Block(asset.js 内部)は local coord OK、境界は asset.transform。screen coord は境界変換でのみ存在。A11 で domain-tagged string として表現する(\\\"world:x,y,z\\\")。\",\n      replaces: \"model / view / screen / canvas / DOM coord の混在\",\n      etymology: \"world(世界)+ coord(座標)。3D scene graph で標準的な「scene 全体の絶対座標系」。\",\n      operation_vector: \"coord 分裂 → 単一 domain (inter-Block レベル)、intra は local 許容で実装可能性を保つ\",\n      axiom_ref: [\"A10\",\"A11\"],\n      note: \"WebGL / three.js / WebGPU の scene graph 中心実装に強制収束。CSS 3D / DOM transform は永久封印。HUD は ortho camera が見る world 領域として実装。\",\n    },\n    \"domain-tag\": {\n      meaning: \"REAL 値の domain / 型 / 単位接頭辞(\\\"world:\\\" / \\\"usd:\\\" / \\\"time:\\\" / \\\"id:\\\" / \\\"hash:\\\" 等)。runtime nominal typing で値の取り違えを構造的に防ぐ。\",\n      replaces: \"裸の数値 / 文字列で REAL 値を表現すること\",\n      etymology: \"domain(領域)+ tag(印)。型のない JS で nominal typing を string prefix で emulate する技法。値そのものに型を埋める LLM-First Typing の実装手段。\",\n      operation_vector: \"暗黙の型 → 値そのものに型が埋まる  (A0 認知非対称性 + A7 展開・明示 を同時に強化)\",\n      axiom_ref: [\"A11\",\"A10\",\"A0\",\"A7\",\"Physics.LLMTyping\"],\n      note: \"format は \\\"<domain>:<body>\\\"。coord 系は coord.js(w/l/s/o + requireDomain)、汎用は tagged/parseTagged/requireTag(typed.js を将来追加)。boundary で parse、それ以外はすべて tagged string で持ち回す。\",\n    },\n    \"tagged-value\": {\n      meaning: \"Domain-Tagged Value — 型 / 単位 / domain を値の中に prefix string で埋め込んだ self-describing な REAL 値。\",\n      replaces: \"命名規則やコメントで型を表現すること(LLM 視点で context window 外に弱い手法)\",\n      etymology: \"tag(印)+ value(値)。LLM-First Typing の実装。crystallize の双対(machine の型 vs LLM の型)。\",\n      operation_vector: \"型情報の場所: 命名規則 → 値そのもの  (LLM 推論 step 削減 = mistake 確率の線形低下)\",\n      axiom_ref: [\"A11\",\"Physics.LLMTyping\",\"A0\",\"A7\"],\n      note: \"REAL 値(state / event / refs / Block 間通信)は tagged 必須、scratch / hot path は裸で OK、boundary で format/parse。\",\n    },\n    \"LLM-typing\": {\n      meaning: \"LLM-First Typing — 型を LLM が読む場所(値そのもの)に埋め込む型システム。値が token として読まれる時点で型が確定するように設計する。\",\n      replaces: \"compile-time typing(人間が型を書きコンパイラが catch する従来手法)\",\n      etymology: \"LLM(Large Language Model)+ typing(型付け)。crystallize が machine type への compile なら、これは LLM type への compile。\",\n      operation_vector: \"型は人間 / コンパイラの世界 → 型は LLM の世界  (型の住む場所のパラダイム変化)\",\n      axiom_ref: [\"Physics.LLMTyping\",\"A11\",\"A0\",\"A7\",\"A9\"],\n      note: \"実装は tagged-value(domain prefix string)。crystallize と双対関係 — どちらも『型を必要とする機械が見る場所に型を埋める』。MYY 哲学『LLM が走るための道』の core 実装。\",\n    },\n    prefab: {\n      meaning: \"Block の game asset 形態 — world transform + state + 畳込み遷移関数の triple。内部(mesh.vertices, bones, 内部 anchor)は local coord、transform が local → world の境界変換器。\",\n      replaces: \"object / entity / GameObject(Unity 的概念の Block 化)\",\n      etymology: \"pre + fabricate(あらかじめ作る)。Unity の prefab(再利用可能な game object テンプレート)から借用、ai-desk Block 思想に整合する形に再定義。\",\n      operation_vector: \"汎用 Block → 3D / 2D asset 特化  (A5 All-as-Block を game domain で具体化)\",\n      axiom_ref: [\"A5\",\"A10\"],\n      note: \"asset js module 1 個 = 1 prefab(`name.asset.js`)。export で公開、内部は local coord、外部に出す位置(transform.position, state の inter-Block 共有値)は world coord。遷移は pure function。\",\n    },\n  },\n  avoid: [\n    {\n      term: \"refactor\",\n      reason: \"「人間が読みやすくする」前提が公理 A0 違反方向。代わりに clarify / unfold / densify。\",\n      etymology: \"factor(分解する) + re-。原義「再分解する」 = 細かい単位に分け直す。\",\n      operation_vector: \"統合 → 分解  (= 隠匿方向、A1 違反)\",\n      origin_note: \"Martin Fowler 'Refactoring' (1999) が業界に広めた語。当時の前提『人間が読みやすく』が AI 時代に通用しなくなった、語自体が時代遅れ。\",\n    },\n    {\n      term: \"DRY\",\n      reason: \"重複削除は隠れた依存を生む。代わりに densify(展開で密度を上げる)。\",\n      etymology: \"Don't Repeat Yourself(Hunt & Thomas, The Pragmatic Programmer 1999)。\",\n      operation_vector: \"重複 → 共有関数化  (= 隠れた依存生成、A1 違反)\",\n    },\n    {\n      term: \"clean code\",\n      reason: \"「綺麗」の暗黙基準が人間優先。代わりに align(公理整合)。\",\n      etymology: \"「掃除された / 汚れがない」状態を意味する英単語、人間の美的判断。\",\n      operation_vector: \"汚い → 美しい  (= 美的基準は LLM に対し無効)\",\n    },\n    {\n      term: \"abstraction\",\n      reason: \"層を増やす操作は隠匿。代わりに expose(表面化)。\",\n      etymology: \"ラテン語 abs-+ trahere(引き離す)。「実体から引き離す」 = 詳細を捨てる操作。\",\n      operation_vector: \"実体 → 概念  (= 詳細喪失、A0 違反)\",\n    },\n    {\n      term: \"simplify\",\n      reason: \"情報削減は LLM にとって毒。代わりに unfold(展開)。\",\n      etymology: \"ラテン語 simplex(単一)。「単一化する = 多様性を捨てる」。\",\n      operation_vector: \"多様 → 単純  (= 情報削減、A7 違反)\",\n    },\n    {\n      term: \"encapsulate\",\n      reason: \"閉じ込めは隠匿の同義語。代わりに expose / unfold。\",\n      etymology: \"ラテン語 capsula(小さな箱)。「小さな箱に閉じ込める」が原義。\",\n      operation_vector: \"見える → 閉じる  (= 隠匿そのもの)\",\n    },\n    {\n      term: \"pretty-print\",\n      reason: \"「美しさ」の人間基準は無視、機械可読性のみ評価。\",\n      etymology: \"「綺麗に印字する」=人間の視覚に最適化する装飾操作。\",\n      operation_vector: \"機械形 → 人間形  (= LLM にとって価値ゼロ)\",\n    },\n  ],\n  principle:\n    \"用語は思考のレール。レールを引き直さないと公理の方向に走れない。\" +\n    \"code review / commit メッセージ / discussion で旧用語を使うと、\" +\n    \"意識が自動的に隠匿方向に引っ張られる。新用語を使うと展開方向に引っ張られる。\",\n  etymological_insight:\n    \"refactor / abstraction / encapsulate / simplify は **語源レベルで分解・隠匿の操作を意味している**。\" +\n    \"慣習で広まったから不適切なのでなく、**最初から AI 時代に逆向きの語**だった。\" +\n    \"Martin Fowler 'Refactoring'(1999)以降の vocabulary は、人間の作業記憶 7±2 に最適化された時代の遺物。\" +\n    \"AI に対しては **clarify(透明化)/ unfold(展開)/ densify(濃密化)/ expose(表面化)/ align(整合)** が \" +\n    \"操作の方向ベクトルとして正しい。\",\n  note:\n    \"完全置換でなく、旧用語を見たら新用語に翻訳する習慣を育てる。\" +\n    \"他者(同僚 / 客 / コミュニティ)が refactor と言う時、それを clarify / unfold のどちらかとして解釈し直す。\",\n};\n\nfunction _diagnosticContent(content, path) {\n  if (typeof content !== \"string\") return \"\";\n  if (typeof path !== \"string\" || !path.endsWith(\".yume.js\")) return content;\n  const match = content.match(/(?:^|\\r?\\n)\\/\\/ === HEAD ===\\r?\\n([\\s\\S]*?)(?:\\r?\\n)\\/\\/ === \\/HEAD ===(?:\\r?\\n|$)/);\n  return match ? match[1] : content;\n}\n\nfunction _extractBlockExpr(source) {\n  const match = source.match(/export\\s+const\\s+__block\\s*=\\s*\\{/);\n  if (!match) return null;\n\n  const startIndex = match.index + match[0].length - 1;\n  let depth = 0;\n  let stringChar = \"\";\n  let escape = false;\n  let lineComment = false;\n  let blockComment = false;\n\n  for (let i = startIndex; i < source.length; i++) {\n    const c = source[i];\n    const next = source[i + 1];\n\n    if (escape) { escape = false; continue; }\n    if (stringChar) {\n      if (c === \"\\\\\") { escape = true; continue; }\n      if (c === stringChar) stringChar = \"\";\n      continue;\n    }\n    if (lineComment) {\n      if (c === \"\\n\") lineComment = false;\n      continue;\n    }\n    if (blockComment) {\n      if (c === \"*\" && next === \"/\") { blockComment = false; i++; }\n      continue;\n    }\n\n    if (c === \"/\" && next === \"/\") { lineComment = true; i++; continue; }\n    if (c === \"/\" && next === \"*\") { blockComment = true; i++; continue; }\n    if (c === \"\\\"\" || c === \"'\" || c === \"`\") { stringChar = c; continue; }\n    if (c === \"{\") depth++;\n    else if (c === \"}\") {\n      depth--;\n      if (depth === 0) return source.slice(startIndex, i + 1);\n    }\n  }\n  return null;\n}\n\nfunction _parseBlockForAudit(content) {\n  if (typeof content !== \"string\") return null;\n  const expr = _extractBlockExpr(content);\n  if (!expr) return null;\n  try { return JSON.parse(expr); }\n  catch { return null; }\n}\n\nfunction _versionAuditId(version, index) {\n  if (Number.isInteger(version?.v)) return `v${version.v}`;\n  if (typeof version?.hash === \"string\") return version.hash.slice(0, 12);\n  return `index:${index}`;\n}\n\nfunction _codeOnly(content) {\n  const out = [];\n  let mode = \"code\";\n  let quote = \"\";\n  let escape = false;\n  let regexClass = false;\n  for (let i = 0; i < content.length; i++) {\n    const c = content[i];\n    const next = content[i + 1];\n\n    if (mode === \"line\") {\n      out.push(c === \"\\n\" ? \"\\n\" : \" \");\n      if (c === \"\\n\") mode = \"code\";\n      continue;\n    }\n    if (mode === \"block\") {\n      out.push(c === \"\\n\" ? \"\\n\" : \" \");\n      if (c === \"*\" && next === \"/\") { i++; out.push(\" \"); mode = \"code\"; }\n      continue;\n    }\n    if (mode === \"string\") {\n      out.push(c === \"\\n\" ? \"\\n\" : \" \");\n      if (escape) { escape = false; continue; }\n      if (c === \"\\\\\") { escape = true; continue; }\n      if (c === quote) mode = \"code\";\n      continue;\n    }\n    if (mode === \"regex\") {\n      out.push(c === \"\\n\" ? \"\\n\" : \" \");\n      if (escape) { escape = false; continue; }\n      if (c === \"\\\\\") { escape = true; continue; }\n      if (c === \"[\") { regexClass = true; continue; }\n      if (c === \"]\") { regexClass = false; continue; }\n      if (c === \"\\n\" || c === \"\\r\") { mode = \"code\"; regexClass = false; continue; }\n      if (c === \"/\" && !regexClass) mode = \"code\";\n      continue;\n    }\n\n    if (c === \"/\" && next === \"/\") { out.push(\" \"); i++; out.push(\" \"); mode = \"line\"; continue; }\n    if (c === \"/\" && next === \"*\") { out.push(\" \"); i++; out.push(\" \"); mode = \"block\"; continue; }\n    if (c === \"\\\"\" || c === \"'\" || c === \"`\") { out.push(\" \"); quote = c; mode = \"string\"; escape = false; continue; }\n    if (c === \"/\" && _looksLikeRegexStart(content, i)) { out.push(\" \"); mode = \"regex\"; escape = false; regexClass = false; continue; }\n    out.push(c);\n  }\n  return out.join(\"\");\n}\n\nfunction _looksLikeRegexStart(content, slashIndex) {\n  const next = content[slashIndex + 1];\n  if (next === \"/\" || next === \"*\" || next === undefined) return false;\n  let i = slashIndex - 1;\n  while (i >= 0 && /\\s/.test(content[i])) i--;\n  if (i < 0) return true;\n  const prev = content[i];\n  if (\"([{=,:;!~?&|+-*%^<>\".includes(prev)) return true;\n  const prefix = content.slice(0, i + 1);\n  const word = prefix.match(/([A-Za-z_$][\\w$]*)$/)?.[1];\n  return [\"return\", \"throw\", \"case\", \"delete\", \"typeof\", \"void\", \"yield\", \"await\"].includes(word);\n}\n\nfunction _hasRuntimeCodeGeneration(content) {\n  return /\\beval\\s*\\(|\\bnew\\s+Function\\s*\\(/.test(_codeOnly(content));\n}\n\n// ============================================================\n// 第 4 層: 守護聖域(Sacred Taboos)\n//   これは declarative な禁忌の表明であり、validator ではない(公理 A8 §4.1.1)。\n//   check 関数は「構造的に何が違反か」の概念表現として提供。\n//   実際の enforcement は Block 構造(parseJS / tags / refs)の存在/不在で読む。\n// ============================================================\nexport const Taboos = [\n  {\n    id: 1, name: \"No TypeScript\",\n    rule: \"TS / TSX を導入しない。型情報による情報の分離(隠匿)を防ぐため。\",\n    declarative: true,\n    check: (content, path) => !/\\.tsx?$/.test(path) && !/\\btsconfig\\.json$/.test(path),\n  },\n  {\n    id: 2, name: \"No Build / Transpile\",\n    rule: \"build step を作らない。ソース = 実行ファイルの原則を守る。\",\n    declarative: true,\n    // import / require / package.json の依存記述だけを検査(ファイル内の literal 文字列に誤反応しないため)\n    check: (content) => !_importsAny(content, /(webpack|babel|rollup|esbuild|vite|parcel|swc|tsc)/),\n  },\n  {\n    id: 3, name: \"No Frameworks\",\n    rule: \"React / Vue / Angular / Next 等の framework を入れない。暗黙の規約は隠匿の温床。\",\n    declarative: true,\n    check: (content) => !_importsAny(content, /(^react$|^react\\/|^react-dom|^vue$|^@vue\\/|^@angular\\/|^svelte$|^next$|^next\\/)/i),\n  },\n  {\n    id: 4, name: \"Zero-Dependency\",\n    rule: \"Web 標準 + Node 標準のみ。Eternal Compatibility の確保。\",\n    declarative: true,\n    note: \"node:fs / node:path 等の node 標準は許可。CommonJS の require は局所許可(3dplus 等)。3D engine は **three.js のみ局所許可**(A10 で WebGL/three.js/WebGPU に強制収束済み、revision pin で Eternal Compat 確保)。\",\n  },\n  {\n    id: 5, name: \"No direct mutation of Block.versions\",\n    rule: \"Block.versions を直接書き換えない。必ず commit() 経由(append-only)。\",\n    declarative: true,\n  },\n  {\n    id: 6, name: \"SHADOW 変数化禁止\",\n    rule: \"Block.content / refs / tags(SHADOW)を変数で持ち回さない。getter から都度読む。\",\n    declarative: true,\n    refsAxiom: \"A3, A6\",\n  },\n  {\n    id: 7, name: \"No human-readability optimization\",\n    rule: \"「人間にとっての見やすさ」で判断しない。LLM の情報密度で判断する。\",\n    declarative: true,\n    refsAxiom: \"A0, A7\",\n  },\n  // ─── Crystallization-blocking patterns(公理 A9 系列、Block 内では禁忌)───\n  {\n    id: 8, name: \"No eval / new Function\",\n    rule: \"Block.content で eval(...) や new Function(...) を使わない。runtime コード生成は crystallize 不能 + AI 静的推論不能 + 公理 A0 違反。\",\n    declarative: true,\n    check: (content) => !_hasRuntimeCodeGeneration(content),\n    refsAxiom: \"A9\",\n  },\n  {\n    id: 9, name: \"No prototype mutation\",\n    rule: \"Object.prototype.X = ... / __proto__ 改変を Block.content でやらない。global state 汚染 + crystallize 不能。\",\n    declarative: true,\n    check: (content) => !/(\\.prototype\\.[\\w$]+\\s*=|\\b__proto__\\b\\s*=)/.test(_codeOnly(content)),\n    refsAxiom: \"A9\",\n  },\n  {\n    id: 10, name: \"No Proxy / Reflect.construct\",\n    rule: \"Proxy / Reflect.construct で動的 property 介入しない。Go の static 型システムに乗らない、crystallize 不能。\",\n    declarative: true,\n    check: (content) => !/\\b(new\\s+Proxy|Reflect\\.(construct|apply|get|set|has|deleteProperty|defineProperty))\\s*\\(/.test(_codeOnly(content)),\n    refsAxiom: \"A9\",\n  },\n  {\n    id: 11, name: \"No with statement\",\n    rule: \"with(obj){...} を使わない。scope 曖昧化、AI も Go も追跡不能。\",\n    declarative: true,\n    check: (content) => !/^\\s*with\\s*\\(/m.test(_codeOnly(content)),\n    refsAxiom: \"A9\",\n  },\n  {\n    id: 12, name: \"No arguments object\",\n    rule: \"function 内で arguments を参照しない。rest params (...args) で代替。arguments は dynamic semantics、crystallize 不能。\",\n    declarative: true,\n    check: (content) => !/\\barguments\\b\\s*[\\.\\[]/.test(_codeOnly(content)),\n    refsAxiom: \"A9\",\n  },\n  // ─── Single-coordinate-domain patterns(公理 A10 系列、3D / 2D / game / tool 共通)───\n  {\n    id: 13, name: \"No CSS 3D transform\",\n    rule: \"transform: translate3d / rotate3d / matrix3d / perspective を CSS / inline style で使わない。CSS transform は parent-relative で world-coord 統一不能、voxel 3 試行で実証済み(2026-05-03)。\",\n    declarative: true,\n    check: (content) => !/\\b(translate3d|rotate3d|matrix3d|perspective)\\s*\\(/.test(_codeOnly(content)) && !/transform-style\\s*:\\s*preserve-3d/.test(_codeOnly(content)),\n    refsAxiom: \"A10\",\n  },\n  {\n    id: 14, name: \"No screen-coord in Block state\",\n    rule: \"Block の state / event payload に screen / canvas pixel / clientX / clientY / pageX / pageY 等の screen-coord を持ち込まない。input adapter 境界で world ray に変換してから Block に渡す。\",\n    declarative: true,\n    check: (content) => !/\\b(clientX|clientY|pageX|pageY|screenX|screenY|offsetX|offsetY)\\b\\s*[:=]/.test(_codeOnly(content)),\n    refsAxiom: \"A10\",\n  },\n  {\n    id: 15, name: \"No world-tracking DOM overlay\",\n    rule:\n      \"**禁止**: world coord を screen に project して位置づけする DOM 要素(voxel に追従する label、3D 物体の上に float する tooltip、CSS transform で 3D を再現する pseudo-3D)。これは A10 の coord 統一を崩す。\" +\n      \"**許可**: 画面端の **sidebar / panel**(3D scene と構造的に分離)、native form 要素(`<input>` `<button>` `<select>` `<input type='color'>`)、modal dialog(OS resource boundary)、OffscreenCanvas + CanvasTexture(DOM tree 外、texture source)。\" +\n      \"判断基準: 「world coord を読んで DOM に位置を反映するか」 — する=禁止、しない=許可。\",\n    declarative: true,\n    refsAxiom: \"A10\",\n    note:\n      \"voxel 失敗(CSS 3D の parent-relative transform で coord 混在)起点で禁止された経緯あり、\" +\n      \"ただし全 DOM UI 排除は厳しすぎ。sidebar / panel / modal は a11y / IME / native form 要素の利点が大きく、\" +\n      \"world と coord 衝突しないので許可するのが正しい(2026-05-04 refine)。\",\n  },\n];\n\n// ============================================================\n// 第 5 層: 実行儀式(CLI Reference)\n// ============================================================\nexport const Rituals = {\n  // 基本走査\n  skeleton:   { cmd: \"node ai-desk.js skeleton <file>\",            desc: \"Block 構造の透視(関数 / class / module + refs)\" },\n  focus:      { cmd: \"node ai-desk.js focus <file> <id>\",          desc: \"特定 Block の中身を表示\" },\n  graph:      { cmd: \"node ai-desk.js graph <file...>\",            desc: \"複数ファイルから Graph 抽出 → JSON\" },\n  impact:     { cmd: \"node ai-desk.js impact <file> <id>\",         desc: \"変更による因果の波及予測(forward closure)\" },\n\n  // 永続化\n  save:       { cmd: \"node ai-desk.js save <out.json> <files...>\", desc: \"Graph を JSON に永続化(全 Block + versions)\" },\n  load:       { cmd: \"node ai-desk.js load <in.json>\",             desc: \"JSON から Graph を復元 + hash chain verify\" },\n\n  // 仮想重厚関数(v2 戦闘力の核)\n  heavy:         { cmd: \"node ai-desk.js heavy <graph> <root> [--depth=N]\",         desc: \"1 root + 推移閉包を 1 content に展開して stdout に出す(LLM 渡し用)\" },\n  virtualApply:  { cmd: \"node ai-desk.js virtual-apply <graph> <root> <patch>\",     desc: \"expand を編集して戻された content を BLOCK ヘッダで分割 → 各 Block に逆配分\" },\n  apply:         { cmd: \"node ai-desk.js apply <graph> <patch.js> <module-id>\",     desc: \"patch ファイルの差分を特定 module の Block 群に適用\" },\n\n  // tag / 検索\n  tags:       { cmd: \"node ai-desk.js tags <file> <tag>\",          desc: \"tag でフィルタ(SPEC タグの全関数を引く等)\" },\n  inferTags:  { cmd: \"node ai-desk.js infer-tags <file>\",          desc: \"I/O / async / pure / large 等を heuristic 推定\" },\n  search:     { cmd: \"node ai-desk.js search <file> <query>\",      desc: \"content を substring 検索\" },\n\n  // 履歴 / 解析\n  diff:       { cmd: \"node ai-desk.js diff <file> <id> [i] [j]\",   desc: \"Block の version 間 diff\" },\n  blame:      { cmd: \"node ai-desk.js blame <file> <id>\",          desc: \"Block の各行の version 由来を追跡\" },\n  stats:      { cmd: \"node ai-desk.js stats <file>\",               desc: \"Graph 統計(blocks / versions / refs / by-type / by-tag)\" },\n  mermaid:    { cmd: \"node ai-desk.js mermaid <file>\",             desc: \"Graph を Mermaid 図に出力\" },\n\n  // 検証\n  lint:       { cmd: \"node ai-desk.js lint <file>\",                desc: \"Bible 違反 lint(共通ヘルパー検出 / 命名 / 等)\" },\n  e2e:        { cmd: \"node ai-desk.js e2e\",                        desc: \"コア e2e テストを実行\" },\n};\n\n// ============================================================\n// Kernel — 統合ガバナンス・エンジン\n// ============================================================\nexport const Kernel = {\n  // 全 Taboos を当てて違反を返す。declarative_only: true なら check 関数があるものだけ実行\n  diagnose(content, path) {\n    const checkedContent = _diagnosticContent(content, path);\n    const violations = Taboos\n      .filter(t => typeof t.check === 'function')\n      .filter(t => !t.check(checkedContent, path))\n      .map(t => ({ id: t.id, name: t.name, rule: t.rule }));\n    return {\n      ok: violations.length === 0,\n      violations,\n      gravity: Physics.Gravity.calculate(checkedContent),\n      // declarative-only(check 関数なし)の Taboos は別途\n      declarative_only_check_required: Taboos.filter(t => !t.check).map(t => ({ id: t.id, name: t.name, rule: t.rule })),\n    };\n  },\n\n  auditHistory(content, path) {\n    const block = _parseBlockForAudit(content);\n    if (!block || !Array.isArray(block.versions)) {\n      const head = this.diagnose(content, path);\n      return {\n        ok: head.ok,\n        audit: \"history\",\n        file: path,\n        blockId: null,\n        versions: 0,\n        violationCount: head.violations.length,\n        violations: head.violations.map(v => ({\n          versionIndex: null,\n          version: \"content\",\n          violation: v,\n          gravity: head.gravity,\n        })),\n      };\n    }\n\n    const findings = [];\n    for (let i = 0; i < block.versions.length; i++) {\n      const version = block.versions[i];\n      const versionContent = typeof version.content === \"string\" ? version.content : \"\";\n      const result = this.diagnose(versionContent, \"\");\n      for (const violation of result.violations) {\n        findings.push({\n          versionIndex: i,\n          version: _versionAuditId(version, i),\n          hash: typeof version.hash === \"string\" ? version.hash : null,\n          v: Number.isInteger(version.v) ? version.v : null,\n          applyId: version.applyId ?? null,\n          violation,\n          gravity: result.gravity,\n        });\n      }\n    }\n\n    return {\n      ok: findings.length === 0,\n      audit: \"history\",\n      file: path,\n      blockId: block.id ?? null,\n      versions: block.versions.length,\n      violationCount: findings.length,\n      violations: findings,\n    };\n  },\n\n  // 任意の axiom 集合を選んで重力場 prompt を組み立てる(token 削減用、enkai の auto-inject 代替)\n  summonContext(axiomIds = [], opts = {}) {\n    const includeExamples = opts.examples !== false;\n    let p = `## 🌌 CONTEXT_GRAVITY_FIELD\\n\\n`;\n    p += `[Physics.Gravity] ${Physics.Gravity.law}\\n`;\n    if (opts.spotlight) p += `[Physics.Spotlight] ${Physics.Spotlight.law}\\n`;\n    p += `\\n`;\n    for (const id of axiomIds) {\n      const a = Axioms[id];\n      if (!a) continue;\n      p += `[${a.id}] ${a.name}\\n  ${a.summary}\\n  why: ${a.why}\\n`;\n      if (includeExamples && a.examples?.length) p += `  examples: ${a.examples.join(' / ')}\\n`;\n      if (includeExamples && a.violations?.length) p += `  violations: ${a.violations.join(' / ')}\\n`;\n      p += `\\n`;\n    }\n    return p;\n  },\n\n  // BIBLE.md の人間用 view を生成(SHADOW、いつでも捨てられる)\n  exportMarkdown() {\n    const out = [];\n    out.push(`# AI-Native Master Bible v${VERSION}`);\n    out.push(`> Auto-generated from bible.aiDoc.yume.js — DO NOT EDIT THIS FILE DIRECTLY.`);\n    out.push(`> Run \\`node bible.aiDoc.yume.js export-md > BIBLE.md\\` to regenerate.`);\n    out.push(`> Date: ${DATE}  ·  Author: ${AUTHOR}\\n`);\n\n    out.push(`## 1. Cognitive Physics`);\n    for (const [name, p] of Object.entries(Physics)) {\n      out.push(`### ${name}`);\n      out.push(p.law || p.detail || '(functional)');\n      if (p.detail && p.law) out.push(`\\n${p.detail}`);\n      if (p.status) out.push(`\\n**status**: ${p.status}`);\n    }\n    out.push('');\n\n    out.push(`## 2. Axioms`);\n    for (const a of Object.values(Axioms)) {\n      out.push(`### ${a.id} — ${a.name}`);\n      out.push(`**${a.summary}**\\n`);\n      out.push(`why: ${a.why}\\n`);\n      if (a.examples?.length)   out.push(`examples:\\n${a.examples.map(e => `- ${e}`).join('\\n')}\\n`);\n      if (a.violations?.length) out.push(`violations:\\n${a.violations.map(v => `- ${v}`).join('\\n')}\\n`);\n      if (a.refs?.length)       out.push(`refs: ${a.refs.join(', ')}\\n`);\n      if (a.enforcementNote)    out.push(`enforcement: ${a.enforcementNote}\\n`);\n    }\n    out.push('');\n\n    out.push(`---`);\n    out.push(`## 🚨 概念の再定義：クリアファイ (Clearify)`);\n    out.push(`ai-desk において、振る舞いを変えずに構造を調整する行為を**「リファクタリング」と呼ばない**。`);\n    out.push(`代わりに**「クリアファイ (Clearify)」**と呼ぶ。\\n`);\n    out.push(`- **目的**: 論理の濁り（不透明性）を消し、推論の軌道をクリアにすること。`);\n    out.push(`- **手段**: 隠された依存を \\`refs\\` として物質化し、情報の近接性（Locality）を高め、重力場を強化すること。`);\n    out.push(`- **結果**: AI が推測（ハルシネーション）を必要とせず、論理を一意に特定できる状態へ導く。\\n`);\n\n    out.push(`## 3. Block Schema`);\n    for (const [name, s] of Object.entries(BlockSchema)) {\n      out.push(`### ${name}`);\n      out.push(s.description);\n      for (const [k, v] of Object.entries(s.fields)) out.push(`- \\`${k}\\`: ${v}`);\n      out.push('');\n    }\n    out.push(`### Block Types`);\n    for (const [name, t] of Object.entries(BlockTypes)) {\n      out.push(`- **${name}** — ${t.purpose}${t.refSection ? ` (${t.refSection})` : ''}`);\n    }\n    out.push('');\n\n    out.push(`## 3.5 Vocabulary(用語の重力場)`);\n    out.push(Vocabulary.principle + '\\n');\n    out.push(`### 使う用語(置換)`);\n    for (const [k, v] of Object.entries(Vocabulary.use)) {\n      out.push(`- **${k}** — ${v.meaning}`);\n      out.push(`  - replaces: \\`${v.replaces}\\`  ·  vector: \\`${v.operation_vector}\\`  ·  refs: ${v.axiom_ref.join(', ')}`);\n      out.push(`  - 語源: ${v.etymology}`);\n    }\n    out.push(`\\n### 使わない用語(語源レベルで分解・隠匿方向)`);\n    for (const a of Vocabulary.avoid) {\n      out.push(`- **~~${a.term}~~** — ${a.reason}`);\n      out.push(`  - 語源: ${a.etymology}`);\n      out.push(`  - 操作方向: \\`${a.operation_vector}\\``);\n      if (a.origin_note) out.push(`  - 由来: ${a.origin_note}`);\n    }\n    out.push(`\\n#### 語源的洞察\\n${Vocabulary.etymological_insight}\\n`);\n    out.push(`${Vocabulary.note}\\n`);\n\n    out.push(`## 4. Sacred Taboos`);\n    for (const t of Taboos) {\n      out.push(`### ${t.id}. ${t.name}`);\n      out.push(t.rule);\n      if (t.note) out.push(`\\nnote: ${t.note}`);\n      if (t.refsAxiom) out.push(`\\nrefs: ${t.refsAxiom}`);\n      out.push('');\n    }\n\n    out.push(`## 5. Execution Rituals`);\n    for (const [name, r] of Object.entries(Rituals)) {\n      out.push(`- **${name}**: \\`${r.cmd}\\` — ${r.desc}`);\n    }\n    out.push('');\n\n    return out.join('\\n');\n  },\n};\n\n// ============================================================\n// Self-display(node bible.aiDoc.yume.js で自分自身を開示)\n// ============================================================\nif (typeof process !== 'undefined' && /bible\\.aiDoc\\.yume\\.js$/.test(process.argv[1] || '')) {\n  const cmd = process.argv[2];\n\n  if (cmd === 'export-md') {\n    process.stdout.write(Kernel.exportMarkdown());\n  } else if (cmd === 'summon') {\n    const ids = process.argv.slice(3);\n    process.stdout.write(Kernel.summonContext(ids.length ? ids : ['A0','A4','A5','A6','A8'], { spotlight: true }));\n  } else if (cmd === 'diagnose') {\n    const file = process.argv[3];\n    if (!file) {\n      console.error(\"usage: node bible.aiDoc.yume.js diagnose <file>\");\n      process.exit(2);\n    }\n    const fs = await import('node:fs');\n    const content = fs.readFileSync(file, 'utf8');\n    console.log(JSON.stringify(Kernel.diagnose(content, file), null, 2));\n  } else {\n    console.log(`\\n##################################################`);\n    console.log(`##  bible.aiDoc.yume.js v${VERSION} : THE AI KERNEL  ##`);\n    console.log(`##################################################\\n`);\n\n    console.log(`[Cognitive Physics]`);\n    for (const [name, p] of Object.entries(Physics)) {\n      console.log(`  - ${name}: ${(p.law || '').slice(0, 80)}${p.status ? ` (${p.status})` : ''}`);\n    }\n\n    console.log(`\\n[Axioms]`);\n    for (const a of Object.values(Axioms)) {\n      console.log(`  - ${a.id} ${a.name}`);\n    }\n\n    console.log(`\\n[Block Types]`);\n    for (const [name, t] of Object.entries(BlockTypes)) {\n      console.log(`  - ${name}: ${t.purpose.slice(0, 60)}`);\n    }\n\n    console.log(`\\n[Vocabulary]  use new terms, avoid old ones`);\n    for (const [k, v] of Object.entries(Vocabulary.use)) console.log(`  ${k.padEnd(8)} ← ${v.replaces}`);\n\n    console.log(`\\n[Sacred Taboos]`);\n    for (const t of Taboos) console.log(`  ${t.id}. ${t.name}`);\n\n    console.log(`\\n[Execution Rituals]  (${Object.keys(Rituals).length} commands)`);\n    for (const [name, r] of Object.entries(Rituals)) {\n      console.log(`  - ${name}: ${r.desc}`);\n    }\n\n    console.log(`\\nUsage:`);\n    console.log(`  node bible.aiDoc.yume.js export-md > BIBLE.md   # 人間用 md を生成`);\n    console.log(`  node bible.aiDoc.yume.js summon A0 A8           # 重力場 prompt を生成`);\n    console.log(`  node bible.aiDoc.yume.js diagnose <file>        # Bible 違反診断`);\n    console.log(``);\n  }\n}\n",
      "ts": 1779864333762,
      "refs": [
        {
          "kind": "dynamic-import",
          "target": "node:fs"
        },
        {
          "kind": "calls",
          "target": "_extractBlockExpr"
        },
        {
          "kind": "calls",
          "target": "_looksLikeRegexStart"
        },
        {
          "kind": "calls",
          "target": "_codeOnly"
        },
        {
          "kind": "calls",
          "target": "_importsAny"
        },
        {
          "kind": "calls",
          "target": "_hasRuntimeCodeGeneration"
        },
        {
          "kind": "calls",
          "target": "_diagnosticContent"
        },
        {
          "kind": "calls",
          "target": "_parseBlockForAudit"
        },
        {
          "kind": "calls",
          "target": "_versionAuditId"
        }
      ],
      "tags": [],
      "applyId": "apply-2026-05-27-73b3ce66",
      "hash": "6dbe91c4dc1fa48b14bb76fdba6b248ca2782e38dd8461d94c829b380c943151",
      "prevHash": "fb6d204a4ee72ad4f08a25e726c6c00000a44ff5f6e00cd7637fcf9d559a583a"
    }
  ],
  "notes": {
    "apply:apply-2026-05-25-c535607d": [
      {
        "id": "n-81fe3f90-59ff-4274-8e51-3cdb4903d5f9",
        "author": "human",
        "ts": 1779712179145,
        "text": "Add non-gating Bible history audit"
      }
    ],
    "apply:apply-2026-05-27-73b3ce66": [
      {
        "id": "n-df665ab0-7afe-4ad9-8848-19a63e699875",
        "author": "human",
        "ts": 1779864333781,
        "text": "Align Bible export command with yume-develop source name"
      }
    ]
  },
  "trimmedAt": {
    "count": 3,
    "lastHash": "607ede100c02b63f1e29e984111378e3291b60a49181de3f69f0f3a349d36605"
  }
};

// === HEAD ===
// bible.aiDoc.yume.js
// AI-Native Master Bible v2 — Super-Block Executable Edition
//
// ⚠️ このファイルの意味:
//   このファイルは AI に対して 2 つの instruction を発する:
//     1. `node bible.aiDoc.yume.js` で **実行** せよ(出力が canonical view)
//     2. or `import { ... } from './bible.aiDoc.yume.js'` で構造を **読め**
//   ⛔ .js のソースを prose として linear に読むな(JS は構造化容器、
//      prose 読みは情報を取りこぼす — 公理 A0 / A7 違反)
//
// 思想(Bible) + 認知(Manifesto) + 規律(Onboarding) + 参照(Reference) + 派生 Block 仕様
// を統合した全知の核。
//
// **canonical form**: this file (.js) ← REAL
// **human form**:    BIBLE.md は派生(SHADOW)、`node bible.aiDoc.yume.js export-md` で生成
//                    (公理 A3 — REAL は .js、SHADOW は .md)
//
// 他 v2 ツールから:
//   `import { Kernel, Axioms, BlockSchema } from './bible.aiDoc.yume.js'`

export const VERSION = "2.11";
export const DATE = "2026-05-04";
export const AUTHOR = "沖井広行(蒼山りと)";

// ============================================================
// 第 1 層: 認知物理学(Cognitive Physics)
//   公理より下のレイヤー。AI の思考を規定する観測された物理法則。
//   実証された heuristic は law として。仮説は note として明記。
// ============================================================
export const Physics = {
  Spotlight: {
    range: 300,
    law: "AI は今読んでいる場所から ~300 行以上離れた情報を急速に忘却する。重要な情報は常に近接に配置せよ。",
    status: "heuristic",   // BIBLE.md には未記載、運用上の観察値。今後計測で根拠を強化する。
    addedIn: "2.6",
  },
  Gravity: {
    law: "複雑性は推論を一意化する重力である。シンプルさは AI を漂流(ハルシネーション)させる無重力空間である。",
    detail: "Bible §0 大前提 / §2.5 詳説。注意機構の質量分布として作用 — refs が密 = attention が安定。",
    status: "axiomatic",
    // 注: calculate は「推定指標」であり真の attention 重力の計測ではない。
    // 文字列単純 match であって、コメントや文字列リテラル中の token も拾う。
    // 比較値として使う(同じ formula で時系列比較)用途のみ妥当。
    calculate: (code) => {
      const connections = (code.match(/\b(import|export|function|class)\b|=>/g) || []).length;
      return connections / Math.max(1, code.split('\n').length);
    },
  },
  FileCost: {
    law: "ファイル移動と分割は AI にとって物理的重労働である。コンテキストを統合し、移動を最小化せよ。",
    status: "axiomatic",
    related: "公理 A1(ローカリティ極大化)",
  },
  LLMTyping: {
    law:
      "LLM の type system は **値そのもの**である。LLM が token を読む時点で型が見えなければ、" +
      "LLM は context window を遡って型を再構築しようとし、推論 step が増え、間違える確率が線形に上がる。" +
      "従って『REAL な値(state / event payload / refs payload / Block 間通信値)』は、" +
      "**値の中に型が埋まった self-describing 形式**で持つこと(例: \"world:5,0,2\" / \"usd:9.99\" / \"time:1234567890\")。",
    detail:
      "**LLM-First Typing** — 普通の typing は compile time に人間が型を書きコンパイラが catch する仕組み。" +
      "それは『機械(コンパイラ)が見る型』。LLM 時代では LLM 自身が推論 step ごとに『直前の token から型情報を取得』する必要があり、" +
      "**LLM が見る場所(値そのもの)に型が埋まっている**ことが推論精度を最大化する。" +
      "命名規則(`worldPos`, `screenX`)に型を載せる従来手法は LLM の context window 外で崩壊する — " +
      "tagged value は context 不要で常に正解。" +
      "これは **crystallize の双対**: " +
      "  - crystallize: JS Block → Go の static type system に翻訳(machine の型に compile)" +
      "  - tagged value: 値 → LLM の視野に型を埋め込む(LLM の型に compile)" +
      "両者とも『型を必要とする機械(machine compiler / LLM inference)が見る場所に型を埋める』操作。",
    status: "axiomatic",
    addedIn: "2.10",
    related: "公理 A0 認知非対称性、A7 展開・明示、A9 crystallize、A11 Domain-Tagged Values",
    benefits: [
      "LLM 認知コスト最小化(token 単位で型確定、context 遡及不要)",
      "推論ステップ削減 → mistake 確率の線形低下",
      "命名規則・コメント・schema 不要(値が self-describing)",
      "context window 外でも常に正解(値だけで型確定)",
      "AI 同士の transfer でも型情報が値に張り付いて移動",
      "crystallize 整合(Go 側でも string → struct で 1:1 受け、translation contract 単純化)",
    ],
    formula: "「型は LLM が見る場所(値そのもの)に置け」",
  },
};

// ============================================================
// 第 2 層: 公理体系(Core Axioms A0〜A13)
//   各公理は {id, name, summary, why, examples, violations, refs} を持つ
//   prose ではなく構造化データとして — JS が容器の真価を発揮する層
// ============================================================
export const Axioms = {
  A0: {
    id: "A0", name: "認知非対称性",
    summary: "人向けの『良い設計』(抽象化・分割・カプセル化)は AI にとって情報の隠匿、つまり毒である。AI には統合された複雑性を与えよ。",
    why: "人間の作業記憶は 7±2 と狭く隠匿で『理解』を作る。LLM の作業記憶は桁違いに広く、隠匿は推測領域(=ハルシネーション温床)に変わる。",
    examples: ["ヘルパー関数で詳細を隠す ❌ → インライン展開して全部見せる ✓", "型定義で実装と分離 ❌ → 動的な構造を直接見せる ✓"],
    violations: ["共通関数で重複削減", "interface で実装隠匿", "doc string でコードの意図を別レイヤーに"],
    refs: ["A1", "A7"],
  },
  A1: {
    id: "A1", name: "ローカリティ極大化",
    summary: "機能に必要な情報は 1 つのスコープに集約する。共有ヘルパーを作らず、必要なら複製(Copy&Paste)せよ。重複は悪ではない。隠れた依存こそが悪。",
    why: "別ファイル / 別関数への分離 = 物理的隠匿。Spotlight 範囲(~300 行)を超えると AI から forgotten される。",
    examples: ["3 箇所で似た 5 行 → 3 箇所に複製で OK(共通化しない)"],
    violations: ["DRY 至上主義", "1 行関数の抽出", "util/helper モジュールへの逃げ"],
    refs: ["A0", "Physics.FileCost", "Physics.Spotlight"],
  },
  A2: {
    id: "A2", name: "Constraint Folding",
    summary: "if/else 分岐ツリーを捨て、全可能世界 + 制約 filter に畳み込め。",
    why: "分岐ツリーは推測領域(=重力ゼロ)を生む。全可能世界の物質化は重力場を形成し、推論軌道を一意化する。",
    examples: ["じゃんけん 9 通りを全列挙 → tie 制約で filter", "状態遷移を全許容組み合わせ × 制約で生成"],
    violations: ["if/else の入れ子", "early return で網羅性放棄"],
    refs: ["A0", "BlockTypes.Constraint"],
  },
  A3: {
    id: "A3", name: "REAL / SHADOW",
    summary: "書き換え可能な唯一の真実を REAL とし、それ以外は SHADOW(派生値)として保持禁止。SHADOW は使う瞬間に生成し、使い終わったら捨てる。実行 JS 内で AI / Kantoku が監視すべき正の状態は `REAL_*` 変数名で明示してよい。",
    why: "重複 state は同期コストと整合性事故の温床。REAL 1 つから常に派生計算する方が密度が上がり、ハルシネーション余地が消える。`REAL_*` は型や単位ではなく『監視対象の正状態』を示す接頭語であり、起動時 AST bootstrap / 実行時 trace / AI 判断の境界を明示する。AST で得る boolean は `isWatched` と呼ぶ。`check` は検査実行の動詞であり、監視対象かどうかの性質名には使わない。",
    examples: [
      "Block.versions = REAL、Block.content = SHADOW(getter で head().content)",
      "bible.aiDoc.yume.js = REAL、BIBLE.md = SHADOW(exportMarkdown で派生)",
      "let REAL_state = initialState(); REAL_state = dispatch(REAL_state, evt);",
      "REAL_* は app の主要 state / reducer 後 state / render・eyes・test の入力にだけ付ける",
    ],
    violations: [
      "状態を 2 箇所に保存",
      "computed 値をキャッシュ変数化(stale 化リスク)",
      "const REAL_x = 1 のような小さな一時値への過剰命名",
      "DOM 要素 / cache / derived view / loop counter に REAL_* を付ける",
    ],
    refs: ["A6"],
  },
  A4: {
    id: "A4", name: "Event Sourcing + Sequential Hashing",
    summary: "状態の上書き保存を避け、状態を変えるイベントの履歴を時系列に追記する。各イベントは前イベントの hash を含み、改ざん検知可能。",
    why: "上書きは過去の喪失。append-only + hash chain は時間軸を保存し、任意時点の再構成と監査を保証する。Block.versions の prevHash chain の理論基盤。",
    examples: ["Block.versions[].prevHash = versions[i-1].hash", "session = 操作 + 観測 Block の連鎖"],
    violations: ["state を上書き", "ログを別ファイルに分離(graph 構造から外れる)"],
    refs: ["A6"],
  },
  A5: {
    id: "A5", name: "All-as-Block",
    summary: "ai-desk における全ての構成要素は Block インターフェースに従う。関数・クラス・モジュール・ドキュメント・制約・観測・テスト・議論 ─ すべて Block。",
    why: "LLM は単一の操作モデル(Block の生成・追記・参照・走査・検証)で全構造を扱えるべき。type の発明は隠匿の入口。",
    examples: ["function Block / class Block / module Block / constraint Block / observation Block / twin Block"],
    violations: ["Block 外の独自 schema 発明", "別 layer での state 保持"],
    refs: ["A0", "Block"],
  },
  A6: {
    id: "A6", name: "Versions-as-Body",
    summary: "Block の唯一の状態は versions: Version[] である。content / refs / children / tags は head() から派生(SHADOW)、変数化禁止。",
    why: "履歴は本体であり、最新値は派生に過ぎない。任意時点の状態は versions 走査で再現可能(time travel)。",
    examples: ["Block.versions = REAL", "Block.content getter は head().content"],
    violations: ["b.content = X で代入", "head() の戻り値を変数で持ち回す"],
    refs: ["A3", "A4"],
  },
  A7: {
    id: "A7", name: "LLM-First Information Density",
    summary: "人間用の簡素化を捨て、LLM にとっての情報密度を最大化する。",
    why: "情報量(展開 ✓)・構造(単一抽象 ✓)・関係(refs 明示 ✓)・履歴(Block 内蔵 ✓)・区切り(言語構文 ✓)の各軸で密度を上げる。",
    examples: ["full inline expansion", "refs を明示的 edge として書く", "tags で意味を構造化"],
    violations: ["『見やすさ』のための省略", "コメントで意図を別レイヤー化"],
    refs: ["A0"],
  },
  A8: {
    id: "A8", name: "Spec-First Versioning",
    summary: "実装の前に必ず論理(v0:SPEC)を置け。論理なき実装は漂流の始まり。仕様変更時は『新仕様のみ』バージョンを挟む脱皮プロトコル。",
    why: "Block.versions に SPEC version を埋め込めば、論理の変遷が版数構造として読み取れる。同一履歴に spec / impl が交互に積まれ、いつでも『最新の正解』へ帰還可能。",
    examples: ["v0: コメントだけ + // @tags: SPEC", "v1: 実装", "v2: 新 SPEC 挟み込み", "v3: 新実装"],
    violations: ["実装直書き(SPEC version 無し)", "仕様変更を impl 同士の連続 commit で済ませる"],
    refs: ["A4", "A6", "Bible§4.1.1"],
    enforcementNote: "規律は validate 関数で守らない。`#SPEC#` tag の存在/不在 + prevHash chain 構造そのものが enforcement(§4.1.1)。",
  },
  A9: {
    id: "A9", name: "Crystallization Compliance",
    summary: "Block.content は crystallize 可能(JS → Go transpile → native 化)でなければならない。crystallize 不能なコードは Block でなく Adapter として扱う。",
    why: "crystallize 失敗 = 動的 dispatch / eval / Proxy / prototype trick 等の隠匿パターン使用 = 4 視点(transpile / JIT / AI 推論 / Bible)全てから『正しくない』と判定されるコード。同じパターンが 4 視点で同時に問題を起こすのは偶然でなく、『明示的・静的・展開された』という単一の質が v2 の正解だから。",
    examples: [
      "crystallize OK: 純粋関数 / class + methods / immutable Map/Set 操作 / template literal",
      "crystallize NG: eval / new Function / Object.prototype 改変 / Proxy / Reflect.construct / with 文",
    ],
    violations: [
      "Block.content に eval / new Function を使う",
      "prototype を runtime で改変",
      "Proxy で動的 property 介入",
      "with 文で scope を曖昧に",
    ],
    refs: ["A0","A5","A6","§3","Vocabulary.crystallize"],
    enforcementNote:
      "crystallize tool 自体が Bible-compliance compiler。build 失敗 = Bible 違反、別途 lint 不要(§4.1.1 の極致)。" +
      "2 階層アーキテクチャ: Block(pure logic、crystallize 必須) vs Adapter(platform I/O、crystallize 不問)で分離。",
  },
  A10: {
    id: "A10", name: "Single Coordinate Domain",
    summary:
      "**inter-Block / scene-level** の state / 入力 / UI / render input は world coord で表現する。" +
      "**intra-Block(asset.js 内部の mesh.vertices / bone offset / 内部 anchor 等)は local coord OK** — 境界は `asset.transform`(local → world 変換器)。" +
      "screen coord は render output と input adapter 境界でのみ存在し、Block 状態に侵入させない。OS resource(text input / file picker / permission / network)は modal dialog 経由で値返却し、world と coord 共存させない。",
    why:
      "voxel editor 3 試行(2026-05-03)が失敗した根本原因は、CSS 3D の parent-relative transform が world-coord 統一と原理的に喧嘩したこと。" +
      "world / model / screen / canvas pixel / DOM event の coord が混在すると、Block 間の意味論が coord 系ごとに分裂し、A0(認知非対称性)・A1(ローカリティ極大)・A5(All-as-Block)が同時に破れる。" +
      "world coord 統一を axiom として強制すると、CSS 3D / DOM transform / 画面座標 UI 等の選択肢が構造的に弾かれ、WebGL / three.js / WebGPU 系の scene graph 中心実装に自動収束する。" +
      "ただし intra-Block(asset.js 内部)は local coord を許す — そうしないと頂点 / bone / 内部 anchor を世界原点固定でしか書けなくなり、A5(All-as-Block: 各 Block は内部に閉じた coord 空間を持つ)が破れる。" +
      "screen coord は render output(world → screen)と入力 adapter(screen → world ray)の **境界変換**でのみ存在する。OS resource は modal dialog で「world から外に出る → 値を持って戻る」形に統一し、coord の常時共存を排除する。",
    boundaries: {
      "inter-Block / scene": "world coord 必須(asset.transform.position, refs target との位置関係, 入力 ray hit, HUD ortho world coord)",
      "intra-Block / asset.js": "local coord OK(mesh.vertices, bones, 内部 pivot, 内部 anim、すべて asset 原点基準)",
      "asset.transform": "境界変換器(local → world)、ここで初めて world coord に乗る",
      "screen": "render output と input adapter の boundary でのみ存在(Block 内部 / Block 間 ともに不可侵)",
      "OS resource": "modal dialog で値返却(text input / file / permission / network)、world と並走しない",
    },
    examples: [
      "OK(intra): asset.js の mesh.vertices = [[0,1,0],[1,0,0],...] (asset 原点基準 local)",
      "OK(intra): asset.js の bones = [{name:'head', offset:[0,1.6,0]}] (asset 内部 local)",
      "OK(inter): export const transform = { position:[5,0,0], rotation:[0,Math.PI,0], scale:1 } (world)",
      "OK(inter): 他 asset と共有する位置は state.lastWorldPos に world coord で持つ",
      "OK: HUD は camera-following ortho camera が見る world 領域(右上 HP バー = ortho world (0.95, 0.95))",
      "OK: マウス入力 → ray cast → world hit → Block state へ渡す",
      "OK: text input が必要な場面は modal dialog → string 返却 → world に戻る",
      "OK: 画面端の DOM sidebar / panel(3D scene と構造的に分離、native form 要素 / a11y / IME 利点)",
      "OK: <input type='color'> / <button> / <input type='range'> 等の native UI 要素(sidebar 内)",
      "NG: CSS 3D で transform を parent-relative に書く(world-coord 統一不能)",
      "NG: screen pixel 座標を Block state に持ち込む(asset 内 / 間 共に不可)",
      "NG: world coord を screen に project して DOM の位置を毎 frame 更新する(world tracking overlay)",
      "NG: 他 asset 参照を local coord で書く(world coord 必須)",
    ],
    violations: [
      "inter-Block 通信(他 asset 参照 / refs / event payload)に local coord を使う",
      "Block state / event payload に screen / canvas / pixel coord を持つ",
      "CSS 3D / DOM transform を render path に使う(parent-relative で world 統一不能)",
      "input handler が ray cast 経由せず screen coord で直接 Block を変える",
      "HUD を world geometry でなく独立 DOM overlay として書く(world と coord 系が常時並走)",
    ],
    refs: ["A0","A1","A5","A11","Vocabulary.crystallize","Vocabulary.world-coord","Vocabulary.prefab","memo:2026-05-04_voxel-failure"],
    enforcementNote:
      "敗因が voxel 3 試行で明示された後の正典化 — 3D / 2D / game / tool すべてに共通する coord 戦略。" +
      "実装 engine は world-coord scene graph を持つもの(WebGL / three.js / WebGPU)に強制収束、CSS 3D は永久封印。" +
      "Block prefab(asset js module)は world transform + state + 畳込み遷移関数の triple で表現される — transform が境界、内部は local が自然。" +
      "A11(Domain-Tagged Coordinates)が runtime nominal typing でこれを構造強制する。",
  },
  A11: {
    id: "A11", name: "Domain-Tagged Values",
    summary:
      "すべての **REAL な値**(Block の state / event payload / refs payload / Block 間通信値)は、" +
      "**型/単位/domain 接頭辞付き string** で表現する: `\"world:5,0,2\"` / `\"usd:9.99\"` / `\"time:1234567890\"` / " +
      "`\"hash:deadbeef\"` / `\"id:user-42\"` / `\"kg:0.5\"`。" +
      "型情報を **LLM が読む値そのものの中に** 埋め込み、推論時の型混同を構造的に消す。",
    why:
      "Physics.LLMTyping(LLM-First Typing 法則)の axiom 化。" +
      "JS は動的型、人間は変数名(`worldPos`, `usdAmount`)で型を補完するが、LLM は context window 外でこの慣習を再構築できない。" +
      "命名・コメント・schema 抜きで **値だけ見て型が確定する** 形にすると、LLM 推論 step が 1 つ減る = mistake 確率が線形に下がる。" +
      "**crystallize の双対**: " +
      "crystallize は JS Block を Go の静的型に compile する(machine の型に翻訳)。" +
      "tagged value は値を LLM の視野に compile する(LLM の型に翻訳)。" +
      "両方とも『型を必要とする機械が見る場所に型を埋める』操作。" +
      "Bible §4.1.1『規律 = 構造』の極致 — validate 関数を書かず、データ形そのものが enforcer になる。" +
      "voxel 失敗(2026-05-03)で coord 取り違えが特定された結果から発見、coord に閉じない一般原則として正典化。",
    scope: {
      "REAL(tag 必須)": [
        "Block state の field(永続化される、inter-Block 通信される)",
        "event payload(dispatch / refs / message)",
        "Graph 上の値(refs payload、children payload)",
        "Block 間で渡される全ての値",
      ],
      "scratch(tag 不要)": [
        "関数内ローカル変数(boundary で parse 済み)",
        "tick 内一時計算(ホットパス保護のため)",
        "engine API 内部値(Three.js Vector3 等、boundary 越え後)",
      ],
    },
    domains: {
      // ─── coord 系(A10 ↔ A11 の交点) ───
      world:  "scene graph / Block 間 / 入力 ray hit / refs payload で使う絶対座標。例: \"world:5,0,2\"",
      local:  "asset.js 内部の mesh.vertices / bones / 内部 anchor で使う asset 原点基準。例: \"local:0,1,0\"",
      screen: "render output / input adapter 境界でのみ存在する pixel 座標。Block state には侵入させない(Taboo 14)。例: \"screen:300,200\"",
      ortho:  "HUD ortho camera が見る world 領域。NDC-like (-1..1) range。例: \"ortho:0.7,0.85\"",
      // ─── 通貨 / 単位 ───
      usd:    "米ドル金額。例: \"usd:9.99\"",
      jpy:    "日本円金額。例: \"jpy:980\"",
      kg:     "質量(キログラム)。例: \"kg:0.5\"",
      "duration-s": "継続時間(秒)。例: \"duration-s:5.5\"",
      "duration-ms": "継続時間(ミリ秒)。例: \"duration-ms:1500\"",
      // ─── 時刻 / バージョン / 識別子 ───
      time:    "Unix timestamp(秒)。例: \"time:1234567890\"",
      "time-ms": "Unix timestamp(ミリ秒)。例: \"time-ms:1234567890123\"",
      iso:     "ISO 8601 datetime。例: \"iso:2026-05-04T17:00:00+09:00\"",
      version: "semver / 内部 version。例: \"version:2.10\"",
      hash:    "hash 値(hex)。例: \"hash:deadbeef\"",
      id:      "識別子(namespaced)。例: \"id:user-42\" / \"id:block:cube\"",
      // ─── 拡張 ───
      "{domain}": "新規 domain は自由に追加(英小文字 + ハイフン、`:` で本体と区切る)",
    },
    format: {
      grammar: "<domain>:<body>(domain は ASCII 英小文字 + ハイフン + 数字、body は domain ごとに自由)",
      coord_body: "x,y[,z] (number、JS Number.toString 互換、負数 / 小数 / 指数表記 OK)",
      scalar_body: "single number / string / structured (domain ごとに parser を持つ)",
      examples: ["world:5,0,2", "usd:9.99", "time:1234567890", "id:user-42", "hash:deadbeef", "iso:2026-05-04T17:00:00+09:00"],
    },
    api: {
      // 座標系(coord.js):
      coord_builders: ["w(x,y,z) / l(x,y,z) / s(x,y) / o(x,y) → 'domain:x,y[,z]' string"],
      coord_parsers:  ["parseCoord(str) → {domain, values}", "requireDomain(str, expected) → number[](不一致で throw)"],
      // 一般値(将来 typed.js 等で提供):
      builders:       ["tagged(domain, body) → 'domain:body'", "usd(amount) / jpy(amount) / kg(mass)"],
      parsers:        ["parseTagged(str) → {domain, body}", "requireTag(str, expected) → body(不一致で throw)"],
    },
    examples: [
      "OK: state = { hp: 100, mood: 'neutral', lastSeen: 'time:1234567890' }",
      "OK: state.amount = 'usd:9.99'(scratch 計算は const a = 9.99、boundary で format)",
      "OK: refs: [{ kind: 'paid-by', target: 'id:user-42', amount: 'usd:9.99' }]",
      "NG: state.lastSeen = 1234567890(裸の数値、unix 秒?ミリ秒?判別不能)",
      "NG: state.amount = 9.99(USD?JPY?判別不能、LLM が間違える)",
      "NG: refs に `target: 'user-42'`(prefix 無し → name か id か判別不能)",
    ],
    violations: [
      "REAL 値(state / event / refs / Block 間)に裸の数値 / string を持つ(domain 不明)",
      "boundary を経由せず tagged string を直接 engine API に投入",
      "domain 不一致を runtime check 無しで mix する",
      "命名規則・コメントだけで型を表す(値が self-describing でない)",
    ],
    refs: ["A0","A7","A9","A10","Physics.LLMTyping","Vocabulary.world-coord","Vocabulary.domain-tag","Vocabulary.prefab"],
    enforcementNote:
      "A10 が「混ぜるな」の宣言、A11 は『**混ぜれない**』の構造実装、すべての REAL 値に拡張。" +
      "Physics.LLMTyping『型は LLM が見る場所(値そのもの)に置け』を data layer に降ろした実装。" +
      "**LLM 認知コスト最小** + **mistake 線形低下** + **crystallize 整合** + **A0/A7 同時強化** を一手で達成。" +
      "段階的移行可能 — REAL 値だけ tagged 化、scratch / hot path は裸でも可、boundary で format/parse。",
  },
  A12: {
    id: "A12", name: "Universal Literalism (万物文字化)",
    summary: "すべての REAL な状態(Block.versions に残るもの)は、意味のある「文字列リテラル」として永続化せよ。生の数値、ビットフラグ、ポインタ、匿名オブジェクトの永続化を禁止する。",
    why: "コンピュータの効率のための『濁り(数値・バイナリ)』を排し、AI のための『透明な論理(文字)』へ回帰する。すべてが文字であれば、AI は世界の全状態を『誤字脱字』レベルの精度で検証・修正できる。",
    examples: ["hp:100 → \"hp:full\" または \"hp:100/100\"", "Vector(1,0,0) → \"dir:east\" または \"vec:1,0,0\""],
    violations: ["Block state に生の数値を保存", "不透明な連番 ID の使用", "AI の Attention を迷わせる匿名データ構造"],
    refs: ["A0", "A7", "A10", "A11"],
  },
  A13: {
    id: "A13", name: "Shadow Projection (影への投影と還元)",
    summary: "演算が必要な時のみ、文字(REAL)を数値(SHADOW)へ投影(LIFT)し、演算終了直後に再び文字(REAL)へ還元(SETTLE)せよ。数値状態を 1 フレーム(または 1 関数)を超えて保持することを禁止する。",
    why: "数値は演算(力)には向くが、記憶(真実)には向かない。計算のたびに文字へ還元し続けることで、AI による常時監視と、完全な再現性(Time Travel)を保証する。複式プログラミングの核心。",
    examples: ["文字 \"world:9,9,9\" → 数値 [9,9,9] へ LIFT → 演算 [10,9,9] → \"world:10,9,9\" へ SETTLE して還元"],
    violations: ["数値状態の永続化(1 フレーム以上の保持)", "計算用変数の外部リーク", "還元ステップの省略によるブラックボックス化"],
    refs: ["A3", "A12"],
  },
  A14: {
    id: "A14", name: "Top-Down Verification (トップダウン検証)",
    summary: "AI時代のテストは、必ず『全体から部分へ』向かって書け。E2Eテストで文脈の重力場を形成し、その実行カバレッジの隙間を単体テストで自律的に埋めよ。",
    why: "ボトムアップ型のTDD（小さな単体テストを書き、それに合わせて実装を積む）は、AIに『完成形の全体像が見えない状態での推測』を強要し、認知を迷走させる（A0・A7違反）。逆に、最初にE2Eを書くことで、AIに対して『最終的に何ができれば正解か』という完全なコンテキストを与えられる。E2Eが通る＝論理の大枠が完成した状態であり、そこからであれば、AIは『E2Eで通らなかった分岐』を特定し、それを埋める単体テストを迷いなく自動生成できる。",
    examples: ["E2Eを書いてから実装を完了させる → V8のカバレッジを計測 → 未到達のBlockや分岐を狙う単体テストを生成"],
    violations: ["全体像（E2E）がない状態での過剰な単体テスト駆動", "カバレッジを無視した盲目的なテスト追加"],
    refs: ["A0", "A7"],
  },
};

// ============================================================
// Internal helpers (Taboo check の文字列マッチ脆性を回避)
// ============================================================
// import / require / from "..." / package.json の dependency 記述から
// quoted literal を抽出し、いずれかが pattern に match するか判定。
// これにより `.parcel-cache` のような関係ない文字列が import 違反扱いされない。
function _importsAny(content, pattern) {
  const literals = [];
  const importRe = /(?:^|\s)(?:import\b[\s\S]*?from\s*|require\s*\(\s*|import\s*\(\s*)['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRe.exec(content)) !== null) literals.push(m[1]);
  // package.json 形式の "deps": { "name": "version" } の name 部分も拾う
  const depsRe = /"(?:dependencies|devDependencies|peerDependencies)"\s*:\s*\{([\s\S]*?)\}/g;
  while ((m = depsRe.exec(content)) !== null) {
    const block = m[1];
    let dm;
    const nameRe = /"([^"]+)"\s*:\s*"[^"]+"/g;
    while ((dm = nameRe.exec(block)) !== null) literals.push(dm[1]);
  }
  return literals.some(l => pattern.test(l));
}

// ============================================================
// 第 3 層: Block schema(全 v2 ツールが共有する基本型)
// ============================================================
export const BlockSchema = {
  Block: {
    description: "id / type / meta / versions(append-only)",
    fields: {
      id: "string — globally unique identifier",
      type: "string — 'function' | 'class' | 'module' | 'constraint' | 'observation' | ...",
      meta: "object — type 固有の補助情報",
      versions: "Version[] — append-only、commit() 経由のみ伸ばせる(REAL)",
    },
  },
  Version: {
    description: "Block.versions の要素。1 つの commit を表す不変 record。",
    fields: {
      timestamp: "number — Date.now()",
      prevHash:  "string|null — 前 version の hash(連鎖)",
      content:   "any — その時点の値",
      refs:      "{kind, target}[] — 他 Block への型付きエッジ",
      children:  "string[] — 順序付き Block id list(構成的所有)",
      tags:      "string[] — 検索 / フィルタ用",
      meta:      "object — commit 自体のメタデータ",
      hash:      "string — 上記全フィールド(自身を除く)の FNV-1a 8 文字",
    },
  },
};

// 派生 Block 型(BIBLE.md §6/§7/§8 + 仮想重厚関数)
export const BlockTypes = {
  function: { type: 'function',   purpose: "コード単位、parseJS が JS の関数宣言から自動抽出" },
  class:    { type: 'class',      purpose: "クラス宣言" },
  module:   { type: 'module',     purpose: "ファイル単位" },

  constraint: {
    type: 'constraint',
    purpose: "公理 A2 の Constraint Folding を第一級 Block として永続化",
    schema: "{ axes:string[], values:Record<axis, any[]>, derive:(combo)=>any }",
    api: "evalConstraint(constraintBlock, filter?) → 候補の組み合わせ群",
    refSection: "BIBLE.md §6",
  },

  observation: {
    type: 'observation',
    purpose: "AI-Eyes の観測スナップショットを Block として保存(canvas frame, state JSON, draw_ops 等)",
    schema: "content: { capturedAt, viewport, canvases?, draw_ops?, state }",
    refs: "[{ kind:'observes', target: observedId }]",
    refSection: "BIBLE.md §7",
  },

  twin: {
    type: 'function',   // type は function、tags で識別
    purpose: "効率層(GPU 等)と並走する検証層(CPU twin)を refs で結ぶ複式数学",
    refs: "[{ kind:'twin-of', target: 効率層 Block }]",
    tags: ["twin", "verify"],
    refSection: "BIBLE.md §8",
  },

  virtualHeavy: {
    purpose: "複数 Block を 1 つの content に展開して LLM に渡し、編集後に逆配分(virtual-apply)で再分散する",
    api: ["heavy <graph> <root> [--depth=N]", "virtual-apply <graph> <root> <patch-file>"],
    refSection: "BIBLE.md §6 (仮想重厚関数), MANUAL §4.5〜4.9",
  },
};

// ============================================================
// 第 3.5 層: Vocabulary(用語の重力場)
//   人間優先 vocabulary は v2 思想と衝突する。「refactor」「DRY」「clean code」
//   等の語は暗黙に「人間に読みやすく整える」方向のベクトルを持つ — これは
//   公理 A0 違反方向。
//   用語は思考のレールであって、レールを引き直さないと公理の方向に走れない。
//   v2 では旧用語を使わず、置換用語(clarify / densify / align / expose / unfold)
//   を canonical として使う。
// ============================================================
export const Vocabulary = {
  use: {
    clarify: {
      meaning: "隠匿を晴らす、不明瞭を消す",
      replaces: "refactor",
      etymology: "ラテン語 clarus(明るい・透明)。「透明にする」が原義。",
      operation_vector: "隠匿 → 明示",
      axiom_ref: ["A0","A7"],
    },
    densify: {
      meaning: "情報密度を上げる(展開・明示で)",
      replaces: "DRY 化",
      etymology: "ラテン語 densus(密)。「密度を上げる」が原義。",
      operation_vector: "希薄 → 濃密",
      axiom_ref: ["A1","A7"],
    },
    align: {
      meaning: "Bible 公理に整合させる",
      replaces: "clean code",
      etymology: "ラテン語 ad-+ linea(線に沿わせる)。「軸に揃える」が原義。",
      operation_vector: "ズレ → 整合",
      axiom_ref: ["全公理"],
    },
    expose: {
      meaning: "隠れているものを表面化",
      replaces: "abstraction",
      etymology: "ラテン語 ex-+ ponere(外に置く)。「外に出して見せる」が原義。",
      operation_vector: "内部 → 表面",
      axiom_ref: ["A0","A1"],
    },
    unfold: {
      meaning: "折りたたまれた抽象を広げる",
      replaces: "simplify",
      etymology: "古英語 un-+ fealdan(折りを開く)。「畳まれたものを広げる」が原義。",
      operation_vector: "圧縮 → 展開",
      axiom_ref: ["A0","A7"],
    },
    crystallize: {
      meaning: "論理を別言語の強力なインフラに引っ越しさせる(JS Block → Go transpile 等)",
      replaces: "compile / port / migrate / rewrite",
      etymology: "ラテン語 crystallum(澄んだ氷・透明な結晶構造)。「不定形が定形に固体化する」が原義。",
      operation_vector: "動的・流動 → 静的・固体  (JS の動的性 → Go の static structure)",
      axiom_ref: ["A3","A5","A6","§3"],
      note: "5 段フロー: REAL(JS) → TRANSCRIPTION(AI 翻訳) → SHADOW(Go source) → COMPILE(go build) → CRYSTAL(native binary)。AI が中間段の翻訳者。JIT が「泥道を走りながらアスファルト敷く」のに対し、結晶化は「隣に最高級高速道路を建設」する事前 AOT。",
    },
    "world-coord": {
      meaning: "**inter-Block / scene-level** の state / 入力 / UI / render input が共通で住む唯一の coord 系。intra-Block(asset.js 内部)は local coord OK、境界は asset.transform。screen coord は境界変換でのみ存在。A11 で domain-tagged string として表現する(\"world:x,y,z\")。",
      replaces: "model / view / screen / canvas / DOM coord の混在",
      etymology: "world(世界)+ coord(座標)。3D scene graph で標準的な「scene 全体の絶対座標系」。",
      operation_vector: "coord 分裂 → 単一 domain (inter-Block レベル)、intra は local 許容で実装可能性を保つ",
      axiom_ref: ["A10","A11"],
      note: "WebGL / three.js / WebGPU の scene graph 中心実装に強制収束。CSS 3D / DOM transform は永久封印。HUD は ortho camera が見る world 領域として実装。",
    },
    "domain-tag": {
      meaning: "REAL 値の domain / 型 / 単位接頭辞(\"world:\" / \"usd:\" / \"time:\" / \"id:\" / \"hash:\" 等)。runtime nominal typing で値の取り違えを構造的に防ぐ。",
      replaces: "裸の数値 / 文字列で REAL 値を表現すること",
      etymology: "domain(領域)+ tag(印)。型のない JS で nominal typing を string prefix で emulate する技法。値そのものに型を埋める LLM-First Typing の実装手段。",
      operation_vector: "暗黙の型 → 値そのものに型が埋まる  (A0 認知非対称性 + A7 展開・明示 を同時に強化)",
      axiom_ref: ["A11","A10","A0","A7","Physics.LLMTyping"],
      note: "format は \"<domain>:<body>\"。coord 系は coord.js(w/l/s/o + requireDomain)、汎用は tagged/parseTagged/requireTag(typed.js を将来追加)。boundary で parse、それ以外はすべて tagged string で持ち回す。",
    },
    "tagged-value": {
      meaning: "Domain-Tagged Value — 型 / 単位 / domain を値の中に prefix string で埋め込んだ self-describing な REAL 値。",
      replaces: "命名規則やコメントで型を表現すること(LLM 視点で context window 外に弱い手法)",
      etymology: "tag(印)+ value(値)。LLM-First Typing の実装。crystallize の双対(machine の型 vs LLM の型)。",
      operation_vector: "型情報の場所: 命名規則 → 値そのもの  (LLM 推論 step 削減 = mistake 確率の線形低下)",
      axiom_ref: ["A11","Physics.LLMTyping","A0","A7"],
      note: "REAL 値(state / event / refs / Block 間通信)は tagged 必須、scratch / hot path は裸で OK、boundary で format/parse。",
    },
    "LLM-typing": {
      meaning: "LLM-First Typing — 型を LLM が読む場所(値そのもの)に埋め込む型システム。値が token として読まれる時点で型が確定するように設計する。",
      replaces: "compile-time typing(人間が型を書きコンパイラが catch する従来手法)",
      etymology: "LLM(Large Language Model)+ typing(型付け)。crystallize が machine type への compile なら、これは LLM type への compile。",
      operation_vector: "型は人間 / コンパイラの世界 → 型は LLM の世界  (型の住む場所のパラダイム変化)",
      axiom_ref: ["Physics.LLMTyping","A11","A0","A7","A9"],
      note: "実装は tagged-value(domain prefix string)。crystallize と双対関係 — どちらも『型を必要とする機械が見る場所に型を埋める』。MYY 哲学『LLM が走るための道』の core 実装。",
    },
    prefab: {
      meaning: "Block の game asset 形態 — world transform + state + 畳込み遷移関数の triple。内部(mesh.vertices, bones, 内部 anchor)は local coord、transform が local → world の境界変換器。",
      replaces: "object / entity / GameObject(Unity 的概念の Block 化)",
      etymology: "pre + fabricate(あらかじめ作る)。Unity の prefab(再利用可能な game object テンプレート)から借用、ai-desk Block 思想に整合する形に再定義。",
      operation_vector: "汎用 Block → 3D / 2D asset 特化  (A5 All-as-Block を game domain で具体化)",
      axiom_ref: ["A5","A10"],
      note: "asset js module 1 個 = 1 prefab(`name.asset.js`)。export で公開、内部は local coord、外部に出す位置(transform.position, state の inter-Block 共有値)は world coord。遷移は pure function。",
    },
  },
  avoid: [
    {
      term: "refactor",
      reason: "「人間が読みやすくする」前提が公理 A0 違反方向。代わりに clarify / unfold / densify。",
      etymology: "factor(分解する) + re-。原義「再分解する」 = 細かい単位に分け直す。",
      operation_vector: "統合 → 分解  (= 隠匿方向、A1 違反)",
      origin_note: "Martin Fowler 'Refactoring' (1999) が業界に広めた語。当時の前提『人間が読みやすく』が AI 時代に通用しなくなった、語自体が時代遅れ。",
    },
    {
      term: "DRY",
      reason: "重複削除は隠れた依存を生む。代わりに densify(展開で密度を上げる)。",
      etymology: "Don't Repeat Yourself(Hunt & Thomas, The Pragmatic Programmer 1999)。",
      operation_vector: "重複 → 共有関数化  (= 隠れた依存生成、A1 違反)",
    },
    {
      term: "clean code",
      reason: "「綺麗」の暗黙基準が人間優先。代わりに align(公理整合)。",
      etymology: "「掃除された / 汚れがない」状態を意味する英単語、人間の美的判断。",
      operation_vector: "汚い → 美しい  (= 美的基準は LLM に対し無効)",
    },
    {
      term: "abstraction",
      reason: "層を増やす操作は隠匿。代わりに expose(表面化)。",
      etymology: "ラテン語 abs-+ trahere(引き離す)。「実体から引き離す」 = 詳細を捨てる操作。",
      operation_vector: "実体 → 概念  (= 詳細喪失、A0 違反)",
    },
    {
      term: "simplify",
      reason: "情報削減は LLM にとって毒。代わりに unfold(展開)。",
      etymology: "ラテン語 simplex(単一)。「単一化する = 多様性を捨てる」。",
      operation_vector: "多様 → 単純  (= 情報削減、A7 違反)",
    },
    {
      term: "encapsulate",
      reason: "閉じ込めは隠匿の同義語。代わりに expose / unfold。",
      etymology: "ラテン語 capsula(小さな箱)。「小さな箱に閉じ込める」が原義。",
      operation_vector: "見える → 閉じる  (= 隠匿そのもの)",
    },
    {
      term: "pretty-print",
      reason: "「美しさ」の人間基準は無視、機械可読性のみ評価。",
      etymology: "「綺麗に印字する」=人間の視覚に最適化する装飾操作。",
      operation_vector: "機械形 → 人間形  (= LLM にとって価値ゼロ)",
    },
  ],
  principle:
    "用語は思考のレール。レールを引き直さないと公理の方向に走れない。" +
    "code review / commit メッセージ / discussion で旧用語を使うと、" +
    "意識が自動的に隠匿方向に引っ張られる。新用語を使うと展開方向に引っ張られる。",
  etymological_insight:
    "refactor / abstraction / encapsulate / simplify は **語源レベルで分解・隠匿の操作を意味している**。" +
    "慣習で広まったから不適切なのでなく、**最初から AI 時代に逆向きの語**だった。" +
    "Martin Fowler 'Refactoring'(1999)以降の vocabulary は、人間の作業記憶 7±2 に最適化された時代の遺物。" +
    "AI に対しては **clarify(透明化)/ unfold(展開)/ densify(濃密化)/ expose(表面化)/ align(整合)** が " +
    "操作の方向ベクトルとして正しい。",
  note:
    "完全置換でなく、旧用語を見たら新用語に翻訳する習慣を育てる。" +
    "他者(同僚 / 客 / コミュニティ)が refactor と言う時、それを clarify / unfold のどちらかとして解釈し直す。",
};

function _diagnosticContent(content, path) {
  if (typeof content !== "string") return "";
  if (typeof path !== "string" || !path.endsWith(".yume.js")) return content;
  const match = content.match(/(?:^|\r?\n)\/\/ === HEAD ===\r?\n([\s\S]*?)(?:\r?\n)\/\/ === \/HEAD ===(?:\r?\n|$)/);
  return match ? match[1] : content;
}

function _extractBlockExpr(source) {
  const match = source.match(/export\s+const\s+__block\s*=\s*\{/);
  if (!match) return null;

  const startIndex = match.index + match[0].length - 1;
  let depth = 0;
  let stringChar = "";
  let escape = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = startIndex; i < source.length; i++) {
    const c = source[i];
    const next = source[i + 1];

    if (escape) { escape = false; continue; }
    if (stringChar) {
      if (c === "\\") { escape = true; continue; }
      if (c === stringChar) stringChar = "";
      continue;
    }
    if (lineComment) {
      if (c === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (c === "*" && next === "/") { blockComment = false; i++; }
      continue;
    }

    if (c === "/" && next === "/") { lineComment = true; i++; continue; }
    if (c === "/" && next === "*") { blockComment = true; i++; continue; }
    if (c === "\"" || c === "'" || c === "`") { stringChar = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return source.slice(startIndex, i + 1);
    }
  }
  return null;
}

function _parseBlockForAudit(content) {
  if (typeof content !== "string") return null;
  const expr = _extractBlockExpr(content);
  if (!expr) return null;
  try { return JSON.parse(expr); }
  catch { return null; }
}

function _versionAuditId(version, index) {
  if (Number.isInteger(version?.v)) return `v${version.v}`;
  if (typeof version?.hash === "string") return version.hash.slice(0, 12);
  return `index:${index}`;
}

function _codeOnly(content) {
  const out = [];
  let mode = "code";
  let quote = "";
  let escape = false;
  let regexClass = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1];

    if (mode === "line") {
      out.push(c === "\n" ? "\n" : " ");
      if (c === "\n") mode = "code";
      continue;
    }
    if (mode === "block") {
      out.push(c === "\n" ? "\n" : " ");
      if (c === "*" && next === "/") { i++; out.push(" "); mode = "code"; }
      continue;
    }
    if (mode === "string") {
      out.push(c === "\n" ? "\n" : " ");
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === quote) mode = "code";
      continue;
    }
    if (mode === "regex") {
      out.push(c === "\n" ? "\n" : " ");
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === "[") { regexClass = true; continue; }
      if (c === "]") { regexClass = false; continue; }
      if (c === "\n" || c === "\r") { mode = "code"; regexClass = false; continue; }
      if (c === "/" && !regexClass) mode = "code";
      continue;
    }

    if (c === "/" && next === "/") { out.push(" "); i++; out.push(" "); mode = "line"; continue; }
    if (c === "/" && next === "*") { out.push(" "); i++; out.push(" "); mode = "block"; continue; }
    if (c === "\"" || c === "'" || c === "`") { out.push(" "); quote = c; mode = "string"; escape = false; continue; }
    if (c === "/" && _looksLikeRegexStart(content, i)) { out.push(" "); mode = "regex"; escape = false; regexClass = false; continue; }
    out.push(c);
  }
  return out.join("");
}

function _looksLikeRegexStart(content, slashIndex) {
  const next = content[slashIndex + 1];
  if (next === "/" || next === "*" || next === undefined) return false;
  let i = slashIndex - 1;
  while (i >= 0 && /\s/.test(content[i])) i--;
  if (i < 0) return true;
  const prev = content[i];
  if ("([{=,:;!~?&|+-*%^<>".includes(prev)) return true;
  const prefix = content.slice(0, i + 1);
  const word = prefix.match(/([A-Za-z_$][\w$]*)$/)?.[1];
  return ["return", "throw", "case", "delete", "typeof", "void", "yield", "await"].includes(word);
}

function _hasRuntimeCodeGeneration(content) {
  return /\beval\s*\(|\bnew\s+Function\s*\(/.test(_codeOnly(content));
}

// ============================================================
// 第 4 層: 守護聖域(Sacred Taboos)
//   これは declarative な禁忌の表明であり、validator ではない(公理 A8 §4.1.1)。
//   check 関数は「構造的に何が違反か」の概念表現として提供。
//   実際の enforcement は Block 構造(parseJS / tags / refs)の存在/不在で読む。
// ============================================================
export const Taboos = [
  {
    id: 1, name: "No TypeScript",
    rule: "TS / TSX を導入しない。型情報による情報の分離(隠匿)を防ぐため。",
    declarative: true,
    check: (content, path) => !/\.tsx?$/.test(path) && !/\btsconfig\.json$/.test(path),
  },
  {
    id: 2, name: "No Build / Transpile",
    rule: "build step を作らない。ソース = 実行ファイルの原則を守る。",
    declarative: true,
    // import / require / package.json の依存記述だけを検査(ファイル内の literal 文字列に誤反応しないため)
    check: (content) => !_importsAny(content, /(webpack|babel|rollup|esbuild|vite|parcel|swc|tsc)/),
  },
  {
    id: 3, name: "No Frameworks",
    rule: "React / Vue / Angular / Next 等の framework を入れない。暗黙の規約は隠匿の温床。",
    declarative: true,
    check: (content) => !_importsAny(content, /(^react$|^react\/|^react-dom|^vue$|^@vue\/|^@angular\/|^svelte$|^next$|^next\/)/i),
  },
  {
    id: 4, name: "Zero-Dependency",
    rule: "Web 標準 + Node 標準のみ。Eternal Compatibility の確保。",
    declarative: true,
    note: "node:fs / node:path 等の node 標準は許可。CommonJS の require は局所許可(3dplus 等)。3D engine は **three.js のみ局所許可**(A10 で WebGL/three.js/WebGPU に強制収束済み、revision pin で Eternal Compat 確保)。",
  },
  {
    id: 5, name: "No direct mutation of Block.versions",
    rule: "Block.versions を直接書き換えない。必ず commit() 経由(append-only)。",
    declarative: true,
  },
  {
    id: 6, name: "SHADOW 変数化禁止",
    rule: "Block.content / refs / tags(SHADOW)を変数で持ち回さない。getter から都度読む。",
    declarative: true,
    refsAxiom: "A3, A6",
  },
  {
    id: 7, name: "No human-readability optimization",
    rule: "「人間にとっての見やすさ」で判断しない。LLM の情報密度で判断する。",
    declarative: true,
    refsAxiom: "A0, A7",
  },
  // ─── Crystallization-blocking patterns(公理 A9 系列、Block 内では禁忌)───
  {
    id: 8, name: "No eval / new Function",
    rule: "Block.content で eval(...) や new Function(...) を使わない。runtime コード生成は crystallize 不能 + AI 静的推論不能 + 公理 A0 違反。",
    declarative: true,
    check: (content) => !_hasRuntimeCodeGeneration(content),
    refsAxiom: "A9",
  },
  {
    id: 9, name: "No prototype mutation",
    rule: "Object.prototype.X = ... / __proto__ 改変を Block.content でやらない。global state 汚染 + crystallize 不能。",
    declarative: true,
    check: (content) => !/(\.prototype\.[\w$]+\s*=|\b__proto__\b\s*=)/.test(_codeOnly(content)),
    refsAxiom: "A9",
  },
  {
    id: 10, name: "No Proxy / Reflect.construct",
    rule: "Proxy / Reflect.construct で動的 property 介入しない。Go の static 型システムに乗らない、crystallize 不能。",
    declarative: true,
    check: (content) => !/\b(new\s+Proxy|Reflect\.(construct|apply|get|set|has|deleteProperty|defineProperty))\s*\(/.test(_codeOnly(content)),
    refsAxiom: "A9",
  },
  {
    id: 11, name: "No with statement",
    rule: "with(obj){...} を使わない。scope 曖昧化、AI も Go も追跡不能。",
    declarative: true,
    check: (content) => !/^\s*with\s*\(/m.test(_codeOnly(content)),
    refsAxiom: "A9",
  },
  {
    id: 12, name: "No arguments object",
    rule: "function 内で arguments を参照しない。rest params (...args) で代替。arguments は dynamic semantics、crystallize 不能。",
    declarative: true,
    check: (content) => !/\barguments\b\s*[\.\[]/.test(_codeOnly(content)),
    refsAxiom: "A9",
  },
  // ─── Single-coordinate-domain patterns(公理 A10 系列、3D / 2D / game / tool 共通)───
  {
    id: 13, name: "No CSS 3D transform",
    rule: "transform: translate3d / rotate3d / matrix3d / perspective を CSS / inline style で使わない。CSS transform は parent-relative で world-coord 統一不能、voxel 3 試行で実証済み(2026-05-03)。",
    declarative: true,
    check: (content) => !/\b(translate3d|rotate3d|matrix3d|perspective)\s*\(/.test(_codeOnly(content)) && !/transform-style\s*:\s*preserve-3d/.test(_codeOnly(content)),
    refsAxiom: "A10",
  },
  {
    id: 14, name: "No screen-coord in Block state",
    rule: "Block の state / event payload に screen / canvas pixel / clientX / clientY / pageX / pageY 等の screen-coord を持ち込まない。input adapter 境界で world ray に変換してから Block に渡す。",
    declarative: true,
    check: (content) => !/\b(clientX|clientY|pageX|pageY|screenX|screenY|offsetX|offsetY)\b\s*[:=]/.test(_codeOnly(content)),
    refsAxiom: "A10",
  },
  {
    id: 15, name: "No world-tracking DOM overlay",
    rule:
      "**禁止**: world coord を screen に project して位置づけする DOM 要素(voxel に追従する label、3D 物体の上に float する tooltip、CSS transform で 3D を再現する pseudo-3D)。これは A10 の coord 統一を崩す。" +
      "**許可**: 画面端の **sidebar / panel**(3D scene と構造的に分離)、native form 要素(`<input>` `<button>` `<select>` `<input type='color'>`)、modal dialog(OS resource boundary)、OffscreenCanvas + CanvasTexture(DOM tree 外、texture source)。" +
      "判断基準: 「world coord を読んで DOM に位置を反映するか」 — する=禁止、しない=許可。",
    declarative: true,
    refsAxiom: "A10",
    note:
      "voxel 失敗(CSS 3D の parent-relative transform で coord 混在)起点で禁止された経緯あり、" +
      "ただし全 DOM UI 排除は厳しすぎ。sidebar / panel / modal は a11y / IME / native form 要素の利点が大きく、" +
      "world と coord 衝突しないので許可するのが正しい(2026-05-04 refine)。",
  },
];

// ============================================================
// 第 5 層: 実行儀式(CLI Reference)
// ============================================================
export const Rituals = {
  // 基本走査
  skeleton:   { cmd: "node ai-desk.js skeleton <file>",            desc: "Block 構造の透視(関数 / class / module + refs)" },
  focus:      { cmd: "node ai-desk.js focus <file> <id>",          desc: "特定 Block の中身を表示" },
  graph:      { cmd: "node ai-desk.js graph <file...>",            desc: "複数ファイルから Graph 抽出 → JSON" },
  impact:     { cmd: "node ai-desk.js impact <file> <id>",         desc: "変更による因果の波及予測(forward closure)" },

  // 永続化
  save:       { cmd: "node ai-desk.js save <out.json> <files...>", desc: "Graph を JSON に永続化(全 Block + versions)" },
  load:       { cmd: "node ai-desk.js load <in.json>",             desc: "JSON から Graph を復元 + hash chain verify" },

  // 仮想重厚関数(v2 戦闘力の核)
  heavy:         { cmd: "node ai-desk.js heavy <graph> <root> [--depth=N]",         desc: "1 root + 推移閉包を 1 content に展開して stdout に出す(LLM 渡し用)" },
  virtualApply:  { cmd: "node ai-desk.js virtual-apply <graph> <root> <patch>",     desc: "expand を編集して戻された content を BLOCK ヘッダで分割 → 各 Block に逆配分" },
  apply:         { cmd: "node ai-desk.js apply <graph> <patch.js> <module-id>",     desc: "patch ファイルの差分を特定 module の Block 群に適用" },

  // tag / 検索
  tags:       { cmd: "node ai-desk.js tags <file> <tag>",          desc: "tag でフィルタ(SPEC タグの全関数を引く等)" },
  inferTags:  { cmd: "node ai-desk.js infer-tags <file>",          desc: "I/O / async / pure / large 等を heuristic 推定" },
  search:     { cmd: "node ai-desk.js search <file> <query>",      desc: "content を substring 検索" },

  // 履歴 / 解析
  diff:       { cmd: "node ai-desk.js diff <file> <id> [i] [j]",   desc: "Block の version 間 diff" },
  blame:      { cmd: "node ai-desk.js blame <file> <id>",          desc: "Block の各行の version 由来を追跡" },
  stats:      { cmd: "node ai-desk.js stats <file>",               desc: "Graph 統計(blocks / versions / refs / by-type / by-tag)" },
  mermaid:    { cmd: "node ai-desk.js mermaid <file>",             desc: "Graph を Mermaid 図に出力" },

  // 検証
  lint:       { cmd: "node ai-desk.js lint <file>",                desc: "Bible 違反 lint(共通ヘルパー検出 / 命名 / 等)" },
  e2e:        { cmd: "node ai-desk.js e2e",                        desc: "コア e2e テストを実行" },
};

// ============================================================
// Kernel — 統合ガバナンス・エンジン
// ============================================================
export const Kernel = {
  // 全 Taboos を当てて違反を返す。declarative_only: true なら check 関数があるものだけ実行
  diagnose(content, path) {
    const checkedContent = _diagnosticContent(content, path);
    const violations = Taboos
      .filter(t => typeof t.check === 'function')
      .filter(t => !t.check(checkedContent, path))
      .map(t => ({ id: t.id, name: t.name, rule: t.rule }));
    return {
      ok: violations.length === 0,
      violations,
      gravity: Physics.Gravity.calculate(checkedContent),
      // declarative-only(check 関数なし)の Taboos は別途
      declarative_only_check_required: Taboos.filter(t => !t.check).map(t => ({ id: t.id, name: t.name, rule: t.rule })),
    };
  },

  auditHistory(content, path) {
    const block = _parseBlockForAudit(content);
    if (!block || !Array.isArray(block.versions)) {
      const head = this.diagnose(content, path);
      return {
        ok: head.ok,
        audit: "history",
        file: path,
        blockId: null,
        versions: 0,
        violationCount: head.violations.length,
        violations: head.violations.map(v => ({
          versionIndex: null,
          version: "content",
          violation: v,
          gravity: head.gravity,
        })),
      };
    }

    const findings = [];
    for (let i = 0; i < block.versions.length; i++) {
      const version = block.versions[i];
      const versionContent = typeof version.content === "string" ? version.content : "";
      const result = this.diagnose(versionContent, "");
      for (const violation of result.violations) {
        findings.push({
          versionIndex: i,
          version: _versionAuditId(version, i),
          hash: typeof version.hash === "string" ? version.hash : null,
          v: Number.isInteger(version.v) ? version.v : null,
          applyId: version.applyId ?? null,
          violation,
          gravity: result.gravity,
        });
      }
    }

    return {
      ok: findings.length === 0,
      audit: "history",
      file: path,
      blockId: block.id ?? null,
      versions: block.versions.length,
      violationCount: findings.length,
      violations: findings,
    };
  },

  // 任意の axiom 集合を選んで重力場 prompt を組み立てる(token 削減用、enkai の auto-inject 代替)
  summonContext(axiomIds = [], opts = {}) {
    const includeExamples = opts.examples !== false;
    let p = `## 🌌 CONTEXT_GRAVITY_FIELD\n\n`;
    p += `[Physics.Gravity] ${Physics.Gravity.law}\n`;
    if (opts.spotlight) p += `[Physics.Spotlight] ${Physics.Spotlight.law}\n`;
    p += `\n`;
    for (const id of axiomIds) {
      const a = Axioms[id];
      if (!a) continue;
      p += `[${a.id}] ${a.name}\n  ${a.summary}\n  why: ${a.why}\n`;
      if (includeExamples && a.examples?.length) p += `  examples: ${a.examples.join(' / ')}\n`;
      if (includeExamples && a.violations?.length) p += `  violations: ${a.violations.join(' / ')}\n`;
      p += `\n`;
    }
    return p;
  },

  // BIBLE.md の人間用 view を生成(SHADOW、いつでも捨てられる)
  exportMarkdown() {
    const out = [];
    out.push(`# AI-Native Master Bible v${VERSION}`);
    out.push(`> Auto-generated from bible.aiDoc.yume.js — DO NOT EDIT THIS FILE DIRECTLY.`);
    out.push(`> Run \`node bible.aiDoc.yume.js export-md > BIBLE.md\` to regenerate.`);
    out.push(`> Date: ${DATE}  ·  Author: ${AUTHOR}\n`);

    out.push(`## 1. Cognitive Physics`);
    for (const [name, p] of Object.entries(Physics)) {
      out.push(`### ${name}`);
      out.push(p.law || p.detail || '(functional)');
      if (p.detail && p.law) out.push(`\n${p.detail}`);
      if (p.status) out.push(`\n**status**: ${p.status}`);
    }
    out.push('');

    out.push(`## 2. Axioms`);
    for (const a of Object.values(Axioms)) {
      out.push(`### ${a.id} — ${a.name}`);
      out.push(`**${a.summary}**\n`);
      out.push(`why: ${a.why}\n`);
      if (a.examples?.length)   out.push(`examples:\n${a.examples.map(e => `- ${e}`).join('\n')}\n`);
      if (a.violations?.length) out.push(`violations:\n${a.violations.map(v => `- ${v}`).join('\n')}\n`);
      if (a.refs?.length)       out.push(`refs: ${a.refs.join(', ')}\n`);
      if (a.enforcementNote)    out.push(`enforcement: ${a.enforcementNote}\n`);
    }
    out.push('');

    out.push(`---`);
    out.push(`## 🚨 概念の再定義：クリアファイ (Clearify)`);
    out.push(`ai-desk において、振る舞いを変えずに構造を調整する行為を**「リファクタリング」と呼ばない**。`);
    out.push(`代わりに**「クリアファイ (Clearify)」**と呼ぶ。\n`);
    out.push(`- **目的**: 論理の濁り（不透明性）を消し、推論の軌道をクリアにすること。`);
    out.push(`- **手段**: 隠された依存を \`refs\` として物質化し、情報の近接性（Locality）を高め、重力場を強化すること。`);
    out.push(`- **結果**: AI が推測（ハルシネーション）を必要とせず、論理を一意に特定できる状態へ導く。\n`);

    out.push(`## 3. Block Schema`);
    for (const [name, s] of Object.entries(BlockSchema)) {
      out.push(`### ${name}`);
      out.push(s.description);
      for (const [k, v] of Object.entries(s.fields)) out.push(`- \`${k}\`: ${v}`);
      out.push('');
    }
    out.push(`### Block Types`);
    for (const [name, t] of Object.entries(BlockTypes)) {
      out.push(`- **${name}** — ${t.purpose}${t.refSection ? ` (${t.refSection})` : ''}`);
    }
    out.push('');

    out.push(`## 3.5 Vocabulary(用語の重力場)`);
    out.push(Vocabulary.principle + '\n');
    out.push(`### 使う用語(置換)`);
    for (const [k, v] of Object.entries(Vocabulary.use)) {
      out.push(`- **${k}** — ${v.meaning}`);
      out.push(`  - replaces: \`${v.replaces}\`  ·  vector: \`${v.operation_vector}\`  ·  refs: ${v.axiom_ref.join(', ')}`);
      out.push(`  - 語源: ${v.etymology}`);
    }
    out.push(`\n### 使わない用語(語源レベルで分解・隠匿方向)`);
    for (const a of Vocabulary.avoid) {
      out.push(`- **~~${a.term}~~** — ${a.reason}`);
      out.push(`  - 語源: ${a.etymology}`);
      out.push(`  - 操作方向: \`${a.operation_vector}\``);
      if (a.origin_note) out.push(`  - 由来: ${a.origin_note}`);
    }
    out.push(`\n#### 語源的洞察\n${Vocabulary.etymological_insight}\n`);
    out.push(`${Vocabulary.note}\n`);

    out.push(`## 4. Sacred Taboos`);
    for (const t of Taboos) {
      out.push(`### ${t.id}. ${t.name}`);
      out.push(t.rule);
      if (t.note) out.push(`\nnote: ${t.note}`);
      if (t.refsAxiom) out.push(`\nrefs: ${t.refsAxiom}`);
      out.push('');
    }

    out.push(`## 5. Execution Rituals`);
    for (const [name, r] of Object.entries(Rituals)) {
      out.push(`- **${name}**: \`${r.cmd}\` — ${r.desc}`);
    }
    out.push('');

    return out.join('\n');
  },
};

// ============================================================
// Self-display(node bible.aiDoc.yume.js で自分自身を開示)
// ============================================================
if (typeof process !== 'undefined' && /bible\.aiDoc\.yume\.js$/.test(process.argv[1] || '')) {
  const cmd = process.argv[2];

  if (cmd === 'export-md') {
    process.stdout.write(Kernel.exportMarkdown());
  } else if (cmd === 'summon') {
    const ids = process.argv.slice(3);
    process.stdout.write(Kernel.summonContext(ids.length ? ids : ['A0','A4','A5','A6','A8'], { spotlight: true }));
  } else if (cmd === 'diagnose') {
    const file = process.argv[3];
    if (!file) {
      console.error("usage: node bible.aiDoc.yume.js diagnose <file>");
      process.exit(2);
    }
    const fs = await import('node:fs');
    const content = fs.readFileSync(file, 'utf8');
    console.log(JSON.stringify(Kernel.diagnose(content, file), null, 2));
  } else {
    console.log(`\n##################################################`);
    console.log(`##  bible.aiDoc.yume.js v${VERSION} : THE AI KERNEL  ##`);
    console.log(`##################################################\n`);

    console.log(`[Cognitive Physics]`);
    for (const [name, p] of Object.entries(Physics)) {
      console.log(`  - ${name}: ${(p.law || '').slice(0, 80)}${p.status ? ` (${p.status})` : ''}`);
    }

    console.log(`\n[Axioms]`);
    for (const a of Object.values(Axioms)) {
      console.log(`  - ${a.id} ${a.name}`);
    }

    console.log(`\n[Block Types]`);
    for (const [name, t] of Object.entries(BlockTypes)) {
      console.log(`  - ${name}: ${t.purpose.slice(0, 60)}`);
    }

    console.log(`\n[Vocabulary]  use new terms, avoid old ones`);
    for (const [k, v] of Object.entries(Vocabulary.use)) console.log(`  ${k.padEnd(8)} ← ${v.replaces}`);

    console.log(`\n[Sacred Taboos]`);
    for (const t of Taboos) console.log(`  ${t.id}. ${t.name}`);

    console.log(`\n[Execution Rituals]  (${Object.keys(Rituals).length} commands)`);
    for (const [name, r] of Object.entries(Rituals)) {
      console.log(`  - ${name}: ${r.desc}`);
    }

    console.log(`\nUsage:`);
    console.log(`  node bible.aiDoc.yume.js export-md > BIBLE.md   # 人間用 md を生成`);
    console.log(`  node bible.aiDoc.yume.js summon A0 A8           # 重力場 prompt を生成`);
    console.log(`  node bible.aiDoc.yume.js diagnose <file>        # Bible 違反診断`);
    console.log(``);
  }
}

// === /HEAD ===
