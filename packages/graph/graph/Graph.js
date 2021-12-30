export default class Graph {
  #content
  #name
  #propertiesMap = new Map()

  constructor(name) {
    this.#name = name
  }

  async connect(remoteRTCPeerConnection) {
    const rtcPeerConnection = new RTCPeerConnection()
    const dataChannel = rtcPeerConnection.createDataChannel(`graphdatachannel:${this.#name}`)
    dataChannel.onopen = function (event) {
      dataChannel.send('Hi World!')
    }
    dataChannel.onclose = function (event) {
      console.log('close')
    }
    dataChannel.onmessage = function (event) {
      console.log(event.data)
    }

    rtcPeerConnection.addEventListener('icecandidate', async (event) => {
      await remoteRTCPeerConnection.addIceCandidate(event.candidate)
    })
    remoteRTCPeerConnection.addEventListener('icecandidate', async (event) => {
      await rtcPeerConnection.addIceCandidate(event.candidate)
    })

    const rtcPeerConnectionOffer = await rtcPeerConnection.createOffer()
    rtcPeerConnection.setLocalDescription(rtcPeerConnectionOffer)
    await remoteRTCPeerConnection.setRemoteDescription(rtcPeerConnectionOffer)

    const rtcPeerConnectionAnswer = await remoteRTCPeerConnection.createAnswer()
    await remoteRTCPeerConnection.setLocalDescription(rtcPeerConnectionAnswer)
    await rtcPeerConnection.setRemoteDescription(rtcPeerConnectionAnswer)
  }

  async loadData(dataURL) {
    this.setData(await fetch(dataURL).then((response) => response.json()))
  }

  setData = (data) => {
    Object.assign(this, data)
  }

  add(id, object, propertyName) {
    this.#propertiesMap.set(id, { object, propertyName })
  }

  #sendContent() {

  }

  get content() {
    return this.#content
  }

  set content(value) {
    this.#content = value
    this.#sendContent()
  }
}
