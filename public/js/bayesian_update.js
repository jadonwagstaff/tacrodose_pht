// bayesian_update
//
// Adjusts eta values based on coordinate descent minimization of 
// objective function value. (MAP Bayes)
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
//   ce: Concentration events
//     time: time of concentration event (in hours before time of next dose)
//     conc: observed concentration in ug/L
//   model: Pharmacokinetic model parameters
//     tvk: typical value for elimination rate
//     tvkf: typical value for elimination rate with concomitant fluconazole
//     tvv: typical value for volume
//     ka: absorption rate
//     eagey: exponent for age
//     egfr: exponent for creatinine
//     dfluc: exponent for fluconazole
//     frac: fraction absorbed
//     invomgk: inverse omega value corresponding to k
//     invomgv: inverse omega value corresponding to v
//     sigma: sigma value
//     age: patient age
//   eta: Initial eta values used to adjust k and v
//     k: initial eta value for k
//     v: initial eta value for v
//   step_size: Initial step size used by coord_search and/or line_search
//   max_iteration: Maximum number of step size decreases
//
// Returns: 
//   eta: optimal eta values based on minimized objective function value
//     k: optimized eta value for k
//     v: optimized eta value for v
//
// Adjusted Parameters:
//   de: Adjusted dosing events
//     k: elimination rate constant adjusted based on optimized eta value
//     v: volume of distribution adjusted based on optimized eta value
//
function bayesian_update(de, ce, model, eta, step_size, max_iteration) {
	// Initialize magnitude of direction choices
	var coords = [
		[0, 1], 	
		[.7, .7], 	
		[1, 0], 	
		[.7, -.7], 	
		[0, -1],	
		[-.7, -.7], 
		[-1, 0],	
		[-.7, .7]	
	];
	
	// Minimize objective using coordinate descent
	return(coord_search(de, ce, model, eta, step_size, max_iteration, 1, coords));
}



// coord_search
//
// In (eta.k, eta.v) coordinates, steps in derection which minimizes objective.
// If at best value, cuts step size in half and recurses. If at 
// iteration == max_iteration, returns optimized eta values.
//
// Parameters: 
//   ALL FROM bayesian_update
//   iteration: current step size iteration (adds 1 for each reduction in step size)
//
// Returns: 
//   ALL FROM bayesian_update
//
// Adjusted Parameters: 
//   ALL FROM bayesian_update
//
function coord_search(de, ce, model, eta, step_size, max_iteration, iteration, coords) {
	// Find initial objective value
	var obj = objective(predict_conc(ce, de, model), ce, model, eta); // predict_conc.js::predict_conc
	var best_obj = obj;
	var best_index = -1;
	
	// Find the direction which minimizes the objective value
	for (var i = 0; i < coords.length; i++) {
		var next_eta = {k: eta.k + coords[i][0] * step_size, v: eta.v + coords[i][1] * step_size};
		update_de(de, model, next_eta); // manage_events.js::update_de()
		obj = objective(predict_conc(ce, de, model), ce, model, next_eta); // predict_conc.js::predict_conc()
		if (obj < best_obj) {
			best_obj = obj;
			best_index = i;
		}
	}
	
	// Choose what to do next
	if (best_index == -1) {
		// If the current position has the lowest objective, reduce the step size or return eta
		update_de(de, model, eta);// manage_events.js::update_de()
		if (iteration == max_iteration) {
			// If there are no more step reductions allowed, return eta
			return(eta);
		} else {
			// Otherwise, reduce the step size
			return(coord_search(de, ce, model, eta, step_size / 2, max_iteration, iteration + 1, coords));
		}
	} else {
		// Choose the step with the smallest objective value and keep going along that line
		eta.k += coords[best_index][0] * step_size;
		eta.v += coords[best_index][1] * step_size;
		update_de(de, model, eta); // manage_events.js::update_de()
		return(line_search(de, ce, model, eta, step_size, max_iteration, iteration, coords, coords[best_index]));
	}
}


// line_search
//
// In (eta.k, eta.v) coordinates, steps in derection which minimizes objective.
// If at best value, calls coord_search.
//
// Parameters: 
//   ALL FROM coord_search
//   direction: direction in (eta.k, eta.v) plane to step in
//
// Returns: 
//   ALL FROM coord_search
//
// Adjusted Parameters: 
//   ALL FROM coord_search
//
function line_search(de, ce, model, eta, step_size, max_iteration, iteration, coords, direction) {
	
	// Find current objective value and objective value in one step in direction 'direction'
	var obj = objective(predict_conc(ce, de, model), ce, model, eta);// predict_conc.js::predict_conc()
	var next_eta = {k: eta.k + direction[0] * step_size, v: eta.v + direction[1] * step_size};
	update_de(de, model, next_eta); // manage_events.js::update_de()
	var next_obj = objective(predict_conc(ce, de, model), ce, model, next_eta); // predict_conc.js::predict_conc()
	
	// Choose what to do next
	if (next_obj < obj) {
		// If the next objective is better, keep going in the same direction
		eta = next_eta;
		return(line_search(de, ce, model, eta, step_size, max_iteration, iteration, coords, direction));
	} else {
		// If the next objective is worse, find a different direction
		update_de(de, model, eta); // manage_events.js::update_de()
		return(coord_search(de, ce, model, eta, step_size, max_iteration, iteration, coords));
	}
}


// objective
//
// Returns an objective value based on the difference between predicted and 
// observed concentrations and eta values.
//
// Parameters:
//   pred: Array of predicted concentrations at same times as ce
//   ce: Concentration events
//     conc: observed concentration in ug/L
//   model: Pharmacokinetic model parameters
//     invomgk: inverse omega value corresponding to k
//     invomgv: inverse omega value corresponding to v
//     sigma: sigma value
//   eta: eta values used to adjust k and v
//     k: eta value for k
//     v: eta value for v
//
// Returns: 
//   Numeric objective value
//
function objective(pred, ce, model, eta) {
	var obj_value = 0;
	
	// Extended least squares portion
	for (var i = 0; i < pred.length; i++) {
		obj_value += Math.log(model.sigma) + ((ce[i].conc - pred[i]) * (ce[i].conc - pred[i])) / model.sigma;
	}
	// Bayesian portion
	obj_value += eta.k * eta.k * model.invomgk + eta.v * eta.v * model.invomgv;
	
	return(obj_value);
}


