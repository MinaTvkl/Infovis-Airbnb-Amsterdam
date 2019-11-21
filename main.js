var datasetValues, districtNames, max, min;
var datasetYears = [2014, 2015, 2016, 2017, 2018];

d3.json("/data/bar_chart/migration.json").then(function(data) {
  dataset = data;
  districtNames = Object.keys(data.year2014);
  datasetValues = {
    2014: Object.values(data.year2014),
    2015: Object.values(data.year2015),
    2016: Object.values(data.year2016),
    2017: Object.values(data.year2017),
    2018: Object.values(data.year2018)
  }
  max = Math.max.apply(Math, Object.values(datasetValues).map(function(row) {
    return Math.max.apply(Math, row);
  }));
  min = Math.min.apply(Math, Object.values(datasetValues).map(function(row) {
    return Math.min.apply(Math, row);
  }));
  dataset = datasetValues[2018];

  gen_vis();
});

function removeFirst(array) {
  return array.splice(1, array.length);
}

var idiomWidth = 500;
var idiomHeight = 300;

var axesSpace = {
  top: 0,
  right: 0,
  bottom: 50,
  left: 40
}

var barPadding = {
  sides: 2
}

var graphWidth = idiomWidth;
var graphHeight = idiomHeight;

var chartWidth = graphWidth - axesSpace.left - axesSpace.right;
var chartHeight = graphHeight - axesSpace.top - axesSpace.bottom;

//Used https://bl.ocks.org/gurjeet/83189e2931d053187eab52887a870c5e as example
function gen_vis() {
  var barWidth = Math.abs(chartWidth / dataset.length);
  var posPercentage = max / (max + Math.abs(min));

  var posHeight = posPercentage * chartHeight;
  var negHeight = (1 - posPercentage) * chartHeight;

  var posYScale = d3.scaleLinear().domain([0, max]).range([0, posHeight]);
  var yScale = d3.scaleLinear().domain([min, max]).range([chartHeight, 0]);
  var xScale = d3.scaleBand().domain(districtNames).range([0, chartWidth]);

  var yAxis = d3.axisLeft(yScale);
  var xAxis = d3.axisBottom(xScale).tickSize(0);

  var svg = d3.select("#chart")
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

  svg.append("g").attr("class", "axis").call(xAxis)
    .attr("transform", "translate(" + axesSpace.left + "," + (posHeight + axesSpace.top) + ")")
    .selectAll("text").attr("transform", "translate(" + 0 + ", " + (negHeight + 20) + ") rotate(-45)");

  d3.select("#year-slider").on("input", function() {
    var year = document.getElementById("year-slider").value;
    console.log(typeof year);
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
