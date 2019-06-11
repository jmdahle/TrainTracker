/**
 * global variables
 */
var flagInitialTrain = false; // flag for validating time of a new train
var flagFreq = false; // flag for validating frequency of new train
var flagUpdateTime = false; // flag for validating the time on an existing train
var flagUpdating = false; // flag for indicating if a train is being updated; prevents multiple train updates
var updatingTrainKey = ""; // global for storing the key for the train being updated
var timerMilliSeconds = 60000;
var timerIsStarted = false;
var userSignedIn = false;

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

// global user authentication
var authProvider = new firebase.auth.GoogleAuthProvider();
authProvider.addScope("email");
authProvider.addScope("profile");

// check for user
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        // User is signed in.
        userSignedIn = true;
        // show train admin card
        $(".trainAdmin").show();
        // show the first collumn (admin features)
        $("td:nth-child(1),th:nth-child(1)").show();
        var uName = user.displayName;
        var uEmail = user.email;
        var uPhotoUrl = user.photoURL;
        $("#msgLogin").html("You are logged in as " + uName);
        $("#btnLogin").text("Logout");
        $("#btnLogin").on("click", function () {
            userLogout();
        });
    } else {
        // No user is signed in.
        userSignedIn = false;
        // hide train admin card
        $(".trainAdmin").hide();
        // hide first column of table (no action can be called).
        $("td:nth-child(1),th:nth-child(1)").hide();
        $("#msgLogin").text("Guest Account - Log in for administrator privilieges");
        $("#btnLogin").text("Login");
        $("#btnLogin").on("click", function () {
            userLogin();
        });
    }
});

// start the timer
timerStart()
timerIsStarted = true;


// user login using redirect
function userLogin () {
    firebase.auth().signInWithRedirect(authProvider);

}

// Authorization on returning from login
firebase.auth().getRedirectResult().then(function(authResult) {
    if (authResult.credential) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = authResult.credential.accessToken;
      // ...
    }
    // The signed-in user info.
    var user = authResult.user;
  }).catch(function(authError) {
      console.log(authError);
    // Handle Errors here.
    var errorCode = authError.code;
    var errorMessage = authError.message;
    // The email of the user's account used.
    var email = authError.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = authError.credential;
    // ...
  });

/*
// user login using POPUP
function userLogin() {
    firebase.auth().signInWithPopup(authProvider).then(function (authResult) {
        console.log("authResult", authResult);
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = authResult.credential.accessToken;
        // The signed-in user info.
        var user = authResult.user;
        // ...
    }).catch(function (authError) {
        // Handle Errors here.
        console.log("authError", authError);
        var errorCode = authError.code;
        var errorMessage = authError.message;
        // The email of the user's account used.
        var email = authError.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = authError.credential;  
        // ...
    });
}
*/

// user logout
function userLogout() {
    if (flagUpdating) {
        cancelUpdate(updatingTrainKey);
    }
    firebase.auth().signOut().then(function () {
        // Sign-out successful.
        console.log("logout successful")
    }).catch(function (error) {
        // An error happened.
        console.log("logout error", error);
    });
}

/**
 * Starts the timer
 */
function timerStart() {
    if (!timerIsStarted) {
        timerId = setInterval(timerCount, 1000); // run "timerCount" every second
        timerIsStarted = true; // flag for time in action
    }
}

/**
 * Pauses the timer
 */
function timerStop() {
    clearInterval(timerId); // dismiss the timer
    timerIsStarted = false; // re-set flag to indicate time is idle
    timerUpdate(); // update timer elements on browser
}

/**
 * Update timer on web page
 */
function timerUpdate() {
    // update display of timer on browser window
    var timeString = timerMilliSeconds / 1000;
    $("#timer").text(timeString + " seconds until next update");
}

/**
 * Timer update with every interval
 */
function timerCount() {
    // runs each time interval
    // decrement the timer and re-display
    timerMilliSeconds -= 1000;
    timerUpdate();
    // stop the time at 0 and record time up
    if (timerMilliSeconds <= 0) {
        timerMilliSeconds = 60000; // restart at 60 seconds;
        trainSchedule(); // update the train schedule
        if (!userSignedIn) {
            $("td:nth-child(1),th:nth-child(1)").hide();
        }
    }
}

/**
 * Checks initial train time for correct format.  Alerts if it does not meet HH:MM 24-hour time format
 */
$("#trainStart").on("change", function () {
    var testStart = $("#trainStart").val();
    // train start in HH:MM format?
    var fmtRegEx = /^([01]\d|2[0-3]):?([0-5]\d)$/
    if (!fmtRegEx.test(testStart)) {
        $("#trainStartWarn").text("The train start time is not valid.  Enter in 24 hour time format (HH:mm)");
        $("#trainStart").attr("isvalid", "invalid");
        flagInitialTrain = false;
    } else {
        flagInitialTrain = true;
        $("#trainStartWarn").text("");
        $("#submitWarn").text("");
        $("#trainStart").attr("isvalid", "valid");
    }
});


/**
 * Checks train frequency for correct format.  Alerts if it is not a whole number greater than 0.
 */
$("#trainFreq").on("change", function () {
    var testFreq = $("#trainFreq").val();
    // is the frequency an integer between 1 and 1440?
    if (!(testFreq == parseInt(testFreq)) || (parseInt(testFreq) < 1) || (parseInt(testFreq) > 1440)) {
        $("#trainFreqWarn").text("The train frequency is not valid.  Please enter a whole number of minutes (greater than 0, less than or equal to 1440)");
        $("#trainFreq").attr("isvalid", "invalid");
        flagFreq = false;
    } else {
        flagFreq = true;
        $("#trainFreqWarn").text("");
        $("#submitWarn").text("");
        $("#trainFreq").attr("isvalid", "valid");
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
    // console.log("new train:", newTrainName, newTrainDest, newTrainStart, newTrainFreq, flagFreq,flagInitialTrain);
    // validate start and freq
    if (flagFreq && flagInitialTrain) {
        // add train to database
        dbAddTrain(newTrainName, newTrainDest, newTrainStart, newTrainFreq);
        // clear the form
        $("#trainName").val("");
        $("#trainDest").val("");
        $("#trainStart").val("");
        $("#trainFreq").val("");
        // set flags back to false
        flagInitialTrain = false;
        flagFreq = false;
        $("#trainStart").attr("isvalid", "unchecked");
        $("#trainFreq").attr("isvalid", "unchecked");
    } else {
        $("#submitWarn").text("You have not entered valid train information.  Please review and re-submit");
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
    // console.log("new push to fb", newTrainRef);
    // add the train info to the db using the key
    newTrainRef.set({
        trainName: name,
        trainDest: dest,
        trainFirst: initialTime,
        trainFreq: frequency
    });
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
    // table column order: 0-action, 1-name, 2-dest, 3-freq, 4-next, 5-min away
    // column 0 - action buttons (changes on edit) - hidden if not logged in (no Admin privileges)
    var newTD0 = $("<td>");
    newTD0.attr("id", "action-" + key);
    var newIcoA = $("<i>");
    newIcoA.attr("class", "fa fa-pencil-square-o");
    newIcoA.attr("onclick", "editTrain('" + key + "')");
    newIcoA.tooltip({ placement: 'top', title: 'Edit Train' });
    var newIcoB = $("<i>");
    newIcoB.attr("class", "fa fa-trash-o remTrain");
    newIcoB.attr("onclick", "remTrain('" + key + "')");
    newIcoB.tooltip({ placement: 'top', title: 'Remove Train' });
    newTD0.append(newIcoA);
    newTD0.append("&nbsp;");
    newTD0.append(newIcoB);
    // column 1 - train name (editable)
    var newTD1 = $("<td>");
    newTD1.attr("id", "data-name-" + key);
    newTD1.text(name);
    // column 2 - train destination (editable)
    var newTD2 = $("<td>");
    newTD2.attr("id", "data-dest-" + key);
    newTD2.text(dest);
    // column 3  - train frequency
    var newTD3 = $("<td>");
    newTD3.text(frequency + " minutes");
    // get the next train time (editable)
    var nextTrain = trainNext(initialTime, frequency);
    // column 4 - next train arriving
    var newTD4 = $("<td>");
    newTD4.attr("id", "data-time-" + key);
    newTD4.text(nextTrain[1].format("HH:mm"));
    // column 5 - time until next train
    var newTD5 = $("<td>");
    if (parseInt(nextTrain[0]) === 0) {
        newTD5.text("arriving now");
    } else {
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
function trainNext(startTime, freq) {
    // use moment() to set startTime, passed in HH:mm format
    var startMoment = moment(startTime, "HH:mm");
    var minDiff = moment().diff(startMoment, "minutes");
    if (minDiff < 0) {
        // Train is in the future, so the first train of the day has not yet arrived
        timeToNext = - minDiff + 1;
        // OLD CODE - minDiff += 1439} -
        // I REPLACED WITH CODE ABOVE TO REMOVE MY ASSUMPTION ABOUT "CONTINOUS DAYS".  SEE THE README FILE FOR MORE INFORMATION
    } else {
        // First train was in the past, so calculate the number minutes remaining until the next arrival based on the frequency
        // divide the number of elapsed minute since start time by the frequency; the remainder the the number of elasped minutes into the next frequency
        var timeToNext = freq - minDiff % freq;
    }
    var timeNext = moment().add(timeToNext, "minutes");
    return [timeToNext, timeNext];
}

/** 
 * Handler for Firebase "value" event at "trains" Reference
 */
db.ref("trains").on("value", function (s) {
    // log the data in trains Reference
    // console.log(s.val());
    // clear the train table
    clearTrainTable();
    // go through each key in trains
    s.forEach(function (trainKeys) {
        var key = trainKeys.key;
        var trainData = trainKeys.val()
        // console.log(key, trainData);
        // use train data to update table
        tableAddTrain(key, trainData.trainName, trainData.trainDest, trainData.trainFirst, trainData.trainFreq)
    });
    if (!userSignedIn) {
        $("td:nth-child(1),th:nth-child(1)").hide();
    }
}, function (e) {
    // log the error
    console.log("The read failed: " + e.code);
});

/**
 * Removes the selected train from the db
 * 
 * @param {string} trainKey 
 */
function remTrain(trainKey) {
    // clear the tooltips
    $(".fa").tooltip('dispose');
    var nodeDelete = db.ref("trains/" + trainKey);
    nodeDelete.remove()
        .then(function () {
            console.log("Remove succeeded.")
        })
        .catch(function (e) {
            console.log("Remove failed: " + e.message)
        });
}

/**
 * Function to permit updating train name, destination, and/or arrival time
 * 
 * @param {string} trainKey 
 */
function editTrain(trainKey) {
    if (!flagUpdating) { // only permitting if not already updating a train
        // update the global trainkey
        updatingTrainKey = trainKey;
        // stop the timer
        timerStop();
        // clear the tooltips
        $(".fa").tooltip('dispose');
        // set the updating flag to prevent other train updates at the same time
        flagUpdating = true;
        // replace edit and delete icons with update and cancel icons
        $("#action-" + trainKey).empty();
        var newIcoA = $("<i>");
        newIcoA.attr("class", "fa fa-arrow-circle-o-up");
        newIcoA.attr("onclick", "updateTrain('" + trainKey + "')");
        newIcoA.tooltip({ placement: 'top', title: 'Update Train' });
        var newIcoB = $("<i>");
        newIcoB.attr("class", "fa fa-ban");
        newIcoB.attr("onclick", "cancelUpdate('" + trainKey + "')");
        newIcoB.tooltip({ placement: 'top', title: 'Cancel Update' });
        $("#action-" + trainKey).append(newIcoA);
        $("#action-" + trainKey).append("&nbsp;");
        $("#action-" + trainKey).append(newIcoB);
        // get the current values and clear the text
        var cName = $("#data-name-" + trainKey).text();
        var cDest = $("#data-dest-" + trainKey).text();
        var cTime = $("#data-time-" + trainKey).text();
        $("#data-name-" + trainKey).text("");
        $("#data-dest-" + trainKey).text("");
        $("#data-time-" + trainKey).text("");
        // replace name text with input box
        nameInput = $("<input>");
        nameInput.attr("type", "text");
        nameInput.attr("class", "form-control");
        nameInput.attr("value", cName);
        nameInput.attr("id", "input-name-" + trainKey);
        $("#data-name-" + trainKey).append(nameInput);
        // replace dest text with input box
        destInput = $("<input>");
        destInput.attr("type", "text");
        destInput.attr("class", "form-control");
        destInput.attr("value", cDest);
        destInput.attr("id", "input-dest-" + trainKey);
        $("#data-dest-" + trainKey).append(destInput);
        // replace time text with input box
        timeInput = $("<input>");
        timeInput.attr("type", "text");
        timeInput.attr("class", "form-control");
        timeInput.attr("value", cTime);
        timeInput.attr("isvalid", "unchecked");
        timeInput.attr("id", "input-time-" + trainKey);
        $("#data-time-" + trainKey).append(timeInput);
        // add a warning
        var timeInputWarn = $("<div>");
        timeInputWarn.attr("id", "timeInputWarn");
        $("#data-time-" + trainKey).append(timeInputWarn);
        // set editTrainTime flag to true
        flagUpdateTime = true;
        // add handling for validating time
        $("#input-time-" + trainKey).on("change", function () {
            var testStart = $("#input-time-" + trainKey).val();
            // train start in HH:MM format?
            var fmtRegEx = /^([01]\d|2[0-3]):?([0-5]\d)$/
            if (!fmtRegEx.test(testStart)) {
                $("#input-time-" + trainKey).attr("isvalid", "invalid");
                $("#timeInputWarn").text("Train time is not in 24 hour time format (HH:mm)");
                flagUpdateTime = false;
            } else {
                $("#input-time-" + trainKey).attr("isvalid", "valid");
                $("#timeInputWarn").text("");
                flagUpdateTime = true;
            }
        });
    }
}

function trainSchedule() {
    // clear the table and re-post
    db.ref("trains").once("value", function (s) {
        // clear the train table
        clearTrainTable();
        // go through each key in trains
        s.forEach(function (trainKeys) {
            var key = trainKeys.key;
            var trainData = trainKeys.val()
            // console.log(key, trainData);
            // use train data to update table
            tableAddTrain(key, trainData.trainName, trainData.trainDest, trainData.trainFirst, trainData.trainFreq)
        });
    }, function (e) {
        // log the error
        console.log("The read failed: " + e.code);
    });
}

/**
 * Cancels any updates to an existing train (cancels "edit" and return to normal train table)
 * 
 * @param {string} trainKey 
 */
function cancelUpdate(trainKey) {
    // set the updating flag to permit other train updates at the same time
    flagUpdating = false;
    updatingTrainKey = "";
    // clear the tooltips
    $(".fa").tooltip('dispose');
    // re-start the time
    timerStart();
    trainSchedule();
}

/**
 * Updates db with modified train information
 * 
 * @param {string} trainKey 
 */
function updateTrain(trainKey) {
    // don't update if new time is not valid
    if (flagUpdateTime) {
        // re-start the timer
        timerStart();
        // set the updating flag to permit other train updates at the same time
        flagUpdating = false;
        // clear the tooltips
        $(".fa").tooltip('dispose');
        var updName = $("#input-name-" + trainKey).val().trim();
        var updDest = $("#input-dest-" + trainKey).val().trim();
        var updTime = $("#input-time-" + trainKey).val().trim();
        var nodeUpdate = db.ref("trains/" + trainKey);
        nodeUpdate.update(
            {
                trainName: updName,
                trainDest: updDest,
                trainFirst: updTime
            }
        );
    }
}