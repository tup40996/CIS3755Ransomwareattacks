
Promise.all([
   d3.json("./states-10m.json"),
   d3.csv("./cities.csv"),
   d3.csv("./states.csv")
]).then(([topology, cities, states]) => {

    // convert topojson
    const topo = topojson.feature(topology, topology.objects.states);

    // dictionary for populations
    const stateDictionary = new Map();
    states.forEach((state) => {
        stateDictionary.set(state.State, +state.Population);
    });

    console.log("State Dictionary:", stateDictionary);

    var blues = d3.scaleSequential()
                   .domain(d3.extent(stateDictionary.values()))
                   .range(["white", "steelblue"]);

   var projection = d3.geoAlbersUsa()
        .scale(700)
        .translate([487.5, 305]);

       // path generator
    var path = d3.geoPath(projection);

    // select svg and add group
    const svg = d3.select("#geomap")
        .append("g")
        .attr("transform", "translate(50,50)");

    // draw states
    svg.append("g")
        .selectAll("path")
        .data(topo.features)
        .join("path")
            .attr("d", path)
            .attr("fill", (d) => {
                const population = stateDictionary.get(d.properties.name);
                return blues(population);
            })
            .attr("stroke", "black")
            .attr("stroke-width", "1px");

    svg.append("g")
        .selectAll("circle")
        .data(cities)
        .join("circle")
        .attr("cx", (d) => {
            const coords = projection([+d.longitude, +d.latitude]);
            return coords ? coords[0] : null;
        })
        .attr("cy", (d) => {
            const coords = projection([+d.longitude, +d.latitude]);
            return coords ? coords[1] : null;
        })
        .attr("r", 4)
        .attr("fill", "red"); 
});

            


