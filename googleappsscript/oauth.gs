// configure the service
function getStravaService() {
  return OAuth2.createService('Strava')
    .setAuthorizationBaseUrl('https://www.strava.com/oauth/authorize')
    .setTokenUrl('https://www.strava.com/oauth/token')
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('activity:read_all');
}

// handle the callback
function authCallback(request) {
  var stravaService = getStravaService();
  var isAuthorized = stravaService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}

// configure the Withings service
function getWithingsService() {
  return OAuth2.createService('Withings')
    .setAuthorizationBaseUrl('https://account.withings.com/oauth2_user/authorize2')
    .setTokenUrl('https://wbsapi.withings.net/v2/oauth2')
    .setClientId(WITHINGS_CLIENT_ID)
    .setClientSecret(WITHINGS_SECRET)
    .setCallbackFunction('withingsAuthCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('user.info,user.metrics,user.activity');
}

// handle the Withings callback
function withingsAuthCallback(request) {
  var withingsService = getWithingsService();
  var isAuthorized = withingsService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}
