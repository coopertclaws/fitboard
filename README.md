This code can be used as a starting point for getting various health and fitness sensors into a Google Sheets worksheet. All the clever stuff is from bits I've pinched from other people (see acknowledgements) and hacked to my own purposes. It works for my specific use case but there are many parts that are likely to be horrendously inefficient so see how you go.

The googleappsscript files go into the apps script section of your gsheets project. Update the parameters in secret.gs with the relevant OAuth secret / client IDs for the services that you use. Main code is in Code.gs.

For Strava and Withings you'll need to set up your client application and redirect URL. See links in acknowledgements file for some good guides on this.

The python folder is basically a desktop (or hosted) app that I run once a day to update the same Google Sheet with MyFitnessPal data. It uses Google service account credentials for authorisation.

