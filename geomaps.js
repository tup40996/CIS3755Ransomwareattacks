

 d3.json("./states-10m.json").then((data) => {

    console.log("Original Data:", data);

    // extract states from topojson
    const topo = topojson.feature(data, data.objects.states);

    console.log("Converted Topo Data:", topo);

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
            .attr("fill", "whitesmoke")
            .attr("stroke", "black")
            .attr("stroke-width", "1px");
});
