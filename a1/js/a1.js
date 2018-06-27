/** W209 - Assignment 1B
  * Andrew Walters (andrewfwalters@berkeley.edu)
  * June 21, 2018
**/

//todo add a slider
//todo add slider action
//todo write prose and takeaways
//todo scale svg

// Global Constants
var calsPerCarb = 4,
    calsPerFat = 9,
    calsPerProtein = 4;

var MacroPlotLib = function() {

  //layout constants
  var width = 960,
      height = 158,
      cellSize = 17;

  //svg member variables
  var svg; //array of svgs for each calendar year
  var rect; //array of rects for each day in each element of svg
  var circ; //array of circles for each day in each element of svg
  var dateGroups; //group holding the circ and rect elements
  var detailBox;

  //data member variables
  var macroData; //{YYYY-MM-DD: {carb_g,fat_g,protein_g,carb_d,fat_d,protein_d,calorie_c}}
  var macroGoals; //{"carb_g","fat_g","protein_g","carbs_d","fat_d","protein_d","calorie_c"}
  var monthStats; //{YYYY-MM: {carb_g,fat_g,protein_g,carb_d,fat_d,protein_d,calorie_c}}
  var dayStats; //{"Monday": {carb_g,fat_g,protein_g,carb_d,fat_d,protein_d,calorie_c}}
  var detailObj = {"isSet":false}; //holds data for currently selected item in the detail box

  //visual constants
  var hues = ["royalblue","forestgreen","firebrick","gray"];
  var macroThreshold = 0.04;
  calsDisplayMax = 0.2;

  var drawMacroPlot = function(url) {

    /* Calendar Element
     * each calendar is created in this section
     */
    //draw an svg for each year
    var startYear = 2017;
    var endYear = 2018;
    svg = d3.select("#calendarContainer")
      .selectAll("svg")
      .data(d3.range(startYear, endYear+1))
      .enter().append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

    //draw the year on top of each year's svg
    svg.append("text")
        .attr("transform", "translate(" + cellSize * 26 + ",-18)")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .text(d => d);

    //draw the days of the week to the left of each year
    var weekDays = ['S','M','T','W','T','F','S'];
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

    var months = ['J','F','M','A','M','J','J','A','S','O','N','D'];

    //make a group for each day of each year
    dateGroups = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
      .selectAll("rect")
      .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter()
      .append("g");

    //define a curry-able function for the x and y coordinates of each date
    var dateX = function(offset) {
      return d => d3.timeWeek.count(d3.timeYear(d), d) * cellSize + offset;
    }
    var dateY = function(offset) {
      return d => d.getDay() * cellSize + offset;
    }

    //draw a rect for each day of each year
    var rectX = dateX(0);
    var rectY = dateY(0);
    rect = dateGroups.append("rect")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("x", rectX)
        .attr("y", rectY)
        .attr("fill","white")
        .datum(d3.timeFormat("%Y-%m-%d"))
        .on("mousedown",clickDateEvent);

    //draw a circle on top of each rect
    var circX = dateX(cellSize/2);
    var circY = dateY(cellSize/2);
    circ = dateGroups.append("circle")
        .attr("r", 1)
        .attr("cx", circX)
        .attr("cy", circY)
        .attr("fill", "none")
        .attr("stroke", "none")
        .datum(d3.timeFormat("%Y-%m-%d"))
        .on("mousedown",clickDateEvent);

    //draw lines to separate months
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

    /* Goal Sliders
     * sliders at the top the set macro goals
     */
     //add an svg to hold the goal sliders
    var slideWidth = cellSize*12;
    var slideHeight = cellSize*5+10;
    var xMargin = (width - cellSize * 53) / 2;
    var topBox = d3.select("#goalContainer")
      .append("svg")
      .attr("width", width)
      .attr("height", slideHeight)
    var topGroup = topBox.append("g")
      .attr("transform", "translate(" + xMargin + ",0)");

    //var sliderNames = ["carb","fat","protein"];
    var sliderNames = ["carb","fat","protein"];
    var sliderGroups = topGroup.selectAll("g")
      .data(sliderNames)
      .enter()
      .append("g");

    var macroScale = d3.scaleLinear()
      .domain([0, 300])
      .range([0, slideWidth])
      .clamp(true);

    var slider = sliderGroups.append("g")
      .attr("class", "slider")
      .attr("transform",function(d,i) {
        var str = "translate(" + 15*i*cellSize + "," + slideHeight*0.7 + ")";
        return str;
      });

    slider.append("line")
        .attr("class", "track")
        .attr("x1", macroScale.range()[0])
        .attr("x2", macroScale.range()[1])
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { slider.interrupt(); })
            .on("start drag", function() { goalSlide(macroScale.invert(d3.event.x)); }));
        /*.call(d3.drag()
          //.on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));*/

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
      .selectAll("text")
      .data(macroScale.ticks(5))
      .enter().append("text")
        .attr("x", macroScale)
        .attr("text-anchor", "middle")
        .text(function(d) { return d + "g"; });

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);

    var goalText = slider.append("text")
      .attr("class", "goalText")
      .attr("transform","translate(" + 4*cellSize + "," + -slideHeight*0.2 + ")")
      .text(function() {
        var macroType = d3.select(this.parentNode).datum();
        var macroAmount = handle.attr("cx");
        return macroAmount + "g of " + macroType;
      });

    /*slider.transition() // Gratuitous intro!
        .duration(750)
        .tween("hue", function() {
          var i = d3.interpolate(0, 70);
          return function(t) { goalSlide(i(t)); };
        });*/

    function goalSlide(g) {
      handle.attr("cx", macroScale(g));
      goalText.text(function() {
          var macroType = d3.select(this.parentNode).datum();
          var macroAmount = handle.attr("cx");
          return macroAmount + "g of " + macroType;
        });
      //topBox.style("background-color", d3.hsl(g, 0.8, 0.8));
    }

    /* Legend and Detail Box
     * the bottom part of the vizualization
     */
    //add an svg to hold legend and detail box
    var bottomBox = d3.select("#legendContainer")
      .append("svg")
      .attr("width", width)
      .attr("height", cellSize*5+10)
      .append("g")
      .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + ",10)");

    //draw the legend
    var legend = bottomBox.append("g");
      //.style("visibility","hidden");

    //draw the detail box
    detailBox = bottomBox.append("g")
      .style("visibility","hidden")
      .attr("transform", "translate(" + (cellSize * 38) + ",0)");
    detailBox.append("rect")
      .attr("width", cellSize*14)
      .attr("height", cellSize*1)
      .attr("fill","lightblue");
    detailBox.append("rect")
      .attr("width", cellSize*14)
      .attr("height", cellSize*4)
      .attr("fill","aliceblue")
      .attr("transform", "translate(0," + (cellSize*1) + ")");

    //draw 5 lines of text in the detail box
    detailBox.selectAll("text")
      .data(d3.range(0, 5))
      .enter()
      .append("text")
        .attr("id",d => "text" + d)
        .attr("x", cellSize*7)
        .attr("y", cellSize*0.7)
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .style("text-anchor", "middle")
        .text("text box")
        .attr("transform", d => "translate(0," + (cellSize*d) + ")");

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
      "carb_g":carb_g,
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

  var clickDateEvent = function(d,i) {
    if(detailObj.isSet===true && detailObj.objKey===d) {
      detailBox.style("visibility","hidden");
      detailObj.isSet = false;
    }
    else if(d in macroData) {
      detailBox.select("#text0")
        .text(d);
      detailBox.select("#text1")
        .text(detailString("Carbs",macroData[d].carb_g,macroData[d].carb_d));
      detailBox.select("#text2")
        .text(detailString("Fats",macroData[d].fat_g,macroData[d].fat_d));
      detailBox.select("#text3")
        .text(detailString("Protein",macroData[d].protein_g,macroData[d].protein_d));
      detailBox.select("#text4")
        .text("Calories: " + macroData[d].calorie_c);
      detailBox.style("visibility","visible");
      detailObj.objKey = d;
      detailObj.isSet = true;
    }
  }//clickDateEvent

  var detailString = function(macro,g,d) {
    var str = macro + ": " + g + "g (" + (100*d).toFixed(2) + "%)";
    return str;
  }

  return {
    "drawMacroPlot": drawMacroPlot
  };
};//MacroPlotLib

var andrewMarcos = MacroPlotLib();
var url = "http://people.ischool.berkeley.edu/~andrewfwalters/a1/data/diet.json";
andrewMarcos.drawMacroPlot(url);
