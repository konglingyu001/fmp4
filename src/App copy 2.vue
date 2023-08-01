<template>
  <div id="app">
    <el-row :gutter="17">
      <el-col :xs="24" :sm="24" :lg="24">
        <div ref="box" class="box">
          <div class="video_title">
            <p class="title">视频列表</p>
            <img
              :src="isFullscreen ? fullscreenImg : fullscreenExitImg"
              alt=""
              @click="screenfullChange('')"
            />
          </div>
          <div class="video_list">
            <div
              ref="video"
              class="video_item"
              :class="getClass"
              v-for="item in playList"
              :key="item.id"
              @dblclick="screenfullChange(item.id)"
            >
              <span class="id">{{ item.id }}</span>
              <video :id="item.id" muted autoplay :controls="false"></video>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :lg="24">
        <div>
          <div class="title_list">
            <p class="title">流媒体列表</p>
          </div>
          <div class="camera_list">
            <el-button @click="add">添加</el-button>
            <el-table :data="deviceList" style="width: 100%">
              <el-table-column prop="name" label="名称"> </el-table-column>
              <el-table-column label="地址">
                <template slot-scope="scope">
                  <span>{{ wsUrlHead + scope.row.deviceId }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="address" label="操作">
                <template slot-scope="scope">
                  <el-button
                    type="text"
                    v-if="!isPlay(scope.row.name)"
                    @click="connect(scope.row)"
                    >连接</el-button
                  >
                  <el-button
                    type="text"
                    v-else
                    @click="disconnect(scope.row.name)"
                    >断开</el-button
                  >
                  <el-button type="text" @click="deleteItem(scope.row.name)"
                    >删除</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog title="新增视频流" :visible.sync="dialogVisible">
      <el-form :model="dialogForm">
        <el-form-item label="名称">
          <el-input v-model="dialogForm.name" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="设备ID">
          <el-input v-model="dialogForm.deviceId" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addItem">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import screenfull from "screenfull";
import WsPlayer from "./wsPlayer";
export default {
  components: {},
  // 定义属性
  data() {
    return {
      fullscreenImg: require("@/assets/icon/fullscreen.png"),
      fullscreenExitImg: require("@/assets/icon/fullscreen-exit.png"),
      isFullscreen: false,
      playList: [],
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
        /* {
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
        }, */
      ],
      dialogVisible: false,
      dialogForm: {},
      wsUrlHead: "ws://192.168.100.110:9080/",
    };
  },
  // 计算属性，会监听依赖属性值随之变化
  computed: {
    getClass() {
      let length = Number(this.playList.length);
      let string = "";
      switch (true) {
        case length <= 1:
          string = "box_1";
          break;
        case length <= 4:
          string = "box_2";
          break;
        case length <= 9:
          string = "box_3";
          break;
        case length > 9:
          string = "box_4";
          break;
      }
      return string;
    },
    isPlay() {
      return function (name) {
        if (
          this.playList.filter((item) => {
            return item.name == name;
          }).length
        ) {
          return true;
        } else {
          return false;
        }
      };
    },
  },
  // 监控data中的数据变化
  watch: {},
  // 方法集合
  methods: {
    screenfullChange(id) {
      if (!screenfull.isEnabled) {
        // 如果不支持进入全屏，发出不支持提示
        this.$message({
          message: "您的浏览器版本过低不支持全屏显示！",
          type: "warning",
        });
        return false;
      }
      if (id) {
        let currElement = document.getElementById(id);
        screenfull.toggle(currElement);
      } else {
        screenfull.toggle(this.$refs.box);
      }
    },
    add() {
      this.dialogForm = {};
      this.dialogVisible = true;
    },
    addItem() {
      if (
        this.playList.filter((item) => {
          return item.name == this.dialogForm.name;
        })
      ) {
        this.$message({
          title: "提示",
          content: "名称已存在",
        });
        return;
      }
      this.deviceList.push({
        name: this.dialogForm.name,
        url: this.wsUrlHead + this.dialogForm.deviceId,
      });
      this.dialogVisible = false;
    },
    deleteItem(name) {
      let index = this.deviceList.findIndex((item) => {
        return item.name == name;
      });
      this.deviceList.splice(index, 1);
      this.disconnect(name);
    },
    connect(row) {
      let id = row.deviceId;
      let name = row.name;
      let url = this.wsUrlHead + row.deviceId;
      let player = new wsPlayer(name, id, url);
      this.playList.push({
        id: id,
        name: name,
        player: player,
      });
      player.open();
    },
    disconnect(name) {
      let index = this.playList.findIndex((item) => {
        return item.name == name;
      });
      this.playList[index].player.close();
      this.playList.splice(index, 1);
    },
  },
  // 生命周期 - 创建完成（可以访问当前this实例）
  created() {},
  // 生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {
    this.deviceList.map((item, index) => {
      let id = item.deviceId;
      let player = new wsPlayer(item.name, id, this.wsUrlHead + item.deviceId);
      this.playList.push({
        id: id,
        name: item.name,
        player: player,
      });
      player.open();
    });
    //阻止报错?
    window.onerror = function () {
      return true;
    };
    this.timmer1 = setInterval(() => {
      // 监测内存使用情况：
      if (window.performance && window.performance.memory) {
        var memory = performance.memory;
        console.log("Memory usage: " + memory.usedJSHeapSize + " bytes.");
      }
    }, 1000 * 5);
    this.timmer2 = setInterval(() => {
      console.clear();
    }, 1000 * 60 * 60);
  },
  beforeCreate() {}, // 生命周期 - 创建之前
  beforeMount() {}, // 生命周期 - 挂载之前
  beforeUpdate() {}, // 生命周期 - 更新之前
  updated() {}, // 生命周期 - 更新之后
  beforeDestroy() {
    this.playList.map((item) => {
      item.player && item.player.close();
    });
    this.timmer1 && clearInterval(this.timmer1);
    this.timmer2 && clearInterval(this.timmer2);
  }, // 生命周期 - 销毁之前
  destroyed() {}, // 生命周期 - 销毁完成
  activated() {}, // 如果页面有keep-alive缓存功能，这个函数会触发
};
</script>
<style>
body {
  padding: 0;
  margin: 0;
}
/*全屏操作后  自带的控制栏会显示  在显示的时候隐藏*/
video::-webkit-media-controls {
  display: none !important;
}
.controls {
  z-index: 2147483647;
  opacity: 1;
}
</style>
<style lang='scss' scoped>
#app {
  padding: 10px;
}
.title {
  text-align: center;
}
.box {
  background: #fff;
}
.video_title {
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    display: block;
    width: 30px;
    cursor: pointer;
  }
}
.video_list {
  display: flex;
  flex-wrap: wrap;
  .video_item {
    position: relative;
    .id {
      position: absolute;
      right: 10px;
      top: 10px;
      font-size: 12px;
      color: #fff;
      background: #000;
    }
  }
}
.box_1 {
  width: 100%;
}
.box_2 {
  width: 50%;
}
.box_3 {
  width: 33.3%;
}
.box_4 {
  width: 25%;
}

video {
  display: block;
  width: 100%;
}
</style>