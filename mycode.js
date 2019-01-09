const footballDataBaseURL = 'https://api.football-data.org/v2/competitions/PD/matches'
const key = '5f7fcfcba01f48fe8916b6b6e1eb81bd'

var matches = {};
var currentMatchday = 1;

function setHeader(xhr) {
    xhr.setRequestHeader('X-Auth-Token', key);
  }

// Get matches on the current matchday
function getMatches(){
    $.ajax({
        url: footballDataBaseURL,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            console.log('ajax success');
            console.log(response);
            matches = {}
            currentMatchday = response['matches'][0]['season']['currentMatchday'];
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

function generateList(stations){
    // Remove all the previous items
    $('#stationList li').remove();
    
    $.each(stations, function(index, station){
        console.log(station.name);
        $('#stationList').append(
            '<li><h2>' + station.name + '</h2>' + 
            '<p>Province: ' + station.province + '</p>' +
            '<p>Last updated: ' + station.date + '</p>' +
            '<span id= "'+ index + '" class="ui-li-count">'+ 
            Math.round(station.temperature) + '°</span></li>'
            );
    })
    
    // Refresh the list (important)
    $('#stationList').listview('refresh');
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
