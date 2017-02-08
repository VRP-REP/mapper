var data;
var instanceRead = false;
var instanceName = "";
var route = [];
var circleRadius;
var x;
var y;
var svg;
var maing;


// User-uploaded instance
d3.select("#instance-upload").on("change", function () {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var filereader = new window.FileReader();
        filereader.onload = function () {

            // remove any existing map, and set flag to indicate no instance in memory
            d3.select("#div-where-instance-goes").html("");
            instanceRead = false;
            data = null;
            route = [];

            // see if passed data is in VRP-REP (xml-type) format
            var isXML = filereader.result.startsWith("<?xml")?true:false;

            // read instance
            if (isXML) {
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(filereader.result,"text/xml");
                var nodes = xmlDoc.getElementsByTagName("node");
                data = [];
                for (var i=0; i<nodes.length; i++){
                    data.push({
                        cstype:0, // placeholder. Indicates fast-charging CS. I assume most (all?) VRP-REP instances don't contain this info
                        id:+nodes[i].id,
                        name:"node-"+nodes[i].id,
                        type:nodes[i].attributes.type.nodeValue,
                        x:+nodes[i].getElementsByTagName("cx")[0].textContent,
                        y:+nodes[i].getElementsByTagName("cy")[0].textContent
                    });
                }
            } else {
                var instancetext = d3.dsvFormat(" ").parseRows(filereader.result);

                // parse and store node data
                data = instancetext.filter(function (e, i, arr) { return e.length === 6 })
                    .map(function (e) {
                        return {
                            id: +e[0],
                            name: e[1],
                            x: +e[2],
                            y: +e[3],
                            type: e[4],
                            cstype: +e[5]
                        }
                    });
            }

            // set the flag for whether an instance has been readAsText
            instanceRead = true;

            // enable the route plotting modal
            d3.select("#route-input")
                .attr("disabled",null)
                .attr("placeholder","0 1 2 3 0");
            d3.select("#plot-route-btn")
                .attr("disabled",null);

            // set the banner above the SVG
            d3.select("#div-where-instance-goes")
                .append("h1")
                    .text(instanceName);

            // make the viz
            makeViz(data);

        }
        filereader.readAsText(this.files[0]);
        instanceName = this.files[0].name;
    } else { console.log("Error with file upload. Please try again."); }
});

var makeViz = function (data) {
    
    // viz sizes
    var margin =  {top: 100, right: 50, bottom: 20, left: 100};
    var width = 764 - margin.left - margin.right;
    var height =  500 - margin.top - margin.bottom;

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

var plotRoute = function(routeString) {
    // remove any previous route
    route = [];
    d3.selectAll(".arrow").remove();

    // in case the string was a pasted EVRO route, remove charging decisions
    routeString = routeString.replace(/\s+\([^)]*\),?[\s+]?/gm,"\t");
    // strip away leading and trailing whitespace (or brackets)
    routeString = routeString.replace(/^\[?(\s+)?|(\s+)?\]?$/gm,'');
    // break into array of ints on whitespace and/or commas
    route = routeString.split(/[,\s]/gm).map(Number);

    // define the arrow marker
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

    // draw arrows between consecutive nodes on route
    for (var i=1; i<route.length;i++){
        // nodes' IDs
        var srcID = route[i-1],
            destID = route[i];
        // nodes' data entries
        var srcNode = data.filter(function(d){return d.id == srcID;})[0],
            destNode = data.filter(function(d){return d.id == destID;})[0];
        var x1 = srcNode.x,
            y1 = srcNode.y,
            x2 = destNode.x,
            y2 = destNode.y;

        // angle between the nodes
        var theta = Math.atan2((y(y2)-y(y1)),(x(x2)-x(x1)));

        // draw line
        maing.append("line")
            .style("stroke","black")
            .attr("x1",x(x1)+circleRadius*Math.cos(theta))
            .attr("x2",x(x2)+circleRadius*Math.cos(theta+Math.PI))
            .attr("y1",y(y1)+circleRadius*Math.sin(theta))
            .attr("y2",y(y2)+circleRadius*Math.sin(theta+Math.PI))
            .attr("id",function(){return "line-"+(i-1)+"-"+i;})
            .attr("class","arrow")
            .attr("marker-end","url(#arrow)");
    }

}