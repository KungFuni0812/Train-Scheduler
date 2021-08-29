// display train data on page

const firebaseConfig = {
    apiKey: "AIzaSyBa83XJ4PGnNRun1F5AZD8pltL3nWekkbw",
    authDomain: "train-scheduler-e4193.firebaseapp.com",
    projectId: "train-scheduler-e4193",
    storageBucket: "train-scheduler-e4193.appspot.com",
    messagingSenderId: "915508197025",
    appId: "1:915508197025:web:6d953d58d6766b47fce2e0",
    measurementId: "G-07F5GWT1DB"
    };

firebase.initializeApp(firebaseConfig);

var database = firebase.database();

// calculate when next train arrives
function nextTrain(trainObj, objString) {

    // First Time (pushed back 1 year to make sure it comes before current time)
    var firstTimeConverted = moment(trainObj.time, "hh:mm").subtract(1, "years");
    // get the current time
    var now = moment();
    // turn the departure frequency into an integer for later math
    var arrivalFreq = parseInt(trainObj.freq);
    // calculate how many minutes have passed from the first departure time until now
    var minutesSinceInitialDepart = now.diff(moment(firstTimeConverted), 'minutes');
    // use modulo to find out how many minutes have elapsed since the last departure
    var minutesUntilNextDepart = minutesSinceInitialDepart % arrivalFreq;
    // subtract that from the departure frequency to find out how many minutes left until the next departure
    var minutesAway = arrivalFreq - minutesUntilNextDepart;
    // add that number to the current time to find out when the next departure time is
    var nextDepartureTime = now.add(minutesAway, 'm');

    //add a table row for this train
    var row = $('<tr>');
    row.attr('id', objString);
    var tName = $('<td>');
    tName.text(trainObj.name);
    row.append(tName);
    var tDest = $('<td>');
    tDest.text(trainObj.dest);
    row.append(tDest);
    var tFreq = $('<td>');
    tFreq.text(trainObj.freq);
    row.append(tFreq);
    var tNext = $('<td>');
    tNext.text(moment(nextDepartureTime).format("hh:mm"));
    row.append(tNext);
    var tMinAway = $('<td>');
    tMinAway.text(minutesAway);
    row.append(tMinAway);
    var tEdit = $('<td>');
    var tEditBtn = $('<btn>');
    tEditBtn.addClass('btn btn-info editTrain');
    tEditBtn.attr('data-id', objString);
    tEditBtn.text('?');
    tEdit.append(tEditBtn);
    row.append(tEdit);
    var tDel = $('<td>')
    var tDelBtn = $('<btn>');
    tDelBtn.addClass('btn btn-danger deleteTrain');
    tDelBtn.attr('data-id', objString);
    tDelBtn.text('X');
    tDel.append(tDelBtn);
    row.append(tDel);
    $('#train-table-body').append(row);
}

// loop through train objects in Firebase
function checkTrains(snapshot) {
    var trains = snapshot.val();
    for (var savedTrainString in trains) {
        var thisTrainObj = snapshot.child(savedTrainString).val()
        nextTrain(thisTrainObj, savedTrainString)
    }
}

// a one time check/rerender
function checkOnce() {
    $('#train-table-body').empty();
    database.ref("/trains").once('value', function(snapshot){
        checkTrains(snapshot)
    })
}

// check database and render train rows on load
database.ref("/trains").on("value", function(snapshot){
    checkTrains(snapshot);
})

// re-render the train rows every 1 minute
setInterval(checkOnce, 60000);

// add a train when Submit is clicked
$("#submit-train").on('click', function(e) {
    e.preventDefault();
    // grab inputs
    var trainObj = {
        name: $("#tname").val().trim(),
        dest: $("#dsnation").val().trim(),
        time: $("#fttime").val().trim(),
        freq: $("#freq").val().trim()
    }
    $('#train-table-body').empty();
    // add to firebase and render to page
    database.ref("/trains").push(trainObj)
})

// delete a train
$(document).on('click', '.deleteTrain', function(e){
    e.preventDefault();
    var node = $(this).attr('data-id');
    database.ref('/trains').child(node).remove();
    checkOnce();
})
