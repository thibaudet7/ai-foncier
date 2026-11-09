<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Save the image
    $img = str_replace('data:image/png;base64,', '', $data['image']);
    $img = str_replace(' ', '+', $img);
    $fileData = base64_decode($img);
    file_put_contents('../georef/georeferenced_image.png', $fileData);

    // Save the world file
    $worldFile = createWorldFile($data['points']);
    file_put_contents('../georef/georeferenced_image.pgw', $worldFile);

    // Save the GeoJSON file
    $geoJson = createGeoJSON($data['points']);
    file_put_contents('../georef/georeferenced_points.geojson', json_encode($geoJson));

    echo "Georeferenced files saved successfully!";
} else {
    http_response_code(405);
    echo "Method Not Allowed";
}

function createWorldFile($points) {
    // Implement world file creation logic here
    // This is a simplified example and may need adjustment
    $xScale = ($points[1]['lon'] - $points[0]['lon']) / ($points[1]['canvasX'] - $points[0]['canvasX']);
    $yScale = ($points[1]['lat'] - $points[0]['lat']) / ($points[1]['canvasY'] - $points[0]['canvasY']);
    $rotation = 0; // Assuming no rotation
    $xTranslation = $points[0]['lon'] - ($xScale * $points[0]['canvasX']);
    $yTranslation = $points[0]['lat'] - ($yScale * $points[0]['canvasY']);

    return implode("\n", [$xScale, $rotation, $rotation, -$yScale, $xTranslation, $yTranslation]);
}

function createGeoJSON($points) {
    $features = [];
    foreach ($points as $point) {
        $features[] = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [$point['lon'], $point['lat']]
            ],
            'properties' => [
                'canvasX' => $point['canvasX'],
                'canvasY' => $point['canvasY']
            ]
        ];
    }

    return [
        'type' => 'FeatureCollection',
        'features' => $features
    ];
}
