"use strict";
import MP4Box from './mp4box';
import { Message } from 'element-ui';
class WsPlayer {
    constructor(videoId, wsUrl, options = {}) {
        this.videoId = videoId;
        this.wsUrl = wsUrl;
        this.video = null;
        this.videoUrl = '';
        this.frameQueue = [];//存放视频帧数据的队列
        this.mediasource = null;//由 HTMLMediaElement 对象播放的媒体资源
        this.sourcebuffer = null;//被传入 HTMLMediaElement 的媒体块
        this.ws = null;
        this.lockReconnect = false;//重连锁定
        this.isReConnect = options.isReConnect || false;//是否重连
        this.isReConnectCount = options.isReConnectCount || false;//是否有限制重连次数
        this.reConnectCount = options.reConnectCount || 5;//重连次数
        this.heartBeatTime = options.heartBeatTime || 1000 * 3;//心跳间隔
        this.heartBeatTimer = null;//心跳定时器
        this.reConnectTime = options.reConnectTime || 1000 * 1;//重连间隔
        this.reConnectTimer = null;//重连定时器
        this.onOpen = options.onOpen || function (event) { };
        this.onMessage = options.onMessage || function (event) { };
        this.onError = options.onError || function (event) { };
        this.onClose = options.onClose || function (event) { };
        this.onSourceOpen = options.onSourceOpen || function (event) { };
        this.onDelta = options.onDelta || function (event) { };
        this.open();
    }

    open() {
        // console.time(this.videoId + '=====画面加载时间');

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
            video.src = this.videoUrl = URL.createObjectURL(this.mediasource);


            var test = !!(document.createElement('video').canPlayType('video/mp4; codecs="' + codecs.join(', ') + '"'));
            if (!test) {
                Message('暂不支持解码' + 'video/mp4; codecs="' + codecs.join(', ') + '"')
                this.close()
                return
            }

            let pre_pos = 0;
            this.mediasource.onsourceopen = () => {
                // console.timeEnd(this.videoId + '=====画面加载时间');
                this.onSourceOpen(this.videoId)
                this.sourcebuffer = this.mediasource.addSourceBuffer('video/mp4; codecs="' + codecs.join(', ') + '"');
                this.sourcebuffer.onupdateend = () => {
                    let pos = video.currentTime;
                    if (video.buffered.length > 0) {
                        let start = video.buffered.start(video.buffered.length - 1);//获取当前buffered值(缓冲区起始)
                        let end = video.buffered.end(video.buffered.length - 1);//获取当前buffered值(缓冲区末尾)
                        let delta = end - video.currentTime; //获取buffered与当前播放位置的差值
                        // console.log('====> \n start:' + start + '\n end:' + end + '\n delta:' + delta + '\n pos:' + pos)
                        // console.log(' delta:' + delta+" video.playbackRate="+video.playbackRate+" time="+new Date().getTime())

                        this.onDelta(this.videoId, delta)
                        if (delta > 0 && delta <= 0.2) {
                            video.playbackRate = 0.8;
                        }
                        if (delta > 0.2 && delta <= 0.5) {
                            video.playbackRate = 1;
                        }
                        if (delta > 0.5 && delta <= 1) {
                            // console.warn(this.videoId + '==========>追帧' + '\n' + '====>  start:' + start + ', end:' + end + ', delta:' + delta + ', pos:' + pos)
                            video.playbackRate = 1.2;
                            // video.currentTime = end - 0.3;
                        }
                        if (delta > 1 || end < pos || pos < start) {
                            // console.warn(this.videoId + '==========>跳帧'  + '\n' + '====>  start:' + start + ', end:' + end + ', delta:' + delta + ', pos:' + pos)
                            video.currentTime = start;
                        }


                        /* // console.log("pos=" + pos + ",start=" + start + ",end=" + end);
                        if (pos < start) {
                            // console.log("set video.currentTime pos=" + pos + ",start=" + start + ",end=" + end);
                            video.currentTime = start;
                        }

                        if (pos > end) {
                            // console.warn("chase frame pos=" + pos + ",start=" + start + ",end=" + end);
                            video.currentTime = start;
                        }

                        if (pos - pre_pos != 0 && end - pos > 0.5) {
                            // console.log("set end video.currentTime pos=" + pos + ",start=" + start + ",end=" + end);
                            video.currentTime = end;
                        } */

                        for (let i = 0; i < video.buffered.length - 1; i++) {
                            let prestart = video.buffered.start(i);
                            let preend = video.buffered.end(i);
                            if (!this.sourcebuffer.updating) {
                                this.sourcebuffer.remove(prestart, preend);
                            }
                        }

                        if (pos - start > 1 && !this.sourcebuffer.updating) {
                            // console.warn("remove start pos=" + pos + ",start=" + start + ",end=" + end);
                            this.sourcebuffer.remove(0, pos - 0.5);
                        }

                        if (end - pos > 1 && !this.sourcebuffer.updating) {
                            // console.warn("remove end pos=" + pos + ",start=" + start + ",end=" + end);
                            this.sourcebuffer.remove(0, end - 0.5);
                        }
                    }
                    pre_pos = pos;
                }
            }
        };
        this.ws.onopen = (e) => {
            console.log('WebSocket连接已打开');
            this.startHeartbeat();
            this.onOpen(this.videoId)
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
            if (this.isReConnect) this.reconnect()
            this.onError(this.videoId)
        };
        this.ws.onclose = (e) => {
            console.log('WebSocket连接已关闭', e);
            this.onClose(this.videoId)
            this.clearn()
        };
    }
    close() {
        this.ws && this.ws.close();
        this.ws = null
        this.heartBeatTimer && clearInterval(this.heartBeatTimer);
        this.reConnectTimer && clearTimeout(this.reConnectTimer);
        this.frameQueue = []
        if (this.sourcebuffer) this.sourcebuffer.onupdateend = null

        this.sourcebuffer = null;
        if (this.mediasource) this.mediasource.onsourceopen = null

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
            for (let i = sourceBuffers.length - 1; i >= 0; i--) {
                try {
                    const sourceBuffer = sourceBuffers[i];
                    buffersToRemove.push(sourceBuffer);
                    sourceBuffer.abort()
                    sourceBuffer.remove(0, sourceBuffer.buffered.end(0))
                } catch (error) {
                    // console.error(`Error while removing buffer: ${error}`);
                }
            }
            for (const buffer of buffersToRemove) {
                this.mediasource.removeSourceBuffer(buffer);
            }
            this.mediasource.endOfStream()
        }
        if (this.video) {
            URL.revokeObjectURL(this.videoUrl)
            this.video.src = ''
        }
    }
}

export default WsPlayer