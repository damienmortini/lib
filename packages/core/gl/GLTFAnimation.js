import { threshold } from '../math/Math.js';

const NODES_NEEDING_MATRIX_UPDATE = new Set();

export default class GLTFAnimation {
  constructor({
    data,
  }) {
    this.name = data.name;
    this.channels = data.channels;
    this.samplers = data.samplers;

    this._duration = 0;

    for (const channel of this.channels) {
      this._duration = Math.max(this._duration, channel.sampler.input[channel.sampler.input.length - 1]);
    }

    this.currentTime = 0;
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
    NODES_NEEDING_MATRIX_UPDATE.clear();

    for (const channel of this.channels) {
      const node = channel.target.node;
      const inputArray = channel.sampler.input;
      const outputArray = channel.sampler.output;
      let nextIndex = 0;
      const time = Math.min(this._currentTime, inputArray[inputArray.length - 1]);
      while (time > inputArray[nextIndex]) {
        nextIndex++;
      }
      const previousIndex = !nextIndex ? 0 : nextIndex - 1;
      const alpha = threshold(inputArray[previousIndex], inputArray[nextIndex], this._currentTime);
      if (channel.target.path === 'translation' || channel.target.path === 'scale') {
        const previousValue = outputArray.subarray(previousIndex * 3, previousIndex * 3 + 3);
        const nextValue = outputArray.subarray(nextIndex * 3, nextIndex * 3 + 3);
        node[channel.target.path].copy(previousValue).lerp(nextValue, alpha);
        NODES_NEEDING_MATRIX_UPDATE.add(node);
      } else if (channel.target.path === 'rotation') {
        const previousValue = outputArray.subarray(previousIndex * 4, previousIndex * 4 + 4);
        const nextValue = outputArray.subarray(nextIndex * 4, nextIndex * 4 + 4);
        node.rotation.copy(previousValue).slerp(nextValue, alpha);
        NODES_NEEDING_MATRIX_UPDATE.add(node);
      } else if (channel.target.path === 'weights') {
        const length = node.weights.length;
        const previousValue = outputArray.subarray(previousIndex * length, previousIndex * length + length);
        const nextValue = outputArray.subarray(nextIndex * length, nextIndex * length + length);
        for (let index = 0; index < node.weights.length; index++) {
          node.weights[index] = previousValue[index] + (nextValue[index] - previousValue[index]) * alpha;
        }
      }
    }

    for (const node of NODES_NEEDING_MATRIX_UPDATE) {
      if (node.matrix) node.matrix.fromTranslationRotationScale(node.translation, node.rotation, node.scale);
    }
  }
}
