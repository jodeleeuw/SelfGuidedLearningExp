<!doctype html>

<?php

include('p101_database_connect.php');

session_start();

$sid = SID; //Session ID #
$authenticated = $_SESSION['CAS'];

//send user to CAS login if not authenticated
if (!$authenticated) {
  $_SESSION['CAS'] = true;
  header("Location: https://cas.iu.edu/cas/login?cassvc=IU&casurl=http://perceptsconcepts.psych.indiana.edu/experiments/p101/");
  exit;
}

if ($authenticated) {
  //validate since authenticated
  if (isset($_GET["casticket"])) {
	//set up validation URL to ask CAS if ticket is good
	$_url = 'https://cas.iu.edu/cas/validate';
	$cassvc = 'IU';  //search kb.indiana.edu for "cas application code" to determine code to use here in place of "appCode"
	$casurl = 'http://perceptsconcepts.psych.indiana.edu/experiments/p101/'; //same base URLsent
	$params = "cassvc=$cassvc&casticket=$_GET[casticket]&casurl=$casurl";
	$urlNew = "$_url?$params";

	//CAS sending response on 2 lines.  First line contains "yes" or "no".  If "yes", second line contains username (otherwise, it is empty).
	$ch = curl_init();
	$timeout = 5; // set to zero for no timeout
	curl_setopt ($ch, CURLOPT_URL, $urlNew);
	curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
	ob_start();
	curl_exec($ch);
	curl_close($ch);
	$cas_answer = ob_get_contents();
	ob_end_clean();
	
	//split CAS answer into access and user
	list($access,$user) = split("\n",$cas_answer,2);
	$access = trim($access);
	$user = trim($user);
		
	//set user and session variable if CAS says YES
	if ($access == "yes") {
        $_SESSION['user'] = $user;
		
		// $user is the IU username
	}
  }
  else
  {
     $_SESSION['CAS'] = true;
     header("Location: https://cas.iu.edu/cas/login?cassvc=IU&casurl=http://perceptsconcepts.psych.indiana.edu/experiments/p101/");
     exit;
  }
}

// username should be inside the session variable at this point
if(isset($_SESSION['user'])){

	$studentid = checkSID($_SESSION['user']);
	
	if($studentid == -1)
	{
		// if no id, add them to database.
		$insert = mysql_query('INSERT INTO allusers (username) VALUES (\''.$_SESSION['user'].'\')');
		if($insert) {
			echo 'Added new student to database';
			
			// now do condition assignment
			$studentid = checkSID($_SESSION['user']);
			
			$condition = getNextCondition();
			assignCondition($studentid, $condition);
			
			echo "\n condition assigned.";
		}
	} elseif($studentid == -2) {
		// there was a problem with the mysql database
		//echo 'db problem';
	} else {
		//echo 'Student ID: '.$studentid;		
	}
	
	$_SESSION['studentid'] = $studentid;
}

function checkSID($username) {
	$result = mysql_query('SELECT sid FROM allusers WHERE username=\''.mysql_real_escape_string($username).'\'');
	$studentid = -2;
	
	if($result) {
		$arr = mysql_fetch_array($result);
		if($arr){
			// if there is an id, store it as $studentid
			$studentid = $arr['sid'];
		} else {
			$studentid = -1;
		}
	} 
	
	return $studentid;
}

function getNextCondition($studentid)
{
	$query = 'SELECT conditionkey, COUNT(DISTINCT sid) FROM assigncondition GROUP BY conditionkey';
	
	// get the number of subjects already collected in each type
	$result = mysql_query($query);

	// create an array of conditions based on targets
	//$conditions = [1,2,3,4];

	$current_numbers = array(
		0 => 0,
		1 => 0,
		2 => 0,
		3 => 0
	);
	
	while($row = mysql_fetch_array($result))
	{
		var_dump($row);
		$val = intval($row['COUNT(DISTINCT sid)']);
		$current_numbers[$row['conditionkey']] = $val;
	}
	
	$min = min($current_numbers);
	
	for($i = 0; $i < count($current_numbers); $i++)
	{
		if($current_numbers[$i]==$min)
		{
			return $i;
		}
	}
	
	return 0;
	
	//var_dump($current_numbers);	
}

function assignCondition($studentid, $condition)
{
	$insert = mysql_query('INSERT INTO assigncondition (sid, conditionkey) VALUES ('.$studentid.','.$condition.')');
	
}
	
?>


<html>
<head>
<title>Self-Guided Learning Experiment</title>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js" type="text/javascript"></script>
<script src="startExperiment.js" type="text/javascript"></script>
<link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
<div id="wrapper">
	<div id="welcome">
		
	</div>
</div>
</body>
<script type="text/javascript">
var sid = <?php echo $_SESSION['studentid']; ?>;

var condition       = 0;  // does nothing in the current version, but retained as placeholder in case we need it
var prepend_data    = { "subjid": sid };


// check if they already have seen consent form
$.ajax({
	type: 'post',
	cache: false,
	url: 'check_consent.php',
	data: {"subjid": sid},
	success: function(data) { 
		if(data==1)
		{
			// they have seen consent form
			// resume from where they left off?
			
			restore_progress();
			
			//start();
		} else {
			// show consent form
			show_consent_form();
		}
	}
});

// DAVID to JOSH: this part will need to be revised to take account for progress on pretest and instructions
function restore_progress(){
	$.ajax({
	type: 'post',
	cache: false,
	url: 'restore_progress.php',
	data: {"subjid": sid},
	success: function(data) { 
		// trial_data will contain an array with each element representing the trial
		// data can be accessed by name, i.e. trial_data[0].correct will indicate whether the first trial was correct or not.
		var trial_data = JSON.parse(data);
		start();
	},
	error: function(){
		// this likely means that they did not complete any trials, and therefore should start from scratch.
		// TODO.
		start();
	}});
}

function show_consent_form() {
	$("#welcome").html(
		'<h1>Welcome to the Self-Guided Learning Experiment</h1>\
		<p>Before starting, you need to decide whether or not you give your consent to have your data analyzed for research purposes.\
		You will need to complete the experiment in order to receive credit for completing the homework assignment, but you may choose whether \
		or not your data are analyzed for research purposes.</p> \
		<button id="startbtn" type="button">View Consent Form</button>'
	);

	// consent
	$("#startbtn").click(function(){

		$("#welcome").hide();
		
		// TODO: see if they have already seen the consent form, and skip if they have.
		$("#wrapper").load("consent_form.html" + "?time=" + (new Date().getTime()), function(){
			// what to do after loading
			$("#wrapper").append('<button type="button" id="consentBtn">Start Experiment</button>');
			$("#consentBtn").click(function(){
				// check to see if they gave consent
				var consent = $("#consent_checkbox").is(':checked');
				var data = [[{"sid": sid, "consent_given": consent}]];
				
				// write their choice to the database
				$.ajax({
					type: 'post',
					cache: false,
					url: 'submit_data_mysql.php',
					data: {"table": "consent", "json": JSON.stringify(data)},
					success: function(data) { start(); }
				});
			});
		});
		
	});
}

// starting experiment
function start() {
	$("#wrapper").html('<div id="target"></div>');
	var display_loc = $("#target");
    var external_content = {
        "pretest_questions": [
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
        ],
        // number of questions should be the same for each category
        "training_questions": [ 
            { prbID: 0, text: "The scores of several students on a 10-point pop quiz are shown below.", ques: "students' test scores", min: 3, max: 10 },
            { prbID: 1, text: "The data below shows the numbers of stories of several buildings in a neighborhood.", ques: "number of stories", min: 1, max: 6 },
            { prbID: 2, text: "In a marketing research study, several consumers each rated how much they liked a product on a scale of 1 to 5. Their ratings are shown below.", ques: "their ratings", min: 1, max: 5 },
            { prbID: 3, text: "Several fishermen went fishing on the same day. Below you can how many fish the different fishermen caught.", ques: "number of fish caught", min: 0, max: 8 }
        ]
    };

    startExperiment( display_loc, prepend_data, external_content );
}
</script>
</html>
