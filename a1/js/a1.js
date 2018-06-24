/** W209 - Assignment 1B
  * Andrew Walters (andrewfwalters@berkeley.edu)
  * June 21, 2018
**/

//todo add a slider
//todo add slider action
//todo include text
//todo add an on hover fade
//todo write prose and takeaways
//todo scale svg

// Global Constants
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

//var MacroPlotLib = MacroPlotLib || {};

var MacroPlotLib = function() {

  /*
  var goals = {
    "carb_d": ,
    "fat_d": ,
    "protein_d": ,
    "calorie_c": 2000
  }

  var calculateGoals = function() {
    "carb_g": ,
    "fat_g": ,
    "protein_g": ,
  }
  */

  // module private vars
  var svg; //array of svgs for each calendar year
  var rect; //array of rects for each day in each element of svg
  var circ; //array of circles for each day in each element of svg
  var dateGroups;

  var drawCalendar = function() {
    svg = d3.select("body")
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
        .text(d => d);

    weekDays = ['S','M','T','W','T','F','S']

    svg.append("g")
        .attr("transform", "translate(" + (-cellSize) + "," + 0 + ")")
        .selectAll("text")
        .data(weekDays)
        .enter()
        .append("text")
        .attr("transform", (d,i) => "translate(6," + (cellSize * i + 12) + ")")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .text(d => d);

    dateGroups = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
      .selectAll("rect")
      .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter()
      .append("g");

    var dateX = function(offset) {
      return d => d3.timeWeek.count(d3.timeYear(d), d) * cellSize + offset;
    }
    var dateY = function(offset) {
      return d => d.getDay() * cellSize + offset;
    }

    var rectX = dateX(0);
    var rectY = dateY(0);
    rect = dateGroups.append("rect")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("x", rectX)
        .attr("y", rectY)
        .datum(d3.timeFormat("%Y-%m-%d"));

    var circX = dateX(cellSize/2);
    var circY = dateY(cellSize/2);
    circ = dateGroups.append("circle")
        .attr("r", cellSize/4)
        .attr("cx", circX)
        .attr("cy", circY)
        .attr("fill", "none")
        .attr("stroke", "none")
        .datum(d3.timeFormat("%Y-%m-%d"));

    svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#000")
      .selectAll("path")
      .data(function(d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter().append("path")
        .attr("d", pathMonth);

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
  };

  var drawPoints = function() {
    d3.json("http://people.ischool.berkeley.edu/~andrewfwalters/a1/data/diet.json", function(error, json) {
      if (error) throw error;

      var rad = d3.scaleLinear()
        .domain([-calorieGoal/2,calorieGoal/2])
        .range([1, cellSize/2]);

      var hues = ["royalblue","forestgreen","firebrick","gray"];
      var macroThreshold = 0.04
      var fillColor = d3.nest()
          .key(function(d) { return d.date; })
          .rollup(function(d) {
            var calTotal = d[0].carbs*calsPerCarb + d[0].fat*calsPerFat + d[0].protein*calsPerProtein;
            var carbDiff = Math.max(0,(d[0].carbs*calsPerCarb/calTotal)-carbGoal)
            var fatDiff = Math.max(0,(d[0].fat*calsPerFat/calTotal)-fatGoal)
            var proteinDiff = Math.max(0,(d[0].protein*calsPerProtein/calTotal)-proteinGoal)
            var diffs = [carbDiff,fatDiff,proteinDiff,macroThreshold];
            var i = diffs.indexOf(Math.max(carbDiff,fatDiff,proteinDiff,macroThreshold));
            var color = d3.hcl(hues[i]);
            //color.l = lum(Math.min(calorieGoal/2,Math.abs(calTotal-calorieGoal)));
            return color;
          })
        .object(json);

        var fillColor = d3.nest()
            .key(function(d) { return d.date; })
            .rollup(function(d) {
              var calTotal = d[0].carbs*calsPerCarb + d[0].fat*calsPerFat + d[0].protein*calsPerProtein;
              return (rad(calTotal-calorieGoal));
            })
        .object(json);

      //todo change fill color to append circle with fill color and size
      dateGroups.selectAll("circle")
        .filter(function(d) { return d in fillColor; })
          .attr("fill", d => fillColor[d])
          .attr("r",rad);
    });
  };

  return {
    "drawCalendar": drawCalendar,
    "drawPoints": drawPoints
  };
};

var andrewMarcos = MacroPlotLib();
andrewMarcos.drawCalendar();
andrewMarcos.drawPoints();
