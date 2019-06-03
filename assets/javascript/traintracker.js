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
        alert("The train start time is not valid.  Enter in 24 hour time format (HH:MM)");
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
    console.log(testFreq, parseInt(testFreq), testFreq === parseInt(testFreq));
    // is the frequency an integer?
    if (!(testFreq == parseInt(testFreq)) || (parseInt(testFreq) < 1)) {
        alert("The train frequency is not valid.  Please enter a whole number of minutes (greater than 0)");
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

function clearTrainTable() {
    $("#trainTable").empty();
}

function tableAddTrain(key, name, dest, initialTime, frequency) {
    var newTR = $("<tr>");
    newTR.attr("key", key);
    // table column order: name, dest, freq, next, min away
    var newTD1 = $("<td>");
    newTD1.text(name);
    var newTD2 = $("<td>");
    newTD2.text(dest);
    var newTD3 = $("<td>");
    newTD3.text(frequency + " minutes");
    var newTD4 = $("<td>");
    newTD4.text("next");
    var newTD5 = $("<td>");
    newTD5.text("min away");
    newTR.append(newTD1);
    newTR.append(newTD2);
    newTR.append(newTD3);
    newTR.append(newTD4);
    newTR.append(newTD5);
    $("#trainTable").append(newTR);
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