var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __reExport = (target, module, desc) => {
  if (module && typeof module === "object" || typeof module === "function") {
    for (let key of __getOwnPropNames(module))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module) => {
  return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
};

// ../../node_modules/iota-array/iota.js
var require_iota = __commonJS({
  "../../node_modules/iota-array/iota.js"(exports, module) {
    "use strict";
    function iota(n4) {
      var result = new Array(n4);
      for (var i3 = 0; i3 < n4; ++i3) {
        result[i3] = i3;
      }
      return result;
    }
    module.exports = iota;
  }
});

// ../../node_modules/is-buffer/index.js
var require_is_buffer = __commonJS({
  "../../node_modules/is-buffer/index.js"(exports, module) {
    module.exports = function(obj) {
      return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
    };
    function isBuffer(obj) {
      return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
    }
    function isSlowBuffer(obj) {
      return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isBuffer(obj.slice(0, 0));
    }
  }
});

// ../../node_modules/ndarray/ndarray.js
var require_ndarray = __commonJS({
  "../../node_modules/ndarray/ndarray.js"(exports, module) {
    var iota = require_iota();
    var isBuffer = require_is_buffer();
    var hasTypedArrays = typeof Float64Array !== "undefined";
    function compare1st(a5, b3) {
      return a5[0] - b3[0];
    }
    function order() {
      var stride = this.stride;
      var terms = new Array(stride.length);
      var i3;
      for (i3 = 0; i3 < terms.length; ++i3) {
        terms[i3] = [Math.abs(stride[i3]), i3];
      }
      terms.sort(compare1st);
      var result = new Array(terms.length);
      for (i3 = 0; i3 < result.length; ++i3) {
        result[i3] = terms[i3][1];
      }
      return result;
    }
    function compileConstructor(dtype, dimension) {
      var className = ["View", dimension, "d", dtype].join("");
      if (dimension < 0) {
        className = "View_Nil" + dtype;
      }
      var useGetters = dtype === "generic";
      if (dimension === -1) {
        var code = "function " + className + "(a){this.data=a;};var proto=" + className + ".prototype;proto.dtype='" + dtype + "';proto.index=function(){return -1};proto.size=0;proto.dimension=-1;proto.shape=proto.stride=proto.order=[];proto.lo=proto.hi=proto.transpose=proto.step=function(){return new " + className + "(this.data);};proto.get=proto.set=function(){};proto.pick=function(){return null};return function construct_" + className + "(a){return new " + className + "(a);}";
        var procedure = new Function(code);
        return procedure();
      } else if (dimension === 0) {
        var code = "function " + className + "(a,d) {this.data = a;this.offset = d};var proto=" + className + ".prototype;proto.dtype='" + dtype + "';proto.index=function(){return this.offset};proto.dimension=0;proto.size=1;proto.shape=proto.stride=proto.order=[];proto.lo=proto.hi=proto.transpose=proto.step=function " + className + "_copy() {return new " + className + "(this.data,this.offset)};proto.pick=function " + className + "_pick(){return TrivialArray(this.data);};proto.valueOf=proto.get=function " + className + "_get(){return " + (useGetters ? "this.data.get(this.offset)" : "this.data[this.offset]") + "};proto.set=function " + className + "_set(v){return " + (useGetters ? "this.data.set(this.offset,v)" : "this.data[this.offset]=v") + "};return function construct_" + className + "(a,b,c,d){return new " + className + "(a,d)}";
        var procedure = new Function("TrivialArray", code);
        return procedure(CACHED_CONSTRUCTORS[dtype][0]);
      }
      var code = ["'use strict'"];
      var indices = iota(dimension);
      var args = indices.map(function(i4) {
        return "i" + i4;
      });
      var index_str = "this.offset+" + indices.map(function(i4) {
        return "this.stride[" + i4 + "]*i" + i4;
      }).join("+");
      var shapeArg = indices.map(function(i4) {
        return "b" + i4;
      }).join(",");
      var strideArg = indices.map(function(i4) {
        return "c" + i4;
      }).join(",");
      code.push("function " + className + "(a," + shapeArg + "," + strideArg + ",d){this.data=a", "this.shape=[" + shapeArg + "]", "this.stride=[" + strideArg + "]", "this.offset=d|0}", "var proto=" + className + ".prototype", "proto.dtype='" + dtype + "'", "proto.dimension=" + dimension);
      code.push("Object.defineProperty(proto,'size',{get:function " + className + "_size(){return " + indices.map(function(i4) {
        return "this.shape[" + i4 + "]";
      }).join("*"), "}})");
      if (dimension === 1) {
        code.push("proto.order=[0]");
      } else {
        code.push("Object.defineProperty(proto,'order',{get:");
        if (dimension < 4) {
          code.push("function " + className + "_order(){");
          if (dimension === 2) {
            code.push("return (Math.abs(this.stride[0])>Math.abs(this.stride[1]))?[1,0]:[0,1]}})");
          } else if (dimension === 3) {
            code.push("var s0=Math.abs(this.stride[0]),s1=Math.abs(this.stride[1]),s2=Math.abs(this.stride[2]);if(s0>s1){if(s1>s2){return [2,1,0];}else if(s0>s2){return [1,2,0];}else{return [1,0,2];}}else if(s0>s2){return [2,0,1];}else if(s2>s1){return [0,1,2];}else{return [0,2,1];}}})");
          }
        } else {
          code.push("ORDER})");
        }
      }
      code.push("proto.set=function " + className + "_set(" + args.join(",") + ",v){");
      if (useGetters) {
        code.push("return this.data.set(" + index_str + ",v)}");
      } else {
        code.push("return this.data[" + index_str + "]=v}");
      }
      code.push("proto.get=function " + className + "_get(" + args.join(",") + "){");
      if (useGetters) {
        code.push("return this.data.get(" + index_str + ")}");
      } else {
        code.push("return this.data[" + index_str + "]}");
      }
      code.push("proto.index=function " + className + "_index(", args.join(), "){return " + index_str + "}");
      code.push("proto.hi=function " + className + "_hi(" + args.join(",") + "){return new " + className + "(this.data," + indices.map(function(i4) {
        return ["(typeof i", i4, "!=='number'||i", i4, "<0)?this.shape[", i4, "]:i", i4, "|0"].join("");
      }).join(",") + "," + indices.map(function(i4) {
        return "this.stride[" + i4 + "]";
      }).join(",") + ",this.offset)}");
      var a_vars = indices.map(function(i4) {
        return "a" + i4 + "=this.shape[" + i4 + "]";
      });
      var c_vars = indices.map(function(i4) {
        return "c" + i4 + "=this.stride[" + i4 + "]";
      });
      code.push("proto.lo=function " + className + "_lo(" + args.join(",") + "){var b=this.offset,d=0," + a_vars.join(",") + "," + c_vars.join(","));
      for (var i3 = 0; i3 < dimension; ++i3) {
        code.push("if(typeof i" + i3 + "==='number'&&i" + i3 + ">=0){d=i" + i3 + "|0;b+=c" + i3 + "*d;a" + i3 + "-=d}");
      }
      code.push("return new " + className + "(this.data," + indices.map(function(i4) {
        return "a" + i4;
      }).join(",") + "," + indices.map(function(i4) {
        return "c" + i4;
      }).join(",") + ",b)}");
      code.push("proto.step=function " + className + "_step(" + args.join(",") + "){var " + indices.map(function(i4) {
        return "a" + i4 + "=this.shape[" + i4 + "]";
      }).join(",") + "," + indices.map(function(i4) {
        return "b" + i4 + "=this.stride[" + i4 + "]";
      }).join(",") + ",c=this.offset,d=0,ceil=Math.ceil");
      for (var i3 = 0; i3 < dimension; ++i3) {
        code.push("if(typeof i" + i3 + "==='number'){d=i" + i3 + "|0;if(d<0){c+=b" + i3 + "*(a" + i3 + "-1);a" + i3 + "=ceil(-a" + i3 + "/d)}else{a" + i3 + "=ceil(a" + i3 + "/d)}b" + i3 + "*=d}");
      }
      code.push("return new " + className + "(this.data," + indices.map(function(i4) {
        return "a" + i4;
      }).join(",") + "," + indices.map(function(i4) {
        return "b" + i4;
      }).join(",") + ",c)}");
      var tShape = new Array(dimension);
      var tStride = new Array(dimension);
      for (var i3 = 0; i3 < dimension; ++i3) {
        tShape[i3] = "a[i" + i3 + "]";
        tStride[i3] = "b[i" + i3 + "]";
      }
      code.push("proto.transpose=function " + className + "_transpose(" + args + "){" + args.map(function(n4, idx) {
        return n4 + "=(" + n4 + "===undefined?" + idx + ":" + n4 + "|0)";
      }).join(";"), "var a=this.shape,b=this.stride;return new " + className + "(this.data," + tShape.join(",") + "," + tStride.join(",") + ",this.offset)}");
      code.push("proto.pick=function " + className + "_pick(" + args + "){var a=[],b=[],c=this.offset");
      for (var i3 = 0; i3 < dimension; ++i3) {
        code.push("if(typeof i" + i3 + "==='number'&&i" + i3 + ">=0){c=(c+this.stride[" + i3 + "]*i" + i3 + ")|0}else{a.push(this.shape[" + i3 + "]);b.push(this.stride[" + i3 + "])}");
      }
      code.push("var ctor=CTOR_LIST[a.length+1];return ctor(this.data,a,b,c)}");
      code.push("return function construct_" + className + "(data,shape,stride,offset){return new " + className + "(data," + indices.map(function(i4) {
        return "shape[" + i4 + "]";
      }).join(",") + "," + indices.map(function(i4) {
        return "stride[" + i4 + "]";
      }).join(",") + ",offset)}");
      var procedure = new Function("CTOR_LIST", "ORDER", code.join("\n"));
      return procedure(CACHED_CONSTRUCTORS[dtype], order);
    }
    function arrayDType(data) {
      if (isBuffer(data)) {
        return "buffer";
      }
      if (hasTypedArrays) {
        switch (Object.prototype.toString.call(data)) {
          case "[object Float64Array]":
            return "float64";
          case "[object Float32Array]":
            return "float32";
          case "[object Int8Array]":
            return "int8";
          case "[object Int16Array]":
            return "int16";
          case "[object Int32Array]":
            return "int32";
          case "[object Uint8Array]":
            return "uint8";
          case "[object Uint16Array]":
            return "uint16";
          case "[object Uint32Array]":
            return "uint32";
          case "[object Uint8ClampedArray]":
            return "uint8_clamped";
          case "[object BigInt64Array]":
            return "bigint64";
          case "[object BigUint64Array]":
            return "biguint64";
        }
      }
      if (Array.isArray(data)) {
        return "array";
      }
      return "generic";
    }
    var CACHED_CONSTRUCTORS = {
      "float32": [],
      "float64": [],
      "int8": [],
      "int16": [],
      "int32": [],
      "uint8": [],
      "uint16": [],
      "uint32": [],
      "array": [],
      "uint8_clamped": [],
      "bigint64": [],
      "biguint64": [],
      "buffer": [],
      "generic": []
    };
    function wrappedNDArrayCtor(data, shape, stride, offset) {
      if (data === void 0) {
        var ctor = CACHED_CONSTRUCTORS.array[0];
        return ctor([]);
      } else if (typeof data === "number") {
        data = [data];
      }
      if (shape === void 0) {
        shape = [data.length];
      }
      var d = shape.length;
      if (stride === void 0) {
        stride = new Array(d);
        for (var i3 = d - 1, sz = 1; i3 >= 0; --i3) {
          stride[i3] = sz;
          sz *= shape[i3];
        }
      }
      if (offset === void 0) {
        offset = 0;
        for (var i3 = 0; i3 < d; ++i3) {
          if (stride[i3] < 0) {
            offset -= (shape[i3] - 1) * stride[i3];
          }
        }
      }
      var dtype = arrayDType(data);
      var ctor_list = CACHED_CONSTRUCTORS[dtype];
      while (ctor_list.length <= d + 1) {
        ctor_list.push(compileConstructor(dtype, ctor_list.length - 1));
      }
      var ctor = ctor_list[d + 1];
      return ctor(data, shape, stride, offset);
    }
    module.exports = wrappedNDArrayCtor;
  }
});

// ../../node_modules/uniq/uniq.js
var require_uniq = __commonJS({
  "../../node_modules/uniq/uniq.js"(exports, module) {
    "use strict";
    function unique_pred(list, compare) {
      var ptr = 1, len = list.length, a5 = list[0], b3 = list[0];
      for (var i3 = 1; i3 < len; ++i3) {
        b3 = a5;
        a5 = list[i3];
        if (compare(a5, b3)) {
          if (i3 === ptr) {
            ptr++;
            continue;
          }
          list[ptr++] = a5;
        }
      }
      list.length = ptr;
      return list;
    }
    function unique_eq(list) {
      var ptr = 1, len = list.length, a5 = list[0], b3 = list[0];
      for (var i3 = 1; i3 < len; ++i3, b3 = a5) {
        b3 = a5;
        a5 = list[i3];
        if (a5 !== b3) {
          if (i3 === ptr) {
            ptr++;
            continue;
          }
          list[ptr++] = a5;
        }
      }
      list.length = ptr;
      return list;
    }
    function unique(list, compare, sorted) {
      if (list.length === 0) {
        return list;
      }
      if (compare) {
        if (!sorted) {
          list.sort(compare);
        }
        return unique_pred(list, compare);
      }
      if (!sorted) {
        list.sort();
      }
      return unique_eq(list);
    }
    module.exports = unique;
  }
});

// ../../node_modules/cwise-compiler/lib/compile.js
var require_compile = __commonJS({
  "../../node_modules/cwise-compiler/lib/compile.js"(exports, module) {
    "use strict";
    var uniq = require_uniq();
    function innerFill(order, proc, body) {
      var dimension = order.length, nargs = proc.arrayArgs.length, has_index = proc.indexArgs.length > 0, code = [], vars = [], idx = 0, pidx = 0, i3, j4;
      for (i3 = 0; i3 < dimension; ++i3) {
        vars.push(["i", i3, "=0"].join(""));
      }
      for (j4 = 0; j4 < nargs; ++j4) {
        for (i3 = 0; i3 < dimension; ++i3) {
          pidx = idx;
          idx = order[i3];
          if (i3 === 0) {
            vars.push(["d", j4, "s", i3, "=t", j4, "p", idx].join(""));
          } else {
            vars.push(["d", j4, "s", i3, "=(t", j4, "p", idx, "-s", pidx, "*t", j4, "p", pidx, ")"].join(""));
          }
        }
      }
      if (vars.length > 0) {
        code.push("var " + vars.join(","));
      }
      for (i3 = dimension - 1; i3 >= 0; --i3) {
        idx = order[i3];
        code.push(["for(i", i3, "=0;i", i3, "<s", idx, ";++i", i3, "){"].join(""));
      }
      code.push(body);
      for (i3 = 0; i3 < dimension; ++i3) {
        pidx = idx;
        idx = order[i3];
        for (j4 = 0; j4 < nargs; ++j4) {
          code.push(["p", j4, "+=d", j4, "s", i3].join(""));
        }
        if (has_index) {
          if (i3 > 0) {
            code.push(["index[", pidx, "]-=s", pidx].join(""));
          }
          code.push(["++index[", idx, "]"].join(""));
        }
        code.push("}");
      }
      return code.join("\n");
    }
    function outerFill(matched, order, proc, body) {
      var dimension = order.length, nargs = proc.arrayArgs.length, blockSize = proc.blockSize, has_index = proc.indexArgs.length > 0, code = [];
      for (var i3 = 0; i3 < nargs; ++i3) {
        code.push(["var offset", i3, "=p", i3].join(""));
      }
      for (var i3 = matched; i3 < dimension; ++i3) {
        code.push(["for(var j" + i3 + "=SS[", order[i3], "]|0;j", i3, ">0;){"].join(""));
        code.push(["if(j", i3, "<", blockSize, "){"].join(""));
        code.push(["s", order[i3], "=j", i3].join(""));
        code.push(["j", i3, "=0"].join(""));
        code.push(["}else{s", order[i3], "=", blockSize].join(""));
        code.push(["j", i3, "-=", blockSize, "}"].join(""));
        if (has_index) {
          code.push(["index[", order[i3], "]=j", i3].join(""));
        }
      }
      for (var i3 = 0; i3 < nargs; ++i3) {
        var indexStr = ["offset" + i3];
        for (var j4 = matched; j4 < dimension; ++j4) {
          indexStr.push(["j", j4, "*t", i3, "p", order[j4]].join(""));
        }
        code.push(["p", i3, "=(", indexStr.join("+"), ")"].join(""));
      }
      code.push(innerFill(order, proc, body));
      for (var i3 = matched; i3 < dimension; ++i3) {
        code.push("}");
      }
      return code.join("\n");
    }
    function countMatches(orders) {
      var matched = 0, dimension = orders[0].length;
      while (matched < dimension) {
        for (var j4 = 1; j4 < orders.length; ++j4) {
          if (orders[j4][matched] !== orders[0][matched]) {
            return matched;
          }
        }
        ++matched;
      }
      return matched;
    }
    function processBlock(block, proc, dtypes) {
      var code = block.body;
      var pre = [];
      var post = [];
      for (var i3 = 0; i3 < block.args.length; ++i3) {
        var carg = block.args[i3];
        if (carg.count <= 0) {
          continue;
        }
        var re2 = new RegExp(carg.name, "g");
        var ptrStr = "";
        var arrNum = proc.arrayArgs.indexOf(i3);
        switch (proc.argTypes[i3]) {
          case "offset":
            var offArgIndex = proc.offsetArgIndex.indexOf(i3);
            var offArg = proc.offsetArgs[offArgIndex];
            arrNum = offArg.array;
            ptrStr = "+q" + offArgIndex;
          case "array":
            ptrStr = "p" + arrNum + ptrStr;
            var localStr = "l" + i3;
            var arrStr = "a" + arrNum;
            if (proc.arrayBlockIndices[arrNum] === 0) {
              if (carg.count === 1) {
                if (dtypes[arrNum] === "generic") {
                  if (carg.lvalue) {
                    pre.push(["var ", localStr, "=", arrStr, ".get(", ptrStr, ")"].join(""));
                    code = code.replace(re2, localStr);
                    post.push([arrStr, ".set(", ptrStr, ",", localStr, ")"].join(""));
                  } else {
                    code = code.replace(re2, [arrStr, ".get(", ptrStr, ")"].join(""));
                  }
                } else {
                  code = code.replace(re2, [arrStr, "[", ptrStr, "]"].join(""));
                }
              } else if (dtypes[arrNum] === "generic") {
                pre.push(["var ", localStr, "=", arrStr, ".get(", ptrStr, ")"].join(""));
                code = code.replace(re2, localStr);
                if (carg.lvalue) {
                  post.push([arrStr, ".set(", ptrStr, ",", localStr, ")"].join(""));
                }
              } else {
                pre.push(["var ", localStr, "=", arrStr, "[", ptrStr, "]"].join(""));
                code = code.replace(re2, localStr);
                if (carg.lvalue) {
                  post.push([arrStr, "[", ptrStr, "]=", localStr].join(""));
                }
              }
            } else {
              var reStrArr = [carg.name], ptrStrArr = [ptrStr];
              for (var j4 = 0; j4 < Math.abs(proc.arrayBlockIndices[arrNum]); j4++) {
                reStrArr.push("\\s*\\[([^\\]]+)\\]");
                ptrStrArr.push("$" + (j4 + 1) + "*t" + arrNum + "b" + j4);
              }
              re2 = new RegExp(reStrArr.join(""), "g");
              ptrStr = ptrStrArr.join("+");
              if (dtypes[arrNum] === "generic") {
                throw new Error("cwise: Generic arrays not supported in combination with blocks!");
              } else {
                code = code.replace(re2, [arrStr, "[", ptrStr, "]"].join(""));
              }
            }
            break;
          case "scalar":
            code = code.replace(re2, "Y" + proc.scalarArgs.indexOf(i3));
            break;
          case "index":
            code = code.replace(re2, "index");
            break;
          case "shape":
            code = code.replace(re2, "shape");
            break;
        }
      }
      return [pre.join("\n"), code, post.join("\n")].join("\n").trim();
    }
    function typeSummary(dtypes) {
      var summary = new Array(dtypes.length);
      var allEqual = true;
      for (var i3 = 0; i3 < dtypes.length; ++i3) {
        var t4 = dtypes[i3];
        var digits = t4.match(/\d+/);
        if (!digits) {
          digits = "";
        } else {
          digits = digits[0];
        }
        if (t4.charAt(0) === 0) {
          summary[i3] = "u" + t4.charAt(1) + digits;
        } else {
          summary[i3] = t4.charAt(0) + digits;
        }
        if (i3 > 0) {
          allEqual = allEqual && summary[i3] === summary[i3 - 1];
        }
      }
      if (allEqual) {
        return summary[0];
      }
      return summary.join("");
    }
    function generateCWiseOp(proc, typesig) {
      var dimension = typesig[1].length - Math.abs(proc.arrayBlockIndices[0]) | 0;
      var orders = new Array(proc.arrayArgs.length);
      var dtypes = new Array(proc.arrayArgs.length);
      for (var i3 = 0; i3 < proc.arrayArgs.length; ++i3) {
        dtypes[i3] = typesig[2 * i3];
        orders[i3] = typesig[2 * i3 + 1];
      }
      var blockBegin = [], blockEnd = [];
      var loopBegin = [], loopEnd = [];
      var loopOrders = [];
      for (var i3 = 0; i3 < proc.arrayArgs.length; ++i3) {
        if (proc.arrayBlockIndices[i3] < 0) {
          loopBegin.push(0);
          loopEnd.push(dimension);
          blockBegin.push(dimension);
          blockEnd.push(dimension + proc.arrayBlockIndices[i3]);
        } else {
          loopBegin.push(proc.arrayBlockIndices[i3]);
          loopEnd.push(proc.arrayBlockIndices[i3] + dimension);
          blockBegin.push(0);
          blockEnd.push(proc.arrayBlockIndices[i3]);
        }
        var newOrder = [];
        for (var j4 = 0; j4 < orders[i3].length; j4++) {
          if (loopBegin[i3] <= orders[i3][j4] && orders[i3][j4] < loopEnd[i3]) {
            newOrder.push(orders[i3][j4] - loopBegin[i3]);
          }
        }
        loopOrders.push(newOrder);
      }
      var arglist = ["SS"];
      var code = ["'use strict'"];
      var vars = [];
      for (var j4 = 0; j4 < dimension; ++j4) {
        vars.push(["s", j4, "=SS[", j4, "]"].join(""));
      }
      for (var i3 = 0; i3 < proc.arrayArgs.length; ++i3) {
        arglist.push("a" + i3);
        arglist.push("t" + i3);
        arglist.push("p" + i3);
        for (var j4 = 0; j4 < dimension; ++j4) {
          vars.push(["t", i3, "p", j4, "=t", i3, "[", loopBegin[i3] + j4, "]"].join(""));
        }
        for (var j4 = 0; j4 < Math.abs(proc.arrayBlockIndices[i3]); ++j4) {
          vars.push(["t", i3, "b", j4, "=t", i3, "[", blockBegin[i3] + j4, "]"].join(""));
        }
      }
      for (var i3 = 0; i3 < proc.scalarArgs.length; ++i3) {
        arglist.push("Y" + i3);
      }
      if (proc.shapeArgs.length > 0) {
        vars.push("shape=SS.slice(0)");
      }
      if (proc.indexArgs.length > 0) {
        var zeros = new Array(dimension);
        for (var i3 = 0; i3 < dimension; ++i3) {
          zeros[i3] = "0";
        }
        vars.push(["index=[", zeros.join(","), "]"].join(""));
      }
      for (var i3 = 0; i3 < proc.offsetArgs.length; ++i3) {
        var off_arg = proc.offsetArgs[i3];
        var init_string = [];
        for (var j4 = 0; j4 < off_arg.offset.length; ++j4) {
          if (off_arg.offset[j4] === 0) {
            continue;
          } else if (off_arg.offset[j4] === 1) {
            init_string.push(["t", off_arg.array, "p", j4].join(""));
          } else {
            init_string.push([off_arg.offset[j4], "*t", off_arg.array, "p", j4].join(""));
          }
        }
        if (init_string.length === 0) {
          vars.push("q" + i3 + "=0");
        } else {
          vars.push(["q", i3, "=", init_string.join("+")].join(""));
        }
      }
      var thisVars = uniq([].concat(proc.pre.thisVars).concat(proc.body.thisVars).concat(proc.post.thisVars));
      vars = vars.concat(thisVars);
      if (vars.length > 0) {
        code.push("var " + vars.join(","));
      }
      for (var i3 = 0; i3 < proc.arrayArgs.length; ++i3) {
        code.push("p" + i3 + "|=0");
      }
      if (proc.pre.body.length > 3) {
        code.push(processBlock(proc.pre, proc, dtypes));
      }
      var body = processBlock(proc.body, proc, dtypes);
      var matched = countMatches(loopOrders);
      if (matched < dimension) {
        code.push(outerFill(matched, loopOrders[0], proc, body));
      } else {
        code.push(innerFill(loopOrders[0], proc, body));
      }
      if (proc.post.body.length > 3) {
        code.push(processBlock(proc.post, proc, dtypes));
      }
      if (proc.debug) {
        console.log("-----Generated cwise routine for ", typesig, ":\n" + code.join("\n") + "\n----------");
      }
      var loopName = [proc.funcName || "unnamed", "_cwise_loop_", orders[0].join("s"), "m", matched, typeSummary(dtypes)].join("");
      var f3 = new Function(["function ", loopName, "(", arglist.join(","), "){", code.join("\n"), "} return ", loopName].join(""));
      return f3();
    }
    module.exports = generateCWiseOp;
  }
});

// ../../node_modules/cwise-compiler/lib/thunk.js
var require_thunk = __commonJS({
  "../../node_modules/cwise-compiler/lib/thunk.js"(exports, module) {
    "use strict";
    var compile = require_compile();
    function createThunk(proc) {
      var code = ["'use strict'", "var CACHED={}"];
      var vars = [];
      var thunkName = proc.funcName + "_cwise_thunk";
      code.push(["return function ", thunkName, "(", proc.shimArgs.join(","), "){"].join(""));
      var typesig = [];
      var string_typesig = [];
      var proc_args = [[
        "array",
        proc.arrayArgs[0],
        ".shape.slice(",
        Math.max(0, proc.arrayBlockIndices[0]),
        proc.arrayBlockIndices[0] < 0 ? "," + proc.arrayBlockIndices[0] + ")" : ")"
      ].join("")];
      var shapeLengthConditions = [], shapeConditions = [];
      for (var i3 = 0; i3 < proc.arrayArgs.length; ++i3) {
        var j4 = proc.arrayArgs[i3];
        vars.push([
          "t",
          j4,
          "=array",
          j4,
          ".dtype,",
          "r",
          j4,
          "=array",
          j4,
          ".order"
        ].join(""));
        typesig.push("t" + j4);
        typesig.push("r" + j4);
        string_typesig.push("t" + j4);
        string_typesig.push("r" + j4 + ".join()");
        proc_args.push("array" + j4 + ".data");
        proc_args.push("array" + j4 + ".stride");
        proc_args.push("array" + j4 + ".offset|0");
        if (i3 > 0) {
          shapeLengthConditions.push("array" + proc.arrayArgs[0] + ".shape.length===array" + j4 + ".shape.length+" + (Math.abs(proc.arrayBlockIndices[0]) - Math.abs(proc.arrayBlockIndices[i3])));
          shapeConditions.push("array" + proc.arrayArgs[0] + ".shape[shapeIndex+" + Math.max(0, proc.arrayBlockIndices[0]) + "]===array" + j4 + ".shape[shapeIndex+" + Math.max(0, proc.arrayBlockIndices[i3]) + "]");
        }
      }
      if (proc.arrayArgs.length > 1) {
        code.push("if (!(" + shapeLengthConditions.join(" && ") + ")) throw new Error('cwise: Arrays do not all have the same dimensionality!')");
        code.push("for(var shapeIndex=array" + proc.arrayArgs[0] + ".shape.length-" + Math.abs(proc.arrayBlockIndices[0]) + "; shapeIndex-->0;) {");
        code.push("if (!(" + shapeConditions.join(" && ") + ")) throw new Error('cwise: Arrays do not all have the same shape!')");
        code.push("}");
      }
      for (var i3 = 0; i3 < proc.scalarArgs.length; ++i3) {
        proc_args.push("scalar" + proc.scalarArgs[i3]);
      }
      vars.push(["type=[", string_typesig.join(","), "].join()"].join(""));
      vars.push("proc=CACHED[type]");
      code.push("var " + vars.join(","));
      code.push([
        "if(!proc){",
        "CACHED[type]=proc=compile([",
        typesig.join(","),
        "])}",
        "return proc(",
        proc_args.join(","),
        ")}"
      ].join(""));
      if (proc.debug) {
        console.log("-----Generated thunk:\n" + code.join("\n") + "\n----------");
      }
      var thunk = new Function("compile", code.join("\n"));
      return thunk(compile.bind(void 0, proc));
    }
    module.exports = createThunk;
  }
});

// ../../node_modules/cwise-compiler/compiler.js
var require_compiler = __commonJS({
  "../../node_modules/cwise-compiler/compiler.js"(exports, module) {
    "use strict";
    var createThunk = require_thunk();
    function Procedure() {
      this.argTypes = [];
      this.shimArgs = [];
      this.arrayArgs = [];
      this.arrayBlockIndices = [];
      this.scalarArgs = [];
      this.offsetArgs = [];
      this.offsetArgIndex = [];
      this.indexArgs = [];
      this.shapeArgs = [];
      this.funcName = "";
      this.pre = null;
      this.body = null;
      this.post = null;
      this.debug = false;
    }
    function compileCwise(user_args) {
      var proc = new Procedure();
      proc.pre = user_args.pre;
      proc.body = user_args.body;
      proc.post = user_args.post;
      var proc_args = user_args.args.slice(0);
      proc.argTypes = proc_args;
      for (var i3 = 0; i3 < proc_args.length; ++i3) {
        var arg_type = proc_args[i3];
        if (arg_type === "array" || typeof arg_type === "object" && arg_type.blockIndices) {
          proc.argTypes[i3] = "array";
          proc.arrayArgs.push(i3);
          proc.arrayBlockIndices.push(arg_type.blockIndices ? arg_type.blockIndices : 0);
          proc.shimArgs.push("array" + i3);
          if (i3 < proc.pre.args.length && proc.pre.args[i3].count > 0) {
            throw new Error("cwise: pre() block may not reference array args");
          }
          if (i3 < proc.post.args.length && proc.post.args[i3].count > 0) {
            throw new Error("cwise: post() block may not reference array args");
          }
        } else if (arg_type === "scalar") {
          proc.scalarArgs.push(i3);
          proc.shimArgs.push("scalar" + i3);
        } else if (arg_type === "index") {
          proc.indexArgs.push(i3);
          if (i3 < proc.pre.args.length && proc.pre.args[i3].count > 0) {
            throw new Error("cwise: pre() block may not reference array index");
          }
          if (i3 < proc.body.args.length && proc.body.args[i3].lvalue) {
            throw new Error("cwise: body() block may not write to array index");
          }
          if (i3 < proc.post.args.length && proc.post.args[i3].count > 0) {
            throw new Error("cwise: post() block may not reference array index");
          }
        } else if (arg_type === "shape") {
          proc.shapeArgs.push(i3);
          if (i3 < proc.pre.args.length && proc.pre.args[i3].lvalue) {
            throw new Error("cwise: pre() block may not write to array shape");
          }
          if (i3 < proc.body.args.length && proc.body.args[i3].lvalue) {
            throw new Error("cwise: body() block may not write to array shape");
          }
          if (i3 < proc.post.args.length && proc.post.args[i3].lvalue) {
            throw new Error("cwise: post() block may not write to array shape");
          }
        } else if (typeof arg_type === "object" && arg_type.offset) {
          proc.argTypes[i3] = "offset";
          proc.offsetArgs.push({ array: arg_type.array, offset: arg_type.offset });
          proc.offsetArgIndex.push(i3);
        } else {
          throw new Error("cwise: Unknown argument type " + proc_args[i3]);
        }
      }
      if (proc.arrayArgs.length <= 0) {
        throw new Error("cwise: No array arguments specified");
      }
      if (proc.pre.args.length > proc_args.length) {
        throw new Error("cwise: Too many arguments in pre() block");
      }
      if (proc.body.args.length > proc_args.length) {
        throw new Error("cwise: Too many arguments in body() block");
      }
      if (proc.post.args.length > proc_args.length) {
        throw new Error("cwise: Too many arguments in post() block");
      }
      proc.debug = !!user_args.printCode || !!user_args.debug;
      proc.funcName = user_args.funcName || "cwise";
      proc.blockSize = user_args.blockSize || 64;
      return createThunk(proc);
    }
    module.exports = compileCwise;
  }
});

// ../../node_modules/ndarray-ops/ndarray-ops.js
var require_ndarray_ops = __commonJS({
  "../../node_modules/ndarray-ops/ndarray-ops.js"(exports) {
    "use strict";
    var compile = require_compiler();
    var EmptyProc = {
      body: "",
      args: [],
      thisVars: [],
      localVars: []
    };
    function fixup(x2) {
      if (!x2) {
        return EmptyProc;
      }
      for (var i3 = 0; i3 < x2.args.length; ++i3) {
        var a5 = x2.args[i3];
        if (i3 === 0) {
          x2.args[i3] = { name: a5, lvalue: true, rvalue: !!x2.rvalue, count: x2.count || 1 };
        } else {
          x2.args[i3] = { name: a5, lvalue: false, rvalue: true, count: 1 };
        }
      }
      if (!x2.thisVars) {
        x2.thisVars = [];
      }
      if (!x2.localVars) {
        x2.localVars = [];
      }
      return x2;
    }
    function pcompile(user_args) {
      return compile({
        args: user_args.args,
        pre: fixup(user_args.pre),
        body: fixup(user_args.body),
        post: fixup(user_args.proc),
        funcName: user_args.funcName
      });
    }
    function makeOp(user_args) {
      var args = [];
      for (var i3 = 0; i3 < user_args.args.length; ++i3) {
        args.push("a" + i3);
      }
      var wrapper = new Function("P", [
        "return function ",
        user_args.funcName,
        "_ndarrayops(",
        args.join(","),
        ") {P(",
        args.join(","),
        ");return a0}"
      ].join(""));
      return wrapper(pcompile(user_args));
    }
    var assign_ops = {
      add: "+",
      sub: "-",
      mul: "*",
      div: "/",
      mod: "%",
      band: "&",
      bor: "|",
      bxor: "^",
      lshift: "<<",
      rshift: ">>",
      rrshift: ">>>"
    };
    (function() {
      for (var id in assign_ops) {
        var op = assign_ops[id];
        exports[id] = makeOp({
          args: ["array", "array", "array"],
          body: {
            args: ["a", "b", "c"],
            body: "a=b" + op + "c"
          },
          funcName: id
        });
        exports[id + "eq"] = makeOp({
          args: ["array", "array"],
          body: {
            args: ["a", "b"],
            body: "a" + op + "=b"
          },
          rvalue: true,
          funcName: id + "eq"
        });
        exports[id + "s"] = makeOp({
          args: ["array", "array", "scalar"],
          body: {
            args: ["a", "b", "s"],
            body: "a=b" + op + "s"
          },
          funcName: id + "s"
        });
        exports[id + "seq"] = makeOp({
          args: ["array", "scalar"],
          body: {
            args: ["a", "s"],
            body: "a" + op + "=s"
          },
          rvalue: true,
          funcName: id + "seq"
        });
      }
    })();
    var unary_ops = {
      not: "!",
      bnot: "~",
      neg: "-",
      recip: "1.0/"
    };
    (function() {
      for (var id in unary_ops) {
        var op = unary_ops[id];
        exports[id] = makeOp({
          args: ["array", "array"],
          body: {
            args: ["a", "b"],
            body: "a=" + op + "b"
          },
          funcName: id
        });
        exports[id + "eq"] = makeOp({
          args: ["array"],
          body: {
            args: ["a"],
            body: "a=" + op + "a"
          },
          rvalue: true,
          count: 2,
          funcName: id + "eq"
        });
      }
    })();
    var binary_ops = {
      and: "&&",
      or: "||",
      eq: "===",
      neq: "!==",
      lt: "<",
      gt: ">",
      leq: "<=",
      geq: ">="
    };
    (function() {
      for (var id in binary_ops) {
        var op = binary_ops[id];
        exports[id] = makeOp({
          args: ["array", "array", "array"],
          body: {
            args: ["a", "b", "c"],
            body: "a=b" + op + "c"
          },
          funcName: id
        });
        exports[id + "s"] = makeOp({
          args: ["array", "array", "scalar"],
          body: {
            args: ["a", "b", "s"],
            body: "a=b" + op + "s"
          },
          funcName: id + "s"
        });
        exports[id + "eq"] = makeOp({
          args: ["array", "array"],
          body: {
            args: ["a", "b"],
            body: "a=a" + op + "b"
          },
          rvalue: true,
          count: 2,
          funcName: id + "eq"
        });
        exports[id + "seq"] = makeOp({
          args: ["array", "scalar"],
          body: {
            args: ["a", "s"],
            body: "a=a" + op + "s"
          },
          rvalue: true,
          count: 2,
          funcName: id + "seq"
        });
      }
    })();
    var math_unary = [
      "abs",
      "acos",
      "asin",
      "atan",
      "ceil",
      "cos",
      "exp",
      "floor",
      "log",
      "round",
      "sin",
      "sqrt",
      "tan"
    ];
    (function() {
      for (var i3 = 0; i3 < math_unary.length; ++i3) {
        var f3 = math_unary[i3];
        exports[f3] = makeOp({
          args: ["array", "array"],
          pre: { args: [], body: "this_f=Math." + f3, thisVars: ["this_f"] },
          body: { args: ["a", "b"], body: "a=this_f(b)", thisVars: ["this_f"] },
          funcName: f3
        });
        exports[f3 + "eq"] = makeOp({
          args: ["array"],
          pre: { args: [], body: "this_f=Math." + f3, thisVars: ["this_f"] },
          body: { args: ["a"], body: "a=this_f(a)", thisVars: ["this_f"] },
          rvalue: true,
          count: 2,
          funcName: f3 + "eq"
        });
      }
    })();
    var math_comm = [
      "max",
      "min",
      "atan2",
      "pow"
    ];
    (function() {
      for (var i3 = 0; i3 < math_comm.length; ++i3) {
        var f3 = math_comm[i3];
        exports[f3] = makeOp({
          args: ["array", "array", "array"],
          pre: { args: [], body: "this_f=Math." + f3, thisVars: ["this_f"] },
          body: { args: ["a", "b", "c"], body: "a=this_f(b,c)", thisVars: ["this_f"] },
          funcName: f3
        });
        exports[f3 + "s"] = makeOp({
          args: ["array", "array", "scalar"],
          pre: { args: [], body: "this_f=Math." + f3, thisVars: ["this_f"] },
          body: { args: ["a", "b", "c"], body: "a=this_f(b,c)", thisVars: ["this_f"] },
          funcName: f3 + "s"
        });
        exports[f3 + "eq"] = makeOp({
          args: ["array", "array"],
          pre: { args: [], body: "this_f=Math." + f3, thisVars: ["this_f"] },
          body: { args: ["a", "b"], body: "a=this_f(a,b)", thisVars: ["this_f"] },
          rvalue: true,
          count: 2,
          funcName: f3 + "eq"
        });
        exports[f3 + "seq"] = makeOp({
          args: ["array", "scalar"],
          pre: { args: [], body: "this_f=Math." + f3, thisVars: ["this_f"] },
          body: { args: ["a", "b"], body: "a=this_f(a,b)", thisVars: ["this_f"] },
          rvalue: true,
          count: 2,
          funcName: f3 + "seq"
        });
      }
    })();
    var math_noncomm = [
      "atan2",
      "pow"
    ];
    (function() {
      for (var i3 = 0; i3 < math_noncomm.length; ++i3) {
        var f3 = math_noncomm[i3];
        exports[f3 + "op"] = makeOp({
          args: ["array", "array", "array"],
          pre: { args: [], body: "this_f=Math." + f3, thisVars: ["this_f"] },
          body: { args: ["a", "b", "c"], body: "a=this_f(c,b)", thisVars: ["this_f"] },
          funcName: f3 + "op"
        });
        exports[f3 + "ops"] = makeOp({
          args: ["array", "array", "scalar"],
          pre: { args: [], body: "this_f=Math." + f3, thisVars: ["this_f"] },
          body: { args: ["a", "b", "c"], body: "a=this_f(c,b)", thisVars: ["this_f"] },
          funcName: f3 + "ops"
        });
        exports[f3 + "opeq"] = makeOp({
          args: ["array", "array"],
          pre: { args: [], body: "this_f=Math." + f3, thisVars: ["this_f"] },
          body: { args: ["a", "b"], body: "a=this_f(b,a)", thisVars: ["this_f"] },
          rvalue: true,
          count: 2,
          funcName: f3 + "opeq"
        });
        exports[f3 + "opseq"] = makeOp({
          args: ["array", "scalar"],
          pre: { args: [], body: "this_f=Math." + f3, thisVars: ["this_f"] },
          body: { args: ["a", "b"], body: "a=this_f(b,a)", thisVars: ["this_f"] },
          rvalue: true,
          count: 2,
          funcName: f3 + "opseq"
        });
      }
    })();
    exports.any = compile({
      args: ["array"],
      pre: EmptyProc,
      body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 1 }], body: "if(a){return true}", localVars: [], thisVars: [] },
      post: { args: [], localVars: [], thisVars: [], body: "return false" },
      funcName: "any"
    });
    exports.all = compile({
      args: ["array"],
      pre: EmptyProc,
      body: { args: [{ name: "x", lvalue: false, rvalue: true, count: 1 }], body: "if(!x){return false}", localVars: [], thisVars: [] },
      post: { args: [], localVars: [], thisVars: [], body: "return true" },
      funcName: "all"
    });
    exports.sum = compile({
      args: ["array"],
      pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=0" },
      body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 1 }], body: "this_s+=a", localVars: [], thisVars: ["this_s"] },
      post: { args: [], localVars: [], thisVars: ["this_s"], body: "return this_s" },
      funcName: "sum"
    });
    exports.prod = compile({
      args: ["array"],
      pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=1" },
      body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 1 }], body: "this_s*=a", localVars: [], thisVars: ["this_s"] },
      post: { args: [], localVars: [], thisVars: ["this_s"], body: "return this_s" },
      funcName: "prod"
    });
    exports.norm2squared = compile({
      args: ["array"],
      pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=0" },
      body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 2 }], body: "this_s+=a*a", localVars: [], thisVars: ["this_s"] },
      post: { args: [], localVars: [], thisVars: ["this_s"], body: "return this_s" },
      funcName: "norm2squared"
    });
    exports.norm2 = compile({
      args: ["array"],
      pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=0" },
      body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 2 }], body: "this_s+=a*a", localVars: [], thisVars: ["this_s"] },
      post: { args: [], localVars: [], thisVars: ["this_s"], body: "return Math.sqrt(this_s)" },
      funcName: "norm2"
    });
    exports.norminf = compile({
      args: ["array"],
      pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=0" },
      body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 4 }], body: "if(-a>this_s){this_s=-a}else if(a>this_s){this_s=a}", localVars: [], thisVars: ["this_s"] },
      post: { args: [], localVars: [], thisVars: ["this_s"], body: "return this_s" },
      funcName: "norminf"
    });
    exports.norm1 = compile({
      args: ["array"],
      pre: { args: [], localVars: [], thisVars: ["this_s"], body: "this_s=0" },
      body: { args: [{ name: "a", lvalue: false, rvalue: true, count: 3 }], body: "this_s+=a<0?-a:a", localVars: [], thisVars: ["this_s"] },
      post: { args: [], localVars: [], thisVars: ["this_s"], body: "return this_s" },
      funcName: "norm1"
    });
    exports.sup = compile({
      args: ["array"],
      pre: {
        body: "this_h=-Infinity",
        args: [],
        thisVars: ["this_h"],
        localVars: []
      },
      body: {
        body: "if(_inline_1_arg0_>this_h)this_h=_inline_1_arg0_",
        args: [{ "name": "_inline_1_arg0_", "lvalue": false, "rvalue": true, "count": 2 }],
        thisVars: ["this_h"],
        localVars: []
      },
      post: {
        body: "return this_h",
        args: [],
        thisVars: ["this_h"],
        localVars: []
      }
    });
    exports.inf = compile({
      args: ["array"],
      pre: {
        body: "this_h=Infinity",
        args: [],
        thisVars: ["this_h"],
        localVars: []
      },
      body: {
        body: "if(_inline_1_arg0_<this_h)this_h=_inline_1_arg0_",
        args: [{ "name": "_inline_1_arg0_", "lvalue": false, "rvalue": true, "count": 2 }],
        thisVars: ["this_h"],
        localVars: []
      },
      post: {
        body: "return this_h",
        args: [],
        thisVars: ["this_h"],
        localVars: []
      }
    });
    exports.argmin = compile({
      args: ["index", "array", "shape"],
      pre: {
        body: "{this_v=Infinity;this_i=_inline_0_arg2_.slice(0)}",
        args: [
          { name: "_inline_0_arg0_", lvalue: false, rvalue: false, count: 0 },
          { name: "_inline_0_arg1_", lvalue: false, rvalue: false, count: 0 },
          { name: "_inline_0_arg2_", lvalue: false, rvalue: true, count: 1 }
        ],
        thisVars: ["this_i", "this_v"],
        localVars: []
      },
      body: {
        body: "{if(_inline_1_arg1_<this_v){this_v=_inline_1_arg1_;for(var _inline_1_k=0;_inline_1_k<_inline_1_arg0_.length;++_inline_1_k){this_i[_inline_1_k]=_inline_1_arg0_[_inline_1_k]}}}",
        args: [
          { name: "_inline_1_arg0_", lvalue: false, rvalue: true, count: 2 },
          { name: "_inline_1_arg1_", lvalue: false, rvalue: true, count: 2 }
        ],
        thisVars: ["this_i", "this_v"],
        localVars: ["_inline_1_k"]
      },
      post: {
        body: "{return this_i}",
        args: [],
        thisVars: ["this_i"],
        localVars: []
      }
    });
    exports.argmax = compile({
      args: ["index", "array", "shape"],
      pre: {
        body: "{this_v=-Infinity;this_i=_inline_0_arg2_.slice(0)}",
        args: [
          { name: "_inline_0_arg0_", lvalue: false, rvalue: false, count: 0 },
          { name: "_inline_0_arg1_", lvalue: false, rvalue: false, count: 0 },
          { name: "_inline_0_arg2_", lvalue: false, rvalue: true, count: 1 }
        ],
        thisVars: ["this_i", "this_v"],
        localVars: []
      },
      body: {
        body: "{if(_inline_1_arg1_>this_v){this_v=_inline_1_arg1_;for(var _inline_1_k=0;_inline_1_k<_inline_1_arg0_.length;++_inline_1_k){this_i[_inline_1_k]=_inline_1_arg0_[_inline_1_k]}}}",
        args: [
          { name: "_inline_1_arg0_", lvalue: false, rvalue: true, count: 2 },
          { name: "_inline_1_arg1_", lvalue: false, rvalue: true, count: 2 }
        ],
        thisVars: ["this_i", "this_v"],
        localVars: ["_inline_1_k"]
      },
      post: {
        body: "{return this_i}",
        args: [],
        thisVars: ["this_i"],
        localVars: []
      }
    });
    exports.random = makeOp({
      args: ["array"],
      pre: { args: [], body: "this_f=Math.random", thisVars: ["this_f"] },
      body: { args: ["a"], body: "a=this_f()", thisVars: ["this_f"] },
      funcName: "random"
    });
    exports.assign = makeOp({
      args: ["array", "array"],
      body: { args: ["a", "b"], body: "a=b" },
      funcName: "assign"
    });
    exports.assigns = makeOp({
      args: ["array", "scalar"],
      body: { args: ["a", "b"], body: "a=b" },
      funcName: "assigns"
    });
    exports.equals = compile({
      args: ["array", "array"],
      pre: EmptyProc,
      body: {
        args: [
          { name: "x", lvalue: false, rvalue: true, count: 1 },
          { name: "y", lvalue: false, rvalue: true, count: 1 }
        ],
        body: "if(x!==y){return false}",
        localVars: [],
        thisVars: []
      },
      post: { args: [], localVars: [], thisVars: [], body: "return true" },
      funcName: "equals"
    });
  }
});

// ../../node_modules/gl-matrix/esm/common.js
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var degree = Math.PI / 180;
if (!Math.hypot)
  Math.hypot = function() {
    var y3 = 0, i3 = arguments.length;
    while (i3--) {
      y3 += arguments[i3] * arguments[i3];
    }
    return Math.sqrt(y3);
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
function length(a5) {
  var x2 = a5[0];
  var y3 = a5[1];
  var z4 = a5[2];
  return Math.hypot(x2, y3, z4);
}
function min(out, a5, b3) {
  out[0] = Math.min(a5[0], b3[0]);
  out[1] = Math.min(a5[1], b3[1]);
  out[2] = Math.min(a5[2], b3[2]);
  return out;
}
function max(out, a5, b3) {
  out[0] = Math.max(a5[0], b3[0]);
  out[1] = Math.max(a5[1], b3[1]);
  out[2] = Math.max(a5[2], b3[2]);
  return out;
}
function scale(out, a5, b3) {
  out[0] = a5[0] * b3;
  out[1] = a5[1] * b3;
  out[2] = a5[2] * b3;
  return out;
}
function transformMat4(out, a5, m2) {
  var x2 = a5[0], y3 = a5[1], z4 = a5[2];
  var w3 = m2[3] * x2 + m2[7] * y3 + m2[11] * z4 + m2[15];
  w3 = w3 || 1;
  out[0] = (m2[0] * x2 + m2[4] * y3 + m2[8] * z4 + m2[12]) / w3;
  out[1] = (m2[1] * x2 + m2[5] * y3 + m2[9] * z4 + m2[13]) / w3;
  out[2] = (m2[2] * x2 + m2[6] * y3 + m2[10] * z4 + m2[14]) / w3;
  return out;
}
var forEach = function() {
  var vec = create();
  return function(a5, stride, offset, count, fn, arg) {
    var i3, l4;
    if (!stride) {
      stride = 3;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l4 = Math.min(count * stride + offset, a5.length);
    } else {
      l4 = a5.length;
    }
    for (i3 = offset; i3 < l4; i3 += stride) {
      vec[0] = a5[i3];
      vec[1] = a5[i3 + 1];
      vec[2] = a5[i3 + 2];
      fn(vec, vec, arg);
      a5[i3] = vec[0];
      a5[i3 + 1] = vec[1];
      a5[i3 + 2] = vec[2];
    }
    return a5;
  };
}();

// ../../node_modules/gl-matrix/esm/mat4.js
function invert(out, a5) {
  var a00 = a5[0], a01 = a5[1], a02 = a5[2], a03 = a5[3];
  var a10 = a5[4], a11 = a5[5], a12 = a5[6], a13 = a5[7];
  var a20 = a5[8], a21 = a5[9], a22 = a5[10], a23 = a5[11];
  var a30 = a5[12], a31 = a5[13], a32 = a5[14], a33 = a5[15];
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
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}
function determinant(a5) {
  var a00 = a5[0], a01 = a5[1], a02 = a5[2], a03 = a5[3];
  var a10 = a5[4], a11 = a5[5], a12 = a5[6], a13 = a5[7];
  var a20 = a5[8], a21 = a5[9], a22 = a5[10], a23 = a5[11];
  var a30 = a5[12], a31 = a5[13], a32 = a5[14], a33 = a5[15];
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
function multiply(out, a5, b3) {
  var a00 = a5[0], a01 = a5[1], a02 = a5[2], a03 = a5[3];
  var a10 = a5[4], a11 = a5[5], a12 = a5[6], a13 = a5[7];
  var a20 = a5[8], a21 = a5[9], a22 = a5[10], a23 = a5[11];
  var a30 = a5[12], a31 = a5[13], a32 = a5[14], a33 = a5[15];
  var b0 = b3[0], b1 = b3[1], b22 = b3[2], b32 = b3[3];
  out[0] = b0 * a00 + b1 * a10 + b22 * a20 + b32 * a30;
  out[1] = b0 * a01 + b1 * a11 + b22 * a21 + b32 * a31;
  out[2] = b0 * a02 + b1 * a12 + b22 * a22 + b32 * a32;
  out[3] = b0 * a03 + b1 * a13 + b22 * a23 + b32 * a33;
  b0 = b3[4];
  b1 = b3[5];
  b22 = b3[6];
  b32 = b3[7];
  out[4] = b0 * a00 + b1 * a10 + b22 * a20 + b32 * a30;
  out[5] = b0 * a01 + b1 * a11 + b22 * a21 + b32 * a31;
  out[6] = b0 * a02 + b1 * a12 + b22 * a22 + b32 * a32;
  out[7] = b0 * a03 + b1 * a13 + b22 * a23 + b32 * a33;
  b0 = b3[8];
  b1 = b3[9];
  b22 = b3[10];
  b32 = b3[11];
  out[8] = b0 * a00 + b1 * a10 + b22 * a20 + b32 * a30;
  out[9] = b0 * a01 + b1 * a11 + b22 * a21 + b32 * a31;
  out[10] = b0 * a02 + b1 * a12 + b22 * a22 + b32 * a32;
  out[11] = b0 * a03 + b1 * a13 + b22 * a23 + b32 * a33;
  b0 = b3[12];
  b1 = b3[13];
  b22 = b3[14];
  b32 = b3[15];
  out[12] = b0 * a00 + b1 * a10 + b22 * a20 + b32 * a30;
  out[13] = b0 * a01 + b1 * a11 + b22 * a21 + b32 * a31;
  out[14] = b0 * a02 + b1 * a12 + b22 * a22 + b32 * a32;
  out[15] = b0 * a03 + b1 * a13 + b22 * a23 + b32 * a33;
  return out;
}
function fromScaling(out, v4) {
  out[0] = v4[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v4[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v4[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
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
  var S3 = 0;
  if (trace > 0) {
    S3 = Math.sqrt(trace + 1) * 2;
    out[3] = 0.25 * S3;
    out[0] = (sm23 - sm32) / S3;
    out[1] = (sm31 - sm13) / S3;
    out[2] = (sm12 - sm21) / S3;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S3 = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S3;
    out[0] = 0.25 * S3;
    out[1] = (sm12 + sm21) / S3;
    out[2] = (sm31 + sm13) / S3;
  } else if (sm22 > sm33) {
    S3 = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S3;
    out[0] = (sm12 + sm21) / S3;
    out[1] = 0.25 * S3;
    out[2] = (sm23 + sm32) / S3;
  } else {
    S3 = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S3;
    out[0] = (sm31 + sm13) / S3;
    out[1] = (sm23 + sm32) / S3;
    out[2] = 0.25 * S3;
  }
  return out;
}
function fromRotationTranslationScale(out, q4, v4, s4) {
  var x2 = q4[0], y3 = q4[1], z4 = q4[2], w3 = q4[3];
  var x22 = x2 + x2;
  var y22 = y3 + y3;
  var z22 = z4 + z4;
  var xx = x2 * x22;
  var xy = x2 * y22;
  var xz = x2 * z22;
  var yy = y3 * y22;
  var yz = y3 * z22;
  var zz = z4 * z22;
  var wx = w3 * x22;
  var wy = w3 * y22;
  var wz = w3 * z22;
  var sx = s4[0];
  var sy = s4[1];
  var sz = s4[2];
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v4[0];
  out[13] = v4[1];
  out[14] = v4[2];
  out[15] = 1;
  return out;
}

// ../../node_modules/@gltf-transform/core/dist/core.modern.js
var h = "@glb.bin";
var o;
var u;
var c;
var a;
function l(t4, s4, e4, i3) {
  var r4, n4 = arguments.length, h3 = n4 < 3 ? s4 : i3 === null ? i3 = Object.getOwnPropertyDescriptor(s4, e4) : i3;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    h3 = Reflect.decorate(t4, s4, e4, i3);
  else
    for (var o5 = t4.length - 1; o5 >= 0; o5--)
      (r4 = t4[o5]) && (h3 = (n4 < 3 ? r4(h3) : n4 > 3 ? r4(s4, e4, h3) : r4(s4, e4)) || h3);
  return n4 > 3 && h3 && Object.defineProperty(s4, e4, h3), h3;
}
!function(t4) {
  t4.ACCESSOR = "Accessor", t4.ANIMATION = "Animation", t4.ANIMATION_CHANNEL = "AnimationChannel", t4.ANIMATION_SAMPLER = "AnimationSampler", t4.BUFFER = "Buffer", t4.CAMERA = "Camera", t4.MATERIAL = "Material", t4.MESH = "Mesh", t4.PRIMITIVE = "Primitive", t4.PRIMITIVE_TARGET = "PrimitiveTarget", t4.NODE = "Node", t4.ROOT = "Root", t4.SCENE = "Scene", t4.SKIN = "Skin", t4.TEXTURE = "Texture", t4.TEXTURE_INFO = "TextureInfo";
}(o || (o = {})), function(t4) {
  t4.INTERLEAVED = "interleaved", t4.SEPARATE = "separate";
}(u || (u = {})), function(t4) {
  t4[t4.R = 4096] = "R", t4[t4.G = 256] = "G", t4[t4.B = 16] = "B", t4[t4.A = 1] = "A";
}(c || (c = {})), function(t4) {
  t4.GLTF = "GLTF", t4.GLB = "GLB";
}(a || (a = {}));
var f = class {
  constructor(t4, s4, e4) {
    if (this.t = void 0, this.i = void 0, this.h = void 0, this.o = false, this.u = [], this.t = t4, this.i = s4, this.h = e4, !s4.canLink(e4))
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
  setChild(t4) {
    return this.h = t4, this;
  }
  dispose() {
    this.o || (this.o = true, this.u.forEach((t4) => t4()), this.u.length = 0);
  }
  onDispose(t4) {
    return this.u.push(t4), this;
  }
  isDisposed() {
    return this.o;
  }
};
function p(t4, s4) {
  Object.defineProperty(t4, s4, { get: function() {
    return this["__" + s4];
  }, set: function(t5) {
    const e4 = this["__" + s4];
    e4 && !Array.isArray(e4) && e4.dispose(), t5 && !Array.isArray(t5) && t5.onDispose(() => {
      this["__" + s4] = null;
    }), this["__" + s4] = t5;
  }, enumerable: true });
}
function g(t4, s4) {
}
function w(t4) {
  const s4 = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }, e4 = t4.propertyType === o.NODE ? [t4] : t4.listChildren();
  for (const t5 of e4)
    t5.traverse((t6) => {
      const e5 = t6.getMesh();
      if (!e5)
        return;
      const i3 = v(e5, t6.getWorldMatrix());
      m(i3.min, s4), m(i3.max, s4);
    });
  return s4;
}
function v(s4, e4) {
  const i3 = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (const r4 of s4.listPrimitives()) {
    const s5 = r4.getAttribute("POSITION");
    if (!s5)
      continue;
    let n4 = [0, 0, 0], h3 = [0, 0, 0];
    for (let r5 = 0; r5 < s5.getCount(); r5++)
      n4 = s5.getElement(r5, n4), h3 = transformMat4(h3, n4, e4), m(h3, i3);
  }
  return i3;
}
function m(t4, s4) {
  for (let e4 = 0; e4 < 3; e4++)
    s4.min[e4] = Math.min(t4[e4], s4.min[e4]), s4.max[e4] = Math.max(t4[e4], s4.max[e4]);
}
var T = class {
  static createBufferFromDataURI(t4) {
    if (typeof Buffer == "undefined") {
      const s4 = atob(t4.split(",")[1]), e4 = new Uint8Array(s4.length);
      for (let t5 = 0; t5 < s4.length; t5++)
        e4[t5] = s4.charCodeAt(t5);
      return e4.buffer;
    }
    {
      const s4 = t4.split(",")[1], e4 = t4.indexOf("base64") >= 0;
      return this.trim(Buffer.from(s4, e4 ? "base64" : "utf8"));
    }
  }
  static encodeText(t4) {
    return typeof TextEncoder != "undefined" ? new TextEncoder().encode(t4).buffer : this.trim(Buffer.from(t4));
  }
  static decodeText(t4) {
    return typeof TextDecoder != "undefined" ? new TextDecoder().decode(t4) : Buffer.from(t4).toString("utf8");
  }
  static trim(t4) {
    const { byteOffset: s4, byteLength: e4 } = t4;
    return t4.buffer.slice(s4, s4 + e4);
  }
  static concat(t4) {
    let s4 = 0;
    for (const e5 of t4)
      s4 += e5.byteLength;
    const e4 = new Uint8Array(s4);
    let i3 = 0;
    for (const s5 of t4)
      e4.set(new Uint8Array(s5), i3), i3 += s5.byteLength;
    return e4.buffer;
  }
  static pad(t4, s4 = 0) {
    const e4 = this.padNumber(t4.byteLength);
    if (e4 !== t4.byteLength) {
      const i3 = new Uint8Array(e4);
      if (i3.set(new Uint8Array(t4)), s4 !== 0)
        for (let r4 = t4.byteLength; r4 < e4; r4++)
          i3[r4] = s4;
      return i3.buffer;
    }
    return t4;
  }
  static padNumber(t4) {
    return 4 * Math.ceil(t4 / 4);
  }
  static equals(t4, s4) {
    if (t4 === s4)
      return true;
    if (t4.byteLength !== s4.byteLength)
      return false;
    const e4 = new DataView(t4), i3 = new DataView(s4);
    let r4 = t4.byteLength;
    for (; r4--; )
      if (e4.getUint8(r4) !== i3.getUint8(r4))
        return false;
    return true;
  }
};
var y = class {
  static hexToFactor(t4, s4) {
    t4 = Math.floor(t4);
    const e4 = s4;
    return e4[0] = (t4 >> 16 & 255) / 255, e4[1] = (t4 >> 8 & 255) / 255, e4[2] = (255 & t4) / 255, this.convertSRGBToLinear(s4, s4);
  }
  static factorToHex(t4) {
    const s4 = [...t4], [e4, i3, r4] = this.convertLinearToSRGB(t4, s4);
    return 255 * e4 << 16 ^ 255 * i3 << 8 ^ 255 * r4 << 0;
  }
  static convertSRGBToLinear(t4, s4) {
    const e4 = t4, i3 = s4;
    for (let t5 = 0; t5 < 3; t5++)
      i3[t5] = e4[t5] < 0.04045 ? 0.0773993808 * e4[t5] : Math.pow(0.9478672986 * e4[t5] + 0.0521327014, 2.4);
    return s4;
  }
  static convertLinearToSRGB(t4, s4) {
    const e4 = t4, i3 = s4;
    for (let t5 = 0; t5 < 3; t5++)
      i3[t5] = e4[t5] < 31308e-7 ? 12.92 * e4[t5] : 1.055 * Math.pow(e4[t5], 0.41666) - 0.055;
    return s4;
  }
};
var A = class {
  static basename(t4) {
    const s4 = t4.split(/[\\/]/).pop();
    return s4.substr(0, s4.lastIndexOf("."));
  }
  static extension(t4) {
    return t4.indexOf("data:") !== 0 ? t4.split(/[\\/]/).pop().split(/[.]/).pop() : t4.indexOf("data:image/png") === 0 ? "png" : t4.indexOf("data:image/jpeg") === 0 ? "jpeg" : "bin";
  }
};
var x = class {
  getSize(t4) {
    const s4 = new DataView(t4);
    return T.decodeText(t4.slice(12, 16)) === x.PNG_FRIED_CHUNK_NAME ? [s4.getUint32(32, false), s4.getUint32(36, false)] : [s4.getUint32(16, false), s4.getUint32(20, false)];
  }
  getChannels(t4) {
    return 4;
  }
};
x.PNG_FRIED_CHUNK_NAME = "CgBI";
var E = class {
  static registerFormat(t4, s4) {
    this.impls[t4] = s4;
  }
  static getSize(t4, s4) {
    return this.impls[s4] ? this.impls[s4].getSize(t4) : null;
  }
  static getChannels(t4, s4) {
    return this.impls[s4] ? this.impls[s4].getChannels(t4) : null;
  }
  static getMemSize(t4, s4) {
    if (!this.impls[s4])
      return null;
    if (this.impls[s4].getGPUByteLength)
      return this.impls[s4].getGPUByteLength(t4);
    let e4 = 0;
    const i3 = this.getSize(t4, s4);
    if (!i3)
      return null;
    for (; i3[0] > 1 || i3[1] > 1; )
      e4 += i3[0] * i3[1] * 4, i3[0] = Math.max(Math.floor(i3[0] / 2), 1), i3[1] = Math.max(Math.floor(i3[1] / 2), 1);
    return e4 += 4, e4;
  }
  static mimeTypeToExtension(t4) {
    return t4 === "image/jpeg" ? "jpg" : t4.split("/").pop();
  }
  static extensionToMimeType(t4) {
    return t4 === "jpg" ? "image/jpeg" : `image/${t4}`;
  }
};
function M(t4, s4) {
  if (s4 > t4.byteLength)
    throw new TypeError("Corrupt JPG, exceeded buffer limits");
  if (t4.getUint8(s4) !== 255)
    throw new TypeError("Invalid JPG, marker table corrupted");
  return t4;
}
E.impls = { "image/jpeg": new class {
  getSize(t4) {
    let s4, e4, i3 = new DataView(t4, 4);
    for (; i3.byteLength; ) {
      if (s4 = i3.getUint16(0, false), M(i3, s4), e4 = i3.getUint8(s4 + 1), e4 === 192 || e4 === 193 || e4 === 194)
        return [i3.getUint16(s4 + 7, false), i3.getUint16(s4 + 5, false)];
      i3 = new DataView(t4, i3.byteOffset + s4 + 2);
    }
    throw new TypeError("Invalid JPG, no size found");
  }
  getChannels(t4) {
    return 3;
  }
}(), "image/png": new x() };
var S = class {
  static identity(t4) {
    return t4;
  }
  static eq(t4, s4) {
    if (t4.length !== s4.length)
      return false;
    for (let e4 = 0; e4 < t4.length; e4++)
      if (Math.abs(t4[e4] - s4[e4]) > 1e-5)
        return false;
    return true;
  }
  static denormalize(t4, s4) {
    switch (s4) {
      case 5126:
        return t4;
      case 5123:
        return t4 / 65535;
      case 5121:
        return t4 / 255;
      case 5122:
        return Math.max(t4 / 32767, -1);
      case 5120:
        return Math.max(t4 / 127, -1);
      default:
        throw new Error("Invalid component type.");
    }
  }
  static normalize(t4, s4) {
    switch (s4) {
      case 5126:
        return t4;
      case 5123:
        return Math.round(65535 * t4);
      case 5121:
        return Math.round(255 * t4);
      case 5122:
        return Math.round(32767 * t4);
      case 5120:
        return Math.round(127 * t4);
      default:
        throw new Error("Invalid component type.");
    }
  }
  static decompose(t4, r4, n4, h3) {
    let o5 = length([t4[0], t4[1], t4[2]]);
    const u2 = length([t4[4], t4[5], t4[6]]), c4 = length([t4[8], t4[9], t4[10]]);
    determinant(t4) < 0 && (o5 = -o5), r4[0] = t4[12], r4[1] = t4[13], r4[2] = t4[14];
    const a5 = t4.slice(), l4 = 1 / o5, f3 = 1 / u2, d = 1 / c4;
    a5[0] *= l4, a5[1] *= l4, a5[2] *= l4, a5[4] *= f3, a5[5] *= f3, a5[6] *= f3, a5[8] *= d, a5[9] *= d, a5[10] *= d, getRotation(n4, a5), h3[0] = o5, h3[1] = u2, h3[2] = c4;
  }
  static compose(t4, s4, e4, i3) {
    const r4 = i3, n4 = s4[0], h3 = s4[1], o5 = s4[2], u2 = s4[3], c4 = n4 + n4, a5 = h3 + h3, l4 = o5 + o5, f3 = n4 * c4, d = n4 * a5, p3 = n4 * l4, g2 = h3 * a5, w3 = h3 * l4, v4 = o5 * l4, m2 = u2 * c4, T2 = u2 * a5, y3 = u2 * l4, A3 = e4[0], x2 = e4[1], E2 = e4[2];
    return r4[0] = (1 - (g2 + v4)) * A3, r4[1] = (d + y3) * A3, r4[2] = (p3 - T2) * A3, r4[3] = 0, r4[4] = (d - y3) * x2, r4[5] = (1 - (f3 + v4)) * x2, r4[6] = (w3 + m2) * x2, r4[7] = 0, r4[8] = (p3 + T2) * E2, r4[9] = (w3 - m2) * E2, r4[10] = (1 - (f3 + g2)) * E2, r4[11] = 0, r4[12] = t4[0], r4[13] = t4[1], r4[14] = t4[2], r4[15] = 1, r4;
  }
};
var I = class {
  constructor(t4) {
    this.verbosity = void 0, this.verbosity = t4;
  }
  debug(t4) {
    this.verbosity <= I.Verbosity.DEBUG && console.debug(t4);
  }
  info(t4) {
    this.verbosity <= I.Verbosity.INFO && console.info(t4);
  }
  warn(t4) {
    this.verbosity <= I.Verbosity.WARN && console.warn(t4);
  }
  error(t4) {
    this.verbosity <= I.Verbosity.ERROR && console.error(t4);
  }
};
I.Verbosity = { SILENT: 4, ERROR: 3, WARN: 2, INFO: 1, DEBUG: 0 }, I.DEFAULT_INSTANCE = new I(I.Verbosity.INFO);
var b = "23456789abdegjkmnpqrvwxyzABDEGJKMNPQRVWXYZ";
var R = new Set();
var N = function() {
  let t4 = "";
  for (let s4 = 0; s4 < 6; s4++)
    t4 += b.charAt(Math.floor(Math.random() * b.length));
  return t4;
};
var C = function() {
  for (let t4 = 0; t4 < 999; t4++) {
    const t5 = N();
    if (!R.has(t5))
      return R.add(t5), t5;
  }
  return "";
};
var _ = (t4) => t4;
var O = class extends class {
  constructor(t4) {
    this.graph = void 0, this.o = false, this.graph = t4, this.graph = t4;
  }
  canLink(t4) {
    return this.graph === t4.graph;
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
  swap(t4, s4) {
    return this.graph.swapChild(this, t4, s4), this;
  }
  addGraphChild(t4, s4) {
    return t4.push(s4), s4.onDispose(() => {
      const e4 = t4.filter((t5) => t5 !== s4);
      t4.length = 0;
      for (const s5 of e4)
        t4.push(s5);
    }), this;
  }
  removeGraphChild(t4, s4) {
    return t4.filter((t5) => t5.getChild() === s4).forEach((t5) => t5.dispose()), this;
  }
  clearGraphChildList(t4) {
    for (; t4.length > 0; )
      t4[0].dispose();
    return this;
  }
  listGraphParents() {
    return this.graph.listParents(this);
  }
} {
  constructor(t4, s4 = "") {
    super(t4), this.graph = void 0, this.m = {}, this.t = "", this.graph = t4, this.t = s4;
  }
  getName() {
    return this.t;
  }
  setName(t4) {
    return this.t = t4, this;
  }
  getExtras() {
    return this.m;
  }
  setExtras(t4) {
    return this.m = t4, this;
  }
  clone() {
    const t4 = new (0, this.constructor)(this.graph).copy(this, _);
    return this.graph.emit("clone", t4), t4;
  }
  copy(t4, s4 = _) {
    return this.t = t4.t, this.m = JSON.parse(JSON.stringify(t4.m)), this;
  }
  detach() {
    return this.graph.disconnectParents(this, (t4) => t4.propertyType !== "Root"), this;
  }
  listParents() {
    return this.listGraphParents();
  }
};
var L = "Pass extension name (string) as lookup token, not a constructor.";
var B = class extends O {
  constructor(...t4) {
    super(...t4), this.extensions = [];
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.clearGraphChildList(this.extensions), t4.extensions.forEach((t5) => {
      const e4 = t5.getChild();
      this.setExtension(e4.extensionName, s4(e4));
    }), this;
  }
  getExtension(t4) {
    if (typeof t4 != "string")
      throw new Error(L);
    const s4 = this.extensions.find((s5) => s5.getChild().extensionName === t4);
    return s4 ? s4.getChild() : null;
  }
  setExtension(t4, s4) {
    if (typeof t4 != "string")
      throw new Error(L);
    const e4 = this.getExtension(t4);
    return e4 && this.removeGraphChild(this.extensions, e4), s4 ? (s4.T(this), this.addGraphChild(this.extensions, this.graph.link(t4, this, s4))) : this;
  }
  listExtensions() {
    return this.extensions.map((t4) => t4.getChild());
  }
};
l([g], B.prototype, "extensions", void 0);
var P = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.ACCESSOR, this.M = null, this.S = P.Type.SCALAR, this.I = P.ComponentType.FLOAT, this.N = false, this.C = S.identity, this._ = S.identity, this.buffer = null;
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.S = t4.S, this.I = t4.I, this.N = t4.N, this.C = t4.C, this._ = t4._, t4.M && (this.M = t4.M.slice()), this.setBuffer(t4.buffer ? s4(t4.buffer.getChild()) : null), this;
  }
  static getElementSize(t4) {
    switch (t4) {
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
        throw new Error("Unexpected type: " + t4);
    }
  }
  static getComponentSize(t4) {
    switch (t4) {
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
        throw new Error("Unexpected component type: " + t4);
    }
  }
  getMinNormalized(t4) {
    const s4 = this.getElementSize();
    this.getMin(t4);
    for (let e4 = 0; e4 < s4; e4++)
      t4[e4] = this._(t4[e4]);
    return t4;
  }
  getMin(t4) {
    const s4 = this.getCount(), e4 = this.getElementSize();
    for (let s5 = 0; s5 < e4; s5++)
      t4[s5] = Infinity;
    for (let i3 = 0; i3 < s4 * e4; i3 += e4)
      for (let s5 = 0; s5 < e4; s5++) {
        const e5 = this.M[i3 + s5];
        Number.isFinite(e5) && (t4[s5] = Math.min(t4[s5], e5));
      }
    return t4;
  }
  getMaxNormalized(t4) {
    const s4 = this.getElementSize();
    this.getMax(t4);
    for (let e4 = 0; e4 < s4; e4++)
      t4[e4] = this._(t4[e4]);
    return t4;
  }
  getMax(t4) {
    const s4 = this.getCount(), e4 = this.getElementSize();
    for (let s5 = 0; s5 < e4; s5++)
      t4[s5] = -Infinity;
    for (let i3 = 0; i3 < s4 * e4; i3 += e4)
      for (let s5 = 0; s5 < e4; s5++) {
        const e5 = this.M[i3 + s5];
        Number.isFinite(e5) && (t4[s5] = Math.max(t4[s5], e5));
      }
    return t4;
  }
  getCount() {
    return this.M ? this.M.length / this.getElementSize() : 0;
  }
  getType() {
    return this.S;
  }
  setType(t4) {
    return this.S = t4, this;
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
  setNormalized(t4) {
    return this.N = t4, t4 ? (this._ = (t5) => S.denormalize(t5, this.I), this.C = (t5) => S.normalize(t5, this.I)) : (this._ = S.identity, this.C = S.identity), this;
  }
  getScalar(t4) {
    const s4 = this.getElementSize();
    return this._(this.M[t4 * s4]);
  }
  setScalar(t4, s4) {
    return this.M[t4 * this.getElementSize()] = this.C(s4), this;
  }
  getElement(t4, s4) {
    const e4 = this.getElementSize();
    for (let i3 = 0; i3 < e4; i3++)
      s4[i3] = this._(this.M[t4 * e4 + i3]);
    return s4;
  }
  setElement(t4, s4) {
    const e4 = this.getElementSize();
    for (let i3 = 0; i3 < e4; i3++)
      this.M[t4 * e4 + i3] = this.C(s4[i3]);
    return this;
  }
  getBuffer() {
    return this.buffer ? this.buffer.getChild() : null;
  }
  setBuffer(t4) {
    return this.buffer = this.graph.link("buffer", this, t4), this;
  }
  getArray() {
    return this.M;
  }
  setArray(t4) {
    return this.I = t4 ? function(t5) {
      switch (t5.constructor) {
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
    }(t4) : P.ComponentType.FLOAT, this.M = t4, this;
  }
  getByteLength() {
    return this.M ? this.M.byteLength : 0;
  }
};
P.Type = { SCALAR: "SCALAR", VEC2: "VEC2", VEC3: "VEC3", VEC4: "VEC4", MAT2: "MAT2", MAT3: "MAT3", MAT4: "MAT4" }, P.ComponentType = { BYTE: 5120, UNSIGNED_BYTE: 5121, SHORT: 5122, UNSIGNED_SHORT: 5123, UNSIGNED_INT: 5125, FLOAT: 5126 }, l([p], P.prototype, "buffer", void 0);
var U = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.ANIMATION, this.channels = [], this.samplers = [];
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.clearGraphChildList(this.channels), this.clearGraphChildList(this.samplers), t4.channels.forEach((t5) => this.addChannel(s4(t5.getChild()))), t4.samplers.forEach((t5) => this.addSampler(s4(t5.getChild()))), this;
  }
  addChannel(t4) {
    const s4 = this.graph.link("channel", this, t4);
    return this.addGraphChild(this.channels, s4);
  }
  removeChannel(t4) {
    return this.removeGraphChild(this.channels, t4);
  }
  listChannels() {
    return this.channels.map((t4) => t4.getChild());
  }
  addSampler(t4) {
    const s4 = this.graph.link("sampler", this, t4);
    return this.addGraphChild(this.samplers, s4);
  }
  removeSampler(t4) {
    return this.removeGraphChild(this.samplers, t4);
  }
  listSamplers() {
    return this.samplers.map((t4) => t4.getChild());
  }
};
l([g], U.prototype, "channels", void 0), l([g], U.prototype, "samplers", void 0);
var k = class extends O {
  constructor(...t4) {
    super(...t4), this.propertyType = o.ANIMATION_CHANNEL, this.O = null, this.targetNode = null, this.sampler = null;
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.O = t4.O, this.setTargetNode(t4.targetNode ? s4(t4.targetNode.getChild()) : null), this.setSampler(t4.sampler ? s4(t4.sampler.getChild()) : null), this;
  }
  getTargetPath() {
    return this.O;
  }
  setTargetPath(t4) {
    return this.O = t4, this;
  }
  getTargetNode() {
    return this.targetNode ? this.targetNode.getChild() : null;
  }
  setTargetNode(t4) {
    return this.targetNode = this.graph.link("target.node", this, t4), this;
  }
  getSampler() {
    return this.sampler ? this.sampler.getChild() : null;
  }
  setSampler(t4) {
    return this.sampler = this.graph.link("sampler", this, t4), this;
  }
};
k.TargetPath = { TRANSLATION: "translation", ROTATION: "rotation", SCALE: "scale", WEIGHTS: "weights" }, l([p], k.prototype, "targetNode", void 0), l([p], k.prototype, "sampler", void 0);
var F = class extends O {
  constructor(...t4) {
    super(...t4), this.propertyType = o.ANIMATION_SAMPLER, this.L = F.Interpolation.LINEAR, this.input = null, this.output = null;
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.L = t4.L, this.setInput(t4.input ? s4(t4.input.getChild()) : null), this.setOutput(t4.output ? s4(t4.output.getChild()) : null), this;
  }
  getInterpolation() {
    return this.L;
  }
  setInterpolation(t4) {
    return this.L = t4, this;
  }
  getInput() {
    return this.input ? this.input.getChild() : null;
  }
  setInput(t4) {
    return this.input = this.graph.link("input", this, t4), this;
  }
  getOutput() {
    return this.output ? this.output.getChild() : null;
  }
  setOutput(t4) {
    return this.output = this.graph.link("output", this, t4), this;
  }
};
F.Interpolation = { LINEAR: "LINEAR", STEP: "STEP", CUBICSPLINE: "CUBICSPLINE" }, l([p], F.prototype, "input", void 0), l([p], F.prototype, "output", void 0);
var G = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.BUFFER, this.P = "";
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.P = t4.P, this;
  }
  getURI() {
    return this.P;
  }
  setURI(t4) {
    return this.P = t4, this;
  }
};
var j = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.CAMERA, this.S = j.Type.PERSPECTIVE, this.U = 0.1, this.k = 100, this.F = null, this.j = 2 * Math.PI * 50 / 360, this.D = 1, this.J = 1;
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.S = t4.S, this.U = t4.U, this.k = t4.k, this.F = t4.F, this.j = t4.j, this.D = t4.D, this.J = t4.J, this;
  }
  getType() {
    return this.S;
  }
  setType(t4) {
    return this.S = t4, this;
  }
  getZNear() {
    return this.U;
  }
  setZNear(t4) {
    return this.U = t4, this;
  }
  getZFar() {
    return this.k;
  }
  setZFar(t4) {
    return this.k = t4, this;
  }
  getAspectRatio() {
    return this.F;
  }
  setAspectRatio(t4) {
    return this.F = t4, this;
  }
  getYFov() {
    return this.j;
  }
  setYFov(t4) {
    return this.j = t4, this;
  }
  getXMag() {
    return this.D;
  }
  setXMag(t4) {
    return this.D = t4, this;
  }
  getYMag() {
    return this.J;
  }
  setYMag(t4) {
    return this.J = t4, this;
  }
};
j.Type = { PERSPECTIVE: "perspective", ORTHOGRAPHIC: "orthographic" };
var D = class extends O {
  constructor(t4, s4) {
    super(t4), this.$ = void 0, this.$ = s4, this.$.addExtensionProperty(this);
  }
  clone() {
    const t4 = new (0, this.constructor)(this.graph, this.$).copy(this, _);
    return this.graph.emit("clone", t4), t4;
  }
  dispose() {
    this.$.removeExtensionProperty(this), super.dispose();
  }
  T(t4) {
    if (!this.parentTypes.includes(t4.propertyType))
      throw new Error(`Parent "${t4.propertyType}" invalid for child "${this.propertyType}".`);
  }
};
D.EXTENSION_NAME = void 0;
var J = class extends f {
  constructor(...t4) {
    super(...t4), this.semantic = "";
  }
  copy(t4) {
    return this.semantic = t4.semantic, this;
  }
};
var z = class extends f {
  copy(t4) {
    return this;
  }
};
var W = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.TEXTURE_INFO, this.V = 0, this.W = null, this.Y = null, this.q = W.WrapMode.REPEAT, this.H = W.WrapMode.REPEAT;
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.V = t4.V, this.W = t4.W, this.Y = t4.Y, this.q = t4.q, this.H = t4.H, this;
  }
  getTexCoord() {
    return this.V;
  }
  setTexCoord(t4) {
    return this.V = t4, this;
  }
  getMagFilter() {
    return this.W;
  }
  setMagFilter(t4) {
    return this.W = t4, this;
  }
  getMinFilter() {
    return this.Y;
  }
  setMinFilter(t4) {
    return this.Y = t4, this;
  }
  getWrapS() {
    return this.q;
  }
  setWrapS(t4) {
    return this.q = t4, this;
  }
  getWrapT() {
    return this.H;
  }
  setWrapT(t4) {
    return this.H = t4, this;
  }
};
W.WrapMode = { CLAMP_TO_EDGE: 33071, MIRRORED_REPEAT: 33648, REPEAT: 10497 }, W.MagFilter = { NEAREST: 9728, LINEAR: 9729 }, W.MinFilter = { NEAREST: 9728, LINEAR: 9729, NEAREST_MIPMAP_NEAREST: 9984, LINEAR_MIPMAP_NEAREST: 9985, NEAREST_MIPMAP_LINEAR: 9986, LINEAR_MIPMAP_LINEAR: 9987 };
var { R: Y, G: q, B: H, A: Z } = c;
var K = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.MATERIAL, this.Z = K.AlphaMode.OPAQUE, this.K = 0.5, this.X = false, this.tt = [1, 1, 1, 1], this.st = [0, 0, 0], this.et = 1, this.it = 1, this.rt = 1, this.nt = 1, this.baseColorTexture = null, this.baseColorTextureInfo = this.graph.link("baseColorTextureInfo", this, new W(this.graph)), this.emissiveTexture = null, this.emissiveTextureInfo = this.graph.link("emissiveTextureInfo", this, new W(this.graph)), this.normalTexture = null, this.normalTextureInfo = this.graph.link("normalTextureInfo", this, new W(this.graph)), this.occlusionTexture = null, this.occlusionTextureInfo = this.graph.link("occlusionTextureInfo", this, new W(this.graph)), this.metallicRoughnessTexture = null, this.metallicRoughnessTextureInfo = this.graph.link("metallicRoughnessTextureInfo", this, new W(this.graph));
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.Z = t4.Z, this.K = t4.K, this.X = t4.X, this.tt = [...t4.tt], this.st = [...t4.st], this.et = t4.et, this.it = t4.it, this.rt = t4.rt, this.nt = t4.nt, this.setBaseColorTexture(t4.baseColorTexture ? s4(t4.baseColorTexture.getChild()) : null), this.baseColorTextureInfo.getChild().copy(s4(t4.baseColorTextureInfo.getChild()), s4), this.setEmissiveTexture(t4.emissiveTexture ? s4(t4.emissiveTexture.getChild()) : null), this.emissiveTextureInfo.getChild().copy(s4(t4.emissiveTextureInfo.getChild()), s4), this.setNormalTexture(t4.normalTexture ? s4(t4.normalTexture.getChild()) : null), this.normalTextureInfo.getChild().copy(s4(t4.normalTextureInfo.getChild()), s4), this.setOcclusionTexture(t4.occlusionTexture ? s4(t4.occlusionTexture.getChild()) : null), this.occlusionTextureInfo.getChild().copy(s4(t4.occlusionTextureInfo.getChild()), s4), this.setMetallicRoughnessTexture(t4.metallicRoughnessTexture ? s4(t4.metallicRoughnessTexture.getChild()) : null), this.metallicRoughnessTextureInfo.getChild().copy(s4(t4.metallicRoughnessTextureInfo.getChild()), s4), this;
  }
  dispose() {
    this.baseColorTextureInfo.getChild().dispose(), this.emissiveTextureInfo.getChild().dispose(), this.normalTextureInfo.getChild().dispose(), this.occlusionTextureInfo.getChild().dispose(), this.metallicRoughnessTextureInfo.getChild().dispose(), super.dispose();
  }
  getDoubleSided() {
    return this.X;
  }
  setDoubleSided(t4) {
    return this.X = t4, this;
  }
  getAlpha() {
    return this.tt[3];
  }
  setAlpha(t4) {
    return this.tt[3] = t4, this;
  }
  getAlphaMode() {
    return this.Z;
  }
  setAlphaMode(t4) {
    return this.Z = t4, this;
  }
  getAlphaCutoff() {
    return this.K;
  }
  setAlphaCutoff(t4) {
    return this.K = t4, this;
  }
  getBaseColorFactor() {
    return this.tt;
  }
  setBaseColorFactor(t4) {
    return this.tt = t4, this;
  }
  getBaseColorHex() {
    return y.factorToHex(this.tt);
  }
  setBaseColorHex(t4) {
    return y.hexToFactor(t4, this.tt), this;
  }
  getBaseColorTexture() {
    return this.baseColorTexture ? this.baseColorTexture.getChild() : null;
  }
  getBaseColorTextureInfo() {
    return this.baseColorTexture ? this.baseColorTextureInfo.getChild() : null;
  }
  setBaseColorTexture(t4) {
    return this.baseColorTexture = this.graph.linkTexture("baseColorTexture", Y | q | H | Z, this, t4), this;
  }
  getEmissiveFactor() {
    return this.st;
  }
  setEmissiveFactor(t4) {
    return this.st = t4, this;
  }
  getEmissiveHex() {
    return y.factorToHex(this.st);
  }
  setEmissiveHex(t4) {
    return y.hexToFactor(t4, this.st), this;
  }
  getEmissiveTexture() {
    return this.emissiveTexture ? this.emissiveTexture.getChild() : null;
  }
  getEmissiveTextureInfo() {
    return this.emissiveTexture ? this.emissiveTextureInfo.getChild() : null;
  }
  setEmissiveTexture(t4) {
    return this.emissiveTexture = this.graph.linkTexture("emissiveTexture", Y | q | H, this, t4), this;
  }
  getNormalScale() {
    return this.et;
  }
  setNormalScale(t4) {
    return this.et = t4, this;
  }
  getNormalTexture() {
    return this.normalTexture ? this.normalTexture.getChild() : null;
  }
  getNormalTextureInfo() {
    return this.normalTexture ? this.normalTextureInfo.getChild() : null;
  }
  setNormalTexture(t4) {
    return this.normalTexture = this.graph.linkTexture("normalTexture", Y | q | H, this, t4), this;
  }
  getOcclusionStrength() {
    return this.it;
  }
  setOcclusionStrength(t4) {
    return this.it = t4, this;
  }
  getOcclusionTexture() {
    return this.occlusionTexture ? this.occlusionTexture.getChild() : null;
  }
  getOcclusionTextureInfo() {
    return this.occlusionTexture ? this.occlusionTextureInfo.getChild() : null;
  }
  setOcclusionTexture(t4) {
    return this.occlusionTexture = this.graph.linkTexture("occlusionTexture", Y, this, t4), this;
  }
  getRoughnessFactor() {
    return this.rt;
  }
  setRoughnessFactor(t4) {
    return this.rt = t4, this;
  }
  getMetallicFactor() {
    return this.nt;
  }
  setMetallicFactor(t4) {
    return this.nt = t4, this;
  }
  getMetallicRoughnessTexture() {
    return this.metallicRoughnessTexture ? this.metallicRoughnessTexture.getChild() : null;
  }
  getMetallicRoughnessTextureInfo() {
    return this.metallicRoughnessTexture ? this.metallicRoughnessTextureInfo.getChild() : null;
  }
  setMetallicRoughnessTexture(t4) {
    return this.metallicRoughnessTexture = this.graph.linkTexture("metallicRoughnessTexture", q | H, this, t4), this;
  }
};
K.AlphaMode = { OPAQUE: "OPAQUE", MASK: "MASK", BLEND: "BLEND" }, l([p], K.prototype, "baseColorTexture", void 0), l([p], K.prototype, "baseColorTextureInfo", void 0), l([p], K.prototype, "emissiveTexture", void 0), l([p], K.prototype, "emissiveTextureInfo", void 0), l([p], K.prototype, "normalTexture", void 0), l([p], K.prototype, "normalTextureInfo", void 0), l([p], K.prototype, "occlusionTexture", void 0), l([p], K.prototype, "occlusionTextureInfo", void 0), l([p], K.prototype, "metallicRoughnessTexture", void 0), l([p], K.prototype, "metallicRoughnessTextureInfo", void 0);
var Q = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.MESH, this.ht = [], this.primitives = [];
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.ht = [...t4.ht], this.clearGraphChildList(this.primitives), t4.primitives.forEach((t5) => this.addPrimitive(s4(t5.getChild()))), this;
  }
  addPrimitive(t4) {
    return this.addGraphChild(this.primitives, this.graph.link("primitive", this, t4));
  }
  removePrimitive(t4) {
    return this.removeGraphChild(this.primitives, t4);
  }
  listPrimitives() {
    return this.primitives.map((t4) => t4.getChild());
  }
  getWeights() {
    return this.ht;
  }
  setWeights(t4) {
    return this.ht = t4, this;
  }
};
l([g], Q.prototype, "primitives", void 0);
var X = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.NODE, this.ot = [0, 0, 0], this.ut = [0, 0, 0, 1], this.ct = [1, 1, 1], this.ht = [], this.i = null, this.camera = null, this.mesh = null, this.skin = null, this.children = [];
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.ot = [...t4.ot], this.ut = [...t4.ut], this.ct = [...t4.ct], this.ht = [...t4.ht], this.setCamera(t4.camera ? s4(t4.camera.getChild()) : null), this.setMesh(t4.mesh ? s4(t4.mesh.getChild()) : null), this.setSkin(t4.skin ? s4(t4.skin.getChild()) : null), s4 !== _ && (this.clearGraphChildList(this.children), t4.children.forEach((t5) => this.addChild(s4(t5.getChild())))), this;
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
  setTranslation(t4) {
    return this.ot = t4, this;
  }
  setRotation(t4) {
    return this.ut = t4, this;
  }
  setScale(t4) {
    return this.ct = t4, this;
  }
  getMatrix() {
    return S.compose(this.ot, this.ut, this.ct, []);
  }
  setMatrix(t4) {
    return S.decompose(t4, this.ot, this.ut, this.ct), this;
  }
  getWorldTranslation() {
    const t4 = [0, 0, 0];
    return S.decompose(this.getWorldMatrix(), t4, [0, 0, 0, 1], [1, 1, 1]), t4;
  }
  getWorldRotation() {
    const t4 = [0, 0, 0, 1];
    return S.decompose(this.getWorldMatrix(), [0, 0, 0], t4, [1, 1, 1]), t4;
  }
  getWorldScale() {
    const t4 = [1, 1, 1];
    return S.decompose(this.getWorldMatrix(), [0, 0, 0], [0, 0, 0, 1], t4), t4;
  }
  getWorldMatrix() {
    const t4 = [];
    for (let s5 = this; s5 instanceof X; s5 = s5.i)
      t4.push(s5);
    let s4;
    const e4 = t4.pop().getMatrix();
    for (; s4 = t4.pop(); )
      multiply(e4, e4, s4.getMatrix());
    return e4;
  }
  addChild(t4) {
    t4.i && t4.i.removeChild(t4);
    const s4 = this.graph.link("child", this, t4);
    return this.addGraphChild(this.children, s4), t4.i = this, s4.onDispose(() => t4.i = null), this;
  }
  removeChild(t4) {
    return this.removeGraphChild(this.children, t4);
  }
  listChildren() {
    return this.children.map((t4) => t4.getChild());
  }
  getParent() {
    return this.i;
  }
  getMesh() {
    return this.mesh ? this.mesh.getChild() : null;
  }
  setMesh(t4) {
    return this.mesh = this.graph.link("mesh", this, t4), this;
  }
  getCamera() {
    return this.camera ? this.camera.getChild() : null;
  }
  setCamera(t4) {
    return this.camera = this.graph.link("camera", this, t4), this;
  }
  getSkin() {
    return this.skin ? this.skin.getChild() : null;
  }
  setSkin(t4) {
    return this.skin = this.graph.link("skin", this, t4), this;
  }
  getWeights() {
    return this.ht;
  }
  setWeights(t4) {
    return this.ht = t4, this;
  }
  traverse(t4) {
    t4(this);
    for (const s4 of this.listChildren())
      s4.traverse(t4);
    return this;
  }
};
l([p], X.prototype, "camera", void 0), l([p], X.prototype, "mesh", void 0), l([p], X.prototype, "skin", void 0), l([g], X.prototype, "children", void 0);
var tt = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.PRIMITIVE, this.at = tt.Mode.TRIANGLES, this.material = null, this.indices = null, this.attributes = [], this.targets = [];
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.at = t4.at, this.setIndices(t4.indices ? s4(t4.indices.getChild()) : null), this.setMaterial(t4.material ? s4(t4.material.getChild()) : null), this.clearGraphChildList(this.attributes), t4.listSemantics().forEach((e4) => {
      this.setAttribute(e4, s4(t4.getAttribute(e4)));
    }), this.clearGraphChildList(this.targets), t4.targets.forEach((t5) => this.addTarget(s4(t5.getChild()))), this;
  }
  getIndices() {
    return this.indices ? this.indices.getChild() : null;
  }
  setIndices(t4) {
    return this.indices = this.graph.linkIndex("indices", this, t4), this;
  }
  getAttribute(t4) {
    const s4 = this.attributes.find((s5) => s5.semantic === t4);
    return s4 ? s4.getChild() : null;
  }
  setAttribute(t4, s4) {
    const e4 = this.getAttribute(t4);
    if (e4 && this.removeGraphChild(this.attributes, e4), !s4)
      return this;
    const i3 = this.graph.linkAttribute(t4, this, s4);
    return this.addGraphChild(this.attributes, i3);
  }
  listAttributes() {
    return this.attributes.map((t4) => t4.getChild());
  }
  listSemantics() {
    return this.attributes.map((t4) => t4.semantic);
  }
  getMaterial() {
    return this.material ? this.material.getChild() : null;
  }
  setMaterial(t4) {
    return this.material = this.graph.link("material", this, t4), this;
  }
  getMode() {
    return this.at;
  }
  setMode(t4) {
    return this.at = t4, this;
  }
  listTargets() {
    return this.targets.map((t4) => t4.getChild());
  }
  addTarget(t4) {
    return this.addGraphChild(this.targets, this.graph.link("target", this, t4)), this;
  }
  removeTarget(t4) {
    return this.removeGraphChild(this.targets, t4);
  }
};
tt.Mode = { POINTS: 0, LINES: 1, LINE_LOOP: 2, LINE_STRIP: 3, TRIANGLES: 4, TRIANGLE_STRIP: 5, TRIANGLE_FAN: 6 }, l([p], tt.prototype, "material", void 0), l([p], tt.prototype, "indices", void 0), l([g], tt.prototype, "attributes", void 0), l([g], tt.prototype, "targets", void 0);
var st = class extends O {
  constructor(...t4) {
    super(...t4), this.propertyType = o.PRIMITIVE_TARGET, this.attributes = [];
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.clearGraphChildList(this.attributes), t4.listSemantics().forEach((e4) => {
      this.setAttribute(e4, s4(t4.getAttribute(e4)));
    }), this;
  }
  getAttribute(t4) {
    const s4 = this.attributes.find((s5) => s5.semantic === t4);
    return s4 ? s4.getChild() : null;
  }
  setAttribute(t4, s4) {
    const e4 = this.getAttribute(t4);
    if (e4 && this.removeGraphChild(this.attributes, e4), !s4)
      return this;
    const i3 = this.graph.linkAttribute(t4, this, s4);
    return i3.semantic = t4, this.addGraphChild(this.attributes, i3);
  }
  listAttributes() {
    return this.attributes.map((t4) => t4.getChild());
  }
  listSemantics() {
    return this.attributes.map((t4) => t4.semantic);
  }
};
l([g], st.prototype, "attributes", void 0);
var et = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.SCENE, this.children = [];
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), s4 !== _ && (this.clearGraphChildList(this.children), t4.children.forEach((t5) => this.addChild(s4(t5.getChild())))), this;
  }
  addChild(t4) {
    t4.i && t4.i.removeChild(t4);
    const s4 = this.graph.link("child", this, t4);
    return this.addGraphChild(this.children, s4), t4.i = this, s4.onDispose(() => t4.i = null), this;
  }
  removeChild(t4) {
    return this.removeGraphChild(this.children, t4);
  }
  listChildren() {
    return this.children.map((t4) => t4.getChild());
  }
  traverse(t4) {
    for (const s4 of this.listChildren())
      s4.traverse(t4);
    return this;
  }
};
l([g], et.prototype, "children", void 0);
var it = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.SKIN, this.skeleton = null, this.inverseBindMatrices = null, this.joints = [];
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.setSkeleton(t4.skeleton ? s4(t4.skeleton.getChild()) : null), this.setInverseBindMatrices(t4.inverseBindMatrices ? s4(t4.inverseBindMatrices.getChild()) : null), this.clearGraphChildList(this.joints), t4.joints.forEach((t5) => this.addJoint(s4(t5.getChild()))), this;
  }
  getSkeleton() {
    return this.skeleton ? this.skeleton.getChild() : null;
  }
  setSkeleton(t4) {
    return this.skeleton = this.graph.link("skeleton", this, t4), this;
  }
  getInverseBindMatrices() {
    return this.inverseBindMatrices ? this.inverseBindMatrices.getChild() : null;
  }
  setInverseBindMatrices(t4) {
    return this.inverseBindMatrices = this.graph.link("inverseBindMatrices", this, t4), this;
  }
  addJoint(t4) {
    const s4 = this.graph.link("joint", this, t4);
    return this.addGraphChild(this.joints, s4);
  }
  removeJoint(t4) {
    return this.removeGraphChild(this.joints, t4);
  }
  listJoints() {
    return this.joints.map((t4) => t4.getChild());
  }
};
l([p], it.prototype, "skeleton", void 0), l([p], it.prototype, "inverseBindMatrices", void 0), l([g], it.prototype, "joints", void 0);
var rt = class extends B {
  constructor(...t4) {
    super(...t4), this.propertyType = o.TEXTURE, this.lt = null, this.ft = "", this.P = "";
  }
  copy(t4, s4 = _) {
    return super.copy(t4, s4), this.ft = t4.ft, this.P = t4.P, t4.lt && (this.lt = t4.lt.slice(0)), this;
  }
  getMimeType() {
    return this.ft || E.extensionToMimeType(A.extension(this.P));
  }
  setMimeType(t4) {
    return this.ft = t4, this;
  }
  getURI() {
    return this.P;
  }
  setURI(t4) {
    return this.P = t4, this.ft = E.extensionToMimeType(A.extension(t4)), this;
  }
  getImage() {
    return this.lt;
  }
  setImage(t4) {
    return this.lt = t4, this;
  }
  getSize() {
    return this.lt ? E.getSize(this.lt, this.getMimeType()) : null;
  }
};
var nt = class extends O {
  constructor(t4) {
    super(t4), this.propertyType = o.ROOT, this.dt = { generator: "glTF-Transform v1.0.0", version: "2.0" }, this.gt = new Set(), this.defaultScene = null, this.accessors = [], this.animations = [], this.buffers = [], this.cameras = [], this.materials = [], this.meshes = [], this.nodes = [], this.scenes = [], this.skins = [], this.textures = [], t4.on("clone", (t5) => this.wt(t5));
  }
  clone() {
    throw new Error("Root cannot be cloned.");
  }
  copy(t4, s4 = _) {
    if (super.copy(t4, s4), s4 === _)
      throw new Error("Root cannot be copied.");
    return Object.assign(this.dt, t4.dt), t4.accessors.forEach((t5) => this.vt(s4(t5.getChild()))), t4.animations.forEach((t5) => this.Tt(s4(t5.getChild()))), t4.buffers.forEach((t5) => this.yt(s4(t5.getChild()))), t4.cameras.forEach((t5) => this.At(s4(t5.getChild()))), t4.materials.forEach((t5) => this.xt(s4(t5.getChild()))), t4.meshes.forEach((t5) => this.Et(s4(t5.getChild()))), t4.nodes.forEach((t5) => this.Mt(s4(t5.getChild()))), t4.scenes.forEach((t5) => this.St(s4(t5.getChild()))), t4.skins.forEach((t5) => this.It(s4(t5.getChild()))), t4.textures.forEach((t5) => this.bt(s4(t5.getChild()))), this.setDefaultScene(t4.defaultScene ? s4(t4.defaultScene.getChild()) : null), this;
  }
  wt(t4) {
    return t4 instanceof et ? this.St(t4) : t4 instanceof X ? this.Mt(t4) : t4 instanceof j ? this.At(t4) : t4 instanceof it ? this.It(t4) : t4 instanceof Q ? this.Et(t4) : t4 instanceof K ? this.xt(t4) : t4 instanceof rt ? this.bt(t4) : t4 instanceof U ? this.Tt(t4) : t4 instanceof P ? this.vt(t4) : t4 instanceof G && this.yt(t4), this;
  }
  getAsset() {
    return this.dt;
  }
  listExtensionsUsed() {
    return Array.from(this.gt);
  }
  listExtensionsRequired() {
    return this.listExtensionsUsed().filter((t4) => t4.isRequired());
  }
  Rt(t4) {
    return this.gt.add(t4), this;
  }
  Nt(t4) {
    return this.gt.delete(t4), this;
  }
  St(t4) {
    return this.addGraphChild(this.scenes, this.graph.link("scene", this, t4));
  }
  listScenes() {
    return this.scenes.map((t4) => t4.getChild());
  }
  setDefaultScene(t4) {
    return this.defaultScene = this.graph.link("scene", this, t4), this;
  }
  getDefaultScene() {
    return this.defaultScene ? this.defaultScene.getChild() : null;
  }
  Mt(t4) {
    return this.addGraphChild(this.nodes, this.graph.link("node", this, t4));
  }
  listNodes() {
    return this.nodes.map((t4) => t4.getChild());
  }
  At(t4) {
    return this.addGraphChild(this.cameras, this.graph.link("camera", this, t4));
  }
  listCameras() {
    return this.cameras.map((t4) => t4.getChild());
  }
  It(t4) {
    return this.addGraphChild(this.skins, this.graph.link("skin", this, t4));
  }
  listSkins() {
    return this.skins.map((t4) => t4.getChild());
  }
  Et(t4) {
    return this.addGraphChild(this.meshes, this.graph.link("mesh", this, t4));
  }
  listMeshes() {
    return this.meshes.map((t4) => t4.getChild());
  }
  xt(t4) {
    return this.addGraphChild(this.materials, this.graph.link("material", this, t4));
  }
  listMaterials() {
    return this.materials.map((t4) => t4.getChild());
  }
  bt(t4) {
    return this.addGraphChild(this.textures, this.graph.link("texture", this, t4));
  }
  listTextures() {
    return this.textures.map((t4) => t4.getChild());
  }
  Tt(t4) {
    return this.addGraphChild(this.animations, this.graph.link("animation", this, t4));
  }
  listAnimations() {
    return this.animations.map((t4) => t4.getChild());
  }
  vt(t4) {
    return this.addGraphChild(this.accessors, this.graph.link("accessor", this, t4));
  }
  listAccessors() {
    return this.accessors.map((t4) => t4.getChild());
  }
  yt(t4) {
    return this.addGraphChild(this.buffers, this.graph.link("buffer", this, t4));
  }
  listBuffers() {
    return this.buffers.map((t4) => t4.getChild());
  }
};
l([p], nt.prototype, "defaultScene", void 0), l([g], nt.prototype, "accessors", void 0), l([g], nt.prototype, "animations", void 0), l([g], nt.prototype, "buffers", void 0), l([g], nt.prototype, "cameras", void 0), l([g], nt.prototype, "materials", void 0), l([g], nt.prototype, "meshes", void 0), l([g], nt.prototype, "nodes", void 0), l([g], nt.prototype, "scenes", void 0), l([g], nt.prototype, "skins", void 0), l([g], nt.prototype, "textures", void 0);
var ot = class {
  constructor(t4) {
    this.doc = void 0, this.extensionName = "", this.prereadTypes = [], this.prewriteTypes = [], this.readDependencies = [], this.writeDependencies = [], this.required = false, this.properties = new Set(), this.doc = t4, t4.getRoot().Rt(this);
  }
  dispose() {
    this.doc.getRoot().Nt(this);
    for (const t4 of this.properties)
      t4.dispose();
  }
  static register() {
  }
  isRequired() {
    return this.required;
  }
  setRequired(t4) {
    return this.required = t4, this;
  }
  addExtensionProperty(t4) {
    return this.properties.add(t4), this;
  }
  removeExtensionProperty(t4) {
    return this.properties.delete(t4), this;
  }
  install(t4, s4) {
    return this;
  }
  preread(t4, s4) {
    return this;
  }
  prewrite(t4, s4) {
    return this;
  }
};
ot.EXTENSION_NAME = void 0;
var lt = { logger: I.DEFAULT_INSTANCE, extensions: [], dependencies: {} };
var pt;
var gt;
!function(t4) {
  t4[t4.ARRAY_BUFFER = 34962] = "ARRAY_BUFFER", t4[t4.ELEMENT_ARRAY_BUFFER = 34963] = "ELEMENT_ARRAY_BUFFER";
}(pt || (pt = {})), function(t4) {
  t4.ARRAY_BUFFER = "ARRAY_BUFFER", t4.ELEMENT_ARRAY_BUFFER = "ELEMENT_ARRAY_BUFFER", t4.INVERSE_BIND_MATRICES = "INVERSE_BIND_MATRICES", t4.OTHER = "OTHER";
}(gt || (gt = {}));
var wt = class {
  constructor(t4, s4, e4) {
    this.Lt = void 0, this.jsonDoc = void 0, this.options = void 0, this.accessorIndexMap = new Map(), this.bufferIndexMap = new Map(), this.cameraIndexMap = new Map(), this.skinIndexMap = new Map(), this.materialIndexMap = new Map(), this.meshIndexMap = new Map(), this.nodeIndexMap = new Map(), this.imageIndexMap = new Map(), this.textureDefIndexMap = new Map(), this.textureInfoDefMap = new Map(), this.samplerDefIndexMap = new Map(), this.imageBufferViews = [], this.otherBufferViews = new Map(), this.otherBufferViewsIndexMap = new Map(), this.extensionData = {}, this.bufferURIGenerator = void 0, this.imageURIGenerator = void 0, this.logger = void 0, this.Bt = new Map(), this.accessorUsageGroupedByParent = new Set(["ARRAY_BUFFER"]), this.accessorParents = new Map(), this.Lt = t4, this.jsonDoc = s4, this.options = e4;
    const i3 = t4.getRoot(), r4 = i3.listBuffers().length, n4 = i3.listTextures().length;
    this.bufferURIGenerator = new vt(r4 > 1, e4.basename), this.imageURIGenerator = new vt(n4 > 1, e4.basename), this.logger = t4.getLogger();
  }
  createTextureInfoDef(t4, s4) {
    const e4 = { magFilter: s4.getMagFilter() || void 0, minFilter: s4.getMinFilter() || void 0, wrapS: s4.getWrapS(), wrapT: s4.getWrapT() }, i3 = JSON.stringify(e4);
    this.samplerDefIndexMap.has(i3) || (this.samplerDefIndexMap.set(i3, this.jsonDoc.json.samplers.length), this.jsonDoc.json.samplers.push(e4));
    const r4 = { source: this.imageIndexMap.get(t4), sampler: this.samplerDefIndexMap.get(i3) }, n4 = JSON.stringify(r4);
    this.textureDefIndexMap.has(n4) || (this.textureDefIndexMap.set(n4, this.jsonDoc.json.textures.length), this.jsonDoc.json.textures.push(r4));
    const h3 = { index: this.textureDefIndexMap.get(n4) };
    return s4.getTexCoord() !== 0 && (h3.texCoord = s4.getTexCoord()), this.textureInfoDefMap.set(s4, h3), h3;
  }
  createPropertyDef(t4) {
    const s4 = {};
    return t4.getName() && (s4.name = t4.getName()), Object.keys(t4.getExtras()).length > 0 && (s4.extras = t4.getExtras()), s4;
  }
  createAccessorDef(t4) {
    const s4 = this.createPropertyDef(t4);
    return s4.type = t4.getType(), s4.componentType = t4.getComponentType(), s4.count = t4.getCount(), this.Lt.getGraph().listParentLinks(t4).some((t5) => t5.getName() === "POSITION" || t5.getName() === "input") && (s4.max = t4.getMax([]).map(Math.fround), s4.min = t4.getMin([]).map(Math.fround)), t4.getNormalized() && (s4.normalized = t4.getNormalized()), s4;
  }
  createImageData(t4, s4, e4) {
    if (this.options.format === a.GLB)
      this.imageBufferViews.push(s4), t4.bufferView = this.jsonDoc.json.bufferViews.length, this.jsonDoc.json.bufferViews.push({ buffer: 0, byteOffset: -1, byteLength: s4.byteLength });
    else {
      const i3 = E.mimeTypeToExtension(e4.getMimeType());
      t4.uri = this.imageURIGenerator.createURI(e4, i3), this.jsonDoc.resources[t4.uri] = s4;
    }
  }
  getAccessorUsage(t4) {
    const s4 = this.Bt.get(t4);
    if (s4)
      return s4;
    for (const s5 of this.Lt.getGraph().listParentLinks(t4)) {
      if (s5.getName() === "inverseBindMatrices")
        return wt.BufferViewUsage.INVERSE_BIND_MATRICES;
      if (s5 instanceof J)
        return wt.BufferViewUsage.ARRAY_BUFFER;
      if (s5 instanceof z)
        return wt.BufferViewUsage.ELEMENT_ARRAY_BUFFER;
    }
    return wt.BufferViewUsage.OTHER;
  }
  addAccessorToUsageGroup(t4, s4) {
    const e4 = this.Bt.get(t4);
    if (e4 && e4 !== s4)
      throw new Error(`Accessor with usage "${e4}" cannot be reused as "${s4}".`);
    return this.Bt.set(t4, s4), this;
  }
  listAccessorUsageGroups() {
    const t4 = {};
    for (const [s4, e4] of Array.from(this.Bt.entries()))
      t4[e4] = t4[e4] || [], t4[e4].push(s4);
    return t4;
  }
};
wt.BufferViewTarget = pt, wt.BufferViewUsage = gt, wt.USAGE_TO_TARGET = { [gt.ARRAY_BUFFER]: pt.ARRAY_BUFFER, [gt.ELEMENT_ARRAY_BUFFER]: pt.ELEMENT_ARRAY_BUFFER };
var vt = class {
  constructor(t4, s4) {
    this.multiple = void 0, this.basename = void 0, this.counter = 1, this.multiple = t4, this.basename = s4;
  }
  createURI(t4, s4) {
    return t4.getURI() ? t4.getURI() : this.multiple ? `${this.basename}_${this.counter++}.${s4}` : `${this.basename}.${s4}`;
  }
};
var yt;
!function(t4) {
  t4[t4.JSON = 1313821514] = "JSON", t4[t4.BIN = 5130562] = "BIN";
}(yt || (yt = {}));

// ../../node_modules/ndarray-pixels/dist/ndarray-pixels-browser.modern.js
var import_ndarray = __toModule(require_ndarray());
var import_ndarray_ops = __toModule(require_ndarray_ops());
function a2(e4, t4, a5 = {}) {
  const i3 = document.createElement("canvas");
  i3.width = e4.shape[0], i3.height = e4.shape[1];
  const o5 = i3.getContext("2d"), h3 = o5.getImageData(0, 0, i3.width, i3.height);
  try {
    n(e4, h3.data);
  } catch (e5) {
    return s.from(Promise.reject(e5));
  }
  o5.putImageData(h3, 0, 0);
  const p3 = a5.quality ? a5.quality / 100 : void 0;
  switch (t4) {
    case "canvas":
      return i3;
    case "jpg":
    case "jpeg":
      return r(i3, "image/jpeg", p3);
    case "png":
      return r(i3, "image/png");
    default:
      throw new Error("[ndarray-pixels] Unsupported file type: " + t4);
  }
}
function r(e4, t4, a5) {
  const r4 = new Promise((r5, n4) => {
    e4.toBlob(async (e5) => {
      e5 ? r5(new Uint8Array(await e5.arrayBuffer())) : n4(new Error("[ndarray-pixels] Failed to canvas.toBlob()."));
    }, t4, a5);
  });
  return s.from(r4);
}
function n(a5, r4, s4 = -1) {
  if (a5.shape.length === 4)
    return n(a5.pick(s4), r4, 0);
  if (a5.shape.length === 3)
    if (a5.shape[2] === 3)
      import_ndarray_ops.default.assign((0, import_ndarray.default)(r4, [a5.shape[0], a5.shape[1], 3], [4, 4 * a5.shape[0], 1]), a5), import_ndarray_ops.default.assigns((0, import_ndarray.default)(r4, [a5.shape[0] * a5.shape[1]], [4], 3), 255);
    else if (a5.shape[2] === 4)
      import_ndarray_ops.default.assign((0, import_ndarray.default)(r4, [a5.shape[0], a5.shape[1], 4], [4, 4 * a5.shape[0], 1]), a5);
    else {
      if (a5.shape[2] !== 1)
        throw new Error("[ndarray-pixels] Incompatible array shape.");
      import_ndarray_ops.default.assign((0, import_ndarray.default)(r4, [a5.shape[0], a5.shape[1], 3], [4, 4 * a5.shape[0], 1]), (0, import_ndarray.default)(a5.data, [a5.shape[0], a5.shape[1], 3], [a5.stride[0], a5.stride[1], 0], a5.offset)), import_ndarray_ops.default.assigns((0, import_ndarray.default)(r4, [a5.shape[0] * a5.shape[1]], [4], 3), 255);
    }
  else {
    if (a5.shape.length !== 2)
      throw new Error("[ndarray-pixels] Incompatible array shape.");
    import_ndarray_ops.default.assign((0, import_ndarray.default)(r4, [a5.shape[0], a5.shape[1], 3], [4, 4 * a5.shape[0], 1]), (0, import_ndarray.default)(a5.data, [a5.shape[0], a5.shape[1], 3], [a5.stride[0], a5.stride[1], 0], a5.offset)), import_ndarray_ops.default.assigns((0, import_ndarray.default)(r4, [a5.shape[0] * a5.shape[1]], [4], 3), 255);
  }
  return r4;
}
var s = class {
  constructor(e4) {
    this._promise = void 0, this._promise = e4;
  }
  on(e4, t4) {
    return e4 === "data" ? this._promise.then(t4) : e4 === "error" ? this._promise.catch(t4) : e4 === "end" && this._promise.finally(t4), this;
  }
  static from(e4) {
    return new s(e4);
  }
};
async function i(t4, a5) {
  return t4 instanceof Uint8Array && typeof Buffer != "undefined" && (t4 = Buffer.from(t4)), new Promise((r4, n4) => {
    !function(t5, a6, r5) {
      if (r5 = r5 || a6, t5 instanceof Uint8Array) {
        if (typeof a6 != "string")
          throw new Error("[ndarray-pixels] Type must be given for Uint8Array image data");
        const e4 = new Blob([t5], { type: a6 });
        t5 = URL.createObjectURL(e4);
      }
      const n5 = new Image();
      n5.crossOrigin = "anonymous", n5.onload = function() {
        URL.revokeObjectURL(t5);
        const a7 = document.createElement("canvas");
        a7.width = n5.width, a7.height = n5.height;
        const s4 = a7.getContext("2d");
        s4.drawImage(n5, 0, 0);
        const i3 = s4.getImageData(0, 0, n5.width, n5.height);
        r5(null, (0, import_ndarray.default)(new Uint8Array(i3.data), [n5.width, n5.height, 4], [4, 4 * n5.width, 1], 0));
      }, n5.onerror = (e4) => {
        URL.revokeObjectURL(t5), r5(e4);
      }, n5.src = t5;
    }(t4, a5, (e4, t5) => {
      t5 && !e4 ? r4(t5) : n4(e4);
    });
  });
}
async function o2(e4, t4) {
  return new Promise((r4, n4) => {
    const s4 = [], i3 = t4.replace("image/", "");
    a2(e4, i3).on("data", (e5) => s4.push(e5)).on("end", () => r4(function(e5) {
      let t5 = 0;
      for (const a6 of e5)
        t5 += a6.byteLength;
      const a5 = new Uint8Array(t5);
      let r5 = 0;
      for (const t6 of e5)
        a5.set(t6, r5), r5 += t6.byteLength;
      return a5;
    }(s4))).on("error", (e5) => n4(e5));
  });
}

// ../../node_modules/ktx-parse/dist/ktx-parse.modern.js
var t2 = new Uint8Array([0]);
var e2 = [171, 75, 84, 88, 32, 50, 48, 187, 13, 10, 26, 10];
var n2;
var i2;
var s2;
var a3;
var r2;
var o3;
var l2;
var f2;
!function(t4) {
  t4[t4.NONE = 0] = "NONE", t4[t4.BASISLZ = 1] = "BASISLZ", t4[t4.ZSTD = 2] = "ZSTD", t4[t4.ZLIB = 3] = "ZLIB";
}(n2 || (n2 = {})), function(t4) {
  t4[t4.BASICFORMAT = 0] = "BASICFORMAT";
}(i2 || (i2 = {})), function(t4) {
  t4[t4.UNSPECIFIED = 0] = "UNSPECIFIED", t4[t4.ETC1S = 163] = "ETC1S", t4[t4.UASTC = 166] = "UASTC";
}(s2 || (s2 = {})), function(t4) {
  t4[t4.UNSPECIFIED = 0] = "UNSPECIFIED", t4[t4.SRGB = 1] = "SRGB";
}(a3 || (a3 = {})), function(t4) {
  t4[t4.UNSPECIFIED = 0] = "UNSPECIFIED", t4[t4.LINEAR = 1] = "LINEAR", t4[t4.SRGB = 2] = "SRGB", t4[t4.ITU = 3] = "ITU", t4[t4.NTSC = 4] = "NTSC", t4[t4.SLOG = 5] = "SLOG", t4[t4.SLOG2 = 6] = "SLOG2";
}(r2 || (r2 = {})), function(t4) {
  t4[t4.ALPHA_STRAIGHT = 0] = "ALPHA_STRAIGHT", t4[t4.ALPHA_PREMULTIPLIED = 1] = "ALPHA_PREMULTIPLIED";
}(o3 || (o3 = {})), function(t4) {
  t4[t4.RGB = 0] = "RGB", t4[t4.RRR = 3] = "RRR", t4[t4.GGG = 4] = "GGG", t4[t4.AAA = 15] = "AAA";
}(l2 || (l2 = {})), function(t4) {
  t4[t4.RGB = 0] = "RGB", t4[t4.RGBA = 3] = "RGBA", t4[t4.RRR = 4] = "RRR", t4[t4.RRRG = 5] = "RRRG";
}(f2 || (f2 = {}));
var U2 = class {
  constructor() {
    this.vkFormat = 0, this.typeSize = 1, this.pixelWidth = 0, this.pixelHeight = 0, this.pixelDepth = 0, this.layerCount = 0, this.faceCount = 1, this.supercompressionScheme = n2.NONE, this.levels = [], this.dataFormatDescriptor = [{ vendorId: 0, descriptorType: i2.BASICFORMAT, versionNumber: 2, descriptorBlockSize: 40, colorModel: s2.UNSPECIFIED, colorPrimaries: a3.SRGB, transferFunction: a3.SRGB, flags: o3.ALPHA_STRAIGHT, texelBlockDimension: { x: 4, y: 4, z: 1, w: 1 }, bytesPlane: [], samples: [] }], this.keyValue = {}, this.globalData = null;
  }
};
var c2 = class {
  constructor(t4, e4, n4, i3) {
    this._dataView = new DataView(t4.buffer, t4.byteOffset + e4, n4), this._littleEndian = i3, this._offset = 0;
  }
  _nextUint8() {
    const t4 = this._dataView.getUint8(this._offset);
    return this._offset += 1, t4;
  }
  _nextUint16() {
    const t4 = this._dataView.getUint16(this._offset, this._littleEndian);
    return this._offset += 2, t4;
  }
  _nextUint32() {
    const t4 = this._dataView.getUint32(this._offset, this._littleEndian);
    return this._offset += 4, t4;
  }
  _nextUint64() {
    const t4 = this._dataView.getUint32(this._offset, this._littleEndian) + 2 ** 32 * this._dataView.getUint32(this._offset + 4, this._littleEndian);
    return this._offset += 8, t4;
  }
  _skip(t4) {
    return this._offset += t4, this;
  }
  _scan(t4, e4 = 0) {
    const n4 = this._offset;
    let i3 = 0;
    for (; this._dataView.getUint8(this._offset) !== e4 && i3 < t4; )
      i3++, this._offset++;
    return i3 < t4 && this._offset++, new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + n4, i3);
  }
};
function _2(t4) {
  return typeof TextDecoder != "undefined" ? new TextDecoder().decode(t4) : Buffer.from(t4).toString("utf8");
}
function p2(t4) {
  const n4 = new Uint8Array(t4.buffer, t4.byteOffset, e2.length);
  if (n4[0] !== e2[0] || n4[1] !== e2[1] || n4[2] !== e2[2] || n4[3] !== e2[3] || n4[4] !== e2[4] || n4[5] !== e2[5] || n4[6] !== e2[6] || n4[7] !== e2[7] || n4[8] !== e2[8] || n4[9] !== e2[9] || n4[10] !== e2[10] || n4[11] !== e2[11])
    throw new Error("Missing KTX 2.0 identifier.");
  const i3 = new U2(), s4 = 17 * Uint32Array.BYTES_PER_ELEMENT, a5 = new c2(t4, e2.length, s4, true);
  i3.vkFormat = a5._nextUint32(), i3.typeSize = a5._nextUint32(), i3.pixelWidth = a5._nextUint32(), i3.pixelHeight = a5._nextUint32(), i3.pixelDepth = a5._nextUint32(), i3.layerCount = a5._nextUint32(), i3.faceCount = a5._nextUint32();
  const r4 = a5._nextUint32();
  i3.supercompressionScheme = a5._nextUint32();
  const o5 = a5._nextUint32(), l4 = a5._nextUint32(), f3 = a5._nextUint32(), h3 = a5._nextUint32(), g2 = a5._nextUint64(), p3 = a5._nextUint64(), x2 = new c2(t4, e2.length + s4, 3 * r4 * 8, true);
  for (let e4 = 0; e4 < r4; e4++)
    i3.levels.push({ levelData: new Uint8Array(t4.buffer, t4.byteOffset + x2._nextUint64(), x2._nextUint64()), uncompressedByteLength: x2._nextUint64() });
  const u2 = new c2(t4, o5, l4, true), y3 = { vendorId: u2._skip(4)._nextUint16(), descriptorType: u2._nextUint16(), versionNumber: u2._nextUint16(), descriptorBlockSize: u2._nextUint16(), colorModel: u2._nextUint8(), colorPrimaries: u2._nextUint8(), transferFunction: u2._nextUint8(), flags: u2._nextUint8(), texelBlockDimension: { x: u2._nextUint8() + 1, y: u2._nextUint8() + 1, z: u2._nextUint8() + 1, w: u2._nextUint8() + 1 }, bytesPlane: [u2._nextUint8(), u2._nextUint8(), u2._nextUint8(), u2._nextUint8(), u2._nextUint8(), u2._nextUint8(), u2._nextUint8(), u2._nextUint8()], samples: [] }, D4 = (y3.descriptorBlockSize / 4 - 6) / 4;
  for (let t5 = 0; t5 < D4; t5++)
    y3.samples[t5] = { bitOffset: u2._nextUint16(), bitLength: u2._nextUint8(), channelID: u2._nextUint8(), samplePosition: [u2._nextUint8(), u2._nextUint8(), u2._nextUint8(), u2._nextUint8()], sampleLower: u2._nextUint32(), sampleUpper: u2._nextUint32() };
  i3.dataFormatDescriptor.length = 0, i3.dataFormatDescriptor.push(y3);
  const b3 = new c2(t4, f3, h3, true);
  for (; b3._offset < h3; ) {
    const t5 = b3._nextUint32(), e4 = b3._scan(t5), n5 = _2(e4), s5 = b3._scan(t5 - e4.byteLength);
    i3.keyValue[n5] = n5.match(/^ktx/i) ? _2(s5) : s5, b3._offset % 4 && b3._skip(4 - b3._offset % 4);
  }
  if (p3 <= 0)
    return i3;
  const d = new c2(t4, g2, p3, true), B4 = d._nextUint16(), w3 = d._nextUint16(), A3 = d._nextUint32(), S3 = d._nextUint32(), m2 = d._nextUint32(), L4 = d._nextUint32(), I3 = [];
  for (let t5 = 0; t5 < r4; t5++)
    I3.push({ imageFlags: d._nextUint32(), rgbSliceByteOffset: d._nextUint32(), rgbSliceByteLength: d._nextUint32(), alphaSliceByteOffset: d._nextUint32(), alphaSliceByteLength: d._nextUint32() });
  const R3 = g2 + d._offset, E2 = R3 + A3, T2 = E2 + S3, O4 = T2 + m2, P3 = new Uint8Array(t4.buffer, t4.byteOffset + R3, A3), C3 = new Uint8Array(t4.buffer, t4.byteOffset + E2, S3), F4 = new Uint8Array(t4.buffer, t4.byteOffset + T2, m2), G4 = new Uint8Array(t4.buffer, t4.byteOffset + O4, L4);
  return i3.globalData = { endpointCount: B4, selectorCount: w3, imageDescs: I3, endpointsData: P3, selectorsData: C3, tablesData: F4, extendedData: G4 }, i3;
}

// ../../node_modules/@gltf-transform/extensions/dist/extensions.modern.js
function C2(e4, t4, s4, r4) {
  var o5, n4 = arguments.length, i3 = n4 < 3 ? t4 : r4 === null ? r4 = Object.getOwnPropertyDescriptor(t4, s4) : r4;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    i3 = Reflect.decorate(e4, t4, s4, r4);
  else
    for (var a5 = e4.length - 1; a5 >= 0; a5--)
      (o5 = e4[a5]) && (i3 = (n4 < 3 ? o5(i3) : n4 > 3 ? o5(t4, s4, i3) : o5(t4, s4)) || i3);
  return n4 > 3 && i3 && Object.defineProperty(t4, s4, i3), i3;
}
var I2 = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "InstancedMesh", this.parentTypes = [o.NODE], this.extensionName = "EXT_mesh_gpu_instancing", this.attributes = [];
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this.clearGraphChildList(this.attributes), e4.listSemantics().forEach((s4) => {
      this.setAttribute(s4, t4(e4.getAttribute(s4)));
    }), this;
  }
  getAttribute(e4) {
    const t4 = this.attributes.find((t5) => t5.semantic === e4);
    return t4 ? t4.getChild() : null;
  }
  setAttribute(e4, t4) {
    const s4 = this.getAttribute(e4);
    if (s4 && this.removeGraphChild(this.attributes, s4), !t4)
      return this;
    const r4 = this.graph.linkAttribute(e4.toLowerCase(), this, t4);
    return r4.semantic = e4, this.addGraphChild(this.attributes, r4);
  }
  listAttributes() {
    return this.attributes.map((e4) => e4.getChild());
  }
  listSemantics() {
    return this.attributes.map((e4) => e4.semantic);
  }
};
I2.EXTENSION_NAME = "EXT_mesh_gpu_instancing", C2([g], I2.prototype, "attributes", void 0);
var y2 = "EXT_mesh_gpu_instancing";
var N2 = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = y2, this.provideTypes = [o.NODE], this.prewriteTypes = [o.ACCESSOR];
  }
  createInstancedMesh() {
    return new I2(this.doc.getGraph(), this);
  }
  read(e4) {
    return (e4.jsonDoc.json.nodes || []).forEach((t4, s4) => {
      if (!t4.extensions || !t4.extensions[y2])
        return;
      const r4 = t4.extensions[y2], o5 = this.createInstancedMesh();
      for (const t5 in r4.attributes)
        o5.setAttribute(t5, e4.accessors[r4.attributes[t5]]);
      e4.nodes[s4].setExtension(y2, o5);
    }), this;
  }
  prewrite(e4) {
    e4.accessorUsageGroupedByParent.add("INSTANCE_ATTRIBUTE");
    for (const t4 of this.properties)
      for (const s4 of t4.listAttributes())
        e4.addAccessorToUsageGroup(s4, "INSTANCE_ATTRIBUTE");
    return this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    return this.doc.getRoot().listNodes().forEach((s4) => {
      const r4 = s4.getExtension(y2);
      if (r4) {
        const o5 = e4.nodeIndexMap.get(s4), n4 = t4.json.nodes[o5], i3 = { attributes: {} };
        r4.listSemantics().forEach((t5) => {
          const s5 = r4.getAttribute(t5);
          i3.attributes[t5] = e4.accessorIndexMap.get(s5);
        }), n4.extensions = n4.extensions || {}, n4.extensions[y2] = i3;
      }
    }), this;
  }
};
function R2() {
  return (R2 = Object.assign || function(e4) {
    for (var t4 = 1; t4 < arguments.length; t4++) {
      var s4 = arguments[t4];
      for (var r4 in s4)
        Object.prototype.hasOwnProperty.call(s4, r4) && (e4[r4] = s4[r4]);
    }
    return e4;
  }).apply(this, arguments);
}
var A2;
var S2;
var F2;
N2.EXTENSION_NAME = y2, function(e4) {
  e4.QUANTIZE = "quantize", e4.FILTER = "filter";
}(A2 || (A2 = {})), function(e4) {
  e4.ATTRIBUTES = "ATTRIBUTES", e4.TRIANGLES = "TRIANGLES", e4.INDICES = "INDICES";
}(S2 || (S2 = {})), function(e4) {
  e4.NONE = "NONE", e4.OCTAHEDRAL = "OCTAHEDRAL", e4.QUATERNION = "QUATERNION", e4.EXPONENTIAL = "EXPONENTIAL";
}(F2 || (F2 = {}));
var { BYTE: w2, SHORT: O2, FLOAT: M2 } = P.ComponentType;
var { normalize: b2, denormalize: D2 } = S;
function v2(e4, t4, s4, r4) {
  const { filter: o5, bits: i3 } = r4, a5 = { array: e4.getArray(), byteStride: e4.getElementSize() * e4.getComponentSize(), componentType: e4.getComponentType(), normalized: e4.getNormalized() };
  if (s4 !== S2.ATTRIBUTES)
    return a5;
  if (o5 !== F2.NONE) {
    let s5 = e4.getNormalized() ? function(e5) {
      const t5 = e5.getComponentType(), s6 = e5.getArray(), r5 = new Float32Array(s6.length);
      for (let e6 = 0; e6 < s6.length; e6++)
        r5[e6] = D2(s6[e6], t5);
      return r5;
    }(e4) : new Float32Array(a5.array);
    switch (o5) {
      case F2.EXPONENTIAL:
        a5.byteStride = 4 * e4.getElementSize(), a5.componentType = M2, a5.normalized = false, a5.array = t4.encodeFilterExp(s5, e4.getCount(), a5.byteStride, i3);
        break;
      case F2.OCTAHEDRAL:
        a5.byteStride = i3 > 8 ? 8 : 4, a5.componentType = i3 > 8 ? O2 : w2, a5.normalized = true, s5 = e4.getElementSize() === 3 ? function(e5) {
          const t5 = new Float32Array(4 * e5.length / 3);
          for (let s6 = 0, r5 = e5.length / 3; s6 < r5; s6++)
            t5[4 * s6] = e5[3 * s6], t5[4 * s6 + 1] = e5[3 * s6 + 1], t5[4 * s6 + 2] = e5[3 * s6 + 2];
          return t5;
        }(s5) : s5, a5.array = t4.encodeFilterOct(s5, e4.getCount(), a5.byteStride, i3);
        break;
      case F2.QUATERNION:
        a5.byteStride = 8, a5.componentType = O2, a5.normalized = true, a5.array = t4.encodeFilterQuat(s5, e4.getCount(), a5.byteStride, i3);
        break;
      default:
        throw new Error("Invalid filter.");
    }
    a5.min = e4.getMin([]), a5.max = e4.getMax([]), e4.getNormalized() && (a5.min = a5.min.map((t5) => D2(t5, e4.getComponentType())), a5.max = a5.max.map((t5) => D2(t5, e4.getComponentType()))), a5.normalized && (a5.min = a5.min.map((e5) => b2(e5, a5.componentType)), a5.max = a5.max.map((e5) => b2(e5, a5.componentType)));
  } else
    a5.byteStride % 4 && (a5.array = function(e5, t5) {
      const s5 = T.padNumber(e5.BYTES_PER_ELEMENT * t5) / e5.BYTES_PER_ELEMENT, r5 = new e5.constructor(e5.length / t5 * s5);
      for (let o6 = 0; o6 * t5 < e5.length; o6++)
        for (let n4 = 0; n4 < t5; n4++)
          r5[o6 * s5 + n4] = e5[o6 * t5 + n4];
      return r5;
    }(a5.array, e4.getElementSize()), a5.byteStride = a5.array.byteLength / e4.getCount());
  return a5;
}
function G2(e4, t4) {
  return t4 === wt.BufferViewUsage.ELEMENT_ARRAY_BUFFER ? e4.listParents().some((e5) => e5 instanceof tt && e5.getMode() === tt.Mode.TRIANGLES) ? S2.TRIANGLES : S2.INDICES : S2.ATTRIBUTES;
}
function j2(e4, t4) {
  const s4 = t4.getGraph().listParentLinks(e4).map((e5) => e5.getName()).filter((e5) => e5 !== "accessor");
  for (const t5 of s4) {
    if (t5 === "indices")
      return { filter: F2.NONE };
    if (t5 === "POSITION")
      return { filter: F2.NONE };
    if (t5 === "TEXCOORD_0")
      return { filter: F2.NONE };
    if (t5 === "NORMAL")
      return { filter: F2.OCTAHEDRAL, bits: 8 };
    if (t5 === "TANGENT")
      return { filter: F2.OCTAHEDRAL, bits: 8 };
    if (t5.startsWith("JOINTS_"))
      return { filter: F2.NONE };
    if (t5.startsWith("WEIGHTS_"))
      return { filter: F2.NONE };
    if (t5 === "output") {
      const t6 = B2(e4);
      return t6 === "rotation" ? { filter: F2.QUATERNION, bits: 16 } : t6 === "translation" || t6 === "scale" ? { filter: F2.EXPONENTIAL, bits: 12 } : { filter: F2.NONE };
    }
    if (t5 === "input")
      return { filter: F2.EXPONENTIAL, bits: 12 };
    if (t5 === "inverseBindMatrices")
      return { filter: F2.NONE };
  }
  return { filter: F2.NONE };
}
function B2(e4) {
  for (const t4 of e4.listParents())
    if (t4 instanceof F) {
      for (const e5 of t4.listParents())
        if (e5 instanceof k)
          return e5.getTargetPath();
    }
  return null;
}
var k2 = "EXT_meshopt_compression";
var L2 = { method: A2.QUANTIZE };
var U3 = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = k2, this.prereadTypes = [o.BUFFER, o.PRIMITIVE], this.prewriteTypes = [o.BUFFER, o.ACCESSOR], this.readDependencies = ["meshopt.decoder"], this.writeDependencies = ["meshopt.encoder"], this._decoder = null, this._decoderFallbackBufferMap = new Map(), this._encoder = null, this._encoderOptions = L2, this._encoderFallbackBuffer = null, this._encoderBufferViews = {}, this._encoderBufferViewData = {}, this._encoderBufferViewAccessors = {};
  }
  install(e4, t4) {
    return e4 === "meshopt.decoder" && (this._decoder = t4), e4 === "meshopt.encoder" && (this._encoder = t4), this;
  }
  setEncoderOptions(e4) {
    return this._encoderOptions = R2({}, L2, e4), this;
  }
  preread(e4, s4) {
    if (!this._decoder) {
      if (!this.isRequired())
        return this;
      throw new Error(`[${k2}] Please install extension dependency, "meshopt.decoder".`);
    }
    if (!this._decoder.supported) {
      if (!this.isRequired())
        return this;
      throw new Error(`[${k2}]: Missing WASM support.`);
    }
    return s4 === o.BUFFER ? this._prereadBuffers(e4) : s4 === o.PRIMITIVE && this._prereadPrimitives(e4), this;
  }
  _prereadBuffers(e4) {
    const t4 = e4.jsonDoc;
    (t4.json.bufferViews || []).forEach((s4, r4) => {
      if (!s4.extensions || !s4.extensions[k2])
        return;
      const o5 = s4.extensions[k2], n4 = o5.byteOffset || 0, i3 = o5.byteLength || 0, a5 = o5.count, c4 = o5.byteStride, u2 = new Uint8Array(new ArrayBuffer(a5 * c4)), h3 = t4.json.buffers[s4.buffer], l4 = new Uint8Array(h3.uri ? t4.resources[h3.uri] : t4.resources[h], n4, i3);
      this._decoder.decodeGltfBuffer(u2, a5, c4, l4, o5.mode, o5.filter), e4.bufferViews[r4] = u2;
    });
  }
  _prereadPrimitives(e4) {
    const t4 = e4.jsonDoc;
    (t4.json.bufferViews || []).forEach((s4) => {
      var r4;
      s4.extensions && s4.extensions[k2] && (r4 = t4.json.buffers[s4.buffer]).extensions && r4.extensions.EXT_meshopt_compression && r4.extensions.EXT_meshopt_compression.fallback && this._decoderFallbackBufferMap.set(e4.buffers[s4.buffer], e4.buffers[s4.extensions[k2].buffer]);
    });
  }
  read(e4) {
    if (!this.isRequired())
      return this;
    for (const [e5, t4] of this._decoderFallbackBufferMap) {
      for (const s4 of e5.listParents())
        s4 instanceof P && s4.swap(e5, t4);
      e5.dispose();
    }
    return this;
  }
  prewrite(e4, s4) {
    return s4 === o.ACCESSOR ? this._prewriteAccessors(e4) : s4 === o.BUFFER && this._prewriteBuffers(e4), this;
  }
  _prewriteAccessors(e4) {
    const t4 = e4.jsonDoc.json, s4 = this._encoder, r4 = this._encoderOptions, o5 = this.doc.createBuffer(), n4 = this.doc.getRoot().listBuffers().indexOf(o5);
    this._encoderFallbackBuffer = o5, this._encoderBufferViews = {}, this._encoderBufferViewData = {}, this._encoderBufferViewAccessors = {};
    for (const o6 of this.doc.getRoot().listAccessors()) {
      if (B2(o6) === "weights")
        continue;
      const a5 = e4.getAccessorUsage(o6), c4 = G2(o6, a5), u2 = r4.method === A2.FILTER ? j2(o6, this.doc) : { filter: F2.NONE }, h3 = v2(o6, s4, c4, u2), { array: l4, byteStride: p3 } = h3, f3 = o6.getBuffer();
      if (!f3)
        throw new Error(`${k2}: Missing buffer for accessor.`);
      const d = this.doc.getRoot().listBuffers().indexOf(f3), x2 = [a5, c4, u2, p3, d].join(":");
      let T2 = this._encoderBufferViews[x2], g2 = this._encoderBufferViewData[x2], m2 = this._encoderBufferViewAccessors[x2];
      T2 && g2 || (m2 = this._encoderBufferViewAccessors[x2] = [], g2 = this._encoderBufferViewData[x2] = [], T2 = this._encoderBufferViews[x2] = { buffer: n4, target: wt.USAGE_TO_TARGET[a5], byteOffset: 0, byteLength: 0, byteStride: a5 === wt.BufferViewUsage.ARRAY_BUFFER ? p3 : void 0, extensions: { [k2]: { buffer: d, byteOffset: 0, byteLength: 0, mode: c4, filter: u2.filter !== F2.NONE ? u2.filter : void 0, byteStride: p3, count: 0 } } });
      const _4 = e4.createAccessorDef(o6);
      _4.componentType = h3.componentType, _4.normalized = h3.normalized, _4.byteOffset = T2.byteLength, _4.min && h3.min && (_4.min = h3.min), _4.max && h3.max && (_4.max = h3.max), e4.accessorIndexMap.set(o6, t4.accessors.length), t4.accessors.push(_4), m2.push(_4), g2.push(l4.slice().buffer), T2.byteLength += l4.byteLength, T2.extensions.EXT_meshopt_compression.count += o6.getCount();
    }
  }
  _prewriteBuffers(e4) {
    const t4 = this._encoder;
    for (const s4 in this._encoderBufferViews) {
      const r4 = this._encoderBufferViews[s4], o5 = this._encoderBufferViewData[s4], i3 = this.doc.getRoot().listBuffers()[r4.extensions[k2].buffer], a5 = e4.otherBufferViews.get(i3) || [], { count: c4, byteStride: u2, mode: h3 } = r4.extensions[k2], l4 = new Uint8Array(T.concat(o5)), p3 = t4.encodeGltfBuffer(l4, c4, u2, h3), f3 = T.pad(p3.slice().buffer);
      r4.extensions[k2].byteLength = p3.byteLength, o5.length = 0, o5.push(f3), a5.push(f3), e4.otherBufferViews.set(i3, a5);
    }
  }
  write(e4) {
    let t4 = 0;
    for (const s5 in this._encoderBufferViews) {
      const r5 = this._encoderBufferViews[s5], o6 = e4.otherBufferViewsIndexMap.get(this._encoderBufferViewData[s5][0]), i3 = this._encoderBufferViewAccessors[s5];
      for (const e5 of i3)
        e5.bufferView = o6;
      const a5 = e4.jsonDoc.json.bufferViews[o6], c4 = a5.byteOffset || 0;
      Object.assign(a5, r5), a5.byteOffset = t4, a5.extensions[k2].byteOffset = c4, t4 += T.padNumber(r5.byteLength);
    }
    const s4 = this._encoderFallbackBuffer, r4 = e4.bufferIndexMap.get(s4), o5 = e4.jsonDoc.json.buffers[r4];
    return o5.byteLength = t4, o5.extensions = { [k2]: { fallback: true } }, s4.dispose(), this;
  }
};
U3.EXTENSION_NAME = k2, U3.EncoderMethod = A2;
var H2 = "EXT_texture_webp";
var V = class {
  getSize(e4) {
    const t4 = T.decodeText(e4.slice(0, 4)), s4 = T.decodeText(e4.slice(8, 12));
    if (t4 !== "RIFF" || s4 !== "WEBP")
      return null;
    const r4 = new DataView(e4);
    let o5 = 12;
    for (; o5 < e4.byteLength; ) {
      const t5 = T.decodeText(e4.slice(o5, o5 + 4)), s5 = r4.getUint32(o5 + 4, true);
      if (t5 === "VP8 ")
        return [16383 & r4.getInt16(o5 + 14, true), 16383 & r4.getInt16(o5 + 16, true)];
      if (t5 === "VP8L") {
        const e5 = r4.getUint8(o5 + 9), t6 = r4.getUint8(o5 + 10), s6 = r4.getUint8(o5 + 11);
        return [1 + ((63 & t6) << 8 | e5), 1 + ((15 & r4.getUint8(o5 + 12)) << 10 | s6 << 2 | (192 & t6) >> 6)];
      }
      o5 += 8 + s5 + s5 % 2;
    }
    return null;
  }
  getChannels(e4) {
    return 4;
  }
};
var P2 = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = H2, this.prereadTypes = [o.TEXTURE];
  }
  static register() {
    E.registerFormat("image/webp", new V());
  }
  preread(e4) {
    return (e4.jsonDoc.json.textures || []).forEach((e5) => {
      e5.extensions && e5.extensions[H2] && (e5.source = e5.extensions[H2].source);
    }), this;
  }
  read(e4) {
    return this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    return this.doc.getRoot().listTextures().forEach((s4) => {
      if (s4.getMimeType() === "image/webp") {
        const r4 = e4.imageIndexMap.get(s4);
        (t4.json.textures || []).forEach((e5) => {
          e5.source === r4 && (e5.extensions = e5.extensions || {}, e5.extensions[H2] = { source: e5.source }, delete e5.source);
        });
      }
    }), this;
  }
};
P2.EXTENSION_NAME = H2;
var X2 = "KHR_draco_mesh_compression";
var K2;
var z2;
var q2;
var $;
function Y2(e4, t4) {
  const s4 = new K2.DecoderBuffer();
  try {
    if (s4.Init(t4, t4.length), e4.GetEncodedGeometryType(s4) !== K2.TRIANGULAR_MESH)
      throw new Error(`[${X2}] Unknown geometry type.`);
    const r4 = new K2.Mesh();
    if (!e4.DecodeBufferToMesh(s4, r4).ok() || r4.ptr === 0)
      throw new Error(`[${X2}] Decoding failure.`);
    return r4;
  } finally {
    K2.destroy(s4);
  }
}
function Q2(e4, t4) {
  const s4 = 3 * t4.num_faces();
  let r4, o5;
  if (t4.num_points() <= 65534) {
    const n4 = s4 * Uint16Array.BYTES_PER_ELEMENT;
    r4 = K2._malloc(n4), e4.GetTrianglesUInt16Array(t4, n4, r4), o5 = new Uint16Array(K2.HEAPU16.buffer, r4, s4).slice();
  } else {
    const n4 = s4 * Uint32Array.BYTES_PER_ELEMENT;
    r4 = K2._malloc(n4), e4.GetTrianglesUInt32Array(t4, n4, r4), o5 = new Uint32Array(K2.HEAPU32.buffer, r4, s4).slice();
  }
  return K2._free(r4), o5;
}
function W2(e4, t4, s4, r4) {
  const o5 = q2[r4.componentType], n4 = z2[r4.componentType], i3 = s4.num_components(), a5 = t4.num_points() * i3, c4 = a5 * n4.BYTES_PER_ELEMENT, u2 = K2._malloc(c4);
  e4.GetAttributeDataArrayForAllPoints(t4, s4, o5, c4, u2);
  const h3 = new n4(K2.HEAPF32.buffer, u2, a5).slice();
  return K2._free(u2), h3;
}
var J2;
var Z2;
!function(e4) {
  e4[e4.EDGEBREAKER = 1] = "EDGEBREAKER", e4[e4.SEQUENTIAL = 0] = "SEQUENTIAL";
}(J2 || (J2 = {})), function(e4) {
  e4.POSITION = "POSITION", e4.NORMAL = "NORMAL", e4.COLOR = "COLOR", e4.TEX_COORD = "TEX_COORD", e4.GENERIC = "GENERIC";
}(Z2 || (Z2 = {}));
var ee = { [Z2.POSITION]: 14, [Z2.NORMAL]: 10, [Z2.COLOR]: 8, [Z2.TEX_COORD]: 12, [Z2.GENERIC]: 12 };
var te = { decodeSpeed: 5, encodeSpeed: 5, method: J2.EDGEBREAKER, quantizationBits: ee, quantizationVolume: "mesh" };
function se(e4, t4 = te) {
  const s4 = R2({}, te, t4);
  s4.quantizationBits = R2({}, ee, t4.quantizationBits);
  const r4 = new $.Encoder(), o5 = new $.MeshBuilder(), n4 = new $.Mesh(), i3 = {}, a5 = new $.DracoInt8Array();
  for (const t5 of e4.listSemantics()) {
    const a6 = e4.getAttribute(t5), c5 = re(t5), u3 = oe(o5, a6.getComponentType(), n4, $[c5], a6.getCount(), a6.getElementSize(), a6.getArray());
    if (u3 === -1)
      throw new Error(`Error compressing "${t5}" attribute.`);
    if (i3[t5] = u3, s4.quantizationVolume === "mesh" || t5 !== "POSITION")
      r4.SetAttributeQuantization($[c5], s4.quantizationBits[c5]);
    else {
      if (typeof s4.quantizationVolume != "object")
        throw new Error("Invalid quantization volume state.");
      {
        const { quantizationVolume: e5 } = s4, t6 = Math.max(e5.max[0] - e5.min[0], e5.max[1] - e5.min[1], e5.max[2] - e5.min[2]);
        r4.SetAttributeExplicitQuantization($[c5], s4.quantizationBits[c5], a6.getElementSize(), e5.min, t6);
      }
    }
  }
  const c4 = e4.getIndices();
  if (!c4)
    throw new Error("Primitive must have indices.");
  o5.AddFacesToMesh(n4, c4.getCount() / 3, c4.getArray()), r4.SetSpeedOptions(s4.encodeSpeed, s4.decodeSpeed), r4.SetTrackEncodedProperties(true), s4.method === J2.SEQUENTIAL || e4.listTargets().length > 0 ? r4.SetEncodingMethod($.MESH_SEQUENTIAL_ENCODING) : r4.SetEncodingMethod($.MESH_EDGEBREAKER_ENCODING);
  const u2 = r4.EncodeMeshToDracoBuffer(n4, a5);
  if (u2 <= 0)
    throw new Error("Error applying Draco compression.");
  const h3 = new Uint8Array(u2);
  for (let e5 = 0; e5 < u2; ++e5)
    h3[e5] = a5.GetValue(e5);
  const l4 = e4.getAttribute("POSITION").getCount(), p3 = r4.GetNumberOfEncodedPoints(), f3 = 3 * r4.GetNumberOfEncodedFaces();
  if (e4.listTargets().length > 0 && p3 !== l4)
    throw new Error('Compression reduced vertex count unexpectedly, corrupting morph targets. Applying the "weld" function before compression may resolve the issue.');
  return $.destroy(a5), $.destroy(n4), $.destroy(o5), $.destroy(r4), { numVertices: p3, numIndices: f3, data: h3, attributeIDs: i3 };
}
function re(e4) {
  return e4 === "POSITION" ? Z2.POSITION : e4 === "NORMAL" ? Z2.NORMAL : e4.startsWith("COLOR_") ? Z2.COLOR : e4.startsWith("TEXCOORD_") ? Z2.TEX_COORD : Z2.GENERIC;
}
function oe(e4, t4, s4, r4, o5, n4, i3) {
  switch (t4) {
    case P.ComponentType.UNSIGNED_BYTE:
      return e4.AddUInt8Attribute(s4, r4, o5, n4, i3);
    case P.ComponentType.BYTE:
      return e4.AddInt8Attribute(s4, r4, o5, n4, i3);
    case P.ComponentType.UNSIGNED_SHORT:
      return e4.AddUInt16Attribute(s4, r4, o5, n4, i3);
    case P.ComponentType.SHORT:
      return e4.AddInt16Attribute(s4, r4, o5, n4, i3);
    case P.ComponentType.UNSIGNED_INT:
      return e4.AddUInt32Attribute(s4, r4, o5, n4, i3);
    case P.ComponentType.FLOAT:
      return e4.AddFloatAttribute(s4, r4, o5, n4, i3);
    default:
      throw new Error(`Unexpected component type, "${t4}".`);
  }
}
var ne = "KHR_draco_mesh_compression";
var ie = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = ne, this.prereadTypes = [o.PRIMITIVE], this.prewriteTypes = [o.ACCESSOR], this.readDependencies = ["draco3d.decoder"], this.writeDependencies = ["draco3d.encoder"], this._decoderModule = null, this._encoderModule = null, this._encoderOptions = {};
  }
  install(e4, t4) {
    return e4 === "draco3d.decoder" && (this._decoderModule = t4, K2 = this._decoderModule, z2 = { [P.ComponentType.FLOAT]: Float32Array, [P.ComponentType.UNSIGNED_INT]: Uint32Array, [P.ComponentType.UNSIGNED_SHORT]: Uint16Array, [P.ComponentType.UNSIGNED_BYTE]: Uint8Array, [P.ComponentType.SHORT]: Int16Array, [P.ComponentType.BYTE]: Int8Array }, q2 = { [P.ComponentType.FLOAT]: K2.DT_FLOAT32, [P.ComponentType.UNSIGNED_INT]: K2.DT_UINT32, [P.ComponentType.UNSIGNED_SHORT]: K2.DT_UINT16, [P.ComponentType.UNSIGNED_BYTE]: K2.DT_UINT8, [P.ComponentType.SHORT]: K2.DT_INT16, [P.ComponentType.BYTE]: K2.DT_INT8 }), e4 === "draco3d.encoder" && (this._encoderModule = t4, $ = this._encoderModule), this;
  }
  setEncoderOptions(e4) {
    return this._encoderOptions = e4, this;
  }
  preread(e4) {
    if (!this._decoderModule)
      throw new Error(`[${ne}] Please install extension dependency, "draco3d.decoder".`);
    const t4 = this.doc.getLogger(), s4 = e4.jsonDoc, r4 = new Map();
    try {
      const o5 = s4.json.meshes || [];
      for (const n4 of o5)
        for (const o6 of n4.primitives) {
          if (!o6.extensions || !o6.extensions[ne])
            continue;
          const n5 = o6.extensions[ne];
          let [i3, a5] = r4.get(n5.bufferView) || [];
          if (!a5 || !i3) {
            const e5 = s4.json.bufferViews[n5.bufferView], o7 = s4.json.buffers[e5.buffer], c4 = new Int8Array(o7.uri ? s4.resources[o7.uri] : s4.resources[h], e5.byteOffset || 0, e5.byteLength);
            i3 = new this._decoderModule.Decoder(), a5 = Y2(i3, c4), r4.set(n5.bufferView, [i3, a5]), t4.debug(`[${ne}] Decompressed ${c4.byteLength} bytes.`);
          }
          for (const t5 in o6.attributes) {
            const s5 = e4.jsonDoc.json.accessors[o6.attributes[t5]], r5 = i3.GetAttributeByUniqueId(a5, n5.attributes[t5]), c4 = W2(i3, a5, r5, s5);
            e4.accessors[o6.attributes[t5]].setArray(c4);
          }
          o6.indices !== void 0 && e4.accessors[o6.indices].setArray(Q2(i3, a5));
        }
    } finally {
      for (const [e5, t5] of Array.from(r4.values()))
        this._decoderModule.destroy(e5), this._decoderModule.destroy(t5);
    }
    return this;
  }
  read(e4) {
    return this;
  }
  prewrite(e4, t4) {
    if (!this._encoderModule)
      throw new Error(`[${ne}] Please install extension dependency, "draco3d.encoder".`);
    const s4 = this.doc.getLogger();
    s4.debug(`[${ne}] Compression options: ${JSON.stringify(this._encoderOptions)}`);
    const r4 = function(e5) {
      const t5 = e5.getLogger(), s5 = new Set(), r5 = new Set();
      for (const o7 of e5.getRoot().listMeshes())
        for (const e6 of o7.listPrimitives())
          e6.getIndices() ? e6.getMode() !== tt.Mode.TRIANGLES ? (r5.add(e6), t5.warn(`[${ne}] Skipping Draco compression on non-TRIANGLES primitive.`)) : s5.add(e6) : (r5.add(e6), t5.warn(`[${ne}] Skipping Draco compression on non-indexed primitive.`));
      const o6 = e5.getRoot().listAccessors(), n5 = new Map();
      for (let e6 = 0; e6 < o6.length; e6++)
        n5.set(o6[e6], e6);
      const i3 = new Map(), c4 = new Set(), u2 = new Map();
      for (const t6 of Array.from(s5)) {
        let s6 = ae(t6, n5);
        if (c4.has(s6))
          u2.set(t6, s6);
        else {
          if (i3.has(t6.getIndices())) {
            const s7 = t6.getIndices(), r6 = s7.clone();
            n5.set(r6, e5.getRoot().listAccessors().length - 1), t6.swap(s7, r6);
          }
          for (const s7 of t6.listAttributes())
            if (i3.has(s7)) {
              const r6 = s7.clone();
              n5.set(r6, e5.getRoot().listAccessors().length - 1), t6.swap(s7, r6);
            }
          s6 = ae(t6, n5), c4.add(s6), u2.set(t6, s6), i3.set(t6.getIndices(), s6);
          for (const e6 of t6.listAttributes())
            i3.set(e6, s6);
        }
      }
      for (const e6 of Array.from(i3.keys())) {
        const t6 = new Set(e6.listParents().map((e7) => e7.propertyType));
        if (t6.size !== 2 || !t6.has("Primitive") || !t6.has("Root"))
          throw new Error(`[${ne}] Compressed accessors must only be used as indices or vertex attributes.`);
      }
      for (const e6 of Array.from(s5)) {
        const t6 = u2.get(e6), s6 = e6.getIndices();
        if (i3.get(s6) !== t6 || e6.listAttributes().some((e7) => i3.get(e7) !== t6))
          throw new Error(`[${ne}] Draco primitives must share all, or no, accessors.`);
      }
      for (const e6 of Array.from(r5)) {
        const t6 = e6.getIndices();
        if (i3.has(t6) || e6.listAttributes().some((e7) => i3.has(e7)))
          throw new Error(`[${ne}] Accessor cannot be shared by compressed and uncompressed primitives.`);
      }
      return u2;
    }(this.doc), o5 = new Map();
    let n4 = "mesh";
    this._encoderOptions.quantizationVolume === "scene" && (this.doc.getRoot().listScenes().length !== 1 ? s4.warn(`[${ne}]: quantizationVolume=scene requires exactly 1 scene.`) : n4 = w(this.doc.getRoot().listScenes().pop()));
    for (const t5 of Array.from(r4.keys())) {
      const s5 = r4.get(t5);
      if (!s5)
        throw new Error("Unexpected primitive.");
      if (o5.has(s5)) {
        o5.set(s5, o5.get(s5));
        continue;
      }
      const i3 = t5.getIndices(), a5 = e4.jsonDoc.json.accessors, c4 = se(t5, R2({}, this._encoderOptions, { quantizationVolume: n4 }));
      o5.set(s5, c4);
      const u2 = e4.createAccessorDef(i3);
      u2.count = c4.numIndices, e4.accessorIndexMap.set(i3, a5.length), a5.push(u2);
      for (const s6 of t5.listSemantics()) {
        const r5 = t5.getAttribute(s6), o6 = e4.createAccessorDef(r5);
        o6.count = c4.numVertices, e4.accessorIndexMap.set(r5, a5.length), a5.push(o6);
      }
      const h3 = t5.getAttribute("POSITION").getBuffer() || this.doc.getRoot().listBuffers()[0];
      e4.otherBufferViews.has(h3) || e4.otherBufferViews.set(h3, []), e4.otherBufferViews.get(h3).push(c4.data);
    }
    return s4.debug(`[${ne}] Compressed ${r4.size} primitives.`), e4.extensionData[ne] = { primitiveHashMap: r4, primitiveEncodingMap: o5 }, this;
  }
  write(e4) {
    const t4 = e4.extensionData[ne];
    for (const s4 of this.doc.getRoot().listMeshes()) {
      const r4 = e4.jsonDoc.json.meshes[e4.meshIndexMap.get(s4)];
      for (let o5 = 0; o5 < s4.listPrimitives().length; o5++) {
        const n4 = s4.listPrimitives()[o5], i3 = r4.primitives[o5], a5 = t4.primitiveHashMap.get(n4);
        if (!a5)
          continue;
        const c4 = t4.primitiveEncodingMap.get(a5);
        i3.extensions = i3.extensions || {}, i3.extensions[ne] = { bufferView: e4.otherBufferViewsIndexMap.get(c4.data), attributes: c4.attributeIDs };
      }
    }
    if (!t4.primitiveHashMap.size) {
      const t5 = e4.jsonDoc.json;
      t5.extensionsUsed = (t5.extensionsUsed || []).filter((e5) => e5 !== ne), t5.extensionsRequired = (t5.extensionsRequired || []).filter((e5) => e5 !== ne);
    }
    return this;
  }
};
function ae(e4, t4) {
  const s4 = [], r4 = e4.getIndices();
  s4.push(t4.get(r4));
  for (const r5 of e4.listAttributes())
    s4.push(t4.get(r5));
  return s4.sort().join("|");
}
ie.EXTENSION_NAME = ne, ie.EncoderMethod = J2;
var ce = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "Light", this.parentTypes = [o.NODE], this.extensionName = "KHR_lights_punctual", this._color = [1, 1, 1], this._intensity = 1, this._type = ce.Type.POINT, this._range = null, this._innerConeAngle = 0, this._outerConeAngle = Math.PI / 4;
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this._color = [...e4._color], this._intensity = e4._intensity, this._type = e4._type, this._range = e4._range, this._innerConeAngle = e4._innerConeAngle, this._outerConeAngle = e4._outerConeAngle, this;
  }
  getColor() {
    return this._color;
  }
  setColor(e4) {
    return this._color = e4, this;
  }
  getColorHex() {
    return y.factorToHex(this._color);
  }
  setColorHex(e4) {
    return y.hexToFactor(e4, this._color), this;
  }
  getIntensity() {
    return this._intensity;
  }
  setIntensity(e4) {
    return this._intensity = e4, this;
  }
  getType() {
    return this._type;
  }
  setType(e4) {
    return this._type = e4, this;
  }
  getRange() {
    return this._range;
  }
  setRange(e4) {
    return this._range = e4, this;
  }
  getInnerConeAngle() {
    return this._innerConeAngle;
  }
  setInnerConeAngle(e4) {
    return this._innerConeAngle = e4, this;
  }
  getOuterConeAngle() {
    return this._outerConeAngle;
  }
  setOuterConeAngle(e4) {
    return this._outerConeAngle = e4, this;
  }
};
ce.EXTENSION_NAME = "KHR_lights_punctual", ce.Type = { POINT: "point", SPOT: "spot", DIRECTIONAL: "directional" };
var ue = "KHR_lights_punctual";
var he = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = ue;
  }
  createLight() {
    return new ce(this.doc.getGraph(), this);
  }
  read(e4) {
    const t4 = e4.jsonDoc;
    if (!t4.json.extensions || !t4.json.extensions[ue])
      return this;
    const s4 = (t4.json.extensions[ue].lights || []).map((e5) => {
      const t5 = this.createLight().setName(e5.name || "").setType(e5.type);
      return e5.color !== void 0 && t5.setColor(e5.color), e5.intensity !== void 0 && t5.setIntensity(e5.intensity), e5.range !== void 0 && t5.setRange(e5.range), e5.innerConeAngle !== void 0 && t5.setInnerConeAngle(e5.innerConeAngle), e5.outerConeAngle !== void 0 && t5.setOuterConeAngle(e5.outerConeAngle), t5;
    });
    return t4.json.nodes.forEach((t5, r4) => {
      t5.extensions && t5.extensions[ue] && e4.nodes[r4].setExtension(ue, s4[t5.extensions[ue].light]);
    }), this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    if (this.properties.size === 0)
      return this;
    const s4 = [], r4 = new Map();
    for (const e5 of this.properties) {
      const t5 = e5, o5 = { type: t5.getType() };
      S.eq(t5.getColor(), [1, 1, 1]) || (o5.color = t5.getColor()), t5.getIntensity() !== 1 && (o5.intensity = t5.getIntensity()), t5.getRange() != null && (o5.range = t5.getRange()), t5.getName() && (o5.name = t5.getName()), t5.getType() === ce.Type.SPOT && (o5.innerConeAngle = t5.getInnerConeAngle(), o5.outerConeAngle = t5.getOuterConeAngle()), s4.push(o5), r4.set(t5, s4.length - 1);
    }
    return this.doc.getRoot().listNodes().forEach((s5) => {
      const o5 = s5.getExtension(ue);
      if (o5) {
        const n4 = e4.nodeIndexMap.get(s5), i3 = t4.json.nodes[n4];
        i3.extensions = i3.extensions || {}, i3.extensions[ue] = { light: r4.get(o5) };
      }
    }), t4.json.extensions = t4.json.extensions || {}, t4.json.extensions[ue] = { lights: s4 }, this;
  }
};
he.EXTENSION_NAME = ue;
var { R: le, G: pe, B: fe } = c;
var de = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "Clearcoat", this.parentTypes = [o.MATERIAL], this.extensionName = "KHR_materials_clearcoat", this._clearcoatFactor = 0, this._clearcoatRoughnessFactor = 0, this._clearcoatNormalScale = 1, this.clearcoatTexture = null, this.clearcoatTextureInfo = this.graph.link("clearcoatTextureInfo", this, new W(this.graph)), this.clearcoatRoughnessTexture = null, this.clearcoatRoughnessTextureInfo = this.graph.link("clearcoatRoughnessTextureInfo", this, new W(this.graph)), this.clearcoatNormalTexture = null, this.clearcoatNormalTextureInfo = this.graph.link("clearcoatNormalTextureInfo", this, new W(this.graph));
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this._clearcoatFactor = e4._clearcoatFactor, this._clearcoatRoughnessFactor = e4._clearcoatRoughnessFactor, this._clearcoatNormalScale = e4._clearcoatNormalScale, this.setClearcoatTexture(e4.clearcoatTexture ? t4(e4.clearcoatTexture.getChild()) : null), this.clearcoatTextureInfo.getChild().copy(t4(e4.clearcoatTextureInfo.getChild()), t4), this.setClearcoatRoughnessTexture(e4.clearcoatRoughnessTexture ? t4(e4.clearcoatRoughnessTexture.getChild()) : null), this.clearcoatRoughnessTextureInfo.getChild().copy(t4(e4.clearcoatRoughnessTextureInfo.getChild()), t4), this.setClearcoatNormalTexture(e4.clearcoatNormalTexture ? t4(e4.clearcoatNormalTexture.getChild()) : null), this.clearcoatNormalTextureInfo.getChild().copy(t4(e4.clearcoatNormalTextureInfo.getChild()), t4), this;
  }
  dispose() {
    this.clearcoatTextureInfo.getChild().dispose(), this.clearcoatRoughnessTextureInfo.getChild().dispose(), this.clearcoatNormalTextureInfo.getChild().dispose(), super.dispose();
  }
  getClearcoatFactor() {
    return this._clearcoatFactor;
  }
  setClearcoatFactor(e4) {
    return this._clearcoatFactor = e4, this;
  }
  getClearcoatTexture() {
    return this.clearcoatTexture ? this.clearcoatTexture.getChild() : null;
  }
  getClearcoatTextureInfo() {
    return this.clearcoatTexture ? this.clearcoatTextureInfo.getChild() : null;
  }
  setClearcoatTexture(e4) {
    return this.clearcoatTexture = this.graph.linkTexture("clearcoatTexture", le, this, e4), this;
  }
  getClearcoatRoughnessFactor() {
    return this._clearcoatRoughnessFactor;
  }
  setClearcoatRoughnessFactor(e4) {
    return this._clearcoatRoughnessFactor = e4, this;
  }
  getClearcoatRoughnessTexture() {
    return this.clearcoatRoughnessTexture ? this.clearcoatRoughnessTexture.getChild() : null;
  }
  getClearcoatRoughnessTextureInfo() {
    return this.clearcoatRoughnessTexture ? this.clearcoatRoughnessTextureInfo.getChild() : null;
  }
  setClearcoatRoughnessTexture(e4) {
    return this.clearcoatRoughnessTexture = this.graph.linkTexture("clearcoatRoughnessTexture", pe, this, e4), this;
  }
  getClearcoatNormalScale() {
    return this._clearcoatNormalScale;
  }
  setClearcoatNormalScale(e4) {
    return this._clearcoatNormalScale = e4, this;
  }
  getClearcoatNormalTexture() {
    return this.clearcoatNormalTexture ? this.clearcoatNormalTexture.getChild() : null;
  }
  getClearcoatNormalTextureInfo() {
    return this.clearcoatNormalTexture ? this.clearcoatNormalTextureInfo.getChild() : null;
  }
  setClearcoatNormalTexture(e4) {
    return this.clearcoatNormalTexture = this.graph.linkTexture("clearcoatNormalTexture", le | pe | fe, this, e4), this;
  }
};
de.EXTENSION_NAME = "KHR_materials_clearcoat", C2([p], de.prototype, "clearcoatTexture", void 0), C2([p], de.prototype, "clearcoatTextureInfo", void 0), C2([p], de.prototype, "clearcoatRoughnessTexture", void 0), C2([p], de.prototype, "clearcoatRoughnessTextureInfo", void 0), C2([p], de.prototype, "clearcoatNormalTexture", void 0), C2([p], de.prototype, "clearcoatNormalTextureInfo", void 0);
var xe = "KHR_materials_clearcoat";
var Te = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = xe;
  }
  createClearcoat() {
    return new de(this.doc.getGraph(), this);
  }
  read(e4) {
    const t4 = e4.jsonDoc, s4 = t4.json.textures || [];
    return (t4.json.materials || []).forEach((t5, r4) => {
      if (t5.extensions && t5.extensions[xe]) {
        const o5 = this.createClearcoat();
        e4.materials[r4].setExtension(xe, o5);
        const n4 = t5.extensions[xe];
        if (n4.clearcoatFactor !== void 0 && o5.setClearcoatFactor(n4.clearcoatFactor), n4.clearcoatRoughnessFactor !== void 0 && o5.setClearcoatRoughnessFactor(n4.clearcoatRoughnessFactor), n4.clearcoatTexture !== void 0) {
          const t6 = n4.clearcoatTexture;
          o5.setClearcoatTexture(e4.textures[s4[t6.index].source]), e4.setTextureInfo(o5.getClearcoatTextureInfo(), t6);
        }
        if (n4.clearcoatRoughnessTexture !== void 0) {
          const t6 = n4.clearcoatRoughnessTexture;
          o5.setClearcoatRoughnessTexture(e4.textures[s4[t6.index].source]), e4.setTextureInfo(o5.getClearcoatRoughnessTextureInfo(), t6);
        }
        if (n4.clearcoatNormalTexture !== void 0) {
          const t6 = n4.clearcoatNormalTexture;
          o5.setClearcoatNormalTexture(e4.textures[s4[t6.index].source]), e4.setTextureInfo(o5.getClearcoatNormalTextureInfo(), t6), t6.scale !== void 0 && o5.setClearcoatNormalScale(t6.scale);
        }
      }
    }), this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    return this.doc.getRoot().listMaterials().forEach((s4) => {
      const r4 = s4.getExtension(xe);
      if (r4) {
        const o5 = e4.materialIndexMap.get(s4), n4 = t4.json.materials[o5];
        n4.extensions = n4.extensions || {};
        const i3 = n4.extensions[xe] = { clearcoatFactor: r4.getClearcoatFactor(), clearcoatRoughnessFactor: r4.getClearcoatRoughnessFactor() };
        if (r4.getClearcoatTexture()) {
          const t5 = r4.getClearcoatTexture(), s5 = r4.getClearcoatTextureInfo();
          i3.clearcoatTexture = e4.createTextureInfoDef(t5, s5);
        }
        if (r4.getClearcoatRoughnessTexture()) {
          const t5 = r4.getClearcoatRoughnessTexture(), s5 = r4.getClearcoatRoughnessTextureInfo();
          i3.clearcoatRoughnessTexture = e4.createTextureInfoDef(t5, s5);
        }
        if (r4.getClearcoatNormalTexture()) {
          const t5 = r4.getClearcoatNormalTexture(), s5 = r4.getClearcoatNormalTextureInfo();
          i3.clearcoatNormalTexture = e4.createTextureInfoDef(t5, s5), r4.getClearcoatNormalScale() !== 1 && (i3.clearcoatNormalTexture.scale = r4.getClearcoatNormalScale());
        }
      }
    }), this;
  }
};
Te.EXTENSION_NAME = xe;
var ge = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "IOR", this.parentTypes = [o.MATERIAL], this.extensionName = "KHR_materials_ior", this._ior = 0;
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this._ior = e4._ior, this;
  }
  getIOR() {
    return this._ior;
  }
  setIOR(e4) {
    return this._ior = e4, this;
  }
};
ge.EXTENSION_NAME = "KHR_materials_ior";
var me = "KHR_materials_ior";
var _e = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = me;
  }
  createIOR() {
    return new ge(this.doc.getGraph(), this);
  }
  read(e4) {
    return (e4.jsonDoc.json.materials || []).forEach((t4, s4) => {
      if (t4.extensions && t4.extensions[me]) {
        const r4 = this.createIOR();
        e4.materials[s4].setExtension(me, r4);
        const o5 = t4.extensions[me];
        o5.ior !== void 0 && r4.setIOR(o5.ior);
      }
    }), this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    return this.doc.getRoot().listMaterials().forEach((s4) => {
      const r4 = s4.getExtension(me);
      if (r4) {
        const o5 = e4.materialIndexMap.get(s4), n4 = t4.json.materials[o5];
        n4.extensions = n4.extensions || {}, n4.extensions[me] = { ior: r4.getIOR() };
      }
    }), this;
  }
};
_e.EXTENSION_NAME = me;
var { R: Ee, G: Ce, B: Ie, A: ye } = c;
var Ne = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "PBRSpecularGlossiness", this.parentTypes = [o.MATERIAL], this.extensionName = "KHR_materials_pbrSpecularGlossiness", this._diffuseFactor = [1, 1, 1, 1], this._specularFactor = [1, 1, 1], this._glossinessFactor = 1, this.diffuseTexture = null, this.diffuseTextureInfo = this.graph.link("diffuseTextureInfo", this, new W(this.graph)), this.specularGlossinessTexture = null, this.specularGlossinessTextureInfo = this.graph.link("specularGlossinessTextureInfo", this, new W(this.graph));
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this._diffuseFactor = e4._diffuseFactor, this._specularFactor = e4._specularFactor, this._glossinessFactor = e4._glossinessFactor, this.setDiffuseTexture(e4.diffuseTexture ? t4(e4.diffuseTexture.getChild()) : null), this.diffuseTextureInfo.getChild().copy(t4(e4.diffuseTextureInfo.getChild()), t4), this.setSpecularGlossinessTexture(e4.specularGlossinessTexture ? t4(e4.specularGlossinessTexture.getChild()) : null), this.specularGlossinessTextureInfo.getChild().copy(t4(e4.specularGlossinessTextureInfo.getChild()), t4), this;
  }
  dispose() {
    this.diffuseTextureInfo.getChild().dispose(), this.specularGlossinessTextureInfo.getChild().dispose(), super.dispose();
  }
  getDiffuseFactor() {
    return this._diffuseFactor;
  }
  setDiffuseFactor(e4) {
    return this._diffuseFactor = e4, this;
  }
  getDiffuseHex() {
    return y.factorToHex(this._diffuseFactor);
  }
  setDiffuseHex(e4) {
    return y.hexToFactor(e4, this._diffuseFactor), this;
  }
  getDiffuseTexture() {
    return this.diffuseTexture ? this.diffuseTexture.getChild() : null;
  }
  getDiffuseTextureInfo() {
    return this.diffuseTexture ? this.diffuseTextureInfo.getChild() : null;
  }
  setDiffuseTexture(e4) {
    return this.diffuseTexture = this.graph.linkTexture("diffuseTexture", Ee | Ce | Ie | ye, this, e4), this;
  }
  getSpecularFactor() {
    return this._specularFactor;
  }
  setSpecularFactor(e4) {
    return this._specularFactor = e4, this;
  }
  getGlossinessFactor() {
    return this._glossinessFactor;
  }
  setGlossinessFactor(e4) {
    return this._glossinessFactor = e4, this;
  }
  getSpecularGlossinessTexture() {
    return this.specularGlossinessTexture ? this.specularGlossinessTexture.getChild() : null;
  }
  getSpecularGlossinessTextureInfo() {
    return this.specularGlossinessTexture ? this.specularGlossinessTextureInfo.getChild() : null;
  }
  setSpecularGlossinessTexture(e4) {
    return this.specularGlossinessTexture = this.graph.linkTexture("specularGlossinessTexture", Ee | Ce | Ie | ye, this, e4), this;
  }
};
Ne.EXTENSION_NAME = "KHR_materials_pbrSpecularGlossiness", C2([p], Ne.prototype, "diffuseTexture", void 0), C2([p], Ne.prototype, "diffuseTextureInfo", void 0), C2([p], Ne.prototype, "specularGlossinessTexture", void 0), C2([p], Ne.prototype, "specularGlossinessTextureInfo", void 0);
var Re = "KHR_materials_pbrSpecularGlossiness";
var Ae = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = Re;
  }
  createPBRSpecularGlossiness() {
    return new Ne(this.doc.getGraph(), this);
  }
  read(e4) {
    const t4 = e4.jsonDoc, s4 = t4.json.textures || [];
    return (t4.json.materials || []).forEach((t5, r4) => {
      if (t5.extensions && t5.extensions[Re]) {
        const o5 = this.createPBRSpecularGlossiness();
        e4.materials[r4].setExtension(Re, o5);
        const n4 = t5.extensions[Re];
        if (n4.diffuseFactor !== void 0 && o5.setDiffuseFactor(n4.diffuseFactor), n4.specularFactor !== void 0 && o5.setSpecularFactor(n4.specularFactor), n4.glossinessFactor !== void 0 && o5.setGlossinessFactor(n4.glossinessFactor), n4.diffuseTexture !== void 0) {
          const t6 = n4.diffuseTexture;
          o5.setDiffuseTexture(e4.textures[s4[t6.index].source]), e4.setTextureInfo(o5.getDiffuseTextureInfo(), t6);
        }
        if (n4.specularGlossinessTexture !== void 0) {
          const t6 = n4.specularGlossinessTexture;
          o5.setSpecularGlossinessTexture(e4.textures[s4[t6.index].source]), e4.setTextureInfo(o5.getSpecularGlossinessTextureInfo(), t6);
        }
      }
    }), this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    return this.doc.getRoot().listMaterials().forEach((s4) => {
      const r4 = s4.getExtension(Re);
      if (r4) {
        const o5 = e4.materialIndexMap.get(s4), n4 = t4.json.materials[o5];
        n4.extensions = n4.extensions || {};
        const i3 = n4.extensions[Re] = { diffuseFactor: r4.getDiffuseFactor(), specularFactor: r4.getSpecularFactor(), glossinessFactor: r4.getGlossinessFactor() };
        if (r4.getDiffuseTexture()) {
          const t5 = r4.getDiffuseTexture(), s5 = r4.getDiffuseTextureInfo();
          i3.diffuseTexture = e4.createTextureInfoDef(t5, s5);
        }
        if (r4.getSpecularGlossinessTexture()) {
          const t5 = r4.getSpecularGlossinessTexture(), s5 = r4.getSpecularGlossinessTextureInfo();
          i3.specularGlossinessTexture = e4.createTextureInfoDef(t5, s5);
        }
      }
    }), this;
  }
};
Ae.EXTENSION_NAME = Re;
var { R: Se, G: Fe, B: we, A: Oe } = c;
var Me = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "Sheen", this.parentTypes = [o.MATERIAL], this.extensionName = "KHR_materials_sheen", this._sheenColorFactor = [0, 0, 0], this._sheenRoughnessFactor = 0, this.sheenColorTexture = null, this.sheenColorTextureInfo = this.graph.link("sheenColorTextureInfo", this, new W(this.graph)), this.sheenRoughnessTexture = null, this.sheenRoughnessTextureInfo = this.graph.link("sheenRoughnessTextureInfo", this, new W(this.graph));
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this._sheenColorFactor = e4._sheenColorFactor, this._sheenRoughnessFactor = e4._sheenRoughnessFactor, this.setSheenColorTexture(e4.sheenColorTexture ? t4(e4.sheenColorTexture.getChild()) : null), this.sheenColorTextureInfo.getChild().copy(t4(e4.sheenColorTextureInfo.getChild()), t4), this.setSheenRoughnessTexture(e4.sheenRoughnessTexture ? t4(e4.sheenRoughnessTexture.getChild()) : null), this.sheenRoughnessTextureInfo.getChild().copy(t4(e4.sheenRoughnessTextureInfo.getChild()), t4), this;
  }
  dispose() {
    this.sheenColorTextureInfo.getChild().dispose(), this.sheenRoughnessTextureInfo.getChild().dispose(), super.dispose();
  }
  getSheenColorFactor() {
    return this._sheenColorFactor;
  }
  getSheenColorHex() {
    return y.factorToHex(this._sheenColorFactor);
  }
  setSheenColorFactor(e4) {
    return this._sheenColorFactor = e4, this;
  }
  setSheenColorHex(e4) {
    return y.hexToFactor(e4, this._sheenColorFactor), this;
  }
  getSheenColorTexture() {
    return this.sheenColorTexture ? this.sheenColorTexture.getChild() : null;
  }
  getSheenColorTextureInfo() {
    return this.sheenColorTexture ? this.sheenColorTextureInfo.getChild() : null;
  }
  setSheenColorTexture(e4) {
    return this.sheenColorTexture = this.graph.linkTexture("sheenColorTexture", Se | Fe | we, this, e4), this;
  }
  getSheenRoughnessFactor() {
    return this._sheenRoughnessFactor;
  }
  setSheenRoughnessFactor(e4) {
    return this._sheenRoughnessFactor = e4, this;
  }
  getSheenRoughnessTexture() {
    return this.sheenRoughnessTexture ? this.sheenRoughnessTexture.getChild() : null;
  }
  getSheenRoughnessTextureInfo() {
    return this.sheenRoughnessTexture ? this.sheenRoughnessTextureInfo.getChild() : null;
  }
  setSheenRoughnessTexture(e4) {
    return this.sheenRoughnessTexture = this.graph.linkTexture("sheenRoughnessTexture", Oe, this, e4), this;
  }
};
Me.EXTENSION_NAME = "KHR_materials_sheen", C2([p], Me.prototype, "sheenColorTexture", void 0), C2([p], Me.prototype, "sheenColorTextureInfo", void 0), C2([p], Me.prototype, "sheenRoughnessTexture", void 0), C2([p], Me.prototype, "sheenRoughnessTextureInfo", void 0);
var be = "KHR_materials_sheen";
var De = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = be;
  }
  createSheen() {
    return new Me(this.doc.getGraph(), this);
  }
  read(e4) {
    const t4 = e4.jsonDoc, s4 = t4.json.textures || [];
    return (t4.json.materials || []).forEach((t5, r4) => {
      if (t5.extensions && t5.extensions[be]) {
        const o5 = this.createSheen();
        e4.materials[r4].setExtension(be, o5);
        const n4 = t5.extensions[be];
        if (n4.sheenColorFactor !== void 0 && o5.setSheenColorFactor(n4.sheenColorFactor), n4.sheenRoughnessFactor !== void 0 && o5.setSheenRoughnessFactor(n4.sheenRoughnessFactor), n4.sheenColorTexture !== void 0) {
          const t6 = n4.sheenColorTexture;
          o5.setSheenColorTexture(e4.textures[s4[t6.index].source]), e4.setTextureInfo(o5.getSheenColorTextureInfo(), t6);
        }
        if (n4.sheenRoughnessTexture !== void 0) {
          const t6 = n4.sheenRoughnessTexture;
          o5.setSheenRoughnessTexture(e4.textures[s4[t6.index].source]), e4.setTextureInfo(o5.getSheenRoughnessTextureInfo(), t6);
        }
      }
    }), this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    return this.doc.getRoot().listMaterials().forEach((s4) => {
      const r4 = s4.getExtension(be);
      if (r4) {
        const o5 = e4.materialIndexMap.get(s4), n4 = t4.json.materials[o5];
        n4.extensions = n4.extensions || {};
        const i3 = n4.extensions[be] = { sheenColorFactor: r4.getSheenColorFactor(), sheenRoughnessFactor: r4.getSheenRoughnessFactor() };
        if (r4.getSheenColorTexture()) {
          const t5 = r4.getSheenColorTexture(), s5 = r4.getSheenColorTextureInfo();
          i3.sheenColorTexture = e4.createTextureInfoDef(t5, s5);
        }
        if (r4.getSheenRoughnessTexture()) {
          const t5 = r4.getSheenRoughnessTexture(), s5 = r4.getSheenRoughnessTextureInfo();
          i3.sheenRoughnessTexture = e4.createTextureInfoDef(t5, s5);
        }
      }
    }), this;
  }
};
De.EXTENSION_NAME = be;
var { R: ve, G: Ge, B: je, A: Be } = c;
var ke = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "Specular", this.parentTypes = [o.MATERIAL], this.extensionName = "KHR_materials_specular", this._specularFactor = 1, this._specularColorFactor = [1, 1, 1], this.specularTexture = null, this.specularTextureInfo = this.graph.link("specularTextureInfo", this, new W(this.graph)), this.specularColorTexture = null, this.specularColorTextureInfo = this.graph.link("specularColorTextureInfo", this, new W(this.graph));
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this._specularFactor = e4._specularFactor, this._specularColorFactor = e4._specularColorFactor, this.setSpecularTexture(e4.specularTexture ? t4(e4.specularTexture.getChild()) : null), this.specularTextureInfo.getChild().copy(t4(e4.specularTextureInfo.getChild()), t4), this.setSpecularColorTexture(e4.specularColorTexture ? t4(e4.specularColorTexture.getChild()) : null), this.specularColorTextureInfo.getChild().copy(t4(e4.specularColorTextureInfo.getChild()), t4), this;
  }
  dispose() {
    this.specularTextureInfo.getChild().dispose(), super.dispose();
  }
  getSpecularFactor() {
    return this._specularFactor;
  }
  setSpecularFactor(e4) {
    return this._specularFactor = e4, this;
  }
  getSpecularColorFactor() {
    return this._specularColorFactor;
  }
  setSpecularColorFactor(e4) {
    return this._specularColorFactor = e4, this;
  }
  getSpecularColorHex() {
    return y.factorToHex(this._specularColorFactor);
  }
  setSpecularColorHex(e4) {
    return y.hexToFactor(e4, this._specularColorFactor), this;
  }
  getSpecularTexture() {
    return this.specularTexture ? this.specularTexture.getChild() : null;
  }
  getSpecularTextureInfo() {
    return this.specularTexture ? this.specularTextureInfo.getChild() : null;
  }
  setSpecularTexture(e4) {
    return this.specularTexture = this.graph.linkTexture("specularTexture", Be, this, e4), this;
  }
  getSpecularColorTexture() {
    return this.specularColorTexture ? this.specularColorTexture.getChild() : null;
  }
  getSpecularColorTextureInfo() {
    return this.specularColorTexture ? this.specularColorTextureInfo.getChild() : null;
  }
  setSpecularColorTexture(e4) {
    return this.specularColorTexture = this.graph.linkTexture("specularColorTexture", ve | Ge | je, this, e4), this;
  }
};
ke.EXTENSION_NAME = "KHR_materials_specular", C2([p], ke.prototype, "specularTexture", void 0), C2([p], ke.prototype, "specularTextureInfo", void 0), C2([p], ke.prototype, "specularColorTexture", void 0), C2([p], ke.prototype, "specularColorTextureInfo", void 0);
var Le = "KHR_materials_specular";
var Ue = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = Le;
  }
  createSpecular() {
    return new ke(this.doc.getGraph(), this);
  }
  read(e4) {
    const t4 = e4.jsonDoc, s4 = t4.json.textures || [];
    return (t4.json.materials || []).forEach((t5, r4) => {
      if (t5.extensions && t5.extensions[Le]) {
        const o5 = this.createSpecular();
        e4.materials[r4].setExtension(Le, o5);
        const n4 = t5.extensions[Le];
        if (n4.specularFactor !== void 0 && o5.setSpecularFactor(n4.specularFactor), n4.specularColorFactor !== void 0 && o5.setSpecularColorFactor(n4.specularColorFactor), n4.specularTexture !== void 0) {
          const t6 = n4.specularTexture;
          o5.setSpecularTexture(e4.textures[s4[t6.index].source]), e4.setTextureInfo(o5.getSpecularTextureInfo(), t6);
        }
        if (n4.specularColorTexture !== void 0) {
          const t6 = n4.specularColorTexture;
          o5.setSpecularColorTexture(e4.textures[s4[t6.index].source]), e4.setTextureInfo(o5.getSpecularColorTextureInfo(), t6);
        }
      }
    }), this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    return this.doc.getRoot().listMaterials().forEach((s4) => {
      const r4 = s4.getExtension(Le);
      if (r4) {
        const o5 = e4.materialIndexMap.get(s4), n4 = t4.json.materials[o5];
        n4.extensions = n4.extensions || {};
        const i3 = n4.extensions[Le] = {};
        if (r4.getSpecularFactor() !== 1 && (i3.specularFactor = r4.getSpecularFactor()), S.eq(r4.getSpecularColorFactor(), [1, 1, 1]) || (i3.specularColorFactor = r4.getSpecularColorFactor()), r4.getSpecularTexture()) {
          const t5 = r4.getSpecularTexture(), s5 = r4.getSpecularTextureInfo();
          i3.specularTexture = e4.createTextureInfoDef(t5, s5);
        }
        if (r4.getSpecularColorTexture()) {
          const t5 = r4.getSpecularColorTexture(), s5 = r4.getSpecularColorTextureInfo();
          i3.specularColorTexture = e4.createTextureInfoDef(t5, s5);
        }
      }
    }), this;
  }
};
Ue.EXTENSION_NAME = Le;
var { R: He } = c;
var Ve = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "Transmission", this.parentTypes = [o.MATERIAL], this.extensionName = "KHR_materials_transmission", this._transmissionFactor = 0, this.transmissionTexture = null, this.transmissionTextureInfo = this.graph.link("transmissionTextureInfo", this, new W(this.graph));
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this._transmissionFactor = e4._transmissionFactor, this.setTransmissionTexture(e4.transmissionTexture ? t4(e4.transmissionTexture.getChild()) : null), this.transmissionTextureInfo.getChild().copy(t4(e4.transmissionTextureInfo.getChild()), t4), this;
  }
  dispose() {
    this.transmissionTextureInfo.getChild().dispose(), super.dispose();
  }
  getTransmissionFactor() {
    return this._transmissionFactor;
  }
  setTransmissionFactor(e4) {
    return this._transmissionFactor = e4, this;
  }
  getTransmissionTexture() {
    return this.transmissionTexture ? this.transmissionTexture.getChild() : null;
  }
  getTransmissionTextureInfo() {
    return this.transmissionTexture ? this.transmissionTextureInfo.getChild() : null;
  }
  setTransmissionTexture(e4) {
    return this.transmissionTexture = this.graph.linkTexture("transmissionTexture", He, this, e4), this;
  }
};
Ve.EXTENSION_NAME = "KHR_materials_transmission", C2([p], Ve.prototype, "transmissionTexture", void 0), C2([p], Ve.prototype, "transmissionTextureInfo", void 0);
var Pe = "KHR_materials_transmission";
var Xe = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = Pe;
  }
  createTransmission() {
    return new Ve(this.doc.getGraph(), this);
  }
  read(e4) {
    const t4 = e4.jsonDoc, s4 = t4.json.textures || [];
    return (t4.json.materials || []).forEach((t5, r4) => {
      if (t5.extensions && t5.extensions[Pe]) {
        const o5 = this.createTransmission();
        e4.materials[r4].setExtension(Pe, o5);
        const n4 = t5.extensions[Pe];
        if (n4.transmissionFactor !== void 0 && o5.setTransmissionFactor(n4.transmissionFactor), n4.transmissionTexture !== void 0) {
          const t6 = n4.transmissionTexture;
          o5.setTransmissionTexture(e4.textures[s4[t6.index].source]), e4.setTextureInfo(o5.getTransmissionTextureInfo(), t6);
        }
      }
    }), this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    return this.doc.getRoot().listMaterials().forEach((s4) => {
      const r4 = s4.getExtension(Pe);
      if (r4) {
        const o5 = e4.materialIndexMap.get(s4), n4 = t4.json.materials[o5];
        n4.extensions = n4.extensions || {};
        const i3 = n4.extensions[Pe] = { transmissionFactor: r4.getTransmissionFactor() };
        if (r4.getTransmissionTexture()) {
          const t5 = r4.getTransmissionTexture(), s5 = r4.getTransmissionTextureInfo();
          i3.transmissionTexture = e4.createTextureInfoDef(t5, s5);
        }
      }
    }), this;
  }
};
Xe.EXTENSION_NAME = Pe;
var Ke = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "Unlit", this.parentTypes = [o.MATERIAL], this.extensionName = "KHR_materials_unlit";
  }
};
Ke.EXTENSION_NAME = "KHR_materials_unlit";
var ze = "KHR_materials_unlit";
var qe = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = ze;
  }
  createUnlit() {
    return new Ke(this.doc.getGraph(), this);
  }
  read(e4) {
    return (e4.jsonDoc.json.materials || []).forEach((t4, s4) => {
      t4.extensions && t4.extensions[ze] && e4.materials[s4].setExtension(ze, this.createUnlit());
    }), this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    return this.doc.getRoot().listMaterials().forEach((s4) => {
      if (s4.getExtension(ze)) {
        const r4 = e4.materialIndexMap.get(s4), o5 = t4.json.materials[r4];
        o5.extensions = o5.extensions || {}, o5.extensions[ze] = {};
      }
    }), this;
  }
};
qe.EXTENSION_NAME = ze;
var $e = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "Mapping", this.parentTypes = ["MappingList"], this.extensionName = "KHR_materials_variants", this.material = null, this.variants = [];
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this.setMaterial(e4.material ? t4(e4.material.getChild()) : null), this.clearGraphChildList(this.variants), e4.variants.forEach((e5) => this.addVariant(t4(e5.getChild()))), this;
  }
  getMaterial() {
    return this.material ? this.material.getChild() : null;
  }
  setMaterial(e4) {
    return this.material = this.graph.link("material", this, e4), this;
  }
  addVariant(e4) {
    const t4 = this.graph.link("variant", this, e4);
    return this.addGraphChild(this.variants, t4);
  }
  removeVariant(e4) {
    return this.removeGraphChild(this.variants, e4);
  }
  listVariants() {
    return this.variants.map((e4) => e4.getChild());
  }
};
$e.EXTENSION_NAME = "KHR_materials_variants", C2([p], $e.prototype, "material", void 0), C2([g], $e.prototype, "variants", void 0);
var Ye = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "MappingList", this.parentTypes = [o.PRIMITIVE], this.extensionName = "KHR_materials_variants", this.mappings = [];
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this.clearGraphChildList(this.mappings), e4.mappings.forEach((e5) => this.addMapping(t4(e5.getChild()))), this;
  }
  addMapping(e4) {
    const t4 = this.graph.link("mapping", this, e4);
    return this.addGraphChild(this.mappings, t4);
  }
  removeMapping(e4) {
    return this.removeGraphChild(this.mappings, e4);
  }
  listMappings() {
    return this.mappings.map((e4) => e4.getChild());
  }
};
Ye.EXTENSION_NAME = "KHR_materials_variants", C2([g], Ye.prototype, "mappings", void 0);
var Qe = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "Variant", this.parentTypes = [o.ROOT, "MappingList"], this.extensionName = "KHR_materials_variants";
  }
};
Qe.EXTENSION_NAME = "KHR_materials_variants";
var We = "KHR_materials_variants";
var Je = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = We;
  }
  createMappingList() {
    return new Ye(this.doc.getGraph(), this);
  }
  createVariant(e4 = "") {
    return new Qe(this.doc.getGraph(), this).setName(e4);
  }
  createMapping() {
    return new $e(this.doc.getGraph(), this);
  }
  listVariants() {
    return Array.from(this.properties).filter((e4) => e4 instanceof Qe);
  }
  read(e4) {
    const t4 = e4.jsonDoc;
    if (!t4.json.extensions || !t4.json.extensions[We])
      return this;
    const s4 = (t4.json.extensions[We].variants || []).map((e5) => this.createVariant().setName(e5.name || ""));
    return (t4.json.meshes || []).forEach((t5, r4) => {
      const o5 = e4.meshes[r4];
      (t5.primitives || []).forEach((t6, r5) => {
        if (!t6.extensions || !t6.extensions[We])
          return;
        const n4 = this.createMappingList(), i3 = t6.extensions[We];
        for (const t7 of i3.mappings) {
          const r6 = this.createMapping();
          t7.material !== void 0 && r6.setMaterial(e4.materials[t7.material]);
          for (const e5 of t7.variants || [])
            r6.addVariant(s4[e5]);
          n4.addMapping(r6);
        }
        o5.listPrimitives()[r5].setExtension(We, n4);
      });
    }), this;
  }
  write(e4) {
    const t4 = e4.jsonDoc, s4 = this.listVariants();
    if (!s4.length)
      return this;
    const r4 = [], o5 = new Map();
    for (const t5 of s4)
      o5.set(t5, r4.length), r4.push(e4.createPropertyDef(t5));
    for (const t5 of this.doc.getRoot().listMeshes()) {
      const s5 = e4.meshIndexMap.get(t5);
      t5.listPrimitives().forEach((t6, r5) => {
        const n4 = t6.getExtension(We);
        if (!n4)
          return;
        const i3 = e4.jsonDoc.json.meshes[s5].primitives[r5], a5 = n4.listMappings().map((t7) => {
          const s6 = e4.createPropertyDef(t7), r6 = t7.getMaterial();
          return r6 && (s6.material = e4.materialIndexMap.get(r6)), s6.variants = t7.listVariants().map((e5) => o5.get(e5)), s6;
        });
        i3.extensions = i3.extensions || {}, i3.extensions[We] = { mappings: a5 };
      });
    }
    return t4.json.extensions = t4.json.extensions || {}, t4.json.extensions[We] = { variants: r4 }, this;
  }
};
Je.EXTENSION_NAME = We;
var { G: Ze } = c;
var et2 = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "Transmission", this.parentTypes = [o.MATERIAL], this.extensionName = "KHR_materials_volume", this._thicknessFactor = 0, this._attenuationDistance = Infinity, this._attenuationColor = [1, 1, 1], this.thicknessTexture = null, this.thicknessTextureInfo = this.graph.link("thicknessTextureInfo", this, new W(this.graph));
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this._thicknessFactor = e4._thicknessFactor, this._attenuationDistance = e4._attenuationDistance, this._attenuationColor = [...e4._attenuationColor], this.setThicknessTexture(e4.thicknessTexture ? t4(e4.thicknessTexture.getChild()) : null), this.thicknessTextureInfo.getChild().copy(t4(e4.thicknessTextureInfo.getChild()), t4), this;
  }
  dispose() {
    this.thicknessTextureInfo.getChild().dispose(), super.dispose();
  }
  getThicknessFactor() {
    return this._thicknessFactor;
  }
  setThicknessFactor(e4) {
    return this._thicknessFactor = e4, this;
  }
  getThicknessTexture() {
    return this.thicknessTexture ? this.thicknessTexture.getChild() : null;
  }
  getThicknessTextureInfo() {
    return this.thicknessTexture ? this.thicknessTextureInfo.getChild() : null;
  }
  setThicknessTexture(e4) {
    return this.thicknessTexture = this.graph.linkTexture("thicknessTexture", Ze, this, e4), this;
  }
  getAttenuationDistance() {
    return this._attenuationDistance;
  }
  setAttenuationDistance(e4) {
    return this._attenuationDistance = e4, this;
  }
  getAttenuationColor() {
    return this._attenuationColor;
  }
  setAttenuationColor(e4) {
    return this._attenuationColor = e4, this;
  }
  getAttenuationColorHex() {
    return y.factorToHex(this._attenuationColor);
  }
  setAttenuationColorHex(e4) {
    return y.hexToFactor(e4, this._attenuationColor), this;
  }
};
et2.EXTENSION_NAME = "KHR_materials_volume", C2([p], et2.prototype, "thicknessTexture", void 0), C2([p], et2.prototype, "thicknessTextureInfo", void 0);
var tt2 = "KHR_materials_volume";
var st2 = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = tt2;
  }
  createVolume() {
    return new et2(this.doc.getGraph(), this);
  }
  read(e4) {
    const t4 = e4.jsonDoc, s4 = t4.json.textures || [];
    return (t4.json.materials || []).forEach((t5, r4) => {
      if (t5.extensions && t5.extensions[tt2]) {
        const o5 = this.createVolume();
        e4.materials[r4].setExtension(tt2, o5);
        const n4 = t5.extensions[tt2];
        if (n4.thicknessFactor !== void 0 && o5.setThicknessFactor(n4.thicknessFactor), n4.attenuationDistance !== void 0 && o5.setAttenuationDistance(n4.attenuationDistance), n4.attenuationColor !== void 0 && o5.setAttenuationColor(n4.attenuationColor), n4.thicknessTexture !== void 0) {
          const t6 = n4.thicknessTexture;
          o5.setThicknessTexture(e4.textures[s4[t6.index].source]), e4.setTextureInfo(o5.getThicknessTextureInfo(), t6);
        }
      }
    }), this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    return this.doc.getRoot().listMaterials().forEach((s4) => {
      const r4 = s4.getExtension(tt2);
      if (r4) {
        const o5 = e4.materialIndexMap.get(s4), n4 = t4.json.materials[o5];
        n4.extensions = n4.extensions || {};
        const i3 = n4.extensions[tt2] = {};
        if (r4.getThicknessFactor() > 0 && (i3.thicknessFactor = r4.getThicknessFactor()), Number.isFinite(r4.getAttenuationDistance()) && (i3.attenuationDistance = r4.getAttenuationDistance()), S.eq(r4.getAttenuationColor(), [1, 1, 1]) || (i3.attenuationColor = r4.getAttenuationColor()), r4.getThicknessTexture()) {
          const t5 = r4.getThicknessTexture(), s5 = r4.getThicknessTextureInfo();
          i3.thicknessTexture = e4.createTextureInfoDef(t5, s5);
        }
      }
    }), this;
  }
};
st2.EXTENSION_NAME = tt2;
var rt2 = "KHR_mesh_quantization";
var ot2 = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = rt2;
  }
  read(e4) {
    return this;
  }
  write(e4) {
    return this;
  }
};
ot2.EXTENSION_NAME = rt2;
var nt2 = "KHR_texture_basisu";
var it2 = class {
  getSize(e4) {
    const t4 = p2(new Uint8Array(e4));
    return [t4.pixelWidth, t4.pixelHeight];
  }
  getChannels(e4) {
    const t4 = p2(new Uint8Array(e4)).dataFormatDescriptor[0];
    if (t4.colorModel === s2.ETC1S)
      return t4.samples.length === 2 && (15 & t4.samples[1].channelID) == 15 ? 4 : 3;
    if (t4.colorModel === s2.UASTC)
      return (15 & t4.samples[0].channelID) == 3 ? 4 : 3;
    throw new Error(`Unexpected KTX2 colorModel, "${t4.colorModel}".`);
  }
  getGPUByteLength(e4) {
    const t4 = p2(new Uint8Array(e4)), s4 = this.getChannels(e4) > 3;
    let r4 = 0;
    for (let e5 = 0; e5 < t4.levels.length; e5++) {
      const o5 = t4.levels[e5];
      r4 += o5.uncompressedByteLength ? o5.uncompressedByteLength : Math.max(1, Math.floor(t4.pixelWidth / Math.pow(2, e5))) / 4 * (Math.max(1, Math.floor(t4.pixelHeight / Math.pow(2, e5))) / 4) * (s4 ? 16 : 8);
    }
    return r4;
  }
};
var at = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = nt2, this.prereadTypes = [o.TEXTURE];
  }
  static register() {
    E.registerFormat("image/ktx2", new it2());
  }
  preread(e4) {
    return e4.jsonDoc.json.textures.forEach((e5) => {
      e5.extensions && e5.extensions[nt2] && (e5.source = e5.extensions[nt2].source);
    }), this;
  }
  read(e4) {
    return this;
  }
  write(e4) {
    const t4 = e4.jsonDoc;
    return this.doc.getRoot().listTextures().forEach((s4) => {
      if (s4.getMimeType() === "image/ktx2") {
        const r4 = e4.imageIndexMap.get(s4);
        t4.json.textures.forEach((e5) => {
          e5.source === r4 && (e5.extensions = e5.extensions || {}, e5.extensions[nt2] = { source: e5.source }, delete e5.source);
        });
      }
    }), this;
  }
};
at.EXTENSION_NAME = nt2;
var ct = class extends D {
  constructor(...e4) {
    super(...e4), this.propertyType = "Transform", this.parentTypes = [o.TEXTURE_INFO], this.extensionName = "KHR_texture_transform", this._offset = [0, 0], this._rotation = 0, this._scale = [1, 1], this._texCoord = null;
  }
  copy(e4, t4 = _) {
    return super.copy(e4, t4), this._offset = e4._offset, this._rotation = e4._rotation, this._scale = e4._scale, this._texCoord = e4._texCoord, this;
  }
  getOffset() {
    return this._offset;
  }
  setOffset(e4) {
    return this._offset = e4, this;
  }
  getRotation() {
    return this._rotation;
  }
  setRotation(e4) {
    return this._rotation = e4, this;
  }
  getScale() {
    return this._scale;
  }
  setScale(e4) {
    return this._scale = e4, this;
  }
  getTexCoord() {
    return this._texCoord;
  }
  setTexCoord(e4) {
    return this._texCoord = e4, this;
  }
};
ct.EXTENSION_NAME = "KHR_texture_transform";
var ut = "KHR_texture_transform";
var ht = class extends ot {
  constructor(...e4) {
    super(...e4), this.extensionName = ut;
  }
  createTransform() {
    return new ct(this.doc.getGraph(), this);
  }
  read(e4) {
    for (const [t4, s4] of Array.from(e4.textureInfos.entries())) {
      if (!s4.extensions || !s4.extensions[ut])
        continue;
      const e5 = this.createTransform(), r4 = s4.extensions[ut];
      r4.offset !== void 0 && e5.setOffset(r4.offset), r4.rotation !== void 0 && e5.setRotation(r4.rotation), r4.scale !== void 0 && e5.setScale(r4.scale), r4.texCoord !== void 0 && e5.setTexCoord(r4.texCoord), t4.setExtension(ut, e5);
    }
    return this;
  }
  write(e4) {
    const t4 = Array.from(e4.textureInfoDefMap.entries());
    for (const [e5, s4] of t4) {
      const t5 = e5.getExtension(ut);
      if (!t5)
        continue;
      s4.extensions = s4.extensions || {};
      const r4 = {}, o5 = S.eq;
      o5(t5.getOffset(), [0, 0]) || (r4.offset = t5.getOffset()), t5.getRotation() !== 0 && (r4.rotation = t5.getRotation()), o5(t5.getScale(), [1, 1]) || (r4.scale = t5.getScale()), t5.getTexCoord() != null && (r4.texCoord = t5.getTexCoord()), s4.extensions[ut] = r4;
    }
    return this;
  }
};
ht.EXTENSION_NAME = ut;
var lt2 = [ie, he, Te, _e, Ae, Ue, De, Xe, qe, Je, st2, ot2, at, ht];
var pt2 = [N2, U3, P2, ...lt2];

// ../../node_modules/@gltf-transform/functions/dist/functions.modern.js
var import_ndarray3 = __toModule(require_ndarray());

// ../../node_modules/ndarray-lanczos/dist/ndarray-lanczos.modern.js
var import_ndarray2 = __toModule(require_ndarray());
var e3 = (t4, e4) => {
  if (t4 <= -e4 || t4 >= e4)
    return 0;
  const n4 = t4 * Math.PI;
  return Math.sin(n4) / n4 * Math.sin(n4 / e4) / (n4 / e4);
};
var n3 = (t4) => Math.round(16383 * t4);
var r3 = (t4, r4, o5, a5, s4) => {
  const l4 = s4 ? 2 : 3, h3 = 1 / o5, c4 = Math.min(1, o5), f3 = l4 / c4, i3 = Math.floor(2 * (f3 + 1)), A3 = new Int16Array((i3 + 2) * r4);
  let M3 = 0;
  for (let o6 = 0; o6 < r4; o6++) {
    const s5 = (o6 + 0.5) * h3 + a5, i4 = Math.max(0, Math.floor(s5 - f3)), u2 = Math.min(t4 - 1, Math.ceil(s5 + f3)), p3 = u2 - i4 + 1, C3 = new Float32Array(p3), L4 = new Int16Array(p3);
    let N3 = 0, O4 = 0;
    for (let t5 = i4; t5 <= u2; t5++) {
      const n4 = e3((t5 + 0.5 - s5) * c4, l4);
      N3 += n4, C3[O4] = n4, O4++;
    }
    let S3 = 0;
    for (let t5 = 0; t5 < C3.length; t5++) {
      const e4 = C3[t5] / N3;
      S3 += e4, L4[t5] = n3(e4);
    }
    L4[r4 >> 1] += n3(1 - S3);
    let Z4 = 0;
    for (; Z4 < L4.length && L4[Z4] === 0; )
      Z4++;
    let _4 = L4.length - 1;
    for (; _4 > 0 && L4[_4] === 0; )
      _4--;
    const g2 = _4 - Z4 + 1;
    A3[M3++] = i4 + Z4, A3[M3++] = g2, A3.set(L4.subarray(Z4, _4 + 1), M3), M3 += g2;
  }
  return A3;
};
var o4 = (t4) => t4 < 0 ? 0 : t4 > 255 ? 255 : t4;
var a4 = (t4, e4, n4) => {
  const [r4, a5] = t4.shape, [s4] = e4.shape;
  for (let r5 = 0; r5 < a5; r5++) {
    const a6 = r5;
    let l4 = 0;
    for (let h3 = 0; h3 < s4; h3++) {
      let s5 = n4[l4++], c4 = 0, f3 = 0, i3 = 0, A3 = 0;
      for (let e5 = n4[l4++]; e5 > 0; e5--) {
        const e6 = n4[l4++];
        c4 += e6 * t4.get(s5, r5, 0), f3 += e6 * t4.get(s5, r5, 1), i3 += e6 * t4.get(s5, r5, 2), A3 += e6 * t4.get(s5, r5, 3), s5++;
      }
      e4.set(h3, a6, 0, o4(c4 + 8192 >> 14)), e4.set(h3, a6, 1, o4(f3 + 8192 >> 14)), e4.set(h3, a6, 2, o4(i3 + 8192 >> 14)), e4.set(h3, a6, 3, o4(A3 + 8192 >> 14));
    }
  }
};
var s3;
function l3(e4, n4, o5) {
  const [l4, h3] = e4.shape, [c4, f3] = n4.shape, i3 = f3 / h3, A3 = r3(l4, c4, c4 / l4, 0, o5 === s3.LANCZOS_2), M3 = r3(h3, f3, i3, 0, o5 === s3.LANCZOS_2), u2 = (0, import_ndarray2.default)(new Uint8Array(c4 * h3 * 4), [h3, c4, 4]), p3 = u2.transpose(1, 0), C3 = n4.transpose(1, 0);
  a4(e4, p3, A3), a4(u2, C3, M3);
}
function h2(t4, e4) {
  l3(t4, e4, s3.LANCZOS_3);
}
function c3(t4, e4) {
  l3(t4, e4, s3.LANCZOS_2);
}
!function(t4) {
  t4[t4.LANCZOS_3 = 3] = "LANCZOS_3", t4[t4.LANCZOS_2 = 2] = "LANCZOS_2";
}(s3 || (s3 = {}));

// ../../node_modules/@gltf-transform/functions/dist/functions.modern.js
function z3() {
  return (z3 = Object.assign || function(t4) {
    for (var e4 = 1; e4 < arguments.length; e4++) {
      var n4 = arguments[e4];
      for (var s4 in n4)
        Object.prototype.hasOwnProperty.call(n4, s4) && (t4[s4] = n4[s4]);
    }
    return t4;
  }).apply(this, arguments);
}
var L3 = { pivot: "center" };
function $2(e4 = L3) {
  const n4 = z3({}, L3, e4);
  return (e5) => {
    const s4 = e5.getLogger(), r4 = e5.getRoot(), o5 = r4.listAnimations().length > 0 || r4.listSkins().length > 0;
    e5.getRoot().listScenes().forEach((i3, a5) => {
      let c4;
      if (s4.debug(`center: Scene ${a5 + 1} / ${r4.listScenes().length}.`), typeof n4.pivot == "string") {
        const e6 = w(i3);
        c4 = [(e6.max[0] - e6.min[0]) / 2 + e6.min[0], (e6.max[1] - e6.min[1]) / 2 + e6.min[1], (e6.max[2] - e6.min[2]) / 2 + e6.min[2]], n4.pivot === "above" && (c4[1] = e6.max[1]), n4.pivot === "below" && (c4[1] = e6.min[1]);
      } else
        c4 = n4.pivot;
      s4.debug(`center: Pivot "${c4.join(", ")}".`);
      const l4 = [-1 * c4[0], -1 * c4[1], -1 * c4[2]];
      if (o5) {
        s4.debug("center: Model contains animation or skin. Adding a wrapper node.");
        const t4 = e5.createNode("Pivot").setTranslation(l4);
        i3.listChildren().forEach((e6) => t4.addChild(e6)), i3.addChild(t4);
      } else
        s4.debug("center: Skipping wrapper, offsetting all root nodes."), i3.listChildren().forEach((t4) => {
          const e6 = t4.getTranslation();
          t4.setTranslation([e6[0] + l4[0], e6[1] + l4[1], e6[2] + l4[2]]);
        });
    }), s4.debug("center: Complete.");
  };
}
function v3(t4) {
  return (e4) => {
    const n4 = e4.getLogger();
    if (t4.inputEncoding === "linear")
      return void n4.info("colorspace: Vertex colors already linear. Skipping conversion.");
    if (t4.inputEncoding !== "sRGB")
      return void n4.error(`colorspace: Unknown input encoding "${t4.inputEncoding}" \u2013 should be "sRGB" or "linear". Skipping conversion.`);
    const s4 = new Set();
    function r4(t5) {
      return t5 < 0.04045 ? 0.0773993808 * t5 : Math.pow(0.9478672986 * t5 + 0.0521327014, 2.4);
    }
    function o5(t5) {
      const e5 = [0, 0, 0];
      let n5;
      for (let o6 = 0; n5 = t5.getAttribute(`COLOR_${o6}`); o6++)
        if (!s4.has(n5)) {
          for (let t6 = 0; t6 < n5.getCount(); t6++)
            n5.getElement(t6, e5), e5[0] = r4(e5[0]), e5[1] = r4(e5[1]), e5[2] = r4(e5[2]), n5.setElement(t6, e5);
          s4.add(n5);
        }
    }
    e4.getRoot().listMeshes().forEach((t5) => t5.listPrimitives().forEach(o5)), n4.debug("colorspace: Complete.");
  };
}
var _3 = { propertyTypes: [o.ACCESSOR, o.MESH, o.TEXTURE] };
var k3 = function(t4 = _3) {
  const r4 = z3({}, _3, t4), o5 = new Set(r4.propertyTypes);
  for (const t5 of r4.propertyTypes)
    if (!_3.propertyTypes.includes(t5))
      throw new Error(`dedup: Unsupported deduplication on type "${t5}".`);
  return (t5) => {
    const r5 = t5.getLogger();
    o5.has(o.ACCESSOR) && function(t6, e4) {
      const s4 = new Set(), r6 = new Set(), o6 = new Set(), i3 = new Set(), a5 = e4.getRoot().listMeshes();
      a5.forEach((t7) => {
        t7.listPrimitives().forEach((t8) => {
          t8.listAttributes().forEach((t9) => r6.add(t9));
          const e5 = t8.getIndices();
          e5 && s4.add(e5);
        });
      });
      for (const t7 of e4.getRoot().listAnimations())
        for (const e5 of t7.listSamplers()) {
          const t8 = e5.getInput(), n4 = e5.getOutput();
          t8 && o6.add(t8), n4 && i3.add(n4);
        }
      function c4(t7) {
        const e5 = new Map();
        for (let s5 = 0; s5 < t7.length; s5++) {
          const r7 = t7[s5], o7 = r7.getArray().slice().buffer;
          if (!e5.has(r7))
            for (let s6 = 0; s6 < t7.length; s6++) {
              const i4 = t7[s6];
              r7 !== i4 && (e5.has(i4) || r7.getType() === i4.getType() && r7.getComponentType() === i4.getComponentType() && r7.getCount() === i4.getCount() && r7.getNormalized() === i4.getNormalized() && T.equals(o7, i4.getArray().slice().buffer) && e5.set(i4, r7));
            }
        }
        return e5;
      }
      const l4 = c4(Array.from(s4));
      t6.debug(`dedup: Found ${l4.size} duplicates among ${s4.size} indices.`);
      const g2 = c4(Array.from(r6));
      t6.debug(`dedup: Found ${g2.size} duplicates among ${r6.size} attributes.`);
      const u2 = c4(Array.from(o6)), f3 = c4(Array.from(i3));
      t6.debug(`dedup: Found ${u2.size + f3.size} duplicates among ${o6.size + i3.size} animation accessors.`), a5.forEach((t7) => {
        t7.listPrimitives().forEach((t8) => {
          t8.listAttributes().forEach((e6) => {
            g2.has(e6) && t8.swap(e6, g2.get(e6));
          });
          const e5 = t8.getIndices();
          e5 && l4.has(e5) && t8.swap(e5, l4.get(e5));
        });
      }), Array.from(l4.keys()).forEach((t7) => t7.dispose()), Array.from(g2.keys()).forEach((t7) => t7.dispose());
      for (const t7 of e4.getRoot().listAnimations())
        for (const e5 of t7.listSamplers()) {
          const t8 = e5.getInput(), n4 = e5.getOutput();
          t8 && u2.has(t8) && e5.swap(t8, u2.get(t8)), n4 && f3.has(n4) && e5.swap(n4, f3.get(n4));
        }
      Array.from(u2.keys()).forEach((t7) => t7.dispose()), Array.from(f3.keys()).forEach((t7) => t7.dispose());
    }(r5, t5), o5.has(o.MESH) && function(t6, n4) {
      const s4 = n4.getRoot(), r6 = new Map();
      s4.listAccessors().forEach((t7, e4) => {
        r6.set(t7, e4);
      });
      const o6 = s4.listMeshes().length, i3 = new Map();
      for (const t7 of s4.listMeshes()) {
        const n5 = [];
        for (const e4 of t7.listPrimitives()) {
          const t8 = [];
          for (const n6 of e4.listSemantics()) {
            const s7 = e4.getAttribute(n6);
            t8.push(n6 + ":" + r6.get(s7));
          }
          const s6 = e4.getIndices();
          s6 && t8.push("indices:" + r6.get(s6)), n5.push(t8.join(","));
        }
        const s5 = n5.join(";");
        if (i3.has(s5)) {
          const n6 = i3.get(s5);
          t7.listParents().forEach((s6) => {
            s6.propertyType !== o.ROOT && s6.swap(t7, n6);
          }), t7.dispose();
        } else
          i3.set(s5, t7);
      }
      t6.debug(`dedup: Found ${o6 - i3.size} duplicates among ${o6} meshes.`);
    }(r5, t5), o5.has(o.TEXTURE) && function(t6, e4) {
      const r6 = e4.getRoot(), o6 = r6.listTextures(), i3 = new Map();
      for (let t7 = 0; t7 < o6.length; t7++) {
        const e5 = o6[t7], s4 = e5.getImage();
        if (!i3.has(e5))
          for (let t8 = 0; t8 < o6.length; t8++) {
            const r7 = o6[t8], a5 = r7.getImage();
            if (e5 === r7)
              continue;
            if (i3.has(r7))
              continue;
            if (e5.getMimeType() !== r7.getMimeType())
              continue;
            const c4 = e5.getSize(), l4 = r7.getSize();
            c4 && l4 && c4[0] === l4[0] && c4[1] === l4[1] && s4 && a5 && T.equals(s4, a5) && i3.set(r7, e5);
          }
      }
      t6.debug(`dedup: Found ${i3.size} duplicates among ${r6.listTextures().length} textures.`), Array.from(i3.entries()).forEach(([t7, e5]) => {
        t7.listParents().forEach((n4) => {
          n4 instanceof nt || n4.swap(t7, e5);
        }), t7.dispose();
      });
    }(r5, t5), r5.debug("dedup: Complete.");
  };
};
async function F3(t4, e4, n4) {
  if (!t4)
    return null;
  const s4 = t4.getImage();
  if (!s4)
    return null;
  const r4 = await i(new Uint8Array(s4), t4.getMimeType());
  for (let t5 = 0; t5 < r4.shape[0]; ++t5)
    for (let e5 = 0; e5 < r4.shape[1]; ++e5)
      n4(r4, t5, e5);
  const o5 = (await o2(r4, "image/png")).buffer;
  return e4.setImage(o5).setMimeType("image/png");
}
function U4(t4) {
  const e4 = t4.getIndices(), n4 = t4.getAttribute("POSITION");
  switch (t4.getMode()) {
    case tt.Mode.POINTS:
      return n4.getCount();
    case tt.Mode.LINES:
      return e4 ? e4.getCount() / 2 : n4.getCount() / 2;
    case tt.Mode.LINE_LOOP:
      return n4.getCount();
    case tt.Mode.LINE_STRIP:
      return n4.getCount() - 1;
    case tt.Mode.TRIANGLES:
      return e4 ? e4.getCount() / 3 : n4.getCount() / 3;
    case tt.Mode.TRIANGLE_STRIP:
    case tt.Mode.TRIANGLE_FAN:
      return n4.getCount() - 2;
    default:
      throw new Error("Unexpected mode: " + t4.getMode());
  }
}
var G3 = class {
  constructor() {
    this._map = new Map();
  }
  get size() {
    return this._map.size;
  }
  has(t4) {
    return this._map.has(t4);
  }
  add(t4, e4) {
    let n4 = this._map.get(t4);
    return n4 || (n4 = new Set(), this._map.set(t4, n4)), n4.add(e4), this;
  }
  get(t4) {
    return this._map.get(t4) || new Set();
  }
  keys() {
    return this._map.keys();
  }
};
function q3(t4) {
  return { scenes: B3(t4), meshes: V2(t4), materials: W3(t4), textures: D3(t4), animations: X3(t4) };
}
function B3(e4) {
  return { properties: e4.getRoot().listScenes().map((e5) => {
    const n4 = e5.listChildren()[0], s4 = w(e5);
    return { name: e5.getName(), rootName: n4 ? n4.getName() : "", bboxMin: j3(s4.min), bboxMax: j3(s4.max) };
  }) };
}
function V2(t4) {
  return { properties: t4.getRoot().listMeshes().map((t5) => {
    const e4 = t5.listParents().filter((t6) => t6.propertyType !== "Root").length;
    let n4 = 0, s4 = 0;
    const r4 = new Set(), o5 = new Set(), i3 = new Set();
    t5.listPrimitives().forEach((t6) => {
      for (const e6 of t6.listSemantics()) {
        const n5 = t6.getAttribute(e6);
        r4.add(e6 + ":" + K3(n5.getArray())), i3.add(n5);
      }
      for (const e6 of t6.listTargets())
        e6.listAttributes().forEach((t7) => i3.add(t7));
      const e5 = t6.getIndices();
      e5 && (o5.add(K3(e5.getArray())), i3.add(e5)), s4 += t6.listAttributes()[0].getCount(), n4 += U4(t6);
    });
    let a5 = 0;
    Array.from(i3).forEach((t6) => a5 += t6.getArray().byteLength);
    const c4 = t5.listPrimitives().map((t6) => H3[t6.getMode()]);
    return { name: t5.getName(), mode: Array.from(new Set(c4)), primitives: t5.listPrimitives().length, glPrimitives: n4, vertices: s4, indices: Array.from(o5).sort(), attributes: Array.from(r4).sort(), instances: e4, size: a5 };
  }) };
}
function W3(t4) {
  return { properties: t4.getRoot().listMaterials().map((e4) => {
    const n4 = e4.listParents().filter((t5) => t5.propertyType !== "Root").length, s4 = new Set(e4.listExtensions()), r4 = t4.getGraph().getLinks().filter((t5) => {
      const n5 = t5.getChild(), r5 = t5.getParent();
      return n5 instanceof rt && r5 === e4 || !!(n5 instanceof rt && r5 instanceof D && s4.has(r5));
    }).map((t5) => t5.getName());
    return { name: e4.getName(), instances: n4, textures: r4, alphaMode: e4.getAlphaMode(), doubleSided: e4.getDoubleSided() };
  }) };
}
function D3(t4) {
  return { properties: t4.getRoot().listTextures().map((e4) => {
    const n4 = e4.listParents().filter((t5) => t5.propertyType !== "Root").length, s4 = t4.getGraph().listParentLinks(e4).map((t5) => t5.getName()).filter((t5) => t5 !== "texture"), r4 = E.getSize(e4.getImage(), e4.getMimeType());
    return { name: e4.getName(), uri: e4.getURI(), slots: Array.from(new Set(s4)), instances: n4, mimeType: e4.getMimeType(), resolution: r4 ? r4.join("x") : "", size: e4.getImage().byteLength, gpuSize: E.getMemSize(e4.getImage(), e4.getMimeType()) };
  }) };
}
function X3(t4) {
  return { properties: t4.getRoot().listAnimations().map((t5) => {
    let e4 = Infinity, n4 = -Infinity;
    t5.listSamplers().forEach((t6) => {
      const s5 = t6.getInput();
      s5 && (e4 = Math.min(e4, s5.getMin([])[0]), n4 = Math.max(n4, s5.getMax([])[0]));
    });
    let s4 = 0, r4 = 0;
    const o5 = new Set();
    return t5.listSamplers().forEach((t6) => {
      const e5 = t6.getInput(), n5 = t6.getOutput();
      e5 && (r4 += e5.getCount(), o5.add(e5), n5 && o5.add(n5));
    }), Array.from(o5).forEach((t6) => {
      s4 += t6.getArray().byteLength;
    }), { name: t5.getName(), channels: t5.listChannels().length, samplers: t5.listSamplers().length, duration: Math.round(1e3 * (n4 - e4)) / 1e3, keyframes: r4, size: s4 };
  }) };
}
var H3 = ["POINTS", "LINES", "LINE_LOOP", "LINE_STRIP", "TRIANGLES", "TRIANGLE_STRIP", "TRIANGLE_FAN"];
function j3(t4) {
  for (let e4 = 0; e4 < t4.length; e4++)
    t4[e4].toFixed && (t4[e4] = Number(t4[e4].toFixed(5)));
  return t4;
}
function K3(t4) {
  return t4.constructor.name.replace("Array", "").toLowerCase();
}
var Z3 = {};
function J3(t4 = Z3) {
  return z3({}, Z3, t4), (t5) => {
    const e4 = t5.getLogger(), n4 = t5.getRoot(), s4 = t5.createExtension(N2);
    if (n4.listAnimations().length)
      throw new Error("instance: Instancing is not currently supported for animated models.");
    let r4 = 0, o5 = 0;
    for (const i3 of n4.listScenes()) {
      const n5 = new Map();
      i3.traverse((t6) => {
        const e5 = t6.getMesh();
        e5 && n5.set(e5, (n5.get(e5) || new Set()).add(t6));
      });
      const a5 = [];
      for (const l4 of Array.from(n5.keys())) {
        const g2 = Array.from(n5.get(l4));
        if (g2.length < 2)
          continue;
        if (g2.some((t6) => t6.getSkin()))
          continue;
        const u2 = Q3(t5, s4, l4, g2.length), f3 = u2.getAttribute("TRANSLATION"), p3 = u2.getAttribute("ROTATION"), m2 = u2.getAttribute("SCALE"), d = t5.createNode().setMesh(l4).setExtension("EXT_mesh_gpu_instancing", u2);
        i3.addChild(d);
        let h3 = false, A3 = false, y3 = false;
        for (let t6 = 0; t6 < g2.length; t6++) {
          let e5, n6, s5;
          const r5 = g2[t6];
          f3.setElement(t6, e5 = r5.getWorldTranslation()), p3.setElement(t6, n6 = r5.getWorldRotation()), m2.setElement(t6, s5 = r5.getWorldScale()), S.eq(e5, [0, 0, 0]) || (h3 = true), S.eq(n6, [0, 0, 0, 1]) || (A3 = true), S.eq(s5, [1, 1, 1]) || (y3 = true), r5.setMesh(null), a5.push(r5);
        }
        h3 || f3.dispose(), A3 || p3.dispose(), y3 || m2.dispose(), Y3(a5, e4), r4++, o5 += g2.length;
      }
    }
    r4 > 0 ? e4.info(`instance: Created ${r4} batches, with ${o5} total instances.`) : (e4.info("instance: No meshes with multiple parent nodes were found."), s4.dispose()), e4.debug("instance: Complete.");
  };
}
function Y3(t4, e4) {
  let n4, s4 = 0;
  for (; n4 = t4.pop(); ) {
    if (n4.listChildren().length || n4.getCamera() || n4.getMesh() || n4.getSkin() || n4.listExtensions().length)
      continue;
    const e5 = n4.getParent();
    e5 instanceof X && t4.push(e5), n4.dispose(), s4++;
  }
  e4.debug(`instance: Removed ${s4} unused nodes.`);
}
function Q3(t4, e4, n4, s4) {
  const r4 = n4.listPrimitives()[0].getAttribute("POSITION").getBuffer(), o5 = t4.createAccessor().setType("VEC3").setArray(new Float32Array(3 * s4)).setBuffer(r4), i3 = t4.createAccessor().setType("VEC4").setArray(new Float32Array(4 * s4)).setBuffer(r4), a5 = t4.createAccessor().setType("VEC3").setArray(new Float32Array(3 * s4)).setBuffer(r4);
  return e4.createInstancedMesh().setAttribute("TRANSLATION", o5).setAttribute("ROTATION", i3).setAttribute("SCALE", a5);
}
var tt3 = {};
function et3(t4 = tt3) {
  return z3({}, tt3, t4), async (t5) => {
    const e4 = t5.getLogger(), n4 = Ae.EXTENSION_NAME;
    if (!t5.getRoot().listExtensionsUsed().map((t6) => t6.extensionName).includes(n4))
      return void e4.warn(`metalRough: Extension ${n4} not found on given document.`);
    const s4 = t5.createExtension(_e), r4 = t5.createExtension(Ue), o5 = t5.createExtension(Ae), i3 = new Set();
    for (const e5 of t5.getRoot().listMaterials()) {
      const n5 = e5.getExtension("KHR_materials_pbrSpecularGlossiness");
      if (!n5)
        continue;
      const o6 = r4.createSpecular().setSpecularFactor(1).setSpecularColorFactor(n5.getSpecularFactor());
      i3.add(n5.getSpecularGlossinessTexture()), i3.add(e5.getBaseColorTexture()), i3.add(e5.getMetallicRoughnessTexture()), e5.setBaseColorFactor(n5.getDiffuseFactor()).setMetallicFactor(0).setRoughnessFactor(1).setExtension("KHR_materials_ior", s4.createIOR().setIOR(1e3)).setExtension("KHR_materials_specular", o6);
      const a5 = n5.getDiffuseTexture();
      a5 && (e5.setBaseColorTexture(a5), e5.getBaseColorTextureInfo().copy(n5.getDiffuseTextureInfo()));
      const c4 = n5.getSpecularGlossinessTexture();
      if (c4) {
        const s5 = n5.getSpecularGlossinessTextureInfo(), r5 = t5.createTexture();
        await F3(c4, r5, (t6, e6, n6) => {
          t6.set(e6, n6, 3, 255);
        }), o6.setSpecularTexture(r5), o6.setSpecularColorTexture(r5), o6.getSpecularTextureInfo().copy(s5), o6.getSpecularColorTextureInfo().copy(s5);
        const i4 = n5.getGlossinessFactor(), a6 = t5.createTexture();
        await F3(c4, a6, (t6, e6, n6) => {
          const s6 = 255 - Math.round(t6.get(e6, n6, 3) * i4);
          t6.set(e6, n6, 0, 0), t6.set(e6, n6, 1, s6), t6.set(e6, n6, 2, 0), t6.set(e6, n6, 3, 255);
        }), e5.setMetallicRoughnessTexture(a6), e5.getMetallicRoughnessTextureInfo().copy(s5);
      } else
        o6.setSpecularColorFactor(n5.getSpecularFactor()), e5.setRoughnessFactor(1 - n5.getGlossinessFactor());
      e5.setExtension("KHR_materials_pbrSpecularGlossiness", null);
    }
    o5.dispose();
    for (const t6 of i3)
      t6 && t6.listParents().length === 1 && t6.dispose();
    e4.debug("metalRough: Complete.");
  };
}
var nt3 = { propertyTypes: [o.NODE, o.SKIN, o.MESH, o.CAMERA, o.PRIMITIVE, o.PRIMITIVE_TARGET, o.ANIMATION, o.MATERIAL, o.TEXTURE, o.ACCESSOR, o.BUFFER] };
var st3 = function(t4 = nt3) {
  const n4 = z3({}, nt3, t4).propertyTypes;
  return (t5) => {
    const r4 = t5.getLogger(), o5 = t5.getRoot(), i3 = t5.getGraph(), a5 = {};
    if (n4.includes(o.NODE) && o5.listNodes().forEach(c4), n4.includes(o.SKIN) && o5.listSkins().forEach(c4), n4.includes(o.MESH) && o5.listMeshes().forEach(c4), n4.includes(o.CAMERA) && o5.listCameras().forEach(c4), n4.includes(o.PRIMITIVE) && l4(i3, o.PRIMITIVE), n4.includes(o.PRIMITIVE_TARGET) && l4(i3, o.PRIMITIVE_TARGET), n4.includes(o.ANIMATION))
      for (const t6 of o5.listAnimations()) {
        for (const e4 of t6.listChannels())
          e4.getTargetNode() || (e4.dispose(), u2(e4));
        if (t6.listChannels().length)
          t6.listSamplers().forEach(c4);
        else {
          const e4 = t6.listSamplers();
          c4(t6), e4.forEach(c4);
        }
      }
    if (n4.includes(o.MATERIAL) && o5.listMaterials().forEach(c4), n4.includes(o.TEXTURE) && o5.listTextures().forEach(c4), n4.includes(o.ACCESSOR) && o5.listAccessors().forEach(c4), n4.includes(o.BUFFER) && o5.listBuffers().forEach(c4), Object.keys(a5).length) {
      const t6 = Object.keys(a5).map((t7) => `${t7} (${a5[t7]})`).join(", ");
      r4.info(`prune: Removed types... ${t6}`);
    } else
      r4.info("prune: No unused properties found.");
    function c4(t6) {
      t6.listParents().filter((t7) => !(t7 instanceof nt || t7 instanceof k)).length || (t6.dispose(), u2(t6));
    }
    function l4(t6, e4) {
      t6.getLinks().map((t7) => t7.getParent()).filter((t7) => t7.propertyType === e4).forEach(c4);
    }
    function u2(t6) {
      a5[t6.propertyType] = a5[t6.propertyType] || 0, a5[t6.propertyType]++;
    }
    r4.debug("prune: Complete.");
  };
};
var rt3 = { animations: true, meshes: true };
var ot3 = (t4 = rt3) => {
  const n4 = z3({}, rt3, t4);
  return async (t5) => {
    const s4 = t5.getLogger();
    n4.meshes !== false && function(t6, e4, n5) {
      const s5 = new Set(t6.getRoot().listBuffers().map((t7) => t7.getURI()));
      t6.getRoot().listMeshes().forEach((r4, o5) => {
        if (Array.isArray(n5.meshes) && !n5.meshes.includes(r4.getName()))
          return void e4.debug(`partition: Skipping mesh #${o5} with name "${r4.getName()}".`);
        e4.debug(`partition: Creating buffer for mesh "${r4.getName()}".`);
        const i3 = t6.createBuffer(r4.getName()).setURI(it3(r4.getName() || "mesh", s5));
        r4.listPrimitives().forEach((t7) => {
          const e5 = t7.getIndices();
          e5 && e5.setBuffer(i3), t7.listAttributes().forEach((t8) => t8.setBuffer(i3)), t7.listTargets().forEach((t8) => {
            t8.listAttributes().forEach((t9) => t9.setBuffer(i3));
          });
        });
      });
    }(t5, s4, n4), n4.animations !== false && function(t6, e4, n5) {
      const s5 = new Set(t6.getRoot().listBuffers().map((t7) => t7.getURI()));
      t6.getRoot().listAnimations().forEach((r4, o5) => {
        if (Array.isArray(n5.animations) && !n5.animations.includes(r4.getName()))
          return void e4.debug(`partition: Skipping animation #${o5} with name "${r4.getName()}".`);
        e4.debug(`partition: Creating buffer for animation "${r4.getName()}".`);
        const i3 = t6.createBuffer(r4.getName()).setURI(it3(r4.getName() || "animation", s5));
        r4.listSamplers().forEach((t7) => {
          const e5 = t7.getInput(), n6 = t7.getOutput();
          e5 && e5.setBuffer(i3), n6 && n6.setBuffer(i3);
        });
      });
    }(t5, s4, n4), n4.meshes || n4.animations || s4.warn("partition: Select animations or meshes to create a partition."), await t5.transform(st3({ propertyTypes: [o.BUFFER] })), s4.debug("partition: Complete.");
  };
};
function it3(t4, e4) {
  let n4 = `${t4}.bin`, s4 = 1;
  for (; e4.has(n4); )
    n4 = `${t4}_${s4++}.bin`;
  return n4;
}
var at2 = [Int8Array, Int16Array, Int32Array];
var { TRANSLATION: ct2, ROTATION: lt3, SCALE: gt2, WEIGHTS: ut2 } = k.TargetPath;
var ft = [ct2, lt3, gt2];
var pt3 = { pattern: /.*/, quantizationVolume: "mesh", quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeColor: 8, quantizeWeight: 8, quantizeGeneric: 12 };
var mt = (t4 = pt3) => {
  const n4 = z3({}, pt3, t4);
  return async (t5) => {
    const s4 = t5.getLogger(), r4 = t5.getRoot();
    let o5;
    t5.createExtension(ot2).setRequired(true), n4.quantizationVolume === "scene" && (o5 = ht2(function(t6) {
      const e4 = t6[0];
      for (const n5 of t6)
        min(e4.min, e4.min, n5.min), max(e4.max, e4.max, n5.max);
      return e4;
    }(r4.listMeshes().map(St))));
    for (const e4 of t5.getRoot().listMeshes()) {
      n4.quantizationVolume === "mesh" && (o5 = ht2(St(e4))), o5 && n4.pattern.test("POSITION") && At(t5, e4, o5);
      for (const s5 of e4.listPrimitives()) {
        dt(t5, s5, o5, n4);
        for (const e5 of s5.listTargets())
          dt(t5, e5, o5, n4);
      }
    }
    await t5.transform(st3({ propertyTypes: [o.ACCESSOR, o.SKIN] }), k3({ propertyTypes: [o.ACCESSOR] })), s4.debug("quantize: Complete.");
  };
};
function dt(t4, e4, n4, s4) {
  const o5 = t4.getLogger();
  for (const t5 of e4.listSemantics()) {
    if (!s4.pattern.test(t5))
      continue;
    const i3 = e4.getAttribute(t5), { bits: a5, ctor: c4 } = Et(t5, i3, o5, s4);
    if (!c4)
      continue;
    if (a5 < 8 || a5 > 16)
      throw new Error("quantize: Requires bits = 8\u201316.");
    if (i3.getComponentSize() <= a5 / 8)
      continue;
    const l4 = i3.clone();
    if (t5 === "POSITION") {
      const t6 = n4.scale, s5 = [];
      e4 instanceof tt ? invert(s5, bt(n4)) : fromScaling(s5, [1 / t6, 1 / t6, 1 / t6]);
      for (let t7 = 0, e5 = [0, 0, 0], n5 = l4.getCount(); t7 < n5; t7++)
        l4.getElement(t7, e5), l4.setElement(t7, transformMat4(e5, e5, s5));
    }
    Tt(l4, c4, a5), e4.swap(i3, l4);
  }
  if (e4.getAttribute("WEIGHTS_0") && function(t5) {
    const e5 = t5.getAttribute("POSITION").getCount(), n5 = [];
    for (let s5 = 0; s5 < e5; s5++) {
      let e6, r4 = 0, o6 = Infinity, i3 = -1, a5 = null, c4 = 0;
      for (; e6 = t5.getAttribute("WEIGHTS_" + c4++); ) {
        e6.getElement(s5, n5);
        for (let t6 = 0; t6 < n5.length; t6++)
          r4 += n5[t6], n5[t6] > 0 && n5[t6] < o6 && (a5 = e6, o6 = n5[t6], i3 = t6);
      }
      a5 && r4 !== 1 && (a5.getElement(s5, n5), n5[i3] += 1 - r4, a5.setElement(s5, n5));
    }
  }(e4), e4 instanceof tt && e4.getIndices() && e4.listAttributes().length && e4.listAttributes()[0].getCount() < 65535) {
    const t5 = e4.getIndices();
    t5.setArray(new Uint16Array(t5.getArray()));
  }
}
function ht2(t4) {
  const { min: e4, max: n4 } = t4, s4 = Math.max((n4[0] - e4[0]) / 2, (n4[1] - e4[1]) / 2, (n4[2] - e4[2]) / 2);
  return { offset: [e4[0] + (n4[0] - e4[0]) / 2, e4[1] + (n4[1] - e4[1]) / 2, e4[2] + (n4[2] - e4[2]) / 2], scale: s4 };
}
function At(t4, e4, n4) {
  const s4 = bt(n4);
  for (const r4 of e4.listParents())
    if (r4 instanceof X) {
      const o5 = r4.listParents().filter((t5) => t5 instanceof k), i3 = o5.some((t5) => ft.includes(t5.getTargetPath())), a5 = r4.listChildren().length > 0;
      if (r4.getSkin()) {
        r4.setSkin(yt2(r4.getSkin(), n4));
        continue;
      }
      let c4;
      a5 || i3 ? (c4 = t4.createNode("").setMesh(e4), r4.addChild(c4).setMesh(null), o5.filter((t5) => t5.getTargetPath() === ut2).forEach((t5) => t5.setTargetNode(c4))) : c4 = r4;
      const l4 = c4.getMatrix();
      multiply(l4, l4, s4), c4.setMatrix(l4);
    }
}
function yt2(t4, e4) {
  t4 = t4.clone();
  const n4 = bt(e4), s4 = t4.getInverseBindMatrices().clone(), r4 = [];
  for (let t5 = 0, e5 = s4.getCount(); t5 < e5; t5++)
    s4.getElement(t5, r4), multiply(r4, r4, n4), s4.setElement(t5, r4);
  return t4.setInverseBindMatrices(s4);
}
function Tt(t4, e4, n4) {
  const s4 = new e4(t4.getArray().length), r4 = at2.includes(e4) ? 1 : 0, o5 = n4 - r4, i3 = 8 * e4.BYTES_PER_ELEMENT - r4, a5 = Math.pow(2, o5) - 1, c4 = i3 - o5, l4 = 2 * o5 - i3;
  for (let e5 = 0, n5 = 0, r5 = []; e5 < t4.getCount(); e5++) {
    t4.getElement(e5, r5);
    for (let t5 = 0; t5 < r5.length; t5++) {
      let e6 = Math.round(Math.abs(r5[t5]) * a5);
      e6 = e6 << c4 | e6 >> l4, s4[n5++] = e6 * Math.sign(r5[t5]);
    }
  }
  t4.setArray(s4).setNormalized(true);
}
function Et(t4, e4, n4, s4) {
  const r4 = e4.getMinNormalized([]), o5 = e4.getMaxNormalized([]);
  let i3, a5;
  if (t4 === "POSITION")
    i3 = s4.quantizePosition, a5 = i3 <= 8 ? Int8Array : Int16Array;
  else if (t4 === "NORMAL" || t4 === "TANGENT")
    i3 = s4.quantizeNormal, a5 = i3 <= 8 ? Int8Array : Int16Array;
  else if (t4.startsWith("COLOR_"))
    i3 = s4.quantizeColor, a5 = i3 <= 8 ? Uint8Array : Uint16Array;
  else if (t4.startsWith("TEXCOORD_")) {
    if (r4.some((t5) => t5 < 0) || o5.some((t5) => t5 > 1))
      return n4.warn(`quantize: Skipping ${t4}; out of [0,1] range.`), { bits: -1 };
    i3 = s4.quantizeTexcoord, a5 = i3 <= 8 ? Uint8Array : Uint16Array;
  } else {
    if (t4.startsWith("JOINTS_"))
      return i3 = Math.max(...e4.getMax([])) <= 255 ? 8 : 16, a5 = i3 <= 8 ? Uint8Array : Uint16Array, e4.getComponentSize() > i3 / 8 && e4.setArray(new a5(e4.getArray())), { bits: -1 };
    if (t4.startsWith("WEIGHTS_")) {
      if (r4.some((t5) => t5 < 0) || o5.some((t5) => t5 > 1))
        return n4.warn(`quantize: Skipping ${t4}; out of [0,1] range.`), { bits: -1 };
      i3 = s4.quantizeWeight, a5 = i3 <= 8 ? Uint8Array : Uint16Array;
    } else {
      if (!t4.startsWith("_"))
        throw new Error(`quantize: Unexpected semantic, "${t4}".`);
      if (r4.some((t5) => t5 < -1) || o5.some((t5) => t5 > 1))
        return n4.warn(`quantize: Skipping ${t4}; out of [-1,1] range.`), { bits: -1 };
      i3 = s4.quantizeGeneric, a5 = a5 = r4.some((t5) => t5 < 0) ? i3 <= 8 ? Int8Array : Int16Array : i3 <= 8 ? Uint8Array : Uint16Array;
    }
  }
  return { bits: i3, ctor: a5 };
}
function St(t4) {
  const e4 = [], n4 = [];
  for (const s5 of t4.listPrimitives()) {
    const t5 = s5.getAttribute("POSITION");
    t5 && e4.push(t5);
    for (const t6 of s5.listTargets()) {
      const e5 = t6.getAttribute("POSITION");
      e5 && n4.push(e5);
    }
  }
  if (e4.length === 0)
    throw new Error('quantize: Missing "POSITION" attribute.');
  const s4 = It(e4, 3);
  if (n4.length > 0) {
    const { min: t5, max: e5 } = It(n4, 3);
    min(s4.min, s4.min, min(t5, scale(t5, t5, 2), [0, 0, 0])), max(s4.max, s4.max, max(e5, scale(e5, e5, 2), [0, 0, 0]));
  }
  return s4;
}
function It(t4, e4) {
  const n4 = new Array(e4).fill(Infinity), s4 = new Array(e4).fill(-Infinity), r4 = [], o5 = [];
  for (const i3 of t4) {
    i3.getMinNormalized(r4), i3.getMaxNormalized(o5);
    for (let t5 = 0; t5 < e4; t5++)
      n4[t5] = Math.min(n4[t5], r4[t5]), s4[t5] = Math.max(s4[t5], o5[t5]);
  }
  return { min: n4, max: s4 };
}
function bt(t4) {
  return fromRotationTranslationScale([], [0, 0, 0, 1], t4.offset, [t4.scale, t4.scale, t4.scale]);
}
var wt2 = { tolerance: 1e-4 };
var Nt = (t4 = wt2) => {
  const e4 = z3({}, wt2, t4);
  return (t5) => {
    const n4 = new Set(), r4 = t5.getRoot().listAccessors().length, o5 = t5.getLogger();
    let i3 = false;
    for (const s4 of t5.getRoot().listAnimations()) {
      const t6 = new Set();
      for (const e5 of s4.listChannels())
        e5.getSampler() && e5.getTargetPath() === "weights" && t6.add(e5.getSampler());
      for (const r5 of s4.listSamplers())
        t6.has(r5) ? i3 = true : r5.getInterpolation() !== "STEP" && r5.getInterpolation() !== "LINEAR" || (n4.add(r5.getInput()), n4.add(r5.getOutput()), Mt(r5, e4));
    }
    for (const t6 of Array.from(n4.values()))
      t6.listParents().some((t7) => !(t7 instanceof nt)) || t6.dispose();
    t5.getRoot().listAccessors().length > r4 && o5.warn('resample: Resampling required copying accessors, some of which may be duplicates. Consider using "dedup" to consolidate any duplicates.'), i3 && o5.warn("resample: Skipped optimizing morph target keyframes, not yet supported."), o5.debug("resample: Complete.");
  };
};
function Mt(t4, e4) {
  const n4 = t4.getInput().clone(), s4 = t4.getOutput().clone(), r4 = e4.tolerance, o5 = n4.getCount() - 1, i3 = [];
  let a5 = 1;
  for (let e5 = 1; e5 < o5; ++e5) {
    const o6 = n4.getScalar(e5), l4 = n4.getScalar(e5 - 1), g2 = n4.getScalar(e5 + 1), u2 = (o6 - l4) / (g2 - l4);
    let f3 = false;
    if (o6 !== g2 && (e5 !== 1 || o6 !== n4.getScalar(0)))
      for (let n5 = 0; n5 < s4.getElementSize(); n5++) {
        const o7 = s4.getElement(e5, i3)[n5], a6 = s4.getElement(e5 - 1, i3)[n5], l5 = s4.getElement(e5 + 1, i3)[n5];
        if (t4.getInterpolation() === "LINEAR") {
          if (Math.abs(o7 - (a6 * (1 - (c4 = u2)) + l5 * c4)) > r4) {
            f3 = true;
            break;
          }
        } else if (t4.getInterpolation() === "STEP" && (o7 !== a6 || o7 !== l5)) {
          f3 = true;
          break;
        }
      }
    f3 && (e5 !== a5 && (n4.setScalar(a5, n4.getScalar(e5)), s4.setElement(a5, s4.getElement(e5, i3))), a5++);
  }
  var c4;
  o5 > 0 && (n4.setScalar(a5, n4.getScalar(o5)), s4.setElement(a5, s4.getElement(o5, i3)), a5++), a5 !== n4.getCount() ? (n4.setArray(n4.getArray().slice(0, a5)), s4.setArray(s4.getArray().slice(0, a5 * s4.getElementSize())), t4.setInput(n4), t4.setOutput(s4)) : (n4.dispose(), s4.dispose());
}
var Rt = { target: "size" };
function Ct(t4 = Rt) {
  const n4 = z3({}, Rt, t4), s4 = n4.encoder;
  return async (t5) => {
    const o5 = t5.getLogger();
    await s4.ready;
    const i3 = function(t6) {
      const e4 = new G3(), n5 = new Map(), s5 = new G3();
      for (const r4 of t6.getRoot().listMeshes())
        for (const t7 of r4.listPrimitives()) {
          const r5 = t7.getIndices();
          if (r5) {
            n5.set(r5, t7.getMode());
            for (const n6 of xt(t7))
              e4.add(r5, n6), s5.add(n6, t7);
          }
        }
      return { indicesToAttributes: e4, indicesToMode: n5, attributesToPrimitives: s5 };
    }(t5);
    for (const t6 of i3.indicesToAttributes.keys()) {
      const e4 = t6.clone();
      let o6 = e4.getArray().slice();
      o6 instanceof Uint32Array || (o6 = new Uint32Array(o6));
      const [a5, c4] = s4.reorderMesh(o6, i3.indicesToMode.get(t6) === tt.Mode.TRIANGLES, n4.target === "size");
      e4.setArray(c4 <= 65534 ? new Uint16Array(o6) : o6);
      for (const n5 of i3.indicesToAttributes.get(t6)) {
        const s5 = n5.clone();
        Ot(s5, a5, c4);
        for (const r4 of i3.attributesToPrimitives.get(n5))
          if (r4.getIndices() === t6 && r4.swap(t6, e4), r4.getIndices() === e4) {
            r4.swap(n5, s5);
            for (const t7 of r4.listTargets())
              t7.swap(n5, s5);
          }
      }
    }
    await t5.transform(st3({ propertyTypes: [o.ACCESSOR] })), i3.indicesToAttributes.size ? o5.debug("reorder: Complete.") : o5.warn("reorder: No qualifying primitives found; may need to weld first.");
  };
}
function Ot(t4, e4, n4) {
  const s4 = t4.getElementSize(), r4 = t4.getCount(), o5 = t4.getArray(), i3 = o5.slice(0, n4 * s4);
  for (let t5 = 0; t5 < r4; t5++)
    for (let n5 = 0; n5 < s4; n5++)
      i3[e4[t5] * s4 + n5] = o5[t5 * s4 + n5];
  t4.setArray(i3);
}
function xt(t4) {
  const e4 = [];
  for (const n4 of t4.listAttributes())
    e4.push(n4);
  for (const n4 of t4.listTargets())
    for (const t5 of n4.listAttributes())
      e4.push(t5);
  return Array.from(new Set(e4));
}
var Pt = { name: "", fps: 10, pattern: /.*/, sort: true };
function zt(t4 = Pt) {
  const e4 = z3({}, Pt, t4);
  return (t5) => {
    const n4 = t5.getLogger(), s4 = t5.getRoot(), r4 = e4.fps, o5 = s4.listNodes().filter((t6) => t6.getName().match(e4.pattern));
    e4.sort && o5.sort((t6, e5) => t6.getName() > e5.getName() ? 1 : -1);
    const i3 = t5.createAnimation(e4.name), a5 = s4.listBuffers()[0];
    o5.forEach((e5, n5) => {
      let s5, c4;
      n5 === 0 ? (s5 = [n5 / r4, (n5 + 1) / r4], c4 = [1, 1, 1, 0, 0, 0]) : n5 === o5.length - 1 ? (s5 = [(n5 - 1) / r4, n5 / r4], c4 = [0, 0, 0, 1, 1, 1]) : (s5 = [(n5 - 1) / r4, n5 / r4, (n5 + 1) / r4], c4 = [0, 0, 0, 1, 1, 1, 0, 0, 0]);
      const l4 = t5.createAccessor().setArray(new Float32Array(s5)).setBuffer(a5), p3 = t5.createAccessor().setArray(new Float32Array(c4)).setBuffer(a5).setType(P.Type.VEC3), m2 = t5.createAnimationSampler().setInterpolation(F.Interpolation.STEP).setInput(l4).setOutput(p3), d = t5.createAnimationChannel().setTargetNode(e5).setTargetPath(k.TargetPath.SCALE).setSampler(m2);
      i3.addSampler(m2).addChannel(d);
    }), n4.debug("sequence: Complete.");
  };
}
var Lt = { overwrite: false };
function $t(t4 = Lt) {
  if (!t4.generateTangents)
    throw new Error('tangents: generateTangents callback required \u2014 install "mikktspace".');
  const e4 = z3({}, Lt, t4);
  return (t5) => {
    const n4 = t5.getLogger(), s4 = new Map(), r4 = new Map();
    let o5 = 0;
    for (const i3 of t5.getRoot().listMeshes()) {
      const a5 = i3.getName(), c4 = i3.listPrimitives();
      for (let i4 = 0; i4 < c4.length; i4++) {
        const l4 = c4[i4];
        if (!_t(l4, n4, a5, i4, e4.overwrite))
          continue;
        const g2 = vt2(l4), u2 = l4.getAttribute("POSITION").getArray(), f3 = l4.getAttribute("NORMAL").getArray(), m2 = l4.getAttribute(g2).getArray(), d = s4.get(u2) || C();
        s4.set(u2, d);
        const h3 = s4.get(f3) || C();
        s4.set(f3, h3);
        const A3 = s4.get(m2) || C();
        s4.set(m2, A3);
        const y3 = l4.getAttribute("TANGENT");
        y3 && y3.listParents().length === 2 && y3.dispose();
        const T2 = `${d}|${h3}|${A3}`;
        let E2 = r4.get(T2);
        if (E2) {
          n4.debug(`tangents: Found cache for primitive ${i4} of mesh "${a5}".`), l4.setAttribute("TANGENT", E2), o5++;
          continue;
        }
        n4.debug(`tangents: Generating for primitive ${i4} of mesh "${a5}".`);
        const S3 = l4.getAttribute("POSITION").getBuffer(), I3 = e4.generateTangents(u2 instanceof Float32Array ? u2 : new Float32Array(u2), f3 instanceof Float32Array ? f3 : new Float32Array(f3), m2 instanceof Float32Array ? m2 : new Float32Array(m2));
        for (let t6 = 3; t6 < I3.length; t6 += 4)
          I3[t6] *= -1;
        E2 = t5.createAccessor().setBuffer(S3).setArray(I3).setType("VEC4"), l4.setAttribute("TANGENT", E2), r4.set(T2, E2), o5++;
      }
    }
    o5 ? n4.debug("tangents: Complete.") : n4.warn("tangents: No qualifying primitives found. See debug output.");
  };
}
function vt2(t4) {
  const e4 = t4.getMaterial();
  if (!e4)
    return "TEXCOORD_0";
  const n4 = e4.getNormalTextureInfo();
  if (!n4)
    return "TEXCOORD_0";
  const s4 = `TEXCOORD_${n4.getTexCoord()}`;
  return t4.getAttribute(s4) ? s4 : "TEXCOORD_0";
}
function _t(t4, e4, n4, s4, o5) {
  return t4.getMode() === tt.Mode.TRIANGLES && t4.getAttribute("POSITION") && t4.getAttribute("NORMAL") && t4.getAttribute("TEXCOORD_0") ? t4.getAttribute("TANGENT") && !o5 ? (e4.debug(`tangents: Skipping primitive ${s4} of mesh "${n4}": TANGENT found.`), false) : !t4.getIndices() || (e4.warn(`tangents: Skipping primitive ${s4} of mesh "${n4}": primitives must be unwelded.`), false) : (e4.debug(`tangents: Skipping primitive ${s4} of mesh "${n4}": primitives must have attributes=[POSITION, NORMAL, TEXCOORD_0] and mode=TRIANGLES.`), false);
}
var kt = "textureResize";
var Ft;
!function(t4) {
  t4.LANCZOS3 = "lanczos3", t4.LANCZOS2 = "lanczos2";
}(Ft || (Ft = {}));
var Ut = { size: [2048, 2048], filter: Ft.LANCZOS3, pattern: null };
function Gt(t4 = Ut) {
  const e4 = z3({}, Ut, t4);
  return async (t5) => {
    const n4 = t5.getLogger();
    for (const s4 of t5.getRoot().listTextures()) {
      const t6 = s4.getName(), r4 = s4.getURI();
      if (e4.pattern && !e4.pattern.test(t6) && !e4.pattern.test(r4))
        continue;
      if (s4.getMimeType() !== "image/png" && s4.getMimeType() !== "image/jpeg") {
        n4.warn(`Skipping unsupported texture type, "${s4.getMimeType()}".`);
        continue;
      }
      const [o5, i3] = e4.size, [a5, c4] = s4.getSize();
      if (a5 <= o5 && c4 <= i3) {
        n4.debug(`${kt}: Skipping "${r4 || t6}", within size range.`);
        continue;
      }
      let l4 = a5, g2 = c4;
      l4 > o5 && (g2 = Math.floor(g2 * (o5 / l4)), l4 = o5), g2 > i3 && (l4 = Math.floor(l4 * (i3 / g2)), g2 = i3);
      const u2 = new Uint8Array(s4.getImage()), f3 = await i(u2, s4.getMimeType()), p3 = (0, import_ndarray3.default)(new Uint8Array(l4 * g2 * 4), [l4, g2, 4]);
      n4.debug(`${kt}: Resizing "${r4 || t6}", ${f3.shape} \u2192 ${p3.shape}...`);
      try {
        e4.filter === Ft.LANCZOS3 ? h2(f3, p3) : c3(f3, p3);
      } catch (e5) {
        if (e5 instanceof Error) {
          n4.warn(`${kt}: Failed to resize "${r4 || t6}": "${e5.message}".`);
          continue;
        }
        throw e5;
      }
      s4.setImage((await o2(p3, s4.getMimeType())).buffer);
    }
    n4.debug(`${kt}: Complete.`);
  };
}
var qt = {};
function Bt(t4 = qt) {
  return z3({}, qt, t4), (t5) => {
    const e4 = t5.getLogger(), n4 = new Map();
    for (const s4 of t5.getRoot().listMeshes())
      for (const t6 of s4.listPrimitives()) {
        const s5 = t6.getIndices();
        if (s5) {
          for (const r4 of t6.listAttributes())
            t6.swap(r4, Vt(r4, s5, e4, n4)), r4.listParents().length === 1 && r4.dispose();
          for (const r4 of t6.listTargets())
            for (const t7 of r4.listAttributes())
              r4.swap(t7, Vt(t7, s5, e4, n4)), t7.listParents().length === 1 && t7.dispose();
          t6.setIndices(null), s5.listParents().length === 1 && s5.dispose();
        }
      }
    e4.debug("unweld: Complete.");
  };
}
function Vt(t4, e4, n4, s4) {
  if (s4.has(t4) && s4.get(t4).has(e4))
    return n4.debug(`unweld: Cache hit for reused attribute, "${t4.getName()}".`), s4.get(t4).get(e4);
  const r4 = t4.clone(), o5 = t4.getArray().constructor;
  r4.setArray(new o5(e4.getCount() * t4.getElementSize()));
  const i3 = [];
  for (let n5 = 0; n5 < e4.getCount(); n5++)
    r4.setElement(n5, t4.getElement(e4.getScalar(n5), i3));
  return s4.has(t4) || s4.set(t4, new Map()), s4.get(t4).set(e4, r4), r4;
}
var Wt = { tolerance: 1e-4 };
function Dt(t4 = Wt) {
  const e4 = z3({}, Wt, t4);
  return (t5) => {
    const n4 = t5.getLogger();
    for (const n5 of t5.getRoot().listMeshes())
      for (const s4 of n5.listPrimitives())
        e4.tolerance === 0 ? Xt(t5, s4) : Ht(t5, s4, e4);
    n4.debug("weld: Complete.");
  };
}
function Xt(t4, e4) {
  if (e4.getIndices())
    return;
  const n4 = e4.listAttributes()[0], s4 = n4.getCount(), r4 = n4.getBuffer(), o5 = s4 <= 65534 ? new Uint16Array(3 * U4(e4)) : new Uint32Array(3 * U4(e4)), i3 = t4.createAccessor().setBuffer(r4).setType(P.Type.SCALAR).setArray(o5);
  for (let t5 = 0; t5 < i3.getCount(); t5++)
    i3.setScalar(t5, t5);
  e4.setIndices(i3);
}
function Ht(t4, e4, n4) {
  const s4 = Math.max(n4.tolerance, Number.EPSILON), r4 = Math.log10(1 / s4), o5 = Math.pow(10, r4), i3 = {}, a5 = e4.getIndices(), c4 = a5 ? a5.getCount() : e4.listAttributes()[0].getCount(), l4 = new Map();
  e4.listAttributes().forEach((t5) => l4.set(t5, [])), e4.listTargets().forEach((t5) => {
    t5.listAttributes().forEach((t6) => l4.set(t6, []));
  });
  const g2 = [];
  let u2 = 0;
  for (let t5 = 0; t5 < c4; t5++) {
    const n5 = a5 ? a5.getScalar(t5) : t5, s5 = [], r5 = [];
    for (const t6 of e4.listAttributes())
      for (let e5 = 0; e5 < t6.getElementSize(); e5++)
        s5.push(~~(t6.getElement(n5, r5)[e5] * o5));
    const c5 = s5.join("|");
    if (c5 in i3)
      g2.push(i3[c5]);
    else {
      for (const t6 of e4.listAttributes())
        l4.get(t6).push(t6.getElement(n5, []));
      for (const t6 of e4.listTargets())
        for (const e5 of t6.listAttributes())
          l4.get(e5).push(e5.getElement(n5, []));
      i3[c5] = u2, g2.push(u2), u2++;
    }
  }
  const f3 = e4.listAttributes()[0].getCount(), p3 = l4.get(e4.getAttribute("POSITION")).length;
  t4.getLogger().debug(`weld: ${f3} \u2192 ${p3} vertices.`);
  for (const t5 of e4.listAttributes())
    Kt(e4, t5, l4.get(t5)), t5.listParents().length === 1 && t5.dispose();
  for (const t5 of e4.listTargets())
    for (const e5 of t5.listAttributes())
      Kt(t5, e5, l4.get(e5)), e5.listParents().length === 1 && e5.dispose();
  if (a5) {
    const t5 = jt(a5.getArray(), g2.length);
    t5.set(g2), e4.setIndices(a5.clone().setArray(t5)), a5.listParents().length === 1 && a5.dispose();
  } else {
    const n5 = f3 <= 65534 ? new Uint16Array(g2) : new Uint32Array(g2);
    e4.setIndices(t4.createAccessor().setArray(n5));
  }
}
function jt(t4, e4) {
  return new (0, t4.constructor)(e4);
}
function Kt(t4, e4, n4) {
  const s4 = n4.length * e4.getElementSize(), r4 = jt(e4.getArray(), s4), o5 = e4.clone().setArray(r4);
  for (let t5 = 0; t5 < n4.length; t5++)
    o5.setElement(t5, n4[t5]);
  t4.swap(e4, o5);
}
export {
  pt3 as QUANTIZE_DEFAULTS,
  Ut as TEXTURE_RESIZE_DEFAULTS,
  Ft as TextureResizeFilter,
  w as bounds,
  $2 as center,
  v3 as colorspace,
  k3 as dedup,
  q3 as inspect,
  J3 as instance,
  et3 as metalRough,
  ot3 as partition,
  st3 as prune,
  mt as quantize,
  Ct as reorder,
  Nt as resample,
  zt as sequence,
  $t as tangents,
  Gt as textureResize,
  Bt as unweld,
  Dt as weld
};
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
