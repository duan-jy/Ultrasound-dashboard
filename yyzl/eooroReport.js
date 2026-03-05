import {cloneDeep} from 'lodash-es'
import { createSocket, onMessagecs } from './socketErrorReport';
import {getAiQualityControlResult} from './api.js';
import moment from 'moment';
// import { patientHttp } from "@/api/index.js";
export default {
  data() {
    return {
      errorReportList:[],
      response: {},
      pageNum:1,
      pageSize:10,
      totalData:0, // 总条数
      showReportPage:'showReportPage',
      postPacsCheckModalIsshow:false,
      iszhikong:false,
      choiceDate:'',
      chosedTimeOrigin: [moment().startOf('day').format('YYYY-MM-DD HH:mm:ss'), moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')], // 选择的时间
      pickerOptions: {
        onPick: ({ maxDate, minDate }) => {
          this.choiceDate = minDate.getTime();
          if (maxDate) {
            this.choiceDate = '';
          }
        },
        disabledDate: time => {
          if (this.choiceDate) {
            const one = 24 * 60 * 60 * 1000 * 30;
            const minTime = this.choiceDate - one;
            const maxTime = this.choiceDate + one;
            return time.getTime() < minTime || time.getTime() > maxTime;
          }
        },
        shortcuts: [
          {
            text: '今天',
            onClick(picker) {
              const end = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1);
              const start = new Date(new Date(new Date().toLocaleDateString()).getTime());
              // start.setTime(start.getTime() - 3600 * 1000 * 24);
              picker.$emit('pick', [start, end]);
            }
          },
          {
            text: '最近三天',
            onClick(picker) {
              const end = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1);
              const start = new Date(new Date(new Date().toLocaleDateString()).getTime());
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 2);
              picker.$emit('pick', [start, end]);
            }
          },
          {
            text: '最近7天',
            onClick(picker) {
              const end = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1);
              const start = new Date(new Date(new Date().toLocaleDateString()).getTime());
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 6);
              picker.$emit('pick', [start, end]);
            }
          },
          {
            text: '最近15天',
            onClick(picker) {
              const end = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1);
              const start = new Date(new Date(new Date().toLocaleDateString()).getTime());
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 14);
              picker.$emit('pick', [start, end]);
            }
          },
          {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1);
              const start = new Date(new Date(new Date().toLocaleDateString()).getTime());
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 29);
              picker.$emit('pick', [start, end]);
            }
          }
        ]
      },
    }
  },
  mounted(){
    this.eooroReport()
  },
  methods: {
    handleCloseServerConfig(){
      this.iszhikong = false
    },
    showDetail(row){
      this.response = cloneDeep(row)
      this.response.list = []
        if(this.response.msg){
          this.response.list.push({
            title:'历史报告质控',
            content:this.response.msg,
            type:'string'
          })
        }
        if(this.response.curMsg.length>0){
          this.response.list.push(
            {
              title:'矛盾质控',
              content:this.response.curMsg,
              type:'array'
            }
          )
        }
        if(this.response&&this.response.curWzMsg&&this.response.curWzMsg.questionList&&this.response.curWzMsg.questionList.length>0){
          this.response.list.push({
            title:'完整性质控',
            content:this.response.curWzMsg,
            type:'object'
          })
        }
        this.postPacsCheckModalIsshow = true
    },
     handleSizeChange(val) {
      this.pageSize = val
      this.pageNum = 1
      this.zhikongsearch()
    },
    handleCurrentChange(val) {
      this.pageNum = val
      this.zhikongsearch()
    },
    zhikongsearch(){
      getAiQualityControlResult({
        pageNum:this.pageNum,
        pageSize:this.pageSize,
        startTime:this.chosedTimeOrigin[0],
        endTime:this.chosedTimeOrigin[1],
        roomId:this.sysLocalSetting.currentStudyRoom
      }).then(res=>{
        this.errorReportList = res.list
      //   this.errorReportList.push({
      //   "intelligentLogId": "1942156772257062914",
      //   "registrationId": "1916446955112",
      //   "stuSerialNum": "",
      //   "patId": "-1",
      //   "patName": "王大勇",
      //   "sexId": 0,
      //   "aiFinding": "",
      //   "aiConclusion": "",
      //   "stuModalityVal": "",
      //   "generateFlag": 0,
      //   "failReason": "",
      //   "clientMac": "",
      //   "clientIp": "",
      //   "generateTime": "0",
      //   "deptId": "0",
      //   "hospitalId": "0",
      //   "invalidFlag": "0",
      //   "qualityCode": 0,
      //   "qualityMsg": "相同部位不同检查结果无问题",
      //   "curMsg": "",
      //   "imgAiFinding": "",
      //   "imgAiConclusion": "",
      //   "questionList": "",
      //   "modifyRate": 0,
      //   "source": null,
      //   "stuBodypart": 'fasdfasd',
      //   "patientProfileInput": null,
      //   "qualityControlInput": null,
      //   "patientProfile": null,
      //   "orgId": "10085"
      // })
        this.errorReportList.forEach(element => {
          element.msg = element.qualityMsg
          if(element.curMsg){
            element.curMsg = JSON.parse(element.curMsg)
          }else{
            element.curMsg = []
          }
          if(element.questionList){
          element.curWzMsg = {
            questionList:JSON.parse(element.questionList)
          }
          }else{
            element.curWzMsg = {
              questionList:[]
            }
          }
        });
        this.totalData = Number(res.total)
      })
    },
    setzhikong(){
      this.iszhikong = !this.iszhikong
      if(this.iszhikong){
        this.zhikongsearch()
      }
    },
    isWithin10Minutes(targetTime) {
        const now = moment();
        const target = moment(targetTime);
        const minutesDiff = now.diff(target, 'minutes');
        // 判断差值的绝对值是否 ≤ 10（即前后10分钟内）
        return Math.abs(minutesDiff) <= 10;
      },
    eooroReport(){
       // 创建危急值消息监听
      createSocket()
      // 注册消息回调函数
      onMessagecs((response) => {
        // console.log('报告质控提示',response)
        if(this.isWithin10Minutes(response.responseTime)&&this.sysLocalSetting?.IntelligentReportQualityControl&&response.stuRoomId+'' === this.sysLocalSetting.currentStudyRoom+''){
          this.$notify.error({
            title: 'AI质控提示',
            message: response.msg||'检查错误',
            onClick: () => {
                this.response = cloneDeep(response)
                if(response.curMsg){
                  this.response.curMsg = JSON.parse(response.curMsg)
                }
                if(response.curWzMsg){
                  this.response.curWzMsg = JSON.parse(response.curWzMsg)
                }else{
                  if(this.response.curWzMsg){
                  this.response.curWzMsg.questionList = []
                  }else{
                     this.response.curWzMsg = {
                      questionList:[]
                     }
                  }
                }
                this.showDetail(this.response)
              }
          });
        }else{
          this.response = {}
          this.postPacsCheckModalIsshow = false
        }
      })
    },
  }
}
