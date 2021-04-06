const { google } = require("googleapis");
const { OAuth2 } = google.auth;
const sensitiveInfo = require("./gCalApiAccess.js").sensitiveInfo;
const allCalendars = require("./gCalApiAccess.js").allCalendars;
const oAuth2Client = new OAuth2(
  sensitiveInfo.clientId, // Client ID - from google developer API Auth
  sensitiveInfo.clientSecret // Client Secret - from google developer API Auth
);

oAuth2Client.setCredentials({
  access_token: sensitiveInfo.access_token,
  refresh_token: sensitiveInfo.refreshToken, // refresh token - from google developer API Auth playground
});

const calendar = google.calendar({ version: "v3", auth: oAuth2Client }); //Creating new calendar instance

// Search time initialization
var eventStartTime = new Date(); 
  eventStartTime.setDate(eventStartTime.getDate());
var eventEndTime = new Date();
  eventEndTime.setDate(eventEndTime.getDate() + 2);


// Google calendar api query request
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

    var timeInt = 1800000; // Meeting Minutes (30 min) in 
    timeInt *= 1; // Convert to 1hr meeting minutes
    var availableTimeArr = []; //Free Time array to show
    var searchStartTime = new Date();
      searchStartTime.setDate(searchStartTime.getDate());
    var viewTimeEnd = new Date();

    // Recursive Function to create new available time slots for each day
    function freeDaySearch(viewTime, arrIndex) {
      var viewTimeStart = new Date(viewTime);

      if (
        viewTimeStart.getTime() >= eventEndTime.getTime() ||
        arrIndex > newArr.length - 1
      ) {
        return; //Exit Recursion if the search time goes beyond the query end or when the array index goes beyond the real size
      }

      var testArrDateStart = new Date(newArr[arrIndex].start); // Initilize the busy array's start time

      if (viewTimeStart.getHours() >= 20 || viewTimeStart.getHours() == 0) {
        // Check for end of day boundary
        if (viewTimeStart.getHours() !== 0) {
          // Catches all-day events
          viewTimeStart.setDate(viewTimeStart.getDate() + 1); // Set search time to next day if at the end of the day
        }
        viewTimeStart.setHours(8); //Set it to search time to my preferred start time ... 8am
        viewTimeStart.setTime(viewTimeStart.getTime() - timeInt); //correct day search my time int 8:30 vs 8am
        return freeDaySearch(viewTimeStart, arrIndex); // New Day search recursion
      }

      if (viewTimeStart.getTime() <= testArrDateStart.getTime()) {
        if (
          viewTimeStart.getTime() + timeInt <= testArrDateStart.getTime() &&
          viewTimeStart.getHours() !== 0
        ) {
          viewTimeEnd.setTime(viewTimeStart.getTime() + timeInt);
          availableTimeArr.push({
            start: viewTimeStart.toString(),
            end: viewTimeEnd.toString(),
          });
          return freeDaySearch(viewTimeEnd, arrIndex); // Recursion after new object creation
        } else {
          return freeDaySearch(newArr[arrIndex].end, arrIndex + 1); // Recursion if there is not enough space in a possible window
        }
      } else {
        return freeDaySearch(newArr[arrIndex].end, arrIndex + 1); // recursion if the start time is after the new Array (meetings) Obj
      }
    }

    freeDaySearch(searchStartTime, 0);
    console.log(availableTimeArr);
  }
);

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
