var width = 800, height = 700;
var svg = d3.select("#my_svg").attr("width", width).attr("height", height);
var geocoder;
AMap.service('AMap.Geocoder', function () {
  geocoder = new AMap.Geocoder({
    city: '海南省'
  })
})
function getPositionName(lng, lat) {
  geocoder.getAddress([lng, lat], function (status, result) {
    if (status === 'complete' && result.info === 'OK') {
      // result为对应的地理位置详细信息
      return (result)
    }
  })
}
function interpolateData(nations, year, month, day) {
  // filter data in that year
  return nations.filter(function (a) {
    return a.year == year && deleteFront0(a.month) == month && deleteFront0(a.day) == day;
  })
}
function deleteFront0(a) {
  return a.replace(/\b(0+)/gi, "")
}

var projection = d3.geoMercator()
  .center([110, 20])
  .scale(50000)
  .translate([0, height / 4])

var path = d3.geoPath()
  .projection(projection);

d3.json("./data/haikou-map.json").then(function (res) {

  console.log(res)

  svg.selectAll("path")
    .attr("class", "states")
    .data(res.features)
    .enter().append("path")
    .attr('fill', 'lightgray')
    .attr("stroke", "#aaa")   //svg边线属性定义，这里是颜色
    .attr("d", path)
    .append('title')
    .text(function (d) {
      return d.properties.name
    })
    .on("click", function (d) {
      console.log(d)
      console.log(d.properties.adcode)
    })
    .on("mouseover", function (d) {
      console.log(d)
      d3.select(this)
        .attr('fill', 'yellow')
    })

  // svg.append("path")
  //   .attr("class", "state-borders")
  //   .attr("d", path(topojson.mesh(us, us, function (a, b) { return a !== b; })));

  // a = { "value": [{ "BusStopCode": "01012", "RoadName": "Victoria St", "Description": "Hotel Grand Pacific", "Latitude": 29.160752671000068, "Longitude": 113.56942793100006 }] }
  // svg.selectAll("circle")
  //   .data(a.value).enter().append("circle")
  //   .attr('stroke', 'red')
  //   .attr('fill', 'green')
  //   .attr("d", path)
  //   .attr("r", 2)
  //   .attr("transform", function (d) {
  //     return "translate(" + projection([
  //       d.Longitude,
  //       d.Latitude
  //     ]) + ")";
  //   })
  //   .append('title')
  //   .text(function (d) {
  //     a = d
  //     return d.BusStopCode
  //   });
});
//秀英区 460105 龙华区460106 琼山区460107 美兰区 460108
d3.csv('./data/dwv_order_make_haikou_1_min.csv', function (csvdata) {
  return csvdata;
}).then(function (data) {
  console.log(data)
  var location = svg.selectAll("location")
    .data(interpolateData(data, 2017, 5, 17))
    .enter()
    .append("g")
    //.attr("class","location")
    .attr("transform", function (d) {
      return "translate(" + projection([
        d.dest_lng,
        d.dest_lat
      ]) + ")";
    }).append("circle")
    .attr("r", 5) //半径
    .style("fill", function (d, i) {
      if (d.name == "福州总部")
        return "red";

      return "yellow";

    })
})

getPositionName(110.3487, 20.0159)