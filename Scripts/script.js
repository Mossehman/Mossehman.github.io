const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
window.console = window.console || function (t) { }; //if no window, provide empty function for a fallback, good practice
let windowZoomSpeed = 0;
let windowZoom = 0;
const phoneWidth = 800;
let isDocumentLoaded = false;
let initWindowWidth = 0;

//#region canvasSizing
let lastWidth = 0;
let lastHeight = 0;
function updateCanvasSize(windowScaling) {
    //determine DPI of the screen
    const ratio = window.devicePixelRatio || 1;

    //scale canvas size based on the screen's DPI
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;

    if (canvas.width !== lastWidth || canvas.height !== lastHeight) { //this is consistent than window.addEventListener(resize)
        resetCanvasPositions();
        lastWidth = canvas.width; //reset the comparison values
        lastHeight = canvas.height;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0); //reset the transformation matrix
    ctx.translate(canvas.width / 2, canvas.height / 2); //sets the canvas origin to the canvas center
    ctx.scale(ratio * windowScaling, ratio * windowScaling); //increase size based on DPI and scale multiplier
    ctx.translate(-canvas.width / 2, - canvas.height / 2); //resets the canvas origin, uses similar concept to CGM #1 rotation
}

function resetCanvasPositions() {

    generateGalaxy();
}
//#endregion

//#region otherFunctions

function generateRandomArbitrary(min, max) {
    return (Math.random() * (max - min) + min);
}

function generateRandomLambda(min, max, mean, stdDeviation) {
    // Generate a random number using Box-Muller transform for normal distribution
    let u1 = Math.random();
    let u2 = Math.random();
    let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

    // Scale the standard normal to the desired mean and standard deviation
    let randNormal = mean + stdDeviation * randStdNormal;

    // Ensure the result is within the bounds
    return Math.min(Math.max(randNormal, min), max);
}

function rotatePoint(x, y, cx, cy, angle) {
    // Degrees to radians
    const radians = angle * (Math.PI / 180);

    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const nx = (cos * (x - cx)) - (sin * (y - cy)) + cx;
    const ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;

    return { x: nx, y: ny };
}

function normalize(x, y) {
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude === 0) {
        return { x: 0, y: 0 };
    }
    return { x: x / magnitude, y: y / magnitude };
}

function interpolateColors(color1, color2, percent) {
    // Convert the hex colors to RGB values
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    // Interpolate the RGB values
    const r = Math.round(r1 + (r2 - r1) * percent);
    const g = Math.round(g1 + (g2 - g1) * percent);
    const b = Math.round(b1 + (b2 - b1) * percent);

    // Convert the interpolated RGB values back to a hex color
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

//#endregion

//#region onWebsiteLoaded
let loadingDelay = 1000;
let loadingTransition = false;

document.onreadystatechange = () => {
    setTimeout(() => {
        transitionToWarp()
    }, loadingDelay);
    console.log("Website is loaded!"); //TODO: remove this
}

//#endregion

//#region loadingScreens

const starDisplay = {
    size: 1,
    speed: 1,
    positionX: 0,
    positionY: 0,
    color: "#fae684",

    hasGlow: false,
    glowValue: 10,
    toRender: true
}

let toGalaxy = false;
let toWarp = false;
let hasWarped = false;

//#region galaxyLoadingScreen
let galaxyStars = [];
const galaxyStarCount = 6000;
function generateGalaxy() {
    //if (initWindowWidth <= phoneWidth) { return; } //we do not want to generate the galaxy on mobile
    if (!toGalaxy) { return; }
    galaxyStars.length = 0; //set the length of our star list

    for (let i = 0; i < galaxyStarCount; i++) {
        let newStar = Object.create(starDisplay);
        newStar.x = generateRandomLambda(0, canvas.width, canvas.width / 2, 60); //generate starX
        newStar.y = generateRandomLambda(0, canvas.height, canvas.height / 2, 60); //generate starY
        //we use randomLambda to ensure majority of the stars are found in the center of the canvas
        newStar.size = 1.2;
        let distanceFromCenter = Math.sqrt(Math.pow(newStar.x - (canvas.width / 2), 2) + Math.pow(newStar.y - (canvas.height / 2), 2)); //calculate distance of the star from the center
        newStar.speed = 80 * Math.max(0.1, distanceFromCenter * 0.001); //calculate the speed of the star using the distance from the center (further away = faster)

        let starColorRandom = generateRandomLambda(0, 10, 5, 3); //generate a random star color
        let baseColor = "#fae684"; //generate a base color for our star
        
        let starEdgeColor = "";

        if (starColorRandom <= 3) {
            starEdgeColor = "#65d4fc";
        }
        else if (starColorRandom >= 7) {
            starEdgeColor = "#881da8";
        }
        else {
            starEdgeColor = "#ffffff";
        }

        newStar.color = interpolateColors(baseColor, starEdgeColor, Math.min(1, distanceFromCenter * 0.007)); //lerp the base color to the edge color based on the distance from the center

        galaxyStars.push(newStar); //add to list of stars

    }
}

function rotateGalaxy(dt) {
    //if (initWindowWidth <= phoneWidth) { return; } //we do not want to generate the galaxy on mobile
    if (!toGalaxy) { return; }
    for (let i = 0; i < galaxyStars.length; i++) {
        let rotatedStar = rotatePoint(galaxyStars[i].x, galaxyStars[i].y, canvas.width / 2, canvas.height / 2, galaxyStars[i].speed * dt);
        galaxyStars[i].x = rotatedStar.x;
        galaxyStars[i].y = rotatedStar.y;
    }
}

function renderGalaxy() {
    if (!toGalaxy) { return; }
    for (let i = 0; i < galaxyStars.length; i++) {
        if (galaxyStars[i].toRender == false) { continue; }
        ctx.beginPath();
        ctx.fillStyle = galaxyStars[i].color;
        ctx.arc(galaxyStars[i].x, galaxyStars[i].y, galaxyStars[i].size, 0, 2 * Math.PI);
        ctx.fill();
    }
}



function transitionToWarp() {
    if (toWarp) { return; }
    toWarp = true;
    windowZoomSpeed += 0.02;
    document.getElementById("whiteTransition").style.opacity = '100%';

    setTimeout(() => {
        warpInit()
    }, 1200);
    console.log("Switched to warp scene!"); //TODO: remove this
}

//#endregion

//#region warpLoadingScreen

const maxStarPerFrame = 4;
const minStarPerFrame = 0;
let warpStars = [];
let warpStarDirX = [];
let warpStarDirY = [];
function warpInit() {
    toGalaxy = false;
    document.getElementById("whiteTransition").style.transitionDuration = '0.6s';
    document.getElementById("whiteTransition").style.opacity = '0%';
    windowZoom = 0;
    windowZoomSpeed = 0;
}

function generateWarp() {
    if (toWarp == false) { return; }
    let starWarpCount = generateRandomLambda(minStarPerFrame, maxStarPerFrame, (minStarPerFrame + maxStarPerFrame) * 0.5, 30);
    for (let i = 0; i < starWarpCount; i++) {
        let warpStar = Object.create(starDisplay);
        warpStar.positionX = canvas.width / 2;
        warpStar.positionY = canvas.height / 2;

        warpStar.size = 1;
        warpStar.speed = 1500;

        let randXPos = generateRandomArbitrary(canvas.width / 2 - 10, canvas.width / 2 + 10);
        let randYPos = generateRandomArbitrary(canvas.height / 2 - 10, canvas.height / 2 + 10);

        warpStarDirX.push(randXPos - canvas.width / 2);
        warpStarDirY.push(randYPos - canvas.height / 2);

        warpStars.push(warpStar);
    }
}

function moveWarp(dt) {
    if (toWarp == false) { return; }
    console.log(warpStars[0].size);
    for (let i = 0; i < warpStars.length; i++) {

        if (warpStars[i].positionX < -10 || warpStars[i].positionX > canvas.width + 10 || warpStars[i].positionY < -10 || warpStars[i].positionY > canvas.height + 10 || warpStars[i].toRender == false) {
            warpStars[i].toRender = false;
            continue;
        }

        let direction = normalize(warpStarDirX[i], warpStarDirY[i]);
        warpStars[i].positionX += direction.x * warpStars[i].speed * dt;
        warpStars[i].positionY += direction.y * warpStars[i].speed * dt;
        warpStars[i].size = Math.sqrt(Math.pow(warpStars[i].positionX - (canvas.width / 2), 2) + Math.pow(warpStars[i].positionY - (canvas.height / 2), 2)) * 0.3;

    }

}

function renderWarp() {
    if (toWarp == false || toGalaxy == true) { return; }


    for (let i = 0; i < warpStars.length; i++) {
        if (warpStars[i].toRender == false) { continue; }

        ctx.beginPath();
        ctx.arc(warpStars[i].positionX, warpStars[i].positionY, 0.02 * warpStars[i].size, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill(); 
    }
}
//#endregion

//#endregion

//#region websiteLoop

let calledInit = false;
let lastUpdate = performance.now();
let deltaTime = 0;
function run() {
    init();
    let currentUpdate = performance.now();
    deltaTime = (currentUpdate - lastUpdate) / 1000; //calculates dt in seconds by taking the difference in time between frames
    lastUpdate = currentUpdate; //reset our dt comparison baseline

    update(deltaTime);
    render(deltaTime);


    requestAnimationFrame(run); //run recursively calls itself at the end of the code
}

function init() {
    //this function will only run once at the start of the loop
    if (calledInit) { return; }
    initWindowWidth = window.screen.width;

    toGalaxy = true;

    generateGalaxy();
    calledInit = true; //we do not want to call init more than once, so we set the bool to true such that init will not be called again after the first frame
}

function update(dt) {
    //this function will run each frame of the loop, values to be updated should be placed here
    rotateGalaxy(dt);
    generateWarp();
    moveWarp(dt);
}

function render(dt) {
    //this function will run each frame of the loop, elements to be rendered should be placed here

    windowZoom += windowZoomSpeed;
    updateCanvasSize(1 + windowZoom);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    renderGalaxy();
    renderWarp();
    
}


run(); //call run once and it will call itself repeatedly

//#endregion