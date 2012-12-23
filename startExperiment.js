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
                $.ajax({ 
					type: 'post', 
					cache: false, 
					url: 'submit_data_mysql.php',
					data: { 'table':'trialdata', 'json': JSON.stringify([[data]] ) },
                    success: function(d) {
						console.log(d)
						runExperiment( display_loc, prepend_data, trial_generator, iter_num+1, data.option_text, accum_data );
					},
					error: function(d) {
						console.log(d);
						runExperiment( display_loc, prepend_data, trial_generator, iter_num+1, data.option_text, accum_data );
/*
TBD (David): eventually something useful should happen on error, but at least now it will run without record_data.php
*/
                    }
                } );
            }
        } 
	);
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
TrialSpec = function( category, question, answer, feedback, options, data ) {
    this.category   = category;
    this.question   = question;
    this.answer     = answer;
    this.feedback   = feedback;
    this.options    = options;
    this.data       = data;
    this.doTrial    = doTrial;
}

// doTrial()
//  display this.text and this.question in display_loc, plus an area for text entry and a button
//  button is disabled until something is entered into the text entry area
//  when button is clicked, disappear it, display feedback and buttons based on this.options
//  when one of these is clicked, return result object including this.data, user input data, and which button was clicked
function doTrial( display_loc, callback ) {
    var trial = this;
    var response;
    var correct;
    var returnResult = function( i ) {
        display_loc.html('');
        // pause?
        callback($.extend({},trial.data,
            {"response":response,"correct":correct,"rt":(new Date()).getTime()-start_time,"option":i,"option_text":trial.options[i]},
            getOptionProperties( trial.category, trial.options[i] ) ) );
    }
    // content that will go into the page
    var question_text   = trial.question;
    var answer_field    = '<input type="text" id="answer_box"></input>';
    var answer_button   = '<button type="button" id="answer_button">Show the answer</button>';
    var option_prompt   = 'Choose the next problem:';
    var option_buttons  = '';
    for ( var i=0; i<trial.options.length; i++ ) {
        option_buttons += '<button type="button" class="option_buttons" id="option_button_'+i+'">'+trial.options[i]+'</button>  ';
    }
    // organize content and post to display_loc
    display_loc.html( 
        '<div id="question"><p>' +
            question_text + '</p></div>' +
        '<div id="answer"><p>' +
            answer_field +
            answer_button + '</p></div>' +
        '<div id="feedback"></div>' +
        '<div id="continue">' +
            '<p>' + option_prompt + '</p>' +
            '<p>' + option_buttons + '</p></div>'
    );
    // disable answer_button until answer_field is filled
    $('#answer_button').attr('disabled','disabled');
    $('#answer_box').keyup( function(e) {
        if ( $('#answer_box').val()==="" ) {
            $('#answer_button').attr('disabled','disabled');
        } else {
            $('#answer_button').removeAttr('disabled');
            if (e.keyCode==13) {    // enter key
                $('#answer_button').click();
            }
        }
    } );
    // hide option prompt and buttons until user clicks answer_button
    $('#continue').hide();
    $('#answer_button').click( function() {
        $('#answer_button').hide();
        response = $('#answer_box').val();
        if ( ( response==="" ) || ( response===undefined ) ) {
            correct = false;
        } else {
            response = Number( response );
            correct = ( response==trial.answer );
        }
        var feedback_text = "<p>" + trial.feedback[ correct ] + "</p>";
        $('#feedback').html( feedback_text );
		// add a class to feedback to indicate whether it is correct or not
		if(correct) { $('#feedback').addClass('feedback_correct'); } else { $('#feedback').addClass('feedback_incorrect'); }
		// show feedback and continue options
        $('#feedback').fadeIn(500);
        $('#continue').fadeIn(500);
    } );
    // set option buttons to return the trial when clicked
    $('.option_buttons').click( function() { returnResult(Number(this.id.replace("option_button_",""))); } );
    // record start time
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
    this.getNewDataset   = getNewDataset;
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
    
    // generate actual HTML content to be shown to participant, except option buttons (see below)
    var progbar     = this.getProgressBar();
    var story       = this.stories[this.story_idx];
    var cat         = this.categories[this.cat_idx];
    var storytxt    = "<p>" + story.text + "</p>";
    var datatxt     = this.getNewDataset(data_rel,story.min,story.max);
    var questxt     = "<p>Find the <em>" + cat + "</em> of the " + story.ques + ".</p>";
    var content     = progbar + storytxt + datatxt + questxt;
    var answer      = getCentTend(this.dataset,cat);
    var feedback    = getFeedback(this.dataset,cat);
    
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
            
    // option buttons are generated AFTER updating the above info, so that they will reflect the current trial
    // i.e. quit will be available if the current trial will complete the necessary minimums for the categories,
    // and the options will say same story or different story, etc., according to what it should be after this trial is completed
    var options     = this.getButtonOptions();
    
    // generate data to be recorded (as opposed to above "dataset" which is what is displayed to participant) and return trial specification
    // once we have more realistic content, we should add more detailed data, e.g. the actual correct answer.
    var data        = {"storyidx":this.story_idx,"category":cat,"dataset":this.dataset.toString(),"answerkey":answer};
    return new TrialSpec( cat, content, answer, feedback, options, data );
}

function getProgressBar() {
    var bar = "<table border='1'><tr><td colspan='"+this.categories.length+"'>Number of problems completed for each type, including this problem:</td></tr><tr>";
    for ( var i=0; i<this.categories.length; i++ ) {
        bar += "<td><strong>"+this.categories[i]+":</strong><br>"+this.completes_tot[i]+" / "+this.complete_targ+"</td>";
    }
    bar += "</tr></table>";
    return bar;
}

// getNewDataset: method of TrialGenerator object
//  generates a new data set, records it in the TrialGenerator's dataset property, and returns an HTML text version thereof
//  if relation is random, new data is completely random within constraints of current value of this.story
//  if relation is identical, new data is same as old data
//  if relation is related, new data is a tweak of old data with changes highlighted in the HTML
function getNewDataset( relation, min, max ) {
    if ( relation=="random" ) {
        var dataset = generateDataset( min, max );
        var result  = stringifyDataset( dataset );
    } else if ( relation=="identical" ) {
        var dataset = this.dataset;
        var result  = stringifyDataset( dataset );
    } else if ( relation=="related" ) {
        var R   = modifyAndStringifyDataset( this.dataset, min, max );
        dataset = R["array"];
        result  = R["text"];
    }
    this.dataset = dataset;
    return result;
}

// generateDataset: given a min and max,
//  generates an array of 5-9 integers between min and max inclusive,
//  for which isDatasetNice returns true
function generateDataset( min, max ) {
    var dataset;
    var length;
    do {
        dataset = [];
        do {
            length = 5 + Math.floor(Math.random()*5);
        } while ((length%2)==0);
        // we happen to know that isDatasetNice always returns false if length is even,
        // so we can save time by rejecting these right away even though isDatasetNice would catch them in the end
        for ( var i=0; i<length; i++ ) {
            dataset.push( randRange(min,max) );
        }
    } while (!isDatasetNice(dataset));
    return dataset;
}

// isDatasetNice: given an array of integers, checks whether 
//  - the mean is an integer,
//  - the median is well-defined (i.e. no averaging required),
//  - and the mode is well-defined (i.e. only one "most common" number)
function isDatasetNice( ds ) {
    var naughty = (getMean(ds)===false) || (getMedian(ds)===false) || (getMode(ds)===false);
    return (!naughty);
}

// stringifyDataset: given an array of integers,
//  returns an HTML string version of the same
function stringifyDataset( ds ) {
    var result = "<p>Data set: ";
    for ( var i=0; i<ds.length; i++ ) {
        result += ds[i] + ", ";
    }
    result = result.substring(0,result.length-2) + "</p>";
    return result;
}

// modifyAndStringifyDataset: given an array of numbers,
//  adds or removes two numbers to the array and returns
//  (1) the modified array, and
//  (2) an HTML text version thereof with changes relative to the original dataset marked and explained
function modifyAndStringifyDataset( ds, min, max ) {
    var changetype;
    if ( ds.length >= 8 ) {
        changetype = "remove";
    } else if ( ds.length <= 6 ) {
        changetype = "add";
    } else {
        changetype = ["remove","add"][Math.floor(Math.random()*2)];
    }
    var del_num=2;
    var ins_num=2;
    var del_idxs;
    var arr;
    var txt;
    var els;
    do {
        if ( changetype=="remove" ) {
            del_idxs = randomSubsetIdxs( ds, del_num );
            arr = [];
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
            txt += "<p>(The numbers ";
            for ( var i=0; i<ds.length; i++ ) {
                if ( del_idxs.indexOf(i)>-1 ) {
                    txt += ds[i] + ", ";
                }
            }
            txt = txt.substring(0,txt.length-2);
            txt += " were removed from the data.)</p>";
        } else if ( changetype=="add" ) {
            arr = [];
            txt = "<p>Data set: ";
            for ( var i=0; i<ds.length; i++ ) {
                arr.push(ds[i]);
                txt += ds[i] + ", ";
            }
            els=[];
            for ( var i=0; i<ins_num; i++ ) {
                els.push( randRange(min,max) );
                arr.push(els[i]);
                txt += "<ins>" + els[i] + "</ins>, ";
            }
            txt = txt.substring(0,txt.length-2) + "</p>";
            txt = txt.substring(0,txt.length-2) + "</p>";
            txt += "<p>(The numbers ";
            for ( var i=0; i<els.length; i++ ) {
                txt += els[i] + ", ";
            }
            txt = txt.substring(0,txt.length-2);
            txt += " were added to the data.)</p>";
        }
    } while (!isDatasetNice(arr));
    return { "array": arr, "text": txt };
}

// getButtonOptions: method of TrialGenerator object
//  provides an array of HTML strings with the appropriate text for the option buttons which should appear on the present trial
//  includes a "Quit" button iff participant has already completed the minimum number of questions in each category
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

// getOptionProperties:
//  given the category of a trial and the text of the button option chosen,
//  returns whether the same or a different category was chosen
//  and whether a similar or different dataset was chosen
function getOptionProperties( category, option_text ) {
    var option_type;
    if ( option_text=="Quit" ) {
        option_type = "NA"
    } else if ( option_text.indexOf( category ) != -1 ) {
        option_type = "same";
    } else {
        option_type = "different";
    }
    var option_similarity;
    if ( option_text=="Quit" ) {
        option_type = "NA"
    } else if ( ( option_text.indexOf( "a new story problem" ) != -1 ) ||
         ( option_text.indexOf( "a new <em>story problem</em>" ) != -1 ) ||
         ( option_text.indexOf( "<em>a new story problem</em>." ) != -1 ) ) {
        option_similarity = "different";
    } else {
        option_similarity = "similar";
    }
    return { "option_type": option_type, "option_similarity": option_similarity };
}

function getCentTend( dataset, measure ) {
    if ( measure=="Mean" ) {
        return getMean( dataset );
    } else if ( measure=="Median" ) {
        return getMedian( dataset );
    } else if ( measure=="Mode" ) {
        return getMode( dataset );
    }
}

function getFeedback( dataset, measure ) {
    var correct = "<img src='small-green-check-mark-th.png'>  " + " Yes, that's correct!";
    var incorr  = "<img src='small-red-x-mark-th.png'>  " + " Oops, that's not correct.<br><br>";
    switch ( measure ) {
        case "Mean":
            var s = getSum(dataset);
            var l = dataset.length;
            incorr += "The sum of the numbers is " + s + " and there are " + l + " numbers. So the Mean is " + s + "/" + l + "=" + getMean(dataset) + ".";
            break;
        case "Median":
            var sorted = getSorted(dataset);
            incorr += "If you put the numbers in order, you get " + sorted.toString() + ". Then the Median is just the middle number, which is " + getMedian(dataset) + ".";
            break;
        case "Mode":
            var sorted = getSorted(dataset);
            var m = getMode(dataset);
            incorr += "If you put the numbers in order, you get " + sorted.toString() + ". You can see that " + m + " appears " + getFrequency(m,dataset) + " times, more often than any other number. So the Mode is " + m + ".";
            break;
    }
    return { false: incorr, true: correct };
}

//////////////////////////////////////////////////////////////////////
// utilities
//////////////////////////////////////////////////////////////////////

// getSum( a ) : return the sum of an array of numbers
function getSum(a) {
    if ( a.length==0 ) {
        return 0;
    } else {
        return a.reduce(function(a,b){return Number(a)+Number(b);});
    }
}

// getMean( a ) : return the integer mean of an array of numbers, or false if the mean is not an integer
function getMean(a) {
    if (a.length==0) {
        return false;
    } else {
        var m = getSum(a)/a.length;
        if ( m == Math.floor(m) ) {
            return m;
        } else {
            return false;
        }
    }
}

// getSorted( a ) : return an array with the same elements as an array of numbers a, sorted from small to large
function getSorted(a) {
    return (a.slice()).sort(function(a,b){return a-b});
}

// getMedian( a ) : return the median of an array of numbers, or false if the array has an even number of numbers
function getMedian(a) {
    if (((a.length)%2)==0) {
        return false;
    } else {
        return getSorted(a)[ (a.length-1)/2 ];
    }
}

// getFrequency( n, a ) : return the number of times n occurs in a
function getFrequency(n,a) {
    var f = 0;
    for ( var i=0; i<a.length; i++ ) {
        if (a[i]==n) { f++; }
    }
    return f;
}

// getMode( a ) : return the mode of an array of numbers, or false if there is more than one mode, or the array is empty
//  eventually rewrite this to use getFrequency, if you have time
function getMode(a) {
    if (a.length==0) {
        return false;
    } else {
        var freqs = {};
        var max_freq = 0;
        var el;
        for ( var i=0; i<a.length; i++ ) {
            el = a[i];
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
        if ( modal_els.length > 1 ) {
            return false;
        } else {
            return modal_els[0];
        }
    }
}

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