/**
 * global variables
 */
flagInitialTrain = false;
flagFreq = false;

/**
 * global database connection
 */
// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDDzE4ICcLKaojseJyXwVZS2e0YcH50dC0",
    authDomain: "traintracker-33f8c.firebaseapp.com",
    databaseURL: "https://traintracker-33f8c.firebaseio.com",
    projectId: "traintracker-33f8c",
    storageBucket: "",
    messagingSenderId: "1000626001769",
    appId: "1:1000626001769:web:766b117cde3c8492"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// database global variable
var db = firebase.database();

/**
 * Checks initial train time for correct format.  Alerts if it does not meet HH:MM 24-hour time format
 */
$("#trainStart").on("change", function () {
    var testStart = $("#trainStart").val();
    // train start in HH:MM format?
    var fmtRegEx = /^([01]\d|2[0-3]):?([0-5]\d)$/
    if (!fmtRegEx.test(testStart)) {
        alert("The train start time is not valid.  Enter in 24 hour time format (HH:mm)");
        flagInitialTrain = false;
    } else {
        flagInitialTrain = true;
    }
});

/**
 * Checks train frequency for correct format.  Alerts if it is not a whole number greater than 0.
 */
$("#trainFreq").on("change", function () {
    var testFreq = $("#trainFreq").val();
    // is the frequency an integer between 1 and 1440?
    if (!(testFreq == parseInt(testFreq)) || (parseInt(testFreq) < 1) || (parseInt(testFreq) > 1440))  {
        alert("The train frequency is not valid.  Please enter a whole number of minutes (greater than 0, less than or equal to 1440)");
        flagFreq = false;
    } else {
        flagFreq = true;
    }
});

/**
 * JQuery handler for btnAddTrain button click
 */
$("#btnAddTrain").on("click", function () {
    // prevent form submit
    event.preventDefault();
    // read the data from the form
    var newTrainName = $("#trainName").val().trim();
    var newTrainDest = $("#trainDest").val().trim();
    var newTrainStart = $("#trainStart").val().trim();
    var newTrainFreq = $("#trainFreq").val().trim();
    // debug - log to console
    console.log("new train:", newTrainName, newTrainDest, newTrainStart, newTrainFreq);
    // validate start and freq
    if (flagFreq && flagInitialTrain) {
        // add train to database
        dbAddTrain(newTrainName, newTrainDest, newTrainStart, newTrainFreq);
        // clear the form
        $("#trainName").val("");
        $("#trainDest").val("");
        $("#trainStart").val("");
        $("#trainFreq").val("");
    } else {
        alert("You have not entered valid train information.  Please review and re-submit");
    }
});

/**
 * Adds new train to the fb database
 * 
 * @param {string} name - the train's name
 * @param {string} dest - the train's destination
 * @param {time in hh:mm format} initialTime - time for initial train
 * @param {number} frequency - frequency, in minutes, between trains
 */
function dbAddTrain(name, dest, initialTime, frequency) {
    // add a record to the db, retrieve the new key
    var newTrainRef = db.ref("trains").push();
    console.log("new push to fb", newTrainRef);
    // add the train info to the db using the key
    newTrainRef.set({
        trainName: name,
        trainDest: dest,
        trainFirst: initialTime,
        trainFreq: frequency
    });
    console.log("data set to fb", newTrainRef);
}

/**
 * clears the table with train times
 */
function clearTrainTable() {
    $("#trainTable").empty();
}

/**
 * Adds the train to the train schedule table
 * 
 * @param {string} key 
 * @param {string} name 
 * @param {string} dest 
 * @param {string/moment() using format HH:mm} initialTime 
 * @param {number} frequency 
 */
function tableAddTrain(key, name, dest, initialTime, frequency) {
    var newTR = $("<tr>");
    // table column order: action, name, dest, freq, next, min away
    var newTD0 = $("<td>");
    var newIco1 = $("<i>");
    newIco1.attr("class","fa fa-trash-o remTrain");
    newIco1.attr("id",key);
    newIco1.attr("onclick","remTrain('"+key+"')");
    newTD0.append(newIco1);
    var newTD1 = $("<td>");
    newTD1.text(name);
    var newTD2 = $("<td>");
    newTD2.text(dest);
    var newTD3 = $("<td>");
    newTD3.text(frequency + " minutes");
    // get the next train time
    var nextTrain = trainNext(initialTime,frequency);
    var newTD4 = $("<td>");
    var newTD5 = $("<td>");
    if (parseInt(nextTrain[0]) === 0) {
        newTD5.text("arriving now");
        newTD4.text("now - " + nextTrain[1].format("HH:mm"));
    } else {
        newTD4.text(nextTrain[1].format("HH:mm"));
        newTD5.text(nextTrain[0] + " min away");
    }
    newTR.append(newTD0);
    newTR.append(newTD1);
    newTR.append(newTD2);
    newTR.append(newTD3);
    newTR.append(newTD4);
    newTR.append(newTD5);
    $("#trainTable").append(newTR);
}

/**
 * Calculates and returns minutes to next train and arrival time
 * 
 * @param {string/moment() format HH:mm } startTime 
 * @param {number} freq 
 */
function trainNext (startTime, freq) {
    // use moment() to set startTime, passed in HH:mm format
    var startMoment = moment(startTime, "HH:mm");
    var minDiff = moment().diff(startMoment, "minutes");
    if (minDiff < 0) { minDiff += 1440 } // if the start time is negative ("in the future"), then it started 1 day ago, so add 1 day's worth of minutes, 1440.
    console.log(startMoment.format("HH:mm"), minDiff);
    // divide the number of elapsed minute since start time by the frequency; the remainder the the number of elasped minutes into the next frequency
    var timeToNext = freq - minDiff%freq;
    var timeNext = moment().add(timeToNext,"minutes");
    return [timeToNext, timeNext];
}

/** 
 * Handler for Firebase "value" event at "trains" Reference
 */
db.ref("trains").on("value", function (s) {
    // log the data in trains Reference
    console.log(s.val());
    // clear the train table
    clearTrainTable();
    // go through each key in trains
    s.forEach(function (trainKeys) {
        var key = trainKeys.key;
        var trainData = trainKeys.val()
        console.log(key, trainData);
        // use train data to update table
        tableAddTrain(key, trainData.trainName, trainData.trainDest, trainData.trainFirst, trainData.trainFreq)
    });
}, function (e) {
    // log the error
    console.log("The read failed: " + errorObject.code);
});

/**
 * Removes the selected train from the db
 * 
 * @param {string} trainKey 
 */
function remTrain(trainKey) {
    var nodeDelete = db.ref("trains/"+trainKey);
    nodeDelete.remove()
        .then(function() {
            console.log("Remove succeeded.")
        })
        .catch(function(error) {
            console.log("Remove failed: " + error.message)
        });
}
