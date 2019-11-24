var districtNames = ["Amsterdam", "Centrum", "West", "Nieuw-West", "Zuid", "Oost", "Noord", "Zuidoost"];
var indicatorNames = ["Criminality", "Nuisance", "Persons_avoidance", "Persons_inconvenience", "Safety"];
var barchart_datasetValues = {};
var linechart_datasetValues = {};
var radarchart_datasetValues = {};

var curYear = 2019;
var curDistrict = "Amsterdam";

var idiomWidth = 500;
var idiomHeight = 300;
var transitionSpeed = 400;

var axesSpace = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 40
}

var radarSpace = {
  sides: 50,
  topBottom: 50
}

var chartWidth = idiomWidth - axesSpace.left - axesSpace.right;
var chartHeight = idiomHeight - axesSpace.top - axesSpace.bottom;

Promise.all([
  d3.json("/data/bar_chart/migration.json"),
  d3.json("/data/line_chart/avg_prices_district.json"),
  d3.json("/data/radar_chart/indicators.json"),
]).then(function(data) {
  //Reading in barchart data
  barchart_datasetValues = {
    2014: Object.values(data[0].year2014),
    2015: Object.values(data[0].year2015),
    2016: Object.values(data[0].year2016),
    2017: Object.values(data[0].year2017),
    2018: Object.values(data[0].year2018)
  };

  //Reading in linechart data
  for (var i = 0; i < Object.keys(data[1]).length; i++) {
    linechart_datasetValues[Object.keys(data[1])[i]] = Object.values(data[1][Object.keys(data[1])[i]]);
  }

  //Reading in the radarchart data
  radarchart_datasetValues = data[2];


  //Calling render function
  gen_vis();
});

function gen_vis() {
  //https://yangdanny97.github.io/blog/2019/03/01/D3-Spider-Chart
  //Radar
  var radarchart_dataset = []
  indicatorNames.forEach(t =>
    radarchart_dataset.push(radarchart_datasetValues[t][curDistrict][curYear - 1])
  );
  radarchart_dataset.push(radarchart_dataset[0]);

  var radarchart_max = 300;
  var radarchart_min = 0;

  let radarchart_diameter = Math.min(idiomWidth - 2 * radarSpace.sides, idiomHeight - 2 * radarSpace.topBottom);
  let radarchart_radius = radarchart_diameter / 2;

  var radarchart_axis = radarchart_datasetValues[1];

  let radarchart_svg = d3.select("#radar-chart").append("svg")
    .attr("height", idiomHeight)
    .attr("width", idiomWidth)
    .style("border", "1px solid");

  var radarchart_ticksAmount = 6;
  var radarchart_circleAmount = 6;

  let radarchart_rScale = d3.scaleLinear().domain([radarchart_min, radarchart_max]).range([0, radarchart_radius]);
  var radarchart_ticks = [];
  for (var i = 0; i <= radarchart_circleAmount; i++) {
    radarchart_ticks.push(i * (radarchart_max - radarchart_min) / radarchart_circleAmount);
  }

  function angleToCoordinate(angle, value) {
    let x = Math.sin(angle) * radarchart_rScale(value);
    let y = Math.cos(angle) * radarchart_rScale(value);

    return {
      "x": x,
      "y": -y
    };
  }

  radarchart_ticks.forEach(t =>
    radarchart_svg.append("circle")
    .attr("cx", idiomWidth / 2)
    .attr("cy", idiomHeight / 2)
    .attr("fill", "none")
    .attr("stroke", "gray")
    .attr("r", radarchart_rScale(t))
  );

  var radarchart_yScale = d3.scaleLinear().domain([radarchart_min, radarchart_max]).range([radarchart_radius, 0]);

  radarchart_svg.append("g").call(d3.axisLeft(radarchart_yScale).ticks(radarchart_ticksAmount))
    .attr("transform", "translate(" + idiomWidth / 2 + "," + radarSpace.topBottom + ")")
    .selectAll("text").attr("transform", "translate(" + 0 + ", " + (-5) + ")");

  for (var i = 0; i < indicatorNames.length; i++) {
    let cur = indicatorNames[i].replace("_", " ");
    var angle;
    if (i == 0) {
      angle = 0;
    } else angle = (Math.PI / indicatorNames.length * i * 2);
    let line_coordinate = angleToCoordinate(angle, radarchart_max);
    let label_coordinate = angleToCoordinate(angle, radarchart_max + 90);

    //draw axis line
    if (i != 0) {
      radarchart_svg.append("line")
        .attr("x1", idiomWidth / 2)
        .attr("y1", idiomHeight / 2)
        .attr("x2", idiomWidth / 2 + line_coordinate.x)
        .attr("y2", idiomHeight / 2 + line_coordinate.y)
        .attr("stroke", "black");
    }

    //draw axis label
    radarchart_svg.append("g").attr("class", "tick").append("text").style("text-anchor", "middle").style("font-size", "12px").style("color", "#898989")
      .attr("dy", "0.3em").attr("x", idiomWidth / 2 + label_coordinate.x).attr("y", idiomHeight / 2 + label_coordinate.y)
      .text(cur);
  }

  let radarchart_line = d3.line()
    .x(function(value, index) {
      var angle;
      if (index == 0) {
        angle = 0;
      } else angle = (Math.PI / indicatorNames.length * index * 2);
      return angleToCoordinate(angle, value).x;
    })
    .y(function(value, index) {
      var angle;
      if (index == 0) {
        angle = 0;
      } else angle = (Math.PI / indicatorNames.length * index * 2);
      return angleToCoordinate(angle, value).y;
    });

  radarchart_svg.append("path")
    .datum(radarchart_dataset)
    .attr("d", radarchart_line)
    .attr("class", "line")
    .attr("transform", "translate(" + idiomWidth / 2 + "," + idiomHeight / 2 + ")")
    .attr("stroke-width", 3)
    .attr("stroke", "#ffab00")
    .attr("stroke-opacity", 1)
    .attr("fill", "none")
    .attr("opacity", 0.7);




  //Barchart
  var barchart_datasetYears = [2014, 2015, 2016, 2017, 2018];
  var barchart_dataset = barchart_datasetValues[curYear - 1];

  var barchart_min = getMin(barchart_datasetValues);
  var barchart_max = getMax(barchart_datasetValues);

  var barchart_barWidth = Math.abs(chartWidth / barchart_datasetValues[2014].length);
  var barchart_posPercentage = barchart_max / (barchart_max + Math.abs(barchart_min));

  var barchart_posHeight = barchart_posPercentage * chartHeight;
  var barchart_negHeight = chartHeight - barchart_posHeight;

  var barchart_posYScale = d3.scaleLinear().domain([0, barchart_max]).range([0, barchart_posHeight]);
  var barchart_yScale = d3.scaleLinear().domain([barchart_min, barchart_max]).range([chartHeight, 0]);
  var barchart_xScale = d3.scaleBand().domain(districtNames).range([0, chartWidth]);

  var barchart_svg = d3.select("#bar-chart")
    .append("svg")
    .attr("height", idiomHeight)
    .attr("width", idiomWidth)
    .style("border", "1px solid");

  //Add data
  barchart_svg.selectAll("rect").data(barchart_dataset).enter().append("rect")
    .attr("x", function(value, index) {
      return axesSpace.left + index * barchart_barWidth;
    }).attr("y", function(value) {
      return axesSpace.top + barchart_posHeight - Math.max(0, barchart_posYScale(value));
    }).attr("height", function(value) {
      return Math.abs(barchart_posYScale(value));
    }).attr("width", barchart_barWidth).style("fill", "green");

  //Add y axis
  barchart_svg.append("g").attr("transform", function(d) {
    return "translate(" + (axesSpace.left) + ", " + (axesSpace.top) + ")";
  }).call(d3.axisLeft(barchart_yScale));

  //Add x axis
  barchart_svg.append("g").call(d3.axisBottom(barchart_xScale).tickSize(0))
    .attr("transform", "translate(" + axesSpace.left + "," + (barchart_posHeight + axesSpace.top) + ")")
    .selectAll("text").attr("transform", "translate(" + -1 * (barchart_barWidth / 4) + ", " + (barchart_negHeight + 20) + ") rotate(-45)");


  //Linechart
  var linechart_datasetYears = [2015, 2016, 2017, 2018, 2019];
  var linechart_dataset = linechart_datasetValues[curDistrict];

  var linechart_min = getMin(linechart_datasetValues);
  var linechart_max = getMax(linechart_datasetValues);

  var linechart_xScale = d3.scaleLinear().domain([linechart_datasetYears[0], linechart_datasetYears[linechart_datasetYears.length - 1]]).range([0, chartWidth]);
  var linechart_yScale = d3.scaleLinear().domain([linechart_min, linechart_max]).range([chartHeight, 0]);

  var linechart_line = d3.line().x(function(value, index) {
    return linechart_xScale(index + linechart_datasetYears[0]);
  }).y(function(value) {
    return linechart_yScale(value);
  });

  var linechart_svg = d3.select("#line-chart").append("svg")
    .attr("height", idiomHeight).attr("width", idiomWidth)
    .style("border", "1px solid");

  linechart_svg.append("g").call(d3.axisBottom(linechart_xScale).ticks(linechart_datasetYears.length).tickFormat(d3.format("d")))
    .attr("transform", "translate(" + axesSpace.left + "," + (chartHeight + axesSpace.top) + ")");

  linechart_svg.append("g").call(d3.axisLeft(linechart_yScale))
    .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")");

  linechart_svg.append("path").datum(linechart_dataset)
    .attr("class", "line").attr("d", linechart_line)
    .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")");

  linechart_svg.selectAll(".dot").data([linechart_dataset[curYear]]).enter().append("circle").attr("class", "dot")
    .attr("cx", linechart_xScale(curYear)).attr("cy", linechart_yScale(linechart_dataset[curYear - linechart_datasetYears[0]])).attr("r", 7)
    .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")");


  //Interactivity
  d3.select("#year-slider").on("input", function() {
    curYear = document.getElementById("year-slider").value;

    barchart_dataset = barchart_datasetValues[curYear - 1];
    barchart_svg.selectAll("rect").data(barchart_dataset)
      .transition().duration(transitionSpeed)
      .attr("x", function(value, index) {
        return axesSpace.left + index * barchart_barWidth;
      }).attr("y", function(value) {
        return axesSpace.top + barchart_posHeight - Math.max(0, barchart_posYScale(value));
      }).attr("height", function(value) {
        return Math.abs(barchart_posYScale(value));
      }).attr("width", barchart_barWidth).style("fill", "green");

    linechart_dataset = linechart_datasetValues[curDistrict];
    linechart_svg.selectAll(".dot").data([linechart_dataset[curYear]])
      .transition().duration(transitionSpeed)
      .attr("class", "dot")
      .attr("cx", linechart_xScale(curYear)).attr("cy", linechart_yScale(linechart_dataset[curYear - linechart_datasetYears[0]])).attr("r", 7)
      .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")");
  });

  d3.select("#selector").on("input", function() {
    curDistrict = d3.select("#selector").node().value;

    linechart_dataset = linechart_datasetValues[curDistrict];
    //Update lines
    const linechart_lines = linechart_svg.selectAll(".line").datum(linechart_dataset).attr("class", "line");
    linechart_lines.exit().remove();
    linechart_lines.enter().append("path").attr("class", "line").attr("d", linechart_line);
    linechart_lines.transition().duration(transitionSpeed).attr("d", linechart_line);

    //Update dots
    linechart_svg.selectAll(".dot").data([linechart_dataset[curYear]])
      .transition().duration(transitionSpeed)
      .attr("class", "dot")
      .attr("cx", linechart_xScale(curYear)).attr("cy", linechart_yScale(linechart_dataset[curYear - linechart_datasetYears[0]])).attr("r", 7)
      .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")");

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
}

function getMax(datasetValues) {
  return Math.max.apply(Math, Object.values(datasetValues).map(function(row) {
    return Math.max.apply(Math, row);
  }));
}

function getMin(datasetValues) {
  return Math.min.apply(Math, Object.values(datasetValues).map(function(row) {
    return Math.min.apply(Math, row);
  }));
}
