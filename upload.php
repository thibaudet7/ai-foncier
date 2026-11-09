<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'image/';
        // $uploadFile = $uploadDir . 'mytable.csv';
        $uploadFile = rtrim($uploadDir, '/') . '/mytable.csv';


        if (move_uploaded_file($_FILES['file']['tmp_name'], $uploadFile)) {
            echo 'Upload successful!';
        } else {
            echo 'Failed to upload file.';
        }
    } else {
        echo 'No file uploaded or there was an error.';
    }
}
