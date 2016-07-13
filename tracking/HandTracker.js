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

class Bone {
  constructor() {
    this.position = new Vector3();
    this.rotation = new Quaternion();
    this.globalPosition = new Vector3();
    this.globalRotation = new Quaternion();
  }
}

class Hand {
  constructor(handData, {positionScale = 1} = {}) {
    this.type = handData.type;
    this.id = handData.id;

    this._positionScale = positionScale;

    this._bones = new Map([
      ["arm", new Bone()],
      ["wrist", new Bone()]
    ]);

    for (let [i, fingerName] of HandTracker.FINGER_NAMES.entries()) {
      let l = fingerName === HandTracker.THUMB ? 3 : 4;
      for (let j = 0; j < l; j++) {
        let bone = new Bone();
        this._bones.set(`${fingerName}${j}`, bone);
      }
    }

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

  _setRotationFromBasis(rotation, basis) {
    this._vector3A.copy(basis[0]);
    if(this.type === "left") {
      this._vector3A.negate();
    }
    this._matrix3.fromBasis(this._vector3A, basis[1], basis[2]);

    rotation.fromMatrix3(this._matrix3);
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

    // wrist
    let wristBone = this.bones.get("wrist");
    wristBone.globalPosition.copy(handData.wrist);
    // wristBone.position.copy(wristBone.globalPosition).subtract(this.position);
    wristBone.globalRotation.copy(this.rotation);
    wristBone.rotation.copy(this.rotation);

    // arm
    let armBone = this.bones.get("arm");
    armBone.globalPosition.copy(handData.elbow);
    this._setRotationFromBasis(armBone.globalRotation, handData.armBasis);
    // armBone.position.copy(armBone.globalPosition).subtract(wristBone.position);
    armBone.position.copy(handData.elbow);
    armBone.rotation.copy(armBone.globalRotation);
    // this._quaternion.copy(this.rotation).invert();
    // armBone.rotation.copy(armBone.globalRotation).multiply(this._quaternion);

    for (let pointableData of pointablesData) {
      if (pointableData.handId !== handData.id) {
        continue;
      }

      this._quaternion.copy(this.rotation);

      for (let i = 0; i < 4; i++) {
        let dataBoneIndex = i;

        if(!pointableData.type) {
          if(i === 3) {
            continue;
          }
          dataBoneIndex++;
        }

        let bone = this.bones.get(`${HandTracker.FINGER_NAMES[pointableData.type]}${i}`);
        let basis = pointableData.bones[dataBoneIndex].basis;

        bone.globalPosition.copy(pointableData[`${BONE_PREFIXES[dataBoneIndex]}Position`]);

        this._setRotationFromBasis(bone.globalRotation, basis);

        this._quaternion.invert();
        bone.rotation.multiply(this._quaternion, bone.globalRotation);

        this._quaternion.copy(bone.globalRotation);
      }
    }

    for (let bone of this.bones.values()) {
      bone.position.scale(this._positionScale);
      bone.globalPosition.scale(this._positionScale);
    }
  }
}

export default class HandTracker {
  static get THUMB() {
    return "thumb"
  }

  static get INDEX() {
    return "index"
  }

  static get MIDDLE() {
    return "middle"
  }

  static get RING() {
    return "ring"
  }

  static get PINKY() {
    return "pinky"
  }

  static get FINGER_NAMES() {
    return [
      HandTracker.THUMB,
      HandTracker.INDEX,
      HandTracker.MIDDLE,
      HandTracker.RING,
      HandTracker.PINKY
    ]
  }

  constructor({
    hmd = false,
    background = false,
    positionScale = 1
  } = {}) {
      let controller = new leapjs.Controller({
        host: "127.0.0.1",
        optimizeHMD: hmd,
        background
      });

      this._hands = new Map();

      this._positionScale = positionScale;

      this.onHandAdd = new Signal();
      this.onHandRemove = new Signal();

      controller.on("frame", this.onFrame.bind(this));

      controller.connect();
  }

  get hands() {
    return this._hands;
  }

  onFrame(frame) {
    if(!frame.data) {
      return;
    }

    for(let handData of frame.data.hands) {
      let hand = this._hands.get(handData.id);
      if(!hand) {
        hand = new Hand(handData, {positionScale: this._positionScale});
        this._hands.set(handData.id, hand);
        this.onHandAdd.dispatch(hand);
      }
      hand.update(handData, frame.pointables);
    }

    for (let hand of this.hands.values()) {
      let remove = true;
      for (let handData of frame.data.hands) {
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
