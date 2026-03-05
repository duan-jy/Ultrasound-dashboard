

import { throttle } from 'lodash-es';
let _this = null
export default {
  data() {
    return {
      video: null,
      deviceid: null,
      width: '',
      height: '',
      constraints: null,
      imgsListWidth: '',
      imgsListHeight: '',
      canvas:null,
      ctx: null,
      drawFrameId: null,
      stream:null,
      latestBoxes:[], // 病灶信息
      resultWs:null,
      signalingWs:null,
      pc:null,
      ws:null,
      colorMap:{
        0: '#ef4444', // 红色 - 异常/恶性
        1: '#22c55e', // 绿色 - 正常/良性
        2: '#3b82f6', // 蓝色
        3: '#f59e0b', // 橙色
        4: '#8b5cf6', // 紫色
      },
      
    originalImageSize:{ w: 1280, h: 720 }
    };
  },
  mounted(){
    this.video = document.getElementById('splitbigVideo');
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    // this.init()
    // this.initMp4()
    _this = this
  },
  beforeDestroy() {
    // 组件销毁：停止绘制+解绑事件+关闭摄像头流（关键！）
    cancelAnimationFrame(this.drawFrameId)
    this.unbindEvents()
  },
  methods: {
    initMp4(){
      this.video.onloadedmetadata = () => {
        this.canvas.width = this.video.offsetWidth
        this.canvas.height = this.video.offsetHeight
        // this.draw()
        if (typeof this.video.captureStream === 'function') {
          this.stream =  this.video.captureStream();
        }
        this.lianjie()
      }
      this.bindEvents()
    },
    async initVideo() {
      await this.initCaptureParam();
      this.getVideoSource();
      this.bindEvents()
    },
    initCaptureParam() {
      const data = this.$store.state.collectWebsoket.nowUsecollectConfig
      if(!data){
        // alert('视频源配置为空，请先在【采集配置】页配置后，然后重进系统');
        return
      }
      this.devicelabel = data.deviceLabel;
      const settingJsonObj = JSON.parse(data.settingJson)[0];
      this.width = settingJsonObj.width;
      this.height = settingJsonObj.height;
    },
      // 获取视频源信息
    async getVideoSource() {
      navigator.mediaDevices.enumerateDevices().then(this.gotDevices).catch(this.handleError);
    },
    // 获取预置的视频源设备
    gotDevices(devicesInfo) {
      for (let i = 0; i < devicesInfo.length; i++) {
        if (devicesInfo[i].kind === 'videoinput' && devicesInfo[i].label === this.devicelabel) {
          this.deviceid = devicesInfo[i].deviceId;

          this.getVideoMedia();
        }
      }
    },
    // 设置视频信号参数
    getVideoMedia() {
      'use strict';
      this.constraints = {
        audio: false, // 强制关闭声音轨道 20230330
        video: {
          deviceId: { exact: this.deviceid },
          width: { exact: parseInt(this.width) },
          height: { exact: parseInt(this.height) }
        }
      };
      navigator.mediaDevices.getUserMedia(this.constraints).then(this.setVideoStream).catch(this.handleError);
    },
        // 获取视频信号失败处理
    handleError(error) {
      if (!!error && error.name === 'ConstraintNotSatisfiedError') {
        message.error('不支持这个分辨率： ' + this.constraints.video.width.exact + 'x' + this.constraints.video.width.exact + ' px', 2, undefined);
      } else if (!!error && error.name === 'PermissionDeniedError') {
        message.error('没有权限访问影像采集设备，请允许访问摄像头', 2, undefined);
      } else if (error) {
        message.error(error);
      } else {
        console.log('');
      }
    },
    // 设置视频信号显示
    setVideoStream(stream) {
      stream.oninactive = function () {};
      // window.MediaStream = stream;
      this.video.srcObject = stream;
      this.stream = stream
      this.video.setAttribute('width', this.imgsListWidth);
      this.video.setAttribute('height', this.imgsListHeight);
      this.lianjie()
    },
    getBoxColor(cls) {
      return this.colorMap[cls] || '#22c55e';
    },
    draw() {
        this.ctx.drawImage(this.video, 0, 0,this.canvas.width,this.canvas.height)
        // 绘制检测框
        for (const box of this.latestBoxes) {
          // 坐标换算：原始图像坐标 -> canvas 坐标
          const scaledBox = this.scaleBoxToCanvas(
            box,
            this.originalImageSize.w,
            this.originalImageSize.h,
            this.canvas.width,
            this.canvas.height
          );
          box.scaledBox = scaledBox
          const color = this.getBoxColor(scaledBox.cls);
          const x = scaledBox.x1;
          const y = scaledBox.y1;
          const w = scaledBox.x2 - scaledBox.x1;
          const h = scaledBox.y2 - scaledBox.y1;

          // 绘制检测框
          this.ctx.strokeStyle = color;
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(x, y, w, h);

          // 绘制标签背景
          const labelText = `${scaledBox.label} ${(scaledBox.score * 100).toFixed(0)}%`;
          this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
          const textMetrics = this.ctx.measureText(labelText);
          const textWidth = textMetrics.width + 12;
          const textHeight = 22;

          // 标签位置：优先放在框上方，如果空间不足则放在框内顶部
          const labelY = y > textHeight + 4 ? y - textHeight - 4 : y + 4;

          this.ctx.fillStyle = color;
          this.ctx.fillRect(x, labelY, textWidth, textHeight);

          // 绘制标签文字
          this.ctx.fillStyle = '#ffffff';
          this.ctx.fillText(labelText, x + 6, labelY + 16);
        }
        if(this.latestBoxes.length>0){
          const bo = this.latestBoxes.some(item=>(item.scaledBox.score * 100).toFixed(0) > Number(this.serverConfigForm.confidenceLevel))
          if(bo){
            this.caitu()
          }
        }
        requestAnimationFrame(this.draw)
    },
    caitu:throttle(()=>{
        _this.broadcastChannel.postMessage({
          type: 'toDataURL',
          data: _this.canvas.toDataURL('image/png', 1.0)
        }); // 最好指定具体域名而非 '*'
      },1000),
    // 3. 原有逻辑：同步video（摄像头）宽高到Canvas，防拉伸
    syncSize() {
      
      if (!this.video || !this.canvas) return
      const w = this.video.offsetWidth
      const h = this.video.offsetHeight
      this.canvas.width = w
      this.canvas.height = h
      this.canvas.style.width = `${w}px`
      this.canvas.style.height = `${h}px`
    },
    // 绑定事件（视频尺寸加载、窗口缩放）
    bindEvents() {
      if (!this.video) return
      this.video.addEventListener('loadedmetadata', this.syncSize)
      window.addEventListener('resize', this.syncSize)
    },

    // 解绑事件
    unbindEvents() {
      if (!this.video) return
      this.video.removeEventListener('loadedmetadata', this.syncSize)
      window.removeEventListener('resize', this.syncSize)
    },
    scaleBoxToCanvas(box, originalW, originalH, canvasW, canvasH) {
      const scaleX = canvasW / originalW;
      const scaleY = canvasH / originalH;
      return {
        x1: box.x1 * scaleX,
        y1: box.y1 * scaleY,
        x2: box.x2 * scaleX,
        y2: box.y2 * scaleY,
        score: box.score,
        cls: box.cls,
        label: box.label
      };
    },
    normalizedToPixel(normBox, imageW, imageH) {
      return {
        x1: normBox.x1 * imageW,
        y1: normBox.y1 * imageH,
        x2: normBox.x2 * imageW,
        y2: normBox.y2 * imageH,
        score: normBox.score,
        cls: normBox.cls,
        label: normBox.label
      };
    },
    async lianjie(){
      if (this.resultWs) {
        this.resultWs.close();
        this.resultWs = null;
      }

      if (this.signalingWs) {
        this.signalingWs.close();
        this.signalingWs = null;
      }
      if(this.ws){
        this.ws.close()
        this.ws = null
      }
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }
      try {
        await this.connectControlWS()
        console.log('推流中', 'streaming');
        this.draw();
      } catch (e) {
        console.log('连接失败', 'error',e);
        setTimeout(() => {
          this.lianjie(); // 重新连接
        }, 30000);
      }
    },
    connectControlWS() {
        const uri = `${this.serverConfigForm.serverAddress}:${this.serverConfigForm.serverPort}/ws/control/${this.serverConfigForm.deviceId}`;
        this.ws = new WebSocket(uri);
          this.ws.onopen = async() => {
            const parts = this.selectedPatient&&this.selectedPatient.stuBodypart?this.selectedPatient.stuBodypart.split(','):''
            this.ws.send(JSON.stringify({ type: 'parts', device_id: this.serverConfigForm.deviceId, parts }));
            await this.connectResultWS();
            await this.startWebRTC();
          };
        this.ws.onerror = (e) => console.log('control ws error', e);
      },
    connectResultWS(){
      const uri = `${this.serverConfigForm.serverAddress}:${this.serverConfigForm.serverPort}/ws/result/${this.serverConfigForm.deviceId}`;
      this.resultWs = new WebSocket(uri);

      this.resultWs.onopen = () => {
        console.log('结果通道已连接', 'connected');
      };

      this.resultWs.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);

          if (msg.type === 'detection') {
            // 更新原始图像尺寸
            if (msg.image && msg.image.w && msg.image.h) {
              this.originalImageSize.w = msg.image.w;
              this.originalImageSize.h = msg.image.h;
            }

            // 优先使用像素坐标 boxes，否则使用归一化坐标 boxes_norm
            if (msg.boxes && msg.boxes.length > 0) {
              this.latestBoxes = msg.boxes;
            } else if (msg.boxes_norm && msg.boxes_norm.length > 0) {
              // 将归一化坐标转换为像素坐标
              this.latestBoxes = msg.boxes_norm.map(normBox =>
                this.normalizedToPixel(normBox, this.originalImageSize.w, this.originalImageSize.h)
              );
            } else {
              this.latestBoxes = [];
            }
            console.log(JSON.stringify(this.latestBoxes))
          }
        } catch (e) {
          console.log('解析消息失败:', e);
        }
      };
    },
    async startWebRTC() {
      const signalingUri = `${this.serverConfigForm.serverAddress}:${this.serverConfigForm.serverPort}/ws/signaling/${this.serverConfigForm.deviceId}`;
      this.signalingWs = new WebSocket(signalingUri);

      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: [this.serverConfigForm.turnAddress], username: this.serverConfigForm.authAccount, credential: this.serverConfigForm.authPassword }],
      });

      this.stream.getTracks().forEach((t) => this.pc.addTrack(t, this.stream));

      this.pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        this.signalingWs.send(
          JSON.stringify({
            type: 'ice',
            device_id: this.serverConfigForm.deviceId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            },
          })
        );
      };

      this.pc.onconnectionstatechange = () => {
        if (this.pc.connectionState === 'connected') {
          console.log('推流中', 'streaming');
        } else if (this.pc.connectionState === 'failed' || this.pc.connectionState === 'disconnected') {
          console.log('连接断开', 'error');
        }
      };

      this.signalingWs.onmessage = async (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'answer') {
          await this.pc.setRemoteDescription(new RTCSessionDescription({ type: msg.sdp_type, sdp: msg.sdp }));
        } else if (msg.type === 'ice') {
          const c = msg.candidate;
          await this.pc.addIceCandidate(new RTCIceCandidate({
            candidate: c.candidate,
            sdpMid: c.sdpMid,
            sdpMLineIndex: c.sdpMLineIndex,
          }));
        }
      };

      await new Promise((resolve) => {
        this.signalingWs.onopen = resolve;
      });

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.signalingWs.send(
        JSON.stringify({
          type: 'offer',
          device_id: this.serverConfigForm.deviceId,
          sdp: this.pc.localDescription.sdp,
          sdp_type: this.pc.localDescription.type,
        })
      );

      return { pc: this.pc, ws: this.signalingWs };
    }
  }
};
