var data;
var instanceRead = false;
var instanceName = "";
var routes = [];
var circleRadius;
var x;
var y;
var svg;
var maing;
// viz sizes
var margin =  {top: 100, right: 50, bottom: 20, left: 100};
var width = 764 - margin.left - margin.right;
var height =  500 - margin.top - margin.bottom;


// User-uploaded instance
d3.select("#instance-upload").on("change", function () {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var filereader = new window.FileReader();
        filereader.onload = function () {

            loadNewInstanceFile(filereader.result);

        }
        filereader.readAsText(this.files[0]);
        instanceName = this.files[0].name;
    } else { console.log("Error with file upload. Please try again."); }
});

function print(astr) {
    console.log(astr);
}

var getColorIDer = function(e) {
    if (e.cs_type==null){
        return e.type
    } else {
        return e.type+" ("+e.cs_type+")";
    }
}

var makeViz = function (data) {

    // define circle radius based on width
    circleRadius = .02*width;

    // create SVG for the map
    svg = d3.select("#div-where-instance-goes").append("svg")
		.attr('viewBox', "0 0 " + (width + margin.right + margin.left) + " " + (height + margin.top + margin.bottom))
      	.attr('preserveAspectRatio',"xMinYMin meet")
		.attr("id", "map-zone-svg")
    maing = svg.append("g")
        .attr("transform","translate(" + margin.left + "," + margin.top + ")")
        .attr("id","map-g");

    // define scales
    x = d3.scaleLinear().domain([d3.min(data.map(function(e){return e.x;})),d3.max(data.map(function(e){return e.x;}))]).range([0, width]);
    y = d3.scaleLinear().domain([d3.min(data.map(function(e){return e.y;})),d3.max(data.map(function(e){return e.y;}))]).range([height, 0]);
    var color = d3.scaleOrdinal(d3.schemeCategory10).domain(data.map(function(e){return getColorIDer(e)}).sort());

    // nodes to plot
    var enteringE = maing.selectAll(".node")
    .data(data)
    .enter().append("g")
        .attr("transform", function(d){return "translate("+x(d.x)+","+y(d.y)+")"});
    
    // plot the circles
    var circles = enteringE.append("circle")
        .attr("r",circleRadius)
        .attr("id",function(d){return "circle-"+d.id;})
        .attr("fill",function(d){return color(getColorIDer(d))})
        .attr("stroke","white")
        .append("title")
            .text(function(d){
                if (d.type === "d") return "depot"
                else return "node "+d.id;
            });

    // label the circles
    var labels = enteringE.append("text")
        .attr("dy","0.4em")
        .text(function(d){return d.id;})
            .attr("text-anchor","middle");

    // add legend
    var legendLabels = color.domain().map(function(e) {return "Type "+e;});

    maing.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate("+(-margin.left/2)+","+(-3*margin.top/4)+")");

    var legendOrdinal = d3.legendColor()
        .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
        .shapePadding(10)
        .scale(color)
        .labels(legendLabels);

    maing.select(".legendOrdinal")
        .call(legendOrdinal);
}

// User-uploaded solution
d3.select("#solution-upload").on("change", function () {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var filereader = new window.FileReader();
        filereader.onload = function () {

            loadNewSolutionFile(filereader.result);

        }
        $('#uploadSolutionModal').modal('hide');
        filereader.readAsText(this.files[0]);
    } else { console.log("Error with file upload. Please try again."); }
});

var handleManualRouteInput = function(routeString) {

    // clear evidence of existing routes
    removeExistingRoutes();    

    // strip away leading and trailing whitespace (or brackets)
    routeString = routeString.replace(/^\[?(\s+)?|(\s+)?\]?$/gm,'');
    // break into array of ints on whitespace or commas
    routes.push({
        id:0,
        sequence:routeString.split(/[,\s]/gm).map(Number)
    });

    // plot the route
    plotRoutes(routes);

}

var removeExistingRoutes = function() {
    routes = [];
    d3.selectAll(".arrow").remove();
    d3.select("#routesLegend-g").remove();
}

var plotRoutes = function (routes) {

    // if there's only one route, simply plot it in black
    if (routes.length == 1){

        plotRoute(routes[0].sequence,"black",0);

    } else { // otherwise, we'll be plotting multiple, so we need diff colors and a legend

        // define scale for route colors
        var color = d3.scaleOrdinal(d3.schemeDark2).domain(routes.map(function(e){return e.id;}));

        // plot them
        routes.forEach(function(e) {plotRoute(e.sequence,color(e.id),e.id);});

        // make the legend
        maing.append("g")
            .attr("class", "legendRoutes")
            .attr("id", "routesLegend-g")
            .attr("transform", "translate("+(-margin.left+width/2)+","+(-3*margin.top/4)+")");

        var legendRoutes = d3.legendColor()
            .scale(4)
            .shape("line")
            .shapePadding(10)
            .orient("horizontal")
            .labelAlign("middle")
            .scale(color)
            .labels(color.domain())
            .on("cellclick", function(){
                // get the swatch for the legend entry
                var thisSwatch = d3.select(this).select("line");
                // toggle display when clicked
                thisSwatch.classed("hidden", !thisSwatch.classed("hidden"));
                // do the same for the route
                var d = +d3.select(this).select("text").text()
                toggleRouteShown(d);
            });

        maing.select(".legendRoutes")
            .call(legendRoutes);

        // make legend entries show cursor and add an overlay to capture pointer events
        var routeLegendCells = d3.selectAll(".legendRoutes .cell");
        routeLegendCells
            .style("cursor","pointer");
        routeLegendCells
            .append("rect")
                .attr("fill","none")
                .attr("width","15")
                .attr("height","25")
                .style("pointer-events","all")
    }
}

var plotRoute = function(route,color,rteId) {
    // draw arrows between consecutive nodes on route
    for (var i=1; i<route.length;i++){
        // nodes' IDs
        var srcID = route[i-1],
            destID = route[i];
        // nodes' data entries
        var srcNode = data.filter(function(d){return d.id == srcID;})[0],
            destNode = data.filter(function(d){return d.id == destID;})[0];

        var x1=srcNode.x,
            y1=srcNode.y,
            x2=destNode.x,
            y2=destNode.y;

        // angle between the nodes
        var theta = Math.atan2((y(y2)-y(y1)),(x(x2)-x(x1)));

        // determine whether the circles for the nodes overlap
        var distBetweenNodes = Math.sqrt(Math.pow((x(x1)-x(x2)),2)+Math.pow((y(y1)-y(y2)),2));
        var nodesOverlap = (distBetweenNodes < 2*circleRadius)?true:false;

        // where to put endpoints for the connecting arrow
        var plotPoints = {};

        // if so, we reverse the points x1,y1 and x2,y2
        if (nodesOverlap) {
            plotPoints.x2 = x(x1)+circleRadius*Math.cos(theta),
            plotPoints.y2 = y(y1)+circleRadius*Math.sin(theta),
            plotPoints.x1 = x(x2)+circleRadius*Math.cos(theta+Math.PI),
            plotPoints.y1 = y(y2)+circleRadius*Math.sin(theta+Math.PI)
        } else {
            plotPoints.x1 = x(x1)+circleRadius*Math.cos(theta),
            plotPoints.y1 = y(y1)+circleRadius*Math.sin(theta),
            plotPoints.x2 = x(x2)+circleRadius*Math.cos(theta+Math.PI),
            plotPoints.y2 = y(y2)+circleRadius*Math.sin(theta+Math.PI)
        }

        // draw line
        maing.append("line")
            .style("stroke",color)
            .attr("x1",plotPoints.x1)
            .attr("x2",plotPoints.x2)
            .attr("y1",plotPoints.y1)
            .attr("y2",plotPoints.y2)
            .attr("id",function(){return "rte-"+rteId+"-line-"+(i-1)+"-"+i;})
            .attr("class","arrow route-"+rteId)
            .attr("marker-end","url(#arrow)");
    }
}

var getRoute = function(routeNode) {
    var result = [];
    var nodes = routeNode.getElementsByTagName("node");
    for (var i=0; i<nodes.length; i++){
        result.push(+nodes[i].id);
    }
    return result;
}

function compareNumbers(a, b) {
  return a - b;
}


function getCSType(e) {

    customE = e.getElementsByTagName("custom");
    if (customE.length == 0){
        return null;
    } else {
        return customE[0].getElementsByTagName("cs_type")[0].textContent
    }
}

var loadNewInstanceFile = function(fileAsText) {
    // remove any existing map, and set flag to indicate no instance in memory
    d3.select("#div-where-instance-goes").html("");
    instanceRead = false;
    data = null;
    routes = [];

    // read instance
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(fileAsText,"text/xml");
    var nodes = xmlDoc.getElementsByTagName("node");
    data = [];
    for (var i=0; i<nodes.length; i++){
        data.push({
            id:+nodes[i].id,
            name:"node-"+nodes[i].id,
            type:nodes[i].attributes.type.nodeValue,
            x:+nodes[i].getElementsByTagName("cx")[0].textContent,
            y:+nodes[i].getElementsByTagName("cy")[0].textContent,
            cs_type:getCSType(nodes[i])
        });
    }

    // set the flag for whether an instance has been readAsText
    instanceRead = true;

    // enable the route plotting modal
    d3.selectAll(".enable-on-instance-upload")
        .attr("disabled",null);
    d3.select("#route-input")
        .attr("placeholder","Integers separated by commas or whitespace (e.g. \"0 1 2 3 0\")");
    d3.select("#sol-upload-btn-text")
        .text("");

    // set the banner above the SVG
    d3.select("#div-where-instance-goes")
        .append("h1")
            .text(instanceName);

    // make the viz
    makeViz(data);

    // define the arrowhead marker for later route plotting
    var defs = svg.append("defs")
    defs.append("marker")
        .attr("id","arrow")
        .attr("viewBox","0 -5 10 10")
        .attr("refX",5)
        .attr("refY",0)
        .attr("markerWidth",4)
        .attr("markerHeight",4)
        .attr("orient","auto")
        .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("class","arrowHead")
            .attr("stroke","black");
}

var loadNewSolutionFile = function (fileAsText) {

    removeExistingRoutes();

    // read solution
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(fileAsText,"text/xml");
    var solNode = xmlDoc.getElementsByTagName("solution");
    // store routes
    var routeNodes = null;
    if (solNode.length==0) {
        // may be that route nodes are not contained in a solution node
        // this is poor form, but we can handle it
        routeNodes = xmlDoc.getElementsByTagName("route");
    } else {
        // input was as expected
        routeNodes = solNode[0].getElementsByTagName("route");
    }
    // and for each route
    for (var i=0; i<routeNodes.length; i++) {
        var routeNode = routeNodes[i];
        // get the id and stops
        var route = {
            id:+routeNodes[i].id,
            sequence:getRoute(routeNode)
        };
        // add it to routes object
        routes.push(route);
    }
    // plot the routes
    plotRoutes(routes);
}

var loadSampleData = function() {
    var dataFile = "data/CMT01_dataset.xml",
        solFile = "data/CMT01_solution.xml";
    $('#sampleDataModal').modal('hide');
    instanceName = dataFile.substring(dataFile.indexOf("/")+1);

    d3.text(dataFile, function(error_data, dataAsText) {
        if (error_data) throw error_data;
        loadNewInstanceFile(dataAsText);
        d3.text(solFile, function(error_sol, solAsText) {
            if (error_sol) throw error_sol;
            loadNewSolutionFile(solAsText);
        });
    });
}

var toggleRouteShown = function(routeId) {

    d3.selectAll(".arrow.route-"+routeId)
        .classed("hidden", function (d, i) {
        return !d3.select(this).classed("hidden");
    });
}