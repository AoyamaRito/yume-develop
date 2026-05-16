// @yume-format: 1

export const __block = {
  "id": "ik",
  "type": "verify",
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
      "hash": "5a346f6f902537856866c73a1117c6f1bcce28e27b159f4bc0094234bc9ec88e",
      "prevHash": null,
      "content": "const Cpu3DIK = (function () {\n\n  // ===== ベクトル基礎演算 (内部インライン用) =====\n  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }\n  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }\n  function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }\n  function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }\n  function cross(a, b) {\n    return [\n      a[1]*b[2] - a[2]*b[1],\n      a[2]*b[0] - a[0]*b[2],\n      a[0]*b[1] - a[1]*b[0]\n    ];\n  }\n  function normalize(a) {\n    const len = Math.hypot(a[0], a[1], a[2]);\n    return len > 1e-8 ? [a[0]/len, a[1]/len, a[2]/len] : [0,0,1];\n  }\n\n  /**\n   * 2ボーンIKソルバ (Analytical Two-Bone IK)\n   * 余弦定理を用いて、3点（Root, Joint, End）のなす三角形の頂点座標を算出する。\n   * \n   * @param {number[]} root   - 親骨の付け根（大腿など）のワールド座標 [x,y,z]\n   * @param {number[]} target - 目標地点（足首を置きたい場所）のワールド座標 [x,y,z]\n   * @param {number}   len1   - 1番目の骨の長さ（rootからjointまで）\n   * @param {number}   len2   - 2番目の骨の長さ（jointからendまで）\n   * @param {number[]} pole   - 膝を曲げる方向のヒント（ポールベクトル）のワールド座標\n   * \n   * @returns {Object} - { joint: [x,y,z], end: [x,y,z], ok: boolean }\n   */\n  function solveTwoBoneIK(root, target, len1, len2, pole) {\n    const toTarget = sub(target, root);\n    const dist = Math.hypot(toTarget[0], toTarget[1], toTarget[2]);\n    \n    // 最大リーチ制限（届かない場合は直線上に伸ばす）\n    const maxLen = len1 + len2;\n    const minLen = Math.abs(len1 - len2);\n    \n    // 実際に計算に使用する距離（端点付近の数値不安定を避けるため微調整）\n    const d = Math.max(minLen, Math.min(dist, maxLen));\n    \n    // 余弦定理: len2^2 = len1^2 + d^2 - 2*len1*d * cos(alpha)\n    // d が 0 や極小の場合の除算を避ける\n    let alpha = 0;\n    if (d > 1e-8) {\n      const cosAlpha = (len1 * len1 + d * d - len2 * len2) / (2 * len1 * d);\n      alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));\n    }\n\n    // 法線平面の構築\n    const fwd = normalize(toTarget);\n    \n    // ポールベクトルがターゲット方向と重なっている場合のフォールバック\n    let poleDir = normalize(sub(pole, root));\n    let side = cross(poleDir, fwd);\n    if (dot(side, side) < 1e-8) {\n      // 軸が平行なら別のベクトルを使う\n      const ortho = (Math.abs(fwd[0]) < 0.9) ? [1,0,0] : [0,1,0];\n      side = normalize(cross(ortho, fwd));\n    } else {\n      side = normalize(side);\n    }\n    \n    const up = cross(fwd, side);\n\n    // Joint（膝）の位置算出\n    const jointPos = (alpha < 1e-7) \n      ? add(root, mul(fwd, len1)) // 伸び切っている場合は直線上に配置\n      : add(root, mul(add(mul(fwd, Math.cos(alpha)), mul(up, Math.sin(alpha))), len1));\n\n    // End（足首）の位置は、届く範囲なら target そのもの。\n    // 届かない場合は直線状に伸ばした点。\n    let endPos = target;\n    if (dist > maxLen) {\n      endPos = add(root, mul(fwd, maxLen));\n    } else if (dist < minLen) {\n      endPos = add(root, mul(fwd, minLen));\n    }\n\n    return {\n      joint: jointPos,\n      end: endPos,\n      ok: dist <= maxLen && dist >= minLen\n    };\n  }\n\n  return {\n    solveTwoBoneIK\n  };\n\n})();\nexport { Cpu3DIK };\n\n",
      "ts": 1778788882052,
      "refs": [
        {
          "kind": "calls",
          "target": "sub"
        },
        {
          "kind": "calls",
          "target": "normalize"
        },
        {
          "kind": "calls",
          "target": "cross"
        },
        {
          "kind": "calls",
          "target": "dot"
        },
        {
          "kind": "calls",
          "target": "add"
        },
        {
          "kind": "calls",
          "target": "mul"
        }
      ],
      "tags": [],
      "applyId": null
    }
  ]
};

// === HEAD ===
const Cpu3DIK = (function () {

  // ===== ベクトル基礎演算 (内部インライン用) =====
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
  function cross(a, b) {
    return [
      a[1]*b[2] - a[2]*b[1],
      a[2]*b[0] - a[0]*b[2],
      a[0]*b[1] - a[1]*b[0]
    ];
  }
  function normalize(a) {
    const len = Math.hypot(a[0], a[1], a[2]);
    return len > 1e-8 ? [a[0]/len, a[1]/len, a[2]/len] : [0,0,1];
  }

  /**
   * 2ボーンIKソルバ (Analytical Two-Bone IK)
   * 余弦定理を用いて、3点（Root, Joint, End）のなす三角形の頂点座標を算出する。
   * 
   * @param {number[]} root   - 親骨の付け根（大腿など）のワールド座標 [x,y,z]
   * @param {number[]} target - 目標地点（足首を置きたい場所）のワールド座標 [x,y,z]
   * @param {number}   len1   - 1番目の骨の長さ（rootからjointまで）
   * @param {number}   len2   - 2番目の骨の長さ（jointからendまで）
   * @param {number[]} pole   - 膝を曲げる方向のヒント（ポールベクトル）のワールド座標
   * 
   * @returns {Object} - { joint: [x,y,z], end: [x,y,z], ok: boolean }
   */
  function solveTwoBoneIK(root, target, len1, len2, pole) {
    const toTarget = sub(target, root);
    const dist = Math.hypot(toTarget[0], toTarget[1], toTarget[2]);
    
    // 最大リーチ制限（届かない場合は直線上に伸ばす）
    const maxLen = len1 + len2;
    const minLen = Math.abs(len1 - len2);
    
    // 実際に計算に使用する距離（端点付近の数値不安定を避けるため微調整）
    const d = Math.max(minLen, Math.min(dist, maxLen));
    
    // 余弦定理: len2^2 = len1^2 + d^2 - 2*len1*d * cos(alpha)
    // d が 0 や極小の場合の除算を避ける
    let alpha = 0;
    if (d > 1e-8) {
      const cosAlpha = (len1 * len1 + d * d - len2 * len2) / (2 * len1 * d);
      alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));
    }

    // 法線平面の構築
    const fwd = normalize(toTarget);
    
    // ポールベクトルがターゲット方向と重なっている場合のフォールバック
    let poleDir = normalize(sub(pole, root));
    let side = cross(poleDir, fwd);
    if (dot(side, side) < 1e-8) {
      // 軸が平行なら別のベクトルを使う
      const ortho = (Math.abs(fwd[0]) < 0.9) ? [1,0,0] : [0,1,0];
      side = normalize(cross(ortho, fwd));
    } else {
      side = normalize(side);
    }
    
    const up = cross(fwd, side);

    // Joint（膝）の位置算出
    const jointPos = (alpha < 1e-7) 
      ? add(root, mul(fwd, len1)) // 伸び切っている場合は直線上に配置
      : add(root, mul(add(mul(fwd, Math.cos(alpha)), mul(up, Math.sin(alpha))), len1));

    // End（足首）の位置は、届く範囲なら target そのもの。
    // 届かない場合は直線状に伸ばした点。
    let endPos = target;
    if (dist > maxLen) {
      endPos = add(root, mul(fwd, maxLen));
    } else if (dist < minLen) {
      endPos = add(root, mul(fwd, minLen));
    }

    return {
      joint: jointPos,
      end: endPos,
      ok: dist <= maxLen && dist >= minLen
    };
  }

  return {
    solveTwoBoneIK
  };

})();
export { Cpu3DIK };


// === /HEAD ===
