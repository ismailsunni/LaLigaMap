const footballDataBaseURL = 'https://api.football-data.org/v2/competitions/PD/matches'
const key = '5f7fcfcba01f48fe8916b6b6e1eb81bd'

var matches = {};
var currentMatchday = 1;
var currentMatchdayView = -1;

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
            matches = {}
            currentMatchday = response['matches'][0]['season']['currentMatchday'];
            if (currentMatchdayView < 0){
                currentMatchdayView = currentMatchday;
            }
            response['matches'].forEach(match => {
                var matchday = match['matchday'];
                if(!(matchday in matches)){
                    matches[matchday] = [];
                }
                matches[matchday].push(
                    {
                        'utcDate': match['utcDate'],
                        'status': match['status'],
                        'homeTeam': match['homeTeam'],
                        'awayTeam': match['awayTeam'],
                        'score': {
                            'winner': match['score']['winner'],
                            'halfTime': match['score']['halfTime'],
                            'fullTime': match['score']['fullTime'],
                        }
                    }
                );
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
    console.log('Current matchday view: ' + matchday)
    var currentMatches = matches[matchday];
    currentMatches.forEach(currentMatch => {
        $('#matchList').append(
            '<li><a href="#">' + 
            '<p><span class="team-name">' + currentMatch['homeTeam']['name'] + '</span><span class="score">' + currentMatch['score']['fullTime']['homeTeam'] + '</span></p>' +
            '<p><span class="team-name">' + currentMatch['awayTeam']['name'] + '</span><span class="score">' + currentMatch['score']['fullTime']['homeTeam'] + '</span></p>' +
            '</a></li>'
        )
    });
    // Refresh the list (important)
    $('#matchList').listview('refresh');
}

$.when(getMatches()).done(function(data, textStatus, jqXHR){
    populateMatchesList(currentMatchdayView);
});


function generateList(stations){
    // Remove all the previous items
    $('#matchList li').remove();
    
    $.each(stations, function(index, station){
        console.log(station.name);
        $('#matchList').append(
            '<li><h2>' + station.name + '</h2>' + 
            '<p>Province: ' + station.province + '</p>' +
            '<p>Last updated: ' + station.date + '</p>' +
            '<span id= "'+ index + '" class="ui-li-count">'+ 
            Math.round(station.temperature) + '°</span></li>'
            );
    })
    
    // Refresh the list (important)
    $('#matchList').listview('refresh');
}

// Refresh button event
$(document).on("click", "#refresh", function(){
    // Prevent the usual navigation behavior
    event.preventDefault();

    $.getJSON(meteoclimaticNetwork, function(result){
        var stations = [];
        console.log(result.stations.records);
        var records = result.stations.records;
        records.forEach(record => {
            stations.push(
                {
                    'name': record[1],
                    'province': record[2],
                    'date': record[18],
                    'temperature': record[5],
                    'latitude': record[3],
                    'longitude': record[4]
                }
            );
        });
        // Show to the list
        generateList(stations);
    });

});
