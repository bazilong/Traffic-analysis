<template>
  <div class="main">
    <img src="static/haikou.png" class="bg" />
    <div class="control">
      <div class="box">
        <div class="title">日期：</div>
        <el-date-picker
          v-model="value"
          type="date"
          class="margin"
          @change="updateByDate"
          value-format="yyyy-MM-dd"
          placeholder="选择日期"
        />
        <div style="font-size: 10px; display: flex; justify-content: center">
          至
        </div>
        <el-date-picker
          v-model="value2"
          type="date"
          class="margin"
          @change="updateByDateRange"
          value-format="yyyy-MM-dd"
          placeholder="选择日期"
        />
      </div>
      <div class="box">
        <div class="title">控制：</div>
        <el-button class="button" @click="play">播放</el-button>
        <el-button class="button" @click="stop">暂停</el-button>
        <el-button class="button" @click="reStart">重新开始</el-button>
      </div>
      <div class="box">
        <div class="title">切换：</div>
        <el-radio-group v-model="radio" class="margin" @change="changeRadio">
          <el-radio-button label="starting">出发地</el-radio-button>
          <el-radio-button label="dest">目的地</el-radio-button>
        </el-radio-group>
      </div>
      <div class="box">
        <div class="title">搜索范围：</div>
        <el-radio-group v-model="searchR" class="margin">
          <el-radio :label="0.001" class="radioLine">100m</el-radio>
          <el-radio :label="0.004" class="radioLine">400m</el-radio>
          <el-radio :label="0.01" class="radioLine">1000m</el-radio>
        </el-radio-group>
      </div>
    </div>
    <svg id="my_svg" style="z-index: 666"></svg>
    <div class="detail-box">
      <div class="box">
        <div class="title">排序方式：</div>
        <el-radio-group
          v-model="sortType"
          class="margin"
          @change="changeSortType"
        >
          <el-radio label="distance">距离</el-radio>
          <el-radio label="time">时间</el-radio>
          <!-- <el-radio label="min">时长</el-radio> -->
        </el-radio-group>
      </div>
      <el-collapse class="scroll_box" accordion>
        <el-collapse-item
          v-for="(detail, i) in searchData"
          :key="detail.order_id"
          @click.native="confirmDetail(detail)"
        >
          <template slot="title">
            订单{{ i + 1 }}
            <span v-if="sortType === 'distance'" class="tip">{{ 
              detail.start_dest_distance 
            }} m</span>
            <span v-if="sortType === 'time'" class="tip">{{
              detail.departure_time
            }}</span>
            <!-- <span v-if="sortType === 'min'" class="tip">{{
              detail.normal_time
            }} min</span> -->
          </template>
          <div>出发地：{{ detail.starting_name }}</div>
          <div>目的地：{{ detail.dest_name }}</div>
          <div>距离：{{ detail.start_dest_distance }} m</div>
          <div>时长：{{ detail.normal_time }} min</div>
          <div>出发时间：{{ detail.departure_time }}</div>
        </el-collapse-item>
      </el-collapse>
      <svg
        id="rect_svg"
        width="300"
        height="240"
        style="margin-top: 20px"
      ></svg>
    </div>
  </div>
</template>

<script>
const d3 = require("d3");
const width = 700,
  height = 750;
let timeOut = null;
let projection = d3
  .geoMercator()
  .center([110, 20])
  .scale(70000)
  .translate([-width * 0.22, height * 0.225]);

export default {
  data() {
    return {
      svg: "",
      durationtime: 500,
      searchR: 0.001,
      value: "2017-05-01",
      allData: [],
      data: [],
      searchData: [],
      firstData: [],
      radio: "starting",
      sortType: "",
      weather: "",
      startingValue: {},
      destValue: {},
      value2: "2017-05-01",
      allWeather: [],
      type: [],
    };
  },
  mounted() {
    this.svg = d3.select("#my_svg").attr("width", width).attr("height", height);
    this.getMap();
    this.getData();
  },
  methods: {
    updateByDateRange() {
      if (new Date(this.value2) < new Date(this.value)) {
        this.value2 = this.value;
      }
      this.updateByDate();
    },
    changeSortType() {
      if (this.sortType === "distance") {
        this.sortByDistance();
      } else if (this.sortType === "time") {
        this.sortByTime();
      }
      // } else {
      //   this.sortByMin();
      // }
    },
    changeRadio() {
      d3.selectAll(".search694d9f").remove();
      if (this.radio === "starting") {
        d3.selectAll(".searchdest").remove();
        d3.selectAll(".detailDest").remove();
        this.searchData = this.firstData;
        this.updateData();
      } else {
        this.updateData();
      }
    },
    sortByDistance() {
      this.searchData.sort(function (a, b) {
        return (
          parseInt(a.start_dest_distance) - parseInt(b.start_dest_distance)
        );
      });
    },
    sortByTime() {
      this.searchData.sort(function (a, b) {
        return new Date(a.departure_time) - new Date(b.departure_time);
      });
    },
    // sortByMin() {
    //   console.log(this.searchData)
    //   this.searchData.sort(function (a, b) {
    //     let s = a.normal_time == "NULL" ? "999" : a.normal_time
    //     return parseInt(s) - parseInt(b.normal_time);
    //   });
    // },
    confirmDetail(e) {
      console.log(e);
      d3.selectAll(".detailDest").remove();
      d3.selectAll(".search694d9f").remove();
      this.svg
        .append("g")
        .data([e])
        .attr("transform", function (d) {
          return "translate(" + projection([d.dest_lng, d.dest_lat]) + ")";
        })
        .attr("class", "search detailDest")
        .append("circle")
        .attr("r", 5) //半径
        .style("fill", "#694d9f")
        .style("fill-opacity", "0.5")
        .style("pointer-events", "none");
      this.renderLine(
        projection([e.starting_lng, e.starting_lat]),
        projection([e.dest_lng, e.dest_lat]),
        "#694d9f"
      );
    },
    //播放，注册定时器每隔n秒更新一次日期并更新数据
    play() {
      let date = this.value.split("-");
      let _this = this;
      timeOut = setInterval(function () {
        date[2] = +date[2] + 1 + "";
        if (
          ((date[1] === "05" || date[1] === "07" || date[1] === "08") &&
            date[2] === "32") ||
          ((date[1] === "06" || date[1] === "09") && date[2] === "31")
        ) {
          date[2] = "01";
          date[1] = +date[1] + 1 + "";
        }
        _this.value = date.join("-");
        _this.value2 = _this.value;
        _this.updateByDate();
        if (date[1] === "10" && date[1] === "31") {
          clearTimeout(timeOut);
        }
      }, 500);
    },
    //暂停，注销定时器
    stop() {
      clearTimeout(timeOut);
    },
    //重启，置为最初状态
    reStart() {
      clearTimeout(timeOut);
      this.value = "2017-05-01";
      this.value2 = "2017-05-01";
      this.updateByDate();
    },
    //日期过滤器
    interpolateData(nations, min, max) {
      return nations.filter(function (a) {
        let time = new Date(a.year + "-" + a.month + "-" + a.day);
        return time >= new Date(min) && time <= new Date(max);
      });
    },
    //天气过滤器
    interpolateWeather(nations, weather) {
      let _this = this
      return nations.filter(function (a) {
        return _this.allWeather[a.year + "-" + a.month + "-" + a.day] == weather && a.normal_time != "NULL";
      });
    },
    //出发地经纬度模糊过滤器
    interpolateAround(nations, lng, lat) {
      let _this = this;
      return nations.filter(function (a) {
        return (
          Math.abs(a.starting_lat - lat) <= _this.searchR &&
          Math.abs(a.starting_lng - lng) <= _this.searchR
        );
      });
    },
    //出发地目的地经纬度模糊过滤器
    interpolateDoubleAround(nations, lng, lat, d_lng, d_lat) {
      let _this = this;
      return nations.filter(function (a) {
        return (
          Math.abs(a.starting_lat - lat) <= _this.searchR &&
          Math.abs(a.starting_lng - lng) <= _this.searchR &&
          Math.abs(a.dest_lat - d_lat) <= _this.searchR &&
          Math.abs(a.dest_lng - d_lng) <= _this.searchR
        );
      });
    },
    //高德API由经纬度获取地名
    getPositionName(type, i, lng, lat) {
      let _this = this;
      AMap.service("AMap.Geocoder", function () {
        let geocoder = new AMap.Geocoder({
          city: "海南省",
        });
        geocoder.getAddress([lng, lat], function (status, result) {
          let address = result.regeocode.formattedAddress;
          address = address.split("海口市")[1].slice(3);
          address = address.split("街道")[1] || address;
          _this.$set(_this.searchData[i], type + "_name", address);
          _this.firstData = _this.searchData;
        });
      });
    },
    //获取地图json 渲染地图Path
    getMap() {
      let _this = this;
      let path = d3.geoPath().projection(projection);
      d3.json("static/haikou-map.json").then(function (res) {
        _this.svg
          .selectAll("path")
          .attr("class", "states")
          .data(res.features)
          .enter()
          .append("path")
          .attr("fill", "lightgray")
          .style("fill-opacity", "0.8")
          .attr("stroke", "#aaa") //svg边线属性定义，这里是颜色
          .attr("d", path)
          .append("title")
          .text(function (d) {
            return d.properties.name;
          });
      });
    },
    getWeather() {
      let _this = this;
      d3.json("static/wendu.json").then(function (res) {
        _this.allWeather = res.weather;
        console.log(res);
      });
    },
    //获取全部订单数据，并首次渲染位点
    getData() {
      let _this = this;
      d3.csv("static/fname_min.csv", function (csvdata) {
        return csvdata;
      }).then(function (res) {
        _this.allData = res;
        _this.data = _this.interpolateData(
          _this.allData,
          "2017-05-01",
          "2017-05-01"
        );
        _this.svg
          .selectAll("circle")
          .data(_this.data)
          .enter()
          .append("circle")
          .attr("class", "dataCircle")
          .attr("r", 5) //半径
          .style("fill", function (d) {
            return _this.radio === "starting" ? "red" : "green";
          })
          .style("fill-opacity", "0.1")
          .attr("transform", function (d) {
            return _this.radio === "starting"
              ? "translate(" +
                  projection([d.starting_lng, d.starting_lat]) +
                  ")"
              : "translate(" + projection([d.dest_lng, d.dest_lat]) + ")";
          })
          .on("click", function (d) {
            _this.sortType = "";
            if (_this.radio === "starting") {
              _this.firstAction(d);
            } else {
              _this.secondAction(d);
            }
          })
          .on("mouseover", function (d) {
            d3.select(this)
              .style("fill", "orange")
              .style("fill-opacity", "0.5");
          })
          .on("mouseout", function (d) {
            d3.select(this)
              .transition()
              .duration(250)
              .style("fill", function (d) {
                return _this.radio === "starting" ? "red" : "green";
              })
              .style("fill-opacity", "0.1");
          });
      });
      this.getWeather();
    },
    firstAction(d) {
      this.startingValue = d;
      this.destValue = {};
      d3.selectAll(".searchstarting").remove();
      let searchArea = this.svg
        .append("g")
        .attr("transform", function (a) {
          return (
            "translate(" + projection([d.starting_lng, d.starting_lat]) + ")"
          );
        })
        .attr("class", "search searchstarting");
      searchArea
        .append("circle")
        .style("fill", "none")
        .style("stroke", "#0000FF")
        .style("stroke-width", 1)
        .attr("r", projection([this.searchR, 0])[0] - projection([0, 0])[0]);
      this.searchData = this.interpolateAround(
        this.data,
        d.starting_lng,
        d.starting_lat
      );
      this.getDest(this.searchData);
    },
    secondAction(d) {
      this.destValue = d;
      d3.selectAll(".detailDest").remove();
      d3.selectAll(".searchdest").remove();
      let searchArea = this.svg
        .append("g")
        .attr("transform", function (a) {
          return "translate(" + projection([d.dest_lng, d.dest_lat]) + ")";
        })
        .attr("class", "search searchdest");
      searchArea
        .append("circle")
        .style("fill", "none")
        .style("stroke", "#0000FF")
        .style("stroke-width", 1)
        .attr("r", projection([this.searchR, 0])[0] - projection([0, 0])[0]);
      this.searchData = this.interpolateDoubleAround(
        this.data,
        this.startingValue.starting_lng,
        this.startingValue.starting_lat,
        d.dest_lng,
        d.dest_lat
      );
      this.setWeather();
    },
    updateByDate() {
      if (new Date(this.value2) < new Date(this.value)) {
        this.value2 = this.value;
      }
      this.data = this.interpolateData(this.allData, this.value, this.value2);
      console.log(this.data.length);
      //this.getWeather()
      this.updateData();
      if (JSON.stringify(this.startingValue) != "{}") {
        this.firstAction(this.startingValue);
        d3.selectAll(".detailDest").remove();
        d3.selectAll(".searchdest").remove();
      }
    },
    //根据日期更新数据
    updateData() {
      let _this = this;
      let updateCircle = this.svg.selectAll(".dataCircle").data(this.data);
      let enterCircle = updateCircle.enter();
      let exitCircle = updateCircle.exit();
      updateCircle
        .attr("r", 5) //半径
        .style("fill", function (d) {
          return _this.radio === "starting" ? "red" : "green";
        })
        .style("fill-opacity", "0.1")
        .attr("transform", function (d) {
          return _this.radio === "starting"
            ? "translate(" + projection([d.starting_lng, d.starting_lat]) + ")"
            : "translate(" + projection([d.dest_lng, d.dest_lat]) + ")";
        });

      enterCircle
        .append("circle")
        .attr("class", "dataCircle")
        .attr("r", 5) //半径
        .style("fill", function (d) {
          return _this.radio === "starting" ? "red" : "green";
        })
        .style("fill-opacity", "0.1")
        .attr("transform", function (d) {
          return _this.radio === "starting"
            ? "translate(" + projection([d.starting_lng, d.starting_lat]) + ")"
            : "translate(" + projection([d.dest_lng, d.dest_lat]) + ")";
        })
        .on("click", function (d) {
          _this.sortType = "";
          if (_this.radio === "starting") {
            _this.firstAction(d);
          } else {
            _this.secondAction(d);
          }
        })
        .on("mouseover", function (d) {
          d3.select(this).style("fill", "orange").style("fill-opacity", "0.5");
        })
        .on("mouseout", function (d) {
          d3.select(this)
            .transition()
            .duration(250)
            .style("fill", function (d) {
              return _this.radio === "starting" ? "red" : "green";
            })
            .style("fill-opacity", "0.1");
        });
      exitCircle.remove();
    },
    setWeather() {
      let type = [];
      let _this = this;
      for (let a of this.searchData) {
        let weather = _this.allWeather[a.year + "-" + a.month + "-" + a.day];
        if (type.indexOf(weather) < 0) {
          type.push(weather);
        }
      }
      console.log(type)
      let average = []
      for (let i in type){
        let args = _this.interpolateWeather(_this.searchData,type[i])
        average.push((args.reduce((a, b) => a + parseInt(b.normal_time),0) / args.length).toFixed(1))
      }
      console.log(average)
    },
    lineGenerator: d3
      .line()
      .x(function (d) {
        return d[0];
      })
      .y(function (d) {
        return d[1];
      }),
    getDest(paths) {
      for (let i = 0; i < paths.length; i++) {
        this.getPositionName(
          "starting",
          i,
          paths[i].starting_lng,
          paths[i].starting_lat
        );
        this.getPositionName("dest", i, paths[i].dest_lng, paths[i].dest_lat);
        this.renderLine(
          projection([paths[i].starting_lng, paths[i].starting_lat]),
          projection([paths[i].dest_lng, paths[i].dest_lat])
        );
      }
    },
    //绘制迁徙线
    renderLine(startA, endA, color = "#fff") {
      //获取贝塞尔曲线控制点
      let _this = this;
      function computeControlPoint(ps, pe, arc = 0.5) {
        const deltaX = pe[0] - ps[0];
        const deltaY = pe[1] - ps[1];
        const theta = Math.atan(deltaY / deltaX);
        const len = (Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 2) * arc;
        const newTheta = theta - Math.PI / 2;
        return [
          (ps[0] + pe[0]) / 2 + len * Math.cos(newTheta),
          (ps[1] + pe[1]) / 2 + len * Math.sin(newTheta),
        ];
      }
      let middleA = computeControlPoint(startA, endA);
      let lineWidth = 1;
      let path = d3.path();
      path.moveTo(startA[0], startA[1]);
      path.quadraticCurveTo(middleA[0], middleA[1], endA[0], endA[1]);
      let searchPath = this.svg.append("g").attr("class", function (d) {
        return (
          "search" +
          _this.radio +
          (color != "#fff" ? " search" + color.slice(1) : "")
        );
      });
      searchPath
        .append("path")
        .attr("d", path.toString())
        .attr("fill", color)
        .attr("fill-opacity", "0")
        .style("stroke", color)
        .style("stroke-width", lineWidth)
        .style("pointer-events", "none");

      //箭头
      searchPath
        .append("path")
        .attr("id", "arrow")
        .attr("fill", "yellow")
        .attr("d", "M2,0L-2,2L-2,-2Z")
        .append("animateMotion")
        .attr("path", path.toString())
        .attr("begin", "0ms")
        .attr("dur", this.durationtime + "ms")
        .attr("fill", "freeze")
        .attr("rotate", "auto")
        .style("pointer-events", "none");
    },
  },
};
</script>

<style scoped>
* {
  transition: all 0.5s;
}
.main {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
}
.bg {
  position: absolute;
  width: 2500px;
  left: -550px;
  top: -235px;
}
.control {
  z-index: 666;
  margin: 20px;
  padding: 20px;
  height: 650px;
  width: 300px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
  border: 1px solid #ebeef5;
  background-color: #fff;
  color: #303133;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
}
.detail-box {
  z-index: 666;
  margin: 20px;
  padding: 20px;
  height: 650px;
  width: 300px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
  border: 1px solid #ebeef5;
  background-color: #fff;
  color: #303133;
  border-radius: 4px;
}
.box {
  width: 250px;
}
.title {
  font-size: 14px;
  color: #303133;
  margin: 10px 0;
}
.button {
  margin: 10px;
  width: 100px;
}
.margin {
  margin: 10px;
}
.radioLine {
  display: block;
  margin: 10px 0;
}
.tip {
  font-size: 10px;
  color: gray;
  margin-left: 20px;
}
.scroll_box {
  height: 290px;
  overflow-y: scroll;
}
::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 4px; /*高宽分别对应横竖滚动条的尺寸*/
  height: 4px;
  scrollbar-arrow-color: red;
}
::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 5px;
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.1);
  scrollbar-arrow-color: red;
}
::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  -webkit-box-shadow: inset 0 0 5px transparent;
  border-radius: 0;
  background: transparent;
}
</style>
