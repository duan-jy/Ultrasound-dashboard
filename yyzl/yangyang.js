
import YYZL from './index.js'
export default {
  data() {
    return {
    };
  },
  mounted() {
     this.broadcastChannel.onmessage = (e) => {
      // console.log('得到数据', e.data.type)
      if (e.data.type === 'imageWsBusPost') {
        // this.getImg(e.data.data, 'push')
        this.ImgWebsocketOnMessage()
      }
      if (e.data.type === 'SETIMGLIST') {
        this.getImg(e.data.data, 'all')
      }
      if (e.data.type === 'ocrUploadImg') {
        this.uploadImage(e.data.data)
      }
      if (e.data.type === 'Audit') {
        if(e.data.data.registrationId === this.registrationId){
          this.registrationId = ''
          this.reset()
        }
      }
      if (e.data.type === 'YULANBASE64') {
        this.imgUrlBaogao = e.data.data.imgUrl
        this.imgisAr = e.data.data.isar
      }

      if (e.data.type === 'UPDATE') {
        // receivedMessage.value = e.data.data.registrationId;
        this.registrationId = e.data.data.registrationId
        // console.log('收到消息:' + e.data.data.registrationId);
        this.changeRegisstrationId(e.data.data.registrationId)
        this.ImgWebsocketOnMessage()
        this.broadcastChannel.postMessage({
          type: 'UPDATEEND'
        }); // 最好指定具体域名而非 '*'
        
      }
    };
  },
  methods: {
    yulanwanbi(){
        this.sjLoading.close()
        this.imgisAr = false
        this.imgUrlBaogao = ''
    },
    yulanbaogao(){
        if (this.isEnd) {
          this.sjLoading = this.$loading({
            lock: true,
            text: 'Loading',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.5)'
          });
          this.speak('正在打开报告',true)
          setTimeout(() => {
            this.broadcastChannel.postMessage({
              type: 'YULAN',
            }); // 最好指定具体域名而非 '*'
          }, 500);
        } else {
          this.$message.warning('还未检查完成')
        }
    },
    shenhebaogao(){
      // console.log('审核事件发送')
      this.broadcastChannel.postMessage({
        type: 'SHENHE',
      }); // 最好指定具体域名而非 '*'
    },
    /**
     * 报告生成，患者画像生成时的回调
     * @param data
     */
    onProcess(data) {
      /**
       * 智能报告生成时，调用
       * {
       *  success: true,
       *  registrationId: ''
       *  type: 'reportGeneration',
       *  finding: '双侧甲状腺呈对称性稍强回声，形态正常，边缘整齐。彩色多普勒显示血流分布均匀。双侧颈部未见明显肿大淋巴结。',
       *  conclusion: '双侧甲状腺及颈部淋巴结未见明显异常'
       *  }
       */

      // console.log("onProcess",data);
      if (data.type === 'reportGeneration') {
        if (data.registrationId !== this.registrationId) {
          if (this.loading) {
            this.loading = false
          }
          alert('患者错误')
          return
        }
        this.conclusion = data.conclusion
        this.finding = data.finding
        this.broadcastChannel.postMessage({
          type: 'UPEND',
          data: {
            finding: data.finding || '',
            conclusion: data.conclusion || '',
            registrationId:this.registrationId
          }
        }); // 最好指定具体域名而非 '*'
          setTimeout(() => {
            this.$message.success('报告已生成，自动保存成功')
          }, 600);
        if (this.loading) {
          this.loading = false
        }
        this.isEnd = true
      }
      if (data.type === 'patientPortraitResult'&&data.registrationId  === this.registrationId) {
          this.patientInfo = data.patientInfo
          this.speak(data.patientInfo)
      }
    },
    langandaudio(num) {
      if(!this.audioBlob){
        return false
      }
      if(this.audioBlob&&this.langAudio&&!this.isAudio){
        this.isAudio = true
        this.uploadAudio()
        return false
      }else{
        if(num === 6&&!this.isAudio){
          this.isAudio = true
          this.uploadAudio()
          return false
        }
        setTimeout(() => {
          this.langandaudio(num+1)
        }, 500);
      }
    },
    /**
     * 识别录音文字内容的回调
     * @param data
     */
    onRecordProcess(data) {
      /**
       *
       * {
       *  end: false, // 检查结束(用户是否说了检查完成等关键字)
       *  text: '精准，不可', // 本次说话识别到的文字
       *  type: 'recordText',
       *  registrationId: '',
       *  content: '，这完全没有精准，不可' // 从开始录音到说出检查完成，中间的所有文字。
       *  }
       */
      if(data.type ==='kaiqiyuyin'){
        this.startRecord()
      }
      if (data.type === 'recordText') {
        console.log("onRecordProcess",data);
        if(!this.isAudio){
          this.langAudio = data.content
          this.langandaudio(0)
        }
      }
      if (data.type === 'chatu') {
        this.charu()
      }
      if (data.type === 'yulanwanbi') {
        this.yulanwanbi()
      }
      if (data.type === 'jiaohao') {
        const arr = this.patients.filter((item) => {
          return item.registrationId !== this.registrationId
        })
        this.selectPatient(arr[0])
        this.speak('已叫号患者'+arr[0].patName,true)
      }
      if (data.type === 'shenhe') {
        this.shenhebaogao()
      }
      if (data.type === 'mp3') {
        if(!this.isAudio){ // 没调用过 false
          this.audioBlob = data.data //赋值
          this.langandaudio(0)
        }
      }
      if (data.type === 'recordYulan') {
        this.yulanbaogao()
      }
      if(data.type === 'recordTextEnd') {
        if(this.isopen){
          this.anjian()
        }
      }
    },    
    /**
     * 初始化阳阳助理
     */
    initYYZL(id) {
      if (this.yyzlInstance) return;
      this.yyzlInstance = new YYZL({
        onProcess: this.onProcess.bind(this),
        onRecordProcess: this.onRecordProcess.bind(this)
      });
      this.yyzlInstance.init(this.registrationId);
      // this.startRecord()
    },

    /**
     * 开始录音
     */
    async startRecord() {
      if (this.yyzlInstance) {
        await this.yyzlInstance.openRecord().then(async () => {
          // console.log('打开成功')
          await this.yyzlInstance.startRecord();
        }).catch((e) => {
          console.log('打开失败', e)
        })
      }
    },

    /**
     * 停止录音
     */
    async stopRecord(boo, boo2) { // boo是否要开启录音。只有按键结束才会开启。 boo2是是否要请求接口转文字转所见和诊断
      if (this.yyzlInstance) {
        await this.yyzlInstance.stopRecord(() => {
          if (boo) {
            this.$nextTick(() => {
              this.startRecord()
            })
          }
        }, boo2);
      }
    },
    
    
    /**
     * 销毁阳阳助理
     */
    destroyYYZL() {
      if (this.yyzlInstance) {
        this.yyzlInstance.destory();
        this.yyzlInstance = null;
      }
    }
  }
};
