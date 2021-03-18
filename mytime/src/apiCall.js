const { google } = require("googleapis");
const { OAuth2 } = google.auth;

const sensitiveInfo = require("./gCalApiAccess.js").sensitiveInfo;
const allCalendars = require("./gCalApiAccess.js").allCalendars;

const oAuth2Client = new OAuth2(
  sensitiveInfo.clientId, // Client ID - from google developer API Auth
  sensitiveInfo.clientSecret // Client Secret - from google developer API Auth
);

oAuth2Client.setCredentials({
  refresh_token: sensitiveInfo.refreshToken, // refresh token - from google developer API Auth
});

const calendar = google.calendar({ version: "v3", auth: oAuth2Client }); //Creating new calendar instance

var eventStartTime = new Date();
eventStartTime.setDate(eventStartTime.getDate());
// console.log(eventStartTime);

var eventEndTime = new Date();
eventEndTime.setDate(eventEndTime.getDate() + 1);

// Event Creation
// const event = {
//   summary: "Meet with Stephan",
//   location: "295 California St, San Fransisco, CA 94111",
//   colorId: 1,
//   description: "Meeting with Stephan to set a deadline for this google cal api app",
//   start: {
//     dateTime: eventStartTime,
//     timeZone: "America/Toronto",
//   },
//   end: {
//     dateTime: eventEndTime,
//     timeZone: "America/Toronto",
//   },
// }

// Check for conflicts
calendar.freebusy.query(
  {
    resource: {
      timeMin: eventStartTime,
      timeMax: eventEndTime,
      timeZone: "America/Toronto",
      items: allCalendars, // array of all calendar ID's
    },
  },
  (err, res) => {
    if (err) return console.error("Free Busy Query Error: ", err);

    var newArr = []; // Initialize a new array for grouped calendars

    for (const [key, value] of Object.entries(res.data.calendars)) {
      //get the calendar key from the response body
      checkBusyCal(value.busy);
    }

    // Adding each calendar together, as objects
    function checkBusyCal(busyArr) {
      if (busyArr !== 0) {
        busyArr.forEach((index) =>
          newArr.push({ start: index.start, end: index.end })
        );
      }
    }

    // Sorting all grouped calendar event's in chronological order
    newArr.sort(function (timeObject1, timeObject2) {
      if (timeObject1.start < timeObject2.start) {
        return -1;
      }
      if (timeObject1.start > timeObject2.start) {
        return 1;
      }
      return 0;
    });
    // console.log(newArr); //log a sorted array for all Calendars
    // return freeSlots(eventStartTime, res.data.calendars[allCalendars[4].id].busy)

    const timeInt = 1800000; // Meeting Minutes (30 min) in miliseconds
    var availableTimeArr = []; //Free Time array to show
    var searchStartTime = new Date(),
      searchEndTime = new Date();

    searchStartTime.setDate(searchStartTime.getDate());
    searchEndTime.setTime(searchEndTime.getTime() + timeInt);
    // searchStartTime.setHours(8)

    // Recursive Function to create new available time slots for each day
    function freeDaySearch(viewTime, arrIndex) {
      var testArrDateStart = new Date(newArr[arrIndex].start);
      var testArrDateEnd = new Date(newArr[arrIndex].end);
      var viewTimeStart = new Date(viewTime);
      var viewTimeEnd = new Date();

      if (viewTimeStart.getHours() >= 21 || viewTimeStart.getHours() < 8) {
        return; //Cancel the recursion given my preffered work hours
      }

      if (viewTimeStart.getTime() <= testArrDateStart.getTime()) { 
        if (viewTimeStart.getTime() + timeInt < testArrDateStart.getTime()) {
          viewTimeEnd.setTime(viewTimeStart.getTime() + timeInt);
          availableTimeArr.push({
            start: viewTimeStart.toString(),
            end: viewTimeEnd.toString(),
          });
          return freeDaySearch(viewTimeEnd, arrIndex + 1);
        } else {
          return freeDaySearch(newArr[arrIndex].end, arrIndex + 1);
        }
      } else {
        return freeDaySearch(newArr[arrIndex].end, arrIndex + 1);
      }
    }
    freeDaySearch(searchStartTime, 0);
    console.log(availableTimeArr);
  }

);
