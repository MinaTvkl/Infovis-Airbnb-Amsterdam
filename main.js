var districtNames = ["Amsterdam", "Centrum", "West", "Nieuw-West", "Zuid", "Oost", "Noord", "Zuidoost"];
var barchart_datasetValues = {};
var linechart_datasetValues = {};

var curYear = 2019;
var curDistrict = "Amsterdam";

var idiomWidth = 500;
var idiomHeight = 300;

var axesSpace = {
  top: 0,
  right: 20,
  bottom: 50,
  left: 40
}

var chartWidth = idiomWidth - axesSpace.left - axesSpace.right;
var chartHeight = idiomHeight - axesSpace.top - axesSpace.bottom;

Promise.all([
  d3.json("/data/bar_chart/migration.json"),
  d3.json("/data/line_chart/avg_prices_district.json"),
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

  //Calling render function
  gen_vis();
});

function gen_vis() {
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
      return barchart_posHeight - Math.max(0, barchart_posYScale(value));
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

  d3.select("#year-slider").on("input", function() {
    curYear = document.getElementById("year-slider").value;
    barchart_dataset = barchart_datasetValues[curYear - 1];

    barchart_svg.selectAll("rect").data(barchart_dataset)
      .transition().duration(1000)
      .attr("x", function(value, index) {
        return axesSpace.left + index * barchart_barWidth;
      }).attr("y", function(value) {
        return barchart_posHeight - Math.max(0, barchart_posYScale(value));
      }).attr("height", function(value) {
        return Math.abs(barchart_posYScale(value));
      }).attr("width", barchart_barWidth).style("fill", "green");
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

function gen_vis_line_chart(datasetValues) {
  var datasetYears = [2015, 2016, 2017, 2018, 2019];

  var dataset = datasetValues[curDistrict];



  var graphWidth = idiomWidth;
  var graphHeight = idiomHeight;

  var chartWidth = graphWidth - axesSpace.left - axesSpace.right;
  var chartHeight = graphHeight - axesSpace.top - axesSpace.bottom;

  var max = Math.max.apply(Math, Object.values(datasetValues).map(function(row) {
    return Math.max.apply(Math, row);
  }));
  var min = Math.min.apply(Math, Object.values(datasetValues).map(function(row) {
    return Math.min.apply(Math, row);
  }));

  var xScale = d3.scaleLinear().domain([datasetYears[0], datasetYears[datasetYears.length - 1]]).range([0, chartWidth]);
  var yScale = d3.scaleLinear().domain([min, max]).range([chartHeight, 0]);

  var line = d3.line().x(function(value, index) {
    return xScale(index + datasetYears[0]);
  }).y(function(value) {
    return yScale(value);
  });

  var svg = d3.select("#line-chart")
    .append("svg")
    .attr("height", graphHeight)
    .attr("width", graphWidth)
    .style("border", "1px solid");

  svg.append("g").call(d3.axisBottom(xScale).ticks(datasetYears.length).tickFormat(d3.format("d")))
    .attr("transform", "translate(" + axesSpace.left + "," + (chartHeight + axesSpace.top) + ")");

  svg.append("g").call(d3.axisLeft(yScale))
    .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")");

  svg.append("path")
    .datum(dataset)
    .attr("class", "line")
    .attr("d", line)
    .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")");

  svg.selectAll(".dot")
    .data([dataset[curYear]])
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", function(value) {
      return xScale(curYear)
    })
    .attr("cy", function(value) {
      return yScale(dataset[curYear - datasetYears[0]])
    })
    .attr("r", 7)
    .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")");

  d3.select("#year-slider").on("input", function() {

  });


}

//Used https://bl.ocks.org/gurjeet/83189e2931d053187eab52887a870c5e as example
function gen_vis_bar_chart(datasetValues) {
  var datasetYears = [2014, 2015, 2016, 2017, 2018];

  var dataset = datasetValues[curYear - 1];

  var axesSpace = {
    top: 0,
    right: 20,
    bottom: 50,
    left: 40
  }

  var graphWidth = idiomWidth;
  var graphHeight = idiomHeight;

  var chartWidth = graphWidth - axesSpace.left - axesSpace.right;
  var chartHeight = graphHeight - axesSpace.top - axesSpace.bottom;

  var max = Math.max.apply(Math, Object.values(datasetValues).map(function(row) {
    return Math.max.apply(Math, row);
  }));
  var min = Math.min.apply(Math, Object.values(datasetValues).map(function(row) {
    return Math.min.apply(Math, row);
  }));

  var barWidth = Math.abs(chartWidth / datasetValues[2014].length);
  var posPercentage = max / (max + Math.abs(min));

  var posHeight = posPercentage * chartHeight;
  var negHeight = (1 - posPercentage) * chartHeight;

  var posYScale = d3.scaleLinear().domain([0, max]).range([0, posHeight]);
  var yScale = d3.scaleLinear().domain([min, max]).range([chartHeight, 0]);
  var xScale = d3.scaleBand().domain(districtNames).range([0, chartWidth]);

  var yAxis = d3.axisLeft(yScale);
  var xAxis = d3.axisBottom(xScale).tickSize(0);

  var svg = d3.select("#bar-chart")
    .append("svg")
    .attr("height", graphHeight)
    .attr("width", graphWidth)
    .style("border", "1px solid");

  svg.selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("x", function(value, index) {
      return axesSpace.left + index * barWidth;
    })
    .attr("y", function(value) {
      return posHeight - Math.max(0, posYScale(value));
    })
    .attr("height", function(value) {
      return Math.abs(posYScale(value));
    })
    .attr("width", barWidth)
    .style("fill", "green");

  svg.append("g").attr("transform", function(d) {
    return "translate(" + (axesSpace.left) + ", " + (axesSpace.top) + ")";
  }).call(yAxis);

  svg.append("g").call(xAxis)
    .attr("transform", "translate(" + axesSpace.left + "," + (posHeight + axesSpace.top) + ")")
    .selectAll("text").attr("transform", "translate(" + -1 * (barWidth / 4) + ", " + (negHeight + 20) + ") rotate(-45)");

  d3.select("#year-slider").on("input", function() {
    var year = document.getElementById("year-slider").value;
    dataset = datasetValues[year - 1];

    svg.selectAll("rect")
      .data(dataset)
      .transition() // add a smooth transition
      .duration(1000)
      .attr("x", function(value, index) {
        return axesSpace.left + index * barWidth;
      })
      .attr("y", function(value) {
        return posHeight - Math.max(0, posYScale(value));
      })
      .attr("height", function(value) {
        return Math.abs(posYScale(value));
      })
      .attr("width", barWidth)
      .style("fill", "green");
  });

}
