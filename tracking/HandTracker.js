import leapjs from "leapjs";

import Signal from "../utils/Signal.js";

import Matrix3 from "../math/Matrix3.js";
import Matrix4 from "../math/Matrix4.js";
import Vector3 from "../math/Vector3.js";
import Quaternion from "../math/Quaternion.js";

const BONE_PREFIXES = [
  "carp",
  "mcp",
  "pip",
  "dip"
];

class Hand {
  constructor() {
    this._bones = new Array(5).fill().map(value => new Array(4).fill().map(value => new Quaternion()));
    this._boneMatrices = new Array(5).fill().map(value => new Array(4).fill().map(value => new Matrix4()));

    this._position = new Vector3();
    this._rotation = new Quaternion();

    this._vector3A = new Vector3();
    this._vector3B = new Vector3();
    this._vector3C = new Vector3();

    this._matrix3 = new Matrix3();

    this._quaternion = new Quaternion();
  }

  get position() {
    return this._position;
  }

  get rotation() {
    return this._rotation;
  }

  get bones() {
    return this._bones;
  }

  update(handData, pointablesData) {
    this.position.set(handData.palmPosition[0], handData.palmPosition[1], handData.palmPosition[2]);

    this._vector3A.copy(handData.direction);
    this._vector3A.negate();
    this._vector3B.copy(handData.palmNormal);
    this._vector3B.negate();
    this._vector3C.cross(this._vector3B, this._vector3A);

    this._matrix3.fromBasis(this._vector3C, this._vector3B, this._vector3A);

    this.rotation.fromMatrix3(this._matrix3);

    for (let pointableData of pointablesData) {
      if (pointableData.handId !== handData.id) {
        continue;
      }

      this._quaternion.copy(this.rotation);

      for (let i = 0; i < 4; i++) {
        let bone = this.bones[pointableData.type][i];

        let basis = pointableData.bones[i].basis;

        // Global
        let position = pointableData[`${BONE_PREFIXES[i]}Position`];
        this._boneMatrices[pointableData.type][i].set(
          basis[0][0], basis[0][1], basis[0][2], 0,
          basis[1][0], basis[1][1], basis[1][2], 0,
          basis[2][0], basis[2][1], basis[2][2], 0,
          position[0] * .02, (position[1] - 100) * .02, position[2] * .02, 1
        );

        // Local
        this._matrix3.fromBasis(basis[0], basis[1], basis[2]);

        bone.fromMatrix3(this._matrix3);

        this._quaternion.invert();

        bone.multiply(this._quaternion, bone);

        this._quaternion.invert();
        this._quaternion.multiply(bone);
      }
    }
  }
}

class HandTracker {
  constructor() {
      let controller = new leapjs.Controller({
        host: "127.0.0.1"
      });

      this.hands = new Map();

      this.frame = null;

      this.onHandAdd = new Signal();

      controller.on("frame", this.onFrame.bind(this));

      controller.connect();
  }

  onFrame(frame) {
    this.frame = frame.data;

    if(!this.frame) {
      return;
    }

    for(let handData of this.frame.hands) {
      let hand = this.hands.get(handData.id);
      if(!hand) {
        hand = new Hand();
        this.hands.set(handData.id, hand);
        this.onHandAdd.dispatch(hand);
      }
      hand.update(handData, frame.pointables);
    }
  }
}

export default new HandTracker();
