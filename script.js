const footballDataBaseURL = 'https://api.football-data.org/v2/competitions/PD/matches'
const key = '5f7fcfcba01f48fe8916b6b6e1eb81bd'
const stadiumURL = 'https://api.myjson.com/bins/hxip4';

var matches = {};
var currentMatchday = 1;
var currentMatchdayView = -1;
var currentMatchID = -1; 

var storage = {
    currentMatch: null,
    stadiums: null,
    map: null
}

$.getJSON(stadiumURL, function(data){
    console.log(data);
    storage['stadiums'] = data;
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
            matches = {}
            currentMatchday = response['matches'][0]['season']['currentMatchday'];
            if (currentMatchdayView < 0){
                currentMatchdayView = currentMatchday;
            }
            response['matches'].forEach(match => {
                var matchday = match['matchday'];
                if(!(matchday in matches)){
                    matches[matchday] = {};
                }
                matches[matchday][match['id']] = {
                    'id': match['id'],
                    'utcDate': match['utcDate'],
                    'status': match['status'],
                    'homeTeam': match['homeTeam'],
                    'awayTeam': match['awayTeam'],
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
    console.log('Current matchday view: ' + matchday)
    var currentMatches = matches[matchday];
    $.each(currentMatches, function(matchID, currentMatch){
        var homeTeamScore = 'unknown';
        var awayTeamScore = 'unknown';
        if (currentMatch['status'] === 'FINISHED'){
            homeTeamScore = currentMatch['score']['fullTime']['homeTeam'];
            awayTeamScore = currentMatch['score']['fullTime']['awayTeam'];
        } else if (currentMatch['status'] === 'SCHEDULED'){
            homeTeamScore = '?';
            awayTeamScore = '?';
        }

        $('#matchList').append(
            '<li><a href="#" class="matchitem" id=' + currentMatch['id'] + '>' + 
            '<p><span class="team-name">' + currentMatch['homeTeam']['name'] + '</span><span class="score">' + homeTeamScore + '</span></p>' +
            '<p><span class="team-name">' + currentMatch['awayTeam']['name'] + '</span><span class="score">' + awayTeamScore + '</span></p>' +
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
    }
    console.log(currentMatchday);
    $("#select-matchday").val(currentMatchdayView).change();
}

$('#select-matchday').on('change', function() {
    currentMatchdayView = this.value
    populateMatchesList(currentMatchdayView);
  });

$.when(getMatches()).done(function(data, textStatus, jqXHR){
    populateMatchesList(currentMatchdayView);
    populateComboBox();
});


$(document).on('pagebeforeshow', '#home', function(){       
    $(document).on('click', '.matchitem', function(e){     
        // store some data
        console.log(e.target.id)
        var currentMatchID = e.target.id
        storage['currentMatch'] = matches[currentMatchdayView][currentMatchID]
        console.log(storage['currentMatch']);
        // Change page
        $.mobile.changePage('#details')
    });    
});

// Event to populate UI of details
$(document).on("pagebeforeshow", "#details", function(e){
    // Stop more events
    e.preventDefault(); 

    var currentMatch = storage['currentMatch'];
    var score = currentMatch['score']
    var fullTimeScoreString = '? - ?'
    var winnerString = 'N/A'
    if (currentMatch['status'] === 'FINISHED'){
        fullTimeScoreString = score['fullTime']['homeTeam'] + ' - ' + score['fullTime']['awayTeam'];
        winnerString = score['winner'];
    }
    var datetime = new Date(currentMatch['utcDate'])
    var dateFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var date = datetime.toLocaleDateString('en-US', dateFormatOptions)
    var time = datetime.toLocaleTimeString('en-US')

    $('#date').text(date)
    $('#time').text(time)
    $('#homeTeam').text(currentMatch['homeTeam']['name'])
    $('#awayTeam').text(currentMatch['awayTeam']['name'])
    $('#fullTimeScore').text(fullTimeScoreString)
    $('#winner').text(score['winner'])
    $('#status').text(currentMatch['status'])
});


storage['map'] = L.map('map').setView([51.505, -0.09], 13);

// add an OpenStreetMap tile layer
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(storage['map']);

$(document).on("pagebeforeshow", "#mapPage", function(e){
    // Stop more events
    e.preventDefault(); 
    console.log('before show map.')
    // storage['map'].invalidateSize();
    setTimeout(
        function(){
            console.log('call invalidate size')
            storage['map'].invalidateSize(true);
        },
        100)
});