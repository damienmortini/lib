const ATTRIBUTE_NAME_MAP = new Map([
  ['POSITION', 'position'],
  ['NORMAL', 'normal'],
  ['TEXCOORD_0', 'uv'],
  ['WEIGHTS_0', 'weight'],
  ['JOINTS_0', 'joint'],
]);

export default class GLTFPrimitive {
  constructor({
    data,
  }) {
    this.attributes = new Map();
    this.indices = data.indices;

    const targetAttributes = new Map();
    if (data.targets) {
      for (let index = 0; index < data.targets.length; index++) {
        const target = data.targets[index];
        if (target.POSITION) targetAttributes.set(`morphTargetPosition${index}`, target.POSITION);
        if (target.NORMAL) targetAttributes.set(`morphTargetNormal${index}`, target.NORMAL);
        if (target.TANGENT) targetAttributes.set(`morphTargetTangent${index}`, target.TANGENT);
      }
    }

    for (const [attributeName, attribute] of [...Object.entries(data.attributes), ...targetAttributes]) {
      this.attributes.set(ATTRIBUTE_NAME_MAP.get(attributeName) ?? attributeName, attribute);
    }
  }
}
