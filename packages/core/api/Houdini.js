const attributesNameMap = new Map([
  ['P', 'position'],
  ['N', 'normal'],
  ['JOINTS_0', 'skinIndex'],
  ['WEIGHTS_0', 'skinWeight'],
  ['uv', 'uv'],
]);

const attributesTypedArrayMap = new Map([
  ['fpreal32', Float32Array],
  ['int8', Int8Array],
  ['int16', Int16Array],
  ['int32', Int32Array],
]);

export default class Houdini {
  static parsePointsAttributes(data) {
    const attributesData = data[15][1];
    const attributes = new Map();

    for (const attributeData of attributesData) {
      const name = attributesNameMap.get(attributeData[0][5]);
      const size = attributeData[1][7][1];
      const type = attributeData[1][7][3];
      const array = attributeData[1][7][5].flat();

      const AttributeTypedArray = attributesTypedArrayMap.get(type);
      attributes.set(name, {
        size,
        data: new AttributeTypedArray(array),
      });
    };

    return attributes;
  }
}