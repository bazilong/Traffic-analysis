var width = 800, height = 700;
var svg = d3.select("#my_svg").attr("width", width).attr("height", height);
let data;
function getPositionName(lng, lat) {
  AMap.service('AMap.Geocoder', function () {
    let geocoder = new AMap.Geocoder({
      city: '海南省'
    })
    geocoder.getAddress([lng, lat], function (status, result) {
      console.log(1)
      console.log(result)
      console.log(result.regeocode.addressComponent.street)
      let street = result.regeocode.addressComponent.street
      let township = result.regeocode.addressComponent.township
      let address = result.regeocode.formattedAddress
      console.log(address.match(/街道/g))
      if (status === 'complete' && result.info === 'OK') {
        // result为对应的地理位置详细信息
        return (result)
      }
    })
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
function interpolateStrat(nations, lng, lat) {
  // filter data in that year
  return nations.filter(function (a) {
    return a.starting_lat == lat && a.starting_lng == lng;
  })
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
});
//秀英区 460105 龙华区460106 琼山区460107 美兰区 460108
d3.csv('./data/dwv_order_make_haikou_1_min.csv', function (csvdata) {
  return csvdata;
}).then(function (res) {
  data = res
  console.log(data)
  svg.selectAll("location")
    .data(interpolateData(data, 2017, 5, 17))
    .enter()
    .append("g")
    //.attr("class","location")
    .attr("transform", function (d) {
      return "translate(" + projection([
        d.starting_lng,
        d.starting_lat
      ]) + ")";
    })
    .append("circle")
    .attr("r", 5) //半径
    .style("fill", function (d, i) {
      if (d.name == "福州总部")
        return "red";
      return "yellow";
    })
    .on("click", function (d) {
      getDest(d.starting_lng, d.starting_lat)
      console.log(getPositionName(d.starting_lng, d.starting_lat))
    })
})


let lineGenerator = d3.line()
  .x(function (d) {
    return d[0]
  })
  .y(function (d) {
    return d[1];
  });

function getDest(lng, lat) {
  let paths = interpolateStrat(interpolateData(data, 2017, 5, 17), lng, lat)
  for (let i = 0; i < paths.length; i++) {
    console.log(paths[i])
    svg.selectAll("path")
      .enter()
      .append('path')
      .attr('stroke', '#ccc')
      .attr('stroke-width', '2')
      .attr('fill', 'none')
      .attr('d', lineGenerator([projection(paths[i].starting_lng, paths[i].starting_lat), projection(paths[i].dest_lng, paths[i].dest_lat)]));
  }
  // svg.selectAll("location")
  //   .data(interpolateStrat(interpolateData(data, 2017, 5, 17), lng, lat))
  //   .enter()
  //   .append('path')
  //       .attr('stroke', '#ccc')
  //       .attr('stroke-width', '2')
  //       .attr('fill', 'none')
  //       .attr('d', lineGenerator(data));

  //   .attr("transform", function (d) {
  //     return "translate(" + projection([
  //       d.dest_lng,
  //       d.dest_lat
  //     ]) + ")";
  //   })
  //   .append("circle")
  //   .attr("r", 5) //半径
  //   .style("fill", "red");
}