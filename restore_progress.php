<?php
include('p101_database_connect.php');

$subjid = $_POST['subjid'];

$result = mysql_query('SELECT * FROM trialdata WHERE subjid='.$subjid);

//var_dump($result);

if($result){
	while($row = mysql_fetch_array($result, MYSQL_ASSOC)){
		// push row to array
		$arr[] = $row;
	}
}

echo json_encode($arr);

?>
