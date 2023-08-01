<template>
  <div class="app-container">
    <div class="content">
      <el-row :gutter="17">
        <el-col :xs="24" :sm="5" :lg="5">
          <div class="device">
            <div class="device-list">
              <p>设备列表</p>
              <div
                class="device-item"
                v-for="(item, index) in deviceList"
                :key="index"
                @click="selectDevice(item)"
              >
                {{ item.name }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="19" :lg="19">
          <div class="video">
            <div class="video-button">
              <el-button
                :type="currentType == 1 ? 'primary' : ''"
                @click="changeType('1')"
                >单屏</el-button
              >
              <el-button
                :type="currentType == 4 ? 'primary' : ''"
                @click="changeType('4')"
                >四分屏</el-button
              >
              <el-button
                :type="currentType == 9 ? 'primary' : ''"
                @click="changeType('9')"
                >九分屏</el-button
              >
              <el-button
                :type="currentType == 16 ? 'primary' : ''"
                @click="changeType('16')"
                >十六分屏</el-button
              >
              <el-button :type="isPolling ? 'primary' : ''" @click="polling"
                >轮询</el-button
              >
              <el-button @click="screenfullChange('')">全屏</el-button>
            </div>
            <div
              ref="box"
              class="video-list"
              :class="getTypeClass(currentType)"
            >
              <div
                class="video-item"
                v-for="(item, index) in videoList"
                :key="index"
                @dblclick="screenfullChange(item.deviceId)"
                @click="selectVideo(index)"
                :ref="item.deviceId"
              >
                <div class="video-wrapper">
                  <div
                    class="video-inner"
                    :class="currentSelect == index ? 'on' : ''"
                  >
                    <div v-if="item.deviceId" v-loading="item.loading">
                      <p class="video-title">
                        {{ item.name }}----{{ item.deviceId }}
                      </p>
                      <div
                        v-if="!isPolling"
                        class="video-close"
                        @click.stop="stopPlay(item.deviceId)"
                      >
                        ×
                      </div>
                      <video
                        :id="item.deviceId"
                        muted
                        autoplay
                        :controls="false"
                      ></video>
                    </div>
                    <div class="no-video" v-else>无信号</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    <el-dialog title="轮询配置" :visible.sync="dialogVisible">
      <div>
        <p>轮询列表</p>
        <el-checkbox
          :indeterminate="isIndeterminate"
          v-model="checkAll"
          @change="handleCheckAllChange"
          >全选</el-checkbox
        >
        <div style="margin: 15px 0"></div>
        <el-checkbox-group
          v-model="checkedDevice"
          @change="handleCheckedDeviceChange"
        >
          <el-checkbox
            v-for="item in deviceList"
            :label="item.deviceId"
            :key="item.deviceId"
            >{{ item.name }}</el-checkbox
          >
        </el-checkbox-group>
      </div>
      <div>
        <p>轮询间隔</p>
        <el-input v-model="interval"></el-input>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import screenfull from "screenfull";
import WsPlayer from "@/utils/wsPlayer";
export default {
  components: {},
  // 定义属性
  data() {
    return {
      wsUrlHead: "ws://192.168.100.110:9080/",
      deviceList: [
        {
          name: "视频1",
          deviceId: "20230513922071654252",
        },
        {
          name: "视频2",
          deviceId: "20230336616101370828",
        },
        {
          name: "视频3",
          deviceId: "20230337915380818786",
        },
        {
          name: "视频4",
          deviceId: "20230339315352677613",
        },
        {
          name: "视频5",
          deviceId: "20230339415340774876",
        },
        {
          name: "视频6",
          deviceId: "20230423916202354347",
        },
        {
          name: "视频7",
          deviceId: "20230505016432486848",
        },
        {
          name: "视频8",
          deviceId: "20230507316445949993",
        },
        {
          name: "视频9",
          deviceId: "20230508716424288718",
        },
        {
          name: "视频10",
          deviceId: "20230512616550242037",
        },
        {
          name: "视频11",
          deviceId: "20230604110381582349",
        },
        {
          name: "视频12",
          deviceId: "20230613009193753860",
        },
        {
          name: "视频13",
          deviceId: "20230613309153464087",
        },
        {
          name: "视频14",
          deviceId: "20230614009174419984",
        },
        {
          name: "视频15",
          deviceId: "20230614709203350764",
        },
        {
          name: "视频16",
          deviceId: "20230614909181435887",
        },
        {
          name: "视频17",
          deviceId: "20230615109200383699",
        },
        {
          name: "视频18",
          deviceId: "20230615209163211342",
        },
        {
          name: "视频19",
          deviceId: "20230615409150059340",
        },
        {
          name: "视频20",
          deviceId: "20230617809160040780",
        },
        {
          name: "视频21",
          deviceId: "20230618609183894450",
        },
      ],
      videoList: [
        {
          name: "",
          deviceId: "",
          next: {
            name: "",
            deviceId: "",
          },
          player: null, //ws播放
          timmer: null, //定时器
        },
      ],
      currentType: 1, //当前分屏类型

      currentSelect: -1, //当前选择视频下标
      clearIndex: -1, //上一次清除的定时器
      selectTimmer: null, //防止双击触发单击事件

      isPolling: false, //是否在轮询

      dialogVisible: false,
      isIndeterminate: false,
      checkAll: false,
      checkedDevice: [],
      checkedDevices: [], //补充后的选项
      interval: 5,
    };
  },
  // 计算属性，会监听依赖属性值随之变化
  computed: {
    getTypeClass() {
      return function (type) {
        let className = "";
        switch (Number(type)) {
          case 1:
            className = "type1";
            break;
          case 4:
            className = "type2";
            break;
          case 9:
            className = "type3";
            break;
          case 16:
            className = "type4";
            break;
          default:
            className = "type1";
            break;
        }
        return className;
      };
    },
  },
  // 监控data中的数据变化
  watch: {},
  // 方法集合
  methods: {
    screenfullChange(id) {
      this.selectTimmer && clearTimeout(this.selectTimmer);
      if (!screenfull.isEnabled) {
        // 如果不支持进入全屏，发出不支持提示
        this.$message({
          message: "您的浏览器版本过低不支持全屏显示！",
          type: "warning",
        });
        return false;
      }
      if (id) {
        let currElement = this.$refs[id][0];
        screenfull.toggle(currElement);
      } else {
        screenfull.toggle(this.$refs.box);
      }
    },
    stopPlay(deviceId) {
      if (deviceId) {
        let indexs = -1;
        this.videoList.map((item, index) => {
          if (item.deviceId == deviceId) {
            indexs = index;
          }
        });
        this.videoList[indexs].timmer &&
          clearInterval(this.videoList[indexs].timmer);
        this.videoList[indexs].player.close();
        this.$set(this.videoList[indexs], "name", "");
        this.$set(this.videoList[indexs], "deviceId", "");
        this.$set(this.videoList[indexs], "next", { name: "", deviceId: "" });
        this.$set(this.videoList[indexs], "player", null);
        this.$set(this.videoList[indexs], "timmer", null);
      } else {
        this.videoList.map((item, index) => {
          item.timmer && clearInterval(item.timmer);
          item.player && item.player.close();
          this.$set(this.videoList[index], "name", "");
          this.$set(this.videoList[index], "deviceId", "");
          this.$set(this.videoList[index], "next", { name: "", deviceId: "" });
          this.$set(this.videoList[index], "player", null);
          this.$set(this.videoList[index], "timmer", null);
        });
        this.currentSelect = -1;
        this.clearIndex = -1;
      }
    },
    changeType(val) {
      let length = this.videoList.length;
      this.currentType = val;
      if (this.isPolling) {
        let devices = this.checkedDevice;
        if (devices.length <= val) {
          //勾选小于等于分屏，补充
          while (devices.length < val) {
            devices = devices.concat(devices.slice(0, val - devices.length));
          }
        }
        this.checkedDevices = devices;
        // this.$message("当前正在轮播中！");
        if (length <= val) {
          for (let index = length; index < val; index++) {
            let current = this.getCurrent(this.checkedDevices[index]);
            let next = this.getNext(this.checkedDevices, current.deviceId);
            let obj = {};
            obj.name = current.name;
            obj.deviceId = current.deviceId + "video" + index;
            obj.next = next;
            obj.player = new WsPlayer(
              current.deviceId + "video" + index,
              this.wsUrlHead + current.deviceId
            );
            obj.loading=true
            obj.player.onSourceOpen = () => {
            obj.loading=false
              obj.timmer = setInterval(() => {
                obj.player && obj.player.close();
                obj.player = new WsPlayer(
                  obj.next.deviceId + "video" + index,
                  this.wsUrlHead + obj.next.deviceId
                );
                obj.name = obj.next.name;
                obj.deviceId = obj.next.deviceId + "video" + index;
                obj.next = this.getNext(devices, obj.next.deviceId);
              }, this.interval * 1000);
            };
            this.videoList.push(obj);
          }
          console.log("添加视频");
        } else {
          this.videoList.map((item, index) => {
            if (index >= val) {
              item.timmer && clearInterval(item.timmer);
              item.player && item.player.close();
              item.player = null;
              item.timmer = null;
            }
          });
          this.videoList.splice(val, length - val);
          console.log("删除视频");
        }
      } else {
        if (length <= val) {
          for (let index = 0; index < val - length; index++) {
            this.videoList.push({
              name: "",
              deviceId: "",
            });
          }
        } else {
          this.videoList.map((item, index) => {
            if (index >= val) {
              item.player && item.player.close();
            }
          });
          this.videoList.splice(val, length - val);
        }
      }
    },
    selectDevice(val) {
      if (this.isPolling) {
        this.$message("当前正在轮播中！");
        return;
      }
      if (this.currentSelect != -1) {
        let element=this.videoList[this.currentSelect]
        element.player &&
          element.player.close();
        element.deviceId =
          val.deviceId + "video" + this.currentSelect;
        element.name = val.name;
        element.player = new WsPlayer(
          val.deviceId + "video" + this.currentSelect,
          this.wsUrlHead + val.deviceId
        );
        element.loading = true;
        element.player.onSourceOpen = () => {
          element.loading = false;
          this.$forceUpdate();
        };
      } else {
        for (let index = 0; index < this.videoList.length; index++) {
          const element = this.videoList[index];
          if (!element.deviceId) {
            element.deviceId = val.deviceId + "video" + index;
            element.name = val.name;
            element.player = new WsPlayer(
              val.deviceId + "video" + index,
              this.wsUrlHead + val.deviceId
            );
            element.loading = true;
            element.player.onSourceOpen = () => {
              element.loading = false;
              this.$forceUpdate();
            };
            break;
          }
        }
      }
    },
    selectVideo(index) {
      this.selectTimmer && clearTimeout(this.selectTimmer);
      this.selectTimmer = setTimeout(() => {
       if (
        this.clearIndex != -1 &&
        this.clearIndex <= this.videoList.length - 1 &&
        this.isPolling
      ) {
        let obj = this.videoList[this.clearIndex];
        obj.timmer && clearInterval(obj.timmer);
        obj.timmer = setInterval(() => {
          obj.player && obj.player.close();
          obj.player = new WsPlayer(
            obj.next.deviceId + "video" + index,
            this.wsUrlHead + obj.next.deviceId
          );
          obj.loading=true
          obj.player.onSourceOpen=()=>{
            obj.loading = false;
            this.$forceUpdate();
          }
          obj.name = obj.next.name;
          obj.deviceId = obj.next.deviceId + "video" + index;
          obj.next = this.getNext(this.checkedDevices, obj.next.deviceId);
        }, this.interval * 1000);
      }
      if (this.currentSelect == index) {
        //取消当前选中
        this.currentSelect = -1;
      } else {
        //选中其他
        this.currentSelect = index;
        if (this.player) {
          this.player.onSourceOpen = null;
        }
        this.videoList[index].timmer &&
          clearInterval(this.videoList[index].timmer);
        this.videoList[index].timmer = null;
      }
      this.clearIndex = index;
      }, 300);
    },
    stopPolling() {
      this.isPolling = false;
      this.stopPlay();
    },
    polling() {
      if (this.isPolling) {
        this.isPolling = false;
        this.stopPolling();
      } else {
        this.dialogVisible = true;
      }
    },
    handleCheckAllChange(val) {
      if (val) {
        let arr = [];
        this.deviceList.map((item) => {
          arr.push(item.deviceId);
        });
        this.checkedDevice = arr;
      } else {
        this.checkedDevice = [];
      }
      this.isIndeterminate = false;
    },
    handleCheckedDeviceChange(val) {
      let arr = [];
      this.deviceList.map((item) => {
        arr.push(item.deviceId);
      });
      this.checkedDevice.sort((a, b) => {
        return arr.indexOf(a) - arr.indexOf(b);
      });
      let checkedCount = val.length;
      this.checkAll = checkedCount === this.deviceList.length;
      this.isIndeterminate =
        checkedCount > 0 && checkedCount < this.deviceList.length;
    },
    submit() {
      if (this.checkedDevice.length == 0) {
        this.$message("请选择轮询列表!");
        return;
      }
      if (!this.interval) {
        this.$message("请输入轮询间隔!");
        return;
      }
      this.dialogVisible = false;
      this.isPolling = true;
      this.setPolling();
    },
    setPolling() {
      let devices = this.checkedDevice;
      let count = this.currentType;
      if (devices.length <= count) {
        //勾选小于等于分屏，补充
        while (devices.length < count) {
          devices = devices.concat(devices.slice(0, count - devices.length));
        }
      }
      this.checkedDevices = devices;
      this.setVideoList();
    },
    setVideoList() {
      let devices = this.checkedDevices;
      let interval = this.interval;
      let arrs = [];
      this.stopPlay();
      devices.slice(0, this.currentType).map((item, index) => {
        let current = this.getCurrent(item);
        let next = this.getNext(devices, current.deviceId);
        let obj = {};
        obj.name = current.name;
        obj.deviceId = current.deviceId + "video" + index;
        obj.next = next;
        obj.player = new WsPlayer(
          current.deviceId + "video" + index,
          this.wsUrlHead + current.deviceId
        );
        obj.loading = true;
        obj.player.onSourceOpen = () => {
          obj.loading = false;
          if (index != this.currentSelect) {
            obj.timmer = setInterval(() => {
              obj.player && obj.player.close();
              obj.player = new WsPlayer(
                obj.next.deviceId + "video" + index,
                this.wsUrlHead + obj.next.deviceId
              );
              obj.loading = true;
              obj.player.onSourceOpen=()=>{
                obj.loading = false;
              }
              obj.name = obj.next.name;
              obj.deviceId = obj.next.deviceId + "video" + index;
              obj.next = this.getNext(devices, obj.next.deviceId);
            }, interval * 1000);
          }
        };
        arrs.push(obj);
      });
      this.videoList = arrs;
    },
    getCurrent(deviceId) {
      let item = this.deviceList.filter((item) => {
        return item.deviceId == deviceId;
      })[0];
      return item;
    },
    getNext(arr, deviceId) {
      let index = arr.indexOf(deviceId);
      let next = {};
      if (index == arr.length - 1) {
        next = {
          name: this.getCurrent(arr[0]).name,
          deviceId: this.getCurrent(arr[0]).deviceId,
        };
      } else {
        next = {
          name: this.getCurrent(arr[index + 1]).name,
          deviceId: this.getCurrent(arr[index + 1]).deviceId,
        };
      }
      return next;
    },
  },
  // 生命周期 - 创建完成（可以访问当前this实例）
  created() {},
  // 生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {},
  beforeCreate() {}, // 生命周期 - 创建之前
  beforeMount() {}, // 生命周期 - 挂载之前
  beforeUpdate() {}, // 生命周期 - 更新之前
  updated() {}, // 生命周期 - 更新之后
  beforeDestroy() {}, // 生命周期 - 销毁之前
  destroyed() {
    this.stopPolling();
    this.selectTimmer && clearTimeout(this.selectTimmer);
  }, // 生命周期 - 销毁完成
  activated() {}, // 如果页面有keep-alive缓存功能，这个函数会触发
};
</script>
<style>
body {
  margin: 0;
  width: 100vw;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
}
video {
  display: block;
  width: 100%;
  height: 100%;
}
video::-webkit-media-controls-enclosure {
  /*禁用播放器控制栏的样式*/
  display: none !important;
}
</style>
<style lang='scss' scoped>
.app-container {
  padding: 30px;
}
.content {
  padding: 0 30px;
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

    box-sizing: border-box;
    border: 1px solid transparent;
    > div {
      width: 100%;
      height: 100%;
    }
    .no-video {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  .on {
    border: 1px solid red;
  }
}
.device-list {
  .device-item {
    padding: 5px 0 5px 5px;
    cursor: pointer;
    &:hover {
      background: #ccc;
    }
  }
}
.video-list {
  margin-top: 10px;
  // display: flex;
  // flex-wrap: wrap;
  .video-item {
    float: left;
    box-sizing: border-box;
    background: #ccc;
    border: 1px solid #524f4f;
    .video-title {
      position: absolute;
      left: 2px;
      top: 2px;
      font-size: 12px;
      background: #000;
      color: #fff;
      padding: 5px;
      margin: 0;
    }
    .video-close {
      position: absolute;
      right: 2px;
      top: 2px;
      color: #000;
      font-size: 30px;
      cursor: pointer;
      z-index: 999;
    }
  }
}
.type1 {
  .video-item {
    width: 100%;
  }
}
.type2 {
  .video-item {
    width: 50%;
  }
}
.type3 {
  .video-item {
    width: 33.3%;
  }
}
.type4 {
  .video-item {
    width: 25%;
  }
}
</style>