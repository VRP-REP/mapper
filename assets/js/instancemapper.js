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

            // remove any existing map, and set flag to indicate no instance in memory
            d3.select("#div-where-instance-goes").html("");
            instanceRead = false;
            data = null;
            routes = [];

            // read instance
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(filereader.result,"text/xml");
            var nodes = xmlDoc.getElementsByTagName("node");
            data = [];
            for (var i=0; i<nodes.length; i++){
                data.push({
                    id:+nodes[i].id,
                    name:"node-"+nodes[i].id,
                    type:nodes[i].attributes.type.nodeValue,
                    x:+nodes[i].getElementsByTagName("cx")[0].textContent,
                    y:+nodes[i].getElementsByTagName("cy")[0].textContent
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
        filereader.readAsText(this.files[0]);
        instanceName = this.files[0].name;
    } else { console.log("Error with file upload. Please try again."); }
});

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
    var color = d3.scaleOrdinal(d3.schemeCategory10).domain(data.map(function(e){return e.type;}));

    // nodes to plot
    var enteringE = maing.selectAll(".node")
    .data(data)
    .enter().append("g")
        .attr("transform", function(d){return "translate("+x(d.x)+","+y(d.y)+")"});
    
    // plot the circles
    var circles = enteringE.append("circle")
        .attr("r",circleRadius)
        .attr("id",function(d){return "circle-"+d.id;})
        .attr("fill",function(d){return color(d.type)})
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

            removeExistingRoutes();

            // read solution
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(filereader.result,"text/xml");
            var solNode = xmlDoc.getElementsByTagName("solution")[0];
            // store routes
            var routeNodes = solNode.getElementsByTagName("route");
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

        plotRoute(routes[0].sequence,"black");

    } else { // otherwise, we'll be plotting multiple, so we need diff colors and a legend

        // define scale for route colors
        var color = d3.scaleOrdinal(d3.schemeDark2).domain(routes.map(function(e){return e.id;}));

        // plot them
        routes.forEach(function(e) {plotRoute(e.sequence,color(e.id));});

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
            .labels(color.domain());

        maing.select(".legendRoutes")
            .call(legendRoutes);
    }
}

var plotRoute = function(route,color) {
    // draw arrows between consecutive nodes on route
    for (var i=1; i<route.length;i++){
        // nodes' IDs
        var srcID = route[i-1],
            destID = route[i];
        // nodes' data entries
        var srcNode = data.filter(function(d){return d.id == srcID;})[0],
            destNode = data.filter(function(d){return d.id == destID;})[0];
        // TODO make flag for overlapping circles
        // -- currently if circles overlap, it looks like arrow is backwards
        var circlesOverlap = false;
        if (circlesOverlap) {var x1=destNode.x,y1=destNode.y,x2=srcNode.x,y2=srcNode.y;}
        else                {var x1=srcNode.x,y1=srcNode.y,x2=destNode.x,y2=destNode.y;}

        // angle between the nodes
        var theta = Math.atan2((y(y2)-y(y1)),(x(x2)-x(x1)));

        // draw line
        maing.append("line")
            .style("stroke",color)
            .attr("x1",x(x1)+circleRadius*Math.cos(theta))
            .attr("x2",x(x2)+circleRadius*Math.cos(theta+Math.PI))
            .attr("y1",y(y1)+circleRadius*Math.sin(theta))
            .attr("y2",y(y2)+circleRadius*Math.sin(theta+Math.PI))
            .attr("id",function(){return "line-"+(i-1)+"-"+i;})
            .attr("class","arrow")
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