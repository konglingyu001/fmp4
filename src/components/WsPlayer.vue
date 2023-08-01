<template>
  <div class="wsplayer">
    <div class="video-wrapper">
      <div class="video-inner" v-loading="isLoading && isPlay">
        <div class="close" v-if="!isLoading && isPlay && isShowClose" @click="close">×</div>
        <div class="delta" v-if="!isLoading && isPlay && isShowDelta">
          {{ getDelta(delta) }}
        </div>
        <video
          @dblclick="screenfullChange"
          v-if="isPlay"
          :id="videoId"
          muted
          autoplay
          :controls="false"
        ></video>
        <div v-else>无信号</div>
        <slot v-if="!isLoading && isPlay" />
      </div>
    </div>
  </div>
</template>

<script>
import WsPlayer from "@/utils/WsPlayer/index";
import screenfull from "screenfull";
export default {
  components: {},
  props: {
    /*  videoId: {
      type: String,
      default: "",
    }, */
    wsUrl: {
      type: String,
      default: "",
    },
    isShowClose: {
      type: Boolean,
      default: false,
    },
    isShowDelta: {
      type: Boolean,
      default: false,
    },
  },

  // 定义属性
  data() {
    return {
      videoId: "",
      isPlay: false,
      isLoading: true,
      delta: 0,
      wsplayer: null,
    };
  },

  // 计算属性，会监听依赖属性值随之变化
  computed: {
    getDelta() {
      return function (num) {
        let number = (parseInt(num * 10) / 10).toFixed(1);
        return number;
      };
    },
  },
  // 监控data中的数据变化
  watch: {
    wsUrl: {
      handler() {
        this.open();
      },
      deep: true,
    },
  },
  // 方法集合
  methods: {
    screenfullChange() {
      if (!screenfull.isEnabled) {
        // 如果不支持进入全屏，发出不支持提示
        this.$message({
          message: "您的浏览器版本过低不支持全屏显示！",
          type: "warning",
        });
        return false;
      }
      let currElement = document.getElementById(this.videoId);
      screenfull.toggle(currElement);
    },
    open() {
      this.videoId = this.$getUuid();
      if (this.videoId && this.wsUrl) {
        this.close();
        this.delta = 0;
        this.isPlay = true;
        // this.isLoading = true;
        this.wsplayer = new WsPlayer(this.videoId, this.wsUrl, {
          isReConnect: true,
          onSourceOpen: () => {
            this.isLoading = false;
          },
          onDelta: (videoId, delta) => {
            this.delta = delta;
          },
        });
      }
    },
    close() {
      this.isPlay = false;
      this.wsplayer && this.wsplayer.close();
      this.wsplayer = null;
    },
  },
};
</script>

<style lang='scss' scoped>
video {
  display: block;
  width: 100%;
  height: 100%;
}
video::-webkit-media-controls-enclosure {
  /*禁用播放器控制栏的样式*/
  display: none !important;
}
.video-wrapper {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  .video-inner {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #ccc;
    .close{
      position: absolute;
      z-index: 99;
      cursor: pointer;
      right: 5px;
      top: 5px;
      padding: 0 5px;
    }
    .delta {
      position: absolute;
      background: #000;
      color: #fff;
      left: 5px;
      bottom: 5px;
      padding: 0 5px;
    }
  }
}
</style>