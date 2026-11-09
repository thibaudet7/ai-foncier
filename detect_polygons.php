<?php
header('Content-Type: application/json');

$command = 'python detect_polygons.py --input image/cropped_parcel.png --output jsonfolder/polygon_data.json';

exec($command, $output, $return_var);

if ($return_var === 0) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => "Polygon detection failed"]);
}
