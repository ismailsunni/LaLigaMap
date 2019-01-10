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
