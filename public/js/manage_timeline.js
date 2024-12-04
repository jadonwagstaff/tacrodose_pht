// make_timeline
//
// Adjusts eta values based on coordinate descent minimization of 
// objective function value. (MAP Bayes)
//
// Parameters:
//   dose_dt: Datetime of upcoming dose (time 0)
//   doses: Dosing times and values
//     dt: datetime of dosing
//     dose: dose amount in mg
//     route: either "iv" or "oral"
//   conc: Concentration times and values
//     dt: datetime of concentration
//     value: observed concentration in ug/L
//   fluc_dt: Starting and stopping times of concomitant fluconazole
//     dt1: datetime of start of fluconazole use
//     dt2: datetime of end of fluconazole use
//   creat: Creatinine clearance values
//     dt: datetime of cratinine lab
//     value: creatinine clearance (mod Schwartz)
//
// Returns: 
//   timeline: Ordered set of events
//     time: time of event, 
//     dose: NaN if no dose, dose value otherwise
//     route: NaN if no dose, "iv" or "oral" otherwise
//     conc: NaN if no concentration, concentration value otherwise
//     fluc: NaN if fluconazole has not started or stopped, 1 if started, 0 if stopped
//     creat: NaN if no creatinine clearance value changes, creatinine value otherwise
//
function make_timeline(dose_dt, doses, conc, fluc_dt, creat) {
	var timeline = [];
	
	// doses
	for (var i = 0; i < doses.length; i++) {
		var time = (doses[i].dt.getTime() - dose_dt.getTime()) / 3600000;
		insert_timeline_item(timeline, time, "dose", doses[i].value * 1000);
		insert_timeline_item(timeline, time, "route", doses[i].route); 
	}
	for (var i = 0; i < conc.length; i++) {
		var time = (conc[i].dt.getTime() - dose_dt.getTime()) / 3600000;
		insert_timeline_item(timeline, time, "conc", conc[i].value);
	}
	// fluconazole
	for (var i = 0; i < fluc_dt.length; i++) {
		var time1 = (fluc_dt[i].dt1.getTime() - dose_dt.getTime()) / 3600000;
		var time2 = (fluc_dt[i].dt2.getTime() - dose_dt.getTime()) / 3600000;
		insert_timeline_item(timeline, time1, "fluc", 1);
		insert_timeline_item(timeline, time2, "fluc", 0);
	}
	// creatinine (inserts changes based on when time changes to nearest creatinine value)
	if (creat.length > 0) {
		var time = (creat[0].dt.getTime() - dose_dt.getTime()) / 3600000;
		if (time < timeline[0].time) {
			insert_timeline_item(timeline, time, "creat", creat[0].value);
		} else {
			insert_timeline_item(timeline, timeline[0].time, "creat", creat[0].value);
		}
		console.log(timeline[0])
		if (creat.length > 1) {
			for (var i = 1; i < creat.length; i++) {
				var t1 = (creat[i-1].dt.getTime() - dose_dt.getTime()) / 3600000;
				var t2 = (creat[i].dt.getTime() - dose_dt.getTime()) / 3600000;
				var time = (t1 + t2) / 2;
				insert_timeline_item(timeline, time, "creat", creat[i].value);
			}
		}
	}
	
	return(timeline);
}



// extend_timeline
//
// Extends timeline to include future doses.
//
// Parameters:
//   dose: Estimated next dose
//   time_ahead: Furthest time ahead to plot
//   freq: Frequency of dosing (in hours)
//   route: Route of future doses "iv" or "oral"
//   dose_dt: datetime of upcoming dose (time 0)
//
// Returns: 
//   ALL FROM make_timeline
//
function extend_timeline(timeline, dose, time_ahead, freq, route) {
	for (var i = 0; i < time_ahead / freq; i++) {
		insert_timeline_item(timeline, i * freq, "dose", dose);
		insert_timeline_item(timeline, i * freq, "route", route);
	}
	
	return(timeline);
}



// insert_timeline_item
//
// Inserts an item into the proper place in the timeline
//
// Parameters:
//   timeline: SEE make_timeline
//   time: Datetime of event
//   item: Item to insert ("dose", "route", "conc", "fluc", or "creat"
//   value: Value of item
//
// Adjusted Parameters: 
//   ALL FROM make_timeline
//
function insert_timeline_item(timeline, time, item, value) {
	var entered = false;
	for (var i = 0; i < timeline.length; i++) {
		if (time < timeline[i].time) {
			timeline.splice(i, 0, {time: time, dose: NaN, route: NaN, conc: NaN, fluc: NaN, creat: NaN});
			timeline[i][item] = value;
			entered = true;
			break;
		} else if (time == timeline[i].time) {
			timeline[i][item] = value;
			entered = true;
			break;
		}
	}
	if (!entered) {
		timeline.push({time: time, dose: NaN, route: "?", conc: NaN, fluc: NaN, creat: NaN});
		timeline[timeline.length - 1][item] = value;
	}
}


