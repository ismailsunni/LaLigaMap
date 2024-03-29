const footballDataBaseURL = 'https://api.football-data.org/v2/competitions/PD/matches'
const key = '5f7fcfcba01f48fe8916b6b6e1eb81bd'
const stadiumURL = 'https://raw.githubusercontent.com/ismailsunni/LaLigaMap/master/laliga2018stadium.json';

// Match status
const FINISHED = 'FINISHED'
const IN_PLAY = 'IN_PLAY'
const SCHEDULED = 'SCHEDULED'
const PAUSED = 'PAUSED'

// Result / winner
const HOME_TEAM = 'HOME_TEAM'
const AWAY_TEAM = 'AWAY_TEAM'
const DRAW = 'DRAW'

// Accessor
const homeTeam = 'homeTeam'
const awayTeam = 'awayTeam'

// Storage for abstraction
var storage = {
    matches: {},
    currentMatchday: 1,
    currentMatchdayView: 0,
    currentMatch: null,
    stadiums: null,
    map: null,
    stadiumsMarker: [],
    stadiumsMarkerGroup: null,
    currentMatchdayMapView: 0,
}

// Helper function to set a header in a request
function setHeader(xhr) {
    xhr.setRequestHeader('X-Auth-Token', key);
}

// Retrieve matches data for the current season
function getMatches(){
    return $.ajax({
        url: footballDataBaseURL,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            storage.matches = {}
            storage.currentMatchday = response['matches'][0]['season']['currentMatchday'];
            if (storage.currentMatchdayView < 1){
                storage.currentMatchdayView = storage.currentMatchday;
            }
            if (storage.currentMatchdayMapView < 1){
                storage.currentMatchdayMapView = storage.currentMatchday;
            }
            response['matches'].forEach(match => {
                var matchday = match['matchday'];
                if(!(matchday in storage.matches)){
                    storage.matches[matchday] = {};
                }
                storage.matches[matchday][match['id']] = {
                    'id': match['id'],
                    'utcDate': match['utcDate'],
                    'status': match['status'],
                    homeTeam: match[homeTeam],
                    awayTeam: match[awayTeam],
                    'score': {
                        'winner': match['score']['winner'],
                        'halfTime': match['score']['halfTime'],
                        'fullTime': match['score']['fullTime'],
                    }
                };
            })
        },
        error: function(response) {
                console.log('ajax failed');
                console.log(response);
            },
        beforeSend: setHeader
      });
}

// Helper function to convert Date object to string date for easier comparison.
function stringifyDate(dateA){
    return dateA.getFullYear() * 10000 + (dateA.getMonth() + 1) * 100 + dateA.getDate()
}

// Populate the list in the selected match day
function populateMatchesList(matchday){
    // Remove all the previous items
    $('#matchList li').remove();
    var currentMatches = storage.matches[matchday];
    storage['currentMatches'] = currentMatches
    var sortedCurrentMatches = []
    $.each(currentMatches, function(matchID, currentMatch){
        sortedCurrentMatches.push(currentMatch)
    });
    // Sorting the matches based on date time
    sortedCurrentMatches.sort(
        function(a, b){
            return (new Date(a['utcDate']) - new Date(b['utcDate']))
        });
    var dateTimeIterator = new Date('2000-01-01T00:00:00Z')
    $.each(sortedCurrentMatches, function(matchID, currentMatch){
        // Date and Time
        var datetime = new Date(currentMatch['utcDate'])
        var dateFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        var timeFormatOptions = {hour: '2-digit', minute:'2-digit', hour12: false}
        var date = datetime.toLocaleDateString('en-US', dateFormatOptions)
        var time = datetime.toLocaleTimeString('en-US', timeFormatOptions)

        // Score
        var homeTeamScore = 'unknown';
        var awayTeamScore = 'unknown';
        if (currentMatch['status'] === FINISHED){
            homeTeamScore = currentMatch['score']['fullTime'][homeTeam];
            awayTeamScore = currentMatch['score']['fullTime'][awayTeam];
            time = 'FT'
        } else if (currentMatch['status'] === SCHEDULED){
            homeTeamScore = '?';
            awayTeamScore = '?';
        } else if (currentMatch['status'] === IN_PLAY){
            homeTeamScore = currentMatch['score']['fullTime'][homeTeam] + '*';
            awayTeamScore = currentMatch['score']['fullTime'][awayTeam] + '*';
            time = 'Play'
        }  else if (currentMatch['status'] === PAUSED){
            homeTeamScore = currentMatch['score']['fullTime'][homeTeam] + '*';
            awayTeamScore = currentMatch['score']['fullTime'][awayTeam] + '*';
            time = 'HT'
        }

        if (stringifyDate(dateTimeIterator) < stringifyDate(datetime)){
            dateTimeIterator = datetime;
            $('#matchList').append(
            '<li data-role="list-divider">' + date + '</li>'
            )
        }
        

        $('#matchList').append(
            '<li><a href="#" class="matchitem" id=' + currentMatch['id'] + '>' + 
                '<div class="ui-grid-c">' + 
                    '<div class="ui-block-a time-cell">' + 
                        time + 
                    '</div>' + 
                    '<div class="ui-block-b match-cell">' + 
                        '<div class=ui-grid-solo>' + currentMatch[homeTeam]['name'] + '</div>' + 
                        '<div class=ui-grid-solo>' + currentMatch[awayTeam]['name'] + '</div>' + 
                    '</div>' + 
                    '<div class="ui-block-c score-cell">' + 
                        '<div class=ui-grid-solo>' + homeTeamScore + '</div>' + 
                        '<div class=ui-grid-solo>' + awayTeamScore + '</div>' + 
                    '</div>' + 
                '</div>' +
            '</a></li>'
        )
    });
    // Refresh the list (important)
    $('#matchList').listview('refresh');
}

// Shortcut to populate combo box for choosing matchday
function populateComboBox(){
    $('#select-matchday').empty();
    $('#select-matchday-map').empty();
    i = 1;
    while(i <= 38){
        var currentMatchdayString = i;
        if (i == storage.currentMatchday) {
            currentMatchdayString = i + ' (current)'    
        }
        var optionText = '<option value='+ i + '>' + currentMatchdayString +'</option>'
        $('#select-matchday').append(optionText);
        $('#select-matchday-map').append(optionText);
        i++;
    };
    $("#select-matchday").val(storage.currentMatchdayView).change();
    $("#select-matchday-map").val(storage.currentMatchdayView).change();
}

// Event handler for matchday select
$('#select-matchday').on('change', function() {
    storage.currentMatchdayView = this.value
    populateMatchesList(storage.currentMatchdayView);
});

$('#select-matchday-map').on('change', function() {
    storage.currentMatchdayMapView = this.value
    populateStadiumMarkers(storage.currentMatchdayMapView);
});

// Event handler before showing detail page
$(document).on("pagebeforeshow", "#details", function(e){
    // Stop more events
    e.preventDefault(); 

    var currentMatch = storage.currentMatch;
    var score = currentMatch['score']
    var fullTimeScoreString = '? - ?'
    var halfTimeScoreString = '? - ?'
    var winnerString = 'N/A'
    if (currentMatch['status'] != SCHEDULED){
        halfTimeScoreString = score['halfTime'][homeTeam] + ' - ' + score['halfTime'][awayTeam];
        fullTimeScoreString = score['fullTime'][homeTeam] + ' - ' + score['fullTime'][awayTeam];
        winnerString = score['winner'];
    }
    // Status
    var matchStatus = 'N/A'
    if (currentMatch['status'] === IN_PLAY) {
        matchStatus = 'Still playing'
    } else if (currentMatch['status'] === SCHEDULED){
        matchStatus = 'Scheduled'
    } else if (currentMatch['status'] === FINISHED){
        matchStatus = 'Finished'
    } else if (currentMatch['status'] === PAUSED){
        matchStatus = 'Paused'
    }

    // Date and time
    var datetime = new Date(currentMatch['utcDate'])
    var dateFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    var timeFormatOptions = {hour: '2-digit', minute:'2-digit', hour12: false}
    var date = datetime.toLocaleDateString('en-US', dateFormatOptions)
    var time = datetime.toLocaleTimeString('en-US', timeFormatOptions)

    // Stadium
    var currentHomeTeamID = currentMatch[homeTeam]['id']
    var stadiumName = storage.stadiums[currentHomeTeamID]['Stadium']
    var stadiumLocation = storage.stadiums[currentHomeTeamID]['Location']
    var stadiumCapacity = storage.stadiums[currentHomeTeamID]['Capacity']

    // Set text to the elements
    $('#date').text(date)
    $('#time').text(time)
    $('#homeTeam').text(currentMatch[homeTeam]['name'])
    $('#awayTeam').text(currentMatch[awayTeam]['name'])
    $('#fullTimeScore').text(fullTimeScoreString)
    $('#halfTimeScore').text(halfTimeScoreString)
    $('#winner').text(score['winner'])
    $('#status').text(matchStatus)
    $('#stadiumName').text(stadiumName)
    $('#stadiumLocation').text(stadiumLocation)
    $('#stadiumCapacity').text(stadiumCapacity)
});

// Event handler on list item clicked
$(document).on('pagebeforeshow', '#home', function(){       
    $(document).on('click', '.matchitem', function(e){     
        // Stop more events
        e.preventDefault();
        // store some data
        var currentMatchID = e.target.id
        storage.currentMatch = storage.matches[storage.currentMatchdayView][currentMatchID]
        // Change page
        $.mobile.changePage('#details')
    });    
});

function getAllHomeTeamIDs(matchday){
    var currentMatches = storage.matches[matchday];
    homeTeamIDs = [];
    
    $.each(currentMatches, function(matchID, currentMatch){
        homeTeamIDs.push(currentMatch[homeTeam]['id']);
    })
    return homeTeamIDs;
}

function populateStadiumMarkers(matchday){
    var homeTeamIDs = getAllHomeTeamIDs(matchday);
    if (storage.stadiumsMarkerGroup != null){
        storage.stadiumsMarkerGroup.clearLayers();
    }
    // Remove existing stadium markers
    storage.stadiumsMarker = []
    storage.stadiumsMarkerGroup = new L.markerClusterGroup();
    $.each(storage.stadiums, function(teamID, stadium){
        if (homeTeamIDs.indexOf(parseInt(teamID)) < 0){
            return true;
        }
        var stadiumPopup = '<h3>' + stadium['Team'] + '</h3>' + 
        '<div>Name: ' + stadium['Stadium'] + '</div>' +
        '<div>Location: ' + stadium['Location'] + '</div>' + 
        '<div>Capacity: ' + stadium['Capacity'] + '</div>'
        var marker = new L.marker(
            [stadium['Latitude'], stadium['Longitude']]).bindPopup(stadiumPopup);
        storage.stadiumsMarker.push(marker)
        storage.stadiumsMarkerGroup.addLayer(marker)
    });
    
    storage.stadiumsMarkerGroup.addTo(storage.map);   
}

// Event handler before showing map page
$(document).on("pagebeforeshow", "#map-page", function(e){
    populateStadiumMarkers(storage.currentMatchdayMapView);
});

// Event handler after  showing map page
$(document).on("pageshow", "#map-page", function(e){
    storage.map.invalidateSize();
});

// Event handler for refresh button
$(document).on("click", "#refresh", function(){
    // Prevent the usual navigation behavior
    event.preventDefault();
    console.log('Refresh clicked.')
    $.when(getMatches()).done(function(data, textStatus, jqXHR){
        populateMatchesList(storage.currentMatchdayView);
        populateComboBox();
    });
});

// Get stadium data
$.getJSON(stadiumURL, function(data){
    storage.stadiums = data;
});

// Retrieve matches data and populate list and combo box
$.when(getMatches()).done(function(data, textStatus, jqXHR){
    populateMatchesList(storage.currentMatchdayView);
    populateComboBox();
});

// Add map
storage.map = L.map('map').setView([41.278, -2.505], 5);

// Add an OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(storage.map);
