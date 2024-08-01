/* three.js extension for EXT_meshopt_compression; requires three.js r118 */
/* loader.register(function (parser) { return new EXT_meshopt_compression(parser, MeshoptDecoder); }); */
const EXT_meshopt_compression = (function () {
  function EXT_meshopt_compression(parser, decoder) {
    this.name = 'EXT_meshopt_compression';
    this._parser = parser;
    this._decoder = decoder;
  }

  EXT_meshopt_compression.prototype.loadBufferView = function (index) {
    	const bufferView = this._parser.json.bufferViews[index];

    if (bufferView.extensions && bufferView.extensions[this.name]) {
      const extensionDef = bufferView.extensions[this.name];

      const buffer = this._parser.getDependency('buffer', extensionDef.buffer);
      const decoder = this._decoder;

      return Promise.all([buffer, decoder.ready]).then(function (res) {
            	const byteOffset = extensionDef.byteOffset || 0;
            	const byteLength = extensionDef.byteLength || 0;

            	const count = extensionDef.count;
            	const stride = extensionDef.byteStride;

            	const result = new ArrayBuffer(count * stride);
            	const source = new Uint8Array(res[0], byteOffset, byteLength);

            	decoder.decodeGltfBuffer(new Uint8Array(result), count, stride, source, extensionDef.mode, extensionDef.filter);
            	return result;
      });
    }
    else {
      return null;
    }
  };

  return EXT_meshopt_compression;
}());

/* three.js uses JS modules exclusively since r124 */
export { EXT_meshopt_compression };
