var dataset;

d3.csv("bar_chart_migration_saldo.csv").then(function(data) {
  dataset = removeFirst(Object.values(data[1])).map(function(value) {
    return parseInt(value);
  });
  gen_vis();
});

function removeFirst(array) {
  return array.splice(1,array.length);
}

var idiomWidth = 500;
var idiomHeight = 400;

var padding = {top : 20, right: 20, bottom: 20, left: 40}

var graphWidth = idiomWidth - padding.left - padding.right;
var graphHeight = idiomHeight - padding.top - padding.bottom;

//Used https://bl.ocks.org/gurjeet/83189e2931d053187eab52887a870c5e as example
function gen_vis() {
  var barWidth = Math.abs(graphWidth / dataset.length) ;
  var maxBarPositiveHeightPercentage = d3.max(dataset) / (d3.max(dataset) + Math.abs(d3.min(dataset)));
  console.log(maxBarPositiveHeightPercentage);
  var maxBarPositiveHeight = graphHeight * maxBarPositiveHeightPercentage;
  var maxBarNegativeHeight = graphHeight * (1 - maxBarPositiveHeightPercentage);

  var positiveYAxisScale = d3.scaleLinear()
    .domain([0, d3.max(dataset)])
    .range([0, maxBarPositiveHeight]);

  var wholeYAxisScale = d3.scaleLinear()
    .domain([d3.min(dataset), d3.max(dataset)])
    .range([graphHeight, 0]);

  var yAxis = d3.axisLeft(wholeYAxisScale);

  var svg = d3.select("#chart")
    .append("svg")
    .attr("height", idiomHeight)
    .attr("width", idiomWidth)
    .style("border", "1px solid");

  svg.selectAll("rect")
  .data(dataset)
  .enter()
  .append("rect")
    .attr("x", function(value, index) {return padding.left + index*barWidth;})
    .attr("y", function(value) {return padding.top + maxBarPositiveHeight - Math.max(0, positiveYAxisScale(value));})
    .attr("height", function(value) {return Math.abs(positiveYAxisScale(value));})
    .attr("width", barWidth)
    .style("fill", "green");

  svg.append("g").attr("transform", function(d) {
    return "translate(" + padding.left + ", " + padding.top + ")";
  }).call(yAxis);
}
