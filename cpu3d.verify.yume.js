// @yume-format: 1

export const __block = {
  "id": "cpu3d",
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
      "hash": "1015c5a8a72329a233d550bea581ab03dfaedfa69a1ff8b0e6bb921bd896fdda",
      "prevHash": null,
      "content": "const Cpu3D = (function () {\n\n  // ===== 行列基礎 (column-major 4x4, flat 16要素) =====\n  // WebGLと同じ規約。列優先で格納し、ベクトルは列ベクトルとして m * v で変換する。\n\n  function multiply(a, b) {\n    const out = new Array(16);\n    for (let r = 0; r < 4; r++) {\n      for (let c = 0; c < 4; c++) {\n        let s = 0;\n        for (let k = 0; k < 4; k++) s += a[r + k * 4] * b[k + c * 4];\n        out[r + c * 4] = s;\n      }\n    }\n    return out;\n  }\n\n  function translation(x, y, z) {\n    return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];\n  }\n  function rotationX(a) {\n    const c = Math.cos(a), s = Math.sin(a);\n    return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];\n  }\n  function rotationY(a) {\n    const c = Math.cos(a), s = Math.sin(a);\n    return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];\n  }\n  function rotationZ(a) {\n    const c = Math.cos(a), s = Math.sin(a);\n    return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1];\n  }\n  function scaleM(sx, sy, sz) {\n    return [sx,0,0,0, 0,sy,0,0, 0,0,sz,0, 0,0,0,1];\n  }\n\n  // ===== クォータニオン =====\n  // 表現: [x, y, z, w] (XYZW順)。単位クォータニオンは [0,0,0,1]。\n  // ジンバルロック耐性とアニメ補間（slerp）のために導入。Eulerより数値が安定する。\n\n  function quatIdentity() { return [0, 0, 0, 1]; }\n\n  function quatFromAxisAngle(axis, angle) {\n    const len = Math.hypot(axis[0], axis[1], axis[2]);\n    const ax = axis[0] / (len || 1);\n    const ay = axis[1] / (len || 1);\n    const az = axis[2] / (len || 1);\n    const half = angle * 0.5;\n    const s = Math.sin(half);\n    return [ax * s, ay * s, az * s, Math.cos(half)];\n  }\n\n  // Euler XYZ extrinsic（buildModelMatrix の Rz*Ry*Rx と一致）\n  // → 等価のクォータニオンは qz * qy * qx。手で展開せず、quatMul に任せて間違いを排する。\n  function quatFromEuler(rx, ry, rz) {\n    const qx = quatFromAxisAngle([1, 0, 0], rx);\n    const qy = quatFromAxisAngle([0, 1, 0], ry);\n    const qz = quatFromAxisAngle([0, 0, 1], rz);\n    return quatMul(qz, quatMul(qy, qx));\n  }\n\n  function quatMul(a, b) {\n    return [\n      a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],\n      a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],\n      a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],\n      a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]\n    ];\n  }\n\n  function quatNormalize(q) {\n    const len = Math.hypot(q[0], q[1], q[2], q[3]) || 1;\n    return [q[0]/len, q[1]/len, q[2]/len, q[3]/len];\n  }\n\n  function quatConjugate(q) { return [-q[0], -q[1], -q[2], q[3]]; }\n\n  function quatToMatrix(q) {\n    const x = q[0], y = q[1], z = q[2], w = q[3];\n    const xx = x*x, yy = y*y, zz = z*z;\n    const xy = x*y, xz = x*z, yz = y*z;\n    const wx = w*x, wy = w*y, wz = w*z;\n    // Column-major\n    return [\n      1 - 2*(yy + zz),   2*(xy + wz),       2*(xz - wy),       0,\n      2*(xy - wz),       1 - 2*(xx + zz),   2*(yz + wx),       0,\n      2*(xz + wy),       2*(yz - wx),       1 - 2*(xx + yy),   0,\n      0,                 0,                 0,                 1\n    ];\n  }\n\n  function quatSlerp(a, b, t) {\n    let dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];\n    let bb = b;\n    if (dot < 0) { bb = [-b[0], -b[1], -b[2], -b[3]]; dot = -dot; }\n    if (dot > 0.9995) {\n      // ほぼ平行: 線形補間で十分（数値安定）\n      return quatNormalize([\n        a[0] + (bb[0] - a[0]) * t,\n        a[1] + (bb[1] - a[1]) * t,\n        a[2] + (bb[2] - a[2]) * t,\n        a[3] + (bb[3] - a[3]) * t\n      ]);\n    }\n    const theta = Math.acos(dot);\n    const sinTheta = Math.sin(theta);\n    const sa = Math.sin((1 - t) * theta) / sinTheta;\n    const sb = Math.sin(t * theta) / sinTheta;\n    return [\n      sa * a[0] + sb * bb[0],\n      sa * a[1] + sb * bb[1],\n      sa * a[2] + sb * bb[2],\n      sa * a[3] + sb * bb[3]\n    ];\n  }\n\n  // M = T * R * S。R は transform.quaternion 優先、無ければ Euler から組み立てる。\n  function buildModelMatrix(t) {\n    const T = translation(t.position[0], t.position[1], t.position[2]);\n    let R;\n    if (Array.isArray(t.quaternion) && t.quaternion.length === 4) {\n      R = quatToMatrix(t.quaternion);\n    } else {\n      const r = t.rotation || [0, 0, 0];\n      R = multiply(rotationZ(r[2]), multiply(rotationY(r[1]), rotationX(r[0])));\n    }\n    const S = scaleM(t.scale[0], t.scale[1], t.scale[2]);\n    return multiply(T, multiply(R, S));\n  }\n\n  // ビュー行列の構築。優先順位:\n  //   1. cam.lookAt があれば lookAt ビューを使う（ゲームの追従カメラ向け）\n  //   2. cam.quaternion があればそれを反転して使う\n  //   3. 無ければ Euler の符号反転で組む（既存後方互換）\n  function buildViewMatrix(cam) {\n    if (Array.isArray(cam.lookAt) && cam.lookAt.length === 3) {\n      return buildLookAt(cam.position, cam.lookAt, cam.up || [0, 1, 0]);\n    }\n    if (Array.isArray(cam.quaternion) && cam.quaternion.length === 4) {\n      const Rinv = quatToMatrix(quatConjugate(cam.quaternion));\n      return multiply(Rinv, translation(-cam.position[0], -cam.position[1], -cam.position[2]));\n    }\n    const r = cam.rotation || [0, 0, 0];\n    return multiply(\n      rotationX(-r[0]),\n      multiply(\n        rotationY(-r[1]),\n        multiply(\n          rotationZ(-r[2]),\n          translation(-cam.position[0], -cam.position[1], -cam.position[2])\n        )\n      )\n    );\n  }\n\n  // 右手系 lookAt。view = R^T * T(-eye) と等価で、列優先で書き下した形。\n  // 軸: forward = normalize(target - eye)、xAxis = normalize(forward × up)、yAxis = xAxis × forward\n  // ビュー空間では camera が -Z を見るので、3列目は -forward。\n  function buildLookAt(eye, target, up) {\n    const fx = target[0] - eye[0];\n    const fy = target[1] - eye[1];\n    const fz = target[2] - eye[2];\n    const flen = Math.hypot(fx, fy, fz) || 1;\n    const fwdX = fx / flen, fwdY = fy / flen, fwdZ = fz / flen;\n    // s = forward × up\n    let sX = fwdY * up[2] - fwdZ * up[1];\n    let sY = fwdZ * up[0] - fwdX * up[2];\n    let sZ = fwdX * up[1] - fwdY * up[0];\n    const slen = Math.hypot(sX, sY, sZ) || 1;\n    sX /= slen; sY /= slen; sZ /= slen;\n    // u = s × forward\n    const uX = sY * fwdZ - sZ * fwdY;\n    const uY = sZ * fwdX - sX * fwdZ;\n    const uZ = sX * fwdY - sY * fwdX;\n    const dse = sX * eye[0] + sY * eye[1] + sZ * eye[2];\n    const due = uX * eye[0] + uY * eye[1] + uZ * eye[2];\n    const dfe = fwdX * eye[0] + fwdY * eye[1] + fwdZ * eye[2];\n    return [\n      sX,  uX, -fwdX, 0,\n      sY,  uY, -fwdY, 0,\n      sZ,  uZ, -fwdZ, 0,\n     -dse, -due, dfe, 1\n    ];\n  }\n\n  // 透視投影行列（OpenGL右手系・Z=-1〜+1のNDC）。WebGLと同じ規約で、\n  // GPU側がglMatrix/gl-matrix-perspectiveを使った場合と数値一致する。\n  function buildPerspective(fov, aspect, near, far) {\n    const f = 1 / Math.tan(fov / 2);\n    const nf = 1 / (near - far);\n    return [\n      f / aspect, 0, 0, 0,\n      0, f, 0, 0,\n      0, 0, (far + near) * nf, -1,\n      0, 0, 2 * far * near * nf, 0\n    ];\n  }\n\n  // 正射影行列（OpenGL右手系）。UI/2Dオーバーレイ・デバッグビュー向け。\n  // GLの glOrtho と同じ規約。\n  function buildOrthographic(left, right, bottom, top, near, far) {\n    const lr = 1 / (left - right);\n    const bt = 1 / (bottom - top);\n    const nf = 1 / (near - far);\n    return [\n      -2 * lr, 0, 0, 0,\n      0, -2 * bt, 0, 0,\n      0, 0, 2 * nf, 0,\n      (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1\n    ];\n  }\n\n  function transformVec4(m, v) {\n    const out = [0, 0, 0, 0];\n    for (let r = 0; r < 4; r++) {\n      out[r] = m[r] * v[0] + m[r + 4] * v[1] + m[r + 8] * v[2] + m[r + 12] * v[3];\n    }\n    return out;\n  }\n\n  // ===== 行列逆行列 (4x4 column-major) =====\n  // MESA gluInvertMatrix 方式。特異行列（行列式≈0）の場合は null を返す。\n  function invertMatrix(m) {\n    const inv = new Array(16);\n    inv[0]  =  m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];\n    inv[4]  = -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];\n    inv[8]  =  m[4]*m[9]*m[15]  - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];\n    inv[12] = -m[4]*m[9]*m[14]  + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];\n    inv[1]  = -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];\n    inv[5]  =  m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];\n    inv[9]  = -m[0]*m[9]*m[15]  + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];\n    inv[13] =  m[0]*m[9]*m[14]  - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];\n    inv[2]  =  m[1]*m[6]*m[15]  - m[1]*m[7]*m[14]  - m[5]*m[2]*m[15] + m[5]*m[3]*m[14] + m[13]*m[2]*m[7]  - m[13]*m[3]*m[6];\n    inv[6]  = -m[0]*m[6]*m[15]  + m[0]*m[7]*m[14]  + m[4]*m[2]*m[15] - m[4]*m[3]*m[14] - m[12]*m[2]*m[7]  + m[12]*m[3]*m[6];\n    inv[10] =  m[0]*m[5]*m[15]  - m[0]*m[7]*m[13]  - m[4]*m[1]*m[15] + m[4]*m[3]*m[13] + m[12]*m[1]*m[7]  - m[12]*m[3]*m[5];\n    inv[14] = -m[0]*m[5]*m[14]  + m[0]*m[6]*m[13]  + m[4]*m[1]*m[14] - m[4]*m[2]*m[13] - m[12]*m[1]*m[6]  + m[12]*m[2]*m[5];\n    inv[3]  = -m[1]*m[6]*m[11]  + m[1]*m[7]*m[10]  + m[5]*m[2]*m[11] - m[5]*m[3]*m[10] - m[9]*m[2]*m[7]   + m[9]*m[3]*m[6];\n    inv[7]  =  m[0]*m[6]*m[11]  - m[0]*m[7]*m[10]  - m[4]*m[2]*m[11] + m[4]*m[3]*m[10] + m[8]*m[2]*m[7]   - m[8]*m[3]*m[6];\n    inv[11] = -m[0]*m[5]*m[11]  + m[0]*m[7]*m[9]   + m[4]*m[1]*m[11] - m[4]*m[3]*m[9]  - m[8]*m[1]*m[7]   + m[8]*m[3]*m[5];\n    inv[15] =  m[0]*m[5]*m[10]  - m[0]*m[6]*m[9]   - m[4]*m[1]*m[10] + m[4]*m[2]*m[9]  + m[8]*m[1]*m[6]   - m[8]*m[2]*m[5];\n    const det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];\n    if (Math.abs(det) < 1e-15) return null;\n    const invDet = 1.0 / det;\n    return inv.map(v => v * invDet);\n  }\n\n  // ===== 法線行列 (Normal Matrix) =====\n  // 頂点法線をワールド空間に変換するための 3x3 行列 = transpose(inverse(worldMatrix の左上3x3))。\n  // スケール変形があるとき、法線を worldMatrix でそのまま変換すると向きがズレる。\n  // 戻り値: column-major 9要素。特異行列の場合は単位行列を返す。\n  function normalMatrix(worldMatrix) {\n    const inv = invertMatrix(worldMatrix);\n    if (!inv) return [1,0,0, 0,1,0, 0,0,1];\n    // transpose of upper-left 3x3 of inv (column-major 4x4 → column-major 3x3)\n    return [inv[0], inv[4], inv[8], inv[1], inv[5], inv[9], inv[2], inv[6], inv[10]];\n  }\n\n  // ===== Unproject: スクリーン座標 → ワールド空間レイ =====\n  // マウスピッキングなど、スクリーン上の点をワールド空間に逆投影する。\n  // px, py: スクリーン座標（Y=0がトップ）\n  // view, proj: projectScene の戻り値から取得\n  // viewport: { width, height }\n  // 戻り値: { origin: [x,y,z], direction: [x,y,z] } ※ direction は正規化済み\n  function unproject(px, py, view, proj, viewport) {\n    const ndcX = (2 * px / viewport.width) - 1;\n    const ndcY = 1 - (2 * py / viewport.height); // Y反転（スクリーンY=0がトップ）\n    const vp = multiply(proj, view);\n    const vpInv = invertMatrix(vp);\n    if (!vpInv) return null;\n    const nearClip = transformVec4(vpInv, [ndcX, ndcY, -1, 1]);\n    const farClip  = transformVec4(vpInv, [ndcX, ndcY,  1, 1]);\n    const nw = nearClip[3];\n    const fw = farClip[3];\n    const nx = nearClip[0]/nw, ny = nearClip[1]/nw, nz = nearClip[2]/nw;\n    const fx = farClip[0]/fw,  fy = farClip[1]/fw,  fz = farClip[2]/fw;\n    const dx = fx - nx, dy = fy - ny, dz = fz - nz;\n    const len = Math.hypot(dx, dy, dz);\n    return {\n      origin: [nx, ny, nz],\n      direction: len > 0 ? [dx/len, dy/len, dz/len] : [0, 0, -1]\n    };\n  }\n\n  // ===== メイン: projectScene =====\n  // 入力 scene:\n  //   {\n  //     objects: [\n  //       {\n  //         id: 'cube',\n  //         vertices:   [[x,y,z], ...],                // ローカル座標\n  //         triangles?: [[a,b,c], ...],                // vertices インデックス、CCW=表面\n  //         transform: {\n  //           position:   [x,y,z],\n  //           rotation:   [rx,ry,rz],                  // Euler XYZ extrinsic\n  //           quaternion: [x,y,z,w],                   // optional, あれば rotation を上書き\n  //           scale:      [sx,sy,sz]\n  //         },\n  //         parent: null | 'parentId' | parentIndex,\n  //         time?:    { offset: 0 },                   // 親時刻 + offset\n  //         alpha?:   1.0,                             // 親α × self\n  //         visible?: true,                            // 親 AND self\n  //         skin?: {                                   // Linear Blend Skinning\n  //           bones: ['bone1', 'bone2'],               // parentId と同様の解決を行う\n  //           bindPoses: [ [16], [16] ],               // 各 bone の Inverse Bind Matrix\n  //           boneIndices: [ [0,1,0,0], ... ],         // 頂点ごとの影響 bone index (max 4)\n  //           weights:     [ [0.8,0.2,0,0], ... ]      // 頂点ごとの影響度 (max 4)\n  //         }\n  //       }\n  //     ],\n  //     camera: {\n  //       position:   [x,y,z],\n  //       rotation:   [rx,ry,rz],                      // Euler、または\n  //       quaternion: [x,y,z,w],                       // あれば優先、または\n  //       lookAt:     [x,y,z],                         // あれば最優先（追従カメラ）\n  //       up?:        [x,y,z],                         // lookAt 用、default [0,1,0]\n  //       fov, aspect, near, far,                      // 透視投影用\n  //       ortho?: { left, right, bottom, top }         // あれば正射影に切替\n  //     },\n  //     viewport: { width, height },\n  //     worldTime?: 0\n  //   }\n  //\n  // 出力 result:\n  //   {\n  //     view, projection, worldForward,\n  //     objects: [\n  //       {\n  //         id, worldMatrix,\n  //         vertices: [{ local, world, view, clip, ndc, screen, inFrustum }],\n  //         triangles: [{ indices, worldNormal, worldCentroid, area, backface, allInFrustum }],\n  //         effective: { time, alpha, visible }\n  //       }\n  //     ]\n  //   }\n  function projectScene(scene) {\n    const N = scene.objects.length;\n\n    // (1) ローカル変換行列を全オブジェクトについて先に作る\n    const local = scene.objects.map(o => buildModelMatrix(o.transform));\n\n    // (2) 親参照の正規化（id文字列 or 数値index → 数値index | null）\n    const idToIdx = {};\n    scene.objects.forEach((o, i) => { if (o.id != null) idToIdx[o.id] = i; });\n    const parentIdx = scene.objects.map(o => {\n      if (o.parent == null) return null;\n      if (typeof o.parent === 'number') return o.parent;\n      const pi = idToIdx[o.parent];\n      if (pi == null) throw new Error(`unknown parent: ${o.parent}`);\n      return pi;\n    });\n\n    // (3) Level-based 階層投影（Bible §4: 再帰禁止、深さ順ループ）\n    //     深さを単一パスで決定し、深さ昇順でワールド状態を確定する。\n    const depth = new Array(N).fill(-1);\n    let pending = N;\n    while (pending > 0) {\n      let progressed = false;\n      for (let i = 0; i < N; i++) {\n        if (depth[i] !== -1) continue;\n        const p = parentIdx[i];\n        if (p == null) { depth[i] = 0; pending--; progressed = true; continue; }\n        if (depth[p] !== -1) { depth[i] = depth[p] + 1; pending--; progressed = true; }\n      }\n      if (!progressed) throw new Error('cycle in scene hierarchy');\n    }\n\n    // 投影軸: ワールド行列・時刻・透明度・生存\n    const worldM = new Array(N);\n    const worldT = new Array(N);\n    const worldA = new Array(N);\n    const worldV = new Array(N);\n    const baseTime = scene.worldTime ?? 0;\n\n    let maxDepth = 0;\n    for (let i = 0; i < N; i++) if (depth[i] > maxDepth) maxDepth = depth[i];\n\n    for (let d = 0; d <= maxDepth; d++) {\n      for (let i = 0; i < N; i++) {\n        if (depth[i] !== d) continue;\n        const o = scene.objects[i];\n        const p = parentIdx[i];\n        const localTime = (o.time && typeof o.time.offset === 'number') ? o.time.offset : 0;\n        const localAlpha = (typeof o.alpha === 'number') ? o.alpha : 1;\n        const localVis = (typeof o.visible === 'boolean') ? o.visible : true;\n        if (p == null) {\n          worldM[i] = local[i];\n          worldT[i] = baseTime + localTime;\n          worldA[i] = localAlpha;\n          worldV[i] = localVis;\n        } else {\n          worldM[i] = multiply(worldM[p], local[i]);\n          worldT[i] = worldT[p] + localTime;\n          worldA[i] = worldA[p] * localAlpha;\n          worldV[i] = worldV[p] && localVis;\n        }\n      }\n    }\n\n    // (4) ビュー・プロジェクション行列\n    const view = buildViewMatrix(scene.camera);\n    let proj;\n    if (scene.camera.ortho) {\n      const o = scene.camera.ortho;\n      proj = buildOrthographic(o.left, o.right, o.bottom, o.top, scene.camera.near, scene.camera.far);\n    } else {\n      proj = buildPerspective(\n        scene.camera.fov, scene.camera.aspect, scene.camera.near, scene.camera.far\n      );\n    }\n\n    // カメラのワールド前方向（背面カリング用）。\n    // view = R^T * T(-eye) のとき、view の3行目（rotation 部分）に\n    // ワールド点を掛けると view-space z が出る。view-space で前方は -Z なので、\n    // ワールド前方向 = -(view[2], view[6], view[10])。view 行列は直交なので長さ1。\n    const worldForward = [-view[2], -view[6], -view[10]];\n    const cameraEye = scene.camera.position || [0, 0, 0];\n    const isOrtho = !!scene.camera.ortho;\n\n    // (5) 頂点ごとの段階別出力\n    const vw = scene.viewport.width;\n    const vh = scene.viewport.height;\n    const objects = new Array(N);\n    for (let i = 0; i < N; i++) {\n      const o = scene.objects[i];\n      \n      // スキニング（LBS）の準備\n      let skinBones = null;\n      if (o.skin && Array.isArray(o.skin.bones)) {\n        skinBones = o.skin.bones.map(b => {\n          if (typeof b === 'number') return b;\n          const bi = idToIdx[b];\n          if (bi == null) throw new Error(`unknown bone: ${b}`);\n          return bi;\n        });\n      }\n\n      const verts = (o.vertices || []).map((v, vIdx) => {\n        const localV = [v[0], v[1], v[2], 1];\n        let worldV;\n\n        if (skinBones && o.skin.boneIndices && o.skin.weights) {\n          // LBS (Linear Blend Skinning)\n          // W(v) = Σ (weight_j * WorldMatrix[bone_j] * BindPose[bone_j] * localV)\n          const bIdxs = o.skin.boneIndices[vIdx] || [0,0,0,0];\n          const wts = o.skin.weights[vIdx] || [1,0,0,0];\n          worldV = [0, 0, 0, 0];\n          for (let j = 0; j < 4; j++) {\n            const w = wts[j];\n            if (w === 0) continue;\n            const b = skinBones[bIdxs[j]];\n            const bindPose = o.skin.bindPoses[bIdxs[j]];\n            const boneWorld = worldM[b];\n            \n            // localV を bindPose (逆行列) でボーンローカル空間に戻す\n            const localBoneV = transformVec4(bindPose, localV);\n            // そのボーンの現在のワールド行列で変換\n            const posedWorldV = transformVec4(boneWorld, localBoneV);\n            \n            worldV[0] += posedWorldV[0] * w;\n            worldV[1] += posedWorldV[1] * w;\n            worldV[2] += posedWorldV[2] * w;\n            worldV[3] += posedWorldV[3] * w;\n          }\n        } else {\n          // Static mesh\n          worldV = transformVec4(worldM[i], localV);\n        }\n\n        const viewV  = transformVec4(view,    worldV);\n        const clipV  = transformVec4(proj,    viewV);\n        const w = clipV[3];\n        // w<=0 は同次除算の結果が無意味（カメラ平面/背後）なので別経路\n        const safeW = (w === 0) ? 1e-30 : w;\n        const ndc = [clipV[0] / safeW, clipV[1] / safeW, clipV[2] / safeW];\n        // NDC y=+1 が上、screen y=0 が上。Y反転が必要。\n        const screen = [\n          (ndc[0] * 0.5 + 0.5) * vw,\n          (1 - (ndc[1] * 0.5 + 0.5)) * vh\n        ];\n        const inFrustum = (\n          w > 0 &&\n          clipV[0] >= -w && clipV[0] <= w &&\n          clipV[1] >= -w && clipV[1] <= w &&\n          clipV[2] >= -w && clipV[2] <= w\n        );\n        return {\n          local: [v[0], v[1], v[2]],\n          world: [worldV[0], worldV[1], worldV[2]],\n          view:  [viewV[0],  viewV[1],  viewV[2]],\n          clip:  [clipV[0],  clipV[1],  clipV[2], clipV[3]],\n          ndc,\n          screen,\n          inFrustum\n        };\n      });\n      // (6) Triangle stage (Phase 2a): per-face データと背面カリング\n      // CCW を表面とする標準規約。法線 = normalize((b-a) × (c-a))。\n      // 透視投影: dot(centroid-eye, normal) > 0。平行投影: dot(worldForward, normal) > 0。\n      const triList = (o.triangles || []).map(tri => {\n        const ai = tri[0], bi = tri[1], ci = tri[2];\n        const va = verts[ai], vb = verts[bi], vc = verts[ci];\n        if (!va || !vb || !vc) {\n          return { indices: [ai, bi, ci], error: 'invalid vertex index' };\n        }\n        // ワールド空間のエッジ\n        const ex = vb.world[0] - va.world[0];\n        const ey = vb.world[1] - va.world[1];\n        const ez = vb.world[2] - va.world[2];\n        const fx = vc.world[0] - va.world[0];\n        const fy = vc.world[1] - va.world[1];\n        const fz = vc.world[2] - va.world[2];\n        // (b-a) × (c-a)\n        let nx = ey * fz - ez * fy;\n        let ny = ez * fx - ex * fz;\n        let nz = ex * fy - ey * fx;\n        const nlen = Math.hypot(nx, ny, nz);\n        const area = nlen * 0.5;\n        let normal;\n        if (nlen > 0) {\n          normal = [nx / nlen, ny / nlen, nz / nlen];\n        } else {\n          // 退化三角形（面積0）: 法線は定義不能。0ベクトルを返し backface 判定はしない。\n          normal = [0, 0, 0];\n        }\n        const cx3 = (va.world[0] + vb.world[0] + vc.world[0]) / 3;\n        const cy3 = (va.world[1] + vb.world[1] + vc.world[1]) / 3;\n        const cz3 = (va.world[2] + vb.world[2] + vc.world[2]) / 3;\n        let dotVal;\n        if (isOrtho) {\n          dotVal = worldForward[0] * normal[0] + worldForward[1] * normal[1] + worldForward[2] * normal[2];\n        } else {\n          const dx = cx3 - cameraEye[0], dy = cy3 - cameraEye[1], dz = cz3 - cameraEye[2];\n          dotVal = dx * normal[0] + dy * normal[1] + dz * normal[2];\n        }\n        const backface = (nlen > 0) ? (dotVal > 0) : false;\n        return {\n          indices: [ai, bi, ci],\n          worldNormal: normal,\n          worldCentroid: [cx3, cy3, cz3],\n          area,\n          backface,\n          allInFrustum: !!(va.inFrustum && vb.inFrustum && vc.inFrustum)\n        };\n      });\n\n      objects[i] = {\n        id: o.id ?? i,\n        worldMatrix: worldM[i],\n        vertices: verts,\n        triangles: triList,\n        effective: { time: worldT[i], alpha: worldA[i], visible: worldV[i] }\n      };\n    }\n\n    return {\n      view,\n      projection: proj,\n      worldForward,\n      objects\n    };\n  }\n\n  // ===== 突合: assert_projectScene (Bible §7.1) =====\n  // Twin の出力と「期待値」を段階別に比較する突合関数。\n  //\n  // 入力:\n  //   twin     : projectScene の出力\n  //   expected : { objects: [{ id, vertices: [[..stage次元..], ...] }] }\n  //              vertices の各要素は比較したい段階の数値配列\n  //                stage='screen' なら [px, py]\n  //                stage='ndc'    なら [x, y, z]\n  //                stage='world'  なら [x, y, z]\n  //                stage='clip'   なら [x, y, z, w]\n  //   opts     : { eps: number=1e-6, stage: 'screen'|'world'|'view'|'ndc'|'clip'='screen' }\n  //\n  // 出力:\n  //   {\n  //     ok: bool,                            // 全頂点が eps 以内に収まったか\n  //     stage, eps,\n  //     maxError: number,                    // 全比較中の最大成分誤差（絶対値）\n  //     mismatches: [{ objectId, vertexIndex, expected, actual, delta, error? }],\n  //     firstFailure: 最初の不一致 | null\n  //   }\n  //\n  // Zero-Dep。投げない（呼び出し側で `if (!result.ok) throw ...` する）。\n  function assert_projectScene(twin, expected, opts) {\n    const eps = (opts && typeof opts.eps === 'number') ? opts.eps : 1e-6;\n    const stage = (opts && opts.stage) ? opts.stage : 'screen';\n    const mismatches = [];\n    let maxError = 0;\n    let firstFailure = null;\n\n    for (const expObj of expected.objects) {\n      const twinObj = twin.objects.find(o => o.id === expObj.id);\n      if (!twinObj) {\n        const m = { objectId: expObj.id, error: 'not found in twin' };\n        mismatches.push(m);\n        if (!firstFailure) firstFailure = m;\n        continue;\n      }\n      const expVerts = expObj.vertices || [];\n      for (let i = 0; i < expVerts.length; i++) {\n        const e = expVerts[i];\n        const tv = twinObj.vertices[i];\n        if (!tv) {\n          const m = { objectId: expObj.id, vertexIndex: i, error: 'vertex not in twin' };\n          mismatches.push(m);\n          if (!firstFailure) firstFailure = m;\n          continue;\n        }\n        const a = tv[stage];\n        if (!Array.isArray(a)) {\n          const m = { objectId: expObj.id, vertexIndex: i, error: `unknown stage '${stage}'` };\n          mismatches.push(m);\n          if (!firstFailure) firstFailure = m;\n          continue;\n        }\n        let delta = 0;\n        for (let k = 0; k < e.length; k++) {\n          const d = Math.abs(a[k] - e[k]);\n          if (d > delta) delta = d;\n        }\n        if (delta > maxError) maxError = delta;\n        if (delta > eps) {\n          const m = {\n            objectId: expObj.id,\n            vertexIndex: i,\n            expected: e.slice(),\n            actual: a.slice(0, e.length),\n            delta\n          };\n          mismatches.push(m);\n          if (!firstFailure) firstFailure = m;\n        }\n      }\n    }\n\n    return {\n      ok: mismatches.length === 0,\n      stage,\n      eps,\n      maxError,\n      mismatches,\n      firstFailure\n    };\n  }\n\n  return {\n    projectScene,\n    assert_projectScene,\n    // 検証・テスト・鉱脈採掘の入口として行列とクォータニオンを公開する\n    _math: {\n      multiply, translation,\n      rotationX, rotationY, rotationZ,\n      scaleM, buildModelMatrix, buildViewMatrix,\n      buildPerspective, buildOrthographic, buildLookAt,\n      transformVec4, invertMatrix, normalMatrix,\n      quatIdentity, quatFromAxisAngle, quatFromEuler,\n      quatMul, quatNormalize, quatConjugate, quatToMatrix, quatSlerp\n    },\n    unproject\n  };\n\n})();\nexport { Cpu3D };\n\n\n// node 3dplus/cpu3d.js で自己診断。GPUなしで頂点位置の正気を確認する。\nif (false) { // disabled\n  const { projectScene } = module.exports;\n  const scene = {\n    objects: [\n      {\n        id: 'origin', vertices: [[0,0,0]],\n        transform: { position:[0,0,-5], rotation:[0,0,0], scale:[1,1,1] },\n        parent: null\n      },\n      {\n        id: 'child', vertices: [[1,0,0]],\n        transform: { position:[0,0,0], rotation:[0,0,0], scale:[1,1,1] },\n        parent: 'origin'\n      }\n    ],\n    camera: { position:[0,0,0], rotation:[0,0,0], fov: Math.PI/2, aspect: 1, near: 0.1, far: 100 },\n    viewport: { width: 800, height: 600 }\n  };\n  const r = projectScene(scene);\n  console.log(JSON.stringify(r, null, 2));\n}\n",
      "ts": 1778788882041,
      "refs": [
        {
          "kind": "calls",
          "target": "Array"
        },
        {
          "kind": "calls",
          "target": "quatFromAxisAngle"
        },
        {
          "kind": "calls",
          "target": "quatMul"
        },
        {
          "kind": "calls",
          "target": "quatNormalize"
        },
        {
          "kind": "calls",
          "target": "translation"
        },
        {
          "kind": "calls",
          "target": "quatToMatrix"
        },
        {
          "kind": "calls",
          "target": "multiply"
        },
        {
          "kind": "calls",
          "target": "rotationZ"
        },
        {
          "kind": "calls",
          "target": "rotationY"
        },
        {
          "kind": "calls",
          "target": "rotationX"
        },
        {
          "kind": "calls",
          "target": "scaleM"
        },
        {
          "kind": "calls",
          "target": "buildLookAt"
        },
        {
          "kind": "calls",
          "target": "quatConjugate"
        },
        {
          "kind": "calls",
          "target": "invertMatrix"
        },
        {
          "kind": "calls",
          "target": "transformVec4"
        },
        {
          "kind": "calls",
          "target": "buildModelMatrix"
        },
        {
          "kind": "calls",
          "target": "Error"
        },
        {
          "kind": "calls",
          "target": "buildViewMatrix"
        },
        {
          "kind": "calls",
          "target": "buildOrthographic"
        },
        {
          "kind": "calls",
          "target": "buildPerspective"
        },
        {
          "kind": "calls",
          "target": "projectScene"
        }
      ],
      "tags": [],
      "applyId": null
    }
  ]
};

// === HEAD ===
const Cpu3D = (function () {

  // ===== 行列基礎 (column-major 4x4, flat 16要素) =====
  // WebGLと同じ規約。列優先で格納し、ベクトルは列ベクトルとして m * v で変換する。

  function multiply(a, b) {
    const out = new Array(16);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[r + k * 4] * b[k + c * 4];
        out[r + c * 4] = s;
      }
    }
    return out;
  }

  function translation(x, y, z) {
    return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
  }
  function rotationX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];
  }
  function rotationY(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];
  }
  function rotationZ(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1];
  }
  function scaleM(sx, sy, sz) {
    return [sx,0,0,0, 0,sy,0,0, 0,0,sz,0, 0,0,0,1];
  }

  // ===== クォータニオン =====
  // 表現: [x, y, z, w] (XYZW順)。単位クォータニオンは [0,0,0,1]。
  // ジンバルロック耐性とアニメ補間（slerp）のために導入。Eulerより数値が安定する。

  function quatIdentity() { return [0, 0, 0, 1]; }

  function quatFromAxisAngle(axis, angle) {
    const len = Math.hypot(axis[0], axis[1], axis[2]);
    const ax = axis[0] / (len || 1);
    const ay = axis[1] / (len || 1);
    const az = axis[2] / (len || 1);
    const half = angle * 0.5;
    const s = Math.sin(half);
    return [ax * s, ay * s, az * s, Math.cos(half)];
  }

  // Euler XYZ extrinsic（buildModelMatrix の Rz*Ry*Rx と一致）
  // → 等価のクォータニオンは qz * qy * qx。手で展開せず、quatMul に任せて間違いを排する。
  function quatFromEuler(rx, ry, rz) {
    const qx = quatFromAxisAngle([1, 0, 0], rx);
    const qy = quatFromAxisAngle([0, 1, 0], ry);
    const qz = quatFromAxisAngle([0, 0, 1], rz);
    return quatMul(qz, quatMul(qy, qx));
  }

  function quatMul(a, b) {
    return [
      a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],
      a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
      a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],
      a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]
    ];
  }

  function quatNormalize(q) {
    const len = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0]/len, q[1]/len, q[2]/len, q[3]/len];
  }

  function quatConjugate(q) { return [-q[0], -q[1], -q[2], q[3]]; }

  function quatToMatrix(q) {
    const x = q[0], y = q[1], z = q[2], w = q[3];
    const xx = x*x, yy = y*y, zz = z*z;
    const xy = x*y, xz = x*z, yz = y*z;
    const wx = w*x, wy = w*y, wz = w*z;
    // Column-major
    return [
      1 - 2*(yy + zz),   2*(xy + wz),       2*(xz - wy),       0,
      2*(xy - wz),       1 - 2*(xx + zz),   2*(yz + wx),       0,
      2*(xz + wy),       2*(yz - wx),       1 - 2*(xx + yy),   0,
      0,                 0,                 0,                 1
    ];
  }

  function quatSlerp(a, b, t) {
    let dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
    let bb = b;
    if (dot < 0) { bb = [-b[0], -b[1], -b[2], -b[3]]; dot = -dot; }
    if (dot > 0.9995) {
      // ほぼ平行: 線形補間で十分（数値安定）
      return quatNormalize([
        a[0] + (bb[0] - a[0]) * t,
        a[1] + (bb[1] - a[1]) * t,
        a[2] + (bb[2] - a[2]) * t,
        a[3] + (bb[3] - a[3]) * t
      ]);
    }
    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);
    const sa = Math.sin((1 - t) * theta) / sinTheta;
    const sb = Math.sin(t * theta) / sinTheta;
    return [
      sa * a[0] + sb * bb[0],
      sa * a[1] + sb * bb[1],
      sa * a[2] + sb * bb[2],
      sa * a[3] + sb * bb[3]
    ];
  }

  // M = T * R * S。R は transform.quaternion 優先、無ければ Euler から組み立てる。
  function buildModelMatrix(t) {
    const T = translation(t.position[0], t.position[1], t.position[2]);
    let R;
    if (Array.isArray(t.quaternion) && t.quaternion.length === 4) {
      R = quatToMatrix(t.quaternion);
    } else {
      const r = t.rotation || [0, 0, 0];
      R = multiply(rotationZ(r[2]), multiply(rotationY(r[1]), rotationX(r[0])));
    }
    const S = scaleM(t.scale[0], t.scale[1], t.scale[2]);
    return multiply(T, multiply(R, S));
  }

  // ビュー行列の構築。優先順位:
  //   1. cam.lookAt があれば lookAt ビューを使う（ゲームの追従カメラ向け）
  //   2. cam.quaternion があればそれを反転して使う
  //   3. 無ければ Euler の符号反転で組む（既存後方互換）
  function buildViewMatrix(cam) {
    if (Array.isArray(cam.lookAt) && cam.lookAt.length === 3) {
      return buildLookAt(cam.position, cam.lookAt, cam.up || [0, 1, 0]);
    }
    if (Array.isArray(cam.quaternion) && cam.quaternion.length === 4) {
      const Rinv = quatToMatrix(quatConjugate(cam.quaternion));
      return multiply(Rinv, translation(-cam.position[0], -cam.position[1], -cam.position[2]));
    }
    const r = cam.rotation || [0, 0, 0];
    return multiply(
      rotationX(-r[0]),
      multiply(
        rotationY(-r[1]),
        multiply(
          rotationZ(-r[2]),
          translation(-cam.position[0], -cam.position[1], -cam.position[2])
        )
      )
    );
  }

  // 右手系 lookAt。view = R^T * T(-eye) と等価で、列優先で書き下した形。
  // 軸: forward = normalize(target - eye)、xAxis = normalize(forward × up)、yAxis = xAxis × forward
  // ビュー空間では camera が -Z を見るので、3列目は -forward。
  function buildLookAt(eye, target, up) {
    const fx = target[0] - eye[0];
    const fy = target[1] - eye[1];
    const fz = target[2] - eye[2];
    const flen = Math.hypot(fx, fy, fz) || 1;
    const fwdX = fx / flen, fwdY = fy / flen, fwdZ = fz / flen;
    // s = forward × up
    let sX = fwdY * up[2] - fwdZ * up[1];
    let sY = fwdZ * up[0] - fwdX * up[2];
    let sZ = fwdX * up[1] - fwdY * up[0];
    const slen = Math.hypot(sX, sY, sZ) || 1;
    sX /= slen; sY /= slen; sZ /= slen;
    // u = s × forward
    const uX = sY * fwdZ - sZ * fwdY;
    const uY = sZ * fwdX - sX * fwdZ;
    const uZ = sX * fwdY - sY * fwdX;
    const dse = sX * eye[0] + sY * eye[1] + sZ * eye[2];
    const due = uX * eye[0] + uY * eye[1] + uZ * eye[2];
    const dfe = fwdX * eye[0] + fwdY * eye[1] + fwdZ * eye[2];
    return [
      sX,  uX, -fwdX, 0,
      sY,  uY, -fwdY, 0,
      sZ,  uZ, -fwdZ, 0,
     -dse, -due, dfe, 1
    ];
  }

  // 透視投影行列（OpenGL右手系・Z=-1〜+1のNDC）。WebGLと同じ規約で、
  // GPU側がglMatrix/gl-matrix-perspectiveを使った場合と数値一致する。
  function buildPerspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ];
  }

  // 正射影行列（OpenGL右手系）。UI/2Dオーバーレイ・デバッグビュー向け。
  // GLの glOrtho と同じ規約。
  function buildOrthographic(left, right, bottom, top, near, far) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    return [
      -2 * lr, 0, 0, 0,
      0, -2 * bt, 0, 0,
      0, 0, 2 * nf, 0,
      (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1
    ];
  }

  function transformVec4(m, v) {
    const out = [0, 0, 0, 0];
    for (let r = 0; r < 4; r++) {
      out[r] = m[r] * v[0] + m[r + 4] * v[1] + m[r + 8] * v[2] + m[r + 12] * v[3];
    }
    return out;
  }

  // ===== 行列逆行列 (4x4 column-major) =====
  // MESA gluInvertMatrix 方式。特異行列（行列式≈0）の場合は null を返す。
  function invertMatrix(m) {
    const inv = new Array(16);
    inv[0]  =  m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];
    inv[4]  = -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];
    inv[8]  =  m[4]*m[9]*m[15]  - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];
    inv[12] = -m[4]*m[9]*m[14]  + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];
    inv[1]  = -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];
    inv[5]  =  m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];
    inv[9]  = -m[0]*m[9]*m[15]  + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];
    inv[13] =  m[0]*m[9]*m[14]  - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];
    inv[2]  =  m[1]*m[6]*m[15]  - m[1]*m[7]*m[14]  - m[5]*m[2]*m[15] + m[5]*m[3]*m[14] + m[13]*m[2]*m[7]  - m[13]*m[3]*m[6];
    inv[6]  = -m[0]*m[6]*m[15]  + m[0]*m[7]*m[14]  + m[4]*m[2]*m[15] - m[4]*m[3]*m[14] - m[12]*m[2]*m[7]  + m[12]*m[3]*m[6];
    inv[10] =  m[0]*m[5]*m[15]  - m[0]*m[7]*m[13]  - m[4]*m[1]*m[15] + m[4]*m[3]*m[13] + m[12]*m[1]*m[7]  - m[12]*m[3]*m[5];
    inv[14] = -m[0]*m[5]*m[14]  + m[0]*m[6]*m[13]  + m[4]*m[1]*m[14] - m[4]*m[2]*m[13] - m[12]*m[1]*m[6]  + m[12]*m[2]*m[5];
    inv[3]  = -m[1]*m[6]*m[11]  + m[1]*m[7]*m[10]  + m[5]*m[2]*m[11] - m[5]*m[3]*m[10] - m[9]*m[2]*m[7]   + m[9]*m[3]*m[6];
    inv[7]  =  m[0]*m[6]*m[11]  - m[0]*m[7]*m[10]  - m[4]*m[2]*m[11] + m[4]*m[3]*m[10] + m[8]*m[2]*m[7]   - m[8]*m[3]*m[6];
    inv[11] = -m[0]*m[5]*m[11]  + m[0]*m[7]*m[9]   + m[4]*m[1]*m[11] - m[4]*m[3]*m[9]  - m[8]*m[1]*m[7]   + m[8]*m[3]*m[5];
    inv[15] =  m[0]*m[5]*m[10]  - m[0]*m[6]*m[9]   - m[4]*m[1]*m[10] + m[4]*m[2]*m[9]  + m[8]*m[1]*m[6]   - m[8]*m[2]*m[5];
    const det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];
    if (Math.abs(det) < 1e-15) return null;
    const invDet = 1.0 / det;
    return inv.map(v => v * invDet);
  }

  // ===== 法線行列 (Normal Matrix) =====
  // 頂点法線をワールド空間に変換するための 3x3 行列 = transpose(inverse(worldMatrix の左上3x3))。
  // スケール変形があるとき、法線を worldMatrix でそのまま変換すると向きがズレる。
  // 戻り値: column-major 9要素。特異行列の場合は単位行列を返す。
  function normalMatrix(worldMatrix) {
    const inv = invertMatrix(worldMatrix);
    if (!inv) return [1,0,0, 0,1,0, 0,0,1];
    // transpose of upper-left 3x3 of inv (column-major 4x4 → column-major 3x3)
    return [inv[0], inv[4], inv[8], inv[1], inv[5], inv[9], inv[2], inv[6], inv[10]];
  }

  // ===== Unproject: スクリーン座標 → ワールド空間レイ =====
  // マウスピッキングなど、スクリーン上の点をワールド空間に逆投影する。
  // px, py: スクリーン座標（Y=0がトップ）
  // view, proj: projectScene の戻り値から取得
  // viewport: { width, height }
  // 戻り値: { origin: [x,y,z], direction: [x,y,z] } ※ direction は正規化済み
  function unproject(px, py, view, proj, viewport) {
    const ndcX = (2 * px / viewport.width) - 1;
    const ndcY = 1 - (2 * py / viewport.height); // Y反転（スクリーンY=0がトップ）
    const vp = multiply(proj, view);
    const vpInv = invertMatrix(vp);
    if (!vpInv) return null;
    const nearClip = transformVec4(vpInv, [ndcX, ndcY, -1, 1]);
    const farClip  = transformVec4(vpInv, [ndcX, ndcY,  1, 1]);
    const nw = nearClip[3];
    const fw = farClip[3];
    const nx = nearClip[0]/nw, ny = nearClip[1]/nw, nz = nearClip[2]/nw;
    const fx = farClip[0]/fw,  fy = farClip[1]/fw,  fz = farClip[2]/fw;
    const dx = fx - nx, dy = fy - ny, dz = fz - nz;
    const len = Math.hypot(dx, dy, dz);
    return {
      origin: [nx, ny, nz],
      direction: len > 0 ? [dx/len, dy/len, dz/len] : [0, 0, -1]
    };
  }

  // ===== メイン: projectScene =====
  // 入力 scene:
  //   {
  //     objects: [
  //       {
  //         id: 'cube',
  //         vertices:   [[x,y,z], ...],                // ローカル座標
  //         triangles?: [[a,b,c], ...],                // vertices インデックス、CCW=表面
  //         transform: {
  //           position:   [x,y,z],
  //           rotation:   [rx,ry,rz],                  // Euler XYZ extrinsic
  //           quaternion: [x,y,z,w],                   // optional, あれば rotation を上書き
  //           scale:      [sx,sy,sz]
  //         },
  //         parent: null | 'parentId' | parentIndex,
  //         time?:    { offset: 0 },                   // 親時刻 + offset
  //         alpha?:   1.0,                             // 親α × self
  //         visible?: true,                            // 親 AND self
  //         skin?: {                                   // Linear Blend Skinning
  //           bones: ['bone1', 'bone2'],               // parentId と同様の解決を行う
  //           bindPoses: [ [16], [16] ],               // 各 bone の Inverse Bind Matrix
  //           boneIndices: [ [0,1,0,0], ... ],         // 頂点ごとの影響 bone index (max 4)
  //           weights:     [ [0.8,0.2,0,0], ... ]      // 頂点ごとの影響度 (max 4)
  //         }
  //       }
  //     ],
  //     camera: {
  //       position:   [x,y,z],
  //       rotation:   [rx,ry,rz],                      // Euler、または
  //       quaternion: [x,y,z,w],                       // あれば優先、または
  //       lookAt:     [x,y,z],                         // あれば最優先（追従カメラ）
  //       up?:        [x,y,z],                         // lookAt 用、default [0,1,0]
  //       fov, aspect, near, far,                      // 透視投影用
  //       ortho?: { left, right, bottom, top }         // あれば正射影に切替
  //     },
  //     viewport: { width, height },
  //     worldTime?: 0
  //   }
  //
  // 出力 result:
  //   {
  //     view, projection, worldForward,
  //     objects: [
  //       {
  //         id, worldMatrix,
  //         vertices: [{ local, world, view, clip, ndc, screen, inFrustum }],
  //         triangles: [{ indices, worldNormal, worldCentroid, area, backface, allInFrustum }],
  //         effective: { time, alpha, visible }
  //       }
  //     ]
  //   }
  function projectScene(scene) {
    const N = scene.objects.length;

    // (1) ローカル変換行列を全オブジェクトについて先に作る
    const local = scene.objects.map(o => buildModelMatrix(o.transform));

    // (2) 親参照の正規化（id文字列 or 数値index → 数値index | null）
    const idToIdx = {};
    scene.objects.forEach((o, i) => { if (o.id != null) idToIdx[o.id] = i; });
    const parentIdx = scene.objects.map(o => {
      if (o.parent == null) return null;
      if (typeof o.parent === 'number') return o.parent;
      const pi = idToIdx[o.parent];
      if (pi == null) throw new Error(`unknown parent: ${o.parent}`);
      return pi;
    });

    // (3) Level-based 階層投影（Bible §4: 再帰禁止、深さ順ループ）
    //     深さを単一パスで決定し、深さ昇順でワールド状態を確定する。
    const depth = new Array(N).fill(-1);
    let pending = N;
    while (pending > 0) {
      let progressed = false;
      for (let i = 0; i < N; i++) {
        if (depth[i] !== -1) continue;
        const p = parentIdx[i];
        if (p == null) { depth[i] = 0; pending--; progressed = true; continue; }
        if (depth[p] !== -1) { depth[i] = depth[p] + 1; pending--; progressed = true; }
      }
      if (!progressed) throw new Error('cycle in scene hierarchy');
    }

    // 投影軸: ワールド行列・時刻・透明度・生存
    const worldM = new Array(N);
    const worldT = new Array(N);
    const worldA = new Array(N);
    const worldV = new Array(N);
    const baseTime = scene.worldTime ?? 0;

    let maxDepth = 0;
    for (let i = 0; i < N; i++) if (depth[i] > maxDepth) maxDepth = depth[i];

    for (let d = 0; d <= maxDepth; d++) {
      for (let i = 0; i < N; i++) {
        if (depth[i] !== d) continue;
        const o = scene.objects[i];
        const p = parentIdx[i];
        const localTime = (o.time && typeof o.time.offset === 'number') ? o.time.offset : 0;
        const localAlpha = (typeof o.alpha === 'number') ? o.alpha : 1;
        const localVis = (typeof o.visible === 'boolean') ? o.visible : true;
        if (p == null) {
          worldM[i] = local[i];
          worldT[i] = baseTime + localTime;
          worldA[i] = localAlpha;
          worldV[i] = localVis;
        } else {
          worldM[i] = multiply(worldM[p], local[i]);
          worldT[i] = worldT[p] + localTime;
          worldA[i] = worldA[p] * localAlpha;
          worldV[i] = worldV[p] && localVis;
        }
      }
    }

    // (4) ビュー・プロジェクション行列
    const view = buildViewMatrix(scene.camera);
    let proj;
    if (scene.camera.ortho) {
      const o = scene.camera.ortho;
      proj = buildOrthographic(o.left, o.right, o.bottom, o.top, scene.camera.near, scene.camera.far);
    } else {
      proj = buildPerspective(
        scene.camera.fov, scene.camera.aspect, scene.camera.near, scene.camera.far
      );
    }

    // カメラのワールド前方向（背面カリング用）。
    // view = R^T * T(-eye) のとき、view の3行目（rotation 部分）に
    // ワールド点を掛けると view-space z が出る。view-space で前方は -Z なので、
    // ワールド前方向 = -(view[2], view[6], view[10])。view 行列は直交なので長さ1。
    const worldForward = [-view[2], -view[6], -view[10]];
    const cameraEye = scene.camera.position || [0, 0, 0];
    const isOrtho = !!scene.camera.ortho;

    // (5) 頂点ごとの段階別出力
    const vw = scene.viewport.width;
    const vh = scene.viewport.height;
    const objects = new Array(N);
    for (let i = 0; i < N; i++) {
      const o = scene.objects[i];
      
      // スキニング（LBS）の準備
      let skinBones = null;
      if (o.skin && Array.isArray(o.skin.bones)) {
        skinBones = o.skin.bones.map(b => {
          if (typeof b === 'number') return b;
          const bi = idToIdx[b];
          if (bi == null) throw new Error(`unknown bone: ${b}`);
          return bi;
        });
      }

      const verts = (o.vertices || []).map((v, vIdx) => {
        const localV = [v[0], v[1], v[2], 1];
        let worldV;

        if (skinBones && o.skin.boneIndices && o.skin.weights) {
          // LBS (Linear Blend Skinning)
          // W(v) = Σ (weight_j * WorldMatrix[bone_j] * BindPose[bone_j] * localV)
          const bIdxs = o.skin.boneIndices[vIdx] || [0,0,0,0];
          const wts = o.skin.weights[vIdx] || [1,0,0,0];
          worldV = [0, 0, 0, 0];
          for (let j = 0; j < 4; j++) {
            const w = wts[j];
            if (w === 0) continue;
            const b = skinBones[bIdxs[j]];
            const bindPose = o.skin.bindPoses[bIdxs[j]];
            const boneWorld = worldM[b];
            
            // localV を bindPose (逆行列) でボーンローカル空間に戻す
            const localBoneV = transformVec4(bindPose, localV);
            // そのボーンの現在のワールド行列で変換
            const posedWorldV = transformVec4(boneWorld, localBoneV);
            
            worldV[0] += posedWorldV[0] * w;
            worldV[1] += posedWorldV[1] * w;
            worldV[2] += posedWorldV[2] * w;
            worldV[3] += posedWorldV[3] * w;
          }
        } else {
          // Static mesh
          worldV = transformVec4(worldM[i], localV);
        }

        const viewV  = transformVec4(view,    worldV);
        const clipV  = transformVec4(proj,    viewV);
        const w = clipV[3];
        // w<=0 は同次除算の結果が無意味（カメラ平面/背後）なので別経路
        const safeW = (w === 0) ? 1e-30 : w;
        const ndc = [clipV[0] / safeW, clipV[1] / safeW, clipV[2] / safeW];
        // NDC y=+1 が上、screen y=0 が上。Y反転が必要。
        const screen = [
          (ndc[0] * 0.5 + 0.5) * vw,
          (1 - (ndc[1] * 0.5 + 0.5)) * vh
        ];
        const inFrustum = (
          w > 0 &&
          clipV[0] >= -w && clipV[0] <= w &&
          clipV[1] >= -w && clipV[1] <= w &&
          clipV[2] >= -w && clipV[2] <= w
        );
        return {
          local: [v[0], v[1], v[2]],
          world: [worldV[0], worldV[1], worldV[2]],
          view:  [viewV[0],  viewV[1],  viewV[2]],
          clip:  [clipV[0],  clipV[1],  clipV[2], clipV[3]],
          ndc,
          screen,
          inFrustum
        };
      });
      // (6) Triangle stage (Phase 2a): per-face データと背面カリング
      // CCW を表面とする標準規約。法線 = normalize((b-a) × (c-a))。
      // 透視投影: dot(centroid-eye, normal) > 0。平行投影: dot(worldForward, normal) > 0。
      const triList = (o.triangles || []).map(tri => {
        const ai = tri[0], bi = tri[1], ci = tri[2];
        const va = verts[ai], vb = verts[bi], vc = verts[ci];
        if (!va || !vb || !vc) {
          return { indices: [ai, bi, ci], error: 'invalid vertex index' };
        }
        // ワールド空間のエッジ
        const ex = vb.world[0] - va.world[0];
        const ey = vb.world[1] - va.world[1];
        const ez = vb.world[2] - va.world[2];
        const fx = vc.world[0] - va.world[0];
        const fy = vc.world[1] - va.world[1];
        const fz = vc.world[2] - va.world[2];
        // (b-a) × (c-a)
        let nx = ey * fz - ez * fy;
        let ny = ez * fx - ex * fz;
        let nz = ex * fy - ey * fx;
        const nlen = Math.hypot(nx, ny, nz);
        const area = nlen * 0.5;
        let normal;
        if (nlen > 0) {
          normal = [nx / nlen, ny / nlen, nz / nlen];
        } else {
          // 退化三角形（面積0）: 法線は定義不能。0ベクトルを返し backface 判定はしない。
          normal = [0, 0, 0];
        }
        const cx3 = (va.world[0] + vb.world[0] + vc.world[0]) / 3;
        const cy3 = (va.world[1] + vb.world[1] + vc.world[1]) / 3;
        const cz3 = (va.world[2] + vb.world[2] + vc.world[2]) / 3;
        let dotVal;
        if (isOrtho) {
          dotVal = worldForward[0] * normal[0] + worldForward[1] * normal[1] + worldForward[2] * normal[2];
        } else {
          const dx = cx3 - cameraEye[0], dy = cy3 - cameraEye[1], dz = cz3 - cameraEye[2];
          dotVal = dx * normal[0] + dy * normal[1] + dz * normal[2];
        }
        const backface = (nlen > 0) ? (dotVal > 0) : false;
        return {
          indices: [ai, bi, ci],
          worldNormal: normal,
          worldCentroid: [cx3, cy3, cz3],
          area,
          backface,
          allInFrustum: !!(va.inFrustum && vb.inFrustum && vc.inFrustum)
        };
      });

      objects[i] = {
        id: o.id ?? i,
        worldMatrix: worldM[i],
        vertices: verts,
        triangles: triList,
        effective: { time: worldT[i], alpha: worldA[i], visible: worldV[i] }
      };
    }

    return {
      view,
      projection: proj,
      worldForward,
      objects
    };
  }

  // ===== 突合: assert_projectScene (Bible §7.1) =====
  // Twin の出力と「期待値」を段階別に比較する突合関数。
  //
  // 入力:
  //   twin     : projectScene の出力
  //   expected : { objects: [{ id, vertices: [[..stage次元..], ...] }] }
  //              vertices の各要素は比較したい段階の数値配列
  //                stage='screen' なら [px, py]
  //                stage='ndc'    なら [x, y, z]
  //                stage='world'  なら [x, y, z]
  //                stage='clip'   なら [x, y, z, w]
  //   opts     : { eps: number=1e-6, stage: 'screen'|'world'|'view'|'ndc'|'clip'='screen' }
  //
  // 出力:
  //   {
  //     ok: bool,                            // 全頂点が eps 以内に収まったか
  //     stage, eps,
  //     maxError: number,                    // 全比較中の最大成分誤差（絶対値）
  //     mismatches: [{ objectId, vertexIndex, expected, actual, delta, error? }],
  //     firstFailure: 最初の不一致 | null
  //   }
  //
  // Zero-Dep。投げない（呼び出し側で `if (!result.ok) throw ...` する）。
  function assert_projectScene(twin, expected, opts) {
    const eps = (opts && typeof opts.eps === 'number') ? opts.eps : 1e-6;
    const stage = (opts && opts.stage) ? opts.stage : 'screen';
    const mismatches = [];
    let maxError = 0;
    let firstFailure = null;

    for (const expObj of expected.objects) {
      const twinObj = twin.objects.find(o => o.id === expObj.id);
      if (!twinObj) {
        const m = { objectId: expObj.id, error: 'not found in twin' };
        mismatches.push(m);
        if (!firstFailure) firstFailure = m;
        continue;
      }
      const expVerts = expObj.vertices || [];
      for (let i = 0; i < expVerts.length; i++) {
        const e = expVerts[i];
        const tv = twinObj.vertices[i];
        if (!tv) {
          const m = { objectId: expObj.id, vertexIndex: i, error: 'vertex not in twin' };
          mismatches.push(m);
          if (!firstFailure) firstFailure = m;
          continue;
        }
        const a = tv[stage];
        if (!Array.isArray(a)) {
          const m = { objectId: expObj.id, vertexIndex: i, error: `unknown stage '${stage}'` };
          mismatches.push(m);
          if (!firstFailure) firstFailure = m;
          continue;
        }
        let delta = 0;
        for (let k = 0; k < e.length; k++) {
          const d = Math.abs(a[k] - e[k]);
          if (d > delta) delta = d;
        }
        if (delta > maxError) maxError = delta;
        if (delta > eps) {
          const m = {
            objectId: expObj.id,
            vertexIndex: i,
            expected: e.slice(),
            actual: a.slice(0, e.length),
            delta
          };
          mismatches.push(m);
          if (!firstFailure) firstFailure = m;
        }
      }
    }

    return {
      ok: mismatches.length === 0,
      stage,
      eps,
      maxError,
      mismatches,
      firstFailure
    };
  }

  return {
    projectScene,
    assert_projectScene,
    // 検証・テスト・鉱脈採掘の入口として行列とクォータニオンを公開する
    _math: {
      multiply, translation,
      rotationX, rotationY, rotationZ,
      scaleM, buildModelMatrix, buildViewMatrix,
      buildPerspective, buildOrthographic, buildLookAt,
      transformVec4, invertMatrix, normalMatrix,
      quatIdentity, quatFromAxisAngle, quatFromEuler,
      quatMul, quatNormalize, quatConjugate, quatToMatrix, quatSlerp
    },
    unproject
  };

})();
export { Cpu3D };


// node 3dplus/cpu3d.js で自己診断。GPUなしで頂点位置の正気を確認する。
if (false) { // disabled
  const { projectScene } = module.exports;
  const scene = {
    objects: [
      {
        id: 'origin', vertices: [[0,0,0]],
        transform: { position:[0,0,-5], rotation:[0,0,0], scale:[1,1,1] },
        parent: null
      },
      {
        id: 'child', vertices: [[1,0,0]],
        transform: { position:[0,0,0], rotation:[0,0,0], scale:[1,1,1] },
        parent: 'origin'
      }
    ],
    camera: { position:[0,0,0], rotation:[0,0,0], fov: Math.PI/2, aspect: 1, near: 0.1, far: 100 },
    viewport: { width: 800, height: 600 }
  };
  const r = projectScene(scene);
  console.log(JSON.stringify(r, null, 2));
}

// === /HEAD ===

// === BOOT ===
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = __block.runtime.path ?? `./runtimes/ver${__block.runtime.version}.handle.yume.js`;
  const rt = await import(path);
  await rt.cli(import.meta.url, __block, process.argv);
}
// === /BOOT ===
