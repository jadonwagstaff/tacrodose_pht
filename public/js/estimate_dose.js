// estimate_dose
//
// Estimate next dose.
//
// Parameters:
//   target: target concentration in ug/L
//   freq: frequency of doses in hours
//   creat: Creatinine clearance values
//     dt: datetime of cratinine lab
//     value: creatinine clearance (mod Schwartz)
//   fluc: 1 if calculate with fluconazole use, 0 without
//   model: Pharmacokinetic model parameters
//     tvk: typical value for elimination rate
//     tvkf: typical value for elimination rate with concomitant fluconazole
//     tvv: typical value for volume
//     ka: absorption rate
//     eagey: exponent for age
//     egfr: exponent for creatinine
//     dfluc: exponent for fluconazole
//     frac: fraction absorbed
//     age: patient age
//   eta: Eta values used to adjust k and v
//     k: eta value for k
//     v: eta value for v
//
// Returns: 
//   Estimate of next dose
//
function estimate_dose(target, freq, creat, fluc, model, eta) {
	
	// Estimate elimination rate constant
	if (creat[0]) {
		var k = get_k(model, eta, {creat: creat[creat.length - 1].value, fluc: fluc});
	} else {
		var k = get_k(model, eta, {creat: NaN, fluc: fluc});
	}
	
	// Estimate volume of distribution
	if (model.age) {
		var v = get_v(model, eta);
	} else {
		return(NaN);
	}
	
	// Estimate dose
	if (model.route == "iv") {
		var dose = (target * v * (1 - Math.exp(-k * freq))) / Math.exp(-k * freq);
	} else if (model.route == "oral") {
		var dose = ((target * v * (model.ka - k)) / (model.frac * model.ka)) * (((1 - Math.exp(-k * freq)) * (1 - Math.exp(-model.ka * freq))) / (Math.exp(-k * freq) - Math.exp(-model.ka * freq)))
	}
	
	return(dose);
}



// get_v
//
// Get volume of distribution.
//
// Parameters:
//   model: Pharmacokinetic model parameters
//     tvv: typical value for volume
//     eagey: exponent for age
//     age: patient age
//   eta: Eta values used to adjust v
//     v: eta value for v
//
// Returns: 
//   Volume of distribution
//
function get_v(model, eta) {
	return(model.tvv * (model.age / 5.7)**model.eagey * Math.exp(eta.v));
}



// get_k
//
// Get elimination rate constant.
//
// Parameters:
//   model: Pharmacokinetic model parameters
//     tvk: typical value for elimination rate
//     tvkf: typical value for elimination rate with concomitant fluconazole
//     egfr: exponent for creatinine
//     dfluc: exponent for fluconazole
//   eta: Eta values used to adjust k
//     k: eta value for k
//   cov: covariate value information
//     fluc: 1 if using fluconazole, 0 otherwise
//     creat: NaN if unknown, creatinine clearance otherwise
//
// Returns: 
//   Estimate of next dose
//
function get_k(model, eta, cov) {
    if (!isNaN(cov.creat)) {
        return(model.tvk * (cov.creat / 122.43)**model.egfr * model.dfluc**cov.fluc * Math.exp(eta.k));
    } else {
        if (cov.fluc == 0) {
            return(model.tvk * Math.exp(eta.k));
        } else {
            return(model.tvkf * Math.exp(eta.k));
        }
    }
}


