<template>
  <div class="medical-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <div class="system-logo">
          <div class="logo-icon"></div>
        </div>
        <h1 class="system-title">智能超声辅助检查系统</h1>
      </div>
      <div class="patinfo" v-if="selectedPatient&&selectedPatient.patName">姓名：<span>{{ selectedPatient.patName }}</span> 年龄：<span>{{ selectedPatient.ageAliasName }}</span>
        性别：<span>{{ xingbie(selectedPatient) }}</span> 检查部位：<span>{{ selectedPatient.stuBodypart }}</span></div>
      <div class="header-right">
        <el-button type="primary" @click="openServerConfigDialog">服务配置</el-button>
        <el-button type="primary" @click="openDescribeDialog">使用说明</el-button>
        <el-button type="primary" @click="openDialog">解剖图</el-button>
        <el-button type="primary" @click="setzhikong">查看质控</el-button>
        <!-- <div class="time-display">解刨图</div> -->
        <!-- <div class="status-indicator">
          <div class="status-dot active"></div>
          <span>系统运行中</span>
        </div> -->
      </div>
    </header>
    <!-- Main Content -->
    <div class="dashboard-content">
      <!-- Left -->
      <div class="left-panel">
        <!-- Patient List -->
        <div class="panel-section patient-section">
          <div class="section-header">
            <a-icon type="team" class="icon"/>
            <h3>就诊人数 ({{ patients.length }})</h3>
            <div class="section-indicator"></div>
          </div>
          <div class="patient-list auto" ref="patientListRef">
            <div v-for="patient in patients" :key="patient.registrationId"
              :class="['patient-item', { active: selectedPatient?.registrationId === patient.registrationId }]"
              @click="selectPatient(patient)">
              <div class="patient-details-container">
                <div class="patient-info">
                  <div class="patient-name">{{ patient.patName }}</div>
                  <div class="patient-details">{{ patient.ageAliasName }} | {{ xingbie(patient) }}</div>
                </div>
                <div class="patient-priority">
                  <columTag :status="patient.processStatus" />
                </div>
              </div>
              <div class="patient-actions">{{ patient.stuBodypart }}</div>
            </div>
          </div>
        </div>
         
        <!-- Voice -->
        <div class="panel-section voice-section">
          <div class="section-header">
            <a-icon type="audio" class="icon" />
            <h3>语音识别</h3>
            <div class="section-indicator"></div>
          </div>
          <div class="voice-recognition">
            <div class="voice-status">
              <div class="voice-indicator" @click="anjian">
                <div class="voice-wave"></div>
                <div :class="this.isopen ? 'voice-ripple' : ''"></div>
              </div>
              <div class="voice-text">
                <div v-if="isopen" class="recording-text">正在识别中...</div>
                <div v-else class="idle-text">按键开始语音输入</div>
              </div>
            </div>
            <div class="voice-result" ref="chatContainer">
              {{ yuyin }}
            </div>
          </div>
        </div>
      </div>
      <!-- Center -->
      <div class="center-panel" ref="centerPanel">
         <div class="gallery-header">
          <div class="header-info">
            <h3>采集图像</h3>
            <div class="image-stats">
              <span class="total-count">总计: {{ imgs.length }}</span>
              <span class="selected-count" v-if="imgs.filter((item) => item.ischeck).length > 0">
                已选: {{ imgs.filter((item) => item.ischeck).length }}
              </span>
            </div>
          </div>
          <div class="gallery-controls">
            <div class="action-controls">
              <!-- <el-button type="primary" :disabled="!imgs.filter((item) => item.ischeck).length" v-if="!ischaru" size="medium" @click="charu">插入到报告</el-button>
              <el-button type="warning" v-else size="medium" @click="quchu">去除报告图片</el-button>
              <el-button type="primary" :disabled="!isEnd" size="medium" @click="yulanbaogao">预览报告</el-button>
              <el-button type="primary" :disabled="!isEnd" title="请使用AI智能生成报告后尝试" size="medium" @click="shenhebaogao">审核报告</el-button> -->
            </div>
          </div>
        </div>

        <!-- <el-row v-if="imgs.length>0&&!iszhikong" class="auto imglistBox">
          <el-col :span="8" v-for="(item,index) in imgs"  :key="index" class="img-col" :class="{'selected': item.ischeck}">
            <el-checkbox class="col-checkbox" v-model="item.ischeck" @change="()=>{$forceUpdate();}" size="medium"></el-checkbox>
            <el-image
              class="img-item"
              :src="item.src"
              :preview-src-list="imgs.map(item=>item.src)"
              @click="handleClick(index)"
              preview-teleported>
            </el-image>
          </el-col>
        </el-row> -->
        <div class="video-container">
            <video id="splitbigVideo"  key="splitbigVideo" autoplay   muted   playsinline ></video>
          <canvas id="canvas" width="1280" height="720"></canvas>
          <!-- <div style="opacity: 0.1;"> -->
          <!-- </div> -->
        </div>
        <!-- <el-button v-if="img.length>0&&imageList.length>0" icon="el-icon-arrow-right" class="anniu" circle @click="clickRight"></el-button> -->
      </div>
      
      <!-- Right -->
      <div class="right-panel">
        <!-- Patient Information -->
        <div class="panel-section patient-info-section">
          <div class="section-header">
            <a-icon type="container" class="icon" />
            <h3>患者画像</h3>
            <div class="section-indicator"></div>
          </div>
          <div class="patient-details-card auto" ref="patientDetailsRef">
            {{ patientInfo }}
          </div>
        </div>
        <div class="patient-info-section-box" v-loading="!!loadingTimeer" :element-loading-text="textList[0]">
        <!-- Findings -->
        <div class="panel-section" style="height: 60%;">
          <div class="section-header">
            <a-icon type="file-search" class="icon" />
            <h3>检查所见</h3>
            <div class="section-indicator"></div>
          </div>
          <div class="findings-container">
            <div class="findings-content auto" ref="findingsRef">
              {{ finding }}
            </div>
          </div>
        </div>
        <!-- Diagnosis -->
        <div class="panel-section" style="margin-top: 17px; height: 40%;">
          <div class="section-header">
            <a-icon type="file-done" class="icon" />
            <h3>检查诊断</h3>
            <div class="section-indicator"></div>
          </div>
          <div class="diagnosis-container">
            <div class="diagnosis-content auto" ref="diagnosisRef">
              {{ conclusion }}
            </div>
          </div>
        </div>
        </div>
        <!-- critical -->
        <div class="panel-section patient-critical-section">
          <el-row>
            <el-col :span="12" style="display: flex;">
              危急值：
              <el-switch
                @change="changeSeriousFlag('seriousFlag')"
                v-model="seriousFlag"
                active-text="是"
                inactive-text="否">
              </el-switch>
            </el-col>
            <el-col :span="12" style="display: flex;">
              阴阳性：
              <el-switch
                @change="changeSeriousFlag('positiveRateStatus')"
                v-model="positiveRateStatus"
                active-text="阳性"
                inactive-text="未选择">
              </el-switch>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
    <!-- Background -->
    <div class="tech-grid"></div>
    <div class="imgUrl" v-if="imgUrlBaogao">
      <i class="el-icon-circle-close" style="position:absolute;right: 0;top: 0;font-size: 36px;" @click="yulanwanbi"></i>
      <img :src="imgUrlBaogao" v-if="!imgisAr" />
      <img :src="imgUrlBaogao[0]" v-else />
    </div>
     <!-- <template v-if="postPacsCheckModalIsshow">
      <msunPacsCheckModal :click-table-row="response" :show-content="showReportPage" :postPacsCheckModalIsshow="postPacsCheckModalIsshow" /> -->
      <!-- clickTableRow  pacs患者列表接口拿到的行数据 -->
    <!-- </template> -->
    <!-- <div class="clearCard">
        <cardReader  @clearCard="clearCard"  />
    </div> -->
    <el-dialog
      title="解剖图"
      :visible.sync="dialogVisible"
      width="70vw"
      top="5vh">
      <div style="height: 75vh;overflow-y: auto;" class="auto">
        <el-row>
          <el-col v-for="(item,index) in img" :key="index" :span="8" style="padding: 10px; height: 28vh; text-align: center;">
            <el-image :src="item" :preview-src-list="img" style="height: 100%; margin: 0 auto;border: solid 1px #ccc;"></el-image>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
     <el-dialog
      title="AI质控结果"
      :visible.sync="postPacsCheckModalIsshow"
      top="10vh" class="postPacsCheckModalIsshow">
      <a-list item-layout="horizontal" :data-source="response.list" style="max-height: 75vh; overflow-y: auto;" class="auto">
        <a-list-item slot="renderItem" slot-scope="item" style="display: block;">
          <a-list-item-meta>
           <h3 style="font-weight: bold;" slot="title"><a-icon type="file-exclamation" />&nbsp;&nbsp;{{ item.title }} </h3>
          </a-list-item-meta>
          <div style="width:100%;color:#16a34a" v-if="item.type ==='string'">{{ item.content }}</div>
          <div style="width:100%" v-if="item.type === 'array'">
            <p style="color:#16a34a" v-for="(item,index) in item.content" :key="item">{{index+1}}：{{ item }}</p>
          </div>
          <div style="width:100%" v-if="item.type === 'object'&&item.content&&item.content.questionList">
            <div v-for="(item,index) in item.content.questionList" :key="item">
              <p style="color:#666">{{index+1}}、{{item.rule_question}}</p>
              <p style="color:#16a34a">建议：{{item.rule_modify}}</p>
            </div>
          </div>
        </a-list-item>
      </a-list>
    </el-dialog>
    <el-dialog
      title="使用说明"
      :visible.sync="dialogDescribeVisible"
      width="70vw"
      top="5vh">
      <div style="height: 75vh;overflow-y: auto;" class="auto">
        <h3>一、功能区域说明：</h3>
        <br />
        1.就诊人数：登记到当前科室的待检患者
        <br />
        <br />
        2.语音识别：<span style="color:#409EFF">点击中间的圆形按钮，开始进入语音录入。再次点击，再次点击完成录入。AI智能生成所见和诊断内容</span>
        <br />
        <br />
        3.中间部位：展示采集图像，点击可放大查看。可选中图像，点击插入到报告把所有选中图像插入到报告中。点击去除报告图片，去除所有报告中的插图
        <br />
        <br />
        4.患者画像：根据患者历史检查记录、病情摘要、临床诊断智能生成本次检查重点关注位置
        <br />
        <br />
        5.检查所见：根据语音识别AI智能生成所见和诊断，自动匹配院内诊断模版，中华医学库模版
        <br />
        <br />
        6.检查诊断：根据语音识别AI智能生成所见和诊断
        <br />
        <br />
        7.危急值和阴阳性：点击切换危急值、阴阳性
        <br />
        <br />
         <h3>二、语音指令：</h3>
        <br />
        1.&nbsp;&nbsp;<span style="color:#409EFF">基础：</span>使用语音录入生成诊断和所见
        <br />
        <br />
         2.&nbsp;&nbsp;已经开始录入的情况下，说<span style="color:#409EFF">“检查完毕”、“检查完成”</span>，自动结束检查
        <br />
        <br />
        3. <span style="color:#409EFF">“下一个”、“下一位”</span>，自动切换到就诊人数列表里面的第一位患者
        <br />
        <br />
        4. <span style="color:#409EFF">“报告插图”、“插入图像”</span>，插入选中图片到报告中
        <br />
        <br />
        5. <span style="color:#409EFF">“预览报告”、“报告查看”</span>，查看pdf报告内容
        <br />
        <br />
        6. <span style="color:#409EFF">“预览完毕”、“预览完成”</span>，取消预览报告
        <br />
        <br />
        7. <span style="color:#409EFF">“报告审核”</span>，审核当前报告
      </div>
    </el-dialog>
    <el-dialog
      title="质控列表"
      :visible.sync="iszhikong"
      width="1000px"
      :before-close="()=>{this.iszhikong = false}">
        <div
      style="height: 620px;">
          <el-date-picker v-model="chosedTimeOrigin" style="width: 360px;margin-right: 20px;" :clearable="false" type="datetimerange" :picker-options="pickerOptions" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" :value-format="'yyyy-MM-dd HH:mm:ss'" :default-time="['00:00:00', '23:59:59']" :unlink-panels="true" align="left"></el-date-picker>
          <el-button type="primary" size="small" @click="zhikongsearch">查询</el-button>
            <el-table
            :height="540"
            :data="errorReportList"
            stripe
            class="my-table auto"
            :row-style="{height:'60px'}"
            header-align="center"
            style="width: 100%;margin-top:10px">
            <el-table-column label="操作" width="80">
              <template slot-scope="scope">
                <el-button
                  size="mini" @click="showDetail(scope.row)">查看</el-button>
              </template>
            </el-table-column>
            <el-table-column
              prop="patName"
              label="姓名"
              width="80" show-overflow-tooltip>
            </el-table-column>
            <el-table-column label="性别" width="70">
              <template slot-scope="scope">
                {{ xingbie(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column prop="stuBodypart" label="检查部位" show-overflow-tooltip width="120"> </el-table-column>
            <el-table-column label="质控类型" width="80">
              <template slot-scope="scope">
                {{ scope.row.qualityCode+'' === '0'?'正常':scope.row.qualityCode+'' === '1'?'历史报告异常':'矛盾质控异常' }}
              </template>
            </el-table-column>
            <el-table-column prop="qualityMsg" label="历史报告质控内容" show-overflow-tooltip width="170"> </el-table-column>
            <el-table-column prop="curMsg" label="矛盾质控内容" show-overflow-tooltip width="170"> </el-table-column>
            <el-table-column prop="modifyRate" label="完整性质控内容" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.curWzMsg&&scope.row.curWzMsg.questionList?scope.row.curWzMsg.questionList.map(rule => { return `${rule.rule_question}：${rule.rule_modify},`;}).join(''):'' }}
              </template>
            </el-table-column>
          </el-table>
           <el-pagination
            style="margin-top: 20px;float:right"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="pageNum"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next"
            :total="totalData">
          </el-pagination>
        </div>
    </el-dialog>
    <!-- 服务配置对话框 -->
    <el-dialog
      title="服务配置"
      :visible.sync="serverConfigDialogVisible"
      width="500px"
      :before-close="handleCloseServerConfig">
      <el-form :model="serverConfigForm" label-width="120px" size="small">
        <el-form-item label="服务器地址">
          <el-input v-model="serverConfigForm.serverAddress" placeholder="请输入服务器地址"></el-input>
        </el-form-item>
        <el-form-item label="服务器端口">
          <el-input v-model="serverConfigForm.serverPort" placeholder="请输入服务器端口"></el-input>
        </el-form-item>
        <el-form-item label="设备 ID">
          <el-input v-model="serverConfigForm.deviceId" placeholder="请输入设备 ID"></el-input>
        </el-form-item>
        <el-form-item label="TURN 地址">
          <el-input v-model="serverConfigForm.turnAddress" placeholder="请输入 TURN 地址"></el-input>
        </el-form-item>
        <el-form-item label="认证信息账号">
          <el-input v-model="serverConfigForm.authAccount" placeholder="请输入认证信息账号"></el-input>
        </el-form-item>
        <el-form-item label="认证信息密码">
          <el-input v-model="serverConfigForm.authPassword" type="password" placeholder="请输入认证信息密码"></el-input>
        </el-form-item>
        <el-form-item label="置信率">
          <el-input v-model="serverConfigForm.confidenceLevel" placeholder="请输入置信率"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelServerConfig">取 消</el-button>
        <el-button type="primary" @click="saveServerConfig">保 存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>

// import msunPacsCheckModal from '@/components/msunPacsCheckModal/index.vue';
import { applyHttp,patientHttp } from '@/api';
import browser from './yyzl/browser.js'
import photograph from './yyzl/photograph.js' // 拍摄视频
import yangyang from './yyzl/yangyang.js' // 阳阳助理
import mp3 from './yyzl/mp3.js'
import eooroReport from './yyzl/eooroReport.js'
// import cardReader from './yyzl/components/cardReader.vue'
import { imgList } from './yyzl/img.js'
import getvideo from './yyzl/getvideo.js'
import { mapGetters } from 'vuex';
import columTag from '@/components/TheTableColumnTag.vue';

export default {
  name: 'Splithh',
  mixins: [browser, mp3, eooroReport, photograph, yangyang,getvideo],
  components: {
    columTag,
    // msunPacsCheckModal,
    // cardReader
  },
  data() {
    return {
      seriousFlag:false,
      positiveRateStatus:false,
      patients: [],
      isEnd: false,
      scrollSpeed: 2,
      isPausing: false,
      patientInfo: '',
      yuyin: '',
      finding: '',
      conclusion: '',
      loading: false,
      sjLoading: null,
      localMac: localStorage.getItem('clientMac'),
      localIp: localStorage.getItem('clientIp'),
      broadcastChannel: null,
      yyzlInstance: null,
      registrationId: '',
      imageList: [],
      imgUrlBaogao: '',
      imgisAr: false,
      sysLocalSetting: {},
      interval:null,
      selectedPatient:{},
      serverConfigDialogVisible: false,
      serverConfigForm: {
        serverAddress: '',
        serverPort:'',
        deviceId: '',
        turnAddress: '',
        authAccount: '',
        authPassword: '',
        confidenceLevel:80
      },
    };
  },
  computed: {
    ...mapGetters({
      getpersonal93Setting: 'Global/getpersonal93Setting'
    }),
    // selectedPatient() {
    //   return this.patients?this.patients.find(item => item.registrationId === this.registrationId):null
    // },
    // imgs() {
    //     if(imgList.length){
    //       const img =  imgList.flatMap(item => item.imgs).map(item => {
    //         return {
    //           src: item,
    //           ischeck:false
    //         }
    //       })
    //       console.log(img)
    //       return img
    //     }
    //   return []
    // },
    imgs() {
        if(this.imageList.length){
          const img =  this.imageList.map(item => {
            return {
              src: item.src,
              ischeck:false
            }
          })
          return img
        }
      return []
    },
    img() {
      if(this.selectedPatient&&this.selectedPatient.stuBodypart){
        const arr = imgList.filter(item=>{return this.selectedPatient.stuBodypart.includes(item.title)})
        if(arr.length){
          const img =  arr.flatMap(item => item.imgs)
          return img
        }
      }
      return []
    }
  },
  watch: {
   async registrationId() {
      window.speechSynthesis.cancel()
      if(this.timeer){
        clearInterval(this.timeer)
        this.timeer = null
      }
      this.audioBoBao = false
      this.getPatientInfoById()
      this.getApplyInfoByRegId()
      await this.getList()
      
    },
  },
  created() {
    this.registrationId = this.$route.query.registrationId
    this.initYYZL(this.registrationId)
    this.broadcastChannel = new BroadcastChannel('app_channel');
    this.ImgWebsocketOnMessage()
    if (JSON.parse(localStorage.getItem('sysLocalSetting')) !== null && JSON.parse(localStorage.getItem('sysLocalSetting')).configJson !== null) {
      this.sysLocalSetting = JSON.parse(JSON.parse(localStorage.getItem('sysLocalSetting')).configJson);
    } else {
      this.$message.warning('未获取到本地配置，请在登记页重新配置本地诊室');
    }
    this.loadServerConfig();
  },
  mounted() {
    window.addEventListener('beforeunload', () => {
      this.destroyYYZL()
      this.broadcastChannel.postMessage({
        type: 'WINCLOSE'
      }); // 最好指定具体域名而非 '*'
    });
    this.interval = setInterval(() => {
      this.getList()
    },30000)
  },
  destroyed() {
    clearInterval(this.interval)
  },
  methods: {
     // 根据regId获取患者信息
    async getPatientInfoById() {
      await patientHttp
        .getPatientInfoById({ registrationId: this.registrationId })
        .then(data => {
          this.selectedPatient = data;
          const str = this.selectedPatient ? this.selectedPatient.patName + ',' + this.xingbie(this.selectedPatient) + ',' + this.selectedPatient.ageAliasName + ',' + this.selectedPatient.stuBodypart : ''
          this.speak(str)
          this.initVideo()
          this.initDeptConfig()
        })
        .catch(() => {});
    },
   getApplyInfoByRegId(){
      applyHttp.getApplyInfoByRegId({ registrationId: this.registrationId }).then(data => {
          data.forEach((element) => {
            this.past = this.past + element.mrAbstract
          });
        })
        .catch(() => {});
    },
    changeSeriousFlag(type){
      const data = {
        type:type,
        value:this[type]
      };
      this.broadcastChannel.postMessage({
        type: 'UPREPORT',
        data: data
      }); // 最好指定具体域名而非 '*'
    },
    selectPatient(item) {
      this.broadcastChannel.postMessage({
        type: 'UPPATIENT',
        data: item
      }); // 最好指定具体域名而非 '*'
    },
   async getList() {
     await patientHttp.getNewPatientList(this.setcanshu()).then(r => {
          this.patients = r
        })
    },
    ImgWebsocketOnMessage() {
      this.broadcastChannel.postMessage({
        type: 'GETIMGLIST'
      }); // 最好指定具体域名而非 '*'
    },
    getImg(e, type) {
      if (type === 'push') {
        if (e && e.data && e.data.previewUrl) {
          if (!this.imageList.some(item => item.imageId === e?.data?.imgId)) {
            this.imageList.push({
              src: e?.data?.previewUrl,
              imageId: e?.data?.imgId
            })
          }
        }
      } else if (type === 'all') {
        if (e.regId === this.registrationId) {
          this.imageList = e.imageList
        }
      }
    },
    handleImageLoad() {
      // 所有图片加载后重新计算
      if (this.$refs.bottom) {
        const imgs = this.$refs.bottom.querySelectorAll('img')
        if (Array.from(imgs).every(img => img.complete)) {
          const container = this.$refs.bottom;
          container.scrollLeft = container.scrollWidth;
        }
      }
    },
   async reset(){
       if (this.sjLoading&&this.sjLoading.visible) {
        this.sjLoading.close()
      }
      this.base64Length = 0
      this.imageList = []
      this.isEnd = false
      this.patientInfo = ''
      this.yuyin = ''
      this.finding = ''
      this.conclusion = ''
      this.imgisAr = false
      this.imgUrlBaogao = ''
      this.seriousFlag=false
      this.positiveRateStatus=false
      this.langAudio='';
      this.isAudio=false;
      this.audioBlob=null
      this.past=''
      this.imageAiUpNum=0 
      this.textIndex=0
      this.ischaru = false;
      this.isopen = false
      if(this.loadingTimeer){
      clearInterval(this.loadingTimeer)
      this.loadingTimeer=null
      }
      if(this.timeer){
        clearInterval(this.timeer)
        this.timeer=null
      }
      this.base64Strs=[]
      this.ImgAiConclusion=''
      this.ImgAiFinding=''
    },
    async changeRegisstrationId(id) {
      await this.reset()
      if (this.yyzlInstance) {
        this.yyzlInstance.init(id);
        await this.stopRecord()
      }
    },
    
    // 服务配置相关方法
    openServerConfigDialog() {
      this.serverConfigDialogVisible = true;
    },
    loadServerConfig() {
      try {
        const savedConfig = localStorage.getItem('yyzlServer');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          this.serverConfigForm = {
            serverAddress: config.serverAddress || '',
            serverPort:config.serverPort||'',
            deviceId: config.deviceId || '',
            turnAddress: config.turnAddress || '',
            authAccount: config.authAccount || '',
            authPassword: config.authPassword || '',
            confidenceLevel:config.confidenceLevel||80
          };
        } else {
          // 如果没有保存的配置，则清空表单
          this.serverConfigForm = {
            serverAddress: '',
            serverPort:'',
            deviceId: '',
            turnAddress: '',
            authAccount: '',
            authPassword: '',
            confidenceLevel:80
          };
        }
      } catch (error) {
        console.error('读取服务配置失败:', error);
        this.$message.error('读取服务配置失败');
      }
    },
    saveServerConfig() {
      try {
        const configToSave = {
          serverAddress: this.serverConfigForm.serverAddress,
          serverPort: this.serverConfigForm.serverPort,
          deviceId: this.serverConfigForm.deviceId,
          turnAddress: this.serverConfigForm.turnAddress,
          authAccount: this.serverConfigForm.authAccount,
          authPassword: this.serverConfigForm.authPassword,
          confidenceLevel:this.serverConfigForm.confidenceLevel
        };
        
        localStorage.setItem('yyzlServer', JSON.stringify(configToSave));
        this.$message.success('服务配置保存成功');
        this.serverConfigDialogVisible = false;
        this.lianjie()
      } catch (error) {
        console.error('保存服务配置失败:', error);
        this.$message.error('保存服务配置失败');
      }
    },
    cancelServerConfig() {
      this.serverConfigDialogVisible = false;
    },
    handleCloseServerConfig() {
      this.serverConfigDialogVisible = false;
    }
  }
};
</script>
<style scoped lang="less">
@import './yyzl.less';
</style>
<style>
.el-size-next, .el-size-prev{
  width: 130px !important;
  height: 130px !important;
  font-size: 60px !important;
}
.el-size-next{
  right: 200px  !important;
}
.el-size-prev{
  left: 200px  !important;
}
.my-table {
  background: #f0f2f5 !important;
  font-size: 14px;
}
.my-table tr{
  background:  #f0f2f5 !important;
}
.my-table tr th{
  background:  #f0f2f5 !important;
}

/* .my-table th.el-table__cell {
  background: #f0f2f5 !important;
}

.my-table td.el-table__cell {
  background: #f0f2f5 !important;
} */
</style>
