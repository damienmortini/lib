export default class XRObserver {
  constructor(callback) {
    this._callback = callback;
  }

  async observe(gl) {
    // const session = await navigator.xr.requestSession('inline');
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['local', 'local-floor'],
    });
    const referenceSpace = await session.requestReferenceSpace('local-floor');

    // const sessionEvent = (event) => {
    //   console.log(event);
    // };
    // session.addEventListener('select', sessionEvent);
    // session.addEventListener('selectstart', sessionEvent);
    // session.addEventListener('selectend', sessionEvent);
    // session.addEventListener('squeeze', sessionEvent);
    // session.addEventListener('squeezestart', sessionEvent);
    // session.addEventListener('squeezeend', sessionEvent);
    // session.addEventListener('end', sessionEvent);

    session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });


    // const session = await navigator.xr.requestSession('immersive-vr');
    // console.log(session);
    // const referenceSpace = await session.requestReferenceSpace('local');
    // console.log(referenceSpace);
    // console.log(session.requestAnimationFrame);


    const update = (time, frame) => {
      // if (session.inputSources.length) {
      //   console.log(session.inputSources[0]);
      // }
      const viewerPose = frame.getViewerPose(referenceSpace);
      this._callback({ time, frame, session, viewerPose });
      session.requestAnimationFrame(update);
    };
    session.requestAnimationFrame(update);
  }
}
