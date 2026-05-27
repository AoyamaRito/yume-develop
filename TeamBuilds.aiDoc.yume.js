// @yume-format: 1

export const __block = {
  "id": "team-builds-proposal",
  "type": "aiDoc",
  "schemaVersion": 1,
  "runtime": {
    "name": "yume",
    "version": "002"
  },
  "versions": [
    {
      "hash": "faa278db448da176774daf07cf2cd89a51c468cef91a903dfcfcf78962b93894",
      "prevHash": null,
      "content": "// TeamBuilds.aiDoc.yume.js - REAL source for Team Builds Game Proposal\n// This file is the REAL (Axiom A3). The proposal document is a SHADOW generated from this.\n\nexport const Proposal = {\n  title: \"Team Builds (チーム・ビルズ)\",\n  overview: \"レストランのボックス席でプレイ可能な、学生と企業の協力型ネゴシエートゲーム。\",\n  concept: \"1つのビル（skyscraper）を協力して建設する過程で、参加者の交渉力、チームワーク、リソース管理能力を可視化する。\",\n  target: {\n    players: \"3-4名（学生2名＋採用担当者1-2名）\",\n    playTime: \"duration-m:20\",\n    space: \"レストランのボックス席（A4サイズ1枚分程度のスペース）\"\n  },\n  mechanics: [\n    { \n      name: \"共有ブループリント\", \n      detail: \"中央に配置された目標。各階層の建設に必要なリソース（資材・資金・許可）が記されている。階層が上がるほど難易度が増す。\" \n    },\n    { \n      name: \"非対称リソース配分\", \n      detail: \"各プレイヤーには「偏った」リソースカードが配られる。一人の力では階層を完成させることはできない構造。\" \n    },\n    { \n      name: \"リアルタイム交渉\", \n      detail: \"砂時計（またはタイマー）による制限時間内での自由なカード交換。WIN-WINの提案ができるかが鍵。\" \n    },\n    {\n      name: \"建設とフィードバック\",\n      detail: \"階層が完成するたびに、ビルの一部（ブロックやカードのスタック）を積み上げる。物理的な「積み上げ」が達成感を生む。\"\n    }\n  ],\n  matchingValue: {\n    purpose: \"面接では見えない「動いている姿」を観察する。\",\n    points: [\n      \"不足リソースをどう補うか？（課題解決アプローチ）\",\n      \"相手のメリットを考えた提案ができているか？（交渉の質）\",\n      \"制限時間内でのリーダーシップとフォロワーシップ\",\n      \"失敗（崩落や時間切れ）時のリカバリーと振る舞い\"\n    ]\n  },\n  physicalDesign: {\n    components: \"ブループリントカード1枚、リソースカード40枚、階層ブロック（木製またはアクリル製小型ブロック）、タイマー\",\n    layout: \"レストランのテーブル中央にブループリントを置き、手元でカードを管理。垂直方向にブロックを積み上げるため、設置面積は最小限。\"\n  }\n};\n\nexport const exportMarkdown = () => {\n  let md = `# 企画書：${Proposal.title}\\n\\n`;\n  \n  md += `## 1. 概要\\n${Proposal.overview}\\n\\n`;\n  md += `## 2. コンセプト\\n${Proposal.concept}\\n\\n`;\n  \n  md += `## 3. ターゲット・仕様\\n`;\n  md += `- **参加者構成**: ${Proposal.target.players}\\n`;\n  md += `- **所要時間**: ${Proposal.target.playTime}\\n`;\n  md += `- **推奨環境**: ${Proposal.target.space}\\n\\n`;\n  \n  md += `## 4. ゲームシステム（メカニクス）\\n`;\n  Proposal.mechanics.forEach(m => {\n    md += `### ${m.name}\\n${m.detail}\\n\\n`;\n  });\n  \n  md += `## 5. マッチング・採用ツールとしての価値\\n`;\n  md += `${Proposal.matchingValue.purpose}\\n\\n`;\n  Proposal.matchingValue.points.forEach(p => {\n    md += `- ${p}\\n`;\n  });\n  md += `\\n`;\n  \n  md += `## 6. 物理デザイン・コンポーネント\\n`;\n  md += `- **構成要素**: ${Proposal.physicalDesign.components}\\n`;\n  md += `- **レイアウト**: ${Proposal.physicalDesign.layout}\\n`;\n  \n  return md;\n};\n",
      "ts": 1778928000000,
      "refs": [],
      "tags": [
        "game",
        "proposal"
      ],
      "applyId": null
    },
    {
      "content": "// @tags: standalone proposal\n// TeamBuilds.aiDoc.yume.js - REAL source for Team Builds Game Proposal\n// This file is the REAL (Axiom A3). The proposal document is a SHADOW generated from this.\n\nexport const Proposal = {\n  title: \"Team Builds (チーム・ビルズ)\",\n  overview: \"レストランのボックス席でプレイ可能な、学生と企業の協力型ネゴシエートゲーム。\",\n  concept: \"1つのビル（skyscraper）を協力して建設する過程で、参加者の交渉力、チームワーク、リソース管理能力を可視化する。\",\n  target: {\n    players: \"3-4名（学生2名＋採用担当者1-2名）\",\n    playTime: \"duration-m:20\",\n    space: \"レストランのボックス席（A4サイズ1枚分程度のスペース）\"\n  },\n  mechanics: [\n    { \n      name: \"共有ブループリント\", \n      detail: \"中央に配置された目標。各階層の建設に必要なリソース（資材・資金・許可）が記されている。階層が上がるほど難易度が増す。\" \n    },\n    { \n      name: \"非対称リソース配分\", \n      detail: \"各プレイヤーには「偏った」リソースカードが配られる。一人の力では階層を完成させることはできない構造。\" \n    },\n    { \n      name: \"リアルタイム交渉\", \n      detail: \"砂時計（またはタイマー）による制限時間内での自由なカード交換。WIN-WINの提案ができるかが鍵。\" \n    },\n    {\n      name: \"建設とフィードバック\",\n      detail: \"階層が完成するたびに、ビルの一部（ブロックやカードのスタック）を積み上げる。物理的な「積み上げ」が達成感を生む。\"\n    }\n  ],\n  matchingValue: {\n    purpose: \"面接では見えない「動いている姿」を観察する。\",\n    points: [\n      \"不足リソースをどう補うか？（課題解決アプローチ）\",\n      \"相手のメリットを考えた提案ができているか？（交渉の質）\",\n      \"制限時間内でのリーダーシップとフォロワーシップ\",\n      \"失敗（崩落や時間切れ）時のリカバリーと振る舞い\"\n    ]\n  },\n  physicalDesign: {\n    components: \"ブループリントカード1枚、リソースカード40枚、階層ブロック（木製またはアクリル製小型ブロック）、タイマー\",\n    layout: \"レストランのテーブル中央にブループリントを置き、手元でカードを管理。垂直方向にブロックを積み上げるため、設置面積は最小限。\"\n  }\n};\n\nexport const exportMarkdown = () => {\n  let md = `# 企画書：${Proposal.title}\\n\\n`;\n  \n  md += `## 1. 概要\\n${Proposal.overview}\\n\\n`;\n  md += `## 2. コンセプト\\n${Proposal.concept}\\n\\n`;\n  \n  md += `## 3. ターゲット・仕様\\n`;\n  md += `- **参加者構成**: ${Proposal.target.players}\\n`;\n  md += `- **所要時間**: ${Proposal.target.playTime}\\n`;\n  md += `- **推奨環境**: ${Proposal.target.space}\\n\\n`;\n  \n  md += `## 4. ゲームシステム（メカニクス）\\n`;\n  Proposal.mechanics.forEach(m => {\n    md += `### ${m.name}\\n${m.detail}\\n\\n`;\n  });\n  \n  md += `## 5. マッチング・採用ツールとしての価値\\n`;\n  md += `${Proposal.matchingValue.purpose}\\n\\n`;\n  Proposal.matchingValue.points.forEach(p => {\n    md += `- ${p}\\n`;\n  });\n  md += `\\n`;\n  \n  md += `## 6. 物理デザイン・コンポーネント\\n`;\n  md += `- **構成要素**: ${Proposal.physicalDesign.components}\\n`;\n  md += `- **レイアウト**: ${Proposal.physicalDesign.layout}\\n`;\n  \n  return md;\n};\n",
      "ts": 1779867863898,
      "refs": [],
      "tags": [
        "standalone",
        "proposal"
      ],
      "applyId": "apply-2026-05-27-23ac9f3b",
      "hash": "cc265595ae0b0ab509d66e14bb2a090a63932d5722bafea85df2f29c3a694a2b",
      "prevHash": "faa278db448da176774daf07cf2cd89a51c468cef91a903dfcfcf78962b93894"
    }
  ],
  "notes": {
    "apply:apply-2026-05-27-23ac9f3b": [
      {
        "id": "n-4281ec5a-9f9b-4264-8e25-379ece105516",
        "author": "human",
        "ts": 1779867863900,
        "text": "add @tags: standalone proposal"
      }
    ]
  }
};

// === HEAD ===
// @tags: standalone proposal
// TeamBuilds.aiDoc.yume.js - REAL source for Team Builds Game Proposal
// This file is the REAL (Axiom A3). The proposal document is a SHADOW generated from this.

export const Proposal = {
  title: "Team Builds (チーム・ビルズ)",
  overview: "レストランのボックス席でプレイ可能な、学生と企業の協力型ネゴシエートゲーム。",
  concept: "1つのビル（skyscraper）を協力して建設する過程で、参加者の交渉力、チームワーク、リソース管理能力を可視化する。",
  target: {
    players: "3-4名（学生2名＋採用担当者1-2名）",
    playTime: "duration-m:20",
    space: "レストランのボックス席（A4サイズ1枚分程度のスペース）"
  },
  mechanics: [
    { 
      name: "共有ブループリント", 
      detail: "中央に配置された目標。各階層の建設に必要なリソース（資材・資金・許可）が記されている。階層が上がるほど難易度が増す。" 
    },
    { 
      name: "非対称リソース配分", 
      detail: "各プレイヤーには「偏った」リソースカードが配られる。一人の力では階層を完成させることはできない構造。" 
    },
    { 
      name: "リアルタイム交渉", 
      detail: "砂時計（またはタイマー）による制限時間内での自由なカード交換。WIN-WINの提案ができるかが鍵。" 
    },
    {
      name: "建設とフィードバック",
      detail: "階層が完成するたびに、ビルの一部（ブロックやカードのスタック）を積み上げる。物理的な「積み上げ」が達成感を生む。"
    }
  ],
  matchingValue: {
    purpose: "面接では見えない「動いている姿」を観察する。",
    points: [
      "不足リソースをどう補うか？（課題解決アプローチ）",
      "相手のメリットを考えた提案ができているか？（交渉の質）",
      "制限時間内でのリーダーシップとフォロワーシップ",
      "失敗（崩落や時間切れ）時のリカバリーと振る舞い"
    ]
  },
  physicalDesign: {
    components: "ブループリントカード1枚、リソースカード40枚、階層ブロック（木製またはアクリル製小型ブロック）、タイマー",
    layout: "レストランのテーブル中央にブループリントを置き、手元でカードを管理。垂直方向にブロックを積み上げるため、設置面積は最小限。"
  }
};

export const exportMarkdown = () => {
  let md = `# 企画書：${Proposal.title}\n\n`;
  
  md += `## 1. 概要\n${Proposal.overview}\n\n`;
  md += `## 2. コンセプト\n${Proposal.concept}\n\n`;
  
  md += `## 3. ターゲット・仕様\n`;
  md += `- **参加者構成**: ${Proposal.target.players}\n`;
  md += `- **所要時間**: ${Proposal.target.playTime}\n`;
  md += `- **推奨環境**: ${Proposal.target.space}\n\n`;
  
  md += `## 4. ゲームシステム（メカニクス）\n`;
  Proposal.mechanics.forEach(m => {
    md += `### ${m.name}\n${m.detail}\n\n`;
  });
  
  md += `## 5. マッチング・採用ツールとしての価値\n`;
  md += `${Proposal.matchingValue.purpose}\n\n`;
  Proposal.matchingValue.points.forEach(p => {
    md += `- ${p}\n`;
  });
  md += `\n`;
  
  md += `## 6. 物理デザイン・コンポーネント\n`;
  md += `- **構成要素**: ${Proposal.physicalDesign.components}\n`;
  md += `- **レイアウト**: ${Proposal.physicalDesign.layout}\n`;
  
  return md;
};

// === /HEAD ===
