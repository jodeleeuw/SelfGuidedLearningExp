<?php
include('p101_database_connect.php');

$subjid = $_POST['subjid'];

$result = mysql_query('SELECT consent_given FROM consent WHERE sid='.$subjid);

$rows = mysql_num_rows($result);

if($rows>0){
	echo 1;
} else {
	echo 0;
}

?>
