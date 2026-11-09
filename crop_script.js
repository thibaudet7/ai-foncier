const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const saveBtn = document.getElementById('save');

let image = new Image();
let scale = 1;
let isDrawing = false;
let path = [];
let offsetX = 0;
let offsetY = 0;
let zoomCenterX = 0;
let zoomCenterY = 0;
let translateX = 0;
let translateY = 0;

imageInput.addEventListener('change', loadImage);
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('wheel', zoom);
zoomInBtn.addEventListener('click', () => changeZoom(0.1));
zoomOutBtn.addEventListener('click', () => changeZoom(-0.1));
saveBtn.addEventListener('click', saveCroppedImage);

function loadImage(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        image.onload = function() {
            canvas.width = image.width;
            canvas.height = image.height;
            zoomCenterX = canvas.width / 2;
            zoomCenterY = canvas.height / 2;
            offsetX = 0;
            offsetY = 0;
            scale = 1;
            drawImage();
        }
        image.src = event.target.result;
    }
    reader.readAsDataURL(file);
}

function drawImage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    translateX = zoomCenterX - (zoomCenterX - offsetX) * scale;
    translateY = zoomCenterY - (zoomCenterY - offsetY) * scale;

    ctx.translate(translateX, translateY);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);
    ctx.restore();

    drawPath();
}

function startDrawing(e) {
    isDrawing = true;
    path = [];
    const { x, y } = getCanvasCoordinates(e);
    path.push({ x, y });
    drawImage();
}

function draw(e) {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoordinates(e);
    path.push({ x, y });
    drawImage();
}

function stopDrawing() {
    isDrawing = false;
    drawImage();
}

function drawPath() {
    if (path.length === 0) return;

    ctx.save();
    ctx.translate(translateX, translateY);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2 / scale;
    ctx.stroke();
    ctx.restore();
}

function zoom(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    changeZoom(delta, e.clientX, e.clientY);
}

function changeZoom(delta, x = canvas.width / 2, y = canvas.height / 2) {
    const oldScale = scale;
    scale += delta;
    scale = Math.max(0.1, Math.min(scale, 5));  // Limit zoom between 0.1x and 5x

    // Adjust offset to zoom towards mouse position
    offsetX -= (x - offsetX) * (scale / oldScale - 1);
    offsetY -= (y - offsetY) * (scale / oldScale - 1);

    drawImage();
}

function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left - translateX) / scale,
        y: (e.clientY - rect.top - translateY) / scale
    };
}

function saveCroppedImage() {
    if (path.length === 0) {
        alert("Please draw a shape to crop the image.");
        return;
    }

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;

    tempCtx.drawImage(image, 0, 0);
    tempCtx.globalCompositeOperation = 'destination-in';

    tempCtx.beginPath();
    tempCtx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        tempCtx.lineTo(path[i].x, path[i].y);
    }
    tempCtx.closePath();
    tempCtx.fill();

    const croppedImageData = tempCanvas.toDataURL('image/png');

    fetch('save_image.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'image=' + encodeURIComponent(croppedImageData)
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
        // Save JSON data to localStorage before opening georeference.html
        saveJSONToLocalStorage();
        // Open the georeferencing page in a new tab
        window.open('georeference.html', '_blank');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while saving the image. Please check the console for more details.');
    });
}

// Add pan functionality
let isPanning = false;
let lastPanX, lastPanY;

canvas.addEventListener('mousedown', startPan);
canvas.addEventListener('mousemove', pan);
canvas.addEventListener('mouseup', endPan);
canvas.addEventListener('mouseleave', endPan);

function startPan(e) {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {  // Middle mouse button or left click + Alt key
        isPanning = true;
        lastPanX = e.clientX;
        lastPanY = e.clientY;
        canvas.style.cursor = 'move';
    }
}

function pan(e) {
    if (!isPanning) return;
    
    const dx = e.clientX - lastPanX;
    const dy = e.clientY - lastPanY;
    
    offsetX += dx / scale;
    offsetY += dy / scale;
    
    lastPanX = e.clientX;
    lastPanY = e.clientY;
    
    drawImage();
}

function endPan() {
    isPanning = false;
    canvas.style.cursor = 'default';
}

// Add this function to save JSON data to localStorage
function saveJSONToLocalStorage() {
    fetch('../jsonfolder/myjson.json')
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('myjsonData', JSON.stringify(data));
            console.log('JSON data saved to localStorage');
        })
        .catch(error => {
            console.error('Error saving JSON to localStorage:', error);
        });
}