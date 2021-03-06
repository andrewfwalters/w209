/** W209 - Assignment 1B
  * Andrew Walters (andrewfwalters@berkeley.edu)
  * June 21, 2018
**/

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
  var topGroup;

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
  default_carb_g = 200;
  default_fat_g = 66;
  default_protein_g = 150;

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
        .attr("transform", "translate(" + (cellSize*26) + "," + (-cellSize-1) + ")")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
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
    svg.append("g")
        .attr("transform", "translate(" + 0 + "," + (-3) + ")")
        .selectAll("text")
        .data(months)
        .enter()
        .append("text")
        .attr("transform", (d,i) => "translate("+ (i*(53/12)*cellSize+2.2*cellSize) + "," + 0 + ")")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .text(d => d);

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
        .attr("cursor", "crosshair")
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
        .attr("cursor", "crosshair")
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
    topGroup = topBox.append("g")
      .attr("transform", "translate(" + xMargin + ",0)");

    topGroup.append("text")
      .attr("text-anchor", "left")
      .attr("font-family", "sans-serif")
      .attr("font-size", 18)
      .attr("transform","translate(0," + slideHeight*0.2 + ")")
      .text("Set Macronutrient Goals:");

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
            .on("start drag", function() {
              var selectMacroGroup = d3.select(this.parentNode);
              var macroGrams = macroScale.invert(d3.event.x);
              goalSlide(selectMacroGroup,macroGrams);
            })
            .on("end", function() {
              goalSlideEnd(d3.select(this.parentNode.parentNode.parentNode));
            }));

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
        .attr("class", function() {return "handle " + d3.select(this.parentNode).datum(); })
        .attr("r", 9);

    var goalText = slider.append("text")
      .attr("class", function() {return "goalText " + d3.select(this.parentNode).datum(); })
      .attr("text-anchor", "middle")
      .attr("transform","translate(" + 4*cellSize + "," + -slideHeight*0.2 + ")");

    var goalText = topGroup.append("text")
      .attr("class", "goalText")
      .attr("id", "calorieTotal")
      .attr("text-anchor", "middle")
      .attr("color", "gray")
      .attr("transform","translate(" + ((4*cellSize)+(15*3*cellSize)) + "," + slideHeight*0.5 + ")")
      .text("2000 calories");

    function goalSlide(h,g) {
      h.selectAll("circle")
        .attr("cx", macroScale(g));
      h.selectAll("text")
        .filter(".goalText")
      .text(function() {
          return g.toFixed(0) + "g of " + h.datum();
        });
    }

    goalSlide(sliderGroups.filter(d => d==="carb"),default_carb_g);
    goalSlide(sliderGroups.filter(d => d==="fat"),default_fat_g);
    goalSlide(sliderGroups.filter(d => d==="protein"),default_protein_g);

    function goalSlideEnd(h) {
      var c = macroScale.invert(parseInt(
        d3.selectAll("circle")
          .filter(".handle")
          .filter(".carb")
          .attr("cx")));
      var f = macroScale.invert(parseInt(
        d3.selectAll("circle")
          .filter(".handle")
          .filter(".fat")
          .attr("cx")));
      var p = macroScale.invert(parseInt(
        d3.selectAll("circle")
          .filter(".handle")
          .filter(".protein")
          .attr("cx")));
      updateGoals(c,f,p);
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

    var legendData1 = [
      {"r":1, "fill":hues[3], "text": "-20% from Calorie Goal"},
      {"r":cellSize/4, "fill":hues[3], "text": "Calorie Goal"},
      {"r":cellSize/2-1, "fill":hues[3], "text": "+20% from Calorie Goal"}
    ];
    var legendData2 = [
      {"r":cellSize/4, "fill":hues[0], "text": "High Percentage of Carbs"},
      {"r":cellSize/4, "fill":hues[1], "text": "High Percentage of Fats"},
      {"r":cellSize/4, "fill":hues[2], "text": "High Percentage of Proteins"}
    ];

    var drawLegendColumn = function(data,offset) {
      var legendGroup = bottomBox.append("g")
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
          .attr("class","Legend")
          .attr("transform", function(d,i) {
            return "translate(" + offset + "," + ((0.5*cellSize)+(cellSize*i*1.5)) + ")";
          });

      legendGroup.append("rect")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("fill","white")
        .attr("stroke", "#ccc");

      legendGroup.append("circle")
          .attr("r", function(){
            return d3.select(this.parentNode).datum().r;
          })
          .attr("cx", cellSize/2)
          .attr("cy", cellSize/2)
          .attr("fill", function(){
            return d3.select(this.parentNode).datum().fill;
          })
          .attr("stroke", "none");

      legendGroup.append("text")
          .attr("x", cellSize*1.5)
          .attr("y", cellSize*0.7)
          .attr("font-family", "sans-serif")
          .attr("font-size", 10)
          .style("text-anchor", "left")
          .text(function(){
            return d3.select(this.parentNode).datum().text;
          });
    };
    drawLegendColumn(legendData1,0);
    drawLegendColumn(legendData2,cellSize*15);

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
      updateGoals(default_carb_g,default_fat_g,default_protein_g);
    }); //d3.json

  }; //readData

  var updateGoals = function(c,f,p) {
    macroGoals = macroObjectUtility(c,f,p);
    calculateGoalUpdate();
    drawGoalUpdate();
  }

  var calculateGoalUpdate = function() {
    var calLowerBound = macroGoals.calorie_c-macroGoals.calorie_c*calsDisplayMax;
    var calUpperBound = macroGoals.calorie_c+macroGoals.calorie_c*calsDisplayMax;
    var rad = d3.scaleLinear()
      .domain([calLowerBound,calUpperBound])
      .range([1, cellSize/2-1])
      .clamp(true);

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
    d3.select("#calorieTotal")
      .text(macroGoals.calorie_c.toFixed(0) + " calories");
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

  var clickDateEvent = function(date,i) {
    var h = d3.select(this.parentNode);
    var thisRect = h.selectAll("rect");
    rect.attr("fill","white");
    if(detailObj.isSet===true && detailObj.objKey===date) {
      detailBox.style("visibility","hidden");
      detailObj.isSet = false;
    }
    else if(date in macroData) {
      detailBox.select("#text0")
        .text(date);
      detailBox.select("#text1")
        .text(detailString("Carbs",macroData[date].carb_g,macroData[date].carb_d));
      detailBox.select("#text2")
        .text(detailString("Fats",macroData[date].fat_g,macroData[date].fat_d));
      detailBox.select("#text3")
        .text(detailString("Protein",macroData[date].protein_g,macroData[date].protein_d));
      detailBox.select("#text4")
        .text("Calories: " + macroData[date].calorie_c);
      thisRect.attr("fill","lightgrey");
      detailBox.style("visibility","visible");
      detailObj.objKey = date;
      detailObj.isSet = true;
    }
    else {
      detailBox.style("visibility","hidden");
      detailObj.isSet = false;
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
