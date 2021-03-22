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
eventEndTime.setDate(eventEndTime.getDate() + 15);
// eventEndTime.setTime(eventEndTime.getTime() + 604800000);

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
    // searchEndTime.setTime(searchEndTime.getTime() + timeInt);
    // searchStartTime.setHours(8)

    const mSecondCoeff = 1000 * 60 * 60 * 24;
    const searchDays = (eventEndTime - eventStartTime);
    var viewTimeEnd = new Date();
    // Recursive Function to create new available time slots for each day
    function freeDaySearch(viewTime, arrIndex) {
      // console.log(arrIndex + '+')
      var viewTimeStart = new Date(viewTime);

      // console.log(eventEndTime.toString());

      if ((viewTimeStart.getTime() )>= eventEndTime.getTime() || arrIndex > newArr.length - 1) {
        return; //Cancel the recursion given my preffered work hours
      }

      var testArrDateStart = new Date(newArr[arrIndex].start);
      var testArrDateEnd = new Date(newArr[arrIndex].end);

      console.log(viewTimeStart.getDate() < testArrDateStart.getDate())
      console.log(viewTimeStart.getDate().toString())
      console.log(testArrDateStart.getDate().toString())

      if (viewTimeStart.getTime() <= testArrDateStart.getTime()) { 
        if (viewTimeStart.getTime() + timeInt <= testArrDateStart.getTime() && viewTimeStart.getHours() !==0) {
          viewTimeEnd.setTime(viewTimeStart.getTime() + timeInt);
          availableTimeArr.push({
            start: viewTimeStart.toString(),
            end: viewTimeEnd.toString(),
          });
          if((viewTimeEnd.getHours() >= 21 || viewTimeStart.getHours() == 0 )){
            if(viewTimeStart.getHours() !== 0){ // Catches all day events
              viewTimeStart.setDate(viewTimeStart.getDate() + 1);
            }
            viewTimeStart.setHours(8) //Set it to search new day at my preffered time ... 8am
            viewTimeStart.setTime(viewTimeStart.getTime() - timeInt); //correct day search my time int 8:30 vs 8am
          //   // // console.log(arrIndex);
            console.log(viewTimeStart.toString())
          //   // if(viewTimeStart.getDate().toString() < testArrDateStart.getDate().toString()){
          //   //   console.log('X')
              // arrIndex = -1;
          //   // }
          return freeDaySearch(viewTimeStart, arrIndex); // New Day search recursion
          }  
            console.log(viewTimeStart.toString())

            console.log(arrIndex + 'B');
          return freeDaySearch(viewTimeEnd, arrIndex); // Recursion after new object creation
        } else {
          console.log(viewTimeStart.toString())

          console.log(arrIndex + 'C');

          return freeDaySearch(newArr[arrIndex].end, arrIndex + 1); // Recursion if there is not enough space in a possible window
        }
      } else  {
        console.log(arrIndex + 'D');

        return freeDaySearch(newArr[arrIndex].end, arrIndex + 1); // recursion if the start time is after the new Array (meetings) Obj
      }
     
    }

    freeDaySearch(searchStartTime, 0);
    // console.log(newArr);
    console.log(availableTimeArr);
    // console.log(newArr.length);
    // console.log(newArr);
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
