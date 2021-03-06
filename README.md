# Mapper
Mapper let's users visualize datasets (problem instances) and solutions (routes) that are formatted according to the Vehicle Routing Problem REPository (VRP-REP) specifications.

More about VRP-REP and the specification can be found on our [website](http://vrp-rep.org/).

In this readme:
 - [How to use Mapper if you don't have your own data](#dont-have-data)
 - [How to use Mapper if you do have your own data](#do-have-data)
 - [Toggling route display](#route-display)
 - [The VRP-REP solution format](#sol-format)

## To use
<a name="dont-have-data"></a>
### If you don't have your own data
If you don't already have VRP-REP compliant datasets or solutions, select "Sample data".

![Sample data][sampleData]

[sampleData]: ./assets/images/sampleData.gif "Sample data"

From here, select "Plot sample dataset and solution" to view the Christofides *et al.* (1979) CMT01 instance and its solution.

You can also choose to download the source files for sample data using the "Download" button.

<a name="do-have-data"></a>
### If you do have your own data
If you have your own VRP-REP compliant instances and solutions, then from the [Mapper landing page](https://vrp-rep.github.io/mapper/), first select "Upload instance" to browse to and select a VRP-REP compliant dataset.

![Upload instance][uploadInstance]

[uploadInstance]: ./assets/images/uploadInstance.PNG "Upload instance"

Once you have uploaded an instance, the upload solution functionality becomes available.
Select "Upload solution."

![Upload solution][uploadSolution]

[uploadSolution]: ./assets/images/uploadSolution.PNG "Upload solution"

From the modal that appears, you have two options to input a solution (a route or set of routes):
 1. You may select "Browse" to select a VRP-REP compliant solution, or
 2. You may simply input a sequence of integers into the text field. This sequence of integers should be separated either by commas or whitespace. After you input a sequence, hit the "Plot" button.

Note that whenever a new solution is uploaded or a new route is entered, the existing routes will be cleared.

<a name="route-display"></a>
## Toggling route display
If you have uploaded a solution file that contains more than one route, you can toggle the display of the routes by clicking on the routes' legend entries.

![Toggle route display][routeToggle]

[routeToggle]: ./assets/images/routeToggle.gif "Toggle route display"

<a name="sol-format"></a>
## The VRP-REP Solution Format
The XML schema defining the VRP-REP solution format is [available here](http://vrp-rep.org/resources/download/6).

A description of the format:
 - The root element must be a `<solution>` element, and it must contain a string attribute identifying the `instance` (`method` is optional).

 - Within `<solution>` must be at least one `<route>` element with a mandatory and unique `id` attribute (integer). `<route>` elements may also contain any other attributes you want to add. For example, if your file reports the solution to a VRP with a limited fleet, you can add an attribute `vehicle_id='X'` to the `<route>` element, indicating that the route is serviced by vehicle 'X'.

 - Within `<route>` must be at least 2 `<node>`s, each with a mandatory `id` attribute (integer). `<node>`elements may contain any child elements you wish to add. For example, if your file reports the solution to a VRP with split delivery, you can add to the `<node>` element a `<quantity>X</quantity>` child, indicating that the route services X units of the node's demand.
 
A sample solution file:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<solution instance="CMT01">
	<route id="1">
		<node id="51"/>
		<node id="46"/>
		<node id="5"/>
		<node id="49"/>
		<node id="10"/>
		<node id="39"/>
		<node id="33"/>
		<node id="45"/>
		<node id="15"/>
		<node id="44"/>
		<node id="37"/>
		<node id="12"/>
		<node id="51"/>
	</route>
	<route id="2">
		<node id="51"/>
		<node id="11"/>
        <!-- other stops in route 2 -->
    </route>
    <!-- routes 3, 4, and 5 -->
</solution>
```
