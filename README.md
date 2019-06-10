# TrainTracker

## About
TrainTracker allows the user to view a list of trains with their next arrival, destination, next arrival time, and minutes remaining until the next arrival.  It also permits users to remove or edit existing trains or add new trains to the schedule.  

The train schedule is updated every minute, but the countdown is suspended if an edit is in process.


## Technical Notes
1. Alerts the user if an invalid frequency or invalid train time is entered.  Submitting invalid information for those fields is not permitted (will not add the train).
2. Uses Bootstrap and JQuery

### Special Note
I had originally calculated trian arrivals for times that are "in the future" assuming that "initial train time" entered (and stored) would have happened "1 day ago."

I had made this "contuous train" assumption because of situations like the following:  If an initial train time is 23:59 (11:59pm) and also arrives every 10 minutes, while the initial time might be 11:59pm on the first day, it should also arrive at 1:59am the following day (and every 10 minutes up to 23:49pm before repeating).

But, based on class discussion, I changed the code to reflect that "initial train" is the first train EACH DAY and the frequecy is for every train after that.  This makes a 11:59pm train with any kind of frequency an "impossible case", but this approach seems more in keeping with the assignment.

However, if a user updates the next arrival of a train, that will now become the new "initial time".  For this reason I left it possible to choose a new next arrival as a time in the past (similar to being able to set up the train's initial train time in the past).

A more elegant way to handle changing the next train arrival would be to apply the change only to the current arrival time, and revent back to the schedule after that arrival time.  But that change is a complex .  Just a few considerations:
* Need to delay subsequent trains if the new arrival time is later than the subsequent train arrival (possibly affecting more that one train).
* Additional database items to store the next arrival in the database.

I left the original code commented out - it simply added a day's worth of minutes to effectively move the initial time 24 hours in the past.