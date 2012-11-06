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
            if ( data.option_text=="Quit" ) {
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
TrialSpec = function( question, answer, feedback, options, data ) {
    this.question   = question;
    this.answer     = answer;
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
    var option_buttons = '';
    for ( var i=0; i<trial.options.length; i++ ) {
        option_buttons += '<button type="button" class="option_buttons" id="option_button_'+i+'">'+trial.options[i]+'</button>';
    }
    var returnResult = function( i ) {
        display_loc.html('');
        // pause?
        callback($.extend({},trial.data,
            {"rt":(new Date()).getTime()-start_time,"response":response,"option":i,"option_text":trial.options[i]}));
    }
    // post html to display_loc
/*
TBD (Josh?/David): the look of this is pretty primitive right now. I suspect this can be solved with css but I don't know from css - can Josh help with this?
*/
    display_loc.html( 
        '<div id="question"><p>' + trial.question + '</p></div>' +
        '<div id="answer"><p><input type="text" id="answer_box"></input><button type="button" id="answer_button">Show the answer</button></p></div>' +
        '<div id="feedback"></div>' +
        '<div id="continue"><p>' + option_buttons + '</p></div>'
    );
    $('.option_buttons').click( function() { returnResult(Number(this.id.replace("option_button_",""))); } );
    // hide feedback and submit buttons until user clicks answer_button
    $('#feedback').hide();
    $('#continue').hide();
    $('#answer_button').click( function() {
        $('#answer_button').hide();
        response = $('#answer_box').val();
        if ( ( response==="" ) || ( response===undefined ) ) {
            var correct = false;
        } else {
            var correct = ( (Math.round(response*100)/100)==(Math.round(trial.answer*100)/100) );
        }
        var feedback_text = "<p>" + trial.feedback[ correct ] + "</p>";
        $('#feedback').html( feedback_text );
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
    // build mock trial content
    this.categories = [ "Mean", "Median", "Mode" ];
/*
TBD (Paulo/David): the story content below is just a placeholder. Eventually trialspecs should be instantiated using content passed in via the items param. We should ensure that the number of stories and is the same for each category. We should have enough stories that people are unlikely to exhaust them, but if people do, the code will respond gracefully by looping back to the beginning.
*/
    this.stories    = [ "Story 1", "Story 2", "Story 3" ];
    // minimum that must be completed per category in order to finish the worksheet
    // and actual number completed for each category (initialized to 0)
    var minimum_complete = 2;
    this.minimums     = {};
    this.completes    = {};
    for ( var i=0; i<this.categories.length; i++ ) {
        this.minimums[this.categories[i]] = minimum_complete;
        this.completes[this.categories[i]] = 0;
    }
    this.condition    = condition;
    this.getNextTrial = getNextTrial;
    this.getDataset   = getDataset;
    this.getProgressBar = getProgressBar;
}

function getNextTrial( next_cat ) {
    // select / generate the story and data for the next trial
    if ( next_cat===false ) {   // this is the first trial
        next_cat    = 0;
        next_story  = 0;
        data_relation = "random";
    } else {                    // at least one trial done before
        if ( this.condition=="RR" ) {        // related within, related between
            if ( this.prev_cat==next_cat ) {
                var next_story      = this.prev_story;
                var data_relation   = "related";
            } else {
                var next_story      = this.prev_story;
                var data_relation   = "identical";
            }
        } else if ( this.condition=="RU" ) { // related within, unrelated between
            if ( this.prev_cat==next_cat ) {
                var next_story      = this.prev_story;
                var data_relation   = "related";
            } else {
                var next_story      = (this.prev_story+1)%this.stories.length;
                var data_relation   = "random";
            }
        } else if ( this.condition=="UR" ) { // unrelated within, related between
            if ( this.prev_cat==next_cat ) {
                var next_story      = (this.prev_story+1)%this.stories.length;
                var data_relation   = "random";
            } else {
                var next_story      = this.prev_story;
                var data_relation   = "identical";
            }
        } else if ( this.condition=="UU" ) { // unrelated within, unrelated between
                var next_story      = (this.prev_story+1)%this.stories.length;
                var data_relation   = "random";
        }
    }
    // record category selection; generate progress bar
    this.prev_cat = next_cat;
    this.completes[this.categories[next_cat]]++;
    var bar = this.getProgressBar();
    // record story selection; generate story text
    this.prev_story = next_story;
    var story    = "<p>" + this.stories[ next_story ] + "</p>";
    // generate data set, store array version in this and save text version for trial spec
    D = this.getDataset( data_relation );
    this.dataset = D["dataset"];
    var dataset_text = D["HTML"];
    // question
    var measure = this.categories[ next_cat ];
    var question = "<p>Find the " + measure + " of this data. (Round off to 2 decimal places.)</p>";
    // feedback text
    var answer = getCentTend( this.dataset, measure, 2 );
    var feedback = { false: "<img src='small-red-x-mark-th.png'>  " + " Oops, that's not correct. The " + measure + " is " + answer + ".",
                     true: "<img src='small-green-check-mark-th.png'>  " + " Yes, that's correct!" };
    // do we need to give more explanation in the case of wrong answers?
    // options buttons (include Quit only if minimum completes reached)
    // eventually option text should be sensitive to condition
    var options = [
        ["See another example about <b>Mean</b>","See an example about <b>Median</b>","See an example about <b>Mode</b>"],
        ["See an example about <b>Mean</b>","See another example about <b>Median</b>","See an example about <b>Mode</b>"],
        ["See an example about <b>Mean</b>","See an example about <b>Median</b>","See another example about <b>Mode</b>"] ]
        [next_cat];
    var quit_option = true;
    for ( var i=0; i<this.categories.length; i++ ) {
        quit_option = ( quit_option && ( this.completes[this.categories[i]] >= this.minimums[this.categories[i]] ) );
    }
    if ( quit_option ) {
        options.push( "Quit" );
    }
    // trial data to be recorded (as opposed to above "dataset" which is what is displayed to participant)
    // once we have more realistic content, we should add more detailed data, e.g. the actual correct answer.
    var data    = {"category":next_cat,"story":next_story,"dataset":this.dataset.toString()};
    // generate and return the next trial spec
    return new TrialSpec( bar + story + dataset_text + question, answer, feedback, options, data );
}

// generateData: method of TrialGenerator object
//  generates a new data set and returns both array and HTML versions thereof
//  if relation is random, new data is completely random within constraints of current value of this.story
//  if relation is identical, new data is same as old data
//  if relation is related, new data is a tweak of old data with changes highlighted in the HTML
function getDataset( relation ) {
    // currently does not work - the code below is just placeholder
    var min=0; var max=3; var length=3;
    var dataset = [];
    for ( var i=0; i<length; i++ ) {
        dataset.push( min + Math.floor( Math.random()*(max+1) ) );
    }
    var result = "<p>Data set: ";
    for ( var i=0; i<dataset.length; i++ ) {
        result += dataset[i] + ", ";
    }
    result = result.substring(0,result.length-2) + "</p>";
    return { "dataset": dataset, "HTML": result };
}

function getCentTend( dataset, measure, precision ) {
    if ( measure=="Mean" ) {
        var result = dataset.reduce( function(a,b){return Number(a)+Number(b);} )/dataset.length;
    } else if ( measure=="Median" ) {
        if ( (dataset.length%2)==1 ) {
            var result = dataset.sort()[(dataset.length-1)/2];
        } else {
            var result = ( dataset.sort()[dataset.length/2] + dataset.sort()[(dataset.length/2)-1] ) / 2;
        }
    } else if ( measure=="Mode" ) {
        var freqs = {};
        var max_freq = 0;
        var el;
        for ( var i=0; i<dataset.length; i++ ) {
            el = dataset[i];
            if ( freqs[el]!=undefined ) {
                freqs[el]++;
            } else {
                freqs[el]=1;
            }
            if ( freqs[el]>max_freq ) {
                max_freq=freqs[el];
            }
        }
        var modal_els = [];
        for ( var k in freqs ) {
            if ( freqs[k]==max_freq ) {
                modal_els.push( k );
            }
        }
        var result = modal_els.reduce( function(a,b){return Number(a)+Number(b);} )/modal_els.length;
    }
    return Math.round(result*Math.pow(10,precision))/Math.pow(10,precision);
}

function getProgressBar() {
    var bar = "<table border='1'><tr><td colspan='"+this.categories.length+"'>Number of problems completed for each type, including this problem:</td></tr><tr>";
    for ( var i=0; i<this.categories.length; i++ ) {
        bar += "<td><strong>"+this.categories[i]+":</strong><br>"+this.completes[this.categories[i]]+" / "+this.minimums[this.categories[i]]+"</td>";
    }
    bar += "</tr></table>";
    return bar;
}