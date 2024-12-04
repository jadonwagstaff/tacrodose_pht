// predict_conc
//
// Predicts concentrations based on dosing and model parameters.
//
// Parameters:
//   ce: Concentration events
//     time: time of concentration event (in hours before time of next dose)
//   de: Dosing events
//     time: time of dosing event (in hours before time of next dose)
//     dose: dose amount in ug (NaN if only k or v are changing)
//     route: either "iv" or "oral"
//     k: elimination rate constant
//     v: volume of distribution
//   model: Pharmacokinetic model parameters
//     ka: absorption rate constant
//     frac: fraction absorbed from oral dose
//
// Returns: 
//   Array of predicted concentrations indexed the same as ce
//
function predict_conc(ce, de, model) {
	// Initialize variables
    var final_conc = new Array(ce.length);
	var ce_index = 0;
	var dose_oral = 0;
	var c0_iv = 0;
	var k = de[0].k;
	var v = de[0].v;
	var time = de[0].time;
	var dose_limit = 0.00001;
	var oral = false;
	
	// Set concentrations before first dose
	while (ce_index < ce.length && ce[ce_index].time < de[0].time) {
		final_conc[ce_index] = c0_iv;
		ce_index++;
	}
	
	// Find remaining concentrations
	for (var i = 0; i < de.length && de[i].time <= ce[ce.length - 1].time; i++) {
		// find concentration of drug just prior to this dose or change in parameters
		c0_iv = c0_iv * Math.exp(-1 * k * (de[i].time - time));
		if (oral) {
			c0_iv += ((dose_oral * model.ka) / (v * (model.ka - k))) * (Math.exp(-1 * k * (de[i].time - time)) - Math.exp(-1 * model.ka * (de[i].time - time)));
			// find remaining drug to be absorbed and make this the new oral dose
			dose_oral = dose_oral * Math.exp(-1 * model.ka * (de[i].time - time));
		}
		
		// change starting time, v, and k to this dose or change in parameters
		time = de[i].time;
		k = de[i].k;
		v = de[i].v;
		// if there is a dose, add it to the remaining oral dose
		if (!isNaN(de[i].dose)) {
			if (de[i].route == "iv") {
				c0_iv += de[i].dose / de[i].v;
			} else if (de[i].route == "oral") {
				dose_oral += de[i].dose * model.frac;
				oral = true;
			}
		}
		// find all concentrations after this dose or change in parameters and the next
		while (ce_index < ce.length && (i == de.length - 1 || ce[ce_index].time < de[i + 1].time)) {
			final_conc[ce_index] = c0_iv * Math.exp(-1 * k * (ce[ce_index].time - time));
			if (oral) {
				final_conc[ce_index] += ((dose_oral * model.ka) / (v * (model.ka - k))) * (Math.exp(-1 * k * (ce[ce_index].time - time)) - Math.exp(-1 * model.ka * (ce[ce_index].time - time)));
			}
			ce_index++;
		}
	}
    return(final_conc);
}


