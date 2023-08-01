<template>
  <div class="app-container">
    <el-button @click="play">播放</el-button>
    <el-button @click="stop">停止</el-button>
    <WsPlayer
      ref="wsPlayer"
      :wsUrl="wsUrl"
      :isShowClose="true"
      :isShowDelta="true"
    >
      <template>
        <div class="title">视频标题</div>
      </template>
    </WsPlayer>
  </div>
</template>

<script>
import WsPlayer from "@/components/WsPlayer";
export default {
  components: {
    WsPlayer,
  },
  data() {
    return {
      wsUrl: "ws://192.168.100.110:9080/20230513922071654252",
    };
  },
  methods: {
    play() {
      this.$refs.wsPlayer.open();
    },
    stop() {
      this.$refs.wsPlayer.close();
    },
  },
};
</script>

<style lang="scss" scoped>
.title {
  position: absolute;
  background: #000;
  color: #fff;
  padding: 0 5px;
  left: 5px;
  top: 5px;
}
</style>
