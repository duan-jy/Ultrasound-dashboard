import {longSpeechChat,
  intelligentReportGeneration,
  speechOptimize,uploadImg,saveUsIntelligentAgentLog} from './api.js';
import moment from 'moment';
import _ from 'lodash-es';
import { deptconfigHttp} from '@/api';

let _this
export default {
  data() {
    return {
      base64Length:0,
      zhinengtiregID:'',
      currentUser: JSON.parse(sessionStorage.getItem('currentUser')),
      selectedSystem: JSON.parse(sessionStorage.getItem('selectedSystem')),
      audioBoBao:false,
      timeer:null,
      base64Strs:[],
      ImgAiConclusion:'',
      ImgAiFinding:'',
      langAudio:'',
      isAudio:false,
      audioBlob:null,
      past:'',
      imageAiUpNum:0,
      deptConfig:null
    };
  },
  mounted(){
    _this = this
  },
  methods: {
    async initDeptConfig(){
      if(this.deptConfig){
        return 
      }
      const deptConfigData = await this.getDeptConfig();
      if (deptConfigData !== null) {
        this.deptConfig = JSON.parse(deptConfigData.configJson);
      }
    },
    async getDeptConfig() {
      const queryParam = { configType: 3, modality: this.selectedPatient.stuModalityVal };
      return deptconfigHttp.getDeptConfig(queryParam);
    },
     // 带安全过滤的转换方法
    safeBase64ToBlob(base64Str) {
      // 安全过滤配置
      const IMAGE_WHITELIST = {
        mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], // 允许的图片类型
        maxSizeMB: 10 // 最大文件大小（MB）
      };

      // Base64验证正则（兼容可选的字符集声明）
      const BASE64_REGEX = /^data:image\/([\w+]+);(?:charset=[\w-]+;)?base64,([\s\S]+)$/i;
      try {
        // ---------- 安全校验阶段 ----------
        // 1. 基础格式验证
        const matches = base64Str.match(BASE64_REGEX);
        // if (!matches || matches.length < 3) {
        //   throw new Error('无效的Base64图片格式');
        // }

        const mimeType = matches[1].toLowerCase();
        const base64Data = matches[2];

        // 2. MIME类型白名单验证
        // if (!IMAGE_WHITELIST.mimeTypes.includes(mimeType)) {
        //   throw new Error(`不支持的文件类型: ${mimeType}`);
        // }

        // 3. 数据长度验证（防止超大文件）
        const sizeMB = (base64Data.length * 3) / 4 / (1024 * 1024);
        if (sizeMB > IMAGE_WHITELIST.maxSizeMB) {
          throw new Error(`文件大小超过限制 (最大 ${IMAGE_WHITELIST.maxSizeMB}MB)`);
        }

        // ---------- 转换阶段 ----------
        const byteCharacters = window.atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        return new Blob([new Uint8Array(byteNumbers)], {
          type: `image/${mimeType}`
        });
      } catch (error) {
        console.error('Base64转换失败:', error.message);
        throw error; // 抛出错误供上层捕获处理
      }
    },
   async uploadImage3(){
      if(!_this.base64Strs.length){
        return
      }
      const data = {
        images:_this.base64Strs,
        age:_this.selectedPatient?.ageAliasName||'',
        sex:_this.selectedPatient?_this.xingbie(_this.selectedPatient):'',
        part:_this.selectedPatient?.stuBodypart||'',
        past:this.past
      }
      this.zhinengtiregID = this.registrationId
      this.base64Length = this.base64Strs.length
      const response = await fetch(_this.$store.getters['Global/getAgentConfig'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if(response.ok){
        const json = await response.json();
        _this.ImgAiConclusion = json.diag
        _this.ImgAiFinding = json.finding
        _this.broadcastChannel.postMessage({
          type: 'airesult',
          data: {
            finding: json.finding,
            conclusion:json.diag,
            registrationId:this.zhinengtiregID
          }
        }); // 最好指定具体域名而非 '*'
        saveUsIntelligentAgentLog({
          imgAiFinding: json.finding,
          imgAiConclusion: json.diag,
          registrationId: _this.zhinengtiregID,
        }).then(r=>{
            console.log(r)
        })
      }
    },
    uploadImage2:_.debounce(async ()=>{
      if(_this.base64Length !== _this.base64Strs.length && _this.base64Strs.length > 0){
        await _this.uploadImage3()
      }
    },3000),
    
    async uploadImage(base64Str) {
      // console.log('识图')
      if(this.$store.getters['Global/getAgentConfig']){
        this.base64Strs.push(base64Str.replace(/^data:[^;]+;base64,/, ''));
        this.imageAiUpNum +=1
        this.uploadImage2(base64Str)
        if(this.imageAiUpNum>=3){
          this.imageAiUpNum = 0
          this.uploadImage3()
        }
      }
      // console.log('ocr')
      try {
        const blob = await this.safeBase64ToBlob(base64Str);
        const formData = new FormData();
        const filename = `image_${Date.now()}.${blob.type.split('/')[1]}`;

        formData.append('image', blob);
        // '1843996379640'
        formData.append('registrationId', this.registrationId);

        await uploadImg(formData)
          .then(res => {
            console.log('上传图片成功====>', res);
          })
          .catch(err => {
            console.log('上传图片错误====>', err);
          });
      } catch (error) {}
    },
    setcanshu(){
     return {
          autoChoseYu: false,
          bodyPartIds: [],
          chosedStatu: "unwrite",
          conclusion: "",
          dateType: "register_time",
          deptIdList: [this.selectedSystem.deptId],
          dispenseAuditDocIds: [],
          dispenseDocIds: [],
          endDate: moment().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
          isAuditTimeSort: 0,
          localRoomId: this.sysLocalSetting.currentStudyRoom,
          modCurrentNumbers: [],
          modDoctorNumber: "",
          modalityList: [],
          patName: "",
          patTypeIdList: [],
          processStatusList: ["1", "2", "3", "8", "9", "10"],
          reportListUsePersonalSet: false,
          searchType: 0,
          sortRadio1: "0",
          sortRadio2: "",
          sortRadio3: "",
          sortSelect1: "process_status",
          sortSelect2: "",
          sortSelect3: "",
          startDate: moment().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          stuBodypart: "",
          stuMethodIds: [],
          stuRoomIdList: [this.sysLocalSetting.currentStudyRoom],
          stuSerialNum: "",
          time: [moment().startOf('day').format('YYYY-MM-DD HH:mm:ss'), moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')]
        }
    },
     xingbie(patInfo) {
      return patInfo.sexId + '' === '0' ? '未知' : patInfo.sexId + '' === '1' ? '男' : patInfo.sexId + '' === '2' ? '女' : '未定';
    },
     speak(text,isCancel) {
      if(isCancel) {
        window.speechSynthesis.cancel()
        if(this.timeer){
          clearInterval(this.timeer)
          this.timeer = null
          this.audioBoBao = false
        }
      }
      if(!this.audioBoBao){
        clearInterval(this.timeer)
        this.timeer = null
        this.audioBoBao = true
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1.4; // 语速
        // 监听播放结束事件
        utterance.onend =()=> { 
          this.audioBoBao = false
          console.log('语音播放已完成');
          // 这里可写播放结束后要执行的逻辑，比如更新页面提示、发起新请求等
        };
        window.speechSynthesis.speak(utterance);
      }else{
        if(!this.timeer){
          this.timeer = setInterval(()=>{
            this.speak(text)
            console.log('正在播放中',text)
          },1000)
        }
      }
    },
    uploadAudio() {
      const formData = new FormData();
      // 为 audioBlob 添加文件名，仅在调用 longSpeechChat 接口时生效
      const audioFile = new File([this.audioBlob], `audio_${Date.now()}.wav`, { type: this.audioBlob.type || 'audio/wav' });
      formData.append('file', audioFile);
      this.loading = true
      longSpeechChat(formData).then(res=>{
        if(res.text.indexOf('预览完毕')>-1||res.text.indexOf('报告预览')>-1||res.text.indexOf('报告插图')>-1){

        }else{
            this.yuyin = res.text
            this.$nextTick(() => {
            const container = this.$refs.chatContainer;
            container.scrollTop = container.scrollHeight;
          });
        }
        
        speechOptimize({registrationId:this.registrationId,speechContent:res.text,shortSpeechContent:this.langAudio}).catch(e=>{console.log(e)})
        intelligentReportGeneration({
          registrationId: this.registrationId,
          speechContent: res.text,
          imgAiConclusion:this.ImgAiConclusion,
          imgAiFinding: this.ImgAiFinding
        })
        .then(() => {
          // 开始生成报告 hook
          // this.onProcess({
          //   success: true,
          //   registrationId: this.registrationId,
          //   type: "startGenerationReport"
          // })
          // this.onProcess({
          //     success: true,
          //     registrationId: this.#registrationId,
          //     type: 'reportGeneration',
          //     finding: res.finding || '',
          //     conclusion: res.conclusion || ''
          //   })
        })
        .catch((e) => {
          // 生成报告时错误 hook
          console.log('生成报告错误'+e)
        })
      }).catch(err=>{
        console.log(err)
      })
    }
  }
};
