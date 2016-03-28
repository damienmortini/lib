export default class FaceTracker {
  constructor(input) {
    this.tracker = new clm.tracker();
    this.tracker.init(pModel);
    this.tracker.start(input);
  }

  logFaceOBJ() {
    let str = "";
    for (let vertex of pModel.shapeModel.meanShape) {
      str += `v ${vertex[0]} ${vertex[1]} 0\n`
    }
    for (let indice of pModel.path.vertices.concat([[44, 61, 56],[61, 60, 56],[56, 60, 57],[60, 59, 57],[57, 59, 58],[58, 59, 50] ])) {
      str += `f ${++indice[0]} ${++indice[1]} ${++indice[2]}\n`
    }
    console.log(str);
  }

  get positions() {
    return this.tracker.getCurrentPosition();
  }

  draw(context) {
    this.tracker.draw(context.canvas);
  }
}
