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
var calsPerCarb = 4,
    calsPerFat = 9,
    calsPerProtein = 4;
var calsDisplayMax = 0.2;

var MacroPlotLib = function() {

  //svg member variables
  var svg; //array of svgs for each calendar year
  var rect; //array of rects for each day in each element of svg
  var circ; //array of circles for each day in each element of svg
  var dateGroups;

  //data member variables
  var macroData = {}; //{YYYY-MM-DD: {carb_g,fat_g,protein_g,carb_d,fat_d,protein_d,calorie_c}}
  var macroGoals; //{"carbs_g","fat_g","protein_g","carbs_d","fat_d","protein_d","calorie_c"}
  var monthStats; //{YYYY-MM: {carb_diff_g,fat_diff_g,protein_diff_g,calorie_diff_g}}
  var dayStats;

  //visual constants
  var hues = ["royalblue","forestgreen","firebrick","gray"];
  var macroThreshold = 0.04;
  calsDisplayMax = 0.2;

  var drawCalendar = function(url) {
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
        .attr("r", 1)
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

    //read in data and populate calendar
    readData(url);
  };

  /* readData
   * expects an array of json objects
   * each object should have a "date" in the format "YYYY-MM-DD"
   * and the numerical attributes "carbs", "fat" and "protein"
   */
  var readData = function(url) {
    d3.json(url, function(error, json) {
      //throw exception if json cannot be read (unhandled)
      if (error) throw error;
      //read json into memory as macroData
      macroData = d3.nest()
        .key(function(d) { return d.date; })
        .rollup(function(d) {
            var macro = macroObjectUtility(d[0].carbs,d[0].fat,d[0].protein);
            return macro;
          })
        .object(json);
      updateGoals();
    }); //d3.json

  }; //readData

  var updateGoals = function() {
    macroGoals = macroObjectUtility(200,66,150);
    calculateGoalUpdate();
    drawGoalUpdate();
  }

  var calculateGoalUpdate = function() {
    var calLowerBound = macroGoals.calorie_c-macroGoals.calorie_c*calsDisplayMax;
    var calUpperBound = macroGoals.calorie_c+macroGoals.calorie_c*calsDisplayMax;
    var rad = d3.scaleLinear()
      .domain([calLowerBound,calUpperBound])
      .range([1, cellSize/2-1]);

    Object.keys(macroData).map(function(key, index) {
      //calculate fill color
      var carbDiff = Math.max(0,(macroData[key].carb_d)-macroGoals.carb_d);
      var fatDiff = Math.max(0,(macroData[key].fat_d)-macroGoals.fat_d);
      var proteinDiff = Math.max(0,(macroData[key].protein_d)-macroGoals.protein_d);
      var diffs = [carbDiff,fatDiff,proteinDiff,macroThreshold];
      var i = diffs.indexOf(Math.max(carbDiff,fatDiff,proteinDiff,macroThreshold));
      macroData[key].fillColor = d3.hcl(hues[i]);
      //calculate radius
      macroData[key].r = rad(Math.max(Math.min(calUpperBound,macroData[key].calorie_c),calLowerBound));
    });
  }//calculateGoalUpdate

  var drawGoalUpdate = function() {
    dateGroups.selectAll("circle")
      .filter(function(d) { return d in macroData; })
        .transition()
          .duration(500)
          .attr("fill", d => macroData[d].fillColor)
          .attr("r",d => macroData[d].r);
  }//drawGoalUpdate

  /* macroObjectUtility
   * takes macro measurements in grams
   * returns object with decimal ratios of each macro, total calories
   */
  var macroObjectUtility = function(carb_g,fat_g,protein_g) {
    var ret = {
      "carbs_g":carb_g,
      "fat_g":fat_g,
      "protein_g":protein_g
    };
    var carb_c = carb_g*calsPerCarb;
    var fat_c = fat_g*calsPerFat;
    var protein_c = protein_g*calsPerProtein;
    ret.calorie_c = carb_c+fat_c+protein_c;
    ret.carb_d = carb_c/ret.calorie_c;
    ret.fat_d = fat_c/ret.calorie_c;
    ret.protein_d = protein_c/ret.calorie_c;
    return ret;
  }//macroObjectUtility

  return {
    "drawCalendar": drawCalendar
  };
};//MacroPlotLib

var andrewMarcos = MacroPlotLib();
var url = "http://people.ischool.berkeley.edu/~andrewfwalters/a1/data/diet.json";
andrewMarcos.drawCalendar(url);
//andrewMarcos.drawPoints();
//andrewMarcos.drawGraphic();
//andrewMarcos.setGoals();
