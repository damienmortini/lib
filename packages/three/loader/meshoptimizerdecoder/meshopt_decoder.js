// This file is part of meshoptimizer library and is distributed under the terms of MIT License.
// Copyright (C) 2016-2020, by Arseny Kapoulkine (arseny.kapoulkine@gmail.com)
const MeshoptDecoder = (function () {
  'use strict'

  // Built with emcc (Emscripten gcc/clang-like replacement) 1.39.18 (a3beeb0d6c9825bd1757d03677e817d819949a77)
  // Built from meshoptimizer 0.14
  const wasm_base = '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pAK1BEHLCgBZCdWAEqREAKCIJALCa3QBpAK2BIC8cWAEqREAKCLJMRLCBAECFZlAECFr9zAfJHfREMGXAMCb9HIXALRVSFMAL1BBHKCgFZRNGaALCFJAKCa3QBpANCgBZAL1BFHKCgBZCOWqRNALCGJAKCa3QBpAL1BGHKCgBZCfWANqRNALCEJAKCa3QBpAL1BEHKCgBZCdWANqRNALCIJAKCa3QBpAL2BIC8cWANqRNALCLJMRVCBANCFZlANCFr9zAfJHfRNMGXAGCG6IXABATCFWJHLAQ87FBALAE87FGALAN87FISFMABATCGWJHLAQjGBALANjGNALAEjGIMAOCXlAcCEWJHLAQjGIALAEjGBAOAICGWJAQjGBAOCXlAcCFJCbZCEWJHLANjGBALAEjGIAOAICFJHICbZCGWJAEjGBAOCXlAcCGJCbZCEWJHEAQjGBAEANjGIAOAIAS9FASCb6qJHECbZCGWJANjGBAcCEJRcAEAM9FAMCb6qJMRIAmCFJRmAcCbZRcAICbZRIATCEJHTAF9JQBMMCBC99AVAt6yRcMAOCoFJ8kBAcM9SFGaCUS8oGBHFABCEJC98ZHGJRBGXAGCF9OCBABAFuyQBAB8/BCTW9LIXABTE9FQFMCUSABjGBAFbMCUNC8wjGBCaM/GGFGaABCUFJHFCaJCgF86BBABCgF86BBAFC9+JCgF86BBABCgF86BFAFC99JCgF86BBABCgF86BGAFC98JCgF86BBABCgF86BEABCBABlCEZHFJHBCajGBABCUFAFlC98ZHGJHFC98JCajGBGXAGCV9JQBABCajGNABCajGIAFC94JCajGBAFCWJCajGBAGC8Z9JQBABCajGiABCajGPABCajGTABCajGSAFC9wJCajGBAFC9sJCajGBAFC9oJCajGBAFC9kJCajGBAGABCIZCiqHGlHFCA9JQBABAGJRBEXABha83EiABha83ETABha83ENABha83EBABCAJRBAFC9gJHFC8f9LQBMMM/LSFba8jBCU/EBlHT8kBGaC9+AGCFJAI9LQBpCaAE2BBC+gF9HQBpATAEAIJHbAGlAGTFRMCUoBAG9uC/wgBZHICUGAICUG9JyRtAECFJRVGXEXASAF9PQFAtAFASlASAtJAF9JyRQGXGXAG9FIXAVRISFMAQCbJHEC9wZRmAECIrCEJCGrRYCBRfAVRcEXAbAclAY9JIXCBRVSEMAcAYJRICBRVCBREAmIXEXAbAIlCi9JQIAMCU/CBJAEJRNGXGXGXGXGXAcAECKrJ2BBAECErCKZrCEZCFlfEFGEBMANhB83EBANhB83ENSEMANAI2BIAI2BBHKCKrHLALCE6HLy86BBANAICIJALJHL2BBAKCIrCEZHOAOCE6HOy86BFANALAOJHL2BBAKCGrCEZHOAOCE6HOy86BGANALAOJHL2BBAKCEZHKAKCE6HKy86BEANALAKJHL2BBAI2BFHKCKrHOAOCE6HOy86BIANALAOJHL2BBAKCIrCEZHOAOCE6HOy86BLANALAOJHL2BBAKCGrCEZHOAOCE6HOy86BKANALAOJHL2BBAKCEZHKAKCE6HKy86BOANALAKJHL2BBAI2BGHKCKrHOAOCE6HOy86BNANALAOJHL2BBAKCIrCEZHOAOCE6HOy86BVANALAOJHL2BBAKCGrCEZHOAOCE6HOy86BcANALAOJHL2BBAKCEZHKAKCE6HKy86BMANALAKJHK2BBAI2BEHICKrHLALCE6HLy86BSANALAKJHK2BBAICIrCEZHLALCE6HLy86BQANALAKJHK2BBAICGrCEZHLALCE6HLy86BfANALAKJHN2BBAICEZHIAICE6HIy86BbAIANJRISGMANAI2BNAI2BBHKCIrHLALCb6HLy86BBANAICNJALJHL2BBAKCbZHKAKCb6HKy86BFANALAKJHK2BBAI2BFHLCIrHOAOCb6HOy86BGANAKAOJHK2BBALCbZHLALCb6HLy86BEANALAKJHK2BBAI2BGHLCIrHOAOCb6HOy86BIANAKAOJHK2BBALCbZHLALCb6HLy86BLANALAKJHK2BBAI2BEHLCIrHOAOCb6HOy86BKANAKAOJHK2BBALCbZHLALCb6HLy86BOANALAKJHK2BBAI2BIHLCIrHOAOCb6HOy86BNANAKAOJHK2BBALCbZHLALCb6HLy86BVANALAKJHK2BBAI2BLHLCIrHOAOCb6HOy86BcANAKAOJHK2BBALCbZHLALCb6HLy86BMANALAKJHK2BBAI2BKHLCIrHOAOCb6HOy86BSANAKAOJHK2BBALCbZHLALCb6HLy86BQANALAKJHK2BBAI2BOHICIrHLALCb6HLy86BfANALAKJHN2BBAICbZHIAICb6HIy86BbAIANJRISFMANAI8pBB83BBANAI8pBN83BNAICTJRIMAECTJHEAm9JQBMMAI9FQGAQIXAMAfJ2BBRcAfREEXAMCUGJAEJAcAMCU/CBJAVJ2BBHcCFrCBAcCFZl9zJHc86BBAGAEJREAVCFJHVAQ9HQBMMAIRcAfCFJHfAG9HQBMMABAGAS9sJAMCUGJAGAQ9sTFpAMAMCUGJAQCaJAG9sJAGTFpAIRVMAQCBAVyASJRSAVQBMC9+SFMCBC99AbAVlAGCAAGCA9Ly6yMRVATCU/EBJ8kBAVMMVFBCUSMG+g9m'
  const wasm_simd = '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'

  // Uses bulk-memory and simd extensions
  const detector = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 3, 2, 0, 0, 5, 3, 1, 0, 1, 12, 1, 0, 10, 22, 2, 12, 0, 65, 0, 65, 0, 65, 0, 252, 10, 0, 0, 11, 7, 0, 65, 0, 253, 15, 26, 11])

  // Used to unpack wasm
  const wasmpack = new Uint8Array([32, 0, 65, 253, 3, 1, 2, 34, 4, 106, 6, 5, 11, 8, 7, 20, 13, 33, 12, 16, 128, 9, 116, 64, 19, 113, 127, 15, 10, 21, 22, 14, 255, 66, 24, 54, 136, 107, 18, 23, 192, 26, 114, 118, 132, 17, 77, 101, 130, 144, 27, 87, 131, 44, 45, 74, 156, 154, 70, 167])

  if (typeof WebAssembly !== 'object') {
    // This module requires WebAssembly to function
    return {
      supported: false,
    }
  }

  let wasm = wasm_base

  if (WebAssembly.validate(detector)) {
    wasm = wasm_simd
    console.log('Warning: meshopt_decoder is using experimental SIMD support')
  }

  let instance; let heap

  const env = {
    emscripten_notify_memory_growth: function (index) {
      heap = new Uint8Array(instance.exports.memory.buffer)
    },
  }

  const promise =
		WebAssembly.instantiate(unpack(wasm), { env })
		    .then(function (result) {
		      instance = result.instance
		      instance.exports._initialize()
		      env.emscripten_notify_memory_growth(0)
		    })

  function unpack(data) {
    const result = new Uint8Array(data.length)
    for (var i = 0; i < data.length; ++i) {
      const ch = data.charCodeAt(i)
      result[i] = ch > 96 ? ch - 71 : ch > 64 ? ch - 65 : ch > 47 ? ch + 4 : ch > 46 ? 63 : 62
    }
    let write = 0
    for (var i = 0; i < data.length; ++i) {
      result[write++] = (result[i] < 60) ? wasmpack[result[i]] : (result[i] - 60) * 64 + result[++i]
    }
    return result.buffer.slice(0, write)
  }

  function decode(fun, target, count, size, source, filter) {
    const sbrk = instance.exports.sbrk
    const count4 = (count + 3) & ~3 // pad for SIMD filter
    const tp = sbrk(count4 * size)
    const sp = sbrk(source.length)
    heap.set(source, sp)
    const res = fun(tp, count, size, sp, source.length)
    if (res == 0 && filter) {
      filter(tp, count4, size)
    }
    target.set(heap.subarray(tp, tp + count * size))
    sbrk(tp - sbrk(0))
    if (res != 0) {
      throw new Error('Malformed buffer data: ' + res)
    }
  }

  const filters = {
    // legacy index-based enums for glTF
    0: '',
    1: 'meshopt_decodeFilterOct',
    2: 'meshopt_decodeFilterQuat',
    3: 'meshopt_decodeFilterExp',
    // string-based enums for glTF
    NONE: '',
    OCTAHEDRAL: 'meshopt_decodeFilterOct',
    QUATERNION: 'meshopt_decodeFilterQuat',
    EXPONENTIAL: 'meshopt_decodeFilterExp',
  }

  const decoders = {
    // legacy index-based enums for glTF
    0: 'meshopt_decodeVertexBuffer',
    1: 'meshopt_decodeIndexBuffer',
    2: 'meshopt_decodeIndexSequence',
    // string-based enums for glTF
    ATTRIBUTES: 'meshopt_decodeVertexBuffer',
    TRIANGLES: 'meshopt_decodeIndexBuffer',
    INDICES: 'meshopt_decodeIndexSequence',
  }

  return {
    ready: promise,
    supported: true,
    decodeVertexBuffer: function (target, count, size, source, filter) {
      decode(instance.exports.meshopt_decodeVertexBuffer, target, count, size, source, instance.exports[filters[filter]])
    },
    decodeIndexBuffer: function (target, count, size, source) {
      decode(instance.exports.meshopt_decodeIndexBuffer, target, count, size, source)
    },
    decodeIndexSequence: function (target, count, size, source) {
      decode(instance.exports.meshopt_decodeIndexSequence, target, count, size, source)
    },
    decodeGltfBuffer: function (target, count, size, source, mode, filter) {
      decode(instance.exports[decoders[mode]], target, count, size, source, instance.exports[filters[filter]])
    },
  }
})()

if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = MeshoptDecoder
} else if (typeof define === 'function' && define['amd']) {
  define([], function () {
    return MeshoptDecoder
  })
} else if (typeof exports === 'object') {
  exports['MeshoptDecoder'] = MeshoptDecoder
} else {
  (typeof self !== 'undefined' ? self : this).MeshoptDecoder = MeshoptDecoder
}
