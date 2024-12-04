// make_graph
//
// Graphs the predicted and observed concentrations.
//
// Parameters:
//   de: Dosing events
//     time: time of dosing event (in hours before time of next dose)
//     dose: dose amount in ug (NaN if only k or v are changing)
//     route: either "iv" or "oral"
//	   creat: creatinine clearance value
//     fluc: concomitant fluconazole (1: true, 0: false)
//     k: elimination rate constant
//     v: volume of distribution
//   ce: Observed concentration events
//     time: time of concentration event (in hours before time of next dose)
//     conc: observed concentration in ug/L
//   time_ahead: maximum amount of time ahead to graph (hours)
//   target_low: lowest acceptable trough concentration (ug/L)
//   target_high: highest acceptable trough concentration (ug/L)
//   model: Pharmacokinetic model parameters
//     ka: absorption rate constant
//     frac: fraction absorbed from oral dose
//
function make_graph(de, ce, time_ahead, target_low, target_high, model) {
	var margin = {top: 20, right: 20, bottom: 40, left: 40};
	var width = 500 - margin.left - margin.right;
	var height = 320 - margin.top - margin.bottom;
	var graph_points = 500;		// number of points to graph
	var time_behind = de[0].time;
	var time_interval = (time_ahead - time_behind) / graph_points;
	var graph_ce = [];
	var concentrations = new Array(graph_points);
	var conc_times = new Array(graph_points);
	
	time_behind = de[0].time;
	
	time_interval = (time_ahead - time_behind) / graph_points;
	
	for (var i = 0; i < graph_points; i++) {
		conc_times[i] = time_behind + i * time_interval;
		graph_ce.push({time: conc_times[i]});
	}
	
	concentrations = predict_conc(graph_ce, de, model);
	
	
	// Build Graph
	var scale_time = d3.scaleLinear()
		.range([0, width])
		.domain([time_behind / 24, time_ahead / 24]);
	var scale_conc = d3.scaleLinear()
		.range([height, 0])
		.domain([0, d3.max(concentrations) + d3.max(concentrations) * .1]);
		
	var line = d3.line()
		.x(function(d, i) {return scale_time((time_behind + i * time_interval) / 24);})
		.y(function(d) {return scale_conc(d);})
		
	d3.select("#graph").selectAll("svg").remove();
	
	// Create the svg for the graph
	var svg = d3.select("#graph").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	// Add line for target_high
	svg.append("line")
		.attr("x1", 0)
		.attr("x2", width)
		.attr("y1", scale_conc(target_high))
		.attr("y2", scale_conc(target_high))
		.style("stroke", "darkgray");
	
	// Add line for target_low
	svg.append("line")
		.attr("x1", 0)
		.attr("x2", width)
		.attr("y1", scale_conc(target_low))
		.attr("y2", scale_conc(target_low))
		.style("stroke", "darkgray");
	
	// Add concentration curve
	svg.append("path")
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("d", line(concentrations));
	
	// Add points for manually entered concentrations
	svg.selectAll("circle")
		.data(ce)
		.enter()
		.append("circle")
		.attr("cx", function(d) {
			return scale_time(d.time / 24);
		})
		.attr("cy", function(d) {
			return scale_conc(d.conc);
		})
		.attr("r", 2)
		.attr("fill", "brown");
	
	// Add axis scales
	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(scale_time));
	
	svg.append("text")
		.attr("transform", "translate(" + (width/2) + " ," + (height + margin.top + .3 * margin.bottom) + ")")
		.style("text-anchor", "middle")
		.text("Time in Days (0 = Time of Next Dose)")
		.style("fill", "#4d4d4d")
		.style("font-size", "10pt")

	svg.append("g")
		.call(d3.axisLeft(scale_conc));
		
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 0 - 1.1 * margin.left)
		.attr("x",0 - (height / 2))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Concentration (ug/L)")
		.style("fill", "#4d4d4d")
		.style("font-size", "10pt")
}


