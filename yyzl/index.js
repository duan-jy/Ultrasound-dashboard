import Recorder from 'recorder-core';
import Pinyin from 'pinyin-match';
import CryptoJS from "crypto-js";
import { commonReq } from '@/api/index.js';
import 'recorder-core/recorder.wav.min.js';
import { getIntelligentReportResult, getPatientPortraitGeneration, patientPortraitGeneration, getIntelligentModifyReportResult } from './api.js';
import { createSocketForOcr, ocrSoketOnMessage, destroyOcrWebsocket } from './orcWebSocket.js';
// Recorder.Cfg.pcm = true; // 启用PCM支持
let dingshi = null;

      const currentUser= JSON.parse(sessionStorage.getItem('currentUser'))
      const selectSystem= JSON.parse(sessionStorage.getItem('selectedSystem'))
class WebSocketClient {
  constructor(websocketUrl) {
    this.speechSocket = null;
    this.onOpen = null;
    this.onClose = null;
    this.onMessage = null;
    this.onError = null;
    this.websocketUrl = websocketUrl;
  }

  connect() {
    if (!this.speechSocket || this.speechSocket.readyState !== WebSocket.OPEN) {
      this.speechSocket = new WebSocket(this.websocketUrl);

      this.speechSocket.onopen = e => {
        this.onOpen && this.onOpen(e);
      };

      this.speechSocket.onclose = e => {
        this.speechSocket = null;
        this.onClose && this.onClose(e);
      };

      this.speechSocket.onmessage = e => this.handleMessage(e);
      this.speechSocket.onerror = e => {
        this.onError && this.onError(e);
      };
    }
  }

  send(data) {
    if (this.isConnected()) {
      this.speechSocket.send(data);
      return true;
    }
    return false;
  }

  isConnected() {
    return this.speechSocket && this.speechSocket.readyState === WebSocket.OPEN;
  }

  handleOpen(e) {
    const request = {
      ifClearVoice: "1", //是否开启降噪功能，1开启；0不开启
      ifSplitPeople: "0", //是否开启说话人分离  先传0 或者不传
      userId: currentUser.userId, //医生id
      hospitalId: currentUser.hospitalId, // 医院id
      orgId: currentUser.orgId, //机构id
      departmentId: selectSystem.deptId, //科室id
      scene: 'yuyinshengchengbaogao' // 填写拼音或者英文名
    };

    this.send(JSON.stringify(request));
  }

  close() {
    if (this.speechSocket) {
      // console.log('销毁阳阳助理');
      this.speechSocket.close(1000, '主动关闭');
    }
  }

  handleMessage(e) {
    if (e.data !== 'PONG') {
      this.onMessage && this.onMessage(e.data);
    }
  }
}
// 空函数操作
function noop() {}

class YYZL {
  #initialized = false; // 是否已经初始化

  #registrationId = null; // 患者登记ID

  #recordIsRunning = false; // 语音是否正在运行

  #recordIsOpened = false; // 语音是否已经打开

  #rec = null; // 语音实例

  #websocketInstance = null; // websocket实例

  onProcess = noop; // 监听智能体处理的结果
  onRecordProcess = noop; // 语音数据处理的结果
  #sampleBuf = [];

  #recordContent = ''; // 所有语音识别的内容

  constructor({ onProcess, onRecordProcess }) {
    if (onProcess) {
      this.onProcess = onProcess;
    }
    if (onRecordProcess) {
      this.onRecordProcess = onRecordProcess;
    }
    this.#rec = Recorder({
      type: 'wav',
      bitRate: 16,
      sampleRate: 16000,
      onProcess: this.#recProcess.bind(this)
    });
  }
  // MP3 完成回调
  #recComplete(blob) {
    // blob 是 MP3 格式的音频文件
    this.onRecordProcess({
      success: true,
      registrationId: this.#registrationId,
      data: blob,
      type: 'mp3'
    });
  }
  /**
   * 生成用户画像
   */
  generationPatientPortrait() {
    this.#checkRegistrationId();
    patientPortraitGeneration(this.#registrationId).then().catch();
  }

  #checkRegistrationId() {
    if (!this.#registrationId) {
      throw new Error('登记ID未设置，请先设置登记ID');
    }
  }

  async init(registrationId) {
    this.#registrationId = registrationId;
    this.#checkRegistrationId();
    this.generationPatientPortrait(this.#registrationId)
    if (this.#initialized) {
      return;
    }
    this.#initialized = true;
    // 创建ocr图像识别的websocket
    createSocketForOcr();
    // 监听orc返回的消息
    ocrSoketOnMessage(message => {
      if (message.includes('reportModify')) {
        getIntelligentModifyReportResult(this.#registrationId).then(res => {
          if (res) {
            this.onProcess({
              success: true,
              registrationId: this.#registrationId,
              type: 'reportGeneration',
              finding: res.finding || '',
              conclusion: res.conclusion || ''
            });
          } else {
            this.$message.warning('未生成AI所见及诊断内容');
          }
        });
        return;
      }

      if (message.includes('patientPortraitResult')) {
        // 患者画像
        // 解析出来登记ID
        const registrationId = message.replace('patientPortraitResult', '');
        if (registrationId !== this.#registrationId) {
          console.warn('登记ID不一致, 不获患者画像');
          return;
        }
        getPatientPortraitGeneration(registrationId)
          .then(res => {
            if (res) {
              this.onProcess({
                success: true,
                type: 'patientPortraitResult',
                registrationId: this.#registrationId,
                patientInfo: res
              });
            } else {
              this.onProcess({
                success: false,
                registrationId: this.#registrationId,
                type: 'patientPortraitResult',
                patientInfo: null
              });
            }
          })
          .catch(() => {
            this.onProcess({
              success: false,
              registrationId: this.#registrationId,
              type: 'patientPortraitResult',
              patientInfo: null
            });
          });
        return;
      }

      // AI返回报告诊断和所见生成成功
      if (message.includes('reportGeneration')) {
        // 解析出来登记ID
        const registrationId = message.replace('reportGeneration', '');
        if (registrationId !== this.#registrationId) {
          console.warn('登记ID不一致, 不获取报告结果');
          return;
        }
        // 通过接口获取生成的结果
        getIntelligentReportResult(registrationId)
          .then(res => {
            if (res) {
              this.onProcess({
                success: true,
                registrationId: this.#registrationId,
                type: 'reportGeneration',
                finding: res.finding || '',
                conclusion: res.conclusion || ''
              });
            } else {
              this.onProcess({
                success: true,
                registrationId: this.#registrationId,
                type: 'reportGeneration',
                finding: null,
                conclusion: null
              });
            }
          })
          .catch(() => {
            this.onProcess({
              registrationId: this.#registrationId,
              success: false,
              type: 'reportGeneration',
              finding: null,
              conclusion: null
            });
          });
      }
    });
    let pacs_speakWebsoketAppId = await commonReq.getSysConfigInfo({ sysCode: 'pacs_speakWebsoketAppId',deptId:JSON.parse(window.sessionStorage.getItem('selectedSystem')).deptId });
    let pacs_speakWebsoketUrl = await commonReq.getSysConfigInfo({ sysCode: 'pacs_speakWebsoketUrl',deptId:JSON.parse(window.sessionStorage.getItem('selectedSystem')).deptId });
    const timestamp = Date.now();
    const token = '53499d7c-d4a5-f4d2-4129-04824d838e16'
    // MD5加密函数
    function md5(input) {
      // 使用 UTF-8 编码
      return CryptoJS.MD5(CryptoJS.enc.Utf8.parse(input)).toString();
    }
      // 生成Bearer Token的函数
    function generateBearerToken(timestamp, productToken) {
      const raw = timestamp + productToken;
      // console.log("MD5 input:", raw); // 调试用，查看输入内容
      const md5Hash = md5(raw);
      // console.log("MD5 result:", md5Hash); // 调试用，查看 MD5 结果
      return "Bearer " + md5Hash;
    }
    const url = pacs_speakWebsoketUrl+'?appId='+pacs_speakWebsoketAppId+'&reqTimestamp='+timestamp+'&Authorization='+generateBearerToken(timestamp, token)+'&audioMode=doubao';
    this.#websocketInstance = new WebSocketClient(url);
    this.#websocketInstance.connect();
    this.#websocketInstance.onOpen = () => {
      if (dingshi) {
        clearInterval(dingshi);
        dingshi = null;
      }
      // const request = {
      //   chunk_size: [5, 10, 5],
      //   wav_name: 'h5',
      //   is_speaking: true,
      //   chunk_interval: 10,
      //   itn: true,
      //   mode: '2pass',
      //   appId: pacs_speakWebsoketAppId
      // };
      this.onRecordProcess({
            type: 'kaiqiyuyin',
          });
    };

    this.#websocketInstance.onError = () => {
      // console.log('eeee');
      dingshi = setInterval(() => {
        this.#websocketInstance = new WebSocketClient(url);
        this.#websocketInstance.connect();
        this.#websocketInstance.onOpen = () => {
          this.onRecordProcess({
            type: 'kaiqiyuyin',
          });
        };
      }, 3000);
    };

    this.#websocketInstance.onMessage = data => {
      const res = JSON.parse(data);
      if(res.sessionId){
        const request = {
            ifClearVoice: "1", //是否开启降噪功能，1开启；0不开启
            ifSplitPeople: "0", //是否开启说话人分离  先传0 或者不传
            userId: currentUser.userId, //医生id
            hospitalId: currentUser.hospitalId, // 医院id
            orgId: currentUser.orgId, //机构id
            departmentId: selectSystem.deptId, //科室id
            scene: 'yuyinshengchengbaogao' // 填写拼音或者英文名
          };
          const obj  ={
            sessionId:res.sessionId, //会话id
            parameter: request
          }
          this.#websocketInstance.send(JSON.stringify(obj));
      }
      if (res && res.text) {
        const str = res.text.replace(/undefined|\s/g, '');
        // console.log(res,222)
        if (res.mode === '2pass-online') {
          // this.#recordContent += res.text;
          this.onRecordProcess({
            end: false,
            text: res.text,
            type: 'recordTextIn',
            registrationId: this.#registrationId,
            content: this.#recordContent
          });
        }
        if (res.mode === '2_pass_offline') {
          // console.log(res,333)
          this.#recordContent += res.text;
          this.onRecordProcess({
            end: false,
            text: res.text,
            type: 'recordText',
            registrationId: this.#registrationId,
            content: this.#recordContent
          });
        }
        if (this.containImgCharacter(str)) {
          this.onRecordProcess({
            success: true,
            registrationId: this.#registrationId,
            type: 'chatu'
          });
        } else if (this.containPrintEndCharacter(str)) {
          this.onRecordProcess({
            success: true,
            registrationId: this.#registrationId,
            type: 'yulanwanbi'
          });
        } else if (this.shenheCharacter(str)) {
          // console.log('大屏监听到语音审核')
          this.onRecordProcess({
            success: true,
            registrationId: this.#registrationId,
            type: 'shenhe'
          });
        } else if (this.containConventionCharacter(str)) {
          this.onRecordProcess({
            success: true,
            registrationId: this.#registrationId,
            type: 'jiaohao'
          });
        }else if (this.containPrintCharacter(str)) {
          this.onRecordProcess({
            success: true,
            registrationId: this.#registrationId,
            type: 'recordYulan'
          });
        } else if (this.containEndCharacter(str)) {
          this.onRecordProcess({
            end: true,
            text: res.text,
            type: 'recordTextEnd',
            registrationId: this.#registrationId,
            content: this.#recordContent
          });
          // 检查结束后，重置语音生成的内容
          this.#recordContent = '';
        }
      }
    };
  }

  /**
   * 处理语音
   */
  #recProcess(buffer, powerLevel, bufferDuration, bufferSampleRate, newBufferIdx, asyncEnd) {
    const data_48k = buffer[buffer.length - 1];

    const array_48k = new Array(data_48k);
    const data_16k = Recorder.SampleData(array_48k, bufferSampleRate, 16000).data;

    this.#sampleBuf = Int16Array.from([...this.#sampleBuf, ...data_16k]);
    const chunk_size = 960; // for asr chunk_size [5, 10, 5]
    // this.showTime = parseInt(bufferDuration / 1000) + 's';
    // this.yuyinShowMsg = '听取时长：' + this.showTime;
    while (this.#sampleBuf.length >= chunk_size) {
      const sendBuf = this.#sampleBuf.slice(0, chunk_size);
      this.#sampleBuf = this.#sampleBuf.slice(chunk_size, this.#sampleBuf.length);
      this.#websocketInstance.send(sendBuf);
    }
  }

  /**
   * 打开录音
   * @return {Promise<unknown>}
   */
  async openRecord() {
    this.#checkRegistrationId();

    if (!this.#initialized) {
      throw new Error('阳阳助理未能初始化，请调用先调用init函数');
    }

    if (this.#recordIsOpened) {
      return;
    }
    return new Promise((resolve, reject) => {
      if (this.#rec === null) {
        reject('语音未初始化');
      }
      this.#rec.open(
        () => {
          this.#recordIsOpened = true;
          resolve();
        },
        (msg, isUserNotAllow) => {
          this.#recordIsOpened = false;
          //用户拒绝未授权或不支持
          reject(isUserNotAllow ? '阳阳助手无法录音：用户拒绝 或 未授权 或 浏览器不支持' : '无法录音');
        }
      );
    });
  }

  /**
   * 开启录音
   */
  async startRecord() {
    this.#checkRegistrationId();
    if (!this.#initialized) {
      throw new Error('阳阳助理未能初始化，请调用先调用init函数');
    }
    if (!this.#recordIsRunning) {
      await this.#rec.start();
      this.#recordIsRunning = true;
    }
  }

  /**
   * 停止录音
   */
  async stopRecord(back, boo2) {
    if (this.#rec) {
      await this.#rec.stop(
        blob => {
          if (boo2) {
            this.#recComplete(blob);
          }
          //释放录音资源，当然可以不释放，后面可以连续调用start；但不释放时系统或浏览器会一直提示在录音，最佳操作是录完就close掉
          this.#rec.close();
          back();
        },
        err => {
          back();
        }
      );
      this.#recordIsOpened = false;
      this.#recordIsRunning = false;
      this.#recordContent = '';
    }
  }

  destory() {
    // 停止录音
    this.stopRecord();
    // 关闭录音的websocket
    this.closeRecordWebsocket();

    // 销毁orc的websocket
    destroyOcrWebsocket();

    this.onProcess = noop();

    this.onRecordProcess = noop();

    this.#sampleBuf = [];
    this.#registrationId = null;
    this.#initialized = false;
  }

  /**
   * 关闭录音的websocket
   */
  closeRecordWebsocket() {
    if (this.#websocketInstance) {
      this.#websocketInstance.close();
      this.#websocketInstance = null;
    }
  }
  containPrintCharacter(str) {
    if (
      str.includes('报告查看') ||
      Pinyin.match(str, 'baogaochakan') ||
      str.includes('查看报告') ||
      Pinyin.match(str, 'chakanbaogao') ||
      str.includes('报告预览') ||
      Pinyin.match(str, 'baogaoyulan')
    ) {
      return true;
    }
    return false;
  }
  containImgCharacter(str) {
    if (str.includes('插入图像') || Pinyin.match(str, 'charutuxiang') || str.includes('插入图片') || Pinyin.match(str, 'charutupian') || str.includes('报告插图') || Pinyin.match(str, 'baogaochatu')) {
      return true;
    }
    return false;
  }
  containPrintEndCharacter(str) {
    if (
      str.includes('预览结束') ||
      Pinyin.match(str, 'yulanjieshu') ||
      str.includes('预览完成') ||
      Pinyin.match(str, 'yulanwancheng') ||
      str.includes('预览完毕') ||
      Pinyin.match(str, 'yulanwanbii')
    ) {
      return true;
    }
    return false;
  }
  containConventionCharacter(str){
    // if (str.includes('叫号') ||
    // Pinyin.match(str, 'jiaohao') ||
    if (str.includes('下一位') ||
    Pinyin.match(str, 'xiayiwei') ||
    str.includes('下一个') ||
    Pinyin.match(str, 'xiayige')
    // ||
    // str.includes('过号') ||
    // Pinyin.match(str, 'guohao') ||
    // str.includes('患者过号') ||
    // Pinyin.match(str, 'huanzheguohao')||
    // str.includes('开始检查') ||
    // Pinyin.match(str, 'kaishijiancha')||
    // str.includes('审核报告') ||
    // Pinyin.match(str, 'shenhebaogao') ||
    // str.includes('报告审核') ||
    // Pinyin.match(str, 'baogaoshenhe')||
    // str.includes('修改报告') ||
    // Pinyin.match(str, 'xiugaibaogao')
  ) {
    return true
    }
    return false
  }
    shenheCharacter(str){
      if (str.includes('审核报告') ||
      Pinyin.match(str, 'shenhebaogao') ||
      str.includes('报告审核') ||
      Pinyin.match(str, 'baogaoshenhe')
    ) {
      return true
      }
      return false
    }

  containEndCharacter(str) {
    if (
      str.includes('确认') ||
      Pinyin.match(str, 'queren') ||
      str.includes('语音结束') ||
      Pinyin.match(str, 'yuyinjie') ||
      str.includes('检查完毕') ||
      Pinyin.match(str, 'jianchawan') ||
      str.includes('检查完成') ||
      Pinyin.match(str, 'jianchawan') ||
      str.includes('诊疗结束') ||
      Pinyin.match(str, 'zhenliaojie') ||
      str.includes('诊疗完毕') ||
      Pinyin.match(str, 'zhenliaowan')
    ) {
      return true;
    }
    return false;
  }
}

export default YYZL;
