# Mapper
Mapper let's users visualize datasets (problem instances) and solutions (routes) that are formatted according to the Vehicle Routing Problem REPository (VRP-REP) specification.

More about VRP-REP and the specification can be found on their [website](http://vrp-rep.org/).

## To use
From the [Mapper landing page](https://vrp-rep.github.io/mapper/), select "Upload instance" to browse to and select a VRP-REP compliant dataset.

![Upload instance][uploadInstance]

[uploadInstance]: ./assets/images/uploadInstance.PNG "Upload instance"

Once you have uploaded an instance, the upload solution functionality becomes available.
Select "Upload solution."

![Upload solution][uploadSolution]

[uploadSolution]: ./assets/images/uploadSolution.PNG "Upload solution"

From the modal that appears, you have two options to input a solution (a route or set of routes):
 1. You may select "Browse" to select a VRP-REP compliant dataset, or
 2. You may simply input a sequence of integers into the text field. This sequence of integers should be separated either by commas or whitespace. After you input a sequence, hit the "Plot" button.

Note that whenever a new solution is uploaded or a new route is entered, the existing routes will be cleared.
