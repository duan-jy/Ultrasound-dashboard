export default {
  data() {
    return {
      isopen: false, //false是第一次点击开启，不要走接口。true是关闭，走接口
      startX: 0,
      ischaru: false,
      currentIndex: 0,
      _prevListener: null,
      _nextListener: null,
      dialogVisible: false,
      dialogDescribeVisible: false,
    };
  },
  mounted() {
    const _this = this;
    document.addEventListener('keyup', function (event) {
      // 这里能获取按键信息
      if ((event.keyCode === 49 || event.which === 49) && event.key === '1') {
        _this.anjian();
      }
    });
  },
  destroyed() {
    this.removeButtonListeners();
  },
  methods: {
    openDescribeDialog() {
      this.dialogDescribeVisible = true
    },
    openDialog() {
      this.dialogVisible = true
    },
    quchu() {
      this.imgs.forEach((item) => {
        item.ischeck = false
      })
      this.$forceUpdate();
      this.chatu([]);
      this.ischaru = false;
      this.$message.success('去除成功');
    },
    charu() {
      const arr = this.imgs.filter((item) => item.ischeck)
      if (arr.length) {
        this.chatu(arr);
        this.ischaru = true;
        this.$message.success('插入成功');
      }
    },
    chatu(arr) {
      this.broadcastChannel.postMessage({
        type: 'CHATU',
        data: arr
      }); // 最好指定具体域名而非 '*'
    },
    // 监听上一张/下一张按钮
    setupButtonListeners(button) {
      // 延迟确保DOM渲染完成
      this.$nextTick(() => {
        // 移除旧监听避免重复
        this.removeButtonListeners();

        // 获取按钮元素
        const prevBtn = document.querySelector('.el-image-viewer__prev');
        const nextBtn = document.querySelector('.el-image-viewer__next');

        if (!prevBtn || !nextBtn) return;
        nextBtn.classList.add('el-size-next');
        prevBtn.classList.add('el-size-prev');
        // 添加点击监听
        this._prevListener = () => {
          this.currentIndex = this.currentIndex - 1;
          if (this.currentIndex < 0) {
            this.currentIndex = this.imgs.length - 1;
          }
          this.setButtonColor(button);
        };
        this._nextListener = () => {
          this.currentIndex = this.currentIndex + 1;
          if (this.currentIndex > this.imgs.length - 1) {
            this.currentIndex = 0;
          }
          this.setButtonColor(button);
        };

        prevBtn.addEventListener('click', this._prevListener);
        nextBtn.addEventListener('click', this._nextListener);
      }, 300); // 适当延迟确保按钮渲染
    },
    // 移除监听
    removeButtonListeners() {
      if (this._prevListener) {
        document.querySelector('.el-image-viewer__prev')?.removeEventListener('click', this._prevListener);
      }
      if (this._nextListener) {
        document.querySelector('.el-image-viewer__next')?.removeEventListener('click', this._nextListener);
      }
    },
    handleClick(index) {
      this.currentIndex = index;
      // 图片点击时执行
      this.$nextTick(() => {
        // 等待预览弹窗渲染完成后添加按钮
        this.addCustomButton();
      });
    },

    addCustomButton() {
      // 查找图片预览组件
      const viewer = document.querySelector('.el-image-viewer__actions__inner');
      if (!viewer) return;

      // 创建自定义按钮
      const button = document.createElement('i');
      button.className = 'el-icon-folder-checked';
      // 根据索引设置按钮颜色
      this.setButtonColor(button);
      button.onclick = () => this.customAction(button);
      // 添加到预览组件
      viewer.appendChild(button);
      this.setupButtonListeners(button);
    },
    // 获取当前图片索引
    getCurrentImageIndex() {
      const currentImage = document.querySelector('.el-image-viewer__img[style*="display: block"]');
      if (currentImage) {
        const imageUrl = currentImage.src;
        return this.imageList.findIndex(url => url === imageUrl);
      }
      return 0;
    },
    // 根据索引设置按钮颜色
    setButtonColor(button) {
      // 定义颜色映射表
      const colors = [
        '#409EFF', // 第一张图 - 蓝色（Element UI默认）
        '#fff' // 第二张图 - 黑色
      ];
      // 根据索引选择颜色
      const color = this.imgs[this.currentIndex].ischeck ? colors[0] : colors[1];
      // 应用颜色样式
      button.style.color = color;
    },
    customAction(button) {
      this.imgs[this.currentIndex].ischeck = !this.imgs[this.currentIndex].ischeck;
      this.setButtonColor(button);
      this.$forceUpdate();
    },
    anjian() {
      this.stopRecord(true, this.isopen);
      this.isopen = !this.isopen;
      if (this.isopen) {
        this.langAudio = '';
        this.isAudio = false;
        this.audioBlob = null
      }
    },
  }
};
