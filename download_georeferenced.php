<?php
$zip = new ZipArchive();
$filename = "georeferenced_files.zip";

if ($zip->open($filename, ZipArchive::CREATE)!==TRUE) {
    exit("Cannot open <$filename>\n");
}

$zip->addFile("../georef/georeferenced_image.png", "georeferenced_image.png");
$zip->addFile("../georef/georeferenced_image.pgw", "georeferenced_image.pgw");
$zip->addFile("../georef/georeferenced_points.geojson", "georeferenced_points.geojson");

$zip->close();

header("Content-Type: application/zip");
header("Content-Disposition: attachment; filename=$filename");
header("Content-Length: " . filesize($filename));
readfile($filename);
unlink($filename); // Delete the temporary zip file
