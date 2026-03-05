export default {
  data() {
    return {
      textList:[
      '分析医生语音内容...',
      '分析患者历史检查记录...',
      '对比超声医学知识库...',
      '智能生成报告内容...',
      '格式化解析输出...'],
      textIndex:0,
      loadingTimeer:null
    };
  },
  watch: {
    finding(val){
      if(val){
          this.jiesu()
        }
    },
    conclusion(val){
      if(val){
          this.jiesu()
        }
    },
    isopen(val,oldvalue) {
      if (oldvalue&&!val) {
        this.speak('正在生成报告内容,请稍后',true)
        this.textIndex = 0;
        // this.loadingTimeer = setInterval(()=>{
        //   this.textIndex++;
        //   if (this.textIndex>=this.textList.length) {
        //     this.textIndex = 1;
        //   }
        // },2000)
        this.loadingTimeer = setInterval(() => {
          // 获取loading文字元素
          const loadingTextEl = document.querySelector('.el-loading-text');
          if (loadingTextEl) {
            if(this.textIndex === 0){
              loadingTextEl.textContent = ''
            }
            // 添加淡出效果
            loadingTextEl.style.transition = 'opacity 0.5s ease';
            loadingTextEl.style.whiteSpace = 'pre-wrap'
            // 延迟切换文字并添加淡入效果
            if(this.textIndex < this.textList.length-1){
              // setTimeout(() => {
                // 更新索引
                this.textIndex +=1;
                // 切换文字
                loadingTextEl.textContent = loadingTextEl.textContent+'\n'+this.textList[this.textIndex];
              // }, 500); // 与淡出动画时长一致
            }
          }
        }, 1000); // 2秒切换一次
      }else{
    this.jiesu()
      }
    }
  },
  mounted() {},
  destroyed() {
    this.jiesu()
  },
  methods: {
    jiesu(){
      if(this.loadingTimeer){
        clearInterval(this.loadingTimeer)
        this.loadingTimeer=null
      }
    }
  }
};
