var width = 960,
    height = 146,
    cellSize = 17;

var calorieGoal = 2000,
    carbGoal = 0.40,
    fatGoal = 0.30,
    proteinGoal = 0.30;

var calsPerCarb = 4,
    calsPerFat = 9,
    calsPerProtein = 4;

var formatPercent = d3.format(".1%");

var color = d3.scaleQuantize()
    .domain([-0.05, 0.05])
    .range(["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"]);

var svg = d3.select("body")
  .selectAll("svg")
  .data(d3.range(2017, 2019))
  .enter().append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

svg.append("text")
    .attr("transform", "translate(" + cellSize * 26 + ",-6)")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text(function(d) { return d; });

    weekDays = ['S','M','T','W','T','F','S']

    var daysOfWeek = svg//selectAll("svg")
        .append("g")
        .attr("transform", "translate(" + (-cellSize) + "," + 0 + ")");

    daysOfWeek.selectAll("text")
        .data(weekDays)
        .enter()
        .append("text")
        .attr("transform", (d,i) => "translate(6," + (cellSize * i + 12) + ")")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .text(d => d);

var rect = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#ccc")
  .selectAll("rect")
  .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  .enter().append("rect")
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("x", function(d) { return d3.timeWeek.count(d3.timeYear(d), d) * cellSize; })
    .attr("y", function(d) { return d.getDay() * cellSize; })
    .datum(d3.timeFormat("%Y-%m-%d"));

svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#000")
  .selectAll("path")
  .data(function(d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  .enter().append("path")
    .attr("d", pathMonth);

d3.json("http://people.ischool.berkeley.edu/~andrewfwalters/a1/data/diet.json", function(error, json) {
  if (error) throw error;

  var red = d3.scaleLinear()
    .domain([0,Math.max(Math.abs(1-carbGoal),Math.abs(0-carbGoal))])
    .range([0, 255]);
  var green = d3.scaleLinear()
    .domain([0,Math.max(Math.abs(1-fatGoal),Math.abs(0-fatGoal))])
    .range([0, 255]);
  var blue = d3.scaleLinear()
    .domain([0,Math.max(Math.abs(1-proteinGoal),Math.abs(0-proteinGoal))])
    .range([0, 255]);
  /*var lum = d3.scaleLinear()
    .domain([0,calorieGoal])
    .range([0, 30]);*/

  var fillColor = d3.nest()
      .key(function(d) { return d.date; })
      .rollup(function(d) {
        var calTotal = d.carbs*calsPerCarb + d.fat*calsPerFat + d.protein*calsPerProtein;
        var carbDiff = Math.abs(carbGoal-(d.carbs*calsPerCarb/calTotal))
        var fatDiff = Math.abs(fatGoal-(d.fat*calsPerFat/calTotal))
        var proteinDiff = Math.abs(proteinGoal-(d.protein*calsPerProtein/calTotal))
        console.log("d:" + JSON.stringify(d));
        console.log("carb:" + d.carbs + " fat:" + d.fat + " protein:" + d.protein);
        console.log("calTotal:" + calTotal + " carbDiff:" + carbDiff + " fatDiff:" + fatDiff + " proteinDiff:" + proteinDiff);
        return d3.rgb(red(carbDiff),green(fatDiff),blue(proteinDiff));
      })
    .object(json);

  /*var fillSaturation = d3.nest()
      .key(function(d) { return d.date; })
      .rollup(function(d) {

        return ;
      })
    .object(json);*/

  rect.filter(function(d) { return d in fillColor; })
      .attr("fill", d => fillColor[d]);
      /*
    .append("title")
      .text(function(d) { return d + ": " + formatPercent(data[d]); });*/
});

function pathMonth(t0) {
  var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
      d0 = t0.getDay(), w0 = d3.timeWeek.count(d3.timeYear(t0), t0),
      d1 = t1.getDay(), w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
      + "H" + w0 * cellSize + "V" + 7 * cellSize
      + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
      + "H" + (w1 + 1) * cellSize + "V" + 0
      + "H" + (w0 + 1) * cellSize + "Z";
}
