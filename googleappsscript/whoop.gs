function whoopRequest(url, payload, listName) {
  var service = getService();
  if (!service.hasAccess()) {
    var authorizationUrl = service.getAuthorizationUrl();
    var msg = 'Open the following URL and re-run the script: ' +
      authorizationUrl;
    if (typeof EMAIL === 'undefined') {
      var EMAIL = Session.getActiveUser().getEmail();
    }
    if (!EMAIL) throw new Error('Set "EMAIL" if necessary\n\n' + msg); 
    MailApp.sendEmail(EMAIL,
      'NEED AUTHENTICATION: Google App Script for Withings API', msg);
    throw new Error(msg);
  }
  var options = {
    headers: {
      Authorization: 'Bearer ' + service.getAccessToken()
    },
    payload: payload
  };
  var response = UrlFetchApp.fetch(url, options);
  var result = JSON.parse(response.getContentText());
  var mainList = [];
  while(true){
    if (!('status' in result) || result['status'] != 0){
      throw new Error('Withings API returns wrong status: \n' + response);
    }
    mainList = mainList.concat(result['body'][listName]);
    if(result['body']['more']){
      options['payload']['offset'] = result['body']['offset'];
      response = UrlFetchApp.fetch(url, options);
      result = JSON.parse(response.getContentText());
      continue;
    }
    break;
  }
  return mainList;
}

var WHOOP_ACCESS_TOKEN;
var WHOOP_REFRESH_TOKEN;
var WHOOP_USER_ID;

function whoopRequest(startdate, enddate) {
  if(!WHOOP_REFRESH_TOKEN) {
    var credentials = whoopAuth();
    WHOOP_ACCESS_TOKEN = credentials.access_token;
    WHOOP_REFRESH_TOKEN = credentials.refresh_token;
    WHOOP_USER_ID = credentials.user.id;
    Logger.log('Done creds');
  }


  var start = startdate + 'T00:00:00.000Z';
  var end = enddate + 'T23:59:59.999Z';
  var url = WHOOP_URL + 'users/' + WHOOP_USER_ID + '/cycles?end=' + end + '&start=' + start;

  var options = {
    headers: {
      "Authorization":"Bearer "+WHOOP_ACCESS_TOKEN
    }
  };

  var response = UrlFetchApp.fetch(url, options);
  var result = JSON.parse(response.getContentText());


  Logger.log('Done data fetch');

  return(result);



}

function whoopAuth() {
  var authurl = 'https://api-7.whoop.com/oauth/token';
  var body = {
    "username": WHOOP_USER,
    "password": WHOOP_PASS,
    "grant_type": "password",
    "issueRefresh": "false"
  }
  var options = {
    contentType: "application/json",
    payload: body
  };

  var response=UrlFetchApp.fetch(authurl,{'method':'POST','contentType': 'application/json', 'payload':JSON.stringify(body)});
  //var response = UrlFetchApp.fetch(authurl, options);
  var result = JSON.parse(response.getContentText());
  return result;

}