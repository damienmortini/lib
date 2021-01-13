import Matrix4 from '../math/Matrix4.js';
import Quaternion from '../math/Quaternion.js';
import { threshold } from '../math/Math.js';
import Vector3 from '../math/Vector3.js';

const QUATERNION = new Quaternion();
const MATRIX4 = new Matrix4();
const VECTOR3 = new Vector3();

export default class GLTFAnimation {
  constructor({
    data,
  }) {
    this._channels = data.channels;
    this._nodePropertiesMap = new Map();
    this._duration = 0;

    for (const channel of data.channels) {
      let nodeProperties = this._nodePropertiesMap.get(channel.target.node);
      if (!nodeProperties) {
        nodeProperties = {};
        this._nodePropertiesMap.set(channel.target.node, nodeProperties);
      }
      switch (channel.target.path) {
        case 'translation':
        case 'rotation':
        case 'scale':
          if (!nodeProperties.transform) nodeProperties.transform = new Matrix4();
          break;
        case 'weights':
          nodeProperties.weights = new Array(channel.target.node.weights.length).fill(0);
      }
      this._duration = Math.max(this._duration, channel.sampler.input[channel.sampler.input.length - 1]);
    }

    this.currentTime = 0;
  }

  get nodePropertiesMap() {
    return this._nodePropertiesMap;
  }

  get duration() {
    return this._duration;
  }

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(value) {
    if (this._currentTime === value) {
      return;
    }
    this._currentTime = value;

    for (const nodeProperties of this._nodePropertiesMap.values()) {
      if (nodeProperties.transform) nodeProperties.transform.identity();
    }

    for (const channel of this._channels) {
      const nodeProperties = this._nodePropertiesMap.get(channel.target.node);
      const inputArray = channel.sampler.input;
      const outputArray = channel.sampler.output;
      let nextIndex = 0;
      const time = Math.min(this._currentTime, inputArray[inputArray.length - 1]);
      while (time > inputArray[nextIndex]) {
        nextIndex++;
      }
      const previousIndex = !nextIndex ? 0 : nextIndex - 1;
      const alpha = threshold(inputArray[previousIndex], inputArray[nextIndex], this._currentTime);
      if (channel.target.path === 'translation' || channel.target.path === 'rotation' || channel.target.path === 'scale') {
        const transform = nodeProperties.transform;
        if (channel.target.path === 'translation') {
          const previousValue = outputArray.subarray(previousIndex * 3, previousIndex * 3 + 3);
          const nextValue = outputArray.subarray(nextIndex * 3, nextIndex * 3 + 3);
          VECTOR3.copy(previousValue).lerp(nextValue, alpha);
          transform.x = VECTOR3[0];
          transform.y = VECTOR3[1];
          transform.z = VECTOR3[2];
        } else if (channel.target.path === 'rotation') {
          const previousValue = outputArray.subarray(previousIndex * 4, previousIndex * 4 + 4);
          const nextValue = outputArray.subarray(nextIndex * 4, nextIndex * 4 + 4);
          QUATERNION.copy(previousValue).slerp(nextValue, alpha);
          MATRIX4.fromQuaternion(QUATERNION);
          transform.multiply(MATRIX4);
        } else if (channel.target.path === 'scale') {
          const previousValue = outputArray.subarray(previousIndex * 3, previousIndex * 3 + 3);
          const nextValue = outputArray.subarray(nextIndex * 3, nextIndex * 3 + 3);
          VECTOR3.copy(previousValue).lerp(nextValue, alpha);
          transform.scale(VECTOR3);
        }
      } else if (channel.target.path === 'weights') {
        const length = nodeProperties.weights.length;
        const previousValue = outputArray.subarray(previousIndex * length, previousIndex * length + length);
        const nextValue = outputArray.subarray(nextIndex * length, nextIndex * length + length);
        for (let index = 0; index < nodeProperties.weights.length; index++) {
          nodeProperties.weights[index] = previousValue[index] + (nextValue[index] - previousValue[index]) * alpha;
        }
      }
    }
  }
}
