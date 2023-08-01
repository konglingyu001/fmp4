class Ws {
  constructor(wsname, wsurl, timeout = 1000 * 5) {
    this.$ws = null
    this.wsname = wsname
    this.wsurl = wsurl
    this.lockReturn = false
    this.timeout = timeout
    this.timeoutObj = null
    this.timeoutNum = null
    this.serverTimeoutObj = null
  }
  initWebSocket() {
    this.$ws = new WebSocket(this.wsurl);
    this.$ws.onopen = this.wsOpen.bind(this);
    this.$ws.onclose = this.wsClose.bind(this);
    this.$ws.onmessage = this.wsMsg.bind(this);
    this.$ws.onerror = this.wsError.bind(this);
  }
  closeWebSocket() {
    this.$ws.close()
    this.$ws = null
    clearTimeout(this.timeoutObj);
    clearTimeout(this.timeoutNum);
    clearTimeout(this.serverTimeoutObj);
    this.lockReturn = false
    this.timeoutObj = null
    this.timeoutNum = null
    this.serverTimeoutObj = null
  }
  // sendMsg(msg) {
  //   console.log(msg)
  //   this.$ws.send(msg)
  // }
  wsOpen(e) {
    this.startWsHeartbeat();
    console.log(this.wsname + ' ws success')
  }
  wsClose(e) {
    console.log(e, this.wsname + ' ws close')
  }
  wsMsg(msg) {
    this.resetHeartbeat();
  }
  wsError(err) {
    console.log(err, this.wsname + ' ws error');
    this.reconnect()
  }
  reconnect() {
    if (this.lockReturn) {
      return;
    }
    this.lockReturn = true;
    this.timeoutNum && clearTimeout(this.timeoutNum);
    this.timeoutNum = setTimeout(() => {
      this.initWebSocket(this.wsname, this.wsurl);
      this.lockReturn = false;
    }, this.timeout);
  }
  startWsHeartbeat() {
    this.timeoutObj && clearTimeout(this.timeoutObj);
    this.serverTimeoutObj && clearTimeout(this.serverTimeoutObj);
    this.timeoutObj = setInterval(() => {
      if (this.$ws.readyState != 1) {
        this.reconnect()
      } else {
        let date = new Date();
        this.$ws.send(`发送心跳给后端${date}`)
      }
    }, this.timeout);
  }
  resetHeartbeat() {
    clearTimeout(this.timeoutObj);
    clearTimeout(this.serverTimeoutObj);
    this.startWsHeartbeat()
  }
}
//抛出websocket对象
export default Ws

