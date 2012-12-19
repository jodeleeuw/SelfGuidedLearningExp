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

var trial_generator = new TrialGenerator( "RR", false );
// change the first arg to the TrialGenerator constructor to see different conditions
// RR: related within and between categories
// RU: related within, unrelated between categories
// UR: unrelated within, related between categories
// UU: unrelated within and between categories
var prepend_data = { "subjid": sid };


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
	},
	error: function(){
		// this likely means that they did not complete any trials, and therefore should start from scratch.
		// TODO.
	});
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
	startExperiment( display_loc, prepend_data, trial_generator );
}
</script>
</html>
