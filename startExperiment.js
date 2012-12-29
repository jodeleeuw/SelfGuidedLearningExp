//////////////////////////////////////////////////////////////////////
// pre-training sections (pretest and instructions):
// startExperiment, doRadioSurvey, doInstructions
//////////////////////////////////////////////////////////////////////

function startExperiment( display_loc, prepend_data, condition ) {
    var pretest_questions = [
        { "number": 0,
          "text": "<h1>Test Section</h1><p>In this section of the tutorial, you will take a short multiple choice test about mean, median, and mode.</p><p>The purpose of this test is to find out how much you already know about these concepts. So, please don't use any outside sources (books, friends, internet, calculator).</p><p>This test doesn't count towards your grade, but it's very similar to the test you'll receive later in class, which <strong>will</strong> count towards your grade. So this test is good practice for the real one.</p><p>Click below to start!</p>" },
        { "number": 1,
          "text": "1.  Five pizzas were given quality scores by an expert taster.  Their scores were: Pizza World = 8, Slices! = 3, Pisa Pizza = 2, Pizza a go-go = 4, Crusty's = 8. What are the mode, median and mean for this data set?",
          "answers": [ "A) mode = 8, median = 5, mean = 4", "B) mode = 5, median = 8, mean = 4", "C) mode = 8, median = 4, mean = 5", "D) mode = 5, median = 4, mean = 8" ],
          "key": 2 },
        { "number": 2,
          "text": "2.  Imagine a vocabulary test in which 15 students do very well, getting scores of 98, 99, and 100 out of 100 possible points.  However, the remaining 3 students get very poor scores: 5, 8, and 9.  Will the mode be less than or more than the mean?",
          "answers": [ "A) the mode will be less than the mean", "B) the mode will be more than the mean", "C) the mode and mean will be the same", "D) more information is needed about the particular scores" ],
          "key": 1 },
        { "number": 3,
          "text": "3.  There are 7 players on a particular basketball team.  On a particular game, the median number of points scored by each player was 12 and no two players scored the same number of points.  If the lowest and highest scoring players are not considered, what will be the median of the remaining 5 players' scores?",
          "answers": [ "A) more information is needed about the particular scores", "B) 8", "C) 10", "D) 12" ],
          "key": 3 },
        { "number": 4,
          "text": "4.  Three children in a family have shoe sizes of 5, 10, and 9.  What are mean and median for the shoes sizes in this family?",
          "answers": [ "A) mean = 9, median = 10", "B) mean = 9, median = 9", "C) mean = 8, median = 10", "D) mean = 8, median = 9" ],
          "key": 3 }
    ];
    doRadioSurvey( pretest_questions, "pretestdata", display_loc, prepend_data, condition );
}

function doRadioSurvey( questions, table_name, display_loc, prepend_data, condition ) {
    if ( questions.length==0 ) {
        doInstructions( display_loc, prepend_data, condition );
    } else {
        var question = questions.shift();
        doRadioQuestion( display_loc, question, 
            function( data ) {
                data = $.extend( {}, prepend_data, data );
                $.ajax({ 
					type: 'post', 
					cache: false, 
					url: 'submit_data_mysql.php',
					data: { 'table': table_name, 'json': JSON.stringify([[data]] ) },
                    success: function(d) {
						console.log(d)
                        doRadioSurvey( questions, table_name, display_loc, prepend_data, condition );
					},
					error: function(d) {
						console.log(d);
                        doRadioSurvey( questions, table_name, display_loc, prepend_data, condition );
                    }
                } );
            } );
    }
}

function doRadioQuestion( display_loc, question, callback_function ) {
    var content = "<form id='question_form' name='question_form' action=''><p>" + question.text + "</p>";
    if ( question.answers != undefined ) {
        for ( var i=0; i<question.answers.length; i++ ) {
            content += "<input type='radio' name='radio_option' value='" + i.toString() + "'>" + question.answers[i] + "<br>";
        }
        content += "<br><input type='submit' id='submit_button' name='submit_button' value='Submit'></form>";
    } else {
        content += "<br><input type='submit' id='submit_button' name='submit_button' value='Continue'></form>";
    }
    display_loc.html( content );
    resp_func = function(e) {
        e.preventDefault();
        if ( question.answers != undefined ) {
            var response = $('input[name=radio_option]:checked').val();
            if ( response == undefined ) {
                alert( "Please select an answer before proceeding." );
            } else {
                display_loc.html( "" );
                $("#question_form").unbind("submit",resp_func);
                callback_function( { "number": question.number, "key": question.key, "response": response, "correct": (question.key==question.response) } );
            }
        } else {
            display_loc.html( "" );
            $("#question_form").unbind("submit",resp_func);
            callback_function( { "number": question.number } );
        }
    }
    $("#submit_button").click( resp_func );
    $("#submit_button").focus();
}

function doInstructions( display_loc, prepend_data, condition ) {
    var buttons = '<button type="button" class="option_buttons">Find the <em>Mean</em> for a <em>modified set of data</em>.' +
        '<button type="button" class="option_buttons">Find the <em>Median</em> for the <em>same set of data</em>.' +
        '<button type="button" class="option_buttons">Find the <em>Mode</em> for the <em>same set of data</em>.<br>' +
        '<button type="button" class="option_buttons">Find the <em>Mean</em> for a <em>different story problem</em>.' +
        '<button type="button" class="option_buttons">Find the <em>Median</em> for the <em>different story problem</em>.' +
        '<button type="button" class="option_buttons">Find the <em>Mode</em> for the <em>different story problem</em>.';
    var progbar = "<table border='1'><tr><td colspan='3'>Your Progress</td></tr><tr>" +
        "<td><strong>Mean</strong><br>2 out of 5 complete</td>" +
        "<td><strong>Median</strong><br>1 out of 5 complete</td>" +
        "<td><strong>Mode</strong><br>3 out of 5 complete</td>" +
        "</tr></table>";
    var instructions = [
        "<h1>Instruction Section</h1><p>This section of the tutorial will explain to you more about the concepts of mean, median, and mode.</p>", "<p>Placeholder for explanation of mean.</p>", "<p>Placeholder for explanation of median.</p>", "<p>Placeholder for explanation of mode.</p>", "<h1>Practice Section</h1><p>In this section, you'll have a chance to practice the concepts you just learned.</p><p>You will see a series of practice problems for calculating mean, median, and mode. You'll have to answer each problem first, and then you'll be shown the correct answer.</p><p>After you complete each example, you will be able to choose what kind of example you want to see next. You'll see a set of buttons like this at the bottom of the page:</p><p>"+buttons+"</p><p>You can select mean, median, or mode by choosing buttons in the different columns. If you choose buttons in the first row, the next example will use the same story problem and either the same data or slightly modified data. If you choose buttons in the second row, the next example will use a completely different story problem and data.</p>",
        "<p>You will have to complete at least 5 examples of each type of problem, i.e. 15 total. Once you've finished this minimum number, a 'Quit' button will appear which you can use to end the tutorial. However, you're welcome to do even more examples if you want - there's no limit!</p><p>At the top of the page, you'll see a table like this:</p><p>"+progbar+"</p><p>This will tell you how many problems you have finished already for each type.</p><p>OK, that's all! Click below to get started!"
    ];
    var completion_function = function() {
        var trial_generator = new TrialGenerator( condition, false );
        doTrainingSession( display_loc, prepend_data, trial_generator, 0, "first trial", [] );
    };
    doSlideshow( display_loc, instructions, completion_function );
}

function doSlideshow( display_loc, content_array, completion_function ) {
    if ( content_array.length==0 ) {
        completion_function();
    } else {
        display_loc.html( content_array.shift() );
        var continue_button = "<p><button type='button' id='continue_button'>Continue</button></p>";
        display_loc.append( continue_button );
        $("#continue_button").click( function() {
            doSlideshow( display_loc, content_array, completion_function ); } );
        $("#continue_button").focus();
    }
}

//////////////////////////////////////////////////////////////////////
// training section:
// doTrainingSession, endExperiment
//////////////////////////////////////////////////////////////////////

// doTrainingSession(): does trials until a trial returns a false continue value
//  display_loc: an HTML div where the experiment is to be displayed
//  prepend_data: subject-level data to be prepended to each row of trial-level data
//  trial_generator: a TrialGenerator object which generates TrialSpec objects
//  iter_num: number of the current trial, or 0 for the first trial
//  option: option chosen on previous trial, or false for the first trial
//  accum_data: data rows from already completed trials, or [] for the first trial
function doTrainingSession( display_loc, prepend_data, trial_generator, iter_num, option_text, accum_data ) {
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
						doTrainingSession( display_loc, prepend_data, trial_generator, iter_num+1, data.option_text, accum_data );
					},
					error: function(d) {
						console.log(d);
						doTrainingSession( display_loc, prepend_data, trial_generator, iter_num+1, data.option_text, accum_data );
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
            extractDataFromOptionText( trial.category, trial.options[i] ) ) );
    }
    // content that will go into the page
    var question_text   = trial.question;
    var answer_field    = '<input type="text" id="answer_box"></input>';
    var answer_button   = '<button type="button" id="answer_button">Show the answer</button>';
    var option_prompt   = 'Choose the next problem:';
    var option_buttons  = '';
    for ( var i=0; i<trial.options.length; i++ ) {
        if ( i==3 ) { option_buttons += "<br>"; }
        // the above is a hack which relies on knowing that the option buttons come in sets of 3
        // I want the options in the second set of 3 to appear below the corresponding ones in the first set
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
David 2012.12.23
condition no longer does anything because we have changed experimental design so that there is no manipulation.
however, I am leaving the parameter there so that function calls which rely on it will not be screwed up.
eventually we should get rid of it.
*/
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
    this.complete_targ  = 5;        // must complete this many probs in each category before Quit option available
    this.completes_tot  = [];       // total number currently completed in each category
    this.completes_rct  = [];       // number completed in each category since last change of story or data set
    for ( var i=0; i<this.categories.length; i++ ) { this.completes_tot[i] = 0; }
/*    
    this.curr_cat_idx   = 0;        // index of category for the first example to be shown
    this.curr_story_idx = 0;        // index of story for the first example to be shown
*/
    this.condition          = condition;
    this.getNextTrial       = getNextTrial;
    this.getOptionsText     = getOptionsText;
    this.getNewDataset      = getNewDataset;
    this.getProgressBar     = getProgressBar;
}

function getNextTrial( option_text ) {
    // determine trial params: category index, story index, and relation of new dataset to previous dataset
    var data_rel;
    if ( option_text=="first trial" ) {
        this.cat_idx    = 0;
        this.story_idx  = 0;
        data_rel        = "random";
    } else {
        var cat = extractCategoryFromOptionText( option_text );
        for ( var i=0; i<this.categories.length; i++ ) {
            if ( this.categories[i]==cat ) {
                this.cat_idx = i;
            }
        }
        var data_rel = extractRelationFromOptionText( option_text );
        if ( data_rel=="random" ) {
            // in this case, we are starting a new story problem, so increment the story index
            // this is a hack - it relies on knowledge that the data relation is random iff we start a new story problem
            this.story_idx = (this.story_idx + 1)%(this.stories.length);
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
    if ( (data_rel=="modified") || (data_rel=="random") ) {
        // in either of these cases, we are changing data set,
        // so set the completes since last change to 0 for everything but the current category and 1 for the current category
        for ( var i=0; i<this.categories.length; i++ ) {
            if ( i==this.cat_idx ) {
                this.completes_tot[i]++;
                this.completes_rct[i]=1;
            } else {
                this.completes_rct[i]=0;
            }
        }
    } else {
        // in this case, we are not changing story or data set,
        // so increment the completes since last change for the current category and leave others unchanged
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
    var options     = this.getOptionsText();
    
    // generate data to be recorded (as opposed to above "dataset" which is what is displayed to participant) and return trial specification
    // once we have more realistic content, we should add more detailed data, e.g. the actual correct answer.
    var data        = {"storyidx":this.story_idx,"category":cat,"dataset":this.dataset.toString(),"answerkey":answer};
    return new TrialSpec( cat, content, answer, feedback, options, data );
}

function getProgressBar() {
    var bar = "<table border='1'><tr><td colspan='"+this.categories.length+"'>Your Progress</td></tr><tr>";
    for ( var i=0; i<this.categories.length; i++ ) {
        bar += "<td><strong>"+this.categories[i]+":</strong><br>"+this.completes_tot[i]+" out of "+this.complete_targ+" complete</td>";
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
    } else if ( relation=="modified" ) {
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

// getOptionsText: method of TrialGenerator object
//  provides an array of HTML strings with the appropriate text for the option buttons which should appear on the present trial
//  includes a "Quit" button iff participant has already completed the minimum number of questions in each category

function getOptionsText() {
    var options = [];
    // options for "related" data sets
    for ( var i=0; i<this.categories.length; i++ ) {
        if ( this.completes_rct[i]>0 ) {
            options.push( "Find the <em>" + this.categories[i] + "</em> for a <em>modified set of data</em>." );
        } else {
            options.push( "Find the <em>" + this.categories[i] + "</em> for the <em>same set of data</em>." );
        }
    }
    // options for "unrelated" data sets
    for ( var i=0; i<this.categories.length; i++ ) {
        options.push( "Find the <em>" + this.categories[i] + "</em> for a <em>different story problem</em>." );
    }
    // quit option, if applicable
    var quit_avail = true;
    for ( var i=0; i<this.categories.length; i++ ) {
        quit_avail = quit_avail && ( this.completes_tot[i]>=this.complete_targ );
    }
    if ( quit_avail ) {
        options.push( "Quit" );
    }
    return options;
}

// extractCategoryFromOptionText
//  given the text of the button option chosen,
//  returns the category of the button option
function extractCategoryFromOptionText( option_text ) {
    var categories = [ "Mean", "Median", "Mode" ];
    var result = "NA";
    for ( var i=0; i<categories.length; i++ ) {
        if ( option_text.indexOf( categories[i] ) != -1 ) {
            result = categories[i];
        }
    }
    return result;
}

// extractRelationFromOptionText
//  given the text of the button option chosen,
//  returns the relationship of the next dataset to the present dataset designated in the button
function extractRelationFromOptionText( option_text ) {
    var relations = [ "modified set of data", "same set of data", "different story problem" ];
    var result = "NA";
    if ( option_text.indexOf( "different story problem" ) != -1 ) {
        result = "random";
    } else if ( option_text.indexOf( "same set of data" ) != -1 ) {
        result = "identical";
    } else if ( option_text.indexOf( "modified set of data" ) != -1 ) {
        result = "modified";
    }
    return result;
}

// extractDataFromOptionText:
//  given the category of a trial and the text of the button option chosen,
//  returns whether the same or a different category was chosen
//  and whether a similar or different dataset was chosen
function extractDataFromOptionText( category, option_text ) {
    var option_type;
    var new_category = extractCategoryFromOptionText( option_text );
    if ( new_category=="NA" ) {
        option_type = "NA";
    } else {
        option_type = [ "different", "same" ][ Number(category==new_category) ];
    }
    var option_similarity;
    var data_relation = extractRelationFromOptionText( option_text );
    if ( data_relation=="NA" ) {
        option_similarity = "NA";
    } else if ( ( data_relation=="identical" ) || ( data_relation=="modified" ) ) {
        option_similarity = "related";
    } else if ( data_relation=="random" ) {
        option_similarity = "unrelated";
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