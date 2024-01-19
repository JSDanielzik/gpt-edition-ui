document.getElementById('show-text').addEventListener('click', () => {
    loadContent('text');
});

document.getElementById('show-image').addEventListener('click', () => {
    loadContent('image');
});

document.getElementById('show-both').addEventListener('click', () => {
    loadContent('both');
});

window.addEventListener('resize', function() {
    setupCanvas(); // Adjust the canvas size
    repositionHighlights(); // Recalculate highlight positions
});

window.addEventListener('load', function() {
    // Initial positioning of text segments
    repositionTextSegments();
});

function loadContent(viewType) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = ''; // Clear previous content

    // Fetch data from API
    fetch('api-mock-with-coords.json')
        .then(response => response.json())
        .then(data => {
            if (viewType === 'text') {
                displayTextContent(data, contentArea);
            } else if (viewType == 'image'){
                displayImageContent(data, contentArea);
            } else {
                displayBothContent(data, contentArea);
            }
        })
        .catch(error => console.error('Error:', error));
}

function displayTextContent(data, contentArea) {
    // Logic to display edited text
    // Example: contentArea.innerHTML = `<p>${data.editedText}</p>`;
    contentArea.innerHTML = `<p>${data.segments}</p>`;
}

function displayImageContent(data, contentArea) {
    // Logic to display original images
    // Example: contentArea.innerHTML = `<img src="${data.imageUrl}" alt="Magazine Image">`;
    contentArea.innerHTML = `<img src="${data.page_scan}" alt="Magazine Image">`;
}

function displayBothContent(data, contentArea) {
    // Logic to display both text and image side by side
    // Example:
    contentArea.innerHTML = `
        <div id="both-view">
            <div id="text-content">
                <!-- Text segments will be loaded here -->
            </div>
            <div id="image-content">
                <img src="${data.page_scan}" alt="Magazine Image" id="magazine-image">
                <canvas id="highlight-overlay"></canvas> <!-- Overlay for highlighting -->
            </div>
        </div>`;

    const textContainer = document.getElementById('text-content');
    const { imageWidth, textContainerWidth } = getWidths(); // Assuming getWidths is defined as before
    const { imageHeight, textContainerHeight } = getHeights(); // Assuming getHeights is defined as before
    data.segments.forEach(segment => {
        const textElement = document.createElement('div');
        textElement.textContent = segment.text;
        textElement.style.position = 'absolute'; // or 'relative', depending on your layout
        console.log(calculateLeft(segment.coords, imageWidth, textContainerWidth))
        textElement.style.left = `${calculateLeft(segment.coords, imageWidth, textContainerWidth)}px`;
        textElement.style.top = `${calculateTop(segment.coords, imageHeight, textContainerHeight)}px`;

        // Set the width based on coordinates
        const segmentWidth = calculateWidth(segment.coords);
        textElement.style.width = `${segmentWidth}px`;

        textContainer.appendChild(textElement);
    });
    setupCanvas();
}

function setupCanvas() {
    const canvas = document.getElementById('highlight-overlay');
    const img = document.getElementById('magazine-image');
    const imgRect = img.getBoundingClientRect(); // Get the position and size of the scaled image

    canvas.width = imgRect.width;
    canvas.height = imgRect.height;
    canvas.style.width = `${imgRect.width}px`;
    canvas.style.height = `${imgRect.height}px`;
}


function highlightPolygon(event) {

    //console.log("Data attribute:", event.target); // Debugging line
    const polygon = JSON.parse(event.target.dataset.coordinates);
    const canvas = document.getElementById('highlight-overlay');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'; // Semi-transparent yellow
    ctx.beginPath();
    polygon.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });
    ctx.closePath();
    ctx.fill();
}

function clearHighlight() {
    const canvas = document.getElementById('highlight-overlay');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function repositionTextSegments() {
    // Get current dimensions
    const { imageWidth, textContainerWidth } = getWidths(); // Assuming getWidths is defined as before
    const { imageHeight, textContainerHeight } = getHeights(); // Assuming getHeights is defined as before

    // Get all text segments
    const textSegments = document.querySelectorAll('#text-content div'); // Assuming text segments are divs

    textSegments.forEach(segment => {
        // Assuming segment.dataset.coordinates contains the JSON string of coordinates
        const coordinates = JSON.parse(segment.dataset.coordinates);

        // Recalculate positions
        const left = calculateLeft(coordinates, imageWidth, textContainerWidth);
        const top = calculateTop(coordinates, imageHeight, textContainerHeight);

        // Update segment positions
        segment.style.left = `${left}px`;
        segment.style.top = `${top}px`;
    });
}

function calculateLeft(coordinates, imageWidth, textContainerWidth) {
    // Assuming coordinates are given for the top-left point of the text segment in the image
    let imageX = coordinates[0].x; // X coordinate from the image
    console.log(imageX);
    // Calculate scaling factor (if the image and text container are different sizes)
    let scalingFactor = textContainerWidth / imageWidth;

    // Apply scaling to the X coordinate
    let textContainerX = imageX * scalingFactor;
    
    return textContainerX;
}

function calculateTop(coordinates, imageHeight, textContainerHeight) {
    // Assuming coordinates are given for the top point of the text segment in the image
    let imageY = coordinates[0].y; // Y coordinate from the image

    // Calculate scaling factor (if the image and text container have different heights)
    let scalingFactor = textContainerHeight / imageHeight;

    // Apply scaling to the Y coordinate
    let textContainerY = imageY * scalingFactor;

    return textContainerY;
}

function calculateWidth(coordinates) {
    // Find the minimum and maximum x values from the coordinates
    let minX = coordinates[0].x;
    let maxX = coordinates[0].x;

    coordinates.forEach(coord => {
        if (coord.x < minX) minX = coord.x;
        if (coord.x > maxX) maxX = coord.x;
    });

    // Calculate width as the difference between max and min x values
    return maxX - minX;
}

function getWidths() {
    const imgElement = document.getElementById('magazine-image');
    const textContainerElement = document.getElementById('text-content');

    if (imgElement && textContainerElement) {
        const imgRect = imgElement.getBoundingClientRect();

        const textContainerRect = textContainerElement.getBoundingClientRect();

        const imageWidth = imgRect.width;
        const textContainerWidth = textContainerRect.width;
        console.log(imageWidth, textContainerWidth)
        return { imageWidth, textContainerWidth };
    } else {
        console.error("Elements not found");
        return null;
    }
}

function getHeights() {
    const imgElement = document.getElementById('magazine-image');
    const textContainerElement = document.getElementById('text-content');

    if (imgElement && textContainerElement) {
        const imgRect = imgElement.getBoundingClientRect();
        const textContainerRect = textContainerElement.getBoundingClientRect();
        //console.log(textContainerRect)

        const imageHeight = imgRect.height;
        const textContainerHeight = textContainerRect.height;

        //console.log("Image Height:", imageHeight, "Text Container Height:", textContainerHeight);

        return { imageHeight, textContainerHeight };
    } else {
        console.error("Elements not found");
        return null;
    }
}