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
 * JQuery handler for btnAddTrain button click
 */ 
$("#btnAddTrain").on("click", function() {
    // prevent form submit
    event.preventDefault();
    // read the data from the form
    var newTrainName = $("#trainName").val().trim();
    var newTrainDest = $("#trainDest").val().trim();
    var newTrainStart = $("#trainStart").val().trim();
    var newTrainFreq = $("#trainFreq").val().trim();
    //debug - log to console
    console.log ("new train:", newTrainName, newTrainDest, newTrainStart, newTrainFreq);
    // validate start and freq

    // add train to database

    // refresh the train table

    // clear the form
    $("#trainName").val("");
    $("#trainDest").val("");
    $("#trainStart").val("");
    $("#trainFreq").val("");
});

/** 
 * Handler for Firebase "value" event
 */
db.ref().on("value", function(s) {
    // log the data
    console.log(s.val());
}, function(e) {
    // log the error
    console.log("The read failed: " + errorObject.code);
});