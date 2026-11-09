<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['image'])) {
    $image_data = $_POST['image'];
    $image_data = str_replace('data:image/png;base64,', '', $image_data);
    $image_data = str_replace(' ', '+', $image_data);
    $image_data = base64_decode($image_data);

    if (!file_exists('images')) {
        mkdir('images', 0777, true);
    }

    $file = 'images/cropped_image.png';  // Save as 'cropped_image.png'
    
    if (file_put_contents($file, $image_data)) {
        echo "Image saved successfully as $file";
    } else {
        echo "Failed to save the image";
    }
} else {
    echo "Invalid request";
}
