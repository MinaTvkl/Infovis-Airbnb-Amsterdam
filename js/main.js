var districtNames = ["Amsterdam", "Centrum", "West", "Nieuw-West", "Zuid", "Oost", "Noord", "Zuidoost"];
var indicatorNames = ["Criminality", "Nuisance", "Persons_avoidance", "Persons_inconvenience", "Safety"];
var bData = {};
var lData = {};
var linechart_datasetValues = {};
var radarchart_datasetValues = {};
var map_datasetMap = {};
var map_datasetListings = {};

var curYear = 2019;
var curDistrict = "Amsterdam";

var idiomWidth = 500;
var idiomHeight = 300;
var transitionSpeed = 400;
var tooltip = d3.select("#tooltip");

Array.prototype.first = function () {
  return this[0];
}

Array.prototype.last = function () {
  return this[this.length - 1];
}

function translate(x, y) {
  return "translate(" + x + "," + y + ")";
}

var axesSpace = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 60
}

var radarSpace = {
  sides: 50,
  topBottom: 50
}

var chartWidth = idiomWidth - axesSpace.left - axesSpace.right;
var chartHeight = idiomHeight - axesSpace.top - axesSpace.bottom;

let graphWidth = idiomWidth - axesSpace.left - axesSpace.right;
let graphHeight = idiomHeight - axesSpace.top - axesSpace.bottom;

Promise.all([
  d3.json("/data/bar_chart/migration.json"),
  d3.json("/data/line_chart/prices.json"),
  d3.json("/data/radar_chart/indicators.json"),
  d3.json("/data/map/GEBIED_STADSDELEN.json"),
  d3.json("/data/map/test.json")
]).then(function (data) {
  //Reading in barchart data
  bData = data[0];

  lData = data[1];

  //Reading in the radarchart data
  radarchart_datasetValues = data[2];

  map_datasetMap = data[3];

  map_datasetListings = data[4];

  //Calling render function
  gen_vis();
});

function gen_vis() {

  // function processPosition(string, position) {
  //   return parseFloat(string.substring(0, position) + "." + string.substring(position));
  // }

  var projection = d3.geoMercator().translate([idiomWidth / 2, idiomHeight / 2]).scale(60000).center([4.9, 52.36]);
  var path = d3.geoPath().projection(projection);

  var map_max = 2000;
  var map_min = 0;

  var ramp = d3.scaleLinear().domain([map_min, map_max]).range([lowColor, highColor])

  let map_svg = d3.select("#map").append("svg")
    .attr("width", idiomWidth)
    .attr("height", idiomHeight);

  var map_sequentialScale = d3.scaleSequential()
    .domain([map_min, map_max])
    .interpolator(d3.interpolateGreens);

  map_svg.selectAll("path").data(map_datasetMap.features).enter().append("path")
    .classed("highlighted", d => curDistrict == "Amsterdam" || curDistrict == d.properties.Stadsdeel ? true : false)
    .classed("district", true)
    .attr("d", path)
    .on("mouseover", function (value, index) {
      tooltip.style("display", "block");
      tooltip.html(value.properties.Stadsdeel + ": " + map_datasetListings[curYear - 1][value.properties.Stadsdeel]).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 40) + "px");
    })
    .on("mousemove", () => tooltip.style("top", (event.pageY - 40) + "px").style("left", (event.pageX) + "px"))
    .on("mouseout", () => tooltip.style("display", "none"))
    .style("fill", d => map_sequentialScale(map_datasetListings[curYear - 1][d.properties.Stadsdeel]))
    .on("click", function (value) {
      d3.select("#selector").node().value = value.properties.Stadsdeel;
      d3.select("#selector").node().dispatchEvent(new Event('input'));
    })
    .classed("clickable", true);

  var legend_w = 70, legend_h = 200;
  var lowColor = map_sequentialScale(map_min)
  var highColor = map_sequentialScale(map_max)

  var key = d3.select("#map")
    .append("svg")
    .attr("width", legend_w)
    .attr("height", legend_h)
    .attr("class", "legend");

  var legend = key.append("defs")
    .append("svg:linearGradient")
    .attr("id", "gradient")
    .attr("x1", "100%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");

  legend.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", highColor)
    .attr("stop-opacity", 1);

  legend.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", lowColor)
    .attr("stop-opacity", 1);

  key.append("rect")
    .attr("width", legend_w - 50)
    .attr("height", legend_h)
    .style("fill", "url(#gradient)")
    .attr("transform", "translate(0,10)");

  var y = d3.scaleLinear()
    .range([legend_h, 0])
    .domain([map_min, map_max]);

  var yAxis = d3.axisRight(y);

  key.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(30,10)")
    .call(yAxis)

  function update_radarchart_dataset() {
    var radarchart_dataset = [];
    indicatorNames.forEach(t =>
      radarchart_dataset.push(radarchart_datasetValues[t][curDistrict][curYear - 1])
    );
    radarchart_dataset.push(radarchart_dataset[0]);
    return radarchart_dataset;
  }
  //Create radarchart data array
  var radarchart_dataset = update_radarchart_dataset();

  //Set max and min values
  var radarchart_max = 300;
  var radarchart_min = 0;

  //Create dimensions of chart
  let radarchart_diameter = Math.min(idiomWidth - 2 * radarSpace.sides, idiomHeight - 2 * radarSpace.topBottom);
  let radarchart_radius = radarchart_diameter / 2;

  //Creating the idiom
  let radarchart_svg = d3.select("#radar-chart").append("svg")
    .attr("height", idiomHeight)
    .attr("width", idiomWidth);

  //Setting amount of circles and amount of ticks on axis
  var radarchart_ticksAmount = 6;
  var radarchart_circleAmount = 6;

  let radarchart_rScale = d3.scaleLinear().domain([radarchart_min, radarchart_max]).range([0, radarchart_radius]);
  var radarchart_yScale = d3.scaleLinear().domain([radarchart_min, radarchart_max]).range([radarchart_radius, 0]);

  //Function to transform
  function indexToCoordinate(index, value) {
    var angle;
    if (index == 0) {
      angle = 0;
    } else angle = (Math.PI / indicatorNames.length * index * 2);

    let x = Math.sin(angle) * radarchart_rScale(value);
    let y = Math.cos(angle) * radarchart_rScale(value);

    return {
      "x": x,
      "y": -y
    };
  }

  //Calculates x and y coordinate based on value and index
  let radarchart_line = d3.line()
    .x(function (value, index) {
      return indexToCoordinate(index, value).x;
    })
    .y(function (value, index) {
      return indexToCoordinate(index, value).y;
    });

  //Function that fills arrat with a value
  function fillArray(value, len) {
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(value);
    }
    return arr;
  }

  //Create axis rings
  for (var i = 1; i <= radarchart_circleAmount; i++) {
    radarchart_svg.append("path").datum(fillArray(radarchart_max / radarchart_circleAmount * i, indicatorNames.length + 1))
      .attr("d", radarchart_line)
      .attr("class", "helpaxis")
      .attr("transform", "translate(" + idiomWidth / 2 + "," + idiomHeight / 2 + ")");
  }

  //Create initial axis with numbers
  radarchart_svg.append("g").call(d3.axisLeft(radarchart_yScale).ticks(radarchart_ticksAmount))
    .attr("transform", "translate(" + idiomWidth / 2 + "," + radarSpace.topBottom + ")")
    .selectAll("text").attr("transform", "translate(" + 0 + ", " + (-5) + ")");

  //Draw labels and additional axis
  for (var i = 0; i < indicatorNames.length; i++) {
    let cur = indicatorNames[i].replace("_", " ");

    let line_coordinate = indexToCoordinate(i, radarchart_max);
    let label_coordinate = indexToCoordinate(i, radarchart_max + radarchart_max / 3.5);

    //Draw axis line
    if (i != 0) {
      radarchart_svg.append("line").attr("class", "axis ticks")
        .attr("x1", idiomWidth / 2).attr("y1", idiomHeight / 2)
        .attr("x2", idiomWidth / 2 + line_coordinate.x).attr("y2", idiomHeight / 2 + line_coordinate.y);
    }

    //Draw axis label
    radarchart_svg.append("text").attr("class", "label")
      .attr("x", idiomWidth / 2 + label_coordinate.x).attr("y", idiomHeight / 2 + label_coordinate.y)
      .attr("dy", "0.5em").text(cur);
  }

  radarchart_svg.append("path").attr("class", "line")
    .datum(radarchart_dataset).attr("d", radarchart_line)
    .attr("transform", "translate(" + idiomWidth / 2 + "," + idiomHeight / 2 + ")")
    //added exact values on hover but has to update on district/year change
    .on("mouseover", function (value) {
      tooltip.style("display", "block");
      tooltip.html("Criminality: " + radarchart_dataset[0] +
        "<br/>Nuisance: " + radarchart_dataset[1] +
        "<br/>Persons avoidance: " + radarchart_dataset[2] +
        "<br/>Persons inconvenience: " + radarchart_dataset[3] +
        "<br/>Safety: " + radarchart_dataset[4]).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 124) + "px");
    })
    .on("mousemove", function () {
      tooltip.style("top", (event.pageY - 124) + "px").style("left", (event.pageX) + "px");
    })
    .on("mouseout", function () {
      tooltip.style("display", "none");
    });


  let bSvg = d3.select("#bar-chart")
    .append("svg")
    .attr("height", idiomHeight)
    .attr("width", idiomWidth);

  let bXDomain = [...new Set(bData.map(t => t.migration).map(t => t.map(u => u.district)).flat())];
  let bYDomain = [...new Set(bData.map(t => t.migration).map(t => t.map(u => u.value)).flat().sort((a, b) => a - b))];

  let bYMax = bYDomain.last();
  let bYMin = bYDomain.first();

  let bX = d3.scaleBand().domain(bXDomain).range([0, graphWidth]);
  let bYPositive = d3.scaleLinear().domain([0, bYMax]).range([0, graphHeight * (bYMax / (Math.abs(bYMin) + bYMax))]);
  let bY = d3.scaleLinear().domain([bYMax, bYMin]).range([0, graphHeight]);

  let bXAxisPosition = bY(0);
  let bBarWidth = graphWidth / bXDomain.length;

  bSvg.selectAll("rect")
    .append("g")
    .data(bData.filter(t => curYear - 1 == t.year).first().migration)
    .enter()
    .append("rect")
    .classed("bar", true)
    .attr("x", d => bX(d.district))
    .attr("y", d => Math.min(bY(0), bY(d.value)))
    .attr("height", d => d.value < 0 ? bY(d.value) - bXAxisPosition : bYPositive(d.value))
    .attr("width", bBarWidth)
    .attr("transform", translate(axesSpace.left, axesSpace.top))
    .classed("highlighted", d => d.district == curDistrict)
    .on("mouseover", function (d) {
      tooltip.style("display", "block");
      tooltip.html(d.district + " people/year: " + d.value).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 40) + "px");
    })
    .on("mousemove", () => tooltip.style("top", (event.pageY - 40) + "px").style("left", (event.pageX) + "px"))
    .on("mouseout", () => tooltip.style("display", "none"))
    .on("click", function (d) {
      d3.select("#selector").node().value = d.district;
      d3.select("#selector").node().dispatchEvent(new Event('input'));
    })
    .classed("clickable", true);

  bSvg.append("g")
    .call(d3.axisLeft(bY))
    .classed("axis", true)
    .attr("transform", translate(axesSpace.left, axesSpace.top));

  bSvg.append("g")
    .call(d3.axisBottom(bX).tickSize(0))
    .attr("transform", translate(axesSpace.left, axesSpace.top + bXAxisPosition))
    .classed("axis values clickable", true)
    .selectAll("text")
    .attr("transform", translate(-10, bY(bYMin) - bXAxisPosition + 20) + "rotate(-45)")
    .on("click", function (d) {
      d3.select("#selector").node().value = d;
      d3.select("#selector").node().dispatchEvent(new Event('input'));
    });


  let lSvg = d3.select("#line-chart").append("svg")
    .attr("height", idiomHeight)
    .attr("width", idiomWidth);

  let lXDomain = [...new Set(lData.map(t => t.prices).map(t => t.map(u => u.year)).flat().sort((a, b) => a - b))];
  let lYDomain = [...new Set(lData.map(t => t.prices).map(t => t.map(u => u.value)).flat().sort((a, b) => a - b))];

  let lYMax = lYDomain.last();
  let lYMin = lYDomain.first();

  let lXMax = lXDomain.first();
  let lXMin = lXDomain.last();

  let lX = d3.scaleLinear().domain([lXMin, lXMax]).range([graphWidth, 0]);
  let lY = d3.scaleLinear().domain([lYMin, lYMax]).range([graphHeight, 0]);

  let lLine = d3.line()
    .x(d => lX(d.year))
    .y(d => lY(d.value));

  lSvg.append("path").datum(lData.filter(t => t.district == curDistrict).first().prices)
    .attr("class", "line")
    .attr("d", lLine)
    .attr("transform", translate(axesSpace.left, axesSpace.top));

  lSvg.append("g").call(d3.axisBottom(lX)
    .ticks(lXDomain.length)
    .tickFormat(d3.format("d")))
    .attr("transform", translate(axesSpace.left, axesSpace.top + graphHeight))
    .selectAll("text")
    .classed("clickable", true)
    .on("click", function (d) {
      d3.select("#year-slider").node().value = d;
      d3.select("#year-slider").node().dispatchEvent(new Event('input'));
    });

  lSvg.append("g").call(d3.axisLeft(lY))
    .attr("transform", translate(axesSpace.left, axesSpace.top));

  lSvg.selectAll(".dot").data(lData.filter(t => t.district == curDistrict).first().prices.filter(t => t.year == curYear))
    .enter().append("circle").attr("class", "dot")
    .attr("cx", d => lX(d.year))
    .attr("cy", d => lY(d.value))
    .attr("r", 7)
    .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")")
    .on("mouseover", d => {
      tooltip.style("display", "block");
      tooltip.html("€/night: " + d.value).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 40) + "px");
    })
    .on("mousemove", () => tooltip.style("top", (event.pageY - 40) + "px").style("left", (event.pageX) + "px"))
    .on("mouseout", () => tooltip.style("display", "none"));


  //Interactivity
  d3.select("#year-slider").on("input", function () {
    curYear = document.getElementById("year-slider").value;

    map_svg.selectAll("path").style("fill", function (value) {
      return map_sequentialScale(map_datasetListings[curYear - 1][value.properties.Stadsdeel]);
    });

    bSvg.selectAll("rect")
      .data(bData.filter(t => curYear - 1 == t.year).first().migration)
      .transition().duration(transitionSpeed)
      .attr("x", d => bX(d.district))
      .attr("y", d => Math.min(bY(0), bY(d.value)))
      .attr("height", d => d.value < 0 ? bY(d.value) - bXAxisPosition : bYPositive(d.value))
      .attr("width", bBarWidth);

    lSvg.selectAll(".dot")
      .data(lData.filter(t => t.district == curDistrict).first().prices.filter(t => t.year == curYear))
      .transition().duration(transitionSpeed)
      .attr("cx", d => lX(d.year))
      .attr("cy", d => lY(d.value));


    //Update lines
    radarchart_dataset = [];
    indicatorNames.forEach(t =>
      radarchart_dataset.push(radarchart_datasetValues[t][curDistrict][curYear - 1])
    );
    radarchart_dataset.push(radarchart_dataset[0]);
    console.log(radarchart_dataset);
    const radarchart_lines = radarchart_svg.selectAll(".line").datum(radarchart_dataset);
    radarchart_lines.exit().remove();
    radarchart_lines.enter().append("path").attr("class", "line").attr("d", radarchart_line);
    radarchart_lines.transition().duration(transitionSpeed).attr("d", radarchart_line);
  });

  d3.select("#selector").on("input", function () {
    curDistrict = d3.select("#selector").node().value;

    bSvg.selectAll(".bar")
      .classed("highlighted", d => d.district == curDistrict);

    map_svg.selectAll("path")
      .classed("highlighted", d => curDistrict == "Amsterdam" || curDistrict == d.properties.Stadsdeel ? true : false)
      .attr("d", path);

    lSvg.selectAll(".line")
      .datum(lData.filter(t => t.district == curDistrict).first().prices)
      .transition().duration(transitionSpeed).attr("d", lLine);

    lSvg.selectAll(".dot")
      .data(lData.filter(t => t.district == curDistrict).first().prices.filter(t => t.year == curYear))
      .transition().duration(transitionSpeed)
      .attr("cx", d => lX(d.year))
      .attr("cy", d => lY(d.value));

    //Update lines
    radarchart_dataset = [];
    indicatorNames.forEach(t =>
      radarchart_dataset.push(radarchart_datasetValues[t][curDistrict][curYear - 1])
    );
    radarchart_dataset.push(radarchart_dataset[0]);
    const radarchart_lines = radarchart_svg.selectAll(".line").datum(radarchart_dataset);
    radarchart_lines.exit().remove();
    radarchart_lines.enter().append("path").attr("class", "line").attr("d", radarchart_line);
    radarchart_lines.transition().duration(transitionSpeed).attr("d", radarchart_line);
  });
}

function getMax(datasetValues) {
  return Math.max.apply(Math, Object.values(datasetValues).map(function (row) {
    return Math.max.apply(Math, row);
  }));
}

function getMin(datasetValues) {
  return Math.min.apply(Math, Object.values(datasetValues).map(function (row) {
    return Math.min.apply(Math, row);
  }));
}
