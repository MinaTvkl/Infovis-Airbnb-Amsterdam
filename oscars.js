var margin = { top: 40, right: 30, bottom: 30, left: 50 },
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

var data;
d3.csv("bar_chart_migration_saldo.csv", function (d) {
    return {
        Year: new Date(+d.Year, 0, 1), // convert "Year" column to Date
        Migration: +d.Amsterdam // convert "Length" column to number

    };
}, function (error, rows) {
    console.log(rows);
});
/*.then((data) => {
        return data.map((d) => {
            console.log(d.Amsterdam)
            d.Amsterdam = +d.Amsterdam;
            console.log(d.Amsterdam)

            return d;
        });})*/
/*
.then(function (data) { //reading in the data hoping it works
    dataset = data; // this variable is always the full dataset
    console.log(dataset)

    gen_vis();});*/

d3.csv("bar_chart_migration_saldo.csv")
    .then((data) => {
        return data.map((d) => {
            d.Year = +d.Year;
            d.Amsterdam = d.Amsterdam;
            console.log(d)
            console.log(d.Amsterdam)
            //gen_vis(); //where to put?
            return d;
            
            
        })

    })
    .catch((error) => {
        throw error;
    });


function gen_vis() {
    x.domain(data.map(d => { return d.Year; }));
    // y.domain([0, d3.max(data,  d => { return d.Amsterdam; })]);
    y.domain([0, d3.max(data, function (d) { return d.Amsterdam; })]); //onclick change

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .style("display", d => { return d.Amsterdam === null ? "none" : null; })
        .style("fill", d => {
            return d.Amsterdam === d3.max(data, d => { return d.Amsterdam; })
                ? highlightColor : barColor
        })
        .attr("x", d => { return x(d.Year); })
        .attr("width", x.bandwidth())
        .attr("y", d => { return height; })
        .attr("height", 0)
        .transition()
        .duration(750)
        .delay(function (d, i) {
            return i * 150;
        })
        .attr("y", d => { return y(d.Amsterdam); })
        .attr("height", d => { return height - y(d.Amsterdam); });

    svg.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .style("display", d => { return d.Amsterdam === null ? "none" : null; })
        .attr("x", (d => { return x(d.Year) + (x.bandwidth() / 2) - 8; }))
        .style("fill", d => {
            return d.Amsterdam === d3.max(data, d => { return d.Amsterdam; })
                ? highlightColor : greyColor
        })
        .attr("y", d => { return height; })
        .attr("height", 0)
        .transition()
        .duration(750)
        .delay((d, i) => { return i * 150; })
        .text(d => { return formatPercent(d.Amsterdam); })
        .attr("y", d => { return y(d.Amsterdam) + .1; })
        .attr("dy", "-.7em");
}