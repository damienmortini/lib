import Signal from '@damienmortini/core/util/Signal.js';

export default class Graph {
  #name;
  #content = '';
  onChange = new Signal();
  #data = new Proxy({}, {
    get: (target, property) => {
      return target[property];
    },
    set: (target, property, value) => {
      target[property] = value;
      this.#onDataChange(property, value);
      return true;
    },
  });

  #ready;

  constructor(name) {
    this.#name = name;

    this.#ready = Promise.resolve();
  }

  // async connect() {
  //   const remoteRTCPeerConnection = new RTCPeerConnection()
  //   remoteRTCPeerConnection.ondatachannel = (event) => {
  //     const dataChannel = event.channel
  //     dataChannel.onmessage = (event) => console.log(event.data)
  //     dataChannel.send('Hi back!')
  //   }

  //   const rtcPeerConnection = new RTCPeerConnection()
  //   const dataChannel = rtcPeerConnection.createDataChannel(`graphdatachannel:${this.#name}`)
  //   dataChannel.onopen = function (event) {
  //     dataChannel.send('Hi World!')
  //   }
  //   dataChannel.onclose = function (event) {
  //     console.log('close')
  //   }
  //   dataChannel.onmessage = function (event) {
  //     console.log(event.data)
  //   }

  //   rtcPeerConnection.addEventListener('icecandidate', async (event) => {
  //     await remoteRTCPeerConnection.addIceCandidate(event.candidate)
  //   })
  //   remoteRTCPeerConnection.addEventListener('icecandidate', async (event) => {
  //     await rtcPeerConnection.addIceCandidate(event.candidate)
  //   })

  //   const rtcPeerConnectionOffer = await rtcPeerConnection.createOffer()
  //   rtcPeerConnection.setLocalDescription(rtcPeerConnectionOffer)
  //   await remoteRTCPeerConnection.setRemoteDescription(rtcPeerConnectionOffer)

  //   const rtcPeerConnectionAnswer = await remoteRTCPeerConnection.createAnswer()
  //   await remoteRTCPeerConnection.setLocalDescription(rtcPeerConnectionAnswer)
  //   await rtcPeerConnection.setRemoteDescription(rtcPeerConnectionAnswer)
  // }

  async loadData(dataURL) {
    const readyPromise = async () => {
      Object.assign(this, await fetch(dataURL).then(response => response.json()));
    };
    this.#ready = readyPromise();
  }

  async #onDataChange(id, value) {
    await this.#ready;
    this.onChange.dispatch({
      type: 'data',
      data: {
        id,
        value,
      },
    });
  }

  add(id, value) {
    this.#data[id] = value;
  }

  get content() {
    return this.#content;
  }

  set content(value) {
    this.#content = value;
    this.onChange.dispatch({
      type: 'content',
      data: value,
    });
  }
}
