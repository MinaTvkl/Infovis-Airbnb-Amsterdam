var datasetValues, districtNames, max, min;
var datasetYears = [2014, 2015, 2016, 2017, 2018];

d3.json("/data/line_chart/avg_prices.json").then(function(data) {
  dataset = data;
  years = Object.keys(data.Amsterdam);
  console.log(years)
  datasetValues = {
    Amsterdam: Object.values(data.Amsterdam),
    Slotervaart: Object.values(data.Slotervaart),
    Watergraafsmeer: Object.values(data.Watergraafsmeer),
    Westerpark: Object.values(data.Westerpark),
    Zuid: Object.values(data.Zuid)
    
  }
  console.log(Object.values(datasetValues))
  max = Math.max.apply(Math, Object.values(datasetValues).map(function(row) {
    return Math.max.apply(Math, row);
  }));
  min = Math.min.apply(Math, Object.values(datasetValues).map(function(row) {
    return Math.min.apply(Math, row);
  }));
 gen_vis1()
});
function gen_vis1(){
/*years in x and prices in y, per district(key)*/
// 2. Use the margin convention practice 
var margin = {top: 50, right: 50, bottom: 50, left: 50}
  , width = 500 - margin.left - margin.right // sets svg width
  , height = 300 - margin.top - margin.bottom; // sets svg height

// The number of datapoints
var n = 21;

// 5. X scale will use the index of our data
var xScale = d3.scaleLinear()
    .domain([0, n-1]) // input
    .range([0, width]); // output

// 6. Y scale will use the randomly generate number 
var yScale = d3.scaleLinear()
    .domain([0, 1]) // input 
    .range([height, 0]); // output 

// 7. d3's line generator
var line = d3.line()
    .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
    .y(function(d) { return yScale(d.y); }) // set the y values for the line generator 
    .curve(d3.curveMonotoneX) // apply smoothing to the line

// 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
var dataset = d3.range(n).map(function(d) { return {"y": d3.randomUniform(1)() } })
console.log(dataset)
console.log(datasetValues.Amsterdam)
// 1. Add the SVG to the page and employ #2
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("border", "1px solid")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// 3. Call the x axis in a group tag
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

// 4. Call the y axis in a group tag
svg.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

// 9. Append the path, bind the data, and call the line generator 
svg.append("path")
    //why doesn't this work???
    //.datum(datasetValues.Amsterdam)
    .datum(dataset) // 10. Binds data to the line 
    .attr("class", "line") // Assign a class for styling 
    .attr("d", line); // 11. Calls the line generator 

// 12. Appends a circle for each datapoint 
svg.selectAll(".dot")
    .data(dataset)
  .enter().append("circle") // Uses the enter().append() method
    .attr("class", "dot") // Assign a class for styling
    .attr("cx", function(d, i) { return xScale(i) })
    .attr("cy", function(d) { return yScale(d.y) })
    .attr("r", 5)
      .on("mouseover", function(a, b, c) { 
  			console.log(a) 
        this.attr('class', 'focus')
		})
      .on("mouseout", function() {  })
    }