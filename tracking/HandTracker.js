import Signal from "../util/Signal.js";

import Matrix3 from "../math/Matrix3.js";
import Matrix4 from "../math/Matrix4.js";
import Vector3 from "../math/Vector3.js";
import Quaternion from "../math/Quaternion.js";

const POSE_ROTATIONS = new Map([["arm",[0.03994310274720192,-0.0028264787979424,-0.022547172382473946,0.9989434480667114]],["wrist",[0.0925811156630516,-0.004638756159693003,-0.022358590736985207,0.9954432845115662]],["thumb0",[0.0334097295999527,0.20816311240196228,0.5577129125595093,0.8028126955032349]],["thumb1",[-0.06781750917434692,0.136372372508049,0.579463541507721,0.8006405234336853]],["thumb2",[-0.09646790474653244,0.11551765352487564,0.5839787125587463,0.7976955771446228]],["index0",[0.020071914419531822,0.08010177314281464,-0.008545073680579662,0.9965479373931885]],["index1",[-0.07293573021888733,-0.02498115971684456,-0.012978448532521725,0.9969393014907837]],["index2",[-0.10219679772853851,-0.024589041247963905,-0.013706853613257408,0.9943657517433167]],["index3",[-0.12416544556617737,-0.02427986077964306,-0.014247368089854717,0.9918621182441711]],["middle0",[0.017675092443823814,0.013121144846081734,-0.09538412094116211,0.9951971173286438]],["middle1",[-0.08500247448682785,-0.0841149091720581,-0.10502290725708008,0.9872536659240723]],["middle2",[-0.1179598867893219,-0.0805569440126419,-0.10777652263641357,0.9838598966598511]],["middle3",[-0.14267799258232117,-0.07781946659088135,-0.10976916551589966,0.9805804491043091]],["ring0",[0.023223329335451126,-0.06151062250137329,-0.13319510221481323,0.9889064431190491]],["ring1",[-0.08652251958847046,-0.0801236480474472,-0.14326082170009613,0.9826343655586243]],["ring2",[-0.18756048381328583,-0.06489696353673935,-0.15077069401741028,0.9684408903121948]],["ring3",[-0.2616284191608429,-0.05308603495359421,-0.15532325208187103,0.951108455657959]],["pinky0",[0.058883022516965866,-0.1252625435590744,-0.2111794501543045,0.9675976634025574]],["pinky1",[-0.0496651716530323,-0.13437682390213013,-0.22841496765613556,0.9629656076431274]],["pinky2",[-0.14788271486759186,-0.11031337082386017,-0.24095967411994934,0.9528378844261169]],["pinky3",[-0.22021634876728058,-0.09158992767333984,-0.24868015944957733,0.9387620687484741]]]);

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
    armBone.position.copy(handData.elbow);
    armBone.rotation.copy(armBone.globalRotation);

    // wrist
    let wristBone = this.bones.get("wrist");
    wristBone.globalPosition.copy(handData.wrist);
    wristBone.globalRotation.copy(this.rotation);
    this._quaternionA.copy(armBone.globalRotation);
    this._quaternionA.invert();
    wristBone.rotation.multiply(this._quaternionA, wristBone.globalRotation);

    // fingers
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
        let basis = pointableData.bases[dataBoneIndex];

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

    this.position.scale(this._positionScale);

    // let poseRotations = [];
    // for (let [key, bone] of this.bones) {
    //   poseRotations.push([key, [bone.globalRotation.x, bone.globalRotation.y, bone.globalRotation.z, bone.globalRotation.w]]);
    // }
    // console.log(JSON.stringify(poseRotations));
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
    host = "localhost",
    hmd = false,
    background = false,
    positionScale = 1,
    workerBasePath,
    autoUpdate = true
  } = {}) {
    this._stringData = null;
    this.e = null;

    this.onUpdate = new Signal();

    this._webSocket = new WebSocket(`wss://${host}:6437/v6.json`);

    this._webSocket.addEventListener("open", (e) => {
      this._webSocket.send(JSON.stringify({enableGestures: false}));
      this.hmd = hmd;
      this.background = background;
    });

    this._webSocket.addEventListener("message", (e) => {
      this._stringData = e.data;
      if(autoUpdate) {
        this.update();
      }
    });

    if(workerBasePath) {
      this.worker = new Worker(`${workerBasePath}handTrackerWorker.js`);
      this.worker.onmessage = (e) => {
        this.updateData(e.data);
      }
    }

    this._hands = new Map();

    this._positionScale = positionScale;

    this.onHandAdd = new Signal();
    this.onHandRemove = new Signal();
  }

  get hands() {
    return this._hands;
  }

  set background(value) {
    this._webSocket.send(JSON.stringify({background: value}));
  }

  set hmd(value) {
    this._hmd = value;
    this._webSocket.send(JSON.stringify({optimizeHMD: this._hmd}));
  }

  get hmd() {
    return this._hmd;
  }

  update() {
    if(!this._stringData) {
      return;
    }
    if(this.worker) {
      this.worker.postMessage(this._stringData);
    } else {
      this.updateData(JSON.parse(this._stringData));
    }

    this.onUpdate.dispatch();
  }

  updateData(data) {
    if(!data || !data.hands) {
      return;
    }

    for(let handData of data.hands) {
      let hand = this._hands.get(handData.id);
      if(!hand) {
        hand = new Hand(handData, {positionScale: this._positionScale});
        this._hands.set(handData.id, hand);
        this.onHandAdd.dispatch(hand);
      }
      hand.update(handData, data.pointables);
    }

    for (let hand of this.hands.values()) {
      let remove = true;
      for (let handData of data.hands) {
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
