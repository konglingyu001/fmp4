"use strict";
import MP4Box from 'mp4box';
class WsPlayer {
    constructor(videoName, videoId, wsUrl, heartBeatTime = 1000 * 5, reConnectTime = 1000 * 1, reConnectCount = 5) {
        this.video = null;
        this.videoId = videoId;
        this.videoName = videoName;
        this.frameQueue = [];//存放视频帧数据的队列
        this.mediasource = null;
        this.sourcebuffer = null;
        this.wsUrl = wsUrl;
        this.ws = null;
        this.lockReconnect = false;//重连锁定
        this.isReConnectCount = false;//是否有限制重连次数
        this.reConnectCount = reConnectCount;//重连次数
        this.heartBeatTime = heartBeatTime;//心跳间隔
        this.heartBeatTimer = null;//心跳定时器
        this.reConnectTime = reConnectTime;//重连间隔
        this.reConnectTimer = null;//重连定时器
    }
    open() {
        this.close()
        this.lockReconnect = false
        this.sourcebuffer = null;
        this.ws = new WebSocket(this.wsUrl);
        this.ws.binaryType = 'arraybuffer';
        let firstMessage = true;
        this.mediasource = new MediaSource();

        let demux_moov = (info) => {
            let codecs = [];
            for (let i = 0; i < info.tracks.length; i++) {
                codecs.push(info.tracks[i].codec);
            }
            // console.log(codecs);
            let video = this.video = document.getElementById(this.videoId);
            video.src = URL.createObjectURL(this.mediasource);
            let pre_pos = 0;
            this.mediasource.onsourceopen = () => {
                this.sourcebuffer = this.mediasource.addSourceBuffer('video/mp4; codecs="' + codecs.join(', ') + '"');
                this.sourcebuffer.onupdateend = () => {
                    let pos = video.currentTime;
                    if (video.buffered.length > 0) {
                        let start = video.buffered.start(video.buffered.length - 1);
                        let end = video.buffered.end(video.buffered.length - 1);
                        // console.log("pos=" + pos + ",start=" + start + ",end=" + end);
                        if (pos < start) {
                            // console.log("set video.currentTime pos=" + pos + ",start=" + start + ",end=" + end);
                            video.currentTime = start;
                        }

                        if (pos > end) {
                            // console.warn("chase frame pos=" + pos + ",start=" + start + ",end=" + end);
                            video.currentTime = start;
                        }

                        if (pos - pre_pos != 0 && end - pos > 3) {
                            // console.log("set end video.currentTime pos=" + pos + ",start=" + start + ",end=" + end);
                            video.currentTime = end;
                        }

                        for (let i = 0; i < video.buffered.length - 1; i++) {
                            let prestart = video.buffered.start(i);
                            let preend = video.buffered.end(i);
                            if (!this.sourcebuffer.updating) {
                                this.sourcebuffer.remove(prestart, preend);
                            }
                        }

                        if (pos - start > 10 && !this.sourcebuffer.updating) {
                            // console.warn("remove start pos=" + pos + ",start=" + start + ",end=" + end);
                            this.sourcebuffer.remove(0, pos - 3);
                        }

                        if (end - pos > 10 && !this.sourcebuffer.updating) {
                            // console.warn("remove end pos=" + pos + ",start=" + start + ",end=" + end);
                            this.sourcebuffer.remove(0, end - 3);
                        }
                    }
                    pre_pos = pos;
                }
            }
        };
        this.ws.onopen = (e) => {
            console.log('WebSocket连接已打开');
            this.startHeartbeat();
        }
        this.ws.onmessage = (e) => {
            try {
                if (firstMessage) {
                    firstMessage = false;
                    let moov = e.data;
                    const mp4Box = MP4Box.createFile();
                    mp4Box.onReady = demux_moov;
                    moov.fileStart = 0;
                    mp4Box.appendBuffer(moov);
                }
                this.frameQueue.push(e.data);
                if (!this.sourcebuffer || this.sourcebuffer.updating) {
                    return;
                }
                if (this.frameQueue.length === 1) {
                    this.sourcebuffer.appendBuffer(this.frameQueue.shift());
                } else {
                    let byte_length = 0;
                    for (const qnode of this.frameQueue) {
                        byte_length += qnode.byteLength;
                    }
                    let mp4buf = new Uint8Array(byte_length);
                    let offset = 0;
                    for (const qnode of this.frameQueue) {
                        let frame = new Uint8Array(qnode);
                        mp4buf.set(frame, offset);
                        offset += qnode.byteLength;
                    }
                    this.sourcebuffer.appendBuffer(mp4buf);
                    this.frameQueue.splice(0, this.frameQueue.length);
                }
            } catch (error) {
                this.open()

            }

        };
        this.ws.onerror = (e) => {
            console.log('WebSocket发生错误', e);
            this.reconnect()
        };
        this.ws.onclose = (e) => {
            console.log('WebSocket连接已关闭');

        };
    }
    close() {
        this.clearn()
        this.ws && this.ws.close();
        this.ws = null
        this.heartBeatTimer && clearInterval(this.heartBeatTimer);
        this.reConnectTimer && clearTimeout(this.reConnectTimer);
        this.frameQueue = []
        this.sourcebuffer = null;
        this.mediasource = null;
        this.lockReconnect = true
        this.heartBeatTimer = null
        this.reConnectTimer = null
    }
    reconnect() {
        if (this.lockReconnect) {
            return;
        }
        this.lockReconnect = true;
        this.reConnectTimer && clearTimeout(this.reConnectTimer);
        this.reConnectTimer = setTimeout(() => {
            if (this.isReConnectCount) {
                if (this.reConnectCount < 1) {
                    console.log('WebSocket连接尝试次数超过限制，连接终止');
                    this.close()
                } else {
                    console.log('尝试重连WebSocket');
                    this.open();
                }
                this.reConnectCount--
            } else {
                console.log('尝试重连WebSocket');
                this.open();
            }
        }, this.reConnectTime);
    }
    startHeartbeat() {
        this.heartBeatTimer && clearInterval(this.heartBeatTimer);
        this.heartBeatTimer = setInterval(() => {
            if (this.ws.readyState == 1) {
                // console.log('发送心跳')
                this.ws.send(`ping`)
            }
        }, this.heartBeatTime);
    }
    clearn() {
        if (this.mediasource && this.mediasource.readyState === 'open') {
            const sourceBuffers = this.mediasource.sourceBuffers;
            const buffersToRemove = [];
            for (const sourceBuffer of sourceBuffers) {
                if (sourceBuffer.buffered && sourceBuffer.buffered.end(0)) {
                    sourceBuffer.remove(0, sourceBuffer.buffered.end(0))
                }
                buffersToRemove.push(sourceBuffer);
            }
            for (const buffer of buffersToRemove) {
                this.mediasource.removeSourceBuffer(buffer);
            }
        }
    }
}

export default WsPlayer