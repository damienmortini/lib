import leapjs from "leapjs";

import Signal from "../utils/Signal.js";

import Matrix3 from "../math/Matrix3.js";
import Matrix4 from "../math/Matrix4.js";
import Vector3 from "../math/Vector3.js";
import Quaternion from "../math/Quaternion.js";

class Hand {
  constructor(handData) {
    this.type = handData.type;
    this.id = handData.id;

    this._bones = new Array(5).fill().map(value => new Array(3).fill().map(value => new Quaternion()));

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
    this.position.set(handData.stabilizedPalmPosition[0], handData.stabilizedPalmPosition[1], handData.stabilizedPalmPosition[2]);

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

      for (let i = 0; i < 3; i++) {
        let bone = this.bones[pointableData.type][i];

        let basis = pointableData.bones[i + 1].basis;

        this._vector3A.copy(basis[0]);
        if(this.type === "left") {
          this._vector3A.negate();
        }
        this._matrix3.fromBasis(this._vector3A, basis[1], basis[2]);

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

      this._hands = new Map();

      this.frame = null;

      this.onHandAdd = new Signal();
      this.onHandRemove = new Signal();

      controller.on("frame", this.onFrame.bind(this));

      controller.connect();
  }

  get hands() {
    return this._hands;
  }

  onFrame(frame) {
    this.frame = frame.data;

    if(!this.frame) {
      return;
    }

    for(let handData of this.frame.hands) {
      let hand = this._hands.get(handData.id);
      if(!hand) {
        hand = new Hand(handData);
        this._hands.set(handData.id, hand);
        this.onHandAdd.dispatch(hand);
      }
      hand.update(handData, frame.pointables);
    }

    for (let hand of this.hands.values()) {
      let remove = true;
      for (let handData of this.frame.hands) {
        if(hand.id === handData.id) {
          remove = false;
        }
      }
      if(remove) {
        this._hands.delete(hand.id);
        this.onHandRemove.dispatch(hand);
      }
    }
  }
}

export default new HandTracker();


// this.fingerBonesHelper = [];
// for (let i = 0; i < 5; i++) {
//   let bones = [];
//   let bonesGlobal = [];
//
//   let currentBone;
//
//   for (let j = 0; j < 3; j++) {
//
//     let bone = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .3), new THREE.MeshNormalMaterial());
//     bone.geometry.translate(0, 0, -.15);
//
//     if(currentBone) {
//       currentBone.add(bone);
//       bone.position.z = -.3;
//     } else {
//       // this.add(bone);
//       bone.position.y = .1;
//       bone.position.z = -.2;
//       bone.position.x = i * .3 - .75;
//     }
//
//     currentBone = bone;
//     bones[j] = bone;
//   }
//
//   this.fingerBonesHelper[i] = bones;
// }
