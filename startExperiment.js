//////////////////////////////////////////////////////////////////////
// main experiment loop:
// startExperiment, runExperiment, endExperiment
//////////////////////////////////////////////////////////////////////

// startExperiment(): initiates recursive function runExperiment
function startExperiment( display_loc, prepend_data, trial_generator ) {
    runExperiment( display_loc, prepend_data, trial_generator, 0, false, [] );
}

// runExperiment(): does trials until a trial returns a false continue value
//  display_loc: an HTML div where the experiment is to be displayed
//  prepend_data: subject-level data to be prepended to each row of trial-level data
//  trial_generator: a TrialGenerator object which generates TrialSpec objects
//  iter_num: number of the current trial, or 0 for the first trial
//  option: option chosen on previous trial, or false for the first trial
//  accum_data: data rows from already completed trials, or [] for the first trial
function runExperiment( display_loc, prepend_data, trial_generator, iter_num, option, accum_data ) {
    var trial_spec  = trial_generator.getNextTrial( option );
    trial_spec.doTrial( display_loc,
        function( data ) {
            data        = $.extend( {}, prepend_data, { "trial_num": iter_num }, data );
            accum_data  = accum_data.concat( [ data ] );
            if ( data.quit ) {
                endExperiment( display_loc, accum_data );
            } else {
                $.ajax( { type: 'post', cache: false, url: 'record_data.php',
/*
TBD (Josh?): record_data.php
*/
                          data: { 'json': JSON.stringify( data ) },
                          success: function() {
                            runExperiment( display_loc, prepend_data, trial_generator, iter_num+1, data.option, accum_data );
/*
I thought using a recursive call was the best way to handle saving data via php after each iteration of doTrial. However, it has the drawback that we'll use a lot of memory (I think) if there are a large number of iterations. Is this likely to be a problem? Removing the accum_data param would certainly reduce the problem and it serves mainly a cosmetic function at the moment.
*/
                          },
                          error: function() {
                            runExperiment( display_loc, prepend_data, trial_generator, iter_num+1, data.option, accum_data );
/*
TBD (David): eventually something useful should happen on error, but at least now it will run without record_data.php
*/
                          }
                        } );
            }
        } );
}

// endExperiment(): records completion data and displays completion message
/*
TBD (Josh?/David): right now this just displays the accumulated data so we know it's working. Eventually we need it to close down gracefully, possibly saving some info about completion to database (Josh?) and display a nice message to the participant (David).
*/
function endExperiment( display_loc, accum_data ) {
    display_loc.html( JSON.stringify( accum_data ) );
}


//////////////////////////////////////////////////////////////////////
// trial handling:
// TrialSpec class, doTrial
//////////////////////////////////////////////////////////////////////

// TrialSpec class
TrialSpec = function( text, question, feedback, options, data ) {
    this.text       = text;
    this.question   = question;
    this.feedback   = feedback;
    this.options    = options;
    this.data       = data;
    this.doTrial    = doTrial;
}

// doTrial()
//  display this.text and this.question in display_loc, plus an area for text entry and a button
//  when button is clicked, disappear it, display feedback and buttons based on this.options plus a quit button
//  when one of these is clicked, return result object including this.data, user input data, and which button was clicked
function doTrial( display_loc, callback ) {
    var trial = this;
    // generate continue buttons and function for them to call on click
    var continue_buttons = '';
    for ( var i=0; i<trial.options.length; i++ ) {
        continue_buttons += '<button type="button" class="continue_buttons" id="continue_button_'+i+'">'+trial.options[i]+'</button>';
    }
    continue_buttons += '<button type="button" class="continue_buttons" id="continue_button_'+trial.options.length+'">Quit</button>';
    var returnResult = function( i ) {
        display_loc.html('');
        // pause?
        callback($.extend({},trial.data,
            {"rt":(new Date()).getTime()-start_time,"response":response,"option":i,"quit":(i==trial.options.length)}));
    }
    // post html to display_loc
/*
TBD (Josh?/David): the look of this is pretty primitive right now. I suspect this can be solved with css but I don't know from css - can Josh help with this?
*/
    display_loc.html( 
        '<div id="text"><p>' + trial.text + '</p></div>' +
        '<div id="question"><p>' + trial.question + '</p><p>' +
          '<input type="text" id="answer_box"></input>' +
          '<button type="button" id="answer_button">Show the answer</button></p></div>' +
        '<div id="feedback"><p>' + trial.feedback + '</p></div>' +
        '<div id="continue"><p>' + continue_buttons + '</p></div>'
    );
    $('.continue_buttons').click( function() { returnResult(Number(this.id.replace("continue_button_",""))); } );
    // hide feedback and submit buttons until user clicks answer_button
    $('#feedback').hide();
    $('#continue').hide();
    $('#answer_button').click( function() {
        response = $('#answer_box').val();
        $('#answer_button').hide();
        $('#feedback').fadeIn(500);
        $('#continue').fadeIn(500);
    } );
    // record start time
    var response;
    var start_time = (new Date()).getTime();
}

//////////////////////////////////////////////////////////////////////
// trial generation:
// TrialGenerator class, getNextTrial
//////////////////////////////////////////////////////////////////////

TrialGenerator = function( condition, items ) {
/*
TBD (Paulo/David): what follows is just a placeholder. Eventually trialspecs should be instantiated using content passed in via the items param. We should ensure that the number of stories and is the same for each category and the number of datasets is the same for each story. We should have enough stories and datasets that people are unlikely to exhaust them, but if people do, the code will respond gracefully by looping back to the beginning.
*/
    // build mock trial content
    this.categories = [ "Mean", "Median", "Mode" ];
    this.stories    = [ "Story 1", "Story 2", "Story 3" ];
    this.datasets   = [ "Data Set A", "Data Set B", "Data Set C" ];
    var feedback    = "Space filler for feedback.";
    // convert trial content into trial specifications
    this.trialspecs = new Array( this.categories.length );
    var options;
    for ( var i=0; i<this.categories.length; i++ ) {
        this.trialspecs[i] = new Array( this.stories.length );
        for ( var j=0; j<this.stories.length; j++ ) {
            this.trialspecs[i][j] = new Array ( this.datasets.length );
            for ( var k=0; k<this.datasets.length; k++ ) {
                // eventually option text should be sensitive to condition
                options = [
                    ["See another example about <b>Mean</b>","See an example about <b>Median</b>","See an example about <b>Mode</b>"],
                    ["See an example about <b>Mean</b>","See another example about <b>Median</b>","See an example about <b>Mode</b>"],
                    ["See an example about <b>Mean</b>","See an example about <b>Median</b>","See another example about <b>Mode</b>"] ]
                    [i];
                this.trialspecs[i][j][k] = new TrialSpec(
                    "<p>"+this.stories[j]+"</p><p>"+this.datasets[k]+"</p>",
                    "Find the "+this.categories[i],
                    feedback,
                    options,
                    {"category":i,"story":j,"dataset":k} );
/*
TBD (David): once we have more realistic content, we should add more detailed data (the last arg to the TrialSpec constructor above), e.g. the actual correct answer.
*/
            }
        }
    }
    this.condition    = condition;
    this.getNextTrial = getNextTrial;
}

function getNextTrial( next_cat ) {
    if ( next_cat===false ) {   // this is the first trial
        next_cat    = 0;
        next_story  = 0;
        next_data   = 0;
    } else {                    // at least one trial done before
        if ( this.condition=="CC" ) {        // continuous within, continuous between
            if ( this.prev_cat==next_cat ) {
                var next_story = this.prev_story;
                var next_data = (this.prev_data+1)%this.datasets.length ;
            } else {
                var next_story = this.prev_story;
                var next_data = this.prev_data;
            }
        } else if ( this.condition=="CR" ) { // continuous within, random between
            if ( this.prev_cat==next_cat ) {
                var next_story = this.prev_story;
                var next_data = (this.prev_data+1)%this.datasets.length;
            } else {
                var next_story = (this.prev_story+1)%this.stories.length;
                var next_data = this.prev_data;
            }
        } else if ( this.condition=="RC" ) { // random within, continuous between
            if ( this.prev_cat==next_cat ) {
                var next_story = (this.prev_story+1)%this.stories.length;
                var next_data = prev_data;
            } else {
                var next_story = this.prev_story;
                var next_data = this.prev_data;
            }
        } else if ( this.condition=="RR" ) { // random within, random between
            var next_story = (this.prev_story+1)%this.stories.length;
            var next_data = prev_data;
        }
    }
    this.prev_cat   = next_cat;
    this.prev_story = next_story;
    this.prev_data  = next_data;
    return this.trialspecs[next_cat][next_story][next_data];
}

