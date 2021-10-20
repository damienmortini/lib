var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// (disabled):fs
var require_fs = __commonJS({
  "(disabled):fs"() {
  }
});

// (disabled):path
var require_path = __commonJS({
  "(disabled):path"() {
  }
});

// ../../node_modules/gl-matrix/esm/common.js
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var degree = Math.PI / 180;
if (!Math.hypot)
  Math.hypot = function() {
    var y2 = 0, i = arguments.length;
    while (i--) {
      y2 += arguments[i] * arguments[i];
    }
    return Math.sqrt(y2);
  };

// ../../node_modules/gl-matrix/esm/vec3.js
function create() {
  var out = new ARRAY_TYPE(3);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}
function length(a2) {
  var x2 = a2[0];
  var y2 = a2[1];
  var z2 = a2[2];
  return Math.hypot(x2, y2, z2);
}
function transformMat4(out, a2, m2) {
  var x2 = a2[0], y2 = a2[1], z2 = a2[2];
  var w2 = m2[3] * x2 + m2[7] * y2 + m2[11] * z2 + m2[15];
  w2 = w2 || 1;
  out[0] = (m2[0] * x2 + m2[4] * y2 + m2[8] * z2 + m2[12]) / w2;
  out[1] = (m2[1] * x2 + m2[5] * y2 + m2[9] * z2 + m2[13]) / w2;
  out[2] = (m2[2] * x2 + m2[6] * y2 + m2[10] * z2 + m2[14]) / w2;
  return out;
}
var forEach = function() {
  var vec = create();
  return function(a2, stride, offset, count, fn, arg) {
    var i, l2;
    if (!stride) {
      stride = 3;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l2 = Math.min(count * stride + offset, a2.length);
    } else {
      l2 = a2.length;
    }
    for (i = offset; i < l2; i += stride) {
      vec[0] = a2[i];
      vec[1] = a2[i + 1];
      vec[2] = a2[i + 2];
      fn(vec, vec, arg);
      a2[i] = vec[0];
      a2[i + 1] = vec[1];
      a2[i + 2] = vec[2];
    }
    return a2;
  };
}();

// ../../node_modules/gl-matrix/esm/mat4.js
function determinant(a2) {
  var a00 = a2[0], a01 = a2[1], a02 = a2[2], a03 = a2[3];
  var a10 = a2[4], a11 = a2[5], a12 = a2[6], a13 = a2[7];
  var a20 = a2[8], a21 = a2[9], a22 = a2[10], a23 = a2[11];
  var a30 = a2[12], a31 = a2[13], a32 = a2[14], a33 = a2[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;
  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}
function multiply(out, a2, b2) {
  var a00 = a2[0], a01 = a2[1], a02 = a2[2], a03 = a2[3];
  var a10 = a2[4], a11 = a2[5], a12 = a2[6], a13 = a2[7];
  var a20 = a2[8], a21 = a2[9], a22 = a2[10], a23 = a2[11];
  var a30 = a2[12], a31 = a2[13], a32 = a2[14], a33 = a2[15];
  var b0 = b2[0], b1 = b2[1], b22 = b2[2], b3 = b2[3];
  out[0] = b0 * a00 + b1 * a10 + b22 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b22 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b22 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b22 * a23 + b3 * a33;
  b0 = b2[4];
  b1 = b2[5];
  b22 = b2[6];
  b3 = b2[7];
  out[4] = b0 * a00 + b1 * a10 + b22 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b22 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b22 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b22 * a23 + b3 * a33;
  b0 = b2[8];
  b1 = b2[9];
  b22 = b2[10];
  b3 = b2[11];
  out[8] = b0 * a00 + b1 * a10 + b22 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b22 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b22 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b22 * a23 + b3 * a33;
  b0 = b2[12];
  b1 = b2[13];
  b22 = b2[14];
  b3 = b2[15];
  out[12] = b0 * a00 + b1 * a10 + b22 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b22 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b22 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b22 * a23 + b3 * a33;
  return out;
}
function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out[0] = Math.hypot(m11, m12, m13);
  out[1] = Math.hypot(m21, m22, m23);
  out[2] = Math.hypot(m31, m32, m33);
  return out;
}
function getRotation(out, mat) {
  var scaling = new ARRAY_TYPE(3);
  getScaling(scaling, mat);
  var is1 = 1 / scaling[0];
  var is2 = 1 / scaling[1];
  var is3 = 1 / scaling[2];
  var sm11 = mat[0] * is1;
  var sm12 = mat[1] * is2;
  var sm13 = mat[2] * is3;
  var sm21 = mat[4] * is1;
  var sm22 = mat[5] * is2;
  var sm23 = mat[6] * is3;
  var sm31 = mat[8] * is1;
  var sm32 = mat[9] * is2;
  var sm33 = mat[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S2 = 0;
  if (trace > 0) {
    S2 = Math.sqrt(trace + 1) * 2;
    out[3] = 0.25 * S2;
    out[0] = (sm23 - sm32) / S2;
    out[1] = (sm31 - sm13) / S2;
    out[2] = (sm12 - sm21) / S2;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S2 = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S2;
    out[0] = 0.25 * S2;
    out[1] = (sm12 + sm21) / S2;
    out[2] = (sm31 + sm13) / S2;
  } else if (sm22 > sm33) {
    S2 = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S2;
    out[0] = (sm12 + sm21) / S2;
    out[1] = 0.25 * S2;
    out[2] = (sm23 + sm32) / S2;
  } else {
    S2 = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S2;
    out[0] = (sm31 + sm13) / S2;
    out[1] = (sm23 + sm32) / S2;
    out[2] = 0.25 * S2;
  }
  return out;
}

// ../../node_modules/@gltf-transform/core/dist/core.modern.js
var n = "v1.0.0";
var h = "@glb.bin";
var o;
var u;
var c;
var a;
function l(t, s, e, i) {
  var r, n2 = arguments.length, h2 = n2 < 3 ? s : i === null ? i = Object.getOwnPropertyDescriptor(s, e) : i;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    h2 = Reflect.decorate(t, s, e, i);
  else
    for (var o2 = t.length - 1; o2 >= 0; o2--)
      (r = t[o2]) && (h2 = (n2 < 3 ? r(h2) : n2 > 3 ? r(s, e, h2) : r(s, e)) || h2);
  return n2 > 3 && h2 && Object.defineProperty(s, e, h2), h2;
}
!function(t) {
  t.ACCESSOR = "Accessor", t.ANIMATION = "Animation", t.ANIMATION_CHANNEL = "AnimationChannel", t.ANIMATION_SAMPLER = "AnimationSampler", t.BUFFER = "Buffer", t.CAMERA = "Camera", t.MATERIAL = "Material", t.MESH = "Mesh", t.PRIMITIVE = "Primitive", t.PRIMITIVE_TARGET = "PrimitiveTarget", t.NODE = "Node", t.ROOT = "Root", t.SCENE = "Scene", t.SKIN = "Skin", t.TEXTURE = "Texture", t.TEXTURE_INFO = "TextureInfo";
}(o || (o = {})), function(t) {
  t.INTERLEAVED = "interleaved", t.SEPARATE = "separate";
}(u || (u = {})), function(t) {
  t[t.R = 4096] = "R", t[t.G = 256] = "G", t[t.B = 16] = "B", t[t.A = 1] = "A";
}(c || (c = {})), function(t) {
  t.GLTF = "GLTF", t.GLB = "GLB";
}(a || (a = {}));
var f = class {
  constructor(t, s, e) {
    if (this.t = void 0, this.i = void 0, this.h = void 0, this.o = false, this.u = [], this.t = t, this.i = s, this.h = e, !s.canLink(e))
      throw new Error("Cannot link disconnected graphs/documents.");
  }
  getName() {
    return this.t;
  }
  getParent() {
    return this.i;
  }
  getChild() {
    return this.h;
  }
  setChild(t) {
    return this.h = t, this;
  }
  dispose() {
    this.o || (this.o = true, this.u.forEach((t) => t()), this.u.length = 0);
  }
  onDispose(t) {
    return this.u.push(t), this;
  }
  isDisposed() {
    return this.o;
  }
};
var d = class {
  constructor() {
    this.l = new Set(), this.p = new Set(), this.g = new Map(), this.v = new Map(), this.u = {};
  }
  on(t, s) {
    return this.u[t] = this.u[t] || [], this.u[t].push(s), this;
  }
  emit(t, s) {
    for (const e of this.u[t] || [])
      e(s);
    return this;
  }
  getLinks() {
    return Array.from(this.p);
  }
  listParentLinks(t) {
    return Array.from(this.v.get(t) || this.l);
  }
  listParents(t) {
    return this.listParentLinks(t).map((t2) => t2.getParent());
  }
  listChildLinks(t) {
    return Array.from(this.g.get(t) || this.l);
  }
  listChildren(t) {
    return this.listChildLinks(t).map((t2) => t2.getChild());
  }
  disconnectChildren(t) {
    return (this.g.get(t) || this.l).forEach((t2) => t2.dispose()), this;
  }
  disconnectParents(t, s) {
    let e = Array.from(this.v.get(t) || this.l);
    return s && (e = e.filter((t2) => s(t2.getParent()))), e.forEach((t2) => t2.dispose()), this;
  }
  swapChild(t, s, e) {
    const i = this.g.get(t) || this.l;
    return Array.from(i).filter((t2) => t2.getChild() === s).forEach((t2) => {
      this.v.get(s).delete(t2), t2.setChild(e), this.v.has(e) || this.v.set(e, new Set()), this.v.get(e).add(t2);
    }), this;
  }
  link(t, s, e) {
    if (!e)
      return null;
    const i = new f(t, s, e);
    return this.registerLink(i), i;
  }
  registerLink(t) {
    this.p.add(t);
    const s = t.getParent();
    this.g.has(s) || this.g.set(s, new Set()), this.g.get(s).add(t);
    const e = t.getChild();
    return this.v.has(e) || this.v.set(e, new Set()), this.v.get(e).add(t), t.onDispose(() => this.unlink(t)), t;
  }
  unlink(t) {
    return this.p.delete(t), this.g.get(t.getParent()).delete(t), this.v.get(t.getChild()).delete(t), this;
  }
};
function p(t, s) {
  Object.defineProperty(t, s, { get: function() {
    return this["__" + s];
  }, set: function(t2) {
    const e = this["__" + s];
    e && !Array.isArray(e) && e.dispose(), t2 && !Array.isArray(t2) && t2.onDispose(() => {
      this["__" + s] = null;
    }), this["__" + s] = t2;
  }, enumerable: true });
}
function g(t, s) {
}
function w(t) {
  const s = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }, e = t.propertyType === o.NODE ? [t] : t.listChildren();
  for (const t2 of e)
    t2.traverse((t3) => {
      const e2 = t3.getMesh();
      if (!e2)
        return;
      const i = v(e2, t3.getWorldMatrix());
      m(i.min, s), m(i.max, s);
    });
  return s;
}
function v(s, e) {
  const i = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (const r of s.listPrimitives()) {
    const s2 = r.getAttribute("POSITION");
    if (!s2)
      continue;
    let n2 = [0, 0, 0], h2 = [0, 0, 0];
    for (let r2 = 0; r2 < s2.getCount(); r2++)
      n2 = s2.getElement(r2, n2), h2 = transformMat4(h2, n2, e), m(h2, i);
  }
  return i;
}
function m(t, s) {
  for (let e = 0; e < 3; e++)
    s.min[e] = Math.min(t[e], s.min[e]), s.max[e] = Math.max(t[e], s.max[e]);
}
var T = class {
  static createBufferFromDataURI(t) {
    if (typeof Buffer == "undefined") {
      const s = atob(t.split(",")[1]), e = new Uint8Array(s.length);
      for (let t2 = 0; t2 < s.length; t2++)
        e[t2] = s.charCodeAt(t2);
      return e.buffer;
    }
    {
      const s = t.split(",")[1], e = t.indexOf("base64") >= 0;
      return this.trim(Buffer.from(s, e ? "base64" : "utf8"));
    }
  }
  static encodeText(t) {
    return typeof TextEncoder != "undefined" ? new TextEncoder().encode(t).buffer : this.trim(Buffer.from(t));
  }
  static decodeText(t) {
    return typeof TextDecoder != "undefined" ? new TextDecoder().decode(t) : Buffer.from(t).toString("utf8");
  }
  static trim(t) {
    const { byteOffset: s, byteLength: e } = t;
    return t.buffer.slice(s, s + e);
  }
  static concat(t) {
    let s = 0;
    for (const e2 of t)
      s += e2.byteLength;
    const e = new Uint8Array(s);
    let i = 0;
    for (const s2 of t)
      e.set(new Uint8Array(s2), i), i += s2.byteLength;
    return e.buffer;
  }
  static pad(t, s = 0) {
    const e = this.padNumber(t.byteLength);
    if (e !== t.byteLength) {
      const i = new Uint8Array(e);
      if (i.set(new Uint8Array(t)), s !== 0)
        for (let r = t.byteLength; r < e; r++)
          i[r] = s;
      return i.buffer;
    }
    return t;
  }
  static padNumber(t) {
    return 4 * Math.ceil(t / 4);
  }
  static equals(t, s) {
    if (t === s)
      return true;
    if (t.byteLength !== s.byteLength)
      return false;
    const e = new DataView(t), i = new DataView(s);
    let r = t.byteLength;
    for (; r--; )
      if (e.getUint8(r) !== i.getUint8(r))
        return false;
    return true;
  }
};
var y = class {
  static hexToFactor(t, s) {
    t = Math.floor(t);
    const e = s;
    return e[0] = (t >> 16 & 255) / 255, e[1] = (t >> 8 & 255) / 255, e[2] = (255 & t) / 255, this.convertSRGBToLinear(s, s);
  }
  static factorToHex(t) {
    const s = [...t], [e, i, r] = this.convertLinearToSRGB(t, s);
    return 255 * e << 16 ^ 255 * i << 8 ^ 255 * r << 0;
  }
  static convertSRGBToLinear(t, s) {
    const e = t, i = s;
    for (let t2 = 0; t2 < 3; t2++)
      i[t2] = e[t2] < 0.04045 ? 0.0773993808 * e[t2] : Math.pow(0.9478672986 * e[t2] + 0.0521327014, 2.4);
    return s;
  }
  static convertLinearToSRGB(t, s) {
    const e = t, i = s;
    for (let t2 = 0; t2 < 3; t2++)
      i[t2] = e[t2] < 31308e-7 ? 12.92 * e[t2] : 1.055 * Math.pow(e[t2], 0.41666) - 0.055;
    return s;
  }
};
var A = class {
  static basename(t) {
    const s = t.split(/[\\/]/).pop();
    return s.substr(0, s.lastIndexOf("."));
  }
  static extension(t) {
    return t.indexOf("data:") !== 0 ? t.split(/[\\/]/).pop().split(/[.]/).pop() : t.indexOf("data:image/png") === 0 ? "png" : t.indexOf("data:image/jpeg") === 0 ? "jpeg" : "bin";
  }
};
var x = class {
  getSize(t) {
    const s = new DataView(t);
    return T.decodeText(t.slice(12, 16)) === x.PNG_FRIED_CHUNK_NAME ? [s.getUint32(32, false), s.getUint32(36, false)] : [s.getUint32(16, false), s.getUint32(20, false)];
  }
  getChannels(t) {
    return 4;
  }
};
x.PNG_FRIED_CHUNK_NAME = "CgBI";
var E = class {
  static registerFormat(t, s) {
    this.impls[t] = s;
  }
  static getSize(t, s) {
    return this.impls[s] ? this.impls[s].getSize(t) : null;
  }
  static getChannels(t, s) {
    return this.impls[s] ? this.impls[s].getChannels(t) : null;
  }
  static getMemSize(t, s) {
    if (!this.impls[s])
      return null;
    if (this.impls[s].getGPUByteLength)
      return this.impls[s].getGPUByteLength(t);
    let e = 0;
    const i = this.getSize(t, s);
    if (!i)
      return null;
    for (; i[0] > 1 || i[1] > 1; )
      e += i[0] * i[1] * 4, i[0] = Math.max(Math.floor(i[0] / 2), 1), i[1] = Math.max(Math.floor(i[1] / 2), 1);
    return e += 4, e;
  }
  static mimeTypeToExtension(t) {
    return t === "image/jpeg" ? "jpg" : t.split("/").pop();
  }
  static extensionToMimeType(t) {
    return t === "jpg" ? "image/jpeg" : `image/${t}`;
  }
};
function M(t, s) {
  if (s > t.byteLength)
    throw new TypeError("Corrupt JPG, exceeded buffer limits");
  if (t.getUint8(s) !== 255)
    throw new TypeError("Invalid JPG, marker table corrupted");
  return t;
}
E.impls = { "image/jpeg": new class {
  getSize(t) {
    let s, e, i = new DataView(t, 4);
    for (; i.byteLength; ) {
      if (s = i.getUint16(0, false), M(i, s), e = i.getUint8(s + 1), e === 192 || e === 193 || e === 194)
        return [i.getUint16(s + 7, false), i.getUint16(s + 5, false)];
      i = new DataView(t, i.byteOffset + s + 2);
    }
    throw new TypeError("Invalid JPG, no size found");
  }
  getChannels(t) {
    return 3;
  }
}(), "image/png": new x() };
var S = class {
  static identity(t) {
    return t;
  }
  static eq(t, s) {
    if (t.length !== s.length)
      return false;
    for (let e = 0; e < t.length; e++)
      if (Math.abs(t[e] - s[e]) > 1e-5)
        return false;
    return true;
  }
  static denormalize(t, s) {
    switch (s) {
      case 5126:
        return t;
      case 5123:
        return t / 65535;
      case 5121:
        return t / 255;
      case 5122:
        return Math.max(t / 32767, -1);
      case 5120:
        return Math.max(t / 127, -1);
      default:
        throw new Error("Invalid component type.");
    }
  }
  static normalize(t, s) {
    switch (s) {
      case 5126:
        return t;
      case 5123:
        return Math.round(65535 * t);
      case 5121:
        return Math.round(255 * t);
      case 5122:
        return Math.round(32767 * t);
      case 5120:
        return Math.round(127 * t);
      default:
        throw new Error("Invalid component type.");
    }
  }
  static decompose(t, r, n2, h2) {
    let o2 = length([t[0], t[1], t[2]]);
    const u2 = length([t[4], t[5], t[6]]), c2 = length([t[8], t[9], t[10]]);
    determinant(t) < 0 && (o2 = -o2), r[0] = t[12], r[1] = t[13], r[2] = t[14];
    const a2 = t.slice(), l2 = 1 / o2, f2 = 1 / u2, d2 = 1 / c2;
    a2[0] *= l2, a2[1] *= l2, a2[2] *= l2, a2[4] *= f2, a2[5] *= f2, a2[6] *= f2, a2[8] *= d2, a2[9] *= d2, a2[10] *= d2, getRotation(n2, a2), h2[0] = o2, h2[1] = u2, h2[2] = c2;
  }
  static compose(t, s, e, i) {
    const r = i, n2 = s[0], h2 = s[1], o2 = s[2], u2 = s[3], c2 = n2 + n2, a2 = h2 + h2, l2 = o2 + o2, f2 = n2 * c2, d2 = n2 * a2, p2 = n2 * l2, g2 = h2 * a2, w2 = h2 * l2, v2 = o2 * l2, m2 = u2 * c2, T2 = u2 * a2, y2 = u2 * l2, A2 = e[0], x2 = e[1], E2 = e[2];
    return r[0] = (1 - (g2 + v2)) * A2, r[1] = (d2 + y2) * A2, r[2] = (p2 - T2) * A2, r[3] = 0, r[4] = (d2 - y2) * x2, r[5] = (1 - (f2 + v2)) * x2, r[6] = (w2 + m2) * x2, r[7] = 0, r[8] = (p2 + T2) * E2, r[9] = (w2 - m2) * E2, r[10] = (1 - (f2 + g2)) * E2, r[11] = 0, r[12] = t[0], r[13] = t[1], r[14] = t[2], r[15] = 1, r;
  }
};
var I = class {
  constructor(t) {
    this.verbosity = void 0, this.verbosity = t;
  }
  debug(t) {
    this.verbosity <= I.Verbosity.DEBUG && console.debug(t);
  }
  info(t) {
    this.verbosity <= I.Verbosity.INFO && console.info(t);
  }
  warn(t) {
    this.verbosity <= I.Verbosity.WARN && console.warn(t);
  }
  error(t) {
    this.verbosity <= I.Verbosity.ERROR && console.error(t);
  }
};
I.Verbosity = { SILENT: 4, ERROR: 3, WARN: 2, INFO: 1, DEBUG: 0 }, I.DEFAULT_INSTANCE = new I(I.Verbosity.INFO);
var b = "23456789abdegjkmnpqrvwxyzABDEGJKMNPQRVWXYZ";
var R = new Set();
var N = function() {
  let t = "";
  for (let s = 0; s < 6; s++)
    t += b.charAt(Math.floor(Math.random() * b.length));
  return t;
};
var C = function() {
  for (let t = 0; t < 999; t++) {
    const t2 = N();
    if (!R.has(t2))
      return R.add(t2), t2;
  }
  return "";
};
var _ = (t) => t;
var O = class extends class {
  constructor(t) {
    this.graph = void 0, this.o = false, this.graph = t, this.graph = t;
  }
  canLink(t) {
    return this.graph === t.graph;
  }
  isDisposed() {
    return this.o;
  }
  dispose() {
    this.graph.disconnectChildren(this), this.graph.disconnectParents(this), this.o = true, this.graph.emit("dispose", this);
  }
  detach() {
    return this.graph.disconnectParents(this), this;
  }
  swap(t, s) {
    return this.graph.swapChild(this, t, s), this;
  }
  addGraphChild(t, s) {
    return t.push(s), s.onDispose(() => {
      const e = t.filter((t2) => t2 !== s);
      t.length = 0;
      for (const s2 of e)
        t.push(s2);
    }), this;
  }
  removeGraphChild(t, s) {
    return t.filter((t2) => t2.getChild() === s).forEach((t2) => t2.dispose()), this;
  }
  clearGraphChildList(t) {
    for (; t.length > 0; )
      t[0].dispose();
    return this;
  }
  listGraphParents() {
    return this.graph.listParents(this);
  }
} {
  constructor(t, s = "") {
    super(t), this.graph = void 0, this.m = {}, this.t = "", this.graph = t, this.t = s;
  }
  getName() {
    return this.t;
  }
  setName(t) {
    return this.t = t, this;
  }
  getExtras() {
    return this.m;
  }
  setExtras(t) {
    return this.m = t, this;
  }
  clone() {
    const t = new (0, this.constructor)(this.graph).copy(this, _);
    return this.graph.emit("clone", t), t;
  }
  copy(t, s = _) {
    return this.t = t.t, this.m = JSON.parse(JSON.stringify(t.m)), this;
  }
  detach() {
    return this.graph.disconnectParents(this, (t) => t.propertyType !== "Root"), this;
  }
  listParents() {
    return this.listGraphParents();
  }
};
var L = "Pass extension name (string) as lookup token, not a constructor.";
var B = class extends O {
  constructor(...t) {
    super(...t), this.extensions = [];
  }
  copy(t, s = _) {
    return super.copy(t, s), this.clearGraphChildList(this.extensions), t.extensions.forEach((t2) => {
      const e = t2.getChild();
      this.setExtension(e.extensionName, s(e));
    }), this;
  }
  getExtension(t) {
    if (typeof t != "string")
      throw new Error(L);
    const s = this.extensions.find((s2) => s2.getChild().extensionName === t);
    return s ? s.getChild() : null;
  }
  setExtension(t, s) {
    if (typeof t != "string")
      throw new Error(L);
    const e = this.getExtension(t);
    return e && this.removeGraphChild(this.extensions, e), s ? (s.T(this), this.addGraphChild(this.extensions, this.graph.link(t, this, s))) : this;
  }
  listExtensions() {
    return this.extensions.map((t) => t.getChild());
  }
};
l([g], B.prototype, "extensions", void 0);
var P = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.ACCESSOR, this.M = null, this.S = P.Type.SCALAR, this.I = P.ComponentType.FLOAT, this.N = false, this.C = S.identity, this._ = S.identity, this.buffer = null;
  }
  copy(t, s = _) {
    return super.copy(t, s), this.S = t.S, this.I = t.I, this.N = t.N, this.C = t.C, this._ = t._, t.M && (this.M = t.M.slice()), this.setBuffer(t.buffer ? s(t.buffer.getChild()) : null), this;
  }
  static getElementSize(t) {
    switch (t) {
      case P.Type.SCALAR:
        return 1;
      case P.Type.VEC2:
        return 2;
      case P.Type.VEC3:
        return 3;
      case P.Type.VEC4:
      case P.Type.MAT2:
        return 4;
      case P.Type.MAT3:
        return 9;
      case P.Type.MAT4:
        return 16;
      default:
        throw new Error("Unexpected type: " + t);
    }
  }
  static getComponentSize(t) {
    switch (t) {
      case P.ComponentType.BYTE:
      case P.ComponentType.UNSIGNED_BYTE:
        return 1;
      case P.ComponentType.SHORT:
      case P.ComponentType.UNSIGNED_SHORT:
        return 2;
      case P.ComponentType.UNSIGNED_INT:
      case P.ComponentType.FLOAT:
        return 4;
      default:
        throw new Error("Unexpected component type: " + t);
    }
  }
  getMinNormalized(t) {
    const s = this.getElementSize();
    this.getMin(t);
    for (let e = 0; e < s; e++)
      t[e] = this._(t[e]);
    return t;
  }
  getMin(t) {
    const s = this.getCount(), e = this.getElementSize();
    for (let s2 = 0; s2 < e; s2++)
      t[s2] = Infinity;
    for (let i = 0; i < s * e; i += e)
      for (let s2 = 0; s2 < e; s2++) {
        const e2 = this.M[i + s2];
        Number.isFinite(e2) && (t[s2] = Math.min(t[s2], e2));
      }
    return t;
  }
  getMaxNormalized(t) {
    const s = this.getElementSize();
    this.getMax(t);
    for (let e = 0; e < s; e++)
      t[e] = this._(t[e]);
    return t;
  }
  getMax(t) {
    const s = this.getCount(), e = this.getElementSize();
    for (let s2 = 0; s2 < e; s2++)
      t[s2] = -Infinity;
    for (let i = 0; i < s * e; i += e)
      for (let s2 = 0; s2 < e; s2++) {
        const e2 = this.M[i + s2];
        Number.isFinite(e2) && (t[s2] = Math.max(t[s2], e2));
      }
    return t;
  }
  getCount() {
    return this.M ? this.M.length / this.getElementSize() : 0;
  }
  getType() {
    return this.S;
  }
  setType(t) {
    return this.S = t, this;
  }
  getElementSize() {
    return P.getElementSize(this.S);
  }
  getComponentSize() {
    return this.M.BYTES_PER_ELEMENT;
  }
  getComponentType() {
    return this.I;
  }
  getNormalized() {
    return this.N;
  }
  setNormalized(t) {
    return this.N = t, t ? (this._ = (t2) => S.denormalize(t2, this.I), this.C = (t2) => S.normalize(t2, this.I)) : (this._ = S.identity, this.C = S.identity), this;
  }
  getScalar(t) {
    const s = this.getElementSize();
    return this._(this.M[t * s]);
  }
  setScalar(t, s) {
    return this.M[t * this.getElementSize()] = this.C(s), this;
  }
  getElement(t, s) {
    const e = this.getElementSize();
    for (let i = 0; i < e; i++)
      s[i] = this._(this.M[t * e + i]);
    return s;
  }
  setElement(t, s) {
    const e = this.getElementSize();
    for (let i = 0; i < e; i++)
      this.M[t * e + i] = this.C(s[i]);
    return this;
  }
  getBuffer() {
    return this.buffer ? this.buffer.getChild() : null;
  }
  setBuffer(t) {
    return this.buffer = this.graph.link("buffer", this, t), this;
  }
  getArray() {
    return this.M;
  }
  setArray(t) {
    return this.I = t ? function(t2) {
      switch (t2.constructor) {
        case Float32Array:
          return P.ComponentType.FLOAT;
        case Uint32Array:
          return P.ComponentType.UNSIGNED_INT;
        case Uint16Array:
          return P.ComponentType.UNSIGNED_SHORT;
        case Uint8Array:
          return P.ComponentType.UNSIGNED_BYTE;
        case Int16Array:
          return P.ComponentType.SHORT;
        case Int8Array:
          return P.ComponentType.BYTE;
        default:
          throw new Error("Unknown accessor componentType.");
      }
    }(t) : P.ComponentType.FLOAT, this.M = t, this;
  }
  getByteLength() {
    return this.M ? this.M.byteLength : 0;
  }
};
P.Type = { SCALAR: "SCALAR", VEC2: "VEC2", VEC3: "VEC3", VEC4: "VEC4", MAT2: "MAT2", MAT3: "MAT3", MAT4: "MAT4" }, P.ComponentType = { BYTE: 5120, UNSIGNED_BYTE: 5121, SHORT: 5122, UNSIGNED_SHORT: 5123, UNSIGNED_INT: 5125, FLOAT: 5126 }, l([p], P.prototype, "buffer", void 0);
var U = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.ANIMATION, this.channels = [], this.samplers = [];
  }
  copy(t, s = _) {
    return super.copy(t, s), this.clearGraphChildList(this.channels), this.clearGraphChildList(this.samplers), t.channels.forEach((t2) => this.addChannel(s(t2.getChild()))), t.samplers.forEach((t2) => this.addSampler(s(t2.getChild()))), this;
  }
  addChannel(t) {
    const s = this.graph.link("channel", this, t);
    return this.addGraphChild(this.channels, s);
  }
  removeChannel(t) {
    return this.removeGraphChild(this.channels, t);
  }
  listChannels() {
    return this.channels.map((t) => t.getChild());
  }
  addSampler(t) {
    const s = this.graph.link("sampler", this, t);
    return this.addGraphChild(this.samplers, s);
  }
  removeSampler(t) {
    return this.removeGraphChild(this.samplers, t);
  }
  listSamplers() {
    return this.samplers.map((t) => t.getChild());
  }
};
l([g], U.prototype, "channels", void 0), l([g], U.prototype, "samplers", void 0);
var k = class extends O {
  constructor(...t) {
    super(...t), this.propertyType = o.ANIMATION_CHANNEL, this.O = null, this.targetNode = null, this.sampler = null;
  }
  copy(t, s = _) {
    return super.copy(t, s), this.O = t.O, this.setTargetNode(t.targetNode ? s(t.targetNode.getChild()) : null), this.setSampler(t.sampler ? s(t.sampler.getChild()) : null), this;
  }
  getTargetPath() {
    return this.O;
  }
  setTargetPath(t) {
    return this.O = t, this;
  }
  getTargetNode() {
    return this.targetNode ? this.targetNode.getChild() : null;
  }
  setTargetNode(t) {
    return this.targetNode = this.graph.link("target.node", this, t), this;
  }
  getSampler() {
    return this.sampler ? this.sampler.getChild() : null;
  }
  setSampler(t) {
    return this.sampler = this.graph.link("sampler", this, t), this;
  }
};
k.TargetPath = { TRANSLATION: "translation", ROTATION: "rotation", SCALE: "scale", WEIGHTS: "weights" }, l([p], k.prototype, "targetNode", void 0), l([p], k.prototype, "sampler", void 0);
var F = class extends O {
  constructor(...t) {
    super(...t), this.propertyType = o.ANIMATION_SAMPLER, this.L = F.Interpolation.LINEAR, this.input = null, this.output = null;
  }
  copy(t, s = _) {
    return super.copy(t, s), this.L = t.L, this.setInput(t.input ? s(t.input.getChild()) : null), this.setOutput(t.output ? s(t.output.getChild()) : null), this;
  }
  getInterpolation() {
    return this.L;
  }
  setInterpolation(t) {
    return this.L = t, this;
  }
  getInput() {
    return this.input ? this.input.getChild() : null;
  }
  setInput(t) {
    return this.input = this.graph.link("input", this, t), this;
  }
  getOutput() {
    return this.output ? this.output.getChild() : null;
  }
  setOutput(t) {
    return this.output = this.graph.link("output", this, t), this;
  }
};
F.Interpolation = { LINEAR: "LINEAR", STEP: "STEP", CUBICSPLINE: "CUBICSPLINE" }, l([p], F.prototype, "input", void 0), l([p], F.prototype, "output", void 0);
var G = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.BUFFER, this.P = "";
  }
  copy(t, s = _) {
    return super.copy(t, s), this.P = t.P, this;
  }
  getURI() {
    return this.P;
  }
  setURI(t) {
    return this.P = t, this;
  }
};
var j = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.CAMERA, this.S = j.Type.PERSPECTIVE, this.U = 0.1, this.k = 100, this.F = null, this.j = 2 * Math.PI * 50 / 360, this.D = 1, this.J = 1;
  }
  copy(t, s = _) {
    return super.copy(t, s), this.S = t.S, this.U = t.U, this.k = t.k, this.F = t.F, this.j = t.j, this.D = t.D, this.J = t.J, this;
  }
  getType() {
    return this.S;
  }
  setType(t) {
    return this.S = t, this;
  }
  getZNear() {
    return this.U;
  }
  setZNear(t) {
    return this.U = t, this;
  }
  getZFar() {
    return this.k;
  }
  setZFar(t) {
    return this.k = t, this;
  }
  getAspectRatio() {
    return this.F;
  }
  setAspectRatio(t) {
    return this.F = t, this;
  }
  getYFov() {
    return this.j;
  }
  setYFov(t) {
    return this.j = t, this;
  }
  getXMag() {
    return this.D;
  }
  setXMag(t) {
    return this.D = t, this;
  }
  getYMag() {
    return this.J;
  }
  setYMag(t) {
    return this.J = t, this;
  }
};
j.Type = { PERSPECTIVE: "perspective", ORTHOGRAPHIC: "orthographic" };
var D = class extends O {
  constructor(t, s) {
    super(t), this.$ = void 0, this.$ = s, this.$.addExtensionProperty(this);
  }
  clone() {
    const t = new (0, this.constructor)(this.graph, this.$).copy(this, _);
    return this.graph.emit("clone", t), t;
  }
  dispose() {
    this.$.removeExtensionProperty(this), super.dispose();
  }
  T(t) {
    if (!this.parentTypes.includes(t.propertyType))
      throw new Error(`Parent "${t.propertyType}" invalid for child "${this.propertyType}".`);
  }
};
D.EXTENSION_NAME = void 0;
var J = class extends f {
  constructor(...t) {
    super(...t), this.semantic = "";
  }
  copy(t) {
    return this.semantic = t.semantic, this;
  }
};
var z = class extends f {
  copy(t) {
    return this;
  }
};
var $ = class extends f {
  constructor(...t) {
    super(...t), this.channels = 0;
  }
  copy(t) {
    return this.channels = t.channels, this;
  }
};
var V = class extends d {
  linkAttribute(t, s, e) {
    if (!e)
      return null;
    const i = new J(t, s, e);
    return i.semantic = t, this.registerLink(i), i;
  }
  linkIndex(t, s, e) {
    if (!e)
      return null;
    const i = new z(t, s, e);
    return this.registerLink(i), i;
  }
  linkTexture(t, s, e, i) {
    if (!i)
      return null;
    const r = new $(t, e, i);
    return r.channels = s, this.registerLink(r), r;
  }
};
var W = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.TEXTURE_INFO, this.V = 0, this.W = null, this.Y = null, this.q = W.WrapMode.REPEAT, this.H = W.WrapMode.REPEAT;
  }
  copy(t, s = _) {
    return super.copy(t, s), this.V = t.V, this.W = t.W, this.Y = t.Y, this.q = t.q, this.H = t.H, this;
  }
  getTexCoord() {
    return this.V;
  }
  setTexCoord(t) {
    return this.V = t, this;
  }
  getMagFilter() {
    return this.W;
  }
  setMagFilter(t) {
    return this.W = t, this;
  }
  getMinFilter() {
    return this.Y;
  }
  setMinFilter(t) {
    return this.Y = t, this;
  }
  getWrapS() {
    return this.q;
  }
  setWrapS(t) {
    return this.q = t, this;
  }
  getWrapT() {
    return this.H;
  }
  setWrapT(t) {
    return this.H = t, this;
  }
};
W.WrapMode = { CLAMP_TO_EDGE: 33071, MIRRORED_REPEAT: 33648, REPEAT: 10497 }, W.MagFilter = { NEAREST: 9728, LINEAR: 9729 }, W.MinFilter = { NEAREST: 9728, LINEAR: 9729, NEAREST_MIPMAP_NEAREST: 9984, LINEAR_MIPMAP_NEAREST: 9985, NEAREST_MIPMAP_LINEAR: 9986, LINEAR_MIPMAP_LINEAR: 9987 };
var { R: Y, G: q, B: H, A: Z } = c;
var K = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.MATERIAL, this.Z = K.AlphaMode.OPAQUE, this.K = 0.5, this.X = false, this.tt = [1, 1, 1, 1], this.st = [0, 0, 0], this.et = 1, this.it = 1, this.rt = 1, this.nt = 1, this.baseColorTexture = null, this.baseColorTextureInfo = this.graph.link("baseColorTextureInfo", this, new W(this.graph)), this.emissiveTexture = null, this.emissiveTextureInfo = this.graph.link("emissiveTextureInfo", this, new W(this.graph)), this.normalTexture = null, this.normalTextureInfo = this.graph.link("normalTextureInfo", this, new W(this.graph)), this.occlusionTexture = null, this.occlusionTextureInfo = this.graph.link("occlusionTextureInfo", this, new W(this.graph)), this.metallicRoughnessTexture = null, this.metallicRoughnessTextureInfo = this.graph.link("metallicRoughnessTextureInfo", this, new W(this.graph));
  }
  copy(t, s = _) {
    return super.copy(t, s), this.Z = t.Z, this.K = t.K, this.X = t.X, this.tt = [...t.tt], this.st = [...t.st], this.et = t.et, this.it = t.it, this.rt = t.rt, this.nt = t.nt, this.setBaseColorTexture(t.baseColorTexture ? s(t.baseColorTexture.getChild()) : null), this.baseColorTextureInfo.getChild().copy(s(t.baseColorTextureInfo.getChild()), s), this.setEmissiveTexture(t.emissiveTexture ? s(t.emissiveTexture.getChild()) : null), this.emissiveTextureInfo.getChild().copy(s(t.emissiveTextureInfo.getChild()), s), this.setNormalTexture(t.normalTexture ? s(t.normalTexture.getChild()) : null), this.normalTextureInfo.getChild().copy(s(t.normalTextureInfo.getChild()), s), this.setOcclusionTexture(t.occlusionTexture ? s(t.occlusionTexture.getChild()) : null), this.occlusionTextureInfo.getChild().copy(s(t.occlusionTextureInfo.getChild()), s), this.setMetallicRoughnessTexture(t.metallicRoughnessTexture ? s(t.metallicRoughnessTexture.getChild()) : null), this.metallicRoughnessTextureInfo.getChild().copy(s(t.metallicRoughnessTextureInfo.getChild()), s), this;
  }
  dispose() {
    this.baseColorTextureInfo.getChild().dispose(), this.emissiveTextureInfo.getChild().dispose(), this.normalTextureInfo.getChild().dispose(), this.occlusionTextureInfo.getChild().dispose(), this.metallicRoughnessTextureInfo.getChild().dispose(), super.dispose();
  }
  getDoubleSided() {
    return this.X;
  }
  setDoubleSided(t) {
    return this.X = t, this;
  }
  getAlpha() {
    return this.tt[3];
  }
  setAlpha(t) {
    return this.tt[3] = t, this;
  }
  getAlphaMode() {
    return this.Z;
  }
  setAlphaMode(t) {
    return this.Z = t, this;
  }
  getAlphaCutoff() {
    return this.K;
  }
  setAlphaCutoff(t) {
    return this.K = t, this;
  }
  getBaseColorFactor() {
    return this.tt;
  }
  setBaseColorFactor(t) {
    return this.tt = t, this;
  }
  getBaseColorHex() {
    return y.factorToHex(this.tt);
  }
  setBaseColorHex(t) {
    return y.hexToFactor(t, this.tt), this;
  }
  getBaseColorTexture() {
    return this.baseColorTexture ? this.baseColorTexture.getChild() : null;
  }
  getBaseColorTextureInfo() {
    return this.baseColorTexture ? this.baseColorTextureInfo.getChild() : null;
  }
  setBaseColorTexture(t) {
    return this.baseColorTexture = this.graph.linkTexture("baseColorTexture", Y | q | H | Z, this, t), this;
  }
  getEmissiveFactor() {
    return this.st;
  }
  setEmissiveFactor(t) {
    return this.st = t, this;
  }
  getEmissiveHex() {
    return y.factorToHex(this.st);
  }
  setEmissiveHex(t) {
    return y.hexToFactor(t, this.st), this;
  }
  getEmissiveTexture() {
    return this.emissiveTexture ? this.emissiveTexture.getChild() : null;
  }
  getEmissiveTextureInfo() {
    return this.emissiveTexture ? this.emissiveTextureInfo.getChild() : null;
  }
  setEmissiveTexture(t) {
    return this.emissiveTexture = this.graph.linkTexture("emissiveTexture", Y | q | H, this, t), this;
  }
  getNormalScale() {
    return this.et;
  }
  setNormalScale(t) {
    return this.et = t, this;
  }
  getNormalTexture() {
    return this.normalTexture ? this.normalTexture.getChild() : null;
  }
  getNormalTextureInfo() {
    return this.normalTexture ? this.normalTextureInfo.getChild() : null;
  }
  setNormalTexture(t) {
    return this.normalTexture = this.graph.linkTexture("normalTexture", Y | q | H, this, t), this;
  }
  getOcclusionStrength() {
    return this.it;
  }
  setOcclusionStrength(t) {
    return this.it = t, this;
  }
  getOcclusionTexture() {
    return this.occlusionTexture ? this.occlusionTexture.getChild() : null;
  }
  getOcclusionTextureInfo() {
    return this.occlusionTexture ? this.occlusionTextureInfo.getChild() : null;
  }
  setOcclusionTexture(t) {
    return this.occlusionTexture = this.graph.linkTexture("occlusionTexture", Y, this, t), this;
  }
  getRoughnessFactor() {
    return this.rt;
  }
  setRoughnessFactor(t) {
    return this.rt = t, this;
  }
  getMetallicFactor() {
    return this.nt;
  }
  setMetallicFactor(t) {
    return this.nt = t, this;
  }
  getMetallicRoughnessTexture() {
    return this.metallicRoughnessTexture ? this.metallicRoughnessTexture.getChild() : null;
  }
  getMetallicRoughnessTextureInfo() {
    return this.metallicRoughnessTexture ? this.metallicRoughnessTextureInfo.getChild() : null;
  }
  setMetallicRoughnessTexture(t) {
    return this.metallicRoughnessTexture = this.graph.linkTexture("metallicRoughnessTexture", q | H, this, t), this;
  }
};
K.AlphaMode = { OPAQUE: "OPAQUE", MASK: "MASK", BLEND: "BLEND" }, l([p], K.prototype, "baseColorTexture", void 0), l([p], K.prototype, "baseColorTextureInfo", void 0), l([p], K.prototype, "emissiveTexture", void 0), l([p], K.prototype, "emissiveTextureInfo", void 0), l([p], K.prototype, "normalTexture", void 0), l([p], K.prototype, "normalTextureInfo", void 0), l([p], K.prototype, "occlusionTexture", void 0), l([p], K.prototype, "occlusionTextureInfo", void 0), l([p], K.prototype, "metallicRoughnessTexture", void 0), l([p], K.prototype, "metallicRoughnessTextureInfo", void 0);
var Q = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.MESH, this.ht = [], this.primitives = [];
  }
  copy(t, s = _) {
    return super.copy(t, s), this.ht = [...t.ht], this.clearGraphChildList(this.primitives), t.primitives.forEach((t2) => this.addPrimitive(s(t2.getChild()))), this;
  }
  addPrimitive(t) {
    return this.addGraphChild(this.primitives, this.graph.link("primitive", this, t));
  }
  removePrimitive(t) {
    return this.removeGraphChild(this.primitives, t);
  }
  listPrimitives() {
    return this.primitives.map((t) => t.getChild());
  }
  getWeights() {
    return this.ht;
  }
  setWeights(t) {
    return this.ht = t, this;
  }
};
l([g], Q.prototype, "primitives", void 0);
var X = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.NODE, this.ot = [0, 0, 0], this.ut = [0, 0, 0, 1], this.ct = [1, 1, 1], this.ht = [], this.i = null, this.camera = null, this.mesh = null, this.skin = null, this.children = [];
  }
  copy(t, s = _) {
    return super.copy(t, s), this.ot = [...t.ot], this.ut = [...t.ut], this.ct = [...t.ct], this.ht = [...t.ht], this.setCamera(t.camera ? s(t.camera.getChild()) : null), this.setMesh(t.mesh ? s(t.mesh.getChild()) : null), this.setSkin(t.skin ? s(t.skin.getChild()) : null), s !== _ && (this.clearGraphChildList(this.children), t.children.forEach((t2) => this.addChild(s(t2.getChild())))), this;
  }
  getTranslation() {
    return this.ot;
  }
  getRotation() {
    return this.ut;
  }
  getScale() {
    return this.ct;
  }
  setTranslation(t) {
    return this.ot = t, this;
  }
  setRotation(t) {
    return this.ut = t, this;
  }
  setScale(t) {
    return this.ct = t, this;
  }
  getMatrix() {
    return S.compose(this.ot, this.ut, this.ct, []);
  }
  setMatrix(t) {
    return S.decompose(t, this.ot, this.ut, this.ct), this;
  }
  getWorldTranslation() {
    const t = [0, 0, 0];
    return S.decompose(this.getWorldMatrix(), t, [0, 0, 0, 1], [1, 1, 1]), t;
  }
  getWorldRotation() {
    const t = [0, 0, 0, 1];
    return S.decompose(this.getWorldMatrix(), [0, 0, 0], t, [1, 1, 1]), t;
  }
  getWorldScale() {
    const t = [1, 1, 1];
    return S.decompose(this.getWorldMatrix(), [0, 0, 0], [0, 0, 0, 1], t), t;
  }
  getWorldMatrix() {
    const t = [];
    for (let s2 = this; s2 instanceof X; s2 = s2.i)
      t.push(s2);
    let s;
    const e = t.pop().getMatrix();
    for (; s = t.pop(); )
      multiply(e, e, s.getMatrix());
    return e;
  }
  addChild(t) {
    t.i && t.i.removeChild(t);
    const s = this.graph.link("child", this, t);
    return this.addGraphChild(this.children, s), t.i = this, s.onDispose(() => t.i = null), this;
  }
  removeChild(t) {
    return this.removeGraphChild(this.children, t);
  }
  listChildren() {
    return this.children.map((t) => t.getChild());
  }
  getParent() {
    return this.i;
  }
  getMesh() {
    return this.mesh ? this.mesh.getChild() : null;
  }
  setMesh(t) {
    return this.mesh = this.graph.link("mesh", this, t), this;
  }
  getCamera() {
    return this.camera ? this.camera.getChild() : null;
  }
  setCamera(t) {
    return this.camera = this.graph.link("camera", this, t), this;
  }
  getSkin() {
    return this.skin ? this.skin.getChild() : null;
  }
  setSkin(t) {
    return this.skin = this.graph.link("skin", this, t), this;
  }
  getWeights() {
    return this.ht;
  }
  setWeights(t) {
    return this.ht = t, this;
  }
  traverse(t) {
    t(this);
    for (const s of this.listChildren())
      s.traverse(t);
    return this;
  }
};
l([p], X.prototype, "camera", void 0), l([p], X.prototype, "mesh", void 0), l([p], X.prototype, "skin", void 0), l([g], X.prototype, "children", void 0);
var tt = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.PRIMITIVE, this.at = tt.Mode.TRIANGLES, this.material = null, this.indices = null, this.attributes = [], this.targets = [];
  }
  copy(t, s = _) {
    return super.copy(t, s), this.at = t.at, this.setIndices(t.indices ? s(t.indices.getChild()) : null), this.setMaterial(t.material ? s(t.material.getChild()) : null), this.clearGraphChildList(this.attributes), t.listSemantics().forEach((e) => {
      this.setAttribute(e, s(t.getAttribute(e)));
    }), this.clearGraphChildList(this.targets), t.targets.forEach((t2) => this.addTarget(s(t2.getChild()))), this;
  }
  getIndices() {
    return this.indices ? this.indices.getChild() : null;
  }
  setIndices(t) {
    return this.indices = this.graph.linkIndex("indices", this, t), this;
  }
  getAttribute(t) {
    const s = this.attributes.find((s2) => s2.semantic === t);
    return s ? s.getChild() : null;
  }
  setAttribute(t, s) {
    const e = this.getAttribute(t);
    if (e && this.removeGraphChild(this.attributes, e), !s)
      return this;
    const i = this.graph.linkAttribute(t, this, s);
    return this.addGraphChild(this.attributes, i);
  }
  listAttributes() {
    return this.attributes.map((t) => t.getChild());
  }
  listSemantics() {
    return this.attributes.map((t) => t.semantic);
  }
  getMaterial() {
    return this.material ? this.material.getChild() : null;
  }
  setMaterial(t) {
    return this.material = this.graph.link("material", this, t), this;
  }
  getMode() {
    return this.at;
  }
  setMode(t) {
    return this.at = t, this;
  }
  listTargets() {
    return this.targets.map((t) => t.getChild());
  }
  addTarget(t) {
    return this.addGraphChild(this.targets, this.graph.link("target", this, t)), this;
  }
  removeTarget(t) {
    return this.removeGraphChild(this.targets, t);
  }
};
tt.Mode = { POINTS: 0, LINES: 1, LINE_LOOP: 2, LINE_STRIP: 3, TRIANGLES: 4, TRIANGLE_STRIP: 5, TRIANGLE_FAN: 6 }, l([p], tt.prototype, "material", void 0), l([p], tt.prototype, "indices", void 0), l([g], tt.prototype, "attributes", void 0), l([g], tt.prototype, "targets", void 0);
var st = class extends O {
  constructor(...t) {
    super(...t), this.propertyType = o.PRIMITIVE_TARGET, this.attributes = [];
  }
  copy(t, s = _) {
    return super.copy(t, s), this.clearGraphChildList(this.attributes), t.listSemantics().forEach((e) => {
      this.setAttribute(e, s(t.getAttribute(e)));
    }), this;
  }
  getAttribute(t) {
    const s = this.attributes.find((s2) => s2.semantic === t);
    return s ? s.getChild() : null;
  }
  setAttribute(t, s) {
    const e = this.getAttribute(t);
    if (e && this.removeGraphChild(this.attributes, e), !s)
      return this;
    const i = this.graph.linkAttribute(t, this, s);
    return i.semantic = t, this.addGraphChild(this.attributes, i);
  }
  listAttributes() {
    return this.attributes.map((t) => t.getChild());
  }
  listSemantics() {
    return this.attributes.map((t) => t.semantic);
  }
};
l([g], st.prototype, "attributes", void 0);
var et = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.SCENE, this.children = [];
  }
  copy(t, s = _) {
    return super.copy(t, s), s !== _ && (this.clearGraphChildList(this.children), t.children.forEach((t2) => this.addChild(s(t2.getChild())))), this;
  }
  addChild(t) {
    t.i && t.i.removeChild(t);
    const s = this.graph.link("child", this, t);
    return this.addGraphChild(this.children, s), t.i = this, s.onDispose(() => t.i = null), this;
  }
  removeChild(t) {
    return this.removeGraphChild(this.children, t);
  }
  listChildren() {
    return this.children.map((t) => t.getChild());
  }
  traverse(t) {
    for (const s of this.listChildren())
      s.traverse(t);
    return this;
  }
};
l([g], et.prototype, "children", void 0);
var it = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.SKIN, this.skeleton = null, this.inverseBindMatrices = null, this.joints = [];
  }
  copy(t, s = _) {
    return super.copy(t, s), this.setSkeleton(t.skeleton ? s(t.skeleton.getChild()) : null), this.setInverseBindMatrices(t.inverseBindMatrices ? s(t.inverseBindMatrices.getChild()) : null), this.clearGraphChildList(this.joints), t.joints.forEach((t2) => this.addJoint(s(t2.getChild()))), this;
  }
  getSkeleton() {
    return this.skeleton ? this.skeleton.getChild() : null;
  }
  setSkeleton(t) {
    return this.skeleton = this.graph.link("skeleton", this, t), this;
  }
  getInverseBindMatrices() {
    return this.inverseBindMatrices ? this.inverseBindMatrices.getChild() : null;
  }
  setInverseBindMatrices(t) {
    return this.inverseBindMatrices = this.graph.link("inverseBindMatrices", this, t), this;
  }
  addJoint(t) {
    const s = this.graph.link("joint", this, t);
    return this.addGraphChild(this.joints, s);
  }
  removeJoint(t) {
    return this.removeGraphChild(this.joints, t);
  }
  listJoints() {
    return this.joints.map((t) => t.getChild());
  }
};
l([p], it.prototype, "skeleton", void 0), l([p], it.prototype, "inverseBindMatrices", void 0), l([g], it.prototype, "joints", void 0);
var rt = class extends B {
  constructor(...t) {
    super(...t), this.propertyType = o.TEXTURE, this.lt = null, this.ft = "", this.P = "";
  }
  copy(t, s = _) {
    return super.copy(t, s), this.ft = t.ft, this.P = t.P, t.lt && (this.lt = t.lt.slice(0)), this;
  }
  getMimeType() {
    return this.ft || E.extensionToMimeType(A.extension(this.P));
  }
  setMimeType(t) {
    return this.ft = t, this;
  }
  getURI() {
    return this.P;
  }
  setURI(t) {
    return this.P = t, this.ft = E.extensionToMimeType(A.extension(t)), this;
  }
  getImage() {
    return this.lt;
  }
  setImage(t) {
    return this.lt = t, this;
  }
  getSize() {
    return this.lt ? E.getSize(this.lt, this.getMimeType()) : null;
  }
};
var nt = class extends O {
  constructor(t) {
    super(t), this.propertyType = o.ROOT, this.dt = { generator: "glTF-Transform v1.0.0", version: "2.0" }, this.gt = new Set(), this.defaultScene = null, this.accessors = [], this.animations = [], this.buffers = [], this.cameras = [], this.materials = [], this.meshes = [], this.nodes = [], this.scenes = [], this.skins = [], this.textures = [], t.on("clone", (t2) => this.wt(t2));
  }
  clone() {
    throw new Error("Root cannot be cloned.");
  }
  copy(t, s = _) {
    if (super.copy(t, s), s === _)
      throw new Error("Root cannot be copied.");
    return Object.assign(this.dt, t.dt), t.accessors.forEach((t2) => this.vt(s(t2.getChild()))), t.animations.forEach((t2) => this.Tt(s(t2.getChild()))), t.buffers.forEach((t2) => this.yt(s(t2.getChild()))), t.cameras.forEach((t2) => this.At(s(t2.getChild()))), t.materials.forEach((t2) => this.xt(s(t2.getChild()))), t.meshes.forEach((t2) => this.Et(s(t2.getChild()))), t.nodes.forEach((t2) => this.Mt(s(t2.getChild()))), t.scenes.forEach((t2) => this.St(s(t2.getChild()))), t.skins.forEach((t2) => this.It(s(t2.getChild()))), t.textures.forEach((t2) => this.bt(s(t2.getChild()))), this.setDefaultScene(t.defaultScene ? s(t.defaultScene.getChild()) : null), this;
  }
  wt(t) {
    return t instanceof et ? this.St(t) : t instanceof X ? this.Mt(t) : t instanceof j ? this.At(t) : t instanceof it ? this.It(t) : t instanceof Q ? this.Et(t) : t instanceof K ? this.xt(t) : t instanceof rt ? this.bt(t) : t instanceof U ? this.Tt(t) : t instanceof P ? this.vt(t) : t instanceof G && this.yt(t), this;
  }
  getAsset() {
    return this.dt;
  }
  listExtensionsUsed() {
    return Array.from(this.gt);
  }
  listExtensionsRequired() {
    return this.listExtensionsUsed().filter((t) => t.isRequired());
  }
  Rt(t) {
    return this.gt.add(t), this;
  }
  Nt(t) {
    return this.gt.delete(t), this;
  }
  St(t) {
    return this.addGraphChild(this.scenes, this.graph.link("scene", this, t));
  }
  listScenes() {
    return this.scenes.map((t) => t.getChild());
  }
  setDefaultScene(t) {
    return this.defaultScene = this.graph.link("scene", this, t), this;
  }
  getDefaultScene() {
    return this.defaultScene ? this.defaultScene.getChild() : null;
  }
  Mt(t) {
    return this.addGraphChild(this.nodes, this.graph.link("node", this, t));
  }
  listNodes() {
    return this.nodes.map((t) => t.getChild());
  }
  At(t) {
    return this.addGraphChild(this.cameras, this.graph.link("camera", this, t));
  }
  listCameras() {
    return this.cameras.map((t) => t.getChild());
  }
  It(t) {
    return this.addGraphChild(this.skins, this.graph.link("skin", this, t));
  }
  listSkins() {
    return this.skins.map((t) => t.getChild());
  }
  Et(t) {
    return this.addGraphChild(this.meshes, this.graph.link("mesh", this, t));
  }
  listMeshes() {
    return this.meshes.map((t) => t.getChild());
  }
  xt(t) {
    return this.addGraphChild(this.materials, this.graph.link("material", this, t));
  }
  listMaterials() {
    return this.materials.map((t) => t.getChild());
  }
  bt(t) {
    return this.addGraphChild(this.textures, this.graph.link("texture", this, t));
  }
  listTextures() {
    return this.textures.map((t) => t.getChild());
  }
  Tt(t) {
    return this.addGraphChild(this.animations, this.graph.link("animation", this, t));
  }
  listAnimations() {
    return this.animations.map((t) => t.getChild());
  }
  vt(t) {
    return this.addGraphChild(this.accessors, this.graph.link("accessor", this, t));
  }
  listAccessors() {
    return this.accessors.map((t) => t.getChild());
  }
  yt(t) {
    return this.addGraphChild(this.buffers, this.graph.link("buffer", this, t));
  }
  listBuffers() {
    return this.buffers.map((t) => t.getChild());
  }
};
l([p], nt.prototype, "defaultScene", void 0), l([g], nt.prototype, "accessors", void 0), l([g], nt.prototype, "animations", void 0), l([g], nt.prototype, "buffers", void 0), l([g], nt.prototype, "cameras", void 0), l([g], nt.prototype, "materials", void 0), l([g], nt.prototype, "meshes", void 0), l([g], nt.prototype, "nodes", void 0), l([g], nt.prototype, "scenes", void 0), l([g], nt.prototype, "skins", void 0), l([g], nt.prototype, "textures", void 0);
var ht = class {
  constructor() {
    this.Ct = new V(), this._t = new nt(this.Ct), this.Ot = I.DEFAULT_INSTANCE;
  }
  getRoot() {
    return this._t;
  }
  getGraph() {
    return this.Ct;
  }
  getLogger() {
    return this.Ot;
  }
  setLogger(t) {
    return this.Ot = t, this;
  }
  clone() {
    return new ht().merge(this).setLogger(this.Ot);
  }
  merge(t) {
    const s = {};
    for (const e2 of t.getRoot().listExtensionsUsed()) {
      const t2 = this.createExtension(e2.constructor);
      e2.isRequired() && t2.setRequired(true), s[t2.extensionName] = t2;
    }
    const e = new Set(), i = new Map();
    e.add(t._t), i.set(t._t, this._t);
    for (const r2 of t.Ct.getLinks())
      for (const t2 of [r2.getParent(), r2.getChild()]) {
        if (e.has(t2))
          continue;
        let r3;
        if (t2.propertyType === o.TEXTURE_INFO)
          r3 = t2;
        else {
          const e2 = t2.constructor;
          r3 = t2 instanceof D ? new e2(this.Ct, s[t2.extensionName]) : new e2(this.Ct);
        }
        i.set(t2, r3), e.add(t2);
      }
    const r = (t2) => {
      const s2 = i.get(t2);
      if (!s2)
        throw new Error("Could resolve property.");
      return s2;
    };
    for (const t2 of e) {
      const s2 = i.get(t2);
      if (!s2)
        throw new Error("Could resolve property.");
      s2.copy(t2, r);
    }
    return this;
  }
  async transform(...t) {
    for (const s of t)
      await s(this);
    return this;
  }
  createExtension(t) {
    const s = t.EXTENSION_NAME;
    return this.getRoot().listExtensionsUsed().find((t2) => t2.extensionName === s) || new t(this);
  }
  createScene(t = "") {
    const s = new et(this.Ct, t);
    return this._t.St(s), s;
  }
  createNode(t = "") {
    const s = new X(this.Ct, t);
    return this._t.Mt(s), s;
  }
  createCamera(t = "") {
    const s = new j(this.Ct, t);
    return this._t.At(s), s;
  }
  createSkin(t = "") {
    const s = new it(this.Ct, t);
    return this._t.It(s), s;
  }
  createMesh(t = "") {
    const s = new Q(this.Ct, t);
    return this._t.Et(s), s;
  }
  createPrimitive() {
    return new tt(this.Ct);
  }
  createPrimitiveTarget(t = "") {
    return new st(this.Ct, t);
  }
  createMaterial(t = "") {
    const s = new K(this.Ct, t);
    return this._t.xt(s), s;
  }
  createTexture(t = "") {
    const s = new rt(this.Ct, t);
    return this._t.bt(s), s;
  }
  createAnimation(t = "") {
    const s = new U(this.Ct, t);
    return this._t.Tt(s), s;
  }
  createAnimationChannel(t = "") {
    return new k(this.Ct, t);
  }
  createAnimationSampler(t = "") {
    return new F(this.Ct, t);
  }
  createAccessor(t = "", s = null) {
    s || (s = this.getRoot().listBuffers()[0]);
    const e = new P(this.Ct, t).setBuffer(s);
    return this._t.vt(e), e;
  }
  createBuffer(t = "") {
    const s = new G(this.Ct, t);
    return this._t.yt(s), s;
  }
};
var ot = class {
  constructor(t) {
    this.doc = void 0, this.extensionName = "", this.prereadTypes = [], this.prewriteTypes = [], this.readDependencies = [], this.writeDependencies = [], this.required = false, this.properties = new Set(), this.doc = t, t.getRoot().Rt(this);
  }
  dispose() {
    this.doc.getRoot().Nt(this);
    for (const t of this.properties)
      t.dispose();
  }
  static register() {
  }
  isRequired() {
    return this.required;
  }
  setRequired(t) {
    return this.required = t, this;
  }
  addExtensionProperty(t) {
    return this.properties.add(t), this;
  }
  removeExtensionProperty(t) {
    return this.properties.delete(t), this;
  }
  install(t, s) {
    return this;
  }
  preread(t, s) {
    return this;
  }
  prewrite(t, s) {
    return this;
  }
};
function ut() {
  return (ut = Object.assign || function(t) {
    for (var s = 1; s < arguments.length; s++) {
      var e = arguments[s];
      for (var i in e)
        Object.prototype.hasOwnProperty.call(e, i) && (t[i] = e[i]);
    }
    return t;
  }).apply(this, arguments);
}
ot.EXTENSION_NAME = void 0;
var ct = class {
  constructor(t) {
    this.jsonDoc = void 0, this.buffers = [], this.bufferViews = [], this.bufferViewBuffers = [], this.accessors = [], this.textures = [], this.textureInfos = new Map(), this.materials = [], this.meshes = [], this.cameras = [], this.nodes = [], this.skins = [], this.animations = [], this.scenes = [], this.jsonDoc = t;
  }
  setTextureInfo(t, s) {
    this.textureInfos.set(t, s), s.texCoord !== void 0 && t.setTexCoord(s.texCoord);
    const e = this.jsonDoc.json.textures[s.index];
    if (e.sampler === void 0)
      return;
    const i = this.jsonDoc.json.samplers[e.sampler];
    i.magFilter !== void 0 && t.setMagFilter(i.magFilter), i.minFilter !== void 0 && t.setMinFilter(i.minFilter), i.wrapS !== void 0 && t.setWrapS(i.wrapS), i.wrapT !== void 0 && t.setWrapT(i.wrapT);
  }
};
var at = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
var lt = { logger: I.DEFAULT_INSTANCE, extensions: [], dependencies: {} };
var ft = class {
  static read(t, s = lt) {
    const e = ut({}, lt, s), { json: i } = t, r = new ht();
    this.validate(t, e);
    const n2 = new ct(t), h2 = i.asset, u2 = r.getRoot().getAsset();
    h2.copyright && (u2.copyright = h2.copyright), h2.extras && (u2.extras = h2.extras), i.extras !== void 0 && r.getRoot().setExtras(ut({}, i.extras));
    const c2 = i.extensionsUsed || [], a2 = i.extensionsRequired || [];
    for (const t2 of e.extensions)
      if (c2.includes(t2.EXTENSION_NAME)) {
        const s2 = r.createExtension(t2).setRequired(a2.includes(t2.EXTENSION_NAME));
        for (const t3 of s2.readDependencies)
          s2.install(t3, e.dependencies[t3]);
      }
    const l2 = i.buffers || [];
    r.getRoot().listExtensionsUsed().filter((t2) => t2.prereadTypes.includes(o.BUFFER)).forEach((t2) => t2.preread(n2, o.BUFFER)), n2.buffers = l2.map((t2) => {
      const s2 = r.createBuffer(t2.name);
      return t2.extras && s2.setExtras(t2.extras), t2.uri && t2.uri.indexOf("__") !== 0 && s2.setURI(t2.uri), s2;
    }), n2.bufferViewBuffers = (i.bufferViews || []).map((s2, e2) => {
      if (!n2.bufferViews[e2]) {
        const i2 = t.json.buffers[s2.buffer], r2 = new Uint8Array(i2.uri ? t.resources[i2.uri] : t.resources["@glb.bin"], s2.byteOffset || 0, s2.byteLength);
        n2.bufferViews[e2] = r2;
      }
      return n2.buffers[s2.buffer];
    }), n2.accessors = (i.accessors || []).map((t2) => {
      const s2 = r.createAccessor(t2.name, n2.bufferViewBuffers[t2.bufferView]).setType(t2.type);
      if (t2.extras && s2.setExtras(t2.extras), t2.normalized !== void 0 && s2.setNormalized(t2.normalized), t2.bufferView === void 0 && !t2.sparse)
        return s2;
      let e2;
      return e2 = t2.sparse !== void 0 ? function(t3, s3) {
        const e3 = at[t3.componentType], i2 = P.getElementSize(t3.type);
        let r2;
        r2 = t3.bufferView !== void 0 ? dt(t3, s3) : new e3(t3.count * i2);
        const n3 = t3.sparse, h3 = n3.count, o2 = ut({}, t3, n3.indices, { count: h3, type: "SCALAR" }), u3 = ut({}, t3, n3.values, { count: h3 }), c3 = dt(o2, s3), a3 = dt(u3, s3);
        for (let t4 = 0; t4 < o2.count; t4++)
          for (let s4 = 0; s4 < i2; s4++)
            r2[c3[t4] * i2 + s4] = a3[t4 * i2 + s4];
        return r2;
      }(t2, n2) : dt(t2, n2), s2.setArray(e2), s2;
    });
    const f2 = i.images || [], d2 = i.textures || [];
    r.getRoot().listExtensionsUsed().filter((t2) => t2.prereadTypes.includes(o.TEXTURE)).forEach((t2) => t2.preread(n2, o.TEXTURE)), n2.textures = f2.map((s2) => {
      const e2 = r.createTexture(s2.name);
      if (s2.extras && e2.setExtras(s2.extras), s2.bufferView !== void 0) {
        const r2 = i.bufferViews[s2.bufferView], n3 = t.json.buffers[r2.buffer], h3 = r2.byteOffset || 0, o2 = (n3.uri ? t.resources[n3.uri] : t.resources["@glb.bin"]).slice(h3, h3 + r2.byteLength);
        e2.setImage(o2);
      } else
        s2.uri !== void 0 && (e2.setImage(t.resources[s2.uri]), s2.uri.indexOf("__") !== 0 && e2.setURI(s2.uri));
      if (s2.mimeType !== void 0)
        e2.setMimeType(s2.mimeType);
      else if (s2.uri) {
        const t2 = A.extension(s2.uri);
        e2.setMimeType(E.extensionToMimeType(t2));
      }
      return e2;
    }), n2.materials = (i.materials || []).map((t2) => {
      const s2 = r.createMaterial(t2.name);
      t2.extras && s2.setExtras(t2.extras), t2.alphaMode !== void 0 && s2.setAlphaMode(t2.alphaMode), t2.alphaCutoff !== void 0 && s2.setAlphaCutoff(t2.alphaCutoff), t2.doubleSided !== void 0 && s2.setDoubleSided(t2.doubleSided);
      const e2 = t2.pbrMetallicRoughness || {};
      if (e2.baseColorFactor !== void 0 && s2.setBaseColorFactor(e2.baseColorFactor), t2.emissiveFactor !== void 0 && s2.setEmissiveFactor(t2.emissiveFactor), e2.metallicFactor !== void 0 && s2.setMetallicFactor(e2.metallicFactor), e2.roughnessFactor !== void 0 && s2.setRoughnessFactor(e2.roughnessFactor), e2.baseColorTexture !== void 0) {
        const t3 = e2.baseColorTexture;
        s2.setBaseColorTexture(n2.textures[d2[t3.index].source]), n2.setTextureInfo(s2.getBaseColorTextureInfo(), t3);
      }
      if (t2.emissiveTexture !== void 0) {
        const e3 = t2.emissiveTexture;
        s2.setEmissiveTexture(n2.textures[d2[e3.index].source]), n2.setTextureInfo(s2.getEmissiveTextureInfo(), e3);
      }
      if (t2.normalTexture !== void 0) {
        const e3 = t2.normalTexture;
        s2.setNormalTexture(n2.textures[d2[e3.index].source]), n2.setTextureInfo(s2.getNormalTextureInfo(), e3), t2.normalTexture.scale !== void 0 && s2.setNormalScale(t2.normalTexture.scale);
      }
      if (t2.occlusionTexture !== void 0) {
        const e3 = t2.occlusionTexture;
        s2.setOcclusionTexture(n2.textures[d2[e3.index].source]), n2.setTextureInfo(s2.getOcclusionTextureInfo(), e3), t2.occlusionTexture.strength !== void 0 && s2.setOcclusionStrength(t2.occlusionTexture.strength);
      }
      if (e2.metallicRoughnessTexture !== void 0) {
        const t3 = e2.metallicRoughnessTexture;
        s2.setMetallicRoughnessTexture(n2.textures[d2[t3.index].source]), n2.setTextureInfo(s2.getMetallicRoughnessTextureInfo(), t3);
      }
      return s2;
    });
    const p2 = i.meshes || [];
    r.getRoot().listExtensionsUsed().filter((t2) => t2.prereadTypes.includes(o.PRIMITIVE)).forEach((t2) => t2.preread(n2, o.PRIMITIVE)), n2.meshes = p2.map((t2) => {
      const s2 = r.createMesh(t2.name);
      return t2.extras && s2.setExtras(t2.extras), t2.weights !== void 0 && s2.setWeights(t2.weights), (t2.primitives || []).forEach((e2) => {
        const i2 = r.createPrimitive();
        e2.extras && i2.setExtras(e2.extras), e2.material !== void 0 && i2.setMaterial(n2.materials[e2.material]), e2.mode !== void 0 && i2.setMode(e2.mode);
        for (const [t3, s3] of Object.entries(e2.attributes || {}))
          i2.setAttribute(t3, n2.accessors[s3]);
        e2.indices !== void 0 && i2.setIndices(n2.accessors[e2.indices]);
        const h3 = t2.extras && t2.extras.targetNames || [];
        (e2.targets || []).forEach((t3, s3) => {
          const e3 = h3[s3] || s3.toString(), o2 = r.createPrimitiveTarget(e3);
          for (const [s4, e4] of Object.entries(t3))
            o2.setAttribute(s4, n2.accessors[e4]);
          i2.addTarget(o2);
        }), s2.addPrimitive(i2);
      }), s2;
    }), n2.cameras = (i.cameras || []).map((t2) => {
      const s2 = r.createCamera(t2.name).setType(t2.type);
      if (t2.extras && s2.setExtras(t2.extras), t2.type === j.Type.PERSPECTIVE) {
        const e2 = t2.perspective;
        s2.setYFov(e2.yfov), s2.setZNear(e2.znear), e2.zfar !== void 0 && s2.setZFar(e2.zfar), e2.aspectRatio !== void 0 && s2.setAspectRatio(e2.aspectRatio);
      } else {
        const e2 = t2.orthographic;
        s2.setZNear(e2.znear).setZFar(e2.zfar).setXMag(e2.xmag).setYMag(e2.ymag);
      }
      return s2;
    });
    const g2 = i.nodes || [];
    r.getRoot().listExtensionsUsed().filter((t2) => t2.prereadTypes.includes(o.NODE)).forEach((t2) => t2.preread(n2, o.NODE)), n2.nodes = g2.map((t2) => {
      const s2 = r.createNode(t2.name);
      if (t2.extras && s2.setExtras(t2.extras), t2.translation !== void 0 && s2.setTranslation(t2.translation), t2.rotation !== void 0 && s2.setRotation(t2.rotation), t2.scale !== void 0 && s2.setScale(t2.scale), t2.matrix !== void 0) {
        const e2 = [0, 0, 0], i2 = [0, 0, 0, 1], r2 = [1, 1, 1];
        S.decompose(t2.matrix, e2, i2, r2), s2.setTranslation(e2), s2.setRotation(i2), s2.setScale(r2);
      }
      return t2.weights !== void 0 && s2.setWeights(t2.weights), s2;
    }), n2.skins = (i.skins || []).map((t2) => {
      const s2 = r.createSkin(t2.name);
      t2.extras && s2.setExtras(t2.extras), t2.inverseBindMatrices !== void 0 && s2.setInverseBindMatrices(n2.accessors[t2.inverseBindMatrices]), t2.skeleton !== void 0 && s2.setSkeleton(n2.nodes[t2.skeleton]);
      for (const e2 of t2.joints)
        s2.addJoint(n2.nodes[e2]);
      return s2;
    }), g2.map((t2, s2) => {
      const e2 = n2.nodes[s2];
      (t2.children || []).forEach((t3) => e2.addChild(n2.nodes[t3])), t2.mesh !== void 0 && e2.setMesh(n2.meshes[t2.mesh]), t2.camera !== void 0 && e2.setCamera(n2.cameras[t2.camera]), t2.skin !== void 0 && e2.setSkin(n2.skins[t2.skin]);
    }), n2.animations = (i.animations || []).map((t2) => {
      const s2 = r.createAnimation(t2.name);
      t2.extras && s2.setExtras(t2.extras);
      const e2 = (t2.samplers || []).map((t3) => {
        const e3 = r.createAnimationSampler().setInput(n2.accessors[t3.input]).setOutput(n2.accessors[t3.output]).setInterpolation(t3.interpolation || F.Interpolation.LINEAR);
        return t3.extras && e3.setExtras(t3.extras), s2.addSampler(e3), e3;
      });
      return (t2.channels || []).forEach((t3) => {
        const i2 = r.createAnimationChannel().setSampler(e2[t3.sampler]).setTargetNode(n2.nodes[t3.target.node]).setTargetPath(t3.target.path);
        t3.extras && i2.setExtras(t3.extras), s2.addChannel(i2);
      }), s2;
    });
    const w2 = i.scenes || [];
    return r.getRoot().listExtensionsUsed().filter((t2) => t2.prereadTypes.includes(o.SCENE)).forEach((t2) => t2.preread(n2, o.SCENE)), n2.scenes = w2.map((t2) => {
      const s2 = r.createScene(t2.name);
      return t2.extras && s2.setExtras(t2.extras), (t2.nodes || []).map((t3) => n2.nodes[t3]).forEach((t3) => s2.addChild(t3)), s2;
    }), i.scene !== void 0 && r.getRoot().setDefaultScene(n2.scenes[i.scene]), r.getRoot().listExtensionsUsed().forEach((t2) => t2.read(n2)), r;
  }
  static validate(t, s) {
    const e = t.json;
    if (e.asset.version !== "2.0")
      throw new Error(`Unsupported glTF version, "${e.asset.version}".`);
    if (e.extensionsRequired) {
      for (const t2 of e.extensionsRequired)
        if (!s.extensions.find((s2) => s2.EXTENSION_NAME === t2))
          throw new Error(`Missing required extension, "${t2}".`);
    }
    if (e.extensionsUsed)
      for (const t2 of e.extensionsUsed)
        s.extensions.find((s2) => s2.EXTENSION_NAME === t2) || s.logger.warn(`Missing optional extension, "${t2}".`);
  }
};
function dt(t, s) {
  const e = s.bufferViews[t.bufferView], i = s.jsonDoc.json.bufferViews[t.bufferView], r = at[t.componentType], n2 = P.getElementSize(t.type), h2 = r.BYTES_PER_ELEMENT;
  if (i.byteStride !== void 0 && i.byteStride !== n2 * h2)
    return function(t2, s2) {
      const e2 = s2.bufferViews[t2.bufferView], i2 = s2.jsonDoc.json.bufferViews[t2.bufferView], r2 = at[t2.componentType], n3 = P.getElementSize(t2.type), h3 = r2.BYTES_PER_ELEMENT, o3 = t2.byteOffset || 0, u2 = new r2(t2.count * n3), c2 = new DataView(e2.buffer, e2.byteOffset, e2.byteLength), a2 = i2.byteStride;
      for (let s3 = 0; s3 < t2.count; s3++)
        for (let e3 = 0; e3 < n3; e3++) {
          const i3 = o3 + s3 * a2 + e3 * h3;
          let r3;
          switch (t2.componentType) {
            case P.ComponentType.FLOAT:
              r3 = c2.getFloat32(i3, true);
              break;
            case P.ComponentType.UNSIGNED_INT:
              r3 = c2.getUint32(i3, true);
              break;
            case P.ComponentType.UNSIGNED_SHORT:
              r3 = c2.getUint16(i3, true);
              break;
            case P.ComponentType.UNSIGNED_BYTE:
              r3 = c2.getUint8(i3);
              break;
            case P.ComponentType.SHORT:
              r3 = c2.getInt16(i3, true);
              break;
            case P.ComponentType.BYTE:
              r3 = c2.getInt8(i3);
              break;
            default:
              throw new Error(`Unexpected componentType "${t2.componentType}".`);
          }
          u2[s3 * n3 + e3] = r3;
        }
      return u2;
    }(t, s);
  const o2 = e.byteOffset + (t.byteOffset || 0);
  return new r(e.buffer.slice(o2, o2 + t.count * n2 * h2));
}
var pt;
var gt;
!function(t) {
  t[t.ARRAY_BUFFER = 34962] = "ARRAY_BUFFER", t[t.ELEMENT_ARRAY_BUFFER = 34963] = "ELEMENT_ARRAY_BUFFER";
}(pt || (pt = {})), function(t) {
  t.ARRAY_BUFFER = "ARRAY_BUFFER", t.ELEMENT_ARRAY_BUFFER = "ELEMENT_ARRAY_BUFFER", t.INVERSE_BIND_MATRICES = "INVERSE_BIND_MATRICES", t.OTHER = "OTHER";
}(gt || (gt = {}));
var wt = class {
  constructor(t, s, e) {
    this.Lt = void 0, this.jsonDoc = void 0, this.options = void 0, this.accessorIndexMap = new Map(), this.bufferIndexMap = new Map(), this.cameraIndexMap = new Map(), this.skinIndexMap = new Map(), this.materialIndexMap = new Map(), this.meshIndexMap = new Map(), this.nodeIndexMap = new Map(), this.imageIndexMap = new Map(), this.textureDefIndexMap = new Map(), this.textureInfoDefMap = new Map(), this.samplerDefIndexMap = new Map(), this.imageBufferViews = [], this.otherBufferViews = new Map(), this.otherBufferViewsIndexMap = new Map(), this.extensionData = {}, this.bufferURIGenerator = void 0, this.imageURIGenerator = void 0, this.logger = void 0, this.Bt = new Map(), this.accessorUsageGroupedByParent = new Set(["ARRAY_BUFFER"]), this.accessorParents = new Map(), this.Lt = t, this.jsonDoc = s, this.options = e;
    const i = t.getRoot(), r = i.listBuffers().length, n2 = i.listTextures().length;
    this.bufferURIGenerator = new vt(r > 1, e.basename), this.imageURIGenerator = new vt(n2 > 1, e.basename), this.logger = t.getLogger();
  }
  createTextureInfoDef(t, s) {
    const e = { magFilter: s.getMagFilter() || void 0, minFilter: s.getMinFilter() || void 0, wrapS: s.getWrapS(), wrapT: s.getWrapT() }, i = JSON.stringify(e);
    this.samplerDefIndexMap.has(i) || (this.samplerDefIndexMap.set(i, this.jsonDoc.json.samplers.length), this.jsonDoc.json.samplers.push(e));
    const r = { source: this.imageIndexMap.get(t), sampler: this.samplerDefIndexMap.get(i) }, n2 = JSON.stringify(r);
    this.textureDefIndexMap.has(n2) || (this.textureDefIndexMap.set(n2, this.jsonDoc.json.textures.length), this.jsonDoc.json.textures.push(r));
    const h2 = { index: this.textureDefIndexMap.get(n2) };
    return s.getTexCoord() !== 0 && (h2.texCoord = s.getTexCoord()), this.textureInfoDefMap.set(s, h2), h2;
  }
  createPropertyDef(t) {
    const s = {};
    return t.getName() && (s.name = t.getName()), Object.keys(t.getExtras()).length > 0 && (s.extras = t.getExtras()), s;
  }
  createAccessorDef(t) {
    const s = this.createPropertyDef(t);
    return s.type = t.getType(), s.componentType = t.getComponentType(), s.count = t.getCount(), this.Lt.getGraph().listParentLinks(t).some((t2) => t2.getName() === "POSITION" || t2.getName() === "input") && (s.max = t.getMax([]).map(Math.fround), s.min = t.getMin([]).map(Math.fround)), t.getNormalized() && (s.normalized = t.getNormalized()), s;
  }
  createImageData(t, s, e) {
    if (this.options.format === a.GLB)
      this.imageBufferViews.push(s), t.bufferView = this.jsonDoc.json.bufferViews.length, this.jsonDoc.json.bufferViews.push({ buffer: 0, byteOffset: -1, byteLength: s.byteLength });
    else {
      const i = E.mimeTypeToExtension(e.getMimeType());
      t.uri = this.imageURIGenerator.createURI(e, i), this.jsonDoc.resources[t.uri] = s;
    }
  }
  getAccessorUsage(t) {
    const s = this.Bt.get(t);
    if (s)
      return s;
    for (const s2 of this.Lt.getGraph().listParentLinks(t)) {
      if (s2.getName() === "inverseBindMatrices")
        return wt.BufferViewUsage.INVERSE_BIND_MATRICES;
      if (s2 instanceof J)
        return wt.BufferViewUsage.ARRAY_BUFFER;
      if (s2 instanceof z)
        return wt.BufferViewUsage.ELEMENT_ARRAY_BUFFER;
    }
    return wt.BufferViewUsage.OTHER;
  }
  addAccessorToUsageGroup(t, s) {
    const e = this.Bt.get(t);
    if (e && e !== s)
      throw new Error(`Accessor with usage "${e}" cannot be reused as "${s}".`);
    return this.Bt.set(t, s), this;
  }
  listAccessorUsageGroups() {
    const t = {};
    for (const [s, e] of Array.from(this.Bt.entries()))
      t[e] = t[e] || [], t[e].push(s);
    return t;
  }
};
wt.BufferViewTarget = pt, wt.BufferViewUsage = gt, wt.USAGE_TO_TARGET = { [gt.ARRAY_BUFFER]: pt.ARRAY_BUFFER, [gt.ELEMENT_ARRAY_BUFFER]: pt.ELEMENT_ARRAY_BUFFER };
var vt = class {
  constructor(t, s) {
    this.multiple = void 0, this.basename = void 0, this.counter = 1, this.multiple = t, this.basename = s;
  }
  createURI(t, s) {
    return t.getURI() ? t.getURI() : this.multiple ? `${this.basename}_${this.counter++}.${s}` : `${this.basename}.${s}`;
  }
};
var { BufferViewUsage: mt } = wt;
var Tt = class {
  static write(t, s) {
    const e = t.getRoot(), i = { asset: ut({ generator: "glTF-Transform v1.0.0" }, e.getAsset()), extras: ut({}, e.getExtras()) }, r = { json: i, resources: {} }, n2 = new wt(t, r, s), h2 = s.logger || I.DEFAULT_INSTANCE;
    for (const e2 of t.getRoot().listExtensionsUsed())
      for (const t2 of e2.writeDependencies)
        e2.install(t2, s.dependencies[t2]);
    function c2(t2, s2, e2, r2) {
      const h3 = [];
      let o2 = 0;
      for (const s3 of t2) {
        const t3 = n2.createAccessorDef(s3);
        t3.bufferView = i.bufferViews.length;
        const e3 = T.pad(s3.getArray().buffer);
        t3.byteOffset = o2, o2 += e3.byteLength, h3.push(e3), n2.accessorIndexMap.set(s3, i.accessors.length), i.accessors.push(t3);
      }
      const u2 = { buffer: s2, byteOffset: e2, byteLength: T.concat(h3).byteLength };
      return r2 && (u2.target = r2), i.bufferViews.push(u2), { buffers: h3, byteLength: o2 };
    }
    function l2(t2, s2, e2) {
      const r2 = t2[0].getCount();
      let h3 = 0;
      for (const s3 of t2) {
        const t3 = n2.createAccessorDef(s3);
        t3.bufferView = i.bufferViews.length, t3.byteOffset = h3;
        const e3 = s3.getElementSize(), r3 = s3.getComponentSize();
        h3 += T.padNumber(e3 * r3), n2.accessorIndexMap.set(s3, i.accessors.length), i.accessors.push(t3);
      }
      const o2 = r2 * h3, u2 = new ArrayBuffer(o2), c3 = new DataView(u2);
      for (let s3 = 0; s3 < r2; s3++) {
        let e3 = 0;
        for (const i2 of t2) {
          const t3 = i2.getElementSize(), r3 = i2.getComponentSize(), n3 = i2.getComponentType(), o3 = i2.getArray();
          for (let i3 = 0; i3 < t3; i3++) {
            const u3 = s3 * h3 + e3 + i3 * r3, a2 = o3[s3 * t3 + i3];
            switch (n3) {
              case P.ComponentType.FLOAT:
                c3.setFloat32(u3, a2, true);
                break;
              case P.ComponentType.BYTE:
                c3.setInt8(u3, a2);
                break;
              case P.ComponentType.SHORT:
                c3.setInt16(u3, a2, true);
                break;
              case P.ComponentType.UNSIGNED_BYTE:
                c3.setUint8(u3, a2);
                break;
              case P.ComponentType.UNSIGNED_SHORT:
                c3.setUint16(u3, a2, true);
                break;
              case P.ComponentType.UNSIGNED_INT:
                c3.setUint32(u3, a2, true);
                break;
              default:
                throw new Error("Unexpected component type: " + n3);
            }
          }
          e3 += T.padNumber(t3 * r3);
        }
      }
      return i.bufferViews.push({ buffer: s2, byteOffset: e2, byteLength: o2, byteStride: h3, target: wt.BufferViewTarget.ARRAY_BUFFER }), { byteLength: o2, buffers: [u2] };
    }
    const f2 = new Map();
    for (const s2 of t.getGraph().getLinks()) {
      if (s2.getParent() === e)
        continue;
      const t2 = s2.getChild();
      if (t2 instanceof P) {
        const e2 = f2.get(t2) || [];
        e2.push(s2), f2.set(t2, e2);
      }
    }
    if (i.accessors = [], i.bufferViews = [], i.samplers = [], i.textures = [], i.images = e.listTextures().map((t2, s2) => {
      const e2 = n2.createPropertyDef(t2);
      t2.getMimeType() && (e2.mimeType = t2.getMimeType());
      const i2 = t2.getImage();
      return i2 && n2.createImageData(e2, i2, t2), n2.imageIndexMap.set(t2, s2), e2;
    }), t.getRoot().listExtensionsUsed().filter((t2) => t2.prewriteTypes.includes(o.ACCESSOR)).forEach((t2) => t2.prewrite(n2, o.ACCESSOR)), e.listAccessors().forEach((t2) => {
      const s2 = n2.accessorUsageGroupedByParent, e2 = n2.accessorParents;
      if (n2.accessorIndexMap.has(t2))
        return;
      const i2 = f2.get(t2) || [], r2 = n2.getAccessorUsage(t2);
      if (n2.addAccessorToUsageGroup(t2, r2), s2.has(r2)) {
        const s3 = i2[0].getParent(), r3 = e2.get(s3) || new Set();
        r3.add(t2), e2.set(s3, r3);
      }
    }), e.listExtensionsUsed().filter((t2) => t2.prewriteTypes.includes(o.BUFFER)).forEach((t2) => t2.prewrite(n2, o.BUFFER)), (e.listAccessors().length > 0 || e.listTextures().length > 0 || n2.otherBufferViews.size > 0) && e.listBuffers().length === 0)
      throw new Error("Buffer required for Document resources, but none was found.");
    i.buffers = [], e.listBuffers().forEach((t2, e2) => {
      const h3 = n2.createPropertyDef(t2), o2 = n2.accessorUsageGroupedByParent, f3 = n2.accessorParents, d3 = t2.listParents().filter((t3) => t3 instanceof P), p2 = new Set(d3), g2 = [], w2 = i.buffers.length;
      let v2 = 0;
      const m2 = n2.listAccessorUsageGroups();
      for (const t3 in m2)
        if (o2.has(t3))
          for (const e3 of Array.from(f3.values())) {
            const i2 = Array.from(e3).filter((t4) => p2.has(t4)).filter((s2) => n2.getAccessorUsage(s2) === t3);
            if (i2.length)
              if (t3 !== mt.ARRAY_BUFFER || s.vertexLayout === u.INTERLEAVED) {
                const s2 = t3 === mt.ARRAY_BUFFER ? l2(i2, w2, v2) : c2(i2, w2, v2);
                v2 += s2.byteLength, g2.push(...s2.buffers);
              } else
                for (const t4 of i2) {
                  const s2 = l2([t4], w2, v2);
                  v2 += s2.byteLength, g2.push(...s2.buffers);
                }
          }
        else {
          const s2 = m2[t3].filter((t4) => p2.has(t4));
          if (!s2.length)
            continue;
          const e3 = c2(s2, w2, v2, t3 === mt.ELEMENT_ARRAY_BUFFER ? wt.BufferViewTarget.ELEMENT_ARRAY_BUFFER : void 0);
          v2 += e3.byteLength, g2.push(...e3.buffers);
        }
      if (n2.imageBufferViews.length && e2 === 0) {
        for (let t3 = 0; t3 < n2.imageBufferViews.length; t3++)
          if (i.bufferViews[i.images[t3].bufferView].byteOffset = v2, v2 += n2.imageBufferViews[t3].byteLength, g2.push(n2.imageBufferViews[t3]), v2 % 8) {
            const t4 = 8 - v2 % 8;
            v2 += t4, g2.push(new ArrayBuffer(t4));
          }
      }
      if (n2.otherBufferViews.has(t2))
        for (const s2 of n2.otherBufferViews.get(t2))
          i.bufferViews.push({ buffer: w2, byteOffset: v2, byteLength: s2.byteLength }), n2.otherBufferViewsIndexMap.set(s2, i.bufferViews.length - 1), v2 += s2.byteLength, g2.push(s2);
      if (v2) {
        let e3;
        s.format === a.GLB ? e3 = "@glb.bin" : (e3 = n2.bufferURIGenerator.createURI(t2, "bin"), h3.uri = e3), h3.byteLength = v2, r.resources[e3] = T.concat(g2);
      }
      i.buffers.push(h3), n2.bufferIndexMap.set(t2, e2);
    }), e.listAccessors().find((t2) => !t2.getBuffer()) && h2.warn("Skipped writing one or more Accessors: no Buffer assigned."), i.materials = e.listMaterials().map((t2, s2) => {
      const e2 = n2.createPropertyDef(t2);
      if (t2.getAlphaMode() !== K.AlphaMode.OPAQUE && (e2.alphaMode = t2.getAlphaMode()), t2.getAlphaMode() === K.AlphaMode.MASK && (e2.alphaCutoff = t2.getAlphaCutoff()), t2.getDoubleSided() && (e2.doubleSided = true), e2.pbrMetallicRoughness = {}, S.eq(t2.getBaseColorFactor(), [1, 1, 1, 1]) || (e2.pbrMetallicRoughness.baseColorFactor = t2.getBaseColorFactor()), S.eq(t2.getEmissiveFactor(), [0, 0, 0]) || (e2.emissiveFactor = t2.getEmissiveFactor()), t2.getRoughnessFactor() !== 1 && (e2.pbrMetallicRoughness.roughnessFactor = t2.getRoughnessFactor()), t2.getMetallicFactor() !== 1 && (e2.pbrMetallicRoughness.metallicFactor = t2.getMetallicFactor()), t2.getBaseColorTexture()) {
        const s3 = t2.getBaseColorTexture(), i2 = t2.getBaseColorTextureInfo();
        e2.pbrMetallicRoughness.baseColorTexture = n2.createTextureInfoDef(s3, i2);
      }
      if (t2.getEmissiveTexture()) {
        const s3 = t2.getEmissiveTexture(), i2 = t2.getEmissiveTextureInfo();
        e2.emissiveTexture = n2.createTextureInfoDef(s3, i2);
      }
      if (t2.getNormalTexture()) {
        const s3 = t2.getNormalTexture(), i2 = t2.getNormalTextureInfo(), r2 = n2.createTextureInfoDef(s3, i2);
        t2.getNormalScale() !== 1 && (r2.scale = t2.getNormalScale()), e2.normalTexture = r2;
      }
      if (t2.getOcclusionTexture()) {
        const s3 = t2.getOcclusionTexture(), i2 = t2.getOcclusionTextureInfo(), r2 = n2.createTextureInfoDef(s3, i2);
        t2.getOcclusionStrength() !== 1 && (r2.strength = t2.getOcclusionStrength()), e2.occlusionTexture = r2;
      }
      if (t2.getMetallicRoughnessTexture()) {
        const s3 = t2.getMetallicRoughnessTexture(), i2 = t2.getMetallicRoughnessTextureInfo();
        e2.pbrMetallicRoughness.metallicRoughnessTexture = n2.createTextureInfoDef(s3, i2);
      }
      return n2.materialIndexMap.set(t2, s2), e2;
    }), i.meshes = e.listMeshes().map((t2, s2) => {
      const e2 = n2.createPropertyDef(t2);
      let i2 = null;
      return e2.primitives = t2.listPrimitives().map((t3) => {
        const s3 = { attributes: {} };
        s3.mode = t3.getMode();
        const e3 = t3.getMaterial();
        e3 && (s3.material = n2.materialIndexMap.get(e3)), Object.keys(t3.getExtras()).length && (s3.extras = t3.getExtras());
        const r2 = t3.getIndices();
        r2 && (s3.indices = n2.accessorIndexMap.get(r2));
        for (const e4 of t3.listSemantics())
          s3.attributes[e4] = n2.accessorIndexMap.get(t3.getAttribute(e4));
        for (const e4 of t3.listTargets()) {
          const t4 = {};
          for (const s4 of e4.listSemantics())
            t4[s4] = n2.accessorIndexMap.get(e4.getAttribute(s4));
          s3.targets = s3.targets || [], s3.targets.push(t4);
        }
        return t3.listTargets().length && !i2 && (i2 = t3.listTargets().map((t4) => t4.getName())), s3;
      }), t2.getWeights().length && (e2.weights = t2.getWeights()), i2 && (e2.extras = e2.extras || {}, e2.extras.targetNames = i2), n2.meshIndexMap.set(t2, s2), e2;
    }), i.cameras = e.listCameras().map((t2, s2) => {
      const e2 = n2.createPropertyDef(t2);
      if (e2.type = t2.getType(), e2.type === j.Type.PERSPECTIVE) {
        e2.perspective = { znear: t2.getZNear(), zfar: t2.getZFar(), yfov: t2.getYFov() };
        const s3 = t2.getAspectRatio();
        s3 !== null && (e2.perspective.aspectRatio = s3);
      } else
        e2.orthographic = { znear: t2.getZNear(), zfar: t2.getZFar(), xmag: t2.getXMag(), ymag: t2.getYMag() };
      return n2.cameraIndexMap.set(t2, s2), e2;
    }), i.nodes = e.listNodes().map((t2, s2) => {
      const e2 = n2.createPropertyDef(t2);
      return S.eq(t2.getTranslation(), [0, 0, 0]) || (e2.translation = t2.getTranslation()), S.eq(t2.getRotation(), [0, 0, 0, 1]) || (e2.rotation = t2.getRotation()), S.eq(t2.getScale(), [1, 1, 1]) || (e2.scale = t2.getScale()), t2.getWeights().length && (e2.weights = t2.getWeights()), n2.nodeIndexMap.set(t2, s2), e2;
    }), i.skins = e.listSkins().map((t2, s2) => {
      const e2 = n2.createPropertyDef(t2), i2 = t2.getInverseBindMatrices();
      i2 && (e2.inverseBindMatrices = n2.accessorIndexMap.get(i2));
      const r2 = t2.getSkeleton();
      return r2 && (e2.skeleton = n2.nodeIndexMap.get(r2)), e2.joints = t2.listJoints().map((t3) => n2.nodeIndexMap.get(t3)), n2.skinIndexMap.set(t2, s2), e2;
    }), e.listNodes().forEach((t2, s2) => {
      const e2 = i.nodes[s2], r2 = t2.getMesh();
      r2 && (e2.mesh = n2.meshIndexMap.get(r2));
      const h3 = t2.getCamera();
      h3 && (e2.camera = n2.cameraIndexMap.get(h3));
      const o2 = t2.getSkin();
      o2 && (e2.skin = n2.skinIndexMap.get(o2)), t2.listChildren().length > 0 && (e2.children = t2.listChildren().map((t3) => n2.nodeIndexMap.get(t3)));
    }), i.animations = e.listAnimations().map((t2) => {
      const s2 = n2.createPropertyDef(t2), e2 = new Map();
      return s2.samplers = t2.listSamplers().map((t3, s3) => {
        const i2 = n2.createPropertyDef(t3);
        return i2.input = n2.accessorIndexMap.get(t3.getInput()), i2.output = n2.accessorIndexMap.get(t3.getOutput()), i2.interpolation = t3.getInterpolation(), e2.set(t3, s3), i2;
      }), s2.channels = t2.listChannels().map((t3) => {
        const s3 = n2.createPropertyDef(t3);
        return s3.sampler = e2.get(t3.getSampler()), s3.target = { node: n2.nodeIndexMap.get(t3.getTargetNode()), path: t3.getTargetPath() }, s3;
      }), s2;
    }), i.scenes = e.listScenes().map((t2) => {
      const s2 = n2.createPropertyDef(t2);
      return s2.nodes = t2.listChildren().map((t3) => n2.nodeIndexMap.get(t3)), s2;
    });
    const d2 = e.getDefaultScene();
    return d2 && (i.scene = e.listScenes().indexOf(d2)), i.extensionsUsed = e.listExtensionsUsed().map((t2) => t2.extensionName), i.extensionsRequired = e.listExtensionsRequired().map((t2) => t2.extensionName), e.listExtensionsUsed().forEach((t2) => t2.write(n2)), function(t2) {
      const s2 = [];
      for (const e2 in t2) {
        const i2 = t2[e2];
        (Array.isArray(i2) && i2.length === 0 || i2 === null || i2 === "" || i2 && typeof i2 == "object" && Object.keys(i2).length === 0) && s2.push(e2);
      }
      for (const e2 of s2)
        delete t2[e2];
    }(i), r;
  }
};
var yt;
!function(t) {
  t[t.JSON = 1313821514] = "JSON", t[t.BIN = 5130562] = "BIN";
}(yt || (yt = {}));
var At = class {
  constructor() {
    this.Ot = I.DEFAULT_INSTANCE, this.gt = [], this.Pt = {}, this.Ut = u.INTERLEAVED;
  }
  setLogger(t) {
    return this.Ot = t, this;
  }
  registerExtensions(t) {
    for (const s of t)
      this.gt.push(s), s.register();
    return this;
  }
  registerDependencies(t) {
    return Object.assign(this.Pt, t), this;
  }
  setVertexLayout(t) {
    return this.Ut = t, this;
  }
  kt(t) {
    function s(s2) {
      if (s2.uri && !(s2.uri in t.resources) && s2.uri.match(/data:/)) {
        const e = `__${C()}.${A.extension(s2.uri)}`;
        t.resources[e] = T.createBufferFromDataURI(s2.uri), s2.uri = e;
      }
    }
    (t.json.images || []).forEach((t2) => {
      if (t2.bufferView === void 0 && t2.uri === void 0)
        throw new Error("Missing resource URI or buffer view.");
      s(t2);
    }), (t.json.buffers || []).forEach(s);
  }
  readJSON(t) {
    return this.kt(t), ft.read(t, { extensions: this.gt, dependencies: this.Pt, logger: this.Ot });
  }
  writeJSON(t, s = {}) {
    if (s.format === a.GLB && t.getRoot().listBuffers().length > 1)
      throw new Error("GLB must have 0\u20131 buffers.");
    return Tt.write(t, { format: s.format || a.GLTF, logger: s.logger || this.Ot, vertexLayout: s.vertexLayout || this.Ut, dependencies: ut({}, this.Pt, s.dependencies), basename: s.basename || "" });
  }
  binaryToJSON(t) {
    const s = this.Ft(t), e = s.json;
    if (e.buffers && e.buffers.find((t2) => t2.uri !== void 0))
      throw new Error("Cannot resolve external buffers with binaryToJSON().");
    if (e.images && e.images.find((t2) => t2.bufferView === void 0))
      throw new Error("Cannot resolve external images with binaryToJSON().");
    return s;
  }
  Ft(t) {
    const s = new Uint32Array(t, 0, 3);
    if (s[0] !== 1179937895)
      throw new Error("Invalid glTF asset.");
    if (s[1] !== 2)
      throw new Error(`Unsupported glTF binary version, "${s[1]}".`);
    const e = new Uint32Array(t, 12, 2);
    if (e[1] !== yt.JSON)
      throw new Error("Missing required GLB JSON chunk.");
    const i = e[0], r = T.decodeText(t.slice(20, 20 + i)), n2 = JSON.parse(r), h2 = 20 + i;
    if (t.byteLength <= h2)
      return { json: n2, resources: {} };
    const o2 = new Uint32Array(t, h2, 2);
    if (o2[1] !== yt.BIN)
      throw new Error("Expected GLB BIN in second chunk.");
    return { json: n2, resources: { "@glb.bin": t.slice(h2 + 8, h2 + 8 + o2[0]) } };
  }
  readBinary(t) {
    return this.readJSON(this.binaryToJSON(t));
  }
  writeBinary(t) {
    const { json: s, resources: e } = this.writeJSON(t, { format: a.GLB, basename: "", logger: this.Ot, dependencies: this.Pt, vertexLayout: this.Ut }), i = new Uint32Array([1179937895, 2, 12]), r = JSON.stringify(s), n2 = T.pad(T.encodeText(r), 32), h2 = new Uint32Array([n2.byteLength, 1313821514]).buffer, o2 = T.concat([h2, n2]);
    i[i.length - 1] += o2.byteLength;
    const u2 = Object.values(e)[0];
    if (!u2 || !u2.byteLength)
      return T.concat([i.buffer, o2]);
    const c2 = T.pad(u2, 0), l2 = new Uint32Array([c2.byteLength, 5130562]).buffer, f2 = T.concat([l2, c2]);
    return i[i.length - 1] += f2.byteLength, T.concat([i.buffer, o2, f2]);
  }
};
var xt = class extends At {
  constructor() {
    super(), this.Gt = void 0, this.jt = void 0, this.lastReadBytes = 0, this.lastWriteBytes = 0, this.Gt = require_fs(), this.jt = require_path();
  }
  read(t) {
    const s = this.readAsJSON(t);
    return ft.read(s, { extensions: this.gt, dependencies: this.Pt, logger: this.Ot });
  }
  readAsJSON(t) {
    return t.match(/\.glb$/) || t.match(/^data:application\/octet-stream;/) ? this.Dt(t) : this.Jt(t);
  }
  write(t, s) {
    t.match(/\.glb$/) ? this.zt(t, s) : this.$t(t, s);
  }
  Vt(t, s) {
    [...t.json.images || [], ...t.json.buffers || []].forEach((e) => {
      if (e.uri && !e.uri.match(/data:/)) {
        const i = this.jt.resolve(s, e.uri);
        t.resources[e.uri] = T.trim(this.Gt.readFileSync(i)), this.lastReadBytes += t.resources[e.uri].byteLength;
      }
    });
  }
  Dt(t) {
    const s = this.Gt.readFileSync(t), e = T.trim(s);
    this.lastReadBytes = e.byteLength;
    const i = this.Ft(e);
    return this.Vt(i, this.jt.dirname(t)), this.kt(i), i;
  }
  Jt(t) {
    this.lastReadBytes = 0;
    const s = this.Gt.readFileSync(t, "utf8");
    this.lastReadBytes += s.length;
    const e = { json: JSON.parse(s), resources: {} };
    return this.Vt(e, this.jt.dirname(t)), this.kt(e), e;
  }
  $t(t, s) {
    this.lastWriteBytes = 0;
    const { json: e, resources: i } = Tt.write(s, { format: a.GLTF, logger: this.Ot, dependencies: this.Pt, vertexLayout: this.Ut, basename: A.basename(t) }), { Gt: r, jt: n2 } = this, h2 = n2.dirname(t), o2 = JSON.stringify(e, null, 2);
    this.lastWriteBytes += o2.length, r.writeFileSync(t, o2), Object.keys(i).forEach((t2) => {
      const s2 = Buffer.from(i[t2]);
      r.writeFileSync(n2.join(h2, t2), s2), this.lastWriteBytes += s2.byteLength;
    });
  }
  zt(t, s) {
    const e = Buffer.from(this.writeBinary(s));
    this.Gt.writeFileSync(t, e), this.lastWriteBytes = e.byteLength;
  }
};
var Et = {};
var Mt = class extends At {
  constructor(t = Et) {
    super(), this.Wt = void 0, this.Wt = t;
  }
  read(t) {
    return this.readAsJSON(t).then((t2) => this.readJSON(t2));
  }
  readAsJSON(t) {
    return t.match(/^data:application\/octet-stream;/) || new URL(t, window.location.href).pathname.match(/\.glb$/) ? this.Dt(t) : this.Jt(t);
  }
  Vt(t, s) {
    const e = [...t.json.images || [], ...t.json.buffers || []].map((e2) => {
      const i = e2.uri;
      return !i || i.match(/data:/) ? Promise.resolve() : fetch(function(t2, s2) {
        if (!function(t3) {
          return !/^(?:[a-zA-Z]+:)?\//.test(t3);
        }(s2))
          return s2;
        const e3 = t2.split("/"), i2 = s2.split("/");
        e3.pop();
        for (let t3 = 0; t3 < i2.length; t3++)
          i2[t3] !== "." && (i2[t3] === ".." ? e3.pop() : e3.push(i2[t3]));
        return e3.join("/");
      }(s, i), this.Wt).then((t2) => t2.arrayBuffer()).then((s2) => {
        t.resources[i] = s2;
      });
    });
    return Promise.all(e).then(() => {
    });
  }
  Jt(t) {
    var s = this;
    const e = { json: {}, resources: {} };
    return fetch(t, this.Wt).then((t2) => t2.json()).then(async function(i) {
      return e.json = i, await s.Vt(e, St(t)), s.kt(e), e;
    });
  }
  Dt(t) {
    var s = this;
    return fetch(t, this.Wt).then((t2) => t2.arrayBuffer()).then(async function(e) {
      const i = s.Ft(e);
      return await s.Vt(i, St(t)), s.kt(i), i;
    });
  }
};
function St(t) {
  const s = t.lastIndexOf("/");
  return s === -1 ? "./" : t.substr(0, s + 1);
}
export {
  P as Accessor,
  U as Animation,
  k as AnimationChannel,
  F as AnimationSampler,
  J as AttributeLink,
  G as Buffer,
  T as BufferUtils,
  _ as COPY_IDENTITY,
  j as Camera,
  y as ColorUtils,
  ht as Document,
  ot as Extension,
  D as ExtensionProperty,
  A as FileUtils,
  a as Format,
  h as GLB_BUFFER,
  d as Graph,
  p as GraphChild,
  g as GraphChildList,
  E as ImageUtils,
  z as IndexLink,
  f as Link,
  I as Logger,
  K as Material,
  S as MathUtils,
  Q as Mesh,
  X as Node,
  xt as NodeIO,
  At as PlatformIO,
  tt as Primitive,
  st as PrimitiveTarget,
  O as Property,
  o as PropertyType,
  ct as ReaderContext,
  nt as Root,
  et as Scene,
  it as Skin,
  rt as Texture,
  c as TextureChannel,
  W as TextureInfo,
  $ as TextureLink,
  n as VERSION,
  u as VertexLayout,
  Mt as WebIO,
  wt as WriterContext,
  w as bounds,
  C as uuid
};
