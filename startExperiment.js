///////////////////////////////////////////////////////////////////////////
// main experiment structure
// startExperiment, doPretest, doInstructions, doTraining, endExperiment
///////////////////////////////////////////////////////////////////////////

// global variables
//  assigned by startExperiment call
//  only referenced in main experiment structure
var startExperiment_pretest_questions;
var startExperiment_training_questions;
var startExperiment_skip;

// startExperiment: assign global vars, randomize training questions, and run pretest
function startExperiment( display_loc, prepend_data, external_content ) {
    startExperiment_pretest_questions   = external_content.pretest_questions;
    startExperiment_training_questions  = shuffle( external_content.training_questions.slice(0,external_content.training_questions.length) );
    
	// build skip object here
	var skip_training = false; // for debug purposes;
	$.ajax({
		type: 'post',
		cache: false,
		url: 'check_progress.php',
		data: {"sid": prepend_data.subjid},
		success: function(data)
		{
			var progress = JSON.parse(data);
			progress.training = skip_training;
			startExperiment_skip = progress;
			
			doIntroduction( display_loc, prepend_data );
		},
		error: function()
		{
			var progress = { "introduction": false, "pretest": false, "instructions": false, "training": false };
			startExperiment_skip = progress;
			
			doIntroduction( display_loc, prepend_data );
		}
	});	
}

// doIntroduction: and then pretest
function doIntroduction( display_loc, prepend_data ) {
	var subjectid = prepend_data.subjid;
    
	var callback = function() {
		// update subject progress in database
		$.ajax({
			type: 'post',
			cache: false,
			url: 'update_progress.php',
			data: {"sid": subjectid, "flag": "introduction"}
		});
		
        doPretest( display_loc, prepend_data );
    }
    var introduction = [
        "<p>The tutorial consists of 4 parts: a short test, instructions, a set of practice problems, and a few background questions. It should take about 30 minutes. Please do it all in one sitting - your work will not be saved if you close the page before finishing.</p><p><em>IMPORTANT:</em> During the tutorial, <em>DO NOT USE</em> your browser's 'Forward', 'Back', or 'Refresh' buttons. If you do, <em>all your work will be lost.</em></p><p>Click below to start.</p>",
        "<h1>Test Section</h1><p>In this section of the tutorial, you will take a short multiple choice test about mean, median, and mode.</p><p>The purpose of this test is to find out how much you already know about these concepts. So, please don't use any outside sources (books, friends, internet).</p><p>This test doesn't count towards your grade, but it's very similar to the test you'll receive later in class, which <strong>will</strong> count towards your grade. So this test is good practice for the real one.</p><p>Please do <em>NOT</em> use a calculator in this section. You won't have a calculator on the test in class, so it's better to practice without one too.</p>"
    ];
	if(startExperiment_skip.introduction){
		doPretest( display_loc, prepend_data );
	} else {
		doSlideshow( display_loc, introduction, callback );
	}
}

// doPretest: and then show training instructions
function doPretest( display_loc, prepend_data ) {
    var callback = function() {
		// update subject progress in database
		$.ajax({
			type: 'post',
			cache: false,
			url: 'update_progress.php',
			data: {"sid": prepend_data.subjid , "flag": "pretest"}
		});
		
		// next section
        doInstructions( display_loc, prepend_data );
    };
    if ( startExperiment_skip.pretest ) {
        var questions = []; 
    } else {
        var questions = startExperiment_pretest_questions;
    }
	
	// if we are skipping this because someone has already done it,
	// then we do not want to write a redundant flag to the database
	if(questions.length > 0){
		doRadioSurvey( questions, "pretestdata", display_loc, prepend_data, callback );
	} else {
		doInstructions( display_loc, prepend_data );
	}
}

// doInstructions: and then run the training
function doInstructions( display_loc, prepend_data ) {
    var callback = function() {
		// update subject progress in database
		$.ajax({
			type: 'post',
			cache: false,
			url: 'update_progress.php',
			data: {"sid": prepend_data.subjid , "flag": "instructions"}
		});
		
		// next section
        doTraining( display_loc, prepend_data );
    };
    var buttons = '<button type="button" class="option_buttons">Find the <em>Mean</em> for a <em>modified set of data</em>.</button>' +
        '<button type="button" class="option_buttons">Find the <em>Median</em> for the <em>same set of data</em>.</button>' +
        '<button type="button" class="option_buttons">Find the <em>Mode</em> for the <em>same set of data</em>.</button><br>' +
        '<button type="button" class="option_buttons">Find the <em>Mean</em> for a <em>different story problem</em>.</button>' +
        '<button type="button" class="option_buttons">Find the <em>Median</em> for the <em>different story problem</em>.</button>' +
        '<button type="button" class="option_buttons">Find the <em>Mode</em> for the <em>different story problem</em>.</button>';
    var button_00 = '<button type="button" class="option_buttons">Find the <em>Mean</em> for a <em>modified set of data</em>.</button>';
    var button_10 = '<button type="button" class="option_buttons">Find the <em>Mean</em> for a <em>different story problem</em>.</button>';
    var button_01 = '<button type="button" class="option_buttons">Find the <em>Median</em> for the <em>same set of data</em>.</button>';
    var progbar = "<table border='1'><tr>" + // "<table border='1'><tr><td colspan='3'>Your Progress</td></tr><tr>" +
        "<td><strong>Mean</strong><br>2 out of 5 complete</td>" +
        "<td><strong>Median</strong><br>1 out of 5 complete</td>" +
        "<td><strong>Mode</strong><br>3 out of 5 complete</td>" +
        "</tr></table>";
    var instructions = [
        "<h1>Instruction Section</h1><p>This section of the tutorial will explain to you more about the concepts of mean, median, and mode.</p>", "<h2>Mean</h2><p>The <strong>mean</strong> is the same as the <strong>average</strong>. To find the mean of a set of numbers, divide their sum by how many numbers there are.</p><p>For example, if the numbers are [ 10, 8, 8, 4, 5, 6, 8 ], then their sum is 49, and there are 7 numbers. So the mean is 49/7=7.</p>",
        "<h2>Median</h2><p>The <strong>median</strong> of a set of numbers is the number that is in the middle when the numbers are put in order.</p><p>To find the median, put them in order and then look to see which number is in the middle.</p><p>For example, if the numbers are [ 10, 8, 8, 4, 5, 6, 8 ], when you put them in order you get [ 4, 5, 6, 8, 8, 8, 10 ]. The number in the middle is 8, so the median is 8.</p>",
        "<h2>Mode</h2><p>The <strong>mode</strong> of a set of numbers is the number that appears most commonly.</p><p>To find the mode, just count how many times each number appears and find which one appears the most. It's easiest to do this if you put the numbers in order first.</p><p>For example, if the numbers are [ 10, 8, 8, 4, 5, 6, 8 ], when you put them in order you get [ 4, 5, 6, 8, 8, 8, 10 ]. 8 appears 3 times, more often than any other number, so the mode is 8.</p>",
        "<h1>Practice Section</h1><p>In this section, you'll have a chance to practice the concepts you just learned.</p><p>You will see a series of practice problems for calculating mean, median, and mode. You'll have to answer each problem first, and then you'll be shown the correct answer.</p><p>In this section, please <em>feel free to use a calculator</em>. If you use an online calculator such as <a href='http://www.metacalc.com' target='_blank'>Metacalc</a>, be sure to open it in a separate window.</p>",
        "<p>After you complete each example, you will be able to choose what kind of example you want to see next. You'll see a set of buttons like this at the bottom of the page:</p><p>"+buttons+"</p><p>You can select mean, median, or mode by choosing buttons in the different columns. If you choose buttons in the first row, the next example will use the same story problem and either the same data or slightly modified data. If you choose buttons in the second row, the next example will use a completely different story problem and data.</p>",
        "<p>For example, suppose you did the following problem:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>Then suppose you pressed this button:</p><p>" + button_00 + "</p><p>In this case, you'd see a problem like this:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5, <ins>6</ins>, <ins>8</ins> ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>Notice that you're still being asked about the mean, but the data has been changed a bit. You can choose this option to see how the mean (or median, or mode) changes as a result of changes to the data.</p>",
        "<p>Now, suppose again that you did the following problem:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>But suppose you pressed this button instead:</p><p>" + button_01 + "</p><p>In this case, you'd see a problem like this:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>median</em> number of hamburgers eaten.'</p></div><p>Notice that the story and data are the same, but now you're being asked for the median instead of the mean. You can choose this option to compare different ways of calculating central tendency for the same data.</p>",
        "<p>Finally, suppose again that you did the following problem:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>But suppose you pressed this button instead:</p><p>" + button_10 + "</p><p>In this case, you'd see a problem like this:</p><div class='example'><p>'Each salesperson in an ad agency is evaluated based on how many contracts they bring in per year. Below you can see the number of contracts won by each of several salespeople.</p><p>[ 5, 11, 9, 9, 17, 20, 2 ]</p><p>Find the <em>mean</em> number of contracts won.'</p></div><p>You're still being asked for the mean, but it's a totally different story problem. You can choose this option if you want to see a new story problem with different data.</p>",
        "<p>You will have to complete at least 5 examples of mean, 5 of median, and 5 of mode, for 15 total. You can do them in any order you like, and it doesn't matter whether (or how much) you switch to new story problems.</p><p>At the top of the page, you'll see a table like this:</p><p>"+progbar+"</p><p>This will tell you how many problems you have finished already for each type. Once you've finished this minimum number, a 'Quit' button will appear which you can use to end the tutorial. However, you can do even more examples if you want - there's no limit!</p><p>OK, that's all! Click below to get started!"
    ];
    if ( startExperiment_skip.instructions ) 
	{ 
		doTraining( display_loc, prepend_data );
	} else {
		doSlideshow( display_loc, instructions, callback );
	}
}

// doTraining: and then go to background demographics
function doTraining( display_loc, prepend_data ) {
    // callback is called at the end of training
    var callback = function( data ) {
		// update subject progress in database
		$.ajax({
			type: 'post',
			cache: false,
			url: 'update_progress.php',
			data: {"sid": prepend_data.subjid , "flag": "training"}
		});
	
           // display_loc.html( JSON.stringify( data ) );
        doDemographics( display_loc, prepend_data );
    };
	// check to see if there is any progress
    if ( startExperiment_skip.training ) {
        doDemographics( display_loc, prepend_data );
    } else {
        $.ajax({
            type: 'post',
            cache: false,
            url: 'restore_progress.php',
            data: {"subjid": prepend_data.subjid},
            success: function(data) {
                // trial_data will contain an array with each element representing the trial
                // data can be accessed by name, i.e. trial_data[0].correct will indicate whether the first trial was correct or not.
                var trial_data = JSON.parse(data);
                if ( trial_data != undefined ) {
                    // figure out how many trials were completed in each category and which category was requested next
                    var progress_by_category = { "Mean": 0, "Median": 0, "Mode": 0 };
                    for ( var i=0; i<trial_data.length; i++ ) {
                        if ( trial_data.category!=undefined ) {
                            progress_by_category[ trial_data.category ] += 1;
                        }
                    }
                    var next_category;
                    if ( trial_data.option_category!=undefined ) {
                        next_category = trial_data.option_category;
                    } else {
                        next_category = [ "Mean", "Median", "Mode" ][ Math.floor( Math.random()*3 ) ];
                    }
                    // create a trial generator using the progress information
                    var trial_generator = new TrialGenerator( startExperiment_training_questions, progress_by_category );
                    var iter_num    = trial_data.length;
                    var option_text = "recovery: " + next_category;
                    iterateTrialGenerator( display_loc, prepend_data, trial_generator, iter_num, option_text, trial_data, callback );
                } else {
                    // this likely means that they did not complete any trials, and therefore should start from scratch.
                    // we do that by just creating a trial generator without previous progress information
                    var trial_generator = new TrialGenerator( startExperiment_training_questions );
                    iterateTrialGenerator( display_loc, prepend_data, trial_generator, 0, "first trial", [], callback );
                }
            },
            error: function(){
                // this likely means that they did not complete any trials, and therefore should start from scratch.
                // we do that by just creating a trial generator without previous progress information
                var trial_generator = new TrialGenerator( startExperiment_training_questions );
                iterateTrialGenerator( display_loc, prepend_data, trial_generator, 0, "first trial", [], callback );
            }
        });
    }
}

// doDemographics: and then end the experiment
function doDemographics( display_loc, prepend_data ) {
    var callback = function() {
        endExperiment( display_loc );
    }
    var questions = [
        { "number": 0,
          "text": "<h1>Background Questions</h1><p>Congratulations! You're done with the tutorial. Finally, could you take a minute to answer a few questions about yourself?</p><p>This will just take a minute - honest!</p>" },
        { "number": 1,
          "text": "<p>Are you male or female?</p>",
          "answers": [ "Male", "Female" ] },
        { "number": 2,
          "text": "<p>Using the following scale, rate <em>how much you enjoyed</em> the training you were just given:</p>",
          "answers": [ "1 = extremely disliked", "2 = somewhat disliked", "3 = neutral", "4 = somewhat enjoyed", "5 = extremely enjoyed" ] },
        { "number": 3,
          "text": "<p>Using the following scale, rate <em>how useful to you</em> was the training you were just given:</p>",
          "answers": [ "1 = not at all useful", "2 = not very useful", "3 = neutral", "4 = somewhat useful", "5 = extremely useful" ] },
        { "number": 4,
          "text": "<p>How much anxiety do you feel doing math?</p>",
          "answers": [ "1 = low anxiety", "2 = slight anxiety", "3 = moderate anxiety", "4 = quite a bit of anxiety", "5 = high anxiety" ] },
        { "number": 5,
          "text": "<p>How much do you like math?</p>",
          "answers": [ "1 = I hate math", "2 = I don't like math", "3 = I feel neutral", "4 = I like math", "5 = I like math a lot" ] },
        { "number": 6,
          "text": "<p>Before this training, how much did you already know about how to calculate means, medians, and modes?</p>",
          "answers": [ "1 = I didn't know at all", "2 = I didn't know very much", "3 = I knew a little", "4 = I knew somewhat", "5 = I knew very well" ] }
    ];
    doRadioSurvey( questions, "demographicdata", display_loc, prepend_data, callback );
}    
          
// endExperiment: records completion data and displays completion message
/*
TBD (Josh?/David): right now this just displays the accumulated data so we know it's working. Eventually we need it to close down gracefully, possibly saving some info about completion to database (Josh?) and display a nice message to the participant (David).
*/
function endExperiment( display_loc ) {
    display_loc.html( "<p>The tutorial is now complete and your data has been recorded. Thank you for your participation! You may now close this browser window.</p>" );
}


//////////////////////////////////////////////////////////////////////
// helper functions for pretest and instructions
// doRadioSurvey, doRadioQuestion, doSlideshow
//////////////////////////////////////////////////////////////////////

// doRadioSurvey
//  ask a series of multiple-choice questions
function doRadioSurvey( questions, table_name, display_loc, prepend_data, callback ) {
    if ( questions.length==0 ) {
        callback();
    } else {
        var question = questions.shift();
        doRadioQuestion( display_loc, question, 
            function( data ) {
                trial_data = $.extend( {}, prepend_data, data );
                $.ajax({ 
					type: 'post', 
					cache: false, 
					url: 'submit_data_mysql.php',
					data: { 'table': table_name, 'json': JSON.stringify([[trial_data]] ) },
                    success: function(d) {
						console.log(d)
                        doRadioSurvey( questions, table_name, display_loc, prepend_data, callback );
					},
					error: function(d) {
						console.log(d);
                        doRadioSurvey( questions, table_name, display_loc, prepend_data, callback );
                    }
                } );
            } );
    }
}

// doRadioQuestion
//  ask a single multiple-choice question
function doRadioQuestion( display_loc, question, callback ) {
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
    var start_time = new Date();
    resp_func = function(e) {
        e.preventDefault();
		// check what kind of question this is
		// pretest question
        if ( ( question.answers != undefined ) && ( question.correct_response != undefined ) ) {
            var response = $('input[name=radio_option]:checked').val();
            if ( response == undefined ) {
                alert( "Please select an answer before proceeding." );
            } else {
                display_loc.html( "" );
                var end_time = new Date();
                $("#question_form").unbind("submit",resp_func);
                callback( { "number": question.number, "rt": end_time.getTime()-start_time.getTime(), "start": start_time.toString(), "end": end_time.toString(), "correct_response": question.correct_response, "response": response, "correct": (question.correct_response==response) } );
            }
		// what kind is this?
        } else if ( question.answers != undefined ) {
            var response = $('input[name=radio_option]:checked').val();
            if ( response == undefined ) {
                alert( "Please select an answer before proceeding." );
            } else {
                display_loc.html( "" );
                var end_time = new Date();
                $("#question_form").unbind("submit",resp_func);
                callback( { "number": question.number, "rt": end_time.getTime()-start_time.getTime(), "start": start_time.toString(), "end": end_time.toString(), "response": response } );
            }   
		// what kind is this?
        } else {
            display_loc.html( "" );
            var end_time = new Date();
            $("#question_form").unbind("submit",resp_func);
            callback( { "number": question.number, "rt": end_time.getTime()-start_time.getTime(), "start": start_time.toString(), "end": end_time.toString()  } );
        }
    }
    $("#submit_button").click( resp_func );
    $("#submit_button").focus();
    window.scrollTo(0,0);
}

// doSlideshow
//  present a sequence of text blocks
function doSlideshow( display_loc, content_array, callback ) {
    if ( content_array.length==0 ) {
        callback();
    } else {
        display_loc.html( content_array.shift() );
        var continue_button = "<p><button type='button' id='continue_button'>Continue</button></p>";
        display_loc.append( continue_button );
        $("#continue_button").click( function() {
            doSlideshow( display_loc, content_array, callback ); } );
        $("#continue_button").focus();
        window.scrollTo(0,0);
    }
}


//////////////////////////////////////////////////////////////////////
// helper classes and functions for training:
// iterateTrialGenerator
// TrialSpec class, doTrial
// TrialGenerator class, getNextTrial, other methods of TrialGenerator
//////////////////////////////////////////////////////////////////////

// iterateTrialGenerator(): does trials until a trial returns a false continue value
//  display_loc: an HTML div where the experiment is to be displayed
//  prepend_data: subject-level data to be prepended to each row of trial-level data
//  trial_generator: a TrialGenerator object which generates TrialSpec objects
//  iter_num: number of the current trial, or 0 for the first trial
//  option: option chosen on previous trial, or false for the first trial
//  accum_data: data rows from already completed trials, or [] for the first trial
function iterateTrialGenerator( display_loc, prepend_data, trial_generator, iter_num, option_text, accum_data, callback ) {
    var trial_spec  = trial_generator.getNextTrial( option_text );
    trial_spec.doTrial( display_loc,
        function( data ) {
            data        = $.extend( {}, prepend_data, { "trial_num": iter_num }, data );
            accum_data  = accum_data.concat( [ data ] );
            if ( data.option_text=="Quit" ) {
                callback( accum_data );
            } else {
                $.ajax({ 
					type: 'post', 
					cache: false, 
					url: 'submit_data_mysql.php',
					data: { 'table':'trialdata', 'json': JSON.stringify([[data]] ) },
                    success: function(d) {
						console.log(d)
						iterateTrialGenerator( display_loc, prepend_data, trial_generator, iter_num+1, data.option_text, accum_data, callback );
					},
					error: function(d) {
						console.log(d);
						iterateTrialGenerator( display_loc, prepend_data, trial_generator, iter_num+1, data.option_text, accum_data, callback );
/*
TBD (David): eventually something useful should happen on error, but at least now it will run without submit_data_mysql.php
*/
                    }
                } );
            }
        } 
	);
}

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

// doTrial: method of TrialSpec class
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
        var end_time = new Date();
        callback($.extend({},trial.data,
            {"response":response,"correct":correct,"rt":end_time.getTime()-start_time.getTime(),"start": start_time.toString(), "end": end_time.toString(), "option_selected":i,"option_text":trial.options[i]},
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
        '<div id="question">' +
            question_text + 
            answer_field +
            answer_button + '</div></div>' +
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
        if ( isNaN( $('#answer_box').val() ) ) {
            alert( "Please enter a number in the box. Your answer must be a number." );
        } else {
            $('#answer_button').hide();
            response = $('#answer_box').val();
            if ( ( response==="" ) || ( response===undefined ) ) {
                correct = false;
            } else {
                response = Number( response );
                correct = ( Math.abs(response-trial.answer)<=0.11 );
            }
            var feedback_text = "<p>" + trial.feedback[ correct ] + "</p>";
            $('#feedback').html( feedback_text );
            // add a class to feedback to indicate whether it is correct or not,
            // then show feedback and continue options,
            // with longer delay after incorrect answers
            if ( correct ) {
                $('#feedback').addClass('feedback_correct');
                $('#continue').show();
            } else {
                $('#feedback').addClass('feedback_incorrect');
                setTimeout( function() { $('#continue').show(); }, 10000 );
//                setTimeout( function() { $('#continue').show(); }, 1 );
            }
        }
    } );
    // set option buttons to return the trial when clicked
    $('.option_buttons').click( function() { returnResult(Number(this.id.replace("option_button_",""))); } );
    // record start time
    var start_time = new Date();
    window.scrollTo(0,0);
}

// TrialGenerator class
TrialGenerator = function( questions, progress_by_category ) {
    this.stories    = questions;
    this.categories = [ "Mean", "Median", "Mode" ];
    this.complete_targ  = 5;        // must complete this many probs in each category before Quit option available
    this.completes_tot  = [];       // total number currently completed in each category
    this.completes_rct  = [];       // number completed in each category since last change of story or data set
    if ( progress_by_category==undefined ) {
        for ( var i=0; i<this.categories.length; i++ ) {
            this.completes_tot[i] = 0;
        }
    } else {
        for ( var i=0; i<this.categories.length; i++ ) {
            this.completes_tot[i] = progress_by_category[ this.categories[i] ];
        }
    }
    this.getNextTrial       = getNextTrial;
    this.getOptionsText     = getOptionsText;
    this.getNextDataset     = getNextDataset;
    this.getProgressBar     = getProgressBar;
}

// getNextTrial(): method of TrialGenerator class
//  given the option selected by user on previous trial, or "first trial" if there is no previous trial,
//  generate TrialSpec object for the next trial
function getNextTrial( option_text ) {

    // determine trial params: category index, story index, and relation of new dataset to previous dataset
    // also, record category and data of previous trial for future reference
    var data_rel;
    var prev_cat;
    var prev_dataset;
    if ( option_text=="first trial" ) {
        prev_cat        = "NA (first trial)";
        prev_dataset    = "NA (first trial)";
        this.cat_idx    = 0;
        this.story_idx  = 0;
        data_rel        = "random";
    } else if ( option_text.indexOf( "recovery" ) != -1 ) {
        prev_cat        = "NA (recovery)";
        prev_dataset    = "NA (recovery)";
        this.cat_idx    = indexInArray( extractCategoryFromOptionText( option_text ), this.categories );
        this.story_idx  = 0;
        data_rel        = "random";
    } else {
        prev_cat     = this.categories[this.cat_idx];
        prev_dataset = this.dataset;
        for ( var i=0; i<this.categories.length; i++ ) {
            if ( this.categories[i]==extractCategoryFromOptionText( option_text ) ) {
                this.cat_idx = i;
            }
        }
        data_rel = extractRelationFromOptionText( option_text );
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
    var datatxt     = this.getNextDataset(data_rel,story.min,story.max);
    if ( cat=="Mean" ) {
        var questxt = "<p>Find the <em>Mean</em> of the " + story.ques + ". (Round off decimals to two decimal places.)</p>";
    } else {
        var questxt     = "<p>Find the <em>" + cat + "</em> of the " + story.ques + ".</p>";
    }
    var reminder = "";
    if ( data_rel=="identical" ) {
        reminder = "<p>(Remember, the <em>" + prev_cat + "</em> of this data was " + getCentTend(prev_dataset,prev_cat) + ".)</p>";
    } else if ( data_rel=="modified" ) {
        reminder = "<p>(Remember, the " + prev_cat + " of the previous data was " + getCentTend(prev_dataset,prev_cat) + ".)</p>";
    }
    var content     = "<div id='progressbar'><h3>Your Progress</h3>" + progbar + "</div><div id='question_text'>" + storytxt + datatxt + questxt + reminder;
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
    var data        = {
        "prev_category": prev_cat, "prev_dataset": prev_dataset.toString(),
        "prev_option_text": option_text, "prev_relation": extractRelationFromOptionText( option_text ),
        "storyidx": this.stories[this.story_idx].prbID, "category": cat, "dataset": this.dataset.toString(), "answerkey": answer
    };
    return new TrialSpec( cat, content, answer, feedback, options, data );
}

function getProgressBar() {
    var bar = "<ul>"; 
    for ( var i=0; i<this.categories.length; i++ ) {
        bar += "<li><h4>"+this.categories[i]+":</h4><p>"+this.completes_tot[i]+" out of "+this.complete_targ+" complete</p></li>";
    }
    bar += "</ul>";
    return bar;
}

// getNextDataset: method of TrialGenerator class
//  generates a new data set, records it in the TrialGenerator's dataset property, and returns an HTML text version thereof
//  if relation is random, new data is completely random within constraints of current value of this.story
//  if relation is identical, new data is same as old data
//  if relation is related, new data is a tweak of old data with changes highlighted in the HTML
function getNextDataset( relation, min, max ) {
    if ( relation=="random" ) {
        var dataset = generateNewDataset( min, max );
        var result  = stringifyNewDataset( dataset );
    } else if ( relation=="identical" ) {
        var dataset = this.dataset;
        var result  = stringifyNewDataset( dataset );
    } else if ( relation=="modified" ) {
        var old_dataset = this.dataset.slice(0,this.dataset.length);
        var dataset     = generateModifiedDataset( old_dataset, min, max );
        var result      = stringifyModifiedDataset( dataset, old_dataset );
    }
    this.dataset = dataset;
    return result;
}

// stringifyNewDataset: given an array of integers,
//  returns an HTML string version of the same
function stringifyNewDataset( ds ) {
    var result = "<p>Data set: ";
    for ( var i=0; i<ds.length; i++ ) {
        result += ds[i] + ", ";
    }
    result = result.substring(0,result.length-2) + "</p>";
    return result;
}

function stringifyModifiedDataset( new_ds, old_ds ) {
    var result  = "<p>Data set: ";
    var x       = createChangeRecord( old_ds, new_ds );
    var arr     = x.combined_array;
    var chgs    = x.change_record;
    var type    = x.change_type;
    var els     = [];
    for ( var i=0; i<arr.length; i++ ) {
        if ( chgs[i]=="none" ) {
            result += arr[i] + ", ";
        } else if ( chgs[i]=="ins" ) {
            result += "<ins>" + arr[i] + "</ins>, ";
            els.push( arr[i] );
        } else if ( chgs[i]=="del" ) {
            result += "<del>" + arr[i] + "</del>, ";
            els.push( arr[i] );
        }
    }
    result = result.substring(0,result.length-2) + "</p>";
    if ( type=="insertion" ) {
        result += "<p>(The numbers " + els[0] + " and " + els[1] + " were added.)</p>";
    } else if ( type=="deletion") {
        result += "<p>(The numbers " + els[0] + " and " + els[1] + " were removed.)</p>";
    } else if ( type=="substitution" ) {
        result += "<p>(The number " + els[0] + " was replaced with " + els[1] + ".)</p>";
    }
    return result;
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
    return { "option_category": new_category, "option_type": option_type, "option_relation": data_relation, "option_similarity": option_similarity };
}

function getCentTend( dataset, measure ) {
    if ( measure=="Mean" ) {
        var x = getMean( dataset );
        x = Math.round( x*100 ) / 100;
        return x;
    } else if ( measure=="Median" ) {
        return getMedian( dataset );
    } else if ( measure=="Mode" ) {
        return getMode( dataset );
    }
}

function getFeedback( dataset, measure ) {
    var correct = "<p><img src='small-green-check-mark-th.png'>  " + " Yes, that's correct!</p>";
    var incorr  = "<p><img src='small-red-x-mark-th.png'>  " + " Oops, that's not correct.</p>";
    switch ( measure ) {
        case "Mean":
            var s = getSum(dataset);
            var l = dataset.length;
            incorr += "<p>The sum of the numbers is " + s + " and there are " + l + " numbers. So the Mean is " + s + "/" + l + "=" + getCentTend( dataset, measure ) + ".</p>";
            break;
        case "Median":
            var sorted = getSorted(dataset);
            incorr += "<p>If you put the numbers in order, you get " + sorted.toString() + ". Then the Median is just the middle number, which is " + getCentTend( dataset, measure ) + ".</p>";
            break;
        case "Mode":
            var sorted = getSorted(dataset);
            var m = getCentTend( dataset, measure );
            incorr += "<p>If you put the numbers in order, you get " + sorted.toString() + ". You can see that " + m + " appears " + getFrequency(m,dataset) + " times, more often than any other number. So the Mode is " + m + ".</p>";
            break;
    }
    incorr += "<p>(The continue buttons will appear after several seconds.)</p>";
    return { false: incorr, true: correct };
}


//////////////////////////////////////////////////////////////////////
// dataset generation and modification
//////////////////////////////////////////////////////////////////////

// generateAndTest:
//  call func until test applied to its output returns true or counter runs out
//  return the output if true, false if the counter ran out
function generateAndTest( generator, testfunc, counter ) {
    var x;
    do {
        x = generator();
        counter--;
    } while ( (!testfunc(x)) && (counter>0));
    if ( counter<=0 ) {
        return false;
    } else {
        return x;
    }
}

// generateNewDataset
//  try to generate a dataset using numbers in [min,max] that is nice
function generateNewDataset( min, max ) {
    var generator = function() {
        var dataset = [];
        var length = 5 + Math.floor(Math.random()*3)*2;
        var num;
        for ( var i=0; i<length; i++ ) {
            num = randRange(min,max);
            dataset.push( num );
        }
        return dataset;
    }
    var tester = function( dataset ) {
        return ( isDatasetNice( dataset ) && ( getFrequencyProfile( dataset ).frequencies[0]==3 ) );
    }
    // if possible, try to generate a dataset with a mode with frequency 3
    var result = generateAndTest( generator, tester, 2000 );
    // if you failed, just generate any nice dataset
    if ( !result ) {
        result = generateAndTest( generator, isDatasetNice, 5000 );
    }
    return result;
}

function generateModifiedDataset( ds, min, max ) {
    var new_ds;
    var selector = Math.floor(Math.random()*3);
//    alert( selector );
    if ( selector==0 ) {
        new_ds = generateModifiedDatasetChangeMode( ds, min, max );
        if (!new_ds) { alert( "generateModifiedDatasetChangeMode failed" ); }
    } else if ( selector==1 ) {
        new_ds = generateModifiedDatasetChangeMedian( ds, min, max );
        if (!new_ds) { alert( "generateModifiedDatasetChangeMedian failed" ); }
    } else if ( selector==2 ) {
        new_ds = generateModifiedDatasetRandom( ds, min, max );
        if (!new_ds) { alert( "generateModifiedDatasetRandom failed" ); }
    }
    return new_ds;
}

function generateModifiedDatasetRandom( ds, min, max ) {
    var generator = function() {
        var modify_type;
        if (ds.length<=6) {
            modify_type = ["add","substitute"][Math.floor(Math.random()*2)];
        } else if (ds.length>=8) {
            modify_type = ["remove","substitute"][Math.floor(Math.random()*2)];
        } else if (ds.length==7) {
            modify_type = ["add","remove","substitute"][Math.floor(Math.random()*3)];
        }
        var new_ds;
        switch (modify_type) {
            case "add":
                new_ds = ds.slice(0,ds.length);
                new_ds.push( randRange(min,max) );
                new_ds.push( randRange(min,max) );
                break;
            case "remove":
                var del_idxs = randomSubsetIdxs(ds,2);
                new_ds = removeElsByIdxs(ds,del_idxs);
                break;
            case "substitute":
                var sub_idx = randomSubsetIdxs(ds,1)[0];
                var new_num;
                do {
                    new_num = randRange(min,max);
                } while ( new_num==ds[sub_idx] );
                new_ds = ( ds.slice(0,sub_idx) );
                new_ds.push( new_num );
                new_ds = new_ds.concat( ds.slice(sub_idx+1,ds.length) );
                break;
        }
        return new_ds;
    }
    var result = generateAndTest( generator, isDatasetNice, 5000 );
    return result;
}

function generateModifiedDatasetChangeMode( ds, min, max ) {
//    alert( ds );
    var ds_profile = getFrequencyProfile( ds );
//    alert( ds_profile.elements );
//    alert( ds_profile.frequencies );
    var selector;
    if ( ( ds_profile.frequencies[0]==2 ) && ( ds_profile.frequencies[1]==1 ) ) {
        if ( ds.length<=7 ) {
            selector = [ 0, 0, 1 ][ Math.floor(Math.random()*2) ];
        } else {
            selector = 1;
        }
    } else if ( ( ds_profile.frequencies[0]==3 ) && ( ds_profile.frequencies[1]==2 ) ) {
        if ( ds_profile.frequencies[2]==2 ) {    // there must be at least 3 different elements as required by isDatasetNice
            selector = 3;   // cannot use selector 2 because it would create an ambiguous mode
        } else {
            selector = [ 2, 2, 3 ][ Math.floor(Math.random()*3) ];
        }
    }
    // we guarantee that one of the above conditions must be true
    // by starting with them true and only using moves that keep them true
//    alert( "generateModifiedDatasetChangeMode: " + selector );
    switch ( selector ) {
        case 0: // choose one of the elements whose freq is 1 and increase its freq to 3
            var add_el = ds_profile.elements.slice(1,ds_profile.elements.length)[ Math.floor(Math.random()*(ds_profile.elements.length-1)) ];
            var new_ds = (ds.slice(0,ds.length)).concat( [ add_el, add_el ] );
            break;
        case 1: // change one instance of the freq 2 element to some freq 1 element
            var add_idx = 1 + Math.floor( Math.random() * ( ds_profile.elements.length-1 ) );
            var new_ds = []; var f;
            for ( var i=0; i<ds_profile.elements.length; i++ ) {
                if ( i==0 ) {
                    f=1;
                } else if ( i==add_idx ) {
                    f=2;
                } else {
                    f=ds_profile.frequencies[i];
                }
                for ( var j=0; j<f; j++ ) {
                    new_ds.push( ds_profile.elements[i] );
                }
            }            
            break;
        case 2: // remove 2 of the freq 3 element
            var new_ds = []; var f;
            for ( var i=0; i<ds_profile.elements.length; i++ ) {
                if ( i==0 ) {
                    f=1;
                } else {
                    f=ds_profile.frequencies[i];
                }
                for ( var j=0; j<f; j++ ) {
                    new_ds.push( ds_profile.elements[i] );
                }
            }            
            break;
        case 3: // change one instance of the freq 3 element to a freq 2 element
            var new_ds = []; var f;
            for ( var i=0; i<ds_profile.elements.length; i++ ) {
                if ( i==0 ) {
                    f=2;
                } else if ( i==1 ) {
                    f=3;
                } else {
                    f=ds_profile.frequencies[i];
                }
                for ( var j=0; j<f; j++ ) {
                    new_ds.push( ds_profile.elements[i] );
                }
            }
            break;
    }
    if (!new_ds) {
        alert( "false dataset: " + ds + "; selector: " + selector );
    } else if (!isDatasetNice(new_ds)) {
        alert( "naughty dataset: " + new_ds + " derived from " + ds + " via selector " + selector );
    }
    return new_ds;        
}

function generateModifiedDatasetChangeMedian( ds, min, max ) {
    var ds_median = getMedian(ds);
    var generator = function() {
        return generateModifiedDatasetRandom(ds,min,max);
    }
    var testfunc = function(new_ds) {
        return ( isDatasetNice(new_ds) && ( getMedian(new_ds)!=ds_median ) );
    }
    var new_ds = generateAndTest( generator, testfunc, 1000 );
    if ( new_ds ) {
        return new_ds;
    } else {
        return generateModifiedDatasetRandom( ds, min, max );
    }
}

function isDatasetNice(ds) {
    var dsprof  = getFrequencyProfile(ds);
    return     true
            && ( (ds.length%2)==1 )                                 // odd number of els
            && ( dsprof.elements.length>2 )                         // more than 2 unique elements
            && ( dsprof.frequencies[0]<=3 )                         // mode is 3 or less
            && ( dsprof.frequencies[0]==(dsprof.frequencies[1]+1) ) // contains an el with frequency = mode frequency - 1
            ;
}

// createChangeRecord
//  given new_ds created by applying a legal operation (add 2, remove 2, or change 1) to old_ds,
//  return an array with same els as new_ds but in order consistent with old_ds
//  and also a combined array with the els of both, again consistent with old_ds order,
//  and a record of which of these were added, removed, or changed
function createChangeRecord( old_ds, new_ds ) {
    var change_type;
    if ( old_ds.length==(new_ds.length-2) ) {
        change_type = "insertion";
    } else if ( old_ds.length==(new_ds.length+2) ) {
        change_type = "deletion";
    } else if ( old_ds.length==new_ds.length ) {
        change_type = "substitution";
    } else {
        alert( "createChangeRecord: unrecognized change type" );
        return false;
    }
    var final_array     = [];
    var combined_array  = [];
    var change_record   = [];
    var nds = new_ds.slice(0,new_ds.length);
    var el, idx;
    if ( change_type=="insertion" ) {
        for ( var i=0; i<old_ds.length; i++ ) {
            el = old_ds[i];                 // identify current element
            idx = indexInArray(el,nds);     // find its location in nds
            nds.splice( idx, 1 );           // remove it from nds
            final_array.push(el);           // add it to the reordered list
            combined_array.push(el);        // add it to the record of changes
            change_record.push("none");     // record it as no change
        }
        final_array = final_array.concat( nds );  // add remaining elements of nds to reordered list
        combined_array = combined_array.concat( nds );    // add these to the record of changes
        change_record = change_record.concat( [ "ins", "ins" ] ); // should be the case that exactly two were added
    } else if ( change_type=="deletion" ) {
        for ( var i=0; i<old_ds.length; i++ ) {
            el = old_ds[i];                 // identify current element
            idx = indexInArray(el,nds);     // find its location in nds
            if ( idx==-1 ) {                // this is an element that was removed
                combined_array.push(el);        // add it to the record of changes, but not the reordered list
                change_record.push("del");      // record it as removed
            } else {                        // the element was not removed
                nds.splice( idx, 1 );           // remove it from nds
                final_array.push(el);           // add it to the reordered list
                combined_array.push(el);        // add it to the record of changes
                change_record.push("none");     // record it as no change
            }
        }
    } else if ( change_type=="substitution" ) {
        var sub_idx;
        for ( var i=0; i<old_ds.length; i++ ) {
            el = old_ds[i];                 // identify current element
            idx = indexInArray(el,nds);     // find its location in nds
            if ( idx!=(-1) ) {                // if it's also in the new dataset 
                nds.splice( idx, 1 );           // remove it from nds
                final_array.push(el);           // add it to the reordered list
                combined_array.push(el);        // add it to the record of changes
                change_record.push("none");     // record it as no change
            } else {                        // if it's NOT in the new dataset, then this element was substituted
//                var isit = nds.constructor===Array;
//                alert( "isit? " + isit );
//                var a = "el: " + el + "; nds: " + nds + "; indexInArray(el,nds): " + indexInArray(el,nds);
//                for ( var i=0; i<nds.length; i++ ) { a += ( "; i: " + i + ", nds[i]: " + nds[i] ); }
//                alert(a);
                sub_idx = i;                    // record its position
                final_array.push( 0 );          // put a placeholder here in the reordered list
                combined_array.push(el);        // put the original el in the record of changes
                change_record.push("del");      // record it as removed
                combined_array.push( 0 );       // put a placeholder here in the record of changes
                change_record.push("ins");      // record it as added
            }
        }
        el = nds[0];                        // the remaining element (should be only 1) is the added one
        final_array[ sub_idx ] = el;        // put it into the appropriate position in the reordered list
        combined_array[ sub_idx+1 ] = el;   // put it into the appropriate position in the record of changes
    }
    return { "final_array": final_array, "combined_array": combined_array, "change_record": change_record, "change_type": change_type };
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

// getMean( a ) : return the integer mean of an array of numbers, or false if 4 * the mean is not an integer
function getMean(a) {
    return getSum(a)/a.length;
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

// getFrequencyProfile
//  given an array of numbers, return an array of its unique elements sorted by decreasing frequency,
//  an array of the frequencies of those elements in the original array
//  and an associative array pairing elements with frequencies
function getFrequencyProfile(array) {
    var frequency = {}, value;
    
    // compute frequencies of each value
    for(var i = 0; i < array.length; i++) {
        value = array[i];
        if(value in frequency) {
            frequency[value]++;
        }
        else {
            frequency[value] = 1;
        }
    }

    // make array from the frequency object to de-duplicate
    var uniques = [];
    for(value in frequency) {
        uniques.push(value);
    }

    // sort the uniques array in descending order by frequency
    function compareFrequency(a, b) {
        return frequency[b] - frequency[a];
    }
    uniques = uniques.sort(compareFrequency);
    
    // make array of frequencies of uniques in orig array
    var origfreqs = [];
    for(var i = 0; i < uniques.length; i++) {
        origfreqs.push( frequency[uniques[i]] );
    }

    return { "elements": uniques, "frequencies": origfreqs, "elements_frequencies": frequency };
}

// getMode( a ) : return the mode of an array of numbers, or false if there is more than one mode, or the array is empty
function getMode(a) {
    if (a.length==0) {
        return false;
    } else {
        return getFrequencyProfile(a).elements[0];
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

// return a copy of a with elements with indexs in idxs removed
function removeElsByIdxs( a, idxs ) {
    var result = [];
    for ( var i=0; i<a.length; i++ ) {
        if ( indexInArray(i,idxs)==-1 ) {
            result.push(a[i]);
        }
    }
    return result;
}

function indexInArray( el, arr ) {
    var idx = -1;
    for ( var i=0; i<arr.length; i++ ) {
        if ( arr[i]==el ) {
            idx = i;
            break;
        }
    }
    return idx;
}

function shuffle(o) { //v1.0
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

// randRange: return an int between min and max inclusive
function randRange( a, b ) {
    return a + Math.floor(Math.random()*(b-a+1));
}

