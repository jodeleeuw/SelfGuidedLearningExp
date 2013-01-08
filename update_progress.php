<?php

// database connection
include('p101_database_connect.php');

// variables 
$flag = $_POST['flag']; // which flag to set
$sid = $_POST['sid']; // subject to set for

$query = 'UPDATE subjectprogress SET '.mysql_real_escape_string($flag).' = 1 WHERE sid = \''.mysql_real_escape_string($sid).'\'';

$result = mysql_query($query);

?>