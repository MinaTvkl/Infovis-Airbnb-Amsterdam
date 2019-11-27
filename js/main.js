var districtNames = ["Amsterdam", "Centrum", "West", "Nieuw-West", "Zuid", "Oost", "Noord", "Zuidoost"];
var indicatorNames = ["Criminality", "Nuisance", "Persons_avoidance", "Persons_inconvenience", "Safety"];
var barchart_datasetValues = {};
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

Promise.all([
  d3.json("/data/bar_chart/migration.json"),
  d3.json("/data/line_chart/avg_prices_district.json"),
  d3.json("/data/radar_chart/indicators.json"),
  d3.json("/data/map/GEBIED_STADSDELEN.json"),
  d3.json("/data/map/test.json")
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

  var map_sequentialScale = d3.scaleSequential()
    .domain([map_min, map_max])
    .interpolator(d3.interpolateGreens);

  let map_svg = d3.select("#map").append("svg")
    .attr("width", idiomWidth)
    .attr("height", idiomHeight);

  map_svg.selectAll("path").data(map_datasetMap.features).enter().append("path")
    .classed("highlighted", function(value) {
      if (curDistrict == "Amsterdam") return true;
      else if (curDistrict == value.properties.Stadsdeel) return true;
      else return false;
    })
    .classed("district", true)
    .attr("d", path)
    .on("mouseover", function(value, index) {
      tooltip.style("display", "block");
      tooltip.html(value.properties.Stadsdeel + ": " + map_datasetListings[curYear - 1][value.properties.Stadsdeel]).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 40) + "px");
    })
    .on("mousemove", function() {
      tooltip.style("top", (event.pageY - 40) + "px").style("left", (event.pageX) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    })
    .style("fill", function(value) {
      // return "green";
      return map_sequentialScale(map_datasetListings[curYear - 1][value.properties.Stadsdeel]);
    })
    .on("click", function(value) {
      d3.select("#selector").node().value = value.properties.Stadsdeel;
      d3.select("#selector").node().dispatchEvent(new Event('input'));
    });

  //
  // map_svg.selectAll("circle")
  //   .data(map_datasetListings)
  //   .enter()
  //   .append("circle")
  //   .attr("class", "circles")
  //   .attr("cx", function(d) {
  //     return projection([processPosition(d.longitude.toString(), 1), processPosition(d.latitude.toString(), 2)])[0];
  //   })
  //   .attr("cy", function(d) {
  //     return projection([processPosition(d.longitude.toString(), 1), processPosition(d.latitude.toString(), 2)])[1];
  //   })
  //   .attr("r", "0.2px");

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
    .x(function(value, index) {
      return indexToCoordinate(index, value).x;
    })
    .y(function(value, index) {
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
      radarchart_svg.append("line").attr("class", "axis")
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
    .on("mouseover", function(value) {
      tooltip.style("display", "block");
      tooltip.html("Criminality: " + radarchart_dataset[0] +
        "<br/>Nuisance: " + radarchart_dataset[1] +
        "<br/>Persons avoidance: " + radarchart_dataset[2] +
        "<br/>Persons inconvenience: " + radarchart_dataset[3] +
        "<br/>Safety: " + radarchart_dataset[4]).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 124) + "px");
    })
    .on("mousemove", function() {
      tooltip.style("top", (event.pageY - 124) + "px").style("left", (event.pageX) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    });


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
    .attr("width", idiomWidth);

  //Add data
  barchart_svg.selectAll("rect").data(barchart_dataset).enter().append("rect").attr("class", "bar")
    .attr("x", function(value, index) {
      return axesSpace.left + index * barchart_barWidth;
    }).attr("y", function(value) {
      return axesSpace.top + barchart_posHeight - Math.max(0, barchart_posYScale(value));
    }).attr("height", function(value) {
      return Math.abs(barchart_posYScale(value));
    }).attr("width", barchart_barWidth)
    .classed("highlighted", function(value, index) {
      return (districtNames[index] == curDistrict);
    })
    .on("mouseover", function(value, index) {
      tooltip.style("display", "block");
      tooltip.html("People/year: " + barchart_dataset[index]).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 40) + "px");
    })
    .on("mousemove", function() {
      tooltip.style("top", (event.pageY - 40) + "px").style("left", (event.pageX) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    });


  //Add y axis
  barchart_svg.append("g").attr("transform", function(d) {
    return "translate(" + (axesSpace.left) + ", " + (axesSpace.top) + ")";
  }).call(d3.axisLeft(barchart_yScale));

  //adds y-axis label
  barchart_svg.append("text")
    .attr("class", "label")
    .attr("text-anchor", "end")
    .attr("y", -1)
    .attr("x", 0 - ((chartHeight + axesSpace.bottom) / 2))
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Migration (people/year)");

  //Add x axis
  barchart_svg.append("g").call(d3.axisBottom(barchart_xScale).tickSize(0))
    .attr("transform", "translate(" + axesSpace.left + "," + (barchart_posHeight + axesSpace.top) + ")")
    .selectAll("text").attr("transform", "translate(" + -1 * (barchart_barWidth / 4) + ", " + (barchart_negHeight + 20) + ") rotate(-45)");

  //Linechart
  var linechart_datasetYears = [2015, 2016, 2017, 2018, 2019];
  var linechart_dataset = linechart_datasetValues[curDistrict];

  var linechart_min = 0; //getMin(linechart_datasetValues);
  var linechart_max = getMax(linechart_datasetValues);

  var linechart_xScale = d3.scaleLinear().domain([linechart_datasetYears[0], linechart_datasetYears[linechart_datasetYears.length - 1]]).range([0, chartWidth]);
  var linechart_yScale = d3.scaleLinear().domain([linechart_min, linechart_max]).range([chartHeight, 0]);

  var linechart_line = d3.line().x(function(value, index) {
    return linechart_xScale(index + linechart_datasetYears[0]);
  }).y(function(value) {
    return linechart_yScale(value);
  });

  var linechart_svg = d3.select("#line-chart").append("svg")
    .attr("height", idiomHeight).attr("width", idiomWidth);

  linechart_svg.append("g").call(d3.axisBottom(linechart_xScale).ticks(linechart_datasetYears.length).tickFormat(d3.format("d")))
    .attr("transform", "translate(" + axesSpace.left + "," + (chartHeight + axesSpace.top) + ")");

  //adds x-axis label
  linechart_svg.append("text")
    .classed("label", true)
    .attr("transform",
      "translate(" + ((idiomWidth + axesSpace.right) / 2) + " ," +
      (idiomHeight) + ")")
    .style("text-anchor", "middle")
    .text("Year");

  linechart_svg.append("g").call(d3.axisLeft(linechart_yScale))
    .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")");
  //adds y-axis label
  linechart_svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -0.5)
    .attr("x", 0 - ((chartHeight + axesSpace.bottom) / 2))
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Price (€/night)");


  linechart_svg.append("path").datum(linechart_dataset)
    .attr("class", "line").attr("d", linechart_line)
    .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")");
  linechart_svg.selectAll(".dot").data([linechart_dataset[curYear]]).enter().append("circle").attr("class", "dot")
    .attr("cx", linechart_xScale(curYear)).attr("cy", linechart_yScale(linechart_dataset[curYear - linechart_datasetYears[0]])).attr("r", 6)
    .attr("transform", "translate(" + axesSpace.left + "," + axesSpace.top + ")")
    .on("mouseover", function(value, index) {
      tooltip.style("display", "block");
      tooltip.html("€/night: " + linechart_dataset[index]).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 40) + "px");
    })
    .on("mousemove", function() {
      tooltip.style("top", (event.pageY - 40) + "px").style("left", (event.pageX) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    });

  //Interactivity
  d3.select("#year-slider").on("input", function() {
    curYear = document.getElementById("year-slider").value;

    map_svg.selectAll("path").style("fill", function(value) {
      // return "green";
      return map_sequentialScale(map_datasetListings[curYear - 1][value.properties.Stadsdeel]);
    });

    barchart_dataset = barchart_datasetValues[curYear - 1];
    barchart_svg.selectAll("rect").data(barchart_dataset)
      .transition().duration(transitionSpeed)
      .attr("x", function(value, index) {
        return axesSpace.left + index * barchart_barWidth;
      }).attr("y", function(value) {
        return axesSpace.top + barchart_posHeight - Math.max(0, barchart_posYScale(value));
      }).attr("height", function(value) {
        return Math.abs(barchart_posYScale(value));
      }).attr("width", barchart_barWidth);

    linechart_dataset = linechart_datasetValues[curDistrict];
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

  d3.select("#selector").on("input", function() {
    curDistrict = d3.select("#selector").node().value;

    barchart_svg.selectAll(".bar").classed("highlighted", function(value, index) {
      return (districtNames[index] == curDistrict);
    });

    map_svg.selectAll("path")
      .classed("highlighted", function(value) {
        if (curDistrict == "Amsterdam") return true;
        else if (curDistrict == value.properties.Stadsdeel) return true;
        else return false;
      })
      .classed("district", true)
      .attr("d", path);


    linechart_dataset = linechart_datasetValues[curDistrict];
    //Update lines
    const linechart_lines = linechart_svg.selectAll(".line").datum(linechart_dataset).attr("class", "line");
    linechart_lines.transition().duration(transitionSpeed).attr("d", linechart_line);

    //Update dots
    linechart_svg.selectAll(".dot").data([linechart_dataset[curYear]])
      .transition().duration(transitionSpeed)
      .attr("class", "dot")
      .attr("cx", linechart_xScale(curYear)).attr("cy", linechart_yScale(linechart_dataset[curYear - linechart_datasetYears[0]]))
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
