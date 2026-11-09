document.getElementById('uploadCsvBtn').addEventListener('click', function() {
    const fileInput = document.getElementById('csvFileInput');
    if (!fileInput.files.length) {
        alert('Please select a CSV file to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('upload.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('csvUploadStatus').innerText = data;

        if (data.includes("Upload successful")) {
            document.getElementById('conversionOptions').style.display = 'block';
        } else {
            alert('Failed to upload CSV file.');
        }
    })
    .catch(error => {
        console.error('Error uploading CSV:', error);
    });
});

document.getElementById('convertBtn').addEventListener('click', function() {
    const selectedOption = document.querySelector('input[name="conversion"]:checked');
    if (!selectedOption) {
        alert('Please select a conversion option.');
        return;
    }

    const conversionType = selectedOption.value;

    fetch('convert.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversionType: conversionType })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Conversion successful!');
            document.getElementById('jsonDownload').style.display = 'block';
            document.getElementById('imageCropper').style.display = 'block'; // Show image cropper section
            
            const downloadButton = document.getElementById('downloadJsonBtn');
            downloadButton.onclick = function() {
                window.location.href = 'download.php?file=myjson.json';
            };

        } else {
            alert('Error converting coordinates.');
        }
    })
    .catch(error => {
        console.error('Error converting coordinates:', error);
    });
});

document.getElementById('saveCroppedImage').addEventListener('click', function() {
    // Save cropped image and open in new tab for georeferencing
    saveCroppedImage().then(() => {
        const win = window.open('georef.html', '_blank');
        if (win) {
            win.focus();
        } else {
            alert("Popup blocked. Please allow popups for this site.");
        }
    });
});
