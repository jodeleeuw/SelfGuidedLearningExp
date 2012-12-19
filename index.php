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
		echo 'db problem';
	} else {
		echo 'Student ID: '.$studentid;		
	}
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
		<h1>Welcome to the Self-Guided Learning Experiment</h1>
		<p>Here's some information about completing the study and what you have to do.
		Here's some information about completing the study and what you have to do.
		Here's some information about completing the study and what you have to do.
		Here's some information about completing the study and what you have to do.</p>
		<button id="startbtn" type="button">Start</button>
	</div>
	<div id="target">
	</div>
</div>
</body>
<script type="text/javascript">
var display_loc = $('#target');
var trial_generator = new TrialGenerator( "RR", false );
// change the first arg to the TrialGenerator constructor to see different conditions
// RR: related within and between categories
// RU: related within, unrelated between categories
// UR: unrelated within, related between categories
// UU: unrelated within and between categories
var prepend_data = { "subjid": Math.floor(1000*Math.random(1000)) };

// start experiment
$("#startbtn").click(function(){
	$("#welcome").hide();
	startExperiment( display_loc, prepend_data, trial_generator );
});
</script>
</html>
