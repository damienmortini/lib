import leapjs from "leapjs";

import Signal from "../utils/Signal.js";

import Matrix3 from "../math/Matrix3.js";
import Matrix4 from "../math/Matrix4.js";
import Vector3 from "../math/Vector3.js";
import Quaternion from "../math/Quaternion.js";

const POSE_ROTATIONS = new Map([["arm",[0.0926913321018219,0.3053490221500397,-0.017239512875676155,0.9475616216659546]],["wrist",[0.03710794821381569,0.028223423287272453,-0.04135271534323692,0.9980563521385193]],["thumb0",[0.02040507271885872,0.3115042448043823,0.5274629592895508,0.79014652967453]],["thumb1",[-0.027378182858228683,0.27906230092048645,0.5453220009803772,0.7899355888366699]],["thumb2",[0.1263851374387741,0.3795504868030548,0.4808257520198822,0.780239999294281]],["index0",[-0.03344293311238289,0.11473120748996735,-0.02962813340127468,0.9923912882804871]],["index1",[-0.10567563772201538,0.06956322491168976,-0.0231220293790102,0.991694986820221]],["index2",[-0.1320752650499344,0.07015474885702133,-0.0212593674659729,0.988525390625]],["index3",[-0.1521591991186142,0.0705728605389595,-0.019827699288725853,0.9856337904930115]],["middle0",[-0.03993868827819824,0.04314754530787468,-0.11250335723161697,0.9919103980064392]],["middle1",[-0.11390332877635956,-0.02363399602472782,-0.11102284491062164,0.9869861006736755]],["middle2",[-0.14237332344055176,-0.02041628398001194,-0.11165937036275864,0.9832828640937805]],["middle3",[-0.1640862077474594,-0.017941679805517197,-0.11208360642194748,0.9798935055732727]],["ring0",[-0.03660893440246582,-0.03369523212313652,-0.14624859392642975,0.9879958033561707]],["ring1",[-0.10531647503376007,-0.053472504019737244,-0.14890576899051666,0.9817718863487244]],["ring2",[-0.13192689418792725,-0.04941089078783989,-0.15030251443386078,0.9785515069961548]],["ring3",[-0.1522718071937561,-0.04627085104584694,-0.15129853785037994,0.9755926132202148]],["pinky0",[-0.0036756149493157864,-0.10289819538593292,-0.22150446474552155,0.9697084426879883]],["pinky1",[-0.06244660168886185,-0.14137904345989227,-0.2282661646604538,0.9612528085708618]],["pinky2",[-0.08293642103672028,-0.1364777684211731,-0.23123009502887726,0.9597020149230957]],["pinky3",[-0.09880337119102478,-0.1326335221529007,-0.2334562987089157,0.9581985473632812]]]);

const POSE_ROTATIONS_INVERT = new Map();
for (let [key, value] of POSE_ROTATIONS) {
  POSE_ROTATIONS_INVERT.set(key, new Quaternion().copy(value).invert());
}

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

    this._quaternionA = new Quaternion();
    this._quaternionB = new Quaternion();
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
    if(this.type === HandTracker.LEFT) {
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

    // arm
    let armBone = this.bones.get("arm");
    armBone.globalPosition.copy(handData.elbow);
    this._setRotationFromBasis(armBone.globalRotation, handData.armBasis);
    armBone.position.copy(this.position).add(handData.elbow);
    armBone.rotation.copy(armBone.globalRotation);

    // wrist
    let wristBone = this.bones.get("wrist");
    wristBone.globalPosition.copy(handData.wrist);
    wristBone.globalRotation.copy(this.rotation);
    this._quaternionA.copy(armBone.globalRotation);
    this._quaternionA.invert();
    wristBone.rotation.multiply(this._quaternionA, wristBone.globalRotation);

    for (let pointableData of pointablesData) {
      if (pointableData.handId !== handData.id) {
        continue;
      }

      this._quaternionA.copy(wristBone.globalRotation);

      for (let i = 0; i < 4; i++) {
        let dataBoneIndex = i;

        if(!pointableData.type) {
          if(i === 3) {
            continue;
          }
          dataBoneIndex++;
        }

        let boneName = `${HandTracker.FINGER_NAMES[pointableData.type]}${i}`;
        let bone = this.bones.get(boneName);
        let basis = pointableData.bones[dataBoneIndex].basis;

        bone.globalPosition.copy(pointableData[`${BONE_PREFIXES[dataBoneIndex]}Position`]);

        this._setRotationFromBasis(bone.globalRotation, basis);

        this._quaternionB.copy(POSE_ROTATIONS_INVERT.get(boneName));
        if(this.type === HandTracker.LEFT) {
          this._quaternionB.y *= -1;
          this._quaternionB.z *= -1;
        }
        this._quaternionB.multiply(bone.globalRotation, this._quaternionB);

        this._quaternionA.invert();

        bone.rotation.multiply(this._quaternionA, this._quaternionB);

        this._quaternionA.copy(this._quaternionB);
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

  static get LEFT() {
    return "left"
  }

  static get RIGHT() {
    return "right"
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
