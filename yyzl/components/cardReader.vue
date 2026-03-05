<template>
    <div class="cardReader">
        <div class="top">
        <cardReader
          id="cardReader"
          ref="clearCard"
          style="width: 320px"
          :scene="'501010'"
          @read="readDebounce"
        />
         <div v-if = "iszhuyuan" style="width: fit-content;line-height:32px;margin-left: 4px;margin-right: 5px;">卡余额(含可透支额度): <span style="color:#FF7E00;font-size:17px;">￥{{balance}}</span></div>
          <div v-if = "iszhuyuan" style="width: fit-content;line-height:32px;margin-left: 4px;">住院押金余额(含可透支额度): <span style="color:#FF7E00;font-size:17px;">￥{{hospitalDeposit}}</span></div>
      </div>
    </div>
</template>
<script>
import {
  applyHttp
} from '@/api';
export default {
  data () {
    return {
      interval: null
    }
  },
  mounted () {
    this.init()
  },
  destroyed () {
    clearInterval(this.interval)
    this.interval = null
  },
  methods: {
    init(){
      const clearCard = this.$refs.clearCard
      clearCard.patCardNo = null
      this.interval =  setInterval(() => {
        clearCard.focus()
      }, 1000);
      if (clearCard) {
        const inputElements = clearCard.$el.querySelectorAll('input')
        inputElements.forEach((inputElement) => {
          inputElement.addEventListener('input', (e) => {
            if(e.target.value){
              this.$emit('clearCard',true)
            }
          })
        })
      }
    },
    readDebounce (data) {
      data.then(record=>{
        const params = {
          patId: record.patId,
          patCardNo: record.patTypeId+'' === '3' ? record.patCardNo : '',
          peisFlag: record.patTypeId+'' === '3' ? 1 : null,
          patType: Number(record.patTypeId),
          patCardForBalance: record.patCardNo
        };
         if (params.patType + '' === '1' || params.patType + '' === '3') {
            this.iszhuyuan = true;
            this.getCardBalance(params.patCardForBalance, params.patId);
          }
          if (params.patType + '' === '2') {
            this.iszhuyuan = false;
            this.getHospitalDeposit(params.patCardForBalance);
          }
         applyHttp
        .findNoExeItem(params)
        .then(async (data) => {
          console.log(data)
        })
      })
    }
  }
}
</script>
<style scoped lang="less">
.cardReader{
  width: 80vw;
  background: #fff;
  height: 90vh;
  top: 5vh;
  border-radius: 10px;
  box-shadow: 0 0 10px #757575;
}
.top{
  height: 80px;
  display: flex;
  padding: 0 10px;
  align-items: center;
  border-bottom:solid 5px #afafaf
}
</style>