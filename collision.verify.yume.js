// @yume-format: 1

export const __block = {
  "id": "collision",
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
      "hash": "70a706b913c038736cf8c21c38c40fac95ac184af2afbc5512069291431a0580",
      "prevHash": null,
      "content": "const Cpu3DCollision = (function () {\n\n  // ===== ベクトル基礎演算 (インライン展開を推奨するが、可読性のためヘルパー化) =====\n  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }\n  function cross(a, b) {\n    return [\n      a[1]*b[2] - a[2]*b[1],\n      a[2]*b[0] - a[0]*b[2],\n      a[0]*b[1] - a[1]*b[0]\n    ];\n  }\n  function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }\n  function normalize(a) {\n    const len = Math.hypot(a[0], a[1], a[2]);\n    return len > 0 ? [a[0]/len, a[1]/len, a[2]/len] : [0,0,0];\n  }\n\n  // ===== AABB (Axis-Aligned Bounding Box) =====\n  // 表現: { min: [x,y,z], max: [x,y,z] }\n  \n  // 頂点群からAABBを計算\n  function computeAABB(vertices) {\n    if (!vertices || vertices.length === 0) return { min: [0,0,0], max: [0,0,0] };\n    const min = [Infinity, Infinity, Infinity];\n    const max = [-Infinity, -Infinity, -Infinity];\n    for (let i = 0; i < vertices.length; i++) {\n      const v = vertices[i];\n      if (v[0] < min[0]) min[0] = v[0];\n      if (v[1] < min[1]) min[1] = v[1];\n      if (v[2] < min[2]) min[2] = v[2];\n      if (v[0] > max[0]) max[0] = v[0];\n      if (v[1] > max[1]) max[1] = v[1];\n      if (v[2] > max[2]) max[2] = v[2];\n    }\n    return { min, max };\n  }\n\n  // AABB vs AABB の交差判定\n  function intersectAABB(a, b) {\n    return (\n      a.min[0] <= b.max[0] && a.max[0] >= b.min[0] &&\n      a.min[1] <= b.max[1] && a.max[1] >= b.min[1] &&\n      a.min[2] <= b.max[2] && a.max[2] >= b.min[2]\n    );\n  }\n\n  // ===== Sphere (球) =====\n  // 表現: { center: [x,y,z], radius: number }\n\n  // 頂点群と中心座標から包含球(Bounding Sphere)を計算\n  function computeBoundingSphere(vertices, center) {\n    if (!vertices || vertices.length === 0) return { center: center || [0,0,0], radius: 0 };\n    let maxDistSq = 0;\n    const cx = center[0], cy = center[1], cz = center[2];\n    for (let i = 0; i < vertices.length; i++) {\n      const v = vertices[i];\n      const dx = v[0] - cx;\n      const dy = v[1] - cy;\n      const dz = v[2] - cz;\n      const distSq = dx*dx + dy*dy + dz*dz;\n      if (distSq > maxDistSq) maxDistSq = distSq;\n    }\n    return { center, radius: Math.sqrt(maxDistSq) };\n  }\n\n  // 球 vs 球 の交差判定\n  function intersectSphere(a, b) {\n    const dx = a.center[0] - b.center[0];\n    const dy = a.center[1] - b.center[1];\n    const dz = a.center[2] - b.center[2];\n    const distSq = dx*dx + dy*dy + dz*dz;\n    const rSum = a.radius + b.radius;\n    return distSq <= rSum * rSum;\n  }\n\n  // 球 vs AABB の交差判定\n  // AABB内の球中心に最も近い点を求め、その距離が半径以内かチェック\n  function intersectSphereAABB(sphere, aabb) {\n    let closestX = Math.max(aabb.min[0], Math.min(sphere.center[0], aabb.max[0]));\n    let closestY = Math.max(aabb.min[1], Math.min(sphere.center[1], aabb.max[1]));\n    let closestZ = Math.max(aabb.min[2], Math.min(sphere.center[2], aabb.max[2]));\n\n    const dx = closestX - sphere.center[0];\n    const dy = closestY - sphere.center[1];\n    const dz = closestZ - sphere.center[2];\n    return (dx*dx + dy*dy + dz*dz) <= (sphere.radius * sphere.radius);\n  }\n\n  // ===== Ray (光線) =====\n  // 表現: { origin: [x,y,z], direction: [x,y,z] } ※directionは正規化済みであること\n\n  // Ray vs AABB\n  // Slab method (Liang-Barsky / Smits)\n  function intersectRayAABB(ray, aabb) {\n    let tmin = -Infinity, tmax = Infinity;\n    \n    for (let i = 0; i < 3; i++) {\n      if (Math.abs(ray.direction[i]) < 1e-8) {\n        // レイが軸に平行な場合\n        if (ray.origin[i] < aabb.min[i] || ray.origin[i] > aabb.max[i]) return null;\n      } else {\n        const invD = 1.0 / ray.direction[i];\n        let t0 = (aabb.min[i] - ray.origin[i]) * invD;\n        let t1 = (aabb.max[i] - ray.origin[i]) * invD;\n        if (t0 > t1) { const tmp = t0; t0 = t1; t1 = tmp; }\n        \n        tmin = Math.max(tmin, t0);\n        tmax = Math.min(tmax, t1);\n        if (tmax < tmin) return null;\n      }\n    }\n    \n    if (tmax < 0) return null; // AABBがレイの後方にある\n    \n    const t = tmin < 0 ? tmax : tmin; // レイの起点がAABB内部ならtmaxを返す\n    return {\n      t,\n      point: [\n        ray.origin[0] + ray.direction[0] * t,\n        ray.origin[1] + ray.direction[1] * t,\n        ray.origin[2] + ray.direction[2] * t\n      ]\n    };\n  }\n\n  // Ray vs Sphere\n  // 解析的二次方程式法。d·d=1 を仮定（方向は正規化済み）。\n  // 判別式 disc = (d·oc)^2 - (oc·oc - r^2)。disc < 0 → 交差なし。\n  function intersectRaySphere(ray, sphere) {\n    const EPSILON = 1e-8;\n    const ocx = ray.origin[0] - sphere.center[0];\n    const ocy = ray.origin[1] - sphere.center[1];\n    const ocz = ray.origin[2] - sphere.center[2];\n    const b = ocx * ray.direction[0] + ocy * ray.direction[1] + ocz * ray.direction[2];\n    const c = ocx*ocx + ocy*ocy + ocz*ocz - sphere.radius * sphere.radius;\n    const disc = b * b - c;\n    if (disc < 0) return null;\n    const sqrtDisc = Math.sqrt(disc);\n    let t = -b - sqrtDisc; // 近点\n    if (t < EPSILON) t = -b + sqrtDisc; // 球の内部から: 遠点を採用\n    if (t < EPSILON) return null; // 球がレイの後方\n    return {\n      t,\n      point: [\n        ray.origin[0] + ray.direction[0] * t,\n        ray.origin[1] + ray.direction[1] * t,\n        ray.origin[2] + ray.direction[2] * t\n      ]\n    };\n  }\n\n  // Ray vs Triangle\n  // Möller–Trumbore intersection algorithm\n  function intersectRayTriangle(ray, v0, v1, v2) {\n    const EPSILON = 1e-8;\n    const edge1 = sub(v1, v0);\n    const edge2 = sub(v2, v0);\n    const h = cross(ray.direction, edge2);\n    const a = dot(edge1, h);\n\n    if (a > -EPSILON && a < EPSILON) return null; // レイが三角形と平行\n\n    const f = 1.0 / a;\n    const s = sub(ray.origin, v0);\n    const u = f * dot(s, h);\n\n    if (u < 0.0 || u > 1.0) return null;\n\n    const q = cross(s, edge1);\n    const v = f * dot(ray.direction, q);\n\n    if (v < 0.0 || u + v > 1.0) return null;\n\n    const t = f * dot(edge2, q);\n\n    if (t > EPSILON) {\n      // 交差あり\n      return {\n        t,\n        u,\n        v,\n        point: [\n          ray.origin[0] + ray.direction[0] * t,\n          ray.origin[1] + ray.direction[1] * t,\n          ray.origin[2] + ray.direction[2] * t\n        ]\n      };\n    }\n    \n    // 線分交差だが、t < 0 つまりカメラの後ろ\n    return null;\n  }\n\n  // ===== 視錐台 (Frustum) =====\n  // Gribb-Hartmann 法: 結合行列 VP (column-major) の行から6平面を抽出する。\n  // 各平面は { normal:[a,b,c], d } で、a*x+b*y+c*z+d >= 0 が「視錐台の内側」を意味する。\n  // normalは正規化済み。\n  function extractFrustumPlanes(vp) {\n    // column-majorの行: row[i] = [vp[i], vp[i+4], vp[i+8], vp[i+12]]\n    function plane(a, b, c, d) {\n      const len = Math.hypot(a, b, c);\n      return len > 0 ? { normal: [a/len, b/len, c/len], d: d/len } : { normal: [0,0,0], d: 0 };\n    }\n    return [\n      plane(vp[3]+vp[0], vp[7]+vp[4], vp[11]+vp[8],  vp[15]+vp[12]), // Left:   row3+row0\n      plane(vp[3]-vp[0], vp[7]-vp[4], vp[11]-vp[8],  vp[15]-vp[12]), // Right:  row3-row0\n      plane(vp[3]+vp[1], vp[7]+vp[5], vp[11]+vp[9],  vp[15]+vp[13]), // Bottom: row3+row1\n      plane(vp[3]-vp[1], vp[7]-vp[5], vp[11]-vp[9],  vp[15]-vp[13]), // Top:    row3-row1\n      plane(vp[3]+vp[2], vp[7]+vp[6], vp[11]+vp[10], vp[15]+vp[14]), // Near:   row3+row2\n      plane(vp[3]-vp[2], vp[7]-vp[6], vp[11]-vp[10], vp[15]-vp[14]), // Far:    row3-row2\n    ];\n  }\n\n  // AABB vs 視錐台: false なら完全に視錐台の外（カリング可）。true なら交差または内部。\n  // \"positive vertex\" 法: 各平面の法線方向で最遠の頂点が外側にあれば確定カリング。\n  function isAABBInFrustum(aabb, planes) {\n    for (let i = 0; i < planes.length; i++) {\n      const { normal, d } = planes[i];\n      const px = normal[0] >= 0 ? aabb.max[0] : aabb.min[0];\n      const py = normal[1] >= 0 ? aabb.max[1] : aabb.min[1];\n      const pz = normal[2] >= 0 ? aabb.max[2] : aabb.min[2];\n      if (normal[0]*px + normal[1]*py + normal[2]*pz + d < 0) return false;\n    }\n    return true;\n  }\n\n  // 球 vs 視錐台: false なら完全に視錐台の外。true なら交差または内部。\n  function isSphereInFrustum(sphere, planes) {\n    const [cx, cy, cz] = sphere.center;\n    for (let i = 0; i < planes.length; i++) {\n      const { normal, d } = planes[i];\n      if (normal[0]*cx + normal[1]*cy + normal[2]*cz + d < -sphere.radius) return false;\n    }\n    return true;\n  }\n\n  return {\n    computeAABB,\n    intersectAABB,\n    computeBoundingSphere,\n    intersectSphere,\n    intersectSphereAABB,\n    intersectRayAABB,\n    intersectRaySphere,\n    intersectRayTriangle,\n    extractFrustumPlanes,\n    isAABBInFrustum,\n    isSphereInFrustum\n  };\n\n})();\nexport { Cpu3DCollision };\n\n",
      "ts": 1778788882050,
      "refs": [
        {
          "kind": "calls",
          "target": "sub"
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
          "target": "plane"
        }
      ],
      "tags": [],
      "applyId": null
    },
    {
      "content": "// @tags: 3dplus verify\nconst Cpu3DCollision = (function () {\n\n  // ===== ベクトル基礎演算 (インライン展開を推奨するが、可読性のためヘルパー化) =====\n  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }\n  function cross(a, b) {\n    return [\n      a[1]*b[2] - a[2]*b[1],\n      a[2]*b[0] - a[0]*b[2],\n      a[0]*b[1] - a[1]*b[0]\n    ];\n  }\n  function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }\n  function normalize(a) {\n    const len = Math.hypot(a[0], a[1], a[2]);\n    return len > 0 ? [a[0]/len, a[1]/len, a[2]/len] : [0,0,0];\n  }\n\n  // ===== AABB (Axis-Aligned Bounding Box) =====\n  // 表現: { min: [x,y,z], max: [x,y,z] }\n  \n  // 頂点群からAABBを計算\n  function computeAABB(vertices) {\n    if (!vertices || vertices.length === 0) return { min: [0,0,0], max: [0,0,0] };\n    const min = [Infinity, Infinity, Infinity];\n    const max = [-Infinity, -Infinity, -Infinity];\n    for (let i = 0; i < vertices.length; i++) {\n      const v = vertices[i];\n      if (v[0] < min[0]) min[0] = v[0];\n      if (v[1] < min[1]) min[1] = v[1];\n      if (v[2] < min[2]) min[2] = v[2];\n      if (v[0] > max[0]) max[0] = v[0];\n      if (v[1] > max[1]) max[1] = v[1];\n      if (v[2] > max[2]) max[2] = v[2];\n    }\n    return { min, max };\n  }\n\n  // AABB vs AABB の交差判定\n  function intersectAABB(a, b) {\n    return (\n      a.min[0] <= b.max[0] && a.max[0] >= b.min[0] &&\n      a.min[1] <= b.max[1] && a.max[1] >= b.min[1] &&\n      a.min[2] <= b.max[2] && a.max[2] >= b.min[2]\n    );\n  }\n\n  // ===== Sphere (球) =====\n  // 表現: { center: [x,y,z], radius: number }\n\n  // 頂点群と中心座標から包含球(Bounding Sphere)を計算\n  function computeBoundingSphere(vertices, center) {\n    if (!vertices || vertices.length === 0) return { center: center || [0,0,0], radius: 0 };\n    let maxDistSq = 0;\n    const cx = center[0], cy = center[1], cz = center[2];\n    for (let i = 0; i < vertices.length; i++) {\n      const v = vertices[i];\n      const dx = v[0] - cx;\n      const dy = v[1] - cy;\n      const dz = v[2] - cz;\n      const distSq = dx*dx + dy*dy + dz*dz;\n      if (distSq > maxDistSq) maxDistSq = distSq;\n    }\n    return { center, radius: Math.sqrt(maxDistSq) };\n  }\n\n  // 球 vs 球 の交差判定\n  function intersectSphere(a, b) {\n    const dx = a.center[0] - b.center[0];\n    const dy = a.center[1] - b.center[1];\n    const dz = a.center[2] - b.center[2];\n    const distSq = dx*dx + dy*dy + dz*dz;\n    const rSum = a.radius + b.radius;\n    return distSq <= rSum * rSum;\n  }\n\n  // 球 vs AABB の交差判定\n  // AABB内の球中心に最も近い点を求め、その距離が半径以内かチェック\n  function intersectSphereAABB(sphere, aabb) {\n    let closestX = Math.max(aabb.min[0], Math.min(sphere.center[0], aabb.max[0]));\n    let closestY = Math.max(aabb.min[1], Math.min(sphere.center[1], aabb.max[1]));\n    let closestZ = Math.max(aabb.min[2], Math.min(sphere.center[2], aabb.max[2]));\n\n    const dx = closestX - sphere.center[0];\n    const dy = closestY - sphere.center[1];\n    const dz = closestZ - sphere.center[2];\n    return (dx*dx + dy*dy + dz*dz) <= (sphere.radius * sphere.radius);\n  }\n\n  // ===== Ray (光線) =====\n  // 表現: { origin: [x,y,z], direction: [x,y,z] } ※directionは正規化済みであること\n\n  // Ray vs AABB\n  // Slab method (Liang-Barsky / Smits)\n  function intersectRayAABB(ray, aabb) {\n    let tmin = -Infinity, tmax = Infinity;\n    \n    for (let i = 0; i < 3; i++) {\n      if (Math.abs(ray.direction[i]) < 1e-8) {\n        // レイが軸に平行な場合\n        if (ray.origin[i] < aabb.min[i] || ray.origin[i] > aabb.max[i]) return null;\n      } else {\n        const invD = 1.0 / ray.direction[i];\n        let t0 = (aabb.min[i] - ray.origin[i]) * invD;\n        let t1 = (aabb.max[i] - ray.origin[i]) * invD;\n        if (t0 > t1) { const tmp = t0; t0 = t1; t1 = tmp; }\n        \n        tmin = Math.max(tmin, t0);\n        tmax = Math.min(tmax, t1);\n        if (tmax < tmin) return null;\n      }\n    }\n    \n    if (tmax < 0) return null; // AABBがレイの後方にある\n    \n    const t = tmin < 0 ? tmax : tmin; // レイの起点がAABB内部ならtmaxを返す\n    return {\n      t,\n      point: [\n        ray.origin[0] + ray.direction[0] * t,\n        ray.origin[1] + ray.direction[1] * t,\n        ray.origin[2] + ray.direction[2] * t\n      ]\n    };\n  }\n\n  // Ray vs Sphere\n  // 解析的二次方程式法。d·d=1 を仮定（方向は正規化済み）。\n  // 判別式 disc = (d·oc)^2 - (oc·oc - r^2)。disc < 0 → 交差なし。\n  function intersectRaySphere(ray, sphere) {\n    const EPSILON = 1e-8;\n    const ocx = ray.origin[0] - sphere.center[0];\n    const ocy = ray.origin[1] - sphere.center[1];\n    const ocz = ray.origin[2] - sphere.center[2];\n    const b = ocx * ray.direction[0] + ocy * ray.direction[1] + ocz * ray.direction[2];\n    const c = ocx*ocx + ocy*ocy + ocz*ocz - sphere.radius * sphere.radius;\n    const disc = b * b - c;\n    if (disc < 0) return null;\n    const sqrtDisc = Math.sqrt(disc);\n    let t = -b - sqrtDisc; // 近点\n    if (t < EPSILON) t = -b + sqrtDisc; // 球の内部から: 遠点を採用\n    if (t < EPSILON) return null; // 球がレイの後方\n    return {\n      t,\n      point: [\n        ray.origin[0] + ray.direction[0] * t,\n        ray.origin[1] + ray.direction[1] * t,\n        ray.origin[2] + ray.direction[2] * t\n      ]\n    };\n  }\n\n  // Ray vs Triangle\n  // Möller–Trumbore intersection algorithm\n  function intersectRayTriangle(ray, v0, v1, v2) {\n    const EPSILON = 1e-8;\n    const edge1 = sub(v1, v0);\n    const edge2 = sub(v2, v0);\n    const h = cross(ray.direction, edge2);\n    const a = dot(edge1, h);\n\n    if (a > -EPSILON && a < EPSILON) return null; // レイが三角形と平行\n\n    const f = 1.0 / a;\n    const s = sub(ray.origin, v0);\n    const u = f * dot(s, h);\n\n    if (u < 0.0 || u > 1.0) return null;\n\n    const q = cross(s, edge1);\n    const v = f * dot(ray.direction, q);\n\n    if (v < 0.0 || u + v > 1.0) return null;\n\n    const t = f * dot(edge2, q);\n\n    if (t > EPSILON) {\n      // 交差あり\n      return {\n        t,\n        u,\n        v,\n        point: [\n          ray.origin[0] + ray.direction[0] * t,\n          ray.origin[1] + ray.direction[1] * t,\n          ray.origin[2] + ray.direction[2] * t\n        ]\n      };\n    }\n    \n    // 線分交差だが、t < 0 つまりカメラの後ろ\n    return null;\n  }\n\n  // ===== 視錐台 (Frustum) =====\n  // Gribb-Hartmann 法: 結合行列 VP (column-major) の行から6平面を抽出する。\n  // 各平面は { normal:[a,b,c], d } で、a*x+b*y+c*z+d >= 0 が「視錐台の内側」を意味する。\n  // normalは正規化済み。\n  function extractFrustumPlanes(vp) {\n    // column-majorの行: row[i] = [vp[i], vp[i+4], vp[i+8], vp[i+12]]\n    function plane(a, b, c, d) {\n      const len = Math.hypot(a, b, c);\n      return len > 0 ? { normal: [a/len, b/len, c/len], d: d/len } : { normal: [0,0,0], d: 0 };\n    }\n    return [\n      plane(vp[3]+vp[0], vp[7]+vp[4], vp[11]+vp[8],  vp[15]+vp[12]), // Left:   row3+row0\n      plane(vp[3]-vp[0], vp[7]-vp[4], vp[11]-vp[8],  vp[15]-vp[12]), // Right:  row3-row0\n      plane(vp[3]+vp[1], vp[7]+vp[5], vp[11]+vp[9],  vp[15]+vp[13]), // Bottom: row3+row1\n      plane(vp[3]-vp[1], vp[7]-vp[5], vp[11]-vp[9],  vp[15]-vp[13]), // Top:    row3-row1\n      plane(vp[3]+vp[2], vp[7]+vp[6], vp[11]+vp[10], vp[15]+vp[14]), // Near:   row3+row2\n      plane(vp[3]-vp[2], vp[7]-vp[6], vp[11]-vp[10], vp[15]-vp[14]), // Far:    row3-row2\n    ];\n  }\n\n  // AABB vs 視錐台: false なら完全に視錐台の外（カリング可）。true なら交差または内部。\n  // \"positive vertex\" 法: 各平面の法線方向で最遠の頂点が外側にあれば確定カリング。\n  function isAABBInFrustum(aabb, planes) {\n    for (let i = 0; i < planes.length; i++) {\n      const { normal, d } = planes[i];\n      const px = normal[0] >= 0 ? aabb.max[0] : aabb.min[0];\n      const py = normal[1] >= 0 ? aabb.max[1] : aabb.min[1];\n      const pz = normal[2] >= 0 ? aabb.max[2] : aabb.min[2];\n      if (normal[0]*px + normal[1]*py + normal[2]*pz + d < 0) return false;\n    }\n    return true;\n  }\n\n  // 球 vs 視錐台: false なら完全に視錐台の外。true なら交差または内部。\n  function isSphereInFrustum(sphere, planes) {\n    const [cx, cy, cz] = sphere.center;\n    for (let i = 0; i < planes.length; i++) {\n      const { normal, d } = planes[i];\n      if (normal[0]*cx + normal[1]*cy + normal[2]*cz + d < -sphere.radius) return false;\n    }\n    return true;\n  }\n\n  return {\n    computeAABB,\n    intersectAABB,\n    computeBoundingSphere,\n    intersectSphere,\n    intersectSphereAABB,\n    intersectRayAABB,\n    intersectRaySphere,\n    intersectRayTriangle,\n    extractFrustumPlanes,\n    isAABBInFrustum,\n    isSphereInFrustum\n  };\n\n})();\nexport { Cpu3DCollision };\n\n",
      "ts": 1779867855614,
      "refs": [
        {
          "kind": "calls",
          "target": "sub"
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
          "target": "plane"
        }
      ],
      "tags": [
        "3dplus",
        "verify"
      ],
      "applyId": "apply-2026-05-27-3b63d732",
      "hash": "2eb766d6ec72e0ff6712a3fe0bd1b8a5109435570b4dac45770f881e58310f20",
      "prevHash": "70a706b913c038736cf8c21c38c40fac95ac184af2afbc5512069291431a0580"
    }
  ],
  "notes": {
    "apply:apply-2026-05-27-3b63d732": [
      {
        "id": "n-39453439-14ba-4499-adf6-4bdcd5b68580",
        "author": "human",
        "ts": 1779867855618,
        "text": "add @tags: 3dplus verify to connect file to ref graph"
      }
    ]
  }
};

// === HEAD ===
// @tags: 3dplus verify
const Cpu3DCollision = (function () {

  // ===== ベクトル基礎演算 (インライン展開を推奨するが、可読性のためヘルパー化) =====
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) {
    return [
      a[1]*b[2] - a[2]*b[1],
      a[2]*b[0] - a[0]*b[2],
      a[0]*b[1] - a[1]*b[0]
    ];
  }
  function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
  function normalize(a) {
    const len = Math.hypot(a[0], a[1], a[2]);
    return len > 0 ? [a[0]/len, a[1]/len, a[2]/len] : [0,0,0];
  }

  // ===== AABB (Axis-Aligned Bounding Box) =====
  // 表現: { min: [x,y,z], max: [x,y,z] }
  
  // 頂点群からAABBを計算
  function computeAABB(vertices) {
    if (!vertices || vertices.length === 0) return { min: [0,0,0], max: [0,0,0] };
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      if (v[0] < min[0]) min[0] = v[0];
      if (v[1] < min[1]) min[1] = v[1];
      if (v[2] < min[2]) min[2] = v[2];
      if (v[0] > max[0]) max[0] = v[0];
      if (v[1] > max[1]) max[1] = v[1];
      if (v[2] > max[2]) max[2] = v[2];
    }
    return { min, max };
  }

  // AABB vs AABB の交差判定
  function intersectAABB(a, b) {
    return (
      a.min[0] <= b.max[0] && a.max[0] >= b.min[0] &&
      a.min[1] <= b.max[1] && a.max[1] >= b.min[1] &&
      a.min[2] <= b.max[2] && a.max[2] >= b.min[2]
    );
  }

  // ===== Sphere (球) =====
  // 表現: { center: [x,y,z], radius: number }

  // 頂点群と中心座標から包含球(Bounding Sphere)を計算
  function computeBoundingSphere(vertices, center) {
    if (!vertices || vertices.length === 0) return { center: center || [0,0,0], radius: 0 };
    let maxDistSq = 0;
    const cx = center[0], cy = center[1], cz = center[2];
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      const dx = v[0] - cx;
      const dy = v[1] - cy;
      const dz = v[2] - cz;
      const distSq = dx*dx + dy*dy + dz*dz;
      if (distSq > maxDistSq) maxDistSq = distSq;
    }
    return { center, radius: Math.sqrt(maxDistSq) };
  }

  // 球 vs 球 の交差判定
  function intersectSphere(a, b) {
    const dx = a.center[0] - b.center[0];
    const dy = a.center[1] - b.center[1];
    const dz = a.center[2] - b.center[2];
    const distSq = dx*dx + dy*dy + dz*dz;
    const rSum = a.radius + b.radius;
    return distSq <= rSum * rSum;
  }

  // 球 vs AABB の交差判定
  // AABB内の球中心に最も近い点を求め、その距離が半径以内かチェック
  function intersectSphereAABB(sphere, aabb) {
    let closestX = Math.max(aabb.min[0], Math.min(sphere.center[0], aabb.max[0]));
    let closestY = Math.max(aabb.min[1], Math.min(sphere.center[1], aabb.max[1]));
    let closestZ = Math.max(aabb.min[2], Math.min(sphere.center[2], aabb.max[2]));

    const dx = closestX - sphere.center[0];
    const dy = closestY - sphere.center[1];
    const dz = closestZ - sphere.center[2];
    return (dx*dx + dy*dy + dz*dz) <= (sphere.radius * sphere.radius);
  }

  // ===== Ray (光線) =====
  // 表現: { origin: [x,y,z], direction: [x,y,z] } ※directionは正規化済みであること

  // Ray vs AABB
  // Slab method (Liang-Barsky / Smits)
  function intersectRayAABB(ray, aabb) {
    let tmin = -Infinity, tmax = Infinity;
    
    for (let i = 0; i < 3; i++) {
      if (Math.abs(ray.direction[i]) < 1e-8) {
        // レイが軸に平行な場合
        if (ray.origin[i] < aabb.min[i] || ray.origin[i] > aabb.max[i]) return null;
      } else {
        const invD = 1.0 / ray.direction[i];
        let t0 = (aabb.min[i] - ray.origin[i]) * invD;
        let t1 = (aabb.max[i] - ray.origin[i]) * invD;
        if (t0 > t1) { const tmp = t0; t0 = t1; t1 = tmp; }
        
        tmin = Math.max(tmin, t0);
        tmax = Math.min(tmax, t1);
        if (tmax < tmin) return null;
      }
    }
    
    if (tmax < 0) return null; // AABBがレイの後方にある
    
    const t = tmin < 0 ? tmax : tmin; // レイの起点がAABB内部ならtmaxを返す
    return {
      t,
      point: [
        ray.origin[0] + ray.direction[0] * t,
        ray.origin[1] + ray.direction[1] * t,
        ray.origin[2] + ray.direction[2] * t
      ]
    };
  }

  // Ray vs Sphere
  // 解析的二次方程式法。d·d=1 を仮定（方向は正規化済み）。
  // 判別式 disc = (d·oc)^2 - (oc·oc - r^2)。disc < 0 → 交差なし。
  function intersectRaySphere(ray, sphere) {
    const EPSILON = 1e-8;
    const ocx = ray.origin[0] - sphere.center[0];
    const ocy = ray.origin[1] - sphere.center[1];
    const ocz = ray.origin[2] - sphere.center[2];
    const b = ocx * ray.direction[0] + ocy * ray.direction[1] + ocz * ray.direction[2];
    const c = ocx*ocx + ocy*ocy + ocz*ocz - sphere.radius * sphere.radius;
    const disc = b * b - c;
    if (disc < 0) return null;
    const sqrtDisc = Math.sqrt(disc);
    let t = -b - sqrtDisc; // 近点
    if (t < EPSILON) t = -b + sqrtDisc; // 球の内部から: 遠点を採用
    if (t < EPSILON) return null; // 球がレイの後方
    return {
      t,
      point: [
        ray.origin[0] + ray.direction[0] * t,
        ray.origin[1] + ray.direction[1] * t,
        ray.origin[2] + ray.direction[2] * t
      ]
    };
  }

  // Ray vs Triangle
  // Möller–Trumbore intersection algorithm
  function intersectRayTriangle(ray, v0, v1, v2) {
    const EPSILON = 1e-8;
    const edge1 = sub(v1, v0);
    const edge2 = sub(v2, v0);
    const h = cross(ray.direction, edge2);
    const a = dot(edge1, h);

    if (a > -EPSILON && a < EPSILON) return null; // レイが三角形と平行

    const f = 1.0 / a;
    const s = sub(ray.origin, v0);
    const u = f * dot(s, h);

    if (u < 0.0 || u > 1.0) return null;

    const q = cross(s, edge1);
    const v = f * dot(ray.direction, q);

    if (v < 0.0 || u + v > 1.0) return null;

    const t = f * dot(edge2, q);

    if (t > EPSILON) {
      // 交差あり
      return {
        t,
        u,
        v,
        point: [
          ray.origin[0] + ray.direction[0] * t,
          ray.origin[1] + ray.direction[1] * t,
          ray.origin[2] + ray.direction[2] * t
        ]
      };
    }
    
    // 線分交差だが、t < 0 つまりカメラの後ろ
    return null;
  }

  // ===== 視錐台 (Frustum) =====
  // Gribb-Hartmann 法: 結合行列 VP (column-major) の行から6平面を抽出する。
  // 各平面は { normal:[a,b,c], d } で、a*x+b*y+c*z+d >= 0 が「視錐台の内側」を意味する。
  // normalは正規化済み。
  function extractFrustumPlanes(vp) {
    // column-majorの行: row[i] = [vp[i], vp[i+4], vp[i+8], vp[i+12]]
    function plane(a, b, c, d) {
      const len = Math.hypot(a, b, c);
      return len > 0 ? { normal: [a/len, b/len, c/len], d: d/len } : { normal: [0,0,0], d: 0 };
    }
    return [
      plane(vp[3]+vp[0], vp[7]+vp[4], vp[11]+vp[8],  vp[15]+vp[12]), // Left:   row3+row0
      plane(vp[3]-vp[0], vp[7]-vp[4], vp[11]-vp[8],  vp[15]-vp[12]), // Right:  row3-row0
      plane(vp[3]+vp[1], vp[7]+vp[5], vp[11]+vp[9],  vp[15]+vp[13]), // Bottom: row3+row1
      plane(vp[3]-vp[1], vp[7]-vp[5], vp[11]-vp[9],  vp[15]-vp[13]), // Top:    row3-row1
      plane(vp[3]+vp[2], vp[7]+vp[6], vp[11]+vp[10], vp[15]+vp[14]), // Near:   row3+row2
      plane(vp[3]-vp[2], vp[7]-vp[6], vp[11]-vp[10], vp[15]-vp[14]), // Far:    row3-row2
    ];
  }

  // AABB vs 視錐台: false なら完全に視錐台の外（カリング可）。true なら交差または内部。
  // "positive vertex" 法: 各平面の法線方向で最遠の頂点が外側にあれば確定カリング。
  function isAABBInFrustum(aabb, planes) {
    for (let i = 0; i < planes.length; i++) {
      const { normal, d } = planes[i];
      const px = normal[0] >= 0 ? aabb.max[0] : aabb.min[0];
      const py = normal[1] >= 0 ? aabb.max[1] : aabb.min[1];
      const pz = normal[2] >= 0 ? aabb.max[2] : aabb.min[2];
      if (normal[0]*px + normal[1]*py + normal[2]*pz + d < 0) return false;
    }
    return true;
  }

  // 球 vs 視錐台: false なら完全に視錐台の外。true なら交差または内部。
  function isSphereInFrustum(sphere, planes) {
    const [cx, cy, cz] = sphere.center;
    for (let i = 0; i < planes.length; i++) {
      const { normal, d } = planes[i];
      if (normal[0]*cx + normal[1]*cy + normal[2]*cz + d < -sphere.radius) return false;
    }
    return true;
  }

  return {
    computeAABB,
    intersectAABB,
    computeBoundingSphere,
    intersectSphere,
    intersectSphereAABB,
    intersectRayAABB,
    intersectRaySphere,
    intersectRayTriangle,
    extractFrustumPlanes,
    isAABBInFrustum,
    isSphereInFrustum
  };

})();
export { Cpu3DCollision };


// === /HEAD ===
