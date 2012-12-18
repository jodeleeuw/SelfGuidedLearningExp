//////////////////////////////////////////////////////////////////////
// main experiment loop:
// startExperiment, runExperiment, endExperiment
//////////////////////////////////////////////////////////////////////

// startExperiment(): initiates recursive function runExperiment
function startExperiment( display_loc, prepend_data, trial_generator ) {
    runExperiment( display_loc, prepend_data, trial_generator, 0, "first trial", [] );
}

// runExperiment(): does trials until a trial returns a false continue value
//  display_loc: an HTML div where the experiment is to be displayed
//  prepend_data: subject-level data to be prepended to each row of trial-level data
//  trial_generator: a TrialGenerator object which generates TrialSpec objects
//  iter_num: number of the current trial, or 0 for the first trial
//  option: option chosen on previous trial, or false for the first trial
//  accum_data: data rows from already completed trials, or [] for the first trial
function runExperiment( display_loc, prepend_data, trial_generator, iter_num, option_text, accum_data ) {
    var trial_spec  = trial_generator.getNextTrial( option_text );
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
                            runExperiment( display_loc, prepend_data, trial_generator, iter_num+1, data.option_text, accum_data );
/*
I thought using a recursive call was the best way to handle saving data via php after each iteration of doTrial. However, it has the drawback that we'll use a lot of memory (I think) if there are a large number of iterations. Is this likely to be a problem? Removing the accum_data param would certainly reduce the problem and it serves mainly a cosmetic function at the moment.
*/
                          },
                          error: function() {
                            runExperiment( display_loc, prepend_data, trial_generator, iter_num+1, data.option_text, accum_data );
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
        option_buttons += '<button type="button" class="option_buttons" id="option_button_'+i+'">'+trial.options[i]+'</button>  ';
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
        '<div id="continue"><p>Choose the next problem:</p><p>' + option_buttons + '</p></div>'
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
		// add a class to feedback to indicate wherther it is correct or not
		if(correct) { $('#feedback').addClass('feedback_correct'); } else { $('#feedback').addClass('feedback_incorrect'); }
		// show feedback and continue options
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
TBD (Paulo/David): the story content below is just a placeholder. Eventually trialspecs should be instantiated using content passed in via the items param. We should ensure that the number of stories and is the same for each category. We should have enough stories that people are unlikely to exhaust them, but if people do, the code will respond gracefully by looping back to the beginning.
*/
    this.stories    = [ 
        { text: "The scores of several students on a 10-point pop quiz are shown below.", ques: "students' test scores", min: 3, max: 10 },
        { text: "The data below shows the numbers of stories of several buildings in a neighborhood.", ques: "number of stories", min: 1, max: 6 },
        { text: "In a marketing research study, several consumers each rated how much they liked a product on a scale of 1 to 5. Their ratings are shown below.", ques: "their ratings", min: 1, max: 5 },
        { text: "Several fishermen went fishing on the same day. Below you can how many fish the different fishermen caught.", ques: "number of fish caught", min: 0, max: 8 }
    ];

    this.categories = [ "Mean", "Median", "Mode" ];
    this.complete_targ  = 2;        // must complete this many probs in each category before Quit option available
    this.completes_tot  = [];       // total number currently completed in each category
    this.completes_rct  = [];       // number completed in each category since last change of story or data set
    for ( var i=0; i<this.categories.length; i++ ) { this.completes_tot[i] = 0; }
/*    
    this.curr_cat_idx   = 0;        // index of category for the first example to be shown
    this.curr_story_idx = 0;        // index of story for the first example to be shown
*/
    this.condition    = condition;
    this.getNextTrial = getNextTrial;
    this.getButtonOptions = getButtonOptions;
    this.getDataset   = getDataset;
    this.getProgressBar = getProgressBar;
}

function getNextTrial( option_text ) {
    // determine trial params: category index, story index, and relation of new dataset to previous dataset
    var data_rel; var new_cyc=false;
    if ( option_text=="first trial" ) {
        this.cat_idx    = 0;
        this.story_idx  = 0;
        data_rel        = "random";
        new_cyc         = true;
    } else {
        var opt = option_text.replace( /<\/{0,}em>/g, "" );
        for ( var i=0; i<this.categories.length; i++ ) {
            if ( opt.indexOf( this.categories[i] )!=-1 ) {
                this.cat_idx = i;
                break;
            }
        }
        if ( opt.indexOf( "new story problem" )!=-1 ) {
            this.story_idx = (this.story_idx + 1)%(this.stories.length);
            data_rel = "random";
            new_cyc = true;
        } else if ( opt.indexOf( "new set of data" )!=-1 ) {
            data_rel = "related";
            new_cyc = true;
        } else {
            data_rel = "identical";
        }
    }
    
    // modify the record of cats completed total and since last change of story or data set
    if ( new_cyc ) {    // we are changing story or data set
        for ( var i=0; i<this.categories.length; i++ ) {
            if ( i==this.cat_idx ) {
                this.completes_tot[i]++;
                this.completes_rct[i]=1;
            } else {
                this.completes_rct[i]=0;
            }
        }
    } else {            // we are not changing story or data set
        for ( var i=0; i<this.categories.length; i++ ) {
            if ( i==this.cat_idx ) {
                this.completes_tot[i]++;
                this.completes_rct[i]++;
            }
        }
    }
            
    // generate actual HTML content to be shown to participant
    var progbar     = this.getProgressBar();
    var story       = this.stories[this.story_idx];
    var cat         = this.categories[this.cat_idx];
    var storytxt    = "<p>" + story.text + "</p>";
    var datatxt     = this.getDataset(data_rel,story.min,story.max);
    var questxt     = "<p>Find the <em>" + cat + "</em> of the " + story.ques + ". (Round off to 2 decimal places.)</p>";
    var content     = progbar + storytxt + datatxt + questxt;
    var answer      = getCentTend(this.dataset,cat,2);
    var feedback    = { false: "<img src='small-red-x-mark-th.png'>  " + " Oops, that's not correct. The " + cat + " is " + answer + ".",
                        true: "<img src='small-green-check-mark-th.png'>  " + " Yes, that's correct!" };
                    // do we need to give more explanation in the case of wrong answers?
    var options     = this.getButtonOptions();
    
    // generate data to be recorded (as opposed to above "dataset" which is what is displayed to participant) and return trial specification
    // once we have more realistic content, we should add more detailed data, e.g. the actual correct answer.
    var data        = {"category":cat,"storyidx":this.story_idx,"dataset":this.dataset.toString()};
    return new TrialSpec( content, answer, feedback, options, data );
}

function getProgressBar() {
    var bar = "<table border='1'><tr><td colspan='"+this.categories.length+"'>Number of problems completed for each type, including this problem:</td></tr><tr>";
    for ( var i=0; i<this.categories.length; i++ ) {
        bar += "<td><strong>"+this.categories[i]+":</strong><br>"+this.completes_tot[i]+" / "+this.complete_targ+"</td>";
    }
    bar += "</tr></table>";
    return bar;
}

// generateData: method of TrialGenerator object
//  generates a new data set, records it in the TrialGenerator, and returns an HTML version thereof
//  if relation is random, new data is completely random within constraints of current value of this.story
//  if relation is identical, new data is same as old data
//  if relation is related, new data is a tweak of old data with changes highlighted in the HTML
function getDataset( relation, min, max ) {
    // "relation" currently does not work.
    if ( relation=="identical" ) {
        var dataset = this.dataset;
        var result = "<p>Data set: ";
        for ( var i=0; i<dataset.length; i++ ) {
            result += dataset[i] + ", ";
        }
        result = result.substring(0,result.length-2) + "</p>";
    } else if ( relation=="related" ) {
        var R   = modifyAndStringifyDataset( this.dataset, min, max );
        dataset = R["array"];
        result  = R["text"];
    } else if ( relation=="random" ) {
        var length = 5 + Math.floor(Math.random()*5);
        var dataset = [];
        for ( var i=0; i<length; i++ ) {
            dataset.push( randRange(min,max) );
        }
        var result = "<p>Data set: ";
        for ( var i=0; i<dataset.length; i++ ) {
            result += dataset[i] + ", ";
        }
        result = result.substring(0,result.length-2) + "</p>";
    }
    this.dataset = dataset;
    return result;
}

// modifyAndStringifyDataset
function modifyAndStringifyDataset( ds, min, max ) {
    var changetype;
    if ( ds.length >= 8 ) {
        changetype = "remove";
    } else if ( ds.length <= 5 ) {
        changetype = "add";
    } else {
        changetype = ["remove","add"][Math.floor(Math.random()*2)];
    }
    if ( changetype=="remove" ) {
        var del_idxs = randomSubsetIdxs( ds, 1+Math.floor(Math.random()*3) );
        var sing_plu = Number( del_idxs.length > 1 );
        var arr=[]; var txt="";
        txt = "<p>Data set: ";
        for ( var i=0; i<ds.length; i++ ) {
            if ( del_idxs.indexOf(i)>-1 ) {
                txt += "<del>" + ds[i] + "</del>, ";
            } else {
                arr.push(ds[i]);
                txt += ds[i] + ", ";
            }
        }
        txt = txt.substring(0,txt.length-2) + "</p>";
        txt += ["<p>(The number ","<p>(The numbers "][ sing_plu ];
        for ( var i=0; i<ds.length; i++ ) {
            if ( del_idxs.indexOf(i)>-1 ) {
                txt += ds[i] + ", ";
            }
        }
        txt = txt.substring(0,txt.length-2);
        txt += [" was removed from the data.)</p>"," were removed from the data.)</p>"][ sing_plu ];
    } else if ( changetype=="add" ) {
        var arr=[]; var txt="";
        txt = "<p>Data set: ";
        for ( var i=0; i<ds.length; i++ ) {
            arr.push(ds[i]);
            txt += ds[i] + ", ";
        }
        var ins_num = 1+Math.floor(Math.random()*2);
        var sing_plu = Number( ins_num > 1 );
        var els=[];
        for ( var i=0; i<ins_num; i++ ) {
            els.push( randRange(min,max) );
            arr.push(els[i]);
            txt += "<ins>" + els[i] + "</ins>, ";
        }
        txt = txt.substring(0,txt.length-2) + "</p>";
        txt = txt.substring(0,txt.length-2) + "</p>";
        txt += ["<p>(The number ","<p>(The numbers "][ sing_plu ];
        for ( var i=0; i<els.length; i++ ) {
            txt += els[i] + ", ";
        }
        txt = txt.substring(0,txt.length-2);
        txt += [" was added to the data.)</p>"," were added to the data.)</p>"][ sing_plu ];
    }
    return { "array": arr, "text": txt };
}

function getButtonOptions() {
    var options = [];
    if ( this.condition=="RR" ) {
        // related within and between categories
        for ( var i=0; i<this.categories.length; i++ ) {
            if ( i==this.cat_idx ) {
                options.push( "Find the <em>" + this.categories[i] + "</em> for a <em>new</em> set of data." );
            } else {
                options.push( "Find the <em>" + this.categories[i] + "</em> for the <em>same</em> set of data." );
            }
        }
    } else if ( this.condition=="RU" ) {
        // related within, unrelated between categories
        for ( var i=0; i<this.categories.length; i++ ) {
            if ( i==this.cat_idx ) {
                options.push( "Find the <em>" + this.categories[i] + "</em> for a new <em>set of data</em>." );
            } else {
                options.push( "Find the <em>" + this.categories[i] + "</em> for a new <em>story problem</em>." );
            }
        }
    } else if ( this.condition=="UR" ) {
        // unrelated within, related between categories
        for ( var i=0; i<this.categories.length; i++ ) {
            if ( this.completes_rct[i]>0 ) {
                options.push( "Find the <em>" + this.categories[i] + "</em> for <em>a new story problem</em>." );
            } else {
                options.push( "Find the <em>" + this.categories[i] + "</em> for <em>the same set of data</em>." );
            }
        }
    } else if ( this.condition=="UU" ) {
        // unrelated within and between categories
        for ( var i=0; i<this.categories.length; i++ ) {
            options.push( "Find the <em>" + this.categories[i] + "</em> for a new story problem." );
        }
    }
    var quit_avail = true;
    for ( var i=0; i<this.categories.length; i++ ) {
        quit_avail = quit_avail && ( this.completes_tot[i]>=this.complete_targ );
    }
    if ( quit_avail ) {
        options.push( "Quit" );
    }
    return options;
}

function getCentTend( dataset, measure, precision ) {
    if ( measure=="Mean" ) {
        var result = dataset.reduce( function(a,b){return Number(a)+Number(b);} )/dataset.length;
    } else if ( measure=="Median" ) {
        var sorted = (dataset.slice()).sort();
        if ( (dataset.length%2)==1 ) {
            var result = sorted[(sorted.length-1)/2];
        } else {
            var result = ( sorted[sorted.length/2] + sorted[(sorted.length/2)-1] ) / 2;
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

//////////////////////////////////////////////////////////////////////
// utilities
//////////////////////////////////////////////////////////////////////

// randomSubset: return subset containing n of a's indices
function randomSubsetIdxs( a, n ) {
    var ids = [];
    for ( var i=0; i<a.length; i++ ) {
        ids.push(i);
    }
    return shuffle(ids).slice(0,n);
}

function shuffle(o) { //v1.0
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

// randRange: return an int between min and max inclusive
function randRange( min, max ) {
    return min + Math.floor(Math.random()*(max-min+1));
}