// make_timeline
//
// Adjusts eta values based on coordinate descent minimization of 
// objective function value. (MAP Bayes)
//
// Parameters:
//   timeline: Ordered set of events
//     time: time of event, 
//     dose: NaN if no dose, dose value otherwise
//     route: NaN if no dose, "iv" or "oral" otherwise
//     fluc: NaN if fluconazole has not started or stopped, 1 if started, 0 if stopped
//     creat: NaN if no creatinine clearance value changes, creatinine value otherwise
//   model: Pharmacokinetic model parameters
//     tvk: typical value for elimination rate
//     tvkf: typical value for elimination rate with concomitant fluconazole
//     tvv: typical value for volume
//     ka: absorption rate
//     eagey: exponent for age
//     egfr: exponent for creatinine
//     dfluc: exponent for fluconazole
//     age: patient age
//   eta: Initial eta values used to adjust k and v
//     k: initial eta value for k
//     v: initial eta value for v
//
// Returns: 
//   de: Dosing events
//     time: time of dosing event (in hours before time of next dose)
//     dose: dose amount in ug (NaN if only k or v are changing)
//     route: either "iv" or "oral"
//	   creat: creatinine clearance value
//     fluc: concomitant fluconazole (1: true, 0: false)
//     k: elimination rate constant
//     v: volume of distribution
//
function get_de(timeline, model, eta) {
	var de = [];
	
	var current = {fluc: 0, creat: NaN, first_dose: false, route: NaN}
	for (var i = 0; i < timeline.length; i++) {
		if (!isNaN(timeline[i].creat)) {current.creat = timeline[i].creat;}
		if (!isNaN(timeline[i].fluc)) {current.fluc = timeline[i].fluc;}
		if (!isNaN(timeline[i].dose)) {current.first_dose = true;}
		// For each dose, save the current fluc and creat and calculate k and v
		if (current.first_dose && (!isNaN(timeline[i].creat) || !isNaN(timeline[i].fluc) || !isNaN(timeline[i].dose))) {
			de.push({time: timeline[i].time, 
					 dose: timeline[i].dose, 
					 route: timeline[i].route,
					 fluc: current.fluc, 
					 creat: current.creat,
					 k: get_k(model, eta, current), // estimate_dose.js::get_k()
					 v: get_v(model, eta)}); // estimate_dose.js::get_v()
		}
	}
	
	return(de)
}


// get_ce
//
// Adjusts eta values based on coordinate descent minimization of 
// objective function value. (MAP Bayes)
//
// Parameters:
//   timeline: Ordered set of events
//     time: time of event, 
//     conc: NaN if no concentration, concentration value otherwise
//
// Returns: 
//   ce: Concentration events
//     time: time of concentration event (in hours before time of next dose)
//     conc: observed concentration in ug/L
//
function get_ce(timeline) {
	var ce = [];

	for (var i = 0; i < timeline.length; i++) {
		if (!isNaN(timeline[i].conc)) {
			ce.push({time: timeline[i].time,
					 conc: timeline[i].conc});
		}
	}
	
	return(ce);
}



// update_de
//
// Updates dosing events based on potential changes in eta.
//
// Parameters:
//   de: Dosing events
//	   creat: creatinine clearance value
//     fluc: concomitant fluconazole (1: true, 0: false)
//     k: elimination rate constant
//     v: volume of distribution
//   model: Pharmacokinetic model parameters
//     tvk: typical value for elimination rate
//     tvkf: typical value for elimination rate with concomitant fluconazole
//     tvv: typical value for volume
//     ka: absorption rate
//     eagey: exponent for age
//     egfr: exponent for creatinine
//     dfluc: exponent for fluconazole
//     age: patient age
//   eta: Initial eta values used to adjust k and v
//     k: initial eta value for k
//     v: initial eta value for v
//
// Updated Parameters:
//   de: Updated dosing events
//     k: updated elimination rate constant
//     v: updated volume of distribution
//
function update_de(de, model, eta) {
	for (var i = 0; i < de.length; i++) {
		de[i].k = get_k(model, eta, de[i]); // estimate_dose.js::get_k()
		de[i].v = get_v(model, eta); // estimate_dose.js::get_v()
	}
}


