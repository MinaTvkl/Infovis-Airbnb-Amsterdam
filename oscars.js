var margin = {top: 40, right: 30, bottom: 30, left: 50},
width = 460 - margin.left - margin.right,
height = 320 - margin.top - margin.bottom;

var greyColor = "#898989";
var barColor = d3.interpolateInferno(0.4);
var highlightColor = d3.interpolateInferno(0.3);

var formatPercent = d3.format(".0%");

var svg = d3.select("body").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleBand()
.range([0, width])
    .padding(0.4);
var y = d3.scaleLinear()
.range([height, 0]);

var xAxis = d3.axisBottom(x).tickSize([]).tickPadding(10);
var yAxis = d3.axisLeft(y).tickFormat(formatPercent);

var dataset = [{"year":"2014", "value": .07},
            {"year":"2015", "value": .13},
            {"year":"2016", "value": .56},
            {"year":"2017", "value": .95},
            {"year":"2018", "value": .81}];

x.domain(dataset.map( d => { return d.year; }));
// y.domain([0, d3.max(dataset,  d => { return d.value; })]);
y.domain([0, 1]);

svg.append("g")
.attr("class", "x axis")
.attr("transform", "translate(0," + height + ")")
.call(xAxis);
svg.append("g")
.attr("class","y axis")
.call(yAxis);

svg.selectAll(".bar")
.data(dataset)
.enter().append("rect")
.attr("class", "bar")
.style("display", d => { return d.value === null ? "none" : null; })
.style("fill",  d => { 
    return d.value === d3.max(dataset,  d => { return d.value; }) 
    ? highlightColor : barColor
    })
.attr("x",  d => { return x(d.year); })
.attr("width", x.bandwidth())
    .attr("y",  d => { return height; })
    .attr("height", 0)
        .transition()
        .duration(750)
        .delay(function (d, i) {
            return i * 150;
        })
.attr("y",  d => { return y(d.value); })
.attr("height",  d => { return height - y(d.value); });

svg.selectAll(".label")        
.data(dataset)
.enter()
.append("text")
.attr("class", "label")
.style("display",  d => { return d.value === null ? "none" : null; })
.attr("x", ( d => { return x(d.year) + (x.bandwidth() / 2) -8 ; }))
    .style("fill",  d => { 
        return d.value === d3.max(dataset,  d => { return d.value; }) 
        ? highlightColor : greyColor
        })
.attr("y",  d => { return height; })
    .attr("height", 0)
        .transition()
        .duration(750)
        .delay((d, i) => { return i * 150; })
.text( d => { return formatPercent(d.value); })
.attr("y",  d => { return y(d.value) + .1; })
.attr("dy", "-.7em"); 