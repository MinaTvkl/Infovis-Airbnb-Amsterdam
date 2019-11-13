var dataset;

d3.csv("bar_chart_migration_saldo.csv").then(function(data) {
  dataset = data.map(function(val) {
    return {
      Year: val.Year,
      Value: val.Amsterdam
    };
  })
  gen_vis();
});

var idiomWidth;
var idiomHeight;

//Used https://bl.ocks.org/gurjeet/83189e2931d053187eab52887a870c5e as example
function gen_vis() {
  var barWidth = 30;
  idiomHeight = 500;
  var margin = 0;
  idiomWidth = margin + barWidth * dataset.length;

  var valuesOnly = dataset.map(function(val) {
    console.log(val.Value);
    return val.Value;
  });

  var yScale = d3.scaleLinear()
    .domain([0, d3.max(valuesOnly)])
    .range([0, idiomHeight]);

  var yAxisScale = d3.scaleLinear()
    .domain([d3.min(valuesOnly), d3.max(valuesOnly)])
    .range([idiomHeight - yScale(d3.min(dataset)), 0]);

  var svg = d3.select("#chart");

  //Idiomheight is idiomHeight + 100 in example
  svg.attr("height", idiomHeight).attr("width", idiomWidth);

  svg.selectAll("rect")
    .data(valuesOnly)
    .enter()
    .append("rect")
    //Set bar's x position to next to one another
    .attr("x", function(value, index) {
      return margin + index * barWidth;
    })
    //Set bar's y position to the x-axis
    .attr("y", function(value) {
      return idiomHeight - Math.max(0, yScale(value));
    })
    //Scale height of bar to value relative to max value on the y axis
    .attr("height", function(value) {
      return yScale(value);
    })
    .attr("width", barWidth)
    .style("fill", "green");

  var yAxis = d3.axisLeft(yAxisScale);

  svg.append("group")
    .call(yAxis);
}
