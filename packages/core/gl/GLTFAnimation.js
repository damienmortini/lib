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
      const keyDelta = inputArray[nextIndex] - inputArray[previousIndex];
      const alpha = (this._currentTime - inputArray[previousIndex]) / keyDelta || 0;
      const targetArray = node[channel.target.path];
      const length = targetArray.length;

      if (channel.sampler.interpolation === 'CUBICSPLINE') {
        const previousIndexComputed = previousIndex * length * 3;
        const nextIndexComputed = nextIndex * length * 3;

        const tSquare = alpha ** 2;
        const tCubic = alpha ** 3;

        for (let index = 0; index < length; index++) {
          const v0 = outputArray[previousIndexComputed + index + length];
          const a = keyDelta * outputArray[nextIndexComputed + index];
          const b = keyDelta * outputArray[previousIndexComputed + index + 2 * length];
          const v1 = outputArray[nextIndexComputed + index + length];

          targetArray[index] = ((2 * tCubic - 3 * tSquare + 1) * v0) + ((tCubic - 2 * tSquare + alpha) * b) + ((-2 * tCubic + 3 * tSquare) * v1) + ((tCubic - tSquare) * a);
        }
      } else {
        if (channel.target.path === 'rotation') {
          const previousValue = outputArray.subarray(previousIndex * 4, previousIndex * 4 + 4);
          const nextValue = outputArray.subarray(nextIndex * 4, nextIndex * 4 + 4);
          node.rotation.copy(previousValue).slerp(nextValue, alpha);
        } else {
          const previousValue = outputArray.subarray(previousIndex * length, previousIndex * length + length);
          const nextValue = outputArray.subarray(nextIndex * length, nextIndex * length + length);
          for (let index = 0; index < length; index++) {
            targetArray[index] = previousValue[index] + (nextValue[index] - previousValue[index]) * alpha;
          }
        }
      }

      if (channel.target.path === 'translation' || channel.target.path === 'scale' || channel.target.path === 'rotation') {
        NODES_NEEDING_MATRIX_UPDATE.add(node);
      }
    }

    for (const node of NODES_NEEDING_MATRIX_UPDATE) {
      if (node.matrix) node.matrix.fromTranslationRotationScale(node.translation, node.rotation, node.scale);
    }
  }
}
