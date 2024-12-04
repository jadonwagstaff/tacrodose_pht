// add_dose
//
// Function to add a new row to the "Tacrolimus Doses" in the html.
//
function add_dose() {
	// create new row
	var table = document.getElementById("dose_table");
	var nrows = table.rows.length;
	var row = table.insertRow(nrows - 2);
	
	// create cell contents
	var date = document.createElement("input");
	date.setAttribute("type", "date");
	var time = document.createElement("input");
	time.setAttribute("type", "time");
	var number = document.createElement("input");
	number.setAttribute("type", "number");
	number.setAttribute("step", "any");
	number.setAttribute("min", 0);
	var iv = document.createElement("input");
	iv.setAttribute("type", "radio");
	iv.setAttribute("value", "iv");
	iv.setAttribute("name", "dr" + nrows);
	var oral = document.createElement("input");
	oral.setAttribute("type", "radio");
	oral.setAttribute("value", "oral");
	oral.setAttribute("name", "dr" + nrows);
	
	// add contents to cells
	row.insertCell(0).appendChild(date);
	row.insertCell(1).appendChild(time);
	row.insertCell(2).appendChild(number);
	var route = row.insertCell(3);
	route.appendChild(iv);
	route.appendChild(document.createTextNode("IV"));
	route.appendChild(oral);
	route.appendChild(document.createTextNode("Oral"));
}



// get_doses
// 
// Extracts dose information from html.
//
// Returns:
//   doses: Dosing times and values
//     dt: datetime of dosing
//     dose: dose amount in mg
//     route: either "iv" or "oral"
//
function get_doses() {
	var doses = [];
	var doses_date = get_column("dose_table", 0);
	var doses_time = get_column("dose_table", 1);
	var doses_value = get_column("dose_table", 2);
	var doses_route = get_routes("dose_table", 3);
	
	for (var i = 0; i < doses_date.length; i++) {
		doses.push({dt: new Date(doses_date[i] + " " + doses_time[i]), value: parseFloat(doses_value[i]), route: doses_route[i]});
		if (doses[doses.length - 1].dt.toString() == "Invalid Date" | !doses[doses.length - 1].value | doses[doses.length - 1].route == "?") {
			doses.pop();
		}
	}
	
	return(doses)
}



// add_conc
//
// Function to add a new row to the "Tacrolimus Concentration" in the html.
//
function add_conc() {
	// create new row
	var table = document.getElementById("conc_table");
	var nrows = table.rows.length;
	var row = table.insertRow(nrows - 2);
	
	// create cell contents
	var date = document.createElement("input");
	date.setAttribute("type", "date");
	var time = document.createElement("input");
	time.setAttribute("type", "time");
	var number = document.createElement("input");
	number.setAttribute("type", "number");
	number.setAttribute("step", "any");
	number.setAttribute("min", 0);
	
	// add contents to cells
	row.insertCell(0).appendChild(date);
	row.insertCell(1).appendChild(time);
	row.insertCell(2).appendChild(number);
}



// get_conc
// 
// Extracts concentration information from html.
//
// Returns:
//   conc: Concentration times and values
//     dt: datetime of concentration
//     value: observed concentration in ug/L
//
function get_conc() {
	var conc = [];
	var conc_date = get_column("conc_table", 0);
	var conc_time = get_column("conc_table", 1);
	var conc_value = get_column("conc_table", 2);
	
	for (var i = 0; i < conc_date.length; i++) {
		conc.push({dt: new Date(conc_date[i] + " " + conc_time[i]), value: parseFloat(conc_value[i])});
		if (conc[conc.length - 1].dt.toString() == "Invalid Date" | !conc[conc.length - 1].value) {
			conc.pop();
		}
	}
	
	return(conc)
}



// add_creat
//
// Function to add a new row to the "Serum Creatinine" in the html.
//
function add_creat() {
	// create new row
	var table = document.getElementById("creat_table");
	var nrows = table.rows.length;
	var row = table.insertRow(nrows - 2);
	
	// create cell contents
	var date = document.createElement("input");
	date.setAttribute("type", "date");
	var time = document.createElement("input");
	time.setAttribute("type", "time");
	var number = document.createElement("input");
	number.setAttribute("type", "number");
	number.setAttribute("step", "any");
	number.setAttribute("min", 0);
	
	// add contents to cells
	row.insertCell(0).appendChild(date);
	row.insertCell(1).appendChild(time);
	row.insertCell(2).appendChild(number);
}



// get_creat
// 
// Extracts creatinine clearance information from html.
//
// Returns:
//   creat: Creatinine clearance values
//     dt: datetime of cratinine lab
//     value: creatinine clearance (mod Schwartz)
//
function get_creat() {
	var creat = [];
	var creat_date = get_column("creat_table", 0);
	var creat_time = get_column("creat_table", 1);
	var creat_value = get_column("creat_table", 2);
	
	for (var i = 0; i < creat_date.length; i++) {
		var entered = false;
		var dt = new Date(creat_date[i] + " " + creat_time[i]);
		var value = parseFloat(creat_value[i])
		if (dt.toString() != "Invalid Date" && value) {
			for (var j = 0; j < creat.length; j++) {
				if (dt < creat[j].dt) {
					creat.splice(j, 0, {dt: dt, value: value});
					entered = true;
					break;
				}
			}
			if (!entered) {
				creat.push({dt: dt, value:value});
			}
		}
	}
	
	return(creat);
}



// add_fluc
//
// Function to add a new row to the "Concomitant Fluconazole" in the html.
//
function add_fluc() {
	// create new row
	var table = document.getElementById("fluc_table");
	var nrows = table.rows.length;
	var row = table.insertRow(nrows - 2);
	
	// create cell contents
	var date1 = document.createElement("input");
	date1.setAttribute("type", "date");
	var time1 = document.createElement("input");
	time1.setAttribute("type", "time");
	var date2 = document.createElement("input");
	date2.setAttribute("type", "date");
	var time2 = document.createElement("input");
	time2.setAttribute("type", "time");
	
	// add contents to cells
	row.insertCell(0).appendChild(date1);
	row.insertCell(1).appendChild(time1);
	row.insertCell(2).appendChild(date2);
	row.insertCell(3).appendChild(time2);
}



// get_fluc
// 
// Extracts concomitant fluconazole information from html.
//
// Returns:
//   fluc_dt: Starting and stopping times of concomitant fluconazole
//     dt1: datetime of start of fluconazole use
//     dt2: datetime of end of fluconazole use
//
function get_fluc() {
	var fluc_dt = [];
	var fluc_date1 = get_column("fluc_table", 0);
	var fluc_time1 = get_column("fluc_table", 1);
	var fluc_date2 = get_column("fluc_table", 2);
	var fluc_time2 = get_column("fluc_table", 3);
	
	for (var i = 0; i < fluc_date1.length; i++) {
		fluc_dt.push({dt1: new Date(fluc_date1[i] + " " + fluc_time1[i]), dt2: new Date(fluc_date2[i] + " " + fluc_time2[i])});
		if (fluc_dt[fluc_dt.length - 1].dt1.toString() == "Invalid Date" | fluc_dt[fluc_dt.length - 1].dt2.toString() == "Invalid Date") {
			fluc_dt.pop();
		}
	}
	
	return(fluc_dt);
}



// get_column
// 
// Extracts values of a date, time, or value column from the html inputs.
//
// Parameters:
//   table_name: Which html table to extract from
//   column_index: Which html column to extract from
//
// Returns:
//   Array of values based on which table and index was selected.
//
function get_column(table_name, column_index) {
	var table = document.getElementById(table_name);
	var nrows = table.rows.length;
	
	var column = new Array(nrows - 3);
	
	for (var i = 0; i < column.length; i++) {
		column[i] = table.rows[i+1].cells[column_index].childNodes[0].value;
	}
	return(column);
}



// get_routes
// 
// Extracts values of routes column from the html inputs.
//
// Parameters:
//   table_name: Which html table to extract from
//   column_index: Which html column to extract from
//
// Returns:
//   Array of routes based on which table and index was selected.
//
function get_routes(table_name, column_index) {
	var table = document.getElementById(table_name);
	var nrows = table.rows.length;
	
	var column = new Array(nrows - 3);
	
	for (var i = 0; i < column.length; i++) {
		var route = table.rows[i+1].cells[column_index].childNodes;
		if (route[0].checked) {
			column[i] = "iv";
		} else if (route[2].checked) {
			column[i] = "oral";
		} else {
			column[i] = "?";
		}
	}
	return(column);
}


