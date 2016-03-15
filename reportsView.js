////////////////////
// I. Preparation //
////////////////////

	/**
	A. Server Side Global Variables
	**/

		var currentUsertype;
		USERTYPE = // table enum
		{
		    ADMIN: 0,
		    REGIONAL: 1,
		    STORE: 2
		};

	/**
	B. Client Side Global Variables
	**/
		// 1. Main Data from Parse.com
		// a. "Bid Summaries" Array
		var storedData;
		// b. "Group Admin" Array
		var groupData;
		var groupDataReceived = false;

		// 2. Table
		var tabledData;
		var groupedData;
		var rowArrayGroup
		var dataArray;

		// 3. Venue Managemnet
		var parties
		var partyIDs;
		var groupedIDs;
		var selectedVenues;
		var selectedGroups;//TODO

		// 4. Date Ranges
		var dateWin1 = {};
		var dateWin2 = {};
		var lastDateTitle = "";
		var priorDateTitle = "";

		// 5. Booleans
		var firstDateRange = true;
		var venueChanged = false;
		var firstGraph = true;

		// 6. Totals Row Management
		var data1T  = {'creditsUsed':0,'revenue':0,'numBidSongs':0};
		var data2T  = {'creditsUsed':0,'revenue':0,'numBidSongs':0};

		// 7. Line Graph
		var lineGraphData;
		var lineGraphStartLabel = 0;
		var venuesEachWeek;
		var venuesTotal;

$(document).ready(function() {

///////////////////////
// II. Data Fetching //
///////////////////////

	/**
	A. Show Progress Bar
	**/

		showProgressBar();

		function showProgressBar(){
			$("#dataCalcModal").modal("show");
			$("#calc-progress-container").css('display','block');
			var progress = 100;
			$("#calc-progress").attr("aria-valuenow",String(progress));
			$("#calc-progress").attr("style","width: "+String(progress)+"%");
		}
	
	/**
	B. Fetch BidSummaries from Parse.com
	**/
		$.when(
		
		$.ajax({
			// url: "/parse.php?groupAdminRecords=true",
			url: "/groupAdminData.txt",
			success: function(data) {
				groupData = JSON.parse(data);
			},
			error: function(){
				var Test;
			}
		}),

	/**
	C. Fetch BidSummaries from Parse.com
	**/

	    $.ajax({
	        // url: "/parse.php?refreshBidSummaries=true",
	        url: "/bidSummariesData.txt",
	        success: function(data) {
	            storedData = JSON.parse(data);
	        },
	        error: function(){
	        	var Test;
	        }
	    })

	    ).then(reportsPage);

});

function reportsPage(){

//////////////////
// III. Program //
//////////////////
	// These are all the function that make up the program
	// They are defined in the sections below
 
	/**
	A. Data Table
	**/

		// 1. Initial Display 1: a or b
		// a. Past 2 weeks
		// setToTwoWeeks();
		// b. Past 2 months
		setToTwoMonths();

		// 2. Array of Calculated Values
		calculateData();
		outputRows();

	/**
	B. Line Graph By Week
	**/
		// 1. Line Graph of Data
		lineGraph();

		// 2. Initial Display 2: comment = graph first; no-comment = table first
		showTable();

		// 3. Screen ready to be displayed
		dataLoaded();

//////////////////
// IV. BUTTONS  //
//////////////////

	/**
	A. Venued Grouping Changes
	**/
		// 1. Venue Change Button on Table
		// Begins the venue changing chain reaction
		$("#venue-venues-button").click(function(){
			showGroups();
			if(!venueChanged){
				showVenues(partyIDs);
				venueChanged = true;
			}
			$("#venue-grouping-modal").modal('show');
		});

		// 2. Group-Related Functions and Buttons
		// a. Fills the Modal with Groups from the "Group Admin" page
		function showGroups(){
			//$("#venue-grouping-list").empty();

			if(!venueChanged){
				for (var i = 0; i < groupData.length; i++) {
					var groupObject = groupData[i];
					// original checkbox situation
					// $("#venue-grouping-list").append(" <label><input type='checkbox' groupId="+groupObject['id']+" value''>"+" "+groupObject['name']+"</label>");

					// Button Method
					//
					// This method was done such that when one clicks a Group Button, the respective Venues are chosen
					// This was replaced by the checkbox method below
					//
					// $("#venue-grouping-list").append(' <label><button id="show-groups-venues-'+i+'" type="button" class="btn push-right btn-info btn-sm" groupId='+groupObject['id']+'>'+groupObject['name']+'</button></label><br>');
					//
					// $("#show-groups-venues-"+i).click(function(){
					// 	var id = $(this).attr('groupId');
					// 	selectVenues(id);
					// });

					// Checkbox Method
					$("#venue-grouping-list").append('<div style="text-align:left"><label><input id="group-checkbox-'+i+'" type="checkbox" groupId='+groupObject['id']+' value"">'+' '+groupObject['name']+'</label></div>');

					$("#group-checkbox-"+i).change(function(){
						if( $(this).is(':checked') ){
							var id = $(this).attr('groupId');
							selectVenues(id);
						}
						else{
							var id = $(this).attr('groupId');
							unselectVenues(id);
						}
					});

				}
			}
		}
		// b. Returns a Party Array for a given Group ID
		// For instance, a certain group ID may have 5 parties associated with it
		function partyIdsFromGroupId(groupID){
			var partIDs = new Array();
			for(var i = 0; i < groupData.length; i++){
				if(groupID.localeCompare(groupData[i]['id'])===0){
					for(var j = 0; j < groupData[i]['party'].length; j++){
						partIDs[j] = groupData[i]['party'][j]['id'];
					}
				}
			}
			return partIDs;
		}

		function selectVenues(groupID){
			var partyIdsOfVenues = partyIdsFromGroupId(groupID);
			$('#venue-venues-list').children('div').each(function () {
				var rowCheckbox = $(this).find('input');
				var partyId = $(this).find('input').attr('partyId');
				if(partyIdsOfVenues.indexOf(partyId) > -1){
					rowCheckbox.prop('checked', true);
				}
			});
		}

		function unselectVenues(groupID){
			var partyIdsOfGroup = partyIdsFromGroupId(groupID);
			var partyIdsStayChecked = new Array();
			
			$('#venue-grouping-list').children('div').each(function(){
				// find which grouping lists have been selected
				var rowCheckbox = $(this).find('input');
				if (rowCheckbox.is(":checked")){
					var grouId = $(this).find('input').attr('groupId');
					var partIds = partyIdsFromGroupId(grouId);
					for(var i = 0; i < partIds.length; i++){
						if(partyIdsStayChecked.indexOf(partIds[i]) == -1){
							partyIdsStayChecked.push(partIds[i]);
						}
					}		
				}
			});

			$('#venue-venues-list').children('div').each(function () {
				var rowCheckbox = $(this).find('input');
				var partyId = $(this).find('input').attr('partyId');
				if (rowCheckbox.is(":checked")){
					if(partyIdsOfGroup.indexOf(partyId) == -1){
						partyIdsStayChecked.push(partyId);
					}	
				}
			});
			
			$('#venue-venues-list').children('div').each(function () {
				var rowCheckbox = $(this).find('input');
				var partyId = $(this).find('input').attr('partyId');
				if(partyIdsStayChecked.indexOf(partyId) == -1){
					rowCheckbox.prop('checked', false);
				}
			});
		}

		// 3. Venue-Related Functions and Buttons
		//
		function showVenues(groupIDs){
			// $("#venue-venues-list").empty();
			
			sortByKey(parties,"storeNum");
			
			for(var i = 0; i < groupIDs.length; i++){
				for (var j = 0; j < parties.length; j++) {
					if (parties[j]['id'].localeCompare(groupIDs[i])===0){
						var partyObject = parties[j];
						$("#venue-venues-list").append("<div style='text-align:left'><label><input id='party-checkbox-"+j+"' partyId="+partyObject['id']+" type='checkbox' value=''>"+" "+partyObject['storeNum']+" "+partyObject['storeName']+"</label></div>");

						$("#party-checkbox-"+j).change(function(){
							if( $(this).is(':checked') ){
								selectGroups();
							}
							else{
								var id = $(this).attr('groupId');
								unselectGroups();
							}
						});
					};
				}
			}
		}

		function selectGroups(){
			var partyIdsChecked = new Array();

			$('#venue-venues-list').children('div').each(function () {
				var rowCheckbox = $(this).find('input');
				var partyId = $(this).find('input').attr('partyId');
				if (rowCheckbox.is(":checked")){
					if(partyIdsChecked.indexOf(partyId) == -1){
						partyIdsChecked.push(partyId);
					}	
				}
			});

			$('#venue-grouping-list').children('div').each(function () {
				var rowCheckbox = $(this).find('input');
				var groupId = $(this).find('input').attr('groupId');
				var partyIdsOfGroup = partyIdsFromGroupId(groupId);
				if(allGroupIdsChecked(partyIdsOfGroup,partyIdsChecked)){
					rowCheckbox.prop('checked', true);
				}
			});
		}

		function unselectGroups(){
			var partyIdsChecked = new Array();

			$('#venue-venues-list').children('div').each(function () {
				var rowCheckbox = $(this).find('input');
				var partyId = $(this).find('input').attr('partyId');
				if (rowCheckbox.is(":checked")){
					if(partyIdsChecked.indexOf(partyId) == -1){
						partyIdsChecked.push(partyId);
					}	
				}
			});

			$('#venue-grouping-list').children('div').each(function () {
				var rowCheckbox = $(this).find('input');
				var groupId = $(this).find('input').attr('groupId');
				var partyIdsOfGroup = partyIdsFromGroupId(groupId);
				if(!(allGroupIdsChecked(partyIdsOfGroup,partyIdsChecked))){
					rowCheckbox.prop('checked', false);
				}
			});
		}

		// Check if an array of checked partyIds constitute the checking of a group
		function allGroupIdsChecked(partyIdsOfGroup,partyIdsChecked){
			var counter = 0;
			var noPartyData = 0;

			for(var i = 0; i < partyIdsOfGroup.length; i++){
				if(partyIdsChecked.indexOf(partyIdsOfGroup[i]) > -1){
					counter++;
				}

				else if(partyIDs.indexOf(partyIdsOfGroup[i]) == -1){
					counter++;
					noPartyData++;
				}
			}

			if(noPartyData==partyIdsOfGroup.length){
				return false;
			}

			if(counter==partyIdsOfGroup.length){
				return true;
			}

			return false;
		}

		// Checks all of the checkboxes in the group section of the model
		function selectAllVenues(){
			// $('#venue-grouping-list').children('div').each(function () {
			// 	var rowCheckbox = $(this).find('input');
			// 	// rowCheckbox.prop('checked', true);
			// });
			$('#venue-venues-list').children('div').each(function () {
				var rowCheckbox = $(this).find('input');
				rowCheckbox.prop('checked', true);
				// rowCheckbox.attr('checked', true);
			});

			selectGroups();
		}

		function unselectAllVenues(){
			// $('#venue-grouping-list').children('div').each(function () {
			// 	var rowCheckbox = $(this).find('input');
			// 	rowCheckbox.prop('checked', false);
			// });
			$('#venue-venues-list').children('div').each(function () {
				var rowCheckbox = $(this).find('input');
				rowCheckbox.prop('checked', false);
			});

			unselectGroups();
		}

		$("#select-all-copy-venues").click(function(){
			selectAllVenues();
		});
		// Un-Checks all of the checkboxes in the group section of the model
		$("#select-none-copy-venues").click(function(){
			unselectAllVenues();
		});

	/**
	B. Date Range Changes
	**/
	
		// 1. Date Range Buttons
		$("#first-range-button").click(function(){
			setFirstRange();
		});

		$("#second-range-button").click(function(){
			setSecondRange();
		});

		$("#swap-ranges-button").click(function(){
			swapDateRanges();
		});

		// 2. Date Range Functions
		function setFirstRange() {
			$("#first-range-modal").modal('show');
			$('#datepicker-start-1').data("DateTimePicker").date(dateWin1['start']);
			$('#datepicker-end-1').data("DateTimePicker").date(dateWin1['end']);
		}

		function setSecondRange() {
			$("#second-range-modal").modal('show');
			$('#datepicker-start-2').data("DateTimePicker").date(dateWin2['start']);
			$('#datepicker-end-2').data("DateTimePicker").date(dateWin2['end']);
		}

		function swapDateRanges() {
			var placeholder = dateWin2;
			dateWin2 = dateWin1;
			dateWin1 = placeholder;

			refreshLineGraph();
			calculateData();
			outputRows();
			lineGraph();
		}

	/**
	C. Default Date Range Cases
	**/
		// 1. Default Range Buttons
		// a. Last 2 Weeks
		$("#last-two-weeks-button").click(function(){
			setToTwoWeeks();
		});
		// b. Last 2 Months
		$("#last-two-months-button").click(function(){
			setToTwoMonths();
		});
		// c. Debugging Grouping Venues

		// 2. Default Range Functions
		// a. Set to Last 2 Weeks
		function setToTwoWeeks(){
			// i. initialize
			var today = new Date();
			var dow = today.getDay();
			var daysToSub = (dow > 0) ? 6 + dow : 13;
			
			// ii. current Monday - next Sunday
			dateWin2['start'] = new Date(today);
			dateWin2['start'].setDate(dateWin2['start'].getDate() - daysToSub);
			dateWin2['start'].setHours(1);
			dateWin2['end'] = new Date(dateWin2['start']);
			dateWin2['end'].setDate(dateWin2['end'].getDate() + 6);
			dateWin2['end'].setHours(23);

			// iii. previous Monday - current Sundary
			dateWin1['start'] = new Date(dateWin2['start']);
			dateWin1['start'].setDate(dateWin1['start'].getDate() - 7);
			dateWin1['end'] = new Date(dateWin2['end']);
			dateWin1['end'].setDate(dateWin1['end'].getDate() - 7);
			
			//iv. resort data
			if(!firstDateRange){
				calculateData();
				outputRows();
			}
			firstDateRange = false;
		}
		// b. Set to Last 2 Months
		function setToTwoMonths(){
			// Current Month Window
			var today = new Date();
			var y = today.getFullYear();
			var thisMonth = today.getMonth()-1;
			// or if you wanted to include this month
			// var thisMonth = today.getMonth();
			dateWin2['start'] = new Date(y,thisMonth, 1);
			dateWin2['start'].setHours(1);
			dateWin2['end'] = endDate(y,thisMonth);

			// Previous Month Window
			if (thisMonth == 0){
				var lastMonth = 11;
				y -= 1;
			}
			else{
				var lastMonth = thisMonth-1;
			}

			dateWin1['start'] = new Date(y,lastMonth, 1);
			dateWin1['start'].setHours(1);
			dateWin1['end'] = endDate(y,lastMonth);

			// Re-Sort the Data
			if(!firstDateRange){
				calculateData();
				outputRows();
			}
			firstDateRange = false;
		}
		// c. Determines the end date of a month (wheth its 31, 28, or 30)
		function endDate(y, thisMonth){
			var monthsThirtyOne = [0,2,4,6,7,9,11];

			if (monthsThirtyOne.indexOf(thisMonth) > -1){
				var endDate = new Date(y,thisMonth,31);
			}
			else if(thisMonth == 1){
				var endDate = new Date(y,thisMonth,28);
			}
			else{
				var endDate = new Date(y,thisMonth,30);
			}
			endDate.setHours(23);

			return endDate;
		}

	/**
	D. Logout
	**/
		// Send a user back to the home page and logs them out
		$("#logout-button").click(function(){
			$.ajax({
				url: '/parse.php?logout=true',
				success: function(response) {
					// navigate back to the home screen
					window.location = "index.html";
				}
			});
		});

	/**
	E. Saves
	**/
		// 1. Save Venues
		function refreshPage(){
			selectedVenues = [];
			$('#venue-venues-list').children('div').each(function () {
				var rowCheckbox = $(this).find('input');
				var partyId = $(this).find('input').attr('partyId');
				if (rowCheckbox.is(":checked")){
					selectedVenues.push(partyId);			
				}
			});
			
			venueChanged = true;
			refreshLineGraph();
			calculateData();
			outputRows();
			lineGraph();
		}

		$("#save-button-venue").click(function(){
			refreshPage();
			
			$('#venue-grouping-modal').modal('hide');
		})

		$("#show-all-venues-button").click(function(){
			if(venueChanged){
				selectAllVenues();
				refreshPage();
			}
		})

		// 2. Save 1st Range
		$("#save-button-1").click(function(){
			dateWin1['start'] = $('#datepicker-start-1').data("DateTimePicker").date()['_d'];
			dateWin1['end'] = $('#datepicker-end-1').data("DateTimePicker").date()['_d'];
			dateWin1['start'].setHours(1);
			dateWin1['end'].setHours(23);
			// Check for valid dates
			// if(dateWin1['start'] > dateWin1['end'] || dateWin1['start']==null || dateWin1['end']==null){
			// 	alert("Please choose date ranges where the starting date is BEFORE the ending date.");
			// }
			
			var week1 = findWeek(dateWin1['start']);
			var week2 = findWeek(dateWin1['end'])

			calculateData();
			outputRows();

			$('#first-range-modal').modal('hide');
		})

		// 3. Save 2nd Range
		$("#save-button-2").click(function(){
			dateWin2['start'] = $('#datepicker-start-2').data("DateTimePicker").date()['_d'];
			dateWin2['end'] = $('#datepicker-end-2').data("DateTimePicker").date()['_d'];
			dateWin2['start'].setHours(1);
			dateWin2['end'].setHours(23);
			
			calculateData();
			outputRows();

			$('#second-range-modal').modal('hide');
		})

	/**
	F. Line Graph
	**/
		// turns display on for graph
		// turns display off for table
		function hideTable(){
			var lTable = document.getElementById("result-table");
	    	lTable.style.display = "none";
	    	var lLine = document.getElementById("lineGraph-container-container");
	    	lLine.style.display = "block";
	    	var lAlert = document.getElementById("no-venues-in-graph");
	    	lAlert.style.display = "none";

	    	refreshLineGraph();
		}
		$("#line-graph-button").click(function(){
			hideTable();
			calculateData();
			outputRows();
			lineGraph();
			// hideTable();
		})

		function refreshLineGraph(){
			var lAlert = document.getElementById("no-venues-in-graph");
	    	lAlert.style.display = "none";
			// Non-Robust Code ALERT:
	    	// Need a Better Way to do this. Basically, Chart.js doesn't do a good job clearing
	    	// the canvas, so here I remove everything and re-insert it
	    	$('#lineGraph-container').remove();
			// Need to not have it append if there are no selected venues - ordering of code makes it difficult
			$('#lineGraph-container-container').append('<div id="lineGraph-container" style="width: 60%" align="center"> <h2 style="color:green">Revenue ($)</h2> <canvas id="line-graph-1" height="450" width="900" style="display:block"></canvas> <h2 style="color:blue">Credits Bid</h2> <canvas id="line-graph-2" height="450" width="900" style="display:block"></canvas> <h2 style="color:orange">Songs Bid</h2> <canvas id="line-graph-3" height="450" width="900" style="display:block"></canvas> </div>');
		}

		// Shows the Legend Modal for the Graph
		$("#legend-button").click(function(){
			$('#legend-modal').modal('show');
		})

	/**
	G. Table
	**/
		// turns display on for table
		// turns display off for graph
		function showTable(){
			var lTable = document.getElementById("result-table");
	    	lTable.style.display = "table";
	    	var lLine = document.getElementById("lineGraph-container-container");
	    	lLine.style.display = "none";
	    	var lAlert = document.getElementById("no-venues-in-graph");
	    	lAlert.style.display = "none";
		}
		$("#table-button").click(function(){
			showTable();
		})

	/**
	H. Groups on Table
	**/
	
		$("#toggle-groups-button").click(function(){
			$('#bid-summary-content-group').toggle();
		})

////////////////
// V. TABLE   //
////////////////

	/**
	A. Load Data from Parse.com
	**/
		// 1. Show Progress Bar
		// function loadData(){
		// 	$("#dataCalcModal").modal("show");
		// 	$("#calc-progress-container").css('display','block');
		// 	var progress = 100;
		// 	$("#calc-progress").attr("aria-valuenow",String(progress));
		// 	$("#calc-progress").attr("style","width: "+String(progress)+"%");
		// }

		// 2. Hide Progress Bar
		function dataLoaded(){
			$("#dataCalcModal").modal("hide");
			$("#calc-progress-container").css('display','none');
		}
	
	/**
	B. Helper Function for Sorting Parties
	**/
		// takes a key (mainly "storeNum" of a venue) and sorts
		// the given array by that key
		function sortByKey(array, key) {
		    return array.sort(function(a, b) {
		        var x = a[key]; var y = b[key];
		        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		    });
		}

	/**
	C. Sort Data for a Given Date Range
	**/
		// Takes the storedData from "Bid Summaries" and makes usable data
		// This data is then formatted in outputRows() and added to reports.html
		function calculateData(){
			// 1. Empty Everything
			tabledData = [{},{}];
			parties = new Array();
			partyIDs = new Array();
			lineGraphData = new Array();
			groupedData = [{},{}];
			groupedIDs = new Array();

			var dataLen = storedData.length;
			var dates = [dateWin1,dateWin2];
			
			// for Line Graph
			var firstDayPiece = storedData[dataLen-1]['day']['date'].split('-');
			var firstDate = new Date(firstDayPiece[0],firstDayPiece[1]-1,firstDayPiece[2].split(" ")[0],12);
			var lastDayPiece = storedData[0]['day']['date'].split('-');
			var lastDate = new Date(lastDayPiece[0],lastDayPiece[1]-1,lastDayPiece[2].split(" ")[0],12);
			
			var bidSum = storedData[0];
			var dayPieces = bidSum['day']['date'].split('-');
			var day = new Date(dayPieces[0],dayPieces[1]-1,dayPieces[2].split(" ")[0],12);
			var weeksOfData = weeksBetween(firstDate, lastDate);
			var currentWeek = findWeek(day);

			var weekCounter = 0;
			var counter = 0;
			var firstTime = true;
			var startMonday = (firstDate.getDay() == 1);

			// For each piece of data (1000s of data pieces typically)
			for (var i = 0; i < dataLen; i++) {
				var bidSum = storedData[i];
				var dayPieces = bidSum['day']['date'].split('-');
				var day = new Date(dayPieces[0],dayPieces[1]-1,dayPieces[2].split(" ")[0],12);
				var party = bidSum['party'];
				var partyid = party['id'];

				// Array of Venues/Parties
				// Need this before one can determine the party data
				if (partyIDs.indexOf(party['id']) == -1) {
					parties.push(party);
					partyIDs.push(party['id']);

					//Initialize Array
					if (tabledData[0][partyid] === undefined) {
							tabledData[0][partyid] = {'creditsUsed':0,'revenue':0,'numBidSongs':0, 'storeNum':0, 'storeName':"N/A", 'week':"N/A"};
					}

					//Store Venue Information in Array
					tabledData[0][partyid]['storeNum'] = party['storeNum'];
					tabledData[0][partyid]['storeName'] = party['storeName'];
				}

				// Array of Groups
				// Need this before one can determine the group data

				// For Each Date Range (2 ranges typically)
				// Two Groups of Rows
				// 1. partyid: 
				for (var j = 0; j < dates.length; j++) {

					//Create Date Edges
					var startDate = dates[j]['start'];
					var endDate = dates[j]['end'];
					if ((day < endDate) && (day > startDate)) {
						
						//Initialize Array
						if (tabledData[j][partyid] === undefined) {
							tabledData[j][partyid] = {'creditsUsed':0,'revenue':0,'numBidSongs':0, 'storeNum':0, 'storeName':"N/A", 'week':"N/A"};
						}

						//Sum All Data in Date Range
						tabledData[j][partyid]['creditsUsed'] += bidSum['creditsUsed'];
						tabledData[j][partyid]['revenue'] += bidSum['revenue'];
						tabledData[j][partyid]['numBidSongs'] += bidSum['numBidSongs'];

						for(var k = 0; k < groupData.length; k++){
							if(partyIDInGroup(partyid, k)){
								incrementGroupedData(bidSum, j, k);
							}
						}
					}
				}
			};

			sortByKey(parties,"storeNum");

			for(var i = 0; i < parties.length; i++){
				partyIDs[i] = parties[i]['id'];
			}

			sortByKey(groupData,"name");

			var counter = 0;
			// which ever set it bigger, draw the IDs from there

			for(var i = 0; i < groupData.length; i++){
				if(groupedIDs.indexOf(groupData[i]['id']) === -1){
					// because an ID might be in one data set but not the other
					if(groupedData[1][groupData[i]['id']] != undefined){
						groupedIDs[counter] = groupData[i]['id'];
						counter++
					}
					else if(groupedData[0][groupData[i]['id']] != undefined){
						groupedIDs[counter] = groupData[i]['id'];
						counter++
					}
				}
			}

			//Default Case - selectedVenues = all Venues
			if(!venueChanged){
				selectedVenues = partyIDs;
			}

			// For Loops for Line Graph Data (By Week)
			for (var i = 0; i < dataLen; i++) {
				var bidSum = storedData[i];
				var dayPieces = bidSum['day']['date'].split('-');
				var day = new Date(dayPieces[0],dayPieces[1]-1,dayPieces[2].split(" ")[0],12);
				var party = bidSum['party'];
				var partyid = party['id'];

				//For Each Week Range (11 weeks typically)

				if(lineGraphData[weekCounter] === undefined){
					lineGraphData[weekCounter] = {'WeekNum':(weeksOfData-weekCounter)};
				}

				var dayWeek = findWeek(day);

				if(currentWeek.localeCompare(dayWeek)===0){
					incrementLineGraphData(weekCounter,partyid,bidSum,party,currentWeek);
					// WILL 
					//
					// for(var j = 0; j < groupData.length; k++){
					// 	if(partyIDInGroup(partyid, k)){
					// 		incrementLineGroupedData(bidSum, j, k);
					// 	}
					// }
				}
				else{
					currentWeek = findWeek(day)
					weekCounter++;

					if(lineGraphData[weekCounter] === undefined){
						lineGraphData[weekCounter] = {'WeekNum':(weeksOfData-weekCounter)};
					}

					incrementLineGraphData(weekCounter,partyid,bidSum,party,currentWeek);
				}
			}
		}

		// 2. Helper Functions
		// a. Increments the Data for Each Party for a Given Week
		function incrementLineGraphData(weekCounter, partyid, bidSum, party, currentWeek){
			if(lineGraphData[weekCounter][partyid] === undefined){
				lineGraphData[weekCounter][partyid] = {'creditsUsed':0,'revenue':0, 'numBidSongs':0, 'storeNum':0, 'storeName':"N/A", 'week':"N/A"};
			}

			lineGraphData[weekCounter][partyid]['creditsUsed'] += bidSum['creditsUsed'];
			lineGraphData[weekCounter][partyid]['revenue'] += bidSum['revenue'];
			lineGraphData[weekCounter][partyid]['numBidSongs'] += bidSum['numBidSongs'];
			lineGraphData[weekCounter][partyid]['storeNum'] = party['storeNum'];
			lineGraphData[weekCounter][partyid]['storeName'] = party['storeName'];
			lineGraphData[weekCounter][partyid]['week'] = currentWeek;

			// keep a grand total as well
			if(lineGraphData[weekCounter]['total'] === undefined){
				lineGraphData[weekCounter]['total'] = {'creditsUsed':0,'revenue':0, 'numBidSongs':0, 'storeNum':0, 'storeName':"N/A", 'week':"N/A"};
			}

			if(selectedVenues.indexOf(partyid) > -1){
				lineGraphData[weekCounter]['total']['creditsUsed'] += bidSum['creditsUsed'];
				lineGraphData[weekCounter]['total']['revenue'] += bidSum['revenue'];
				lineGraphData[weekCounter]['total']['numBidSongs'] += bidSum['numBidSongs'];
				lineGraphData[weekCounter]['total']['week'] = currentWeek;
			}

			// this BidSum is in a group, add to that groupID's LineGraphData
			// 
			// if(groupedIDs.indexOf(partyid) > -1)
		}

		// b. Returns boolean of whether or not a party is in a specific group
		function partyIDInGroup(partyid, k){
			for (var i = 0; i < groupData[k]['party'].length; i++){
				if(partyid.localeCompare(groupData[k]['party'][i]['id'])==0){
					return true;
				}
			}
			return false;
		}

		// increments the GroupData
		function incrementGroupedData(bidSum, j, k){
			var groupID = groupData[k]['id'];
			//Initialize Array
			if (groupedData[j] === undefined) {
				groupedData[j] = new Array();
				// groupedData[j] = {'DateRange': j}
			}
			if (groupedData[j][groupID] === undefined) {
				groupedData[j][groupID] = {'creditsUsed':0,'revenue':0,'numBidSongs':0, 'groupNum':0, 'groupName':groupData[k]['name'], 'id':groupID};
			}

			//Sum All Data in Date Range
			groupedData[j][groupID]['creditsUsed'] += bidSum['creditsUsed'];
			groupedData[j][groupID]['revenue'] += bidSum['revenue'];
			groupedData[j][groupID]['numBidSongs'] += bidSum['numBidSongs'];

			// if (groupedData[j][k] === undefined) {
			// 	groupedData[j][k] = {'creditsUsed':0,'revenue':0,'numBidSongs':0, 'groupNum':0, 'groupName':groupData[k]['name'], 'id':groupID};
			// }

			// //Sum All Data in Date Range
			// groupedData[j][k]['creditsUsed'] += bidSum['creditsUsed'];
			// groupedData[j][k]['revenue'] += bidSum['revenue'];
			// groupedData[j][k]['numBidSongs'] += bidSum['numBidSongs'];
		}

	/**
	D. Output Rows for a Given Venue Grouping
	**/
		// 1. Main Function
		function outputRows(){
			// title the table with our dates
			dateTable();

			data1T = {'creditsUsed':0,'revenue':0,'numBidSongs':0, 'storeNum':0, 'storeName':"N/A", 'week':"N/A"};
			data2T = {'creditsUsed':0,'revenue':0,'numBidSongs':0, 'storeNum':0, 'storeName':"N/A", 'week':"N/A"};

			var nextColor;
			
			// initialize row
			var venueArray = new Array()
			venueArray = [{},{}];
			var rowArrayVenue = new Array();	
			rowArrayGroup = new Array();
			var legendCount = 0;
			var legendLimit = 3;

			for (var i = 0; i < groupedIDs.length; i++) {
					// toggle the row colors for easier readability
					var data1 = groupedData[0][groupedIDs[i]];
					var data2 = groupedData[1][groupedIDs[i]];
					if (data1 === undefined) {
						data1 = {'creditsUsed':0,'revenue':0,'numBidSongs':0, 'groupNum':0, 'groupName':"N/A"};
					}
					if (data2 === undefined) {
						data2 = {'creditsUsed':0,'revenue':0,'numBidSongs':0, 'groupNum':0, 'groupName':"N/A"};
					}

					// trap for situation where a party may not have data for a period, skip entirely if NO data 
					// still enters even without data now - just so the table stays
					if ((data1 != undefined || data2 != undefined)) {
						//Create Venue Row
						rowArrayGroup[i] = createGroupRow(data1,data2,i);
					}
			}

			for (var i = 0; i < selectedVenues.length; i++) {
					// toggle the row colors for easier readability
					var data1 = tabledData[0][selectedVenues[i]];
					var data2 = tabledData[1][selectedVenues[i]];
					if (data1 === undefined) {
						data1 = {'creditsUsed':0,'revenue':0,'numBidSongs':0, 'storeNum':0, 'storeName':"N/A", 'week':"N/A"};
					}
					if (data2 === undefined) {
						data2 = {'creditsUsed':0,'revenue':0,'numBidSongs':0, 'storeNum':0, 'storeName':"N/A", 'week':"N/A"};
					}

					// venueArray[0][i] = data1;
					// venueArray[1][i] = data2; 

					// trap for situation where a party may not have data for a period, skip entirely if NO data 
					// still enters even without data now - just so the table stays
					if ((data1 != undefined || data2 != undefined)) {
						//&& (parties[i]['name'].indexOf('Test') < 0)

						// Increment Totals
						incrementTotals(data1, data2);

						//Create Venue Row
						rowArrayVenue[i] = createVenueRow(data1,data2,i);
					}
			}

			//Create Total Row
			var rowTotal = calculateTotalPercents();
			var rowAvg = createAvgRow();
			
			//Add Total Row
			$("#bid-summary-content-total").empty().append(rowTotal);
			$("#bid-summary-content-total").append(rowAvg);

			//Create Group Row
			$("#bid-summary-content-group").empty()
			for (var i = 0; i < rowArrayGroup.length; i++) {
				$("#bid-summary-content-group").append(rowArrayGroup[i]);
			}
			

			//Add Venue Row(s)
			$("#bid-summary-content-venue").empty()
			for (var i = 0; i < selectedVenues.length; i++) {
				$("#bid-summary-content-venue").append(rowArrayVenue[i]);
			}

			//New Data Array
			var totalArray = [data1T, data2T];
			dataArray = [totalArray, venueArray];
		}

		// 2. Helper Functions
		// a. Creates the Header Row of the Table
		// For Instance, a date range might change from incarnation to incarnation
		function dateTable(){
			lastDateTitle = dateWin2['start'].toDateString() + "<br>" + dateWin2['end'].toDateString();
			priorDateTitle = dateWin1['start'].toDateString() + "<br>" + dateWin1['end'].toDateString();
			$("#bid-summary-title").empty().append("<tr><td class=tg-oyd7 colspan=2>Location</td><th class=tg-1n72></th><th class=tg-oyd7 colspan=3>"+priorDateTitle+"</th><th class=tg-1n72></th><th class=tg-oyd7 colspan=3>"+lastDateTitle+"</th><th class=tg-1n72></th><th class=tg-oyd7 colspan=3>Change</th></tr>");
		}
		// b. Make a running total for all of the necessary pieces of data
		function incrementTotals(data1,data2){
			data1T['creditsUsed'] += data1['creditsUsed'];
			data1T['revenue'] += data1['revenue'];
			data1T['numBidSongs'] += data1['numBidSongs'];
			data2T['creditsUsed'] += data2['creditsUsed'];
			data2T['revenue'] += data2['revenue'];
			data2T['numBidSongs'] += data2['numBidSongs'];
		}
		// c. Create each venue row
		function createVenueRow(data1,data2,i){
			var perc1 = (data1['creditsUsed'] == 0) ? "N/A" : ((data2['creditsUsed'] - data1['creditsUsed']) * 100 / data1['creditsUsed']).toFixed(0);
			var perc2 = (data1['revenue'] == 0) ? "N/A" : ((data2['revenue'] - data1['revenue']) * 100 / data1['revenue']).toFixed(0);
			var perc3 = (data1['numBidSongs'] == 0) ? "N/A" : ((data2['numBidSongs'] - data1['numBidSongs']) * 100 / data1['numBidSongs']).toFixed(0);
			var pcol1 = (perc1 < 0) ? "class=tg-red" : "class=tg-s6z2";
			var pcol2 = (perc2 < 0) ? "class=tg-red" : "class=tg-s6z2";
			var pcol3 = (perc3 < 0) ? "class=tg-red" : "class=tg-s6z2";
			return "<tr rowNum="+(i+2)+"><td class=tg-s6z2>"+data1['storeNum']+"</td><td>"+data1['storeName']+"</td><td></td><td class=tg-s6z2>"+data1['creditsUsed']+"</td><td class=tg-s6z2>"+"$"+data1['revenue'].toFixed(2)+"</td><td class=tg-s6z2>"+data1['numBidSongs']+"</td><td></td><td class=tg-s6z2>"+data2['creditsUsed']+"</td><td class=tg-s6z2>"+"$"+data2['revenue'].toFixed(2)+"</td><td class=tg-s6z2>"+data2['numBidSongs']+"</td><td></td><td "+pcol1+">"+perc1+"\%"+"</td><td "+pcol2+">"+perc2+"\%"+"</td><td "+pcol3+">"+perc3+"\%"+"</td></tr>";
		}

		// d. Determine Percentages after the Totals have been finalized
		function calculateTotalPercents() {
			var perc1T = (data1T['creditsUsed'] == 0) ? "N/A" : ((data2T['creditsUsed'] - data1T['creditsUsed']) * 100 / data1T['creditsUsed']).toFixed(0);
			var perc2T = (data1T['revenue'] == 0) ? "N/A" : ((data2T['revenue'] - data1T['revenue']) * 100 / data1T['revenue']).toFixed(0);
			var perc3T = (data1T['numBidSongs'] == 0) ? "N/A" : ((data2T['numBidSongs'] - data1T['numBidSongs']) * 100 / data1T['numBidSongs']).toFixed(0);
			var pcol1T = (perc1T < 0) ? "class=tg-redbold" : "class=tg-bold";
			var pcol2T = (perc2T < 0) ? "class=tg-redbold" : "class=tg-bold";
			var pcol3T = (perc3T < 0) ? "class=tg-redbold" : "class=tg-bold";
			return "<tr rowNum="+(0)+"><td class=tg-bold></td><td class=tg-bold>Total</td><td></td><td class=tg-bold>"+data1T['creditsUsed']+"</td><td class=tg-bold>"+"$"+data1T['revenue'].toFixed(2)+"</td><td class=tg-bold>"+data1T['numBidSongs']+"</td><td></td><td class=tg-bold>"+data2T['creditsUsed']+"</td><td class=tg-bold>"+"$"+data2T['revenue'].toFixed(2)+"</td><td class=tg-bold>"+data2T['numBidSongs']+"</td><td></td><td "+pcol1T+">"+perc1T+"\%"+"</td><td "+pcol2T+">"+perc2T+"\%"+"</td><td "+pcol3T+">"+perc3T+"\%"+"</td></tr>";
		}

		// d. Determine Percentages after the Totals have been finalized
		// create the HTML row
		function createAvgRow() {
			var numVenues1 = 0;
			// this assumes that a venue is active if it has a least one credit bid
			var numVenues2 = 0;
			for(var i = 0; i < selectedVenues.length; i++){
				var data1 = tabledData[0][selectedVenues[i]];
				var data2 = tabledData[1][selectedVenues[i]];

				if(data1 != undefined){
					if(data1['creditsUsed'] > 0){
						numVenues1++;
						numVenues2++;
					}
					else if(data2 != undefined){
						if(data2['creditsUsed'] > 0){
							numVenues2++;
						}
					}
				}
			}

			// prevent dividing by zero
			if(numVenues1 === 0){
				numVenues1 = 1;
			}

			if(numVenues2 === 0){
				numVenues2 = 1;
			}

			var data1A = findAvgData(numVenues1,1);
			var data2A = findAvgData(numVenues2,2);

			var perc1A = (data1A['creditsUsed'] == 0) ? "N/A" : ((data2A['creditsUsed'] - data1A['creditsUsed']) * 100 / data1A['creditsUsed']).toFixed(0);
			var perc2A = (data1A['revenue'] == 0) ? "N/A" : ((data2A['revenue'] - data1A['revenue']) * 100 / data1A['revenue']).toFixed(0);
			var perc3A = (data1A['numBidSongs'] == 0) ? "N/A" : ((data2A['numBidSongs'] - data1A['numBidSongs']) * 100 / data1A['numBidSongs']).toFixed(0);
			var pcol1A = (perc1A < 0) ? "class=tg-redbold" : "class=tg-bold";
			var pcol2A = (perc2A < 0) ? "class=tg-redbold" : "class=tg-bold";
			var pcol3A = (perc3A < 0) ? "class=tg-redbold" : "class=tg-bold";

			// return the HTML average row
			return "<tr rowNum="+(1)+"><td class=tg-bold></td><td class=tg-bold>Average</td><td></td><td class=tg-bold>"+data1A['creditsUsed'].toFixed(1)+"</td><td class=tg-bold>"+"$"+data1A['revenue'].toFixed(2)+"</td><td class=tg-bold>"+data1A['numBidSongs'].toFixed(1)+"</td><td></td><td class=tg-bold>"+data2A['creditsUsed'].toFixed(1)+"</td><td class=tg-bold>"+"$"+data2A['revenue'].toFixed(2)+"</td><td class=tg-bold>"+data2A['numBidSongs'].toFixed(1)+"</td><td></td><td "+pcol1A+">"+perc1A+"\%"+"</td><td "+pcol2A+">"+perc2A+"\%"+"</td><td "+pcol3A+">"+perc3A+"\%"+"</td></tr>";
		}
		// function to calculate the average given a certain number of Selected Venues
		function findAvgData(numVenues,dataNum){
			if(dataNum == 1){
				var total = data1T;
			}
			else if(dataNum == 2){
				var total = data2T;
			}
			else{
				return;
			}

			var revenue = total['revenue']/numVenues;
			var credits = total['creditsUsed']/numVenues;
			var songs = total['numBidSongs']/numVenues	

			return {'creditsUsed':credits,'revenue':revenue,'numBidSongs':songs, 'numVenues':numVenues};
		}

		// e. Create each group row
		function createGroupRow(data1,data2,i){
			var perc1 = (data1['creditsUsed'] == 0) ? "N/A" : ((data2['creditsUsed'] - data1['creditsUsed']) * 100 / data1['creditsUsed']).toFixed(0);
			var perc2 = (data1['revenue'] == 0) ? "N/A" : ((data2['revenue'] - data1['revenue']) * 100 / data1['revenue']).toFixed(0);
			var perc3 = (data1['numBidSongs'] == 0) ? "N/A" : ((data2['numBidSongs'] - data1['numBidSongs']) * 100 / data1['numBidSongs']).toFixed(0);
			var pcol1 = (perc1 < 0) ? "class=tg-red" : "class=tg-s6z2";
			var pcol2 = (perc2 < 0) ? "class=tg-red" : "class=tg-s6z2";
			var pcol3 = (perc3 < 0) ? "class=tg-red" : "class=tg-s6z2";

			// if the restaurant wasn't defined until later
			if(data1['groupName'].localeCompare("N/A")===0){
				data1['groupName'] = data2['groupName'];
			}

			return "<tr rowNum="+i+"><td class=tg-bold>G"+(i+1)+"</td><td>"+data1['groupName']+"</td><td></td><td class=tg-s6z2>"+data1['creditsUsed']+"</td><td class=tg-s6z2>"+"$"+data1['revenue'].toFixed(2)+"</td><td class=tg-s6z2>"+data1['numBidSongs']+"</td><td></td><td class=tg-s6z2>"+data2['creditsUsed']+"</td><td class=tg-s6z2>"+"$"+data2['revenue'].toFixed(2)+"</td><td class=tg-s6z2>"+data2['numBidSongs']+"</td><td></td><td "+pcol1+">"+perc1+"\%"+"</td><td "+pcol2+">"+perc2+"\%"+"</td><td "+pcol3+">"+perc3+"\%"+"</td></tr>";
		}

////////////////////
// VI. Line Graph //
////////////////////
	/**
	A. Week Sorting
	**/
		// 1. For debugging, tells one how many weeks between two dates
		function weeksBetween(firstDate, lastDate){
			// seconds in a day
			var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
			

			var weeks = Math.ceil(Math.abs(((lastDate.getTime() - firstDate.getTime())/(oneDay))/7));
			if(firstDate.getDay() > lastDate.getDay()){
				weeks += 1;
			}
			return weeks;
		}

		// b. Returns a string(mm/dd/yyyy) representing the date's week (Monday in this case):
		//
		// Relatively complicated with the hope of robustness - this is the bases of separating
		// the data by week
		function findWeek(date){
			// if Monday
			if(date.getDay() == 1){
				return ((date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear().toString().substr(2,2));
			}

			// if Sunday
			else if(date.getDay() === 0){
				// If Week: Sunday-Saturday
				
				var end = endDate(date.getFullYear(),date.getMonth());
				
				//If Sunday is the last day of the month
				if((end.getDate()==date.getDate())&&(end.getMonth()==date.getMonth())&&(end.getFullYear()==date.getFullYear())){
					// if December
					if(!(date.getMonth()==11)){
						return ((date.getMonth() + 2) + '/' + (1) + '/' +  date.getFullYear().toString().substr(2,2));
					}
					
					else{
						return ((1)+'/'+(1)+'/'+(date.getFullYear()+1).toString().substr(2,2));
					}
				}

				// Any other week in the month
				return ((date.getMonth() + 1) + '/' + (date.getDate() + 1) + '/' +  date.getFullYear().toString().substr(2,2));

				// // If Week: Monday-Sunday

				// var end = endDate(date.getFullYear(),date.getMonth());
				
				// // If the week of the end date doesn't have the same month as the inserted date, then need to do some manuevering
				// if(!(end.getDate()==date.getDate())&&(end.getMonth()==date.getMonth())&&(end.getFullYear()==date.getFullYear())){
				// 	// If it's January
				// 	if(!(date.getMonth()==0)){
				// 		var end = endDate(date.getFullYear(),(date.getMonth()-1));
				// 	}
				// 	else{
				// 		var end = endDate((date.getFullYear()-1),11);
				// 	}
					
				// 	return ((end.getMonth() + 1) + '/' + (end.getDate() - (end.getDay() - 1)) + '/' +  date.getFullYear().toString().substr(2,2));
				// }
				// else{
				// 	return ((date.getMonth() + 1) + '/' + (date.getDate() - 6) + '/' +  date.getFullYear().toString().substr(2,2));
				// }
			}

			// if TWTFSat
			else{
				
				// Any other week in the month
				if ((date.getDate() - (date.getDay() - 1))>0){
					return ((date.getMonth() + 1) + '/' + (date.getDate() - (date.getDay() - 1)) + '/' +  date.getFullYear().toString().substr(2,2));
				}
				
				// 1st week of the month
				else{
					// if December
					if(date.getMonth() == 11){
						var end = endDate((date.getFullYear()+1),0);	
					}

					else{
						var end = endDate(date.getFullYear(),(date.getMonth()-1));	
					}
					return ((end.getMonth() + 1)+ '/' + (end.getDate() - (end.getDay() - 1)) + '/' + end.getFullYear().toString().substr(2,2));
				}
			}
		}

		// c. mm/dd/yyyy String for all data - later used as the label for the line graphs
		function dateToString(date){
			return ((date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear().toString().substr(2,2));
		}

	/**
	B. Line Graphing
	**/
		// NOTE: This section is mostly hard coded by restricting the graph to three lines
		// Hopefully, functions will be created to allow greater scalability
		// 1. scaleColors() - makes a range of colors based on the size of the selectedVenues
		//
		// NOTE2: A lot of this hardcoding was then abandoned in favor of finding a total graph for all of the data
		//
		// a. Graphs the data for up to 3 Selected Venues by Week
		function lineGraph(){
			if(!(selectedVenues.length===0)||firstGraph){
				// Order the Data
				lineGraphData.reverse();    	

				// Create X-Axis Labels (Weeks)
			    var weekLabels = createLabel();

			    // Create Array of Lines
			    var lines = createTotalLines();

			    // Make Legend
			    if(selectedVenues.length > 1 && selectedVenues.length != parties.length){
			    	var legendNames = ["Total", "Average Venue"];
					var colors = ["#000000", "#ff0000"];
				    createLegend(colors, legendNames);
				}
				else{
					var legendNames = ["Total"];
					var colors = ["#000000"];
					createLegend(colors, legendNames);
				}

			    // 1. Credits Bid Graph
					var canvas = document.getElementById('line-graph-1');
			    	var ctx = canvas.getContext('2d');

			    	var startingData = {
			      		labels: weekLabels,
			      		datasets: lines[0]
				    }

				    var myLineGraph = new Chart(ctx).Line(
				    	startingData, {
			            responsive : true
			        });

			    // 2. Revnue Graph
			        var canvas2 = document.getElementById('line-graph-2');
			    	var ctx2 = canvas2.getContext('2d');  	

			    	var startingData2 = {
			      		labels: weekLabels,
			      		datasets: lines[1]
				    }

				    var myLineGraph2 = new Chart(ctx2).Line(
				    	startingData2, {
			            responsive : true
			        });

			    // 3. Songs Bid Graph
			        var canvas3 = document.getElementById('line-graph-3');
			    	var ctx3 = canvas3.getContext('2d');  	

			    	var startingData3 = {
			      		labels: weekLabels,
			      		datasets: lines[2]
				    }

				    var myLineGraph3 = new Chart(ctx3).Line(
				    	startingData3, {
			            responsive : true
			        });

			        firstGraph = false;
			}

			// There Are NO Venues Selected
			else{
				colors = [];
				createLegend();

			    // Display Alert Message - 
				$('#lineGraph-container').remove();
				var lAlert = document.getElementById("no-venues-in-graph");
	    		lAlert.style.display = "block";

	    		firstGraph = false;
			}
	    };

	/**
	C. Create Labels
	**/
	    // b. Creates the Week-Based Labels for All of the Graphs
	    // TODO: weed out "N/A" labels
	    // if ...['week'] == "N/A", skip it
	    function createLabel(){
	    	var labels = new Array();
	    	var noData = "N/A";
	    	lineGraphStartLabel = 0;
	    	var j = 0;

	    	while(noData.localeCompare(lineGraphData[j]['total']['week'])===0){
	    		j++;
	    		lineGraphStartLabel++;
	    	}
	 
	    	
	    	for(var i = 0; i<(lineGraphData.length-lineGraphStartLabel); i++){
	    		labels[i] = lineGraphData[i+lineGraphStartLabel]['total']['week'];
	    	}
	    	
	    	return labels;
	    }

    /**
    D. Total Lines
    **/

	    function createTotalLines(){

	    	var dataTotal = new Array();
	    	var dataTotal2 = new Array();
	    	var dataTotal3 = new Array();
	    	var dataPerVenue = new Array();
	    	var dataPerVenue2 = new Array();
	    	var dataPerVenue3 = new Array();
	    	venuesEachWeek = new Array();
			venuesTotal = new Array();

			for(var i = 0; i<(lineGraphData.length-lineGraphStartLabel); i++){
				dataTotal[i] = lineGraphData[i+lineGraphStartLabel]['total']['revenue'];
				
				venuesEachWeek[i] = new Array();

				for(var j = 0; j<selectedVenues.length; j++){
					// if data is defined for a partyid in a given week, add it to the venues in that week
					if(lineGraphData[i+lineGraphStartLabel][selectedVenues[j]] != undefined){
						venuesEachWeek[i].push(selectedVenues[j]);
						
						// add that partyid to the rest of the weeks in venuesTotal
						for(var k = i; k<(lineGraphData.length-lineGraphStartLabel); k++){
							if(venuesTotal[k] === undefined){
								venuesTotal[k] = new Array();
							}
							if(venuesTotal[k].indexOf(selectedVenues[j]) === -1){
								venuesTotal[k].push(selectedVenues[j]);
							}
						}


					}

				}

				// for(var j = 0; j<selectedVenues.length; j++){
				// 	if(venuesTotal.indexOf(selectedVenues[j]) === -1){
				// 		venuesTotal[i].push(selectedVenues[j]);
				// 	}
				// }

				var numVenues = venuesTotal[i].length;

				dataPerVenue[i] = dataTotal[i]/numVenues;
				
				dataTotal2[i] = lineGraphData[i+lineGraphStartLabel]['total']['creditsUsed'];
				dataPerVenue2[i] = dataTotal2[i]/numVenues;
				
				dataTotal3[i] = lineGraphData[i+lineGraphStartLabel]['total']['numBidSongs'];
				dataPerVenue3[i] = dataTotal3[i]/numVenues;
			}

			

			// Limit the Revenue Data to 2 decimal places
	    	var x = 0;
	    	var len = dataTotal.length
	    	while(x < len){ 
	    		dataTotal[x] = dataTotal[x].toFixed(2);
	    		dataPerVenue[x] = dataPerVenue[x].toFixed(2); 
	    		dataPerVenue2[x] = dataPerVenue2[x].toFixed(0); 
	    		dataPerVenue3[x] = dataPerVenue3[x].toFixed(0); 
	    		x++
	    	}

		    var line1 = blackTotalLines(dataTotal,dataPerVenue);
		    var line2 = blackTotalLines(dataTotal2,dataPerVenue2);
		    var line3 = blackTotalLines(dataTotal3,dataPerVenue3);

		    return [line1,line2,line3];
	    }

	    function blackTotalLines(dataTotal,dataPerVenue){
	    	var lineTotal = {
					  fillColor: "rgba(0,0,0,0.1)",
		              strokeColor: "rgba(0,0,0,1)",
		              pointColor: "rgba(0,0,0,1)",
		              pointStrokeColor: "#fff",
		              data: dataTotal
		          	};
		    if(selectedVenues.length > 1 && selectedVenues.length != parties.length){
			    var linePerVenue = {
						  fillColor: "rgba(255,0,0,0.1)",
			              strokeColor: "rgba(255,0,0,1)",
			              pointColor: "rgba(255,0,0,1)",
			              pointStrokeColor: "#fff",
			              data: dataPerVenue
			    		};
		  	}
		  	else{
		  		var linePerVenue = {
						  fillColor: "rgba(255,0,0,0.1)",
			              strokeColor: "rgba(255,0,0,1)",
			              pointColor: "rgba(255,0,0,1)",
			              pointStrokeColor: "#fff",
			              data: null 
	          			};
		  	}

		    return [lineTotal, linePerVenue];
	    }

	/**
    E. Lines By Venue
    **/
	    // These are functions for when VENUES will be graphed The above functions just graph 
	    // the TOTAL. Maybe, we will allow the user to chose specific venues (up to 3 for now)
	    // to compare within a GROUP
	    function createLines(){
	    	// By Venue
	    	var data = new Array();
	    	var data2 = new Array();
	    	var data3 = new Array();
	    	
	    	// // Totals
	    	// var dataTotal = new Array();
	    	// var dataTotal2 = new Array();
	    	// var dataTotal3 = new Array();

	    	for(i = 0; i<selectedVenues.length; i++){
	    		
	    		if(data[i] === undefined){
	    			data[i] = new Array();
	    		}

	    		if(data2[i] === undefined){
	    			data2[i] = new Array();
	    		}

	    		if(data3[i] === undefined){
	    			data3[i] = new Array();
	    		}

	    		for(j = 0; j<(lineGraphData.length-lineGraphStartLabel); j++){
	    			// By Venue
	    			data[i][j] = lineGraphData[j+lineGraphStartLabel][selectedVenues[i]]['revenue'].toFixed(2);
	    			data2[i][j] = lineGraphData[j+lineGraphStartLabel][selectedVenues[i]]['creditsUsed'];
	    			data3[i][j] = lineGraphData[j+lineGraphStartLabel][selectedVenues[i]]['numBidSongs'];

	    			// // Totals
	    			// dataTotal[j] += data[i][j];
	    			// dataTotal2[j] += data2[i][j];
	    			// dataTotal3[j] += data3[i][j];
	    		}
	    	}

		    var lines1 = rgbLines(data);
		    var lines2 = rgbLines(data2);
		    var lines3 = rgbLines(data3);

		    return [lines1,lines2,lines3];
	    }

	    // d. Creates up to 3 lines of data - 1. Red 2. Green 3. Blue
	    function rgbLines(data){
	    	var lineA = {
					  fillColor: "rgba(255,0,0,0.1)",
		              strokeColor: "rgba(255,0,0,1)",
		              pointColor: "rgba(255,0,0,1)",
		              pointStrokeColor: "#fff",
		              data: data[0]
		          	};
		    var lineB = {
		              fillColor: "rgba(0,255,0,0.1)",
		              strokeColor: "rgba(0,255,0,1)",
		              pointColor: "rgba(0,255,0,1)",
		              pointStrokeColor: "#fff",
		              data: data[1]
		          	};
		    var lineC = {
		          	  fillColor: "rgba(0,0,255,0.1)",
		              strokeColor: "rgba(0,0,255,1)",
		              pointColor: "rgba(0,0,255,1)",
		              pointStrokeColor: "#fff",
		              data: data[2]	
		          	}

		    return [lineA,lineB,lineC];
	    }

    /**
    F. Legend
    **/
    	//This is the legend if one choses to use the 3 lines method
    	// e. Creates a Rudimentary Legend for the Data based on Venues that have been selected in the Table
    	function createLegend(colors, legendNames){
    		$('#legend-modal-content').empty()
    		if(colors != undefined){
    			for(var i = 0; i < colors.length; i++){
 					$('#legend-modal-content').append('<h4 style="color: white; background-color:'+colors[i]+';">'+legendNames[i]+'</h4>');   		
    			}
    		}
    	}

};