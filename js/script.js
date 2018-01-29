/**
 * Create wanted element.
 * 
 * @param {string} element - Wanted element to be created.
 */
function createNode(element) {
  return document.createElement(element);
}

/**
 * Append given element to parent.
 * 
 * @param {object} parent - Parent element where to append child.
 * @param {object} el - Child element which is appended to parent.
 */
function append(parent, el) {
  return parent.appendChild(el);
}

/**
 * Return json time converted to Date object.
 * 
 * @param {string} jsonTime - Json time as string.
 */
function toLocalTime(jsonTime) {
  let normalDate = new Date(jsonTime);
  return normalDate;
}

/**
 * Convert given Date object into string value of hours and minutes.
 * 
 * @param {object} time - Date object where the hours and minutes are get.
 */
function toHHMM(time) {
  let hours = time.getHours().toString();
  let minutes = time.getMinutes().toString();
  hours = addZeroes(hours);
  minutes = addZeroes(minutes);
  return hours + ':' + minutes;
}

/**
 * Add ascending zeroes to time string.
 * 
 * @param {string} value - Value where the zeroes are added to.
 */
function addZeroes(value) {
  if (value.length < 2) {
    return '0' + value;
  } else {
    return value;
  }
}

/**
 * Compare two time values for sorting.
 * 
 * @param {object} a - Object of the array.
 * @param {object} b - Object of the array.
 */
function sortByTime(a, b) {
  return a.time - b.time;
}

/**
 * Keep track of time.
 */
function clock() {
  var time = new Date(),
    hours = time.getHours(),
    minutes = time.getMinutes(),
    seconds = time.getSeconds();

  document.getElementById('clock').innerHTML = '<h2>' + harold(hours) + ':' + harold(minutes) + ':' + harold(seconds) + '</h2>';
  function harold(standIn) {
    if (standIn < 10) {
      standIn = '0' + standIn;
    }
    return standIn;
  }
}
setInterval(clock, 100);

// Declare a div where all station specific content is added.
const stationContentDiv = document.getElementById('stationContent');

// Declare ul where all the stations are listed.
const stationsUl = document.getElementById('stations');

// Declare input element where user input is stored.
const searchInput = document.getElementById('searchInput');

// Declare URL where the stations are get from.
const stationsURL = 'https://rata.digitraffic.fi/api/v1/metadata/stations';

// Declare current time in JSON time.
const currentJSONTime = new Date().toJSON();

// Add input listener for HTML input element where the user searches for specific station.
searchInput.addEventListener('keyup', () => {
  var input, filter, ul, li, a, i;
  input = document.getElementById('searchInput');
  filter = input.value.toUpperCase();
  ul = document.getElementById('stations');
  li = ul.getElementsByTagName('li');

  // Loop through all list items, and hide those who don't match the search query.
  for (i = 0; i < li.length; i++) {
    a = li[i].getElementsByTagName('a')[0];
    if (a.innerHTML.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = '';
    } else {
      li[i].style.display = 'none';
    }
  }
});

/**
 * Fetche all the stations from the url and fills dropdown menu with stations each
 * having own anchor and li. Append lis and anchors into dropdown menu list.
 */
fetch(stationsURL)
  .then((response) => response.json())
  .then(function(data) {
    data.forEach(function(station) {

      // Use station only if it has passenger traffic.
      if (station.passengerTraffic === true) {

        // Url for 15 trains from user chosen station.
        let trainsURL = 'https://rata.digitraffic.fi/api/v1/live-trains?' + 
        'arrived_trains=0&arriving_trains=15&' +
        'departed_trains=0&departing_trains=15&' +
        'station=' + station.stationShortCode;

        // Declare anchor to represent station. Add station name to anchor.
        let stationLi = createNode('li');
        let anchor = createNode('a');
        anchor.href = `#${station.stationName}`;
        anchor.innerHTML = `${station.stationName}`;

        // Adds listener for each anchor. If clicked fills stationContent with data.
        anchor.addEventListener('click', (event) => {
          event.preventDefault();
          getStationContent(station, trainsURL);
        });
        append(stationLi, anchor);
        append(stationsUl, stationLi);
      }
    });
  }).catch((error) => console.log(error));

/**
 * Fetch data from the arriving and departing trains of wanted station. Fill two
 * tables: Arriving trains and Departing trains with information of each train. This
 * data is sorted by time. Add the two tables into HTML.
 * 
 * @param {object} station - Object that has station's data in it, fetched from API.
 * @param {string} url - URL to fetch data from wanted station.
 */
function getStationContent(station, url) {

  // Place station name to station content div as header.
  stationContentDiv.innerHTML = `<h2>${station.stationName}</h2>`;
  fetch(url)
    .then((response) => response.json())
    .then(function(data) {

      // Declare ARRIVING train array.
      let arrivingTrains = createTrainArray(data, station.stationShortCode, 'ARRIVAL');
      // Sort ARRIVING train array by time.
      arrivingTrains.sort(sortByTime);

      // Declare DEPARTING train array.
      let departingTrains = createTrainArray(data, station.stationShortCode, 'DEPARTURE');
      // Sort DEPARTING train array by time.
      departingTrains.sort(sortByTime);

      // Add data from arrays into HTML.
      addToHTML(arrivingTrains, 'Arriving');
      addToHTML(departingTrains, 'Departing');
    }).catch((error) => console.log(error));
}

/**
 * Creates array of Train objects based on fetched data from the station. Check that the train
 * in question has VR as its operator and the train is either Long-distance or Commuter. Creates
 * new object Train from each train gathered from data. Pushe the train into array based on direction.
 * Return array.
 * 
 * @param {object} data 
 * @param {string} stationShortCode - Shortcode for station name e.g "Seinäjoki" = "SK".
 * @param {string} direction - Direction of the train. ARRIVING or DEPARTING.
 */
function createTrainArray(data, stationShortCode, direction) {
  let trainArray = [];
  data.forEach(function(train) {
    if (train.operatorShortCode === 'vr' && (train.trainCategory === 'Long-distance' || train.trainCategory === 'Commuter')) {
      let newTrain = new Train(train.trainNumber,
        train.trainType,
        train.trainCategory,
        stationShortCode,
        train.timeTableRows,
        direction);
      if (newTrain.time !== 'unavailable') {
        switch(direction) {
        case 'ARRIVAL':
          trainArray.push(newTrain);
          break;
        case 'DEPARTURE':
          trainArray.push(newTrain);
          break;
        }
      }
    }
  });
  return trainArray;
}

/**
 * Add Train object into wanted tables based on the direction parameter.
 * 
 * @param {object[]} trainArray - Array of Train objects.
 * @param {string} direction - Direction of the Train objects in array.
 */
function addToHTML(trainArray, direction) {

  // Declare table where Trains are added to.
  let trainsTable = createNode('table');

  // Give table header based on direction.
  trainsTable.innerHTML = `<h3>${direction} trains</h3>`;

  // Declare table row headers.
  let trHeaders = createNode('tr');
  trHeaders.innerHTML = '<th>Type</th><th>Time</th><th>Track</th>';

  append(trainsTable, trHeaders);

  /**
   * Create new table row for each train in the array. Build data
   * into the table row inner HTML based on data found in Train object.
   * Append newly created table row into table.
   */
  for (let item of trainArray) {
    let trainInfo = createNode('tr');
    trainInfo.innerHTML = buildData(item);
    append(trainsTable, trainInfo);
  }
  append(stationContentDiv, trainsTable);
}

/**
 * Build string with data from a single Train object.
 * 
 * @param {object} train - Train object where data is gathered.
 */
function buildData(train) {
  return '<td>' + train.type +
    ' ' + train.number + '</td>' +
    '<td>' + toHHMM(train.time) + '</td>' +
    '<td>' + train.track + '</td>';
}

/**
 * Create new Train object which is constructed from fetched API data.
 * 
 * @param {string} trainNumber - Number of the train.
 * @param {string} trainType - Type of the train e.g "InterCity" = "IC".
 * @param {string} trainCategory - Category of the train "Long-Distance" or "Commuter".
 * @param {string} stationShortCode - Shortcode for station name e.g "Seinäjoki" = "SK".
 * @param {object} timeTableRows - Object containing data from train's timetables.
 * @param {string} direction - Direction of the train e.g "ARRIVING".
 */
function Train(trainNumber, trainType, trainCategory, stationShortCode, timeTableRows, direction) {
  this.number = trainNumber;
  this.type = trainType;
  this.category = trainCategory;
  this.direction = direction;
  this.time = getTrainScheduleAndTrack(direction, stationShortCode, timeTableRows)[0];
  this.track = getTrainScheduleAndTrack(direction, stationShortCode, timeTableRows)[1];
}

/**
 * Get train ARRIVAL or DEPARTURE time and track as array containing two cells.
 * 
 * @param {string} direction - Direction of the train.
 * @param {string} stationShortCode - Shortcode for station name e.g "Seinäjoki" = "SK".
 * @param {object} timeTableRows - Object containing data from train's timetables.
 */
function getTrainScheduleAndTrack(direction, stationShortCode, timeTableRows) {

  // Declare info array with two cells.
  let scheduleInfo = ['unavailable', 'unavailable;'];
  for(let element of timeTableRows) {
    if (element.stationShortCode === stationShortCode &&
      element.type === direction &&
      element.scheduledTime > currentJSONTime &&
      element.scheduledTime != null &&
      element.commercialTrack != null) {

      // If conditions met. Add time info to array cell one and track to cell two.
      scheduleInfo[0] = toLocalTime(element.scheduledTime);
      scheduleInfo[1] = element.commercialTrack;
      return scheduleInfo;
    }
  }
  return scheduleInfo;
}