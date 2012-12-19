<?php
include('p101_database_connect.php');

$subjid = $_POST['subjid'];

$result = mysql_query('SELECT * FROM trialdata WHERE subjid='.$subjid);

if($result){
	while($row = mysql_fetch_array($result)){
		//push row to array
		$arr[] = $row;
	}
}

echo json_encode($arr);

?>
