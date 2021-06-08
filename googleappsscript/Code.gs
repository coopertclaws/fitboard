// custom menu
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('Health and Fitness App')
    .addItem('Update Strava Data', 'getStravaActivityData')
    .addItem('Update Withings Data', 'getWithingsData')
    .addItem('Update Whoop Data', 'getWhoopData')
    .addItem('Update Whoop Daily Dashboard', 'getWhoopToday')
    .addItem('Run All', 'runAll')
    .addToUi();
}

// Run All Functions

function runAll() {
  getStravaActivityData();
  getWithingsData();
  getWhoopData();
  getWhoopToday();
}

// Get athlete activity data
function getStravaActivityData() {
  
  // get the sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Strava');

  var range = sheet.getRange(sheet.getLastRow(), 2)
  var lastdate = range.getValue();

  var epochdate = (new Date(lastdate).getTime() / 1000)
  //Logger.log("epoch date is:" + epochdate);


  // call the Strava API to retrieve data
  var data = callStravaAPI(epochdate);
  
  // empty array to hold activity data
  var stravaData = [];
    
  // loop over activity data and add to stravaData array for Sheet
  data.forEach(function(activity) {
    var detailedactivity = callStravaActivityDetailAPI(activity.id);
    //Logger.log('Calories: ' + detailedactivity.calories);

    var arr = [];
    arr.push(
      activity.id,
      activity.start_date_local,
      activity.name,
      activity.type,
      (activity.distance/1609.34),
      activity.suffer_score,
      (activity.average_speed/1609.34*3600),
      (activity.max_speed/1609.34*3600),
      activity.average_heartrate,
      activity.max_heartrate,
      detailedactivity.calories
    );
    stravaData.push(arr);
  });
  
  // paste the values into the Sheet
  if (stravaData.length > 0) {
  sheet.getRange(sheet.getLastRow() + 1, 1, stravaData.length, stravaData[0].length).setValues(stravaData);
  }
}

function getWithingsData() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Weight');

  var range = sheet.getRange(sheet.getLastRow(), 1)
  var lastdate = range.getValue();

  var lastdateonly = lastdate.toDateString(); 

  var epochdate = (new Date(lastdate).getTime() / 1000);
  var epochnextdate = epochdate + 86400;

  var data = callWithingsAPI(epochnextdate);

  var withingsData = [];

  // loop over activity data and add to stravaData array for Sheet
  data.forEach(function(weight) {

    var fulldate = new Date(weight[0]);
    //var fulldate = weight[0];
    var dateonly = fulldate.toDateString();

    var arr = [];
    arr.push(
      dateonly,
      weight[1],
      weight[2],
      weight[3],
      weight[4],
      weight[5],
      weight[6],
      weight[7],
      weight[8]
    );
    withingsData.push(arr);
  });

  // paste the values into the Sheet
  if (withingsData.length > 0) {
  sheet.getRange(sheet.getLastRow() + 1, 1, withingsData.length, withingsData[0].length).setValues(withingsData);
  }

}

function getWhoopData() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Whoop');

  var range = sheet.getRange(sheet.getLastRow(), 1)
  var startdate = range.getValue();

  // Conversion from BST to UTC puts date back by a day so add 26 hours
  // We need next day so add 26 hours (1 day + 2 hours) to datetime
  var startdatetemp = new Date(startdate);
  var startdatetemp = startdatetemp.setHours(startdatetemp.getHours() + 26);
  var startdateiso = new Date(startdatetemp).toISOString().slice(0, 10);

  var today = new Date();
  var yesterday = today.setDate(today.getDate() - 1);
  var enddate = new Date(yesterday).toISOString().slice(0,10);
  // If data is up to date then startdate > enddate
  // Doesn't seem to cause API an issue (returns no data)
  // May need to handle this in the future though

  var data = whoopRequest(startdateiso, enddate);

  var whoopData = [];

  data.forEach(function(result) {

    var arr = [];
    arr.push(
      result.days[0],
      result.recovery.score,
      result.recovery.restingHeartRate,
      result.recovery.heartRateVariabilityRmssd*1000,
      result.strain.kilojoules/4.184,
      result.sleep.sleeps[0].lightSleepDuration/60000,
      result.sleep.sleeps[0].qualityDuration/60000,
      result.sleep.sleeps[0].remSleepDuration/60000,
      result.sleep.sleeps[0].slowWaveSleepDuration/60000,
      result.sleep.sleeps[0].wakeDuration/60000,
      result.sleep.sleeps[0].inBedDuration/60000,
      result.sleep.sleeps[0].latencyDuration/60000
    );
    whoopData.push(arr);
  })

  Logger.log('Done');

  if (whoopData.length > 0) {
  sheet.getRange(sheet.getLastRow() + 1, 1, whoopData.length, whoopData[0].length).setValues(whoopData);
  }

}

function getWhoopToday() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Dashboard');

  var today = new Date();
  var enddate = new Date(today).toISOString().slice(0, 10);
  var yesterday = today.setDate(today.getDate() - 1);
  var startdate = new Date(yesterday).toISOString().slice(0, 10);

  var data = whoopRequest(startdate, enddate);

  var recovery = data[1].recovery.score;
  var rhr = data[1].recovery.restingHeartRate;
  var hrv = data[1].recovery.heartRateVariabilityRmssd*1000

  var range = sheet.getRange("G2");
  range.setValue(recovery);
  var range = sheet.getRange("H2");
  range.setValue(rhr);
  var range = sheet.getRange("I2");
  range.setValue(hrv);  



}
// call the Strava API
function callStravaAPI() {
  
  // set up the service
  var service = getStravaService();
  //Logger.log("Epoch Date is:" + arguments[0]);

  if (service.hasAccess()) {
    Logger.log('App has access.');
        
    var endpoint = 'https://www.strava.com/api/v3/athlete/activities';
    var params = '?after=' + arguments[0] + '&per_page=200';
    //Logger.log(params);

    var headers = {
      Authorization: 'Bearer ' + service.getAccessToken()
    };
    
    var options = {
      headers: headers,
      method : 'GET',
      muteHttpExceptions: true
    };
    
    var response = JSON.parse(UrlFetchApp.fetch(endpoint + params, options));
    return response;  
  }
  else {
    Logger.log("App has no access yet.");
    
    // open this url to gain authorization from Strava
    var authorizationUrl = service.getAuthorizationUrl();
    
    Logger.log("Open the following URL and re-run the script: %s",
        authorizationUrl);
  }
}

// call the Strava Activity Detail API
function callStravaActivityDetailAPI() {
  
  // set up the service
  var service = getStravaService();

  if (service.hasAccess()) {
    Logger.log('Activity Detail has access.');
        
    var endpoint = 'https://www.strava.com/api/v3/activities/';
    var params = arguments[0];
    //Logger.log('Activity Detail for ID: ' + params);

    var headers = {
      Authorization: 'Bearer ' + service.getAccessToken()
    };
    
    var options = {
      headers: headers,
      method : 'GET',
      muteHttpExceptions: true
    };
    
    var response = JSON.parse(UrlFetchApp.fetch(endpoint + params, options));
    Logger.log('URL is:' + endpoint + params);
    return response;  
  }
  else {
    Logger.log("App has no access yet.");
    
    // open this url to gain authorization from Strava
    var authorizationUrl = service.getAuthorizationUrl();
    
    Logger.log("Open the following URL and re-run the script: %s",
        authorizationUrl);
  }
}

// call Withings api via Withings.gs file
function callWithingsAPI() {
  var types = [1, 5, 6, 8, 76, 77, 88];
  var meastypes = types.join(',');
  var url = 'https://wbsapi.withings.net/measure';
  var payload = {
    action: 'getmeas',
    meastypes: meastypes,
    category: '1',
    lastupdate: arguments[0]
  }

  var measuregrps = request(url, payload, 'measuregrps');

  var measures = {}
  measuregrps.forEach(function(measuregrp) {
    var date = measuregrp['date'];
    if (!(date in measures)) {
      measures[date] = {};
    }
    measuregrp['measures'].forEach(function(measure) {
      measures[date][measure['type']] = measure['value'] * (
          10 ** measure['unit']);
    });
  });

  var data = Object.keys(measures).map(function(date) {
    return [getDate(date)].concat(
      types.map(function(t) {
        return measures[date][t];
      })
    )});

  return data;

}


