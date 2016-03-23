export default class FaceTracker {
  constructor(input) {
    this.tracker = new clm.tracker();
    console.log(pModel);
    this.tracker.init(pModel);
    // this.tracker.start(input);
  }

  draw(context) {
    this.tracker.draw(context.canvas);
  }
}
