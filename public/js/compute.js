// compute
//
// Collects input parameters, estimates eta values using MAP Bayes estimates, 
// estimates the next dose, and graphs the predicted concentration curve.
//
function compute() {
	
	// declare parameters
	var model = {
		tvk: 0.0408,			// typical value for elimination rate
		tvkf: 0.0268,			// typical value for elimination rate with concomitant fluconazole
		tvv: 233,				// typical value for volume
		ka: 3.43,				// absorption rate
		eagey: 0.775,			// exponent for age
		egfr: 0.85,				// exponent for creatinine
		dfluc: 0.657,			// exponent for fluconazole
		frac: 1,				// fraction absorbed
		invomgk: 3.817,			// inverse omega value corresponding to k
		invomgv: 3.040,			// inverse omega value corresponding to v
		sigma: 13.6,		 	// sigma value
		age: 0,					// patient age
		rout: ""				// route of administration
	}
	var eta = {
		k: 0,					// eta value for k
		v: 0					// eta value for v
	}
	var time_ahead = 120;		// how much time to graph ahead of next dose (hours)
	
	
	
	// PRIOR TACROLIMUS INFORMATION
	// ********************************************************************************
	
	// Previous doses
	var doses = get_doses();// manage_interface.js::get_doses()
	
	// Previous concentrations
	var conc = get_conc();// manage_interface.js::get_conc()
	
	console.log("PRIOR");
	console.log("doses: ", doses);
	console.log("conc: ", conc);
	console.log("");
	
	
	
	// COVARIATE INFORMATION
	// ********************************************************************************
	
	// Age
	model.age = parseFloat(document.getElementById("age").value);
	
	// Fluconazole Use Next Dose
	var fluc;
	if (document.querySelector("input[name='fluc_use']:checked") != null) {
		var fluc_use = document.querySelector("input[name='fluc_use']:checked").value;
	}
	if (fluc_use == "yes") {fluc = 1;}
	else if (fluc_use == "no") {fluc = 0;}
	
	// Previous Fluconazole
	var fluc_dt = get_fluc(); // manage_interface.js::get_fluc()

	// Serum Creatinine (will be ordered)
	var creat = get_creat(); // manage_interface.js::get_creat()
	
	console.log("COVARIATE");
	console.log("age: ", model.age);
	console.log("fluc: ", fluc);
	console.log("fluc_dt: ", fluc_dt);
	console.log("creat: ", creat);
	console.log("");
	
	
	
	// TARGET INFORMATION
	// ********************************************************************************
	
	// Route
	if (document.querySelector("input[name='route']:checked") != null) {
		model.route = document.querySelector("input[name='route']:checked").value;
	}
	
	// Target
	var target_high = parseFloat(document.getElementById("target_high").value);
	var target_low = parseFloat(document.getElementById("target_low").value);
	var target = (target_high + target_low) / 2;
	
	// Frequency
	var freq = parseFloat(document.getElementById("freq").value);
	
	// Time for Next Dose
	var dose_dt = new Date(document.getElementById("next_dose_date").value + " " + document.getElementById("next_dose_time").value);
	
	console.log("TARGET");
	console.log("route: ", model.route);
	console.log("target_high: ", target_high);
	console.log("target_low: ", target_low);
	console.log("target: ", target);
	console.log("freq: ", freq);
	console.log("dose_dt: ", dose_dt);
	console.log("");
	
	
	
	// PROCESS TIMELINE
	// ********************************************************************************
	var timeline = make_timeline(dose_dt, doses, conc, fluc_dt, creat); // manage_timeline.js::make_timeline()
	
	console.log("TIMELINE");
	console.log(timeline);
	console.log("");
	
	
	
	// PROCESS EVENTS
	// ********************************************************************************
	var de = get_de(timeline, model, eta); // manage_events.js::get_de()
	var ce = get_ce(timeline); // manage_events.js::get_ce()
	
	console.log("EVENTS");
	console.log("dose events: ", de);
	console.log("concentration events: ", ce);
	console.log("");
	
	
	
	// BAYESIAN UPDATE
	// ********************************************************************************
	if (ce.length > 0 && de.length > 0) {
		console.log("BAYESIAN UPDATE")
		eta = bayesian_update(de, ce, model, eta, .1, 10); // bayesian_update.js::bayesian_update()
		console.log(eta);
		console.log("");
	}
	
	
	
	// ESTIMATE NEXT DOSE
	// ********************************************************************************
	
	// Estimate dose
	var dose = estimate_dose(target, freq, creat, fluc, model, eta); // estimate_dose.js::estimate_dose
	
	// Update html
	if (dose) {
		document.getElementById("dose").textContent = parseFloat(dose / 1000).toFixed(3) + " mg";
	} else {
		document.getElementById("dose").textContent = "";
	}
	
	console.log("ESTIMATED DOSE");
	console.log(dose);
	console.log("");
	
	
	
	// EXTEND TIMELINE AND DOSING EVENTS
	// ********************************************************************************
	
	// Extend timeline to include new doses
	var timeline = extend_timeline(timeline, dose, time_ahead, freq, model.route); // manage_timeline.js::extend_timeline()
	
	// Extend dosing events
	var de = get_de(timeline, model, eta); // manage_events.js::get_de()
	
	console.log("EXTENDED DOSING EVENTS");
	console.log(de);
	console.log("");


	
	// GRAPH
	// ********************************************************************************
	if (dose) {
		make_graph(de, ce, time_ahead, target_low, target_high, model); // graph.js::make_graph()
	} else {
		d3.select("#graph").selectAll("svg").remove();
	}
}



