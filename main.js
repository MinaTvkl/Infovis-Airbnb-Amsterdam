var districtNames = ["Amsterdam", "Centrum", "West", "Nieuw-West", "Zuid", "Oost", "Noord", "Zuidoost"];

var idiomWidth = 500;
var idiomHeight = 300;

d3.json("/data/bar_chart/migration.json").then(function(data) {
  var datasetValues = {
    2014: Object.values(data.year2014),
    2015: Object.values(data.year2015),
    2016: Object.values(data.year2016),
    2017: Object.values(data.year2017),
    2018: Object.values(data.year2018)
  }
  gen_vis_bar_chart(datasetValues);
});

d3.json("/data/line_chart/avg_prices_district.json").then(function(data) {
  var datasetValues = {};
  for (var i = 0; i < Object.keys(data).length; i++) {
    datasetValues[Object.keys(data)[i]] = Object.values(data[Object.keys(data)[i]]);
  }

  gen_vis_line_chart(datasetValues);
});

function gen_vis_line_chart(datasetValues) {
  var datasetYears = [2015, 2016, 2017, 2018, 2019];

  var dataset = datasetValues["Amsterdam"];

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

  var xScale = d3.scaleLinear().domain([datasetYears[0], datasetYears[datasetYears.length - 1]]).range([0, chartWidth]);
  var yScale = d3.scaleLinear().domain([min, max]).range([chartHeight, 0]);

  var line = d3.line().x(function(value, index) {
    return xScale(index+datasetYears[0]);
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
}

//Used https://bl.ocks.org/gurjeet/83189e2931d053187eab52887a870c5e as example
function gen_vis_bar_chart(datasetValues) {
  var datasetYears = [2014, 2015, 2016, 2017, 2018];

  var dataset = datasetValues[2018];

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
    dataset = datasetValues[year];

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
