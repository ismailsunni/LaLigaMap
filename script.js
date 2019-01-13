const footballDataBaseURL = 'https://api.football-data.org/v2/competitions/PD/matches'
const key = '5f7fcfcba01f48fe8916b6b6e1eb81bd'
const stadiumURL = 'https://api.myjson.com/bins/hxip4';

// Match status
const FINISHED = 'FINISHED'
const IN_PLAY = 'IN_PLAY'
const SCHEDULED = 'SCHEDULED'

// Result / winner
const HOME_TEAM = 'HOME_TEAM'
const AWAY_TEAM = 'AWAY_TEAM'
const DRAW = 'DRAW'

// Accessor
const homeTeam = 'homeTeam'
const awayTeam = 'awayTeam'

var storage = {
    matches: {},
    currentMatchday: 1,
    currentMatchdayView: 0,
    currentMatch: null,
    stadiums: null,
    map: null,
    stadiumsMarker: [],
    stadiumsMarkerGroup: null
}

$.getJSON(stadiumURL, function(data){
    // console.log(data);
    storage.stadiums = data;
});

function setHeader(xhr) {
    xhr.setRequestHeader('X-Auth-Token', key);
  }

// Get matches on the current matchday
function getMatches(){
    return $.ajax({
        url: footballDataBaseURL,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            console.log('ajax success');
            console.log(response);
            storage.matches = {}
            storage.currentMatchday = response['matches'][0]['season']['currentMatchday'];
            if (storage.currentMatchdayView < 1){
                storage.currentMatchdayView = storage.currentMatchday;
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
function populateMatchesList(matchday){
    // Remove all the previous items
    $('#matchList li').remove();
    var currentMatches = storage.matches[matchday];
    $.each(currentMatches, function(matchID, currentMatch){
        var homeTeamScore = 'unknown';
        var awayTeamScore = 'unknown';
        if (currentMatch['status'] === FINISHED){
            homeTeamScore = currentMatch['score']['fullTime'][homeTeam];
            awayTeamScore = currentMatch['score']['fullTime'][awayTeam];
        } else if (currentMatch['status'] === SCHEDULED){
            homeTeamScore = '?';
            awayTeamScore = '?';
        } else if (currentMatch['status'] === IN_PLAY){
            homeTeamScore = currentMatch['score']['fullTime'][homeTeam] + '*';
            awayTeamScore = currentMatch['score']['fullTime'][awayTeam] + '*';
        }

        // Date and Time
        // Date
        // Time
        var datetime = new Date(currentMatch['utcDate'])
        var dateFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        var timeFormatOptions = {hour: '2-digit', minute:'2-digit', hour12: false}
        var date = datetime.toLocaleDateString('en-US', dateFormatOptions)
        var time = datetime.toLocaleTimeString('en-US', timeFormatOptions)

        $('#matchList').append(
            '<li><a href="#" class="matchitem" id=' + currentMatch['id'] + '>' + 
            '<div class="ui-grid-c">' + 
                '<div class="ui-block-a time-cell">' + time + '</div>' + 
                '<div class="ui-block-b match-cell">' + 
                    '<div class=ui-grid-solo>' + currentMatch[homeTeam]['name'] + '</div>' + 
                    '<div class=ui-grid-solo>' + currentMatch[awayTeam]['name'] + '</div>' + 
                '</div>' + 
                '<div class="ui-block-c score-cell">' + 
                    '<div class=ui-grid-solo>' + homeTeamScore + '</div>' + 
                    '<div class=ui-grid-solo>' + awayTeamScore + '</div>' + 
            '</div>' + 
                '</div>' +
            '</div' + 
            // '<div><p><span class="team-name">' + currentMatch[homeTeam]['name'] + '</span><span class="score">' + homeTeamScore + '</span></p>' +
            // '<p><span class="team-name">' + currentMatch[awayTeam]['name'] + '</span><span class="score">' + awayTeamScore + '</span></p>' +
            // '</div>' +
            '</a></li>'
        )
    });
    // Refresh the list (important)
    $('#matchList').listview('refresh');
}

function populateComboBox(){
    $('#select-matchday').empty();
    i = 1;
    while(i <= 38){
        $('#select-matchday').append('<option value='+ i + '>' + i +'</option>');
        i++;
    };
    $("#select-matchday").val(storage.currentMatchdayView).change();
}

$('#select-matchday').on('change', function() {
    storage.currentMatchdayView = this.value
    populateMatchesList(storage.currentMatchdayView);
  });

$.when(getMatches()).done(function(data, textStatus, jqXHR){
    populateMatchesList(storage.currentMatchdayView);
    populateComboBox();
});


$(document).on('pagebeforeshow', '#home', function(){       
    $(document).on('click', '.matchitem', function(e){     
        // store some data
        console.log(e.target.id)
        var currentMatchID = e.target.id
        storage.currentMatch = storage.matches[storage.currentMatchdayView][currentMatchID]
        console.log(storage.currentMatch);
        // Change page
        $.mobile.changePage('#details')
    });    
});

// Event to populate UI of details
$(document).on("pagebeforeshow", "#details", function(e){
    // Stop more events
    e.preventDefault(); 

    var currentMatch = storage.currentMatch;
    var score = currentMatch['score']
    var fullTimeScoreString = '? - ?'
    var winnerString = 'N/A'
    if (currentMatch['status'] === FINISHED){
        fullTimeScoreString = score['fullTime'][homeTeam] + ' - ' + score['fullTime'][awayTeam];
        winnerString = score['winner'];
    }
    var datetime = new Date(currentMatch['utcDate'])
    var dateFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var date = datetime.toLocaleDateString('en-US', dateFormatOptions)
    var time = datetime.toLocaleTimeString('en-US')

    $('#date').text(date)
    $('#time').text(time)
    $('#homeTeam').text(currentMatch[homeTeam]['name'])
    $('#awayTeam').text(currentMatch[awayTeam]['name'])
    $('#fullTimeScore').text(fullTimeScoreString)
    $('#winner').text(score['winner'])
    $('#status').text(currentMatch['status'])
});

// Add map
storage.map = L.map('map').setView([41.278, -2.505], 5);

// add an OpenStreetMap tile layer
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(storage.map);

$(document).on("pageshow", "#map-page", function(e){
    console.log(storage.stadiums)
    storage.map.invalidateSize();
});

$(document).on("pagebeforeshow", "#map-page", function(e){
    console.log('before show map page')
    storage.stadiumsMarker = []
    $.each(storage.stadiums, function(teamID, stadium){
        var stadiumPopup = '<h3>' + stadium['Team'] + '</h3>' + 
        '<div>Name: ' + stadium['Stadium'] + '</div>' +
        '<div>Location: ' + stadium['Location'] + '</div>' + 
        '<div>Capacity: ' + stadium['Capacity'] + '</div>'
        var marker = new L.marker(
            [stadium['Latitude'], stadium['Longitude']]).bindPopup(stadiumPopup);
        storage.stadiumsMarker.push(marker)
    });
    stadiumsMarkerGroup = new L.featureGroup(storage.stadiumsMarker);
    stadiumsMarkerGroup.addTo(storage.map);
});