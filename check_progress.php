<?php

// database connection
include('p101_database_connect.php');

// variables 
$sid = $_POST['sid']; // subject to set for

$query = 'SELECT * FROM subjectprogress WHERE sid = \''.mysql_real_escape_string($sid).'\'';

$result = mysql_query($query);
if($result) {
	$arr = mysql_fetch_array($result);
	$skip_arr['consent'] = ($arr['consent'] == 1);
	$skip_arr['introduction'] = ($arr['introduction'] == 1);
	$skip_arr['pretest'] = ($arr['pretest'] == 1);
	$skip_arr['instructions'] = ($arr['instructions'] == 1);

	echo json_encode($skip_arr);
} 


?>