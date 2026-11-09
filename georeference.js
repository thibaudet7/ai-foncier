const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');

let image = new Image();
let scale = 1;
let panMode = false;
let lastX, lastY;
let offsetX = 0, offsetY = 0;
let georeferencePoints = [];
let jsonData = null;

// Load the cropped image and JSON data
window.onload = async function() {
    try {
        await loadImage();
        await loadJSONData();
    } catch (error) {
        console.error('Error during initialization:', error);
        alert(`Error during initialization: ${error.message}\nPlease check the console for more details.`);
    }
};

async function loadImage() {
    try {
        const imageResponse = await fetch('../images/cropped_image.png');
        if (!imageResponse.ok) {
            throw new Error(`HTTP error! status: ${imageResponse.status}`);
        }
        const imageBlob = await imageResponse.blob();
        return new Promise((resolve, reject) => {
            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                drawImage();
                resolve();
            };
            image.onerror = reject;
            image.src = URL.createObjectURL(imageBlob);
        });
    } catch (error) {
        console.error('Error loading image:', error);
        alert(`Error loading image: ${error.message}`);
        throw error;
    }
}

async function loadJSONData() {
    try {
        const jsonResponse = await fetch('../jsonfolder/myjson.json');
        if (!jsonResponse.ok) {
            throw new Error(`HTTP error! status: ${jsonResponse.status}`);
        }
        jsonData = await jsonResponse.json();
        console.log('JSON data loaded successfully:', jsonData);
    } catch (error) {
        console.error('Error loading JSON:', error);
        alert(`Error loading JSON: ${error.message}\nAttempting to load from localStorage...`);
        
        // Attempt to load from localStorage as a fallback
        const storedData = localStorage.getItem('myjsonData');
        if (storedData) {
            try {
                jsonData = JSON.parse(storedData);
                console.log('JSON data loaded from localStorage:', jsonData);
            } catch (parseError) {
                console.error('Error parsing JSON from localStorage:', parseError);
                alert(`Error parsing JSON from localStorage: ${parseError.message}`);
                throw parseError;
            }
        } else {
            alert('No JSON data found in localStorage. Please ensure the file is correctly placed and accessible.');
            throw new Error('No JSON data available');
        }
    }
}

function drawImage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);
    ctx.restore();

    // Draw georeferenced points
    georeferencePoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.canvasX, point.canvasY, 5 / scale, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    });
}

// Implement zoom functionality
document.getElementById('zoomIn').addEventListener('click', () => changeZoom(0.1));
document.getElementById('zoomOut').addEventListener('click', () => changeZoom(-0.1));

function changeZoom(delta) {
    scale += delta;
    scale = Math.max(0.1, Math.min(scale, 3));
    drawImage();
}

// Implement pan functionality
document.getElementById('panTool').addEventListener('click', () => {
    panMode = !panMode;
    canvas.style.cursor = panMode ? 'move' : 'default';
});

canvas.addEventListener('mousedown', startPan);
canvas.addEventListener('mousemove', pan);
canvas.addEventListener('mouseup', endPan);
canvas.addEventListener('mouseleave', endPan);

function startPan(e) {
    if (!panMode) return;
    lastX = e.clientX;
    lastY = e.clientY;
}

function pan(e) {
    if (!panMode || !lastX || !lastY) return;
    offsetX += e.clientX - lastX;
    offsetY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    drawImage();
}

function endPan() {
    lastX = lastY = null;
}

// Implement georeferencing
document.getElementById('startGeoreferencing').addEventListener('click', startGeoreferencing);

async function startGeoreferencing() {
    if (!jsonData) {
        alert('JSON data not loaded. Please check the console for error details and ensure the file path is correct.');
        return;
    }

    if (Object.keys(jsonData).length === 0) {
        alert('JSON data is empty. Please ensure the file contains valid data.');
        return;
    }

    for (const [pointName, coordinates] of Object.entries(jsonData)) {
        const userClick = await new Promise(resolve => {
            alert(`Click on point ${pointName}`);
            canvas.onclick = (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left - offsetX) / scale;
                const y = (e.clientY - rect.top - offsetY) / scale;
                resolve({x, y});
            };
        });

        georeferencePoints.push({
            canvasX: userClick.x,
            canvasY: userClick.y,
            lon: coordinates[0],
            lat: coordinates[1]
        });

        drawImage();
    }

    canvas.onclick = null;
    alert('Georeferencing complete!');
}

// Implement saving georeferenced image
document.getElementById('saveGeoreferencedImage').addEventListener('click', saveGeoreferencedImage);

async function saveGeoreferencedImage() {
    if (georeferencePoints.length === 0) {
        alert('Please georeference the image first.');
        return;
    }

    const imageData = canvas.toDataURL('image/png');
    const georeferencedData = {
        image: imageData,
        points: georeferencePoints
    };

    try {
        const response = await fetch('save_georeferenced.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(georeferencedData)
        });

        const result = await response.text();
        alert(result);

        // Show download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Georeferenced Files';
        downloadBtn.onclick = () => window.location.href = 'download_georeferenced.php';
        document.body.appendChild(downloadBtn);
    } catch (error) {
        console.error('Error saving georeferenced image:', error);
        alert('An error occurred while saving the georeferenced image.');
    }
}

function saveJSONToLocalStorage(data) {
    try {
        localStorage.setItem('myjsonData', JSON.stringify(data));
        console.log('JSON data saved to localStorage');
    } catch (error) {
        console.error('Error saving JSON to localStorage:', error);
    }
}