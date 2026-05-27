# start — yume-develop AI起動ショートリスト

> Generated from `runAndReadMe.aiDoc.yume.js`. Do not edit this Markdown directly.

このファイルは短い入口です。正式な運用ルールの REAL は `runAndReadMe.aiDoc.yume.js` です。

## まず理解すること

- `.yume.js` は current HEAD と append-only history を同じ JS ファイルに持つ portable Block file。
- 通常編集は HEAD のみ。`__block.versions` は手で触らず、`commit` で履歴化する。
- **差分検知 & 逆配分 (apply)**: 編集コードの適用時、現在の head と完全に同一 (content/refs/tags) なら履歴を増やさず `unchanged` とする。`heavyApply` は複数の Block をヘッダで区切って一括展開 (expand) し、編集後に各 Block へ自動的に逆配分 (apply) する核心的な仕組み。
- **Constraint Folding (静的具現化)**: 動的なコード生成 (`eval` / `new Function`) を徹底排除するため、あらゆる多次元の制約・組み合わせは、Block生成時に全世界線を静的JSONとして具現化して埋め込み、評価時はフィルタリングのみで評価する美学 (`rules.constraint.yume.js` 参照)。
- Markdown は原則 SHADOW。対応する `.aiDoc.yume.js` がある場合は REAL 側を更新して生成する。
- runtime handler (`runtimes/ver*.handle.yume.js`) は `.yume.js` 名だが `__block` を持たない plain ESM の例外。
- `yume-develop` は本体開発用。サンプルアプリや実験プロジェクトはこの中に作らず、外部の `/Users/AoyamaRito/PJs/sample/` などへ置く。

## 最初に読むファイル

```sh
sed -n '1,220p' BIBLE.md
sed -n '1,240p' runYume.js
node runYume.js runAndReadMe.aiDoc.yume.js show head --raw
node runYume.js cli.module.yume.js show head --raw
```

## Sniper Reading

`.yume.js` は履歴を含むため、必要になるまで丸ごと読まない。HEAD だけを取る。

```sh
node runYume.js <file>.yume.js show head --raw
```

## 作業別に追加で読むもの

| 作業 | 追加ファイル |
|---|---|
| エンジン | `core.module.yume.js` HEAD |
| CLI | `cli.module.yume.js` HEAD |
| ランタイム | `runtimes/ver002.handle.yume.js` |
| 形式仕様 | `BLOCKFILE.aiDoc.yume.js` HEAD |
| ランタイム仕様 | `runtime.spec.yume.js` HEAD |
| 主要テスト | `e2e.js` |

## よく使うコマンド

```sh
# HEAD だけ読む
node runYume.js <file>.yume.js show head --raw

# touched yume file を検証
node runYume.js <file>.yume.js validate

# HEAD 変更を履歴化
node runYume.js <file>.yume.js commit --note "why this change exists"

# repository graph check
npm run refs-check

# full local suite
npm test

# full repository verification
npm run verify
```

## 完了条件

- Changed .yume.js files validate.
- npm run docs:check passes when generated docs are touched.
- npm run refs-check has no new unresolved path or duplicate-id errors.
- npm test passes when runtime behavior or repository structure changes.
- README/docs stay aligned when public usage changes.

## 重いので後回しにするもの

- `BLOCKFILE.aiDoc.yume.js`: 正確な形式仕様が必要なときだけ読む。
- `bible.aiDoc.yume.js`: `BIBLE.md` で足りないときだけ読む。
- `coverage.verify.yume.js`: coverage 作業時だけ読む。
- 外部サンプル (`/Users/AoyamaRito/PJs/sample/`): yume-develop 本体作業では読まない。

## 報告形式

変更内容、検証結果、残リスクを短く報告する。
