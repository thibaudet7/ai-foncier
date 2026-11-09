<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $conversionType = $data['conversionType'];

    $command = "python convert_coordinates.py --input image/mytable.csv --output jsonfolder/myjson.json --conversion $conversionType";
    $output = [];
    $return_var = 0;
    exec($command, $output, $return_var);

    if ($return_var === 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => implode("\n", $output)]);
    }
}
