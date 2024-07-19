const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
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
    hideCurrentStars();
    initialisePlanetDisplays();
    generateAsteroidBelt(newBelt);
    generateAsteroidBelt(kuiperBelt);
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
function generateRandomAnnulus(rMin, rMax, centerX, centerY) {
    // Draw theta uniformly on [0, 2*pi)
    let theta = Math.random() * 2 * Math.PI;

    // Draw r from the power-law distribution
    let A = 2 / (rMax * rMax - rMin * rMin);
    let r = Math.sqrt(Math.random() / A + rMin * rMin);

    // Compute (x, y) by the usual transformation from radial coordinates
    let x = r * Math.cos(theta) + centerX;
    let y = r * Math.sin(theta) + centerY;

    return { x, y };
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
let toMainScreen = false;


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
    windowZoomSpeed += 0.04;
    document.getElementById("whiteTransition").style.opacity = '100%';

    setTimeout(() => {
        warpInit()
    }, 1200);
    console.log("Switched to warp scene!"); //TODO: remove this
}

//#endregion

//#region warpLoadingScreen

const maxStarPerFrame = 4;
const minStarPerFrame = 1;
let warpStars = [];
let warpStarDirX = [];
let warpStarDirY = [];
let warpStarDelay = 0.05;
let warpStarTimer = 0;

function warpInit() {
    toGalaxy = false;
    document.getElementById("whiteTransition").style.transitionDuration = '0.6s';
    document.getElementById("whiteTransition").style.opacity = '0%';
    windowZoom = 0;
    windowZoomSpeed = 0;

    setTimeout(() => {
        transitionToMainScreen()
    }, 2000);
}

function generateWarp(dt) {
    if (toWarp == false) { return; }

    warpStarTimer += dt;
    if (warpStarTimer < warpStarDelay) {
        return;
    }

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

    warpStarTimer = 0;
}

function moveWarp(dt) {
    if (toWarp == false && toMainScreen == false) { return; }
    for (let i = 0; i < warpStars.length; i++) {

        if (warpStars[i].positionX < -10 || warpStars[i].positionX > canvas.width + 10 || warpStars[i].positionY < -10 || warpStars[i].positionY > canvas.height + 10 || warpStars[i].toRender == false) {
            warpStars[i].toRender = false;
            continue;
        }

        let direction = normalize(warpStarDirX[i], warpStarDirY[i]);
        warpStars[i].positionX += direction.x * warpStars[i].speed * dt;
        warpStars[i].positionY += direction.y * warpStars[i].speed * dt;
        warpStars[i].size = Math.sqrt(Math.pow(warpStars[i].positionX - (canvas.width / 2), 2) + Math.pow(warpStars[i].positionY - (canvas.height / 2), 2)) * 0.5;

    }

}

function renderWarp() {
    if ((toWarp == false && toMainScreen == false) || toGalaxy == true) { return; }


    for (let i = 0; i < warpStars.length; i++) {
        if (warpStars[i].toRender == false) { continue; }

        ctx.beginPath();
        ctx.arc(warpStars[i].positionX, warpStars[i].positionY, 0.02 * warpStars[i].size, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill(); 
    }
}

function hideCurrentStars() {
    for (let i = 0; i < warpStars.length; i++) {
        warpStars[i].toRender = false;
    }
}

function transitionToMainScreen() {
    toWarp = false;
    toMainScreen = true;  
    generateAsteroidBelt(newBelt);

}
//#endregion

//#endregion

//#region mainMenu

//#region planetDisplays
const PlanetDisplay = {
    name: "Planet",
    positionX: 0,
    positionY: 0,
    orbitSpeed: 0,
    size: 1,
    planetColor: "",

    glow: false,
    glowStrength: 1,

    ringCount: 0,
    ringColor: "",
    ringSpacing: 1,
    ringSize: 1,

    orbitOffsetX: 0,
    orbitOffsetY: 0,
}

let scalingFactor = 0;
let relativePlanetScaling = 0.1;
let timeScale = 1;  
let maxScale = 0.5;

let targetScalingFactor = maxScale;
let canInteractWithMainMenu = false;

let planetToView;

let offsetX = 0;
let offsetY = 0;

let targetOffsetX = 0;
let targetOffsetY = 0;

let renderDisplayNames = true;

let Sun = Object.create(PlanetDisplay);
let Mercury = Object.create(PlanetDisplay);
let Venus = Object.create(PlanetDisplay);
let Earth = Object.create(PlanetDisplay);
let Mars = Object.create(PlanetDisplay);
let Jupiter = Object.create(PlanetDisplay);
let Saturn = Object.create(PlanetDisplay);
let Uranus = Object.create(PlanetDisplay);
let Neptune = Object.create(PlanetDisplay);
let Pluto = Object.create(PlanetDisplay);

let planetDisplays = [];

function initialisePlanetDisplays() {
    planetDisplays = [];

    Sun.name = "Sun";
    Sun.positionX = canvas.width / 2;
    Sun.positionY = canvas.height / 2;
    Sun.orbitSpeed = 0;
    Sun.size = 400 * relativePlanetScaling;
    Sun.glow = true;
    Sun.glowStrength = 70;
    Sun.color = "#f09826";

    Mercury.name = "Mercury";
    Mercury.positionX = canvas.width / 2 + 450 * relativePlanetScaling;
    Mercury.positionY = canvas.height / 2;
    Mercury.orbitSpeed = 80.35 * timeScale;
    Mercury.size = 1.5 * relativePlanetScaling;
    Mercury.color = "#825844";

    Venus.name = "Venus";
    Venus.positionX = canvas.width / 2 + 831 * relativePlanetScaling;
    Venus.positionY = canvas.height / 2;
    Venus.orbitSpeed = 58.5 * timeScale;
    Venus.size = 3.6 * relativePlanetScaling;
    Venus.color = "#baa266";

    Earth.name = "Earth";
    Earth.positionX = canvas.width / 2 + 1154 * relativePlanetScaling;
    Earth.positionY = canvas.height / 2;
    Earth.orbitSpeed = 50 * timeScale;
    Earth.size = 4 * relativePlanetScaling;
    Earth.color = "#86b6db";

    Mars.name = "Mars";
    Mars.positionX = canvas.width / 2 + 1754 * relativePlanetScaling;
    Mars.positionY = canvas.height / 2;
    Mars.orbitSpeed = 40.1 * timeScale;
    Mars.size = 2 * relativePlanetScaling;
    Mars.color = "#ab2f13";

    Jupiter.name = "Jupiter";
    Jupiter.positionX = canvas.width / 2 + 6000 * relativePlanetScaling;
    Jupiter.positionY = canvas.height / 2;
    Jupiter.orbitSpeed = 21.7 * timeScale;
    Jupiter.size = 40 * relativePlanetScaling;
    Jupiter.color = "#b89e76";
    Jupiter.ringColor = "#b89e76";
    Jupiter.ringCount = 1;
    Jupiter.ringSize = 0.3 * relativePlanetScaling;
    Jupiter.ringSpacing = 6 * relativePlanetScaling;

    Saturn.name = "Saturn";
    Saturn.positionX = canvas.width / 2 + 11007 * relativePlanetScaling;
    Saturn.positionY = canvas.height / 2;
    Saturn.orbitSpeed = 16.5 * timeScale;
    Saturn.size = 36 * relativePlanetScaling;
    Saturn.color = "#e8cea7";
    Saturn.ringColor = "#e3d5c1";
    Saturn.ringCount = 2;
    Saturn.ringSize = 10 * relativePlanetScaling;
    Saturn.ringSpacing = 11 * relativePlanetScaling;

    Uranus.name = "Uranus";
    Uranus.positionX = canvas.width / 2 + 22177 * relativePlanetScaling;
    Uranus.positionY = canvas.height / 2;
    Uranus.orbitSpeed = 11.4 * timeScale;
    Uranus.size = 16 * relativePlanetScaling;
    Uranus.color = "#bfdaf2";
    Uranus.ringColor = "#ffffff";
    Uranus.ringCount = 2;
    Uranus.ringSize = 0.4 * relativePlanetScaling;
    Uranus.ringSpacing = 0.7 * relativePlanetScaling;

    Neptune.name = "Neptune";
    Neptune.positionX = canvas.width / 2 + 34689 * relativePlanetScaling;
    Neptune.positionY = canvas.height / 2;
    Neptune.orbitSpeed = 9.1 * timeScale;
    Neptune.size = 12 * relativePlanetScaling;
    Neptune.color = "#4361d9";
    Neptune.ringColor = "#acbcfa";
    Neptune.ringCount = 4;
    Neptune.ringSize = 0.4 * relativePlanetScaling;
    Neptune.ringSpacing = 0.6 * relativePlanetScaling;


    Pluto.name = "Pluto";
    Pluto.positionX = canvas.width / 2 + 45006 * relativePlanetScaling;
    Pluto.positionY = canvas.height / 2;
    Pluto.orbitSpeed = 7.95 * timeScale;
    Pluto.size = 0.8 * relativePlanetScaling;
    Pluto.color = "#5e4840";

    planetDisplays.push(Sun);
    planetDisplays.push(Mercury);
    planetDisplays.push(Venus);
    planetDisplays.push(Earth);
    planetDisplays.push(Mars);
    planetDisplays.push(Jupiter);
    planetDisplays.push(Saturn);
    planetDisplays.push(Uranus);
    planetDisplays.push(Neptune);
    planetDisplays.push(Pluto);
}

function rotatePlanetDisplays(dt) {
    if (!toMainScreen) { return; }

    for (let i = 0; i < planetDisplays.length; i++) {
        let planetRotation = rotatePoint(planetDisplays[i].positionX, planetDisplays[i].positionY, canvas.width / 2, canvas.height / 2, planetDisplays[i].orbitSpeed * dt);
        planetDisplays[i].positionX = planetRotation.x;
        planetDisplays[i].positionY = planetRotation.y;
    }
}

function scalePlanetsOnLoad(scaleSpeed) {
    if (!toMainScreen || canInteractWithMainMenu) { return; }

    if (scalingFactor < maxScale) {
        scalingFactor += scaleSpeed;
    }
    else if (scalingFactor >= maxScale) {
        scalingFactor = maxScale;
        document.getElementById("planetDisplayBar").style.transitionDuration = "0.6s";
        document.getElementById("planetDisplayBar").style.transform = 'translate(0, 0)';

        let ulElements = document.querySelectorAll("#planetDisplayBar ul li");
        let listArray = Array.from(ulElements);

        let listAnimDelay = 0;

        for (let i = 0; i < listArray.length; i++) {
            listArray[i].style.transitionDuration = `${listAnimDelay}s`;
            listArray[i].style.transform = "translate(0, 0)";
            listAnimDelay += 0.2;
        }


        canInteractWithMainMenu = true;
    }
}

function renderPlanetDisplays() {
    if (!toMainScreen) { return; }

    for (let i = 0; i < planetDisplays.length; i++) {
        // Calculate the distance from the center
        let planetFromCenterX = planetDisplays[i].positionX - canvas.width / 2;
        let planetFromCenterY = planetDisplays[i].positionY - canvas.height / 2;

        // Apply the scaling factor to the distance
        let scaledPlanetFromCenterX = planetFromCenterX * scalingFactor;
        let scaledPlanetFromCenterY = planetFromCenterY * scalingFactor;

        // Recalculate the position using the scaled distance and current offsets
        let scaledPositionX = canvas.width / 2 + scaledPlanetFromCenterX + offsetX;
        let scaledPositionY = canvas.height / 2 + scaledPlanetFromCenterY + offsetY;

        // Render the planet and its rings
        ctx.beginPath();
        ctx.fillStyle = planetDisplays[i].color;
        ctx.arc(scaledPositionX, scaledPositionY, planetDisplays[i].size * scalingFactor, 0, Math.PI * 2);
        ctx.shadowColor = planetDisplays[i].glow ? planetDisplays[i].color : 'transparent';
        ctx.shadowBlur = planetDisplays[i].glow ? planetDisplays[i].glowStrength * scalingFactor : 0;
        ctx.fill();
        ctx.closePath();

        for (let j = 0; j < planetDisplays[i].ringCount; j++) {
            ctx.beginPath();
            ctx.arc(scaledPositionX, scaledPositionY, planetDisplays[i].size * scalingFactor + (j + 1) * (planetDisplays[i].ringSpacing * scalingFactor), 0, 2 * Math.PI);
            ctx.strokeStyle = planetDisplays[i].ringColor;
            ctx.lineWidth = planetDisplays[i].ringSize * scalingFactor;
            ctx.stroke();
            ctx.closePath();
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        if (renderDisplayNames) {
            ctx.beginPath();
            let fontSize = planetDisplays[i].size * scalingFactor * 0.1;
            ctx.font = `${fontSize}vw Arial`;
            ctx.textAlign = "center";
            ctx.textBaseLine = "middle";
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            let textX = scaledPositionX;
            let textY = scaledPositionY - (2 * planetDisplays[i].size * scalingFactor) - (planetDisplays[i].ringCount * planetDisplays[i].ringSize * scalingFactor);
            ctx.fillText(planetDisplays[i].name, textX, textY);
            ctx.closePath();
        }
    }
}

//#endregion

//#region asteroidDisplays

let highResAsteroids = true;

const asteroidDisplay = {
    positionX: 0,
    positionY: 0,
    size: 0,
    color: "",
    toRender: true
}

const asteroidBeltDisplay = {
    thickness: 300,
    distanceFromCenter: 250,

    windowLODzoom: 5,
    chunkCountX: 4,
    chunkCountY: 4,

    asteroidCountLDM: 300,
    asteroidCountHD: 3000,

    asteroidMinSizeLDM: 10,
    asteroidMaxSizeLDM: 20,

    asteroidMinSizeHD: 0.4,
    asteroidMaxSizeHD: 4,

    asteroidColors: [],
    asteroidDefaultColor: "grey",

    asteroidsLDM: [],
    asteroidsHD: []
}

let newBelt = Object.create(asteroidBeltDisplay);
newBelt.distanceFromCenter = 3400;
newBelt.thickness = 3000;

let kuiperBelt = Object.create(asteroidBeltDisplay);
kuiperBelt.distanceFromCenter = 45010;

kuiperBelt.asteroidMinSizeHD = 0.4;
kuiperBelt.asteroidMaxSizeHD = 4;

kuiperBelt.thickness = 10000;
kuiperBelt.asteroidCountLDM = 10000;
kuiperBelt.asteroidCountHD = 11000;

function generateAsteroidBelt(belt) {
    belt.asteroidsLDM = [];
    belt.asteroidsHD = [];

    for (let i = 0; i < belt.asteroidCountLDM; i++) {
        const randAnnulusPt = generateRandomAnnulus(belt.distanceFromCenter * relativePlanetScaling, (belt.distanceFromCenter + belt.thickness) * relativePlanetScaling, canvas.width/2, canvas.height/2);
        let newLDMasteroid = Object.create(asteroidDisplay); //create a new LDM asteroid display

        newLDMasteroid.positionX = randAnnulusPt.x; //generate the asteroid display's position around the ring
        newLDMasteroid.positionY = randAnnulusPt.y;

        newLDMasteroid.size = generateRandomArbitrary(belt.asteroidMinSizeLDM * relativePlanetScaling, belt.asteroidMaxSizeLDM * relativePlanetScaling); //randomise the size based on the min and max LDM size for the asteroid belt
        if (belt.asteroidColors.length > 0) {
            newLDMasteroid.color = belt.asteroidColors[Math.floor(generateRandomArbitrary(0, belt.asteroidColors.length - 1))]; //randomise colors if there are values within the array of asteroid colors
        }
        else {
            newLDMasteroid.color = belt.asteroidDefaultColor; //else generate using the default color
        }

        belt.asteroidsLDM.push(newLDMasteroid); //push asteroid display to the list of LDM asteroids
    }

    for (let i = 0; i < belt.asteroidCountHD; i++) {
        const randAnnulusPt = generateRandomAnnulus(belt.distanceFromCenter * relativePlanetScaling, (belt.distanceFromCenter + belt.thickness) * relativePlanetScaling, canvas.width / 2, canvas.height / 2); //generate random points about the ring
        let newAsteroid = Object.create(asteroidDisplay);

        newAsteroid.positionX = randAnnulusPt.x;
        newAsteroid.positionY = randAnnulusPt.y;
        newAsteroid.size = generateRandomArbitrary(belt.asteroidMinSizeHD * relativePlanetScaling, belt.asteroidMaxSizeHD * relativePlanetScaling);


        if (belt.asteroidColors.length > 0) {
            newAsteroid.color = belt.asteroidColors[Math.floor(generateRandomArbitrary(0, belt.asteroidColors.length - 1))]; //randomise colors if there are values within the array of asteroid colors
        }
        else {
            newAsteroid.color = belt.asteroidDefaultColor; //else generate using the default color
        }

        belt.asteroidsHD.push(newAsteroid);

    }
}

function renderAsteroids(belt) {
    const asteroids = windowZoom < belt.windowLODzoom || !highResAsteroids ? belt.asteroidsLDM : belt.asteroidsHD;

    for (let i = 0; i < asteroids.length; i++) {
        let asteroid = asteroids[i];

        // Calculate asteroid position relative to canvas center
        let asteroidFromCenterX = asteroid.positionX - canvas.width / 2;
        let asteroidFromCenterY = asteroid.positionY - canvas.height / 2;

        // Apply scaling factor
        let scaledAsteroidFromCenterX = asteroidFromCenterX * scalingFactor;
        let scaledAsteroidFromCenterY = asteroidFromCenterY * scalingFactor;

        // Calculate final position with offsets
        let scaledAsteroidPosX = canvas.width / 2 + scaledAsteroidFromCenterX + offsetX;
        let scaledAsteroidPosY = canvas.height / 2 + scaledAsteroidFromCenterY + offsetY;

        if (scaledAsteroidPosX + asteroid.size * scalingFactor < 0 || scaledAsteroidPosX - asteroid.size * scalingFactor > canvas.width ||
            scaledAsteroidPosY + asteroid.size * scalingFactor < 0 || scaledAsteroidPosY - asteroid.size * scalingFactor > canvas.height) {
            continue;
        }

        // Draw the asteroid
        ctx.beginPath();
        ctx.fillStyle = asteroid.color;
        ctx.arc(scaledAsteroidPosX, scaledAsteroidPosY, asteroid.size * scalingFactor, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }
}



//#endregion

//#region interactiveMenu
let planetButtons = [];
function addPlanetsToList() {
    for (let i = 0; i < planetDisplays.length; i++) {
        let listItem = document.createElement('li');
        let button = document.createElement('button');
        button.id = `planetButton${i}`;
        button.textContent = planetDisplays[i].name;

        listItem.appendChild(button);
        document.querySelector('#planetDisplayBar ul').appendChild(listItem);

        planetButtons.push(button);
    }
}

let xLock = false;
let yLock = false;
let hasZoomedOut = true;

let hasCalculatedZoomTime = false;
let hasCalculatedMoveTime = false;
function selectPlanet(dt) {
    for (let i = 0; i < planetButtons.length; i++) {
        planetButtons[i].onclick = function () {
            planetToView = planetDisplays[i];
            xLock = false;
            yLock = false;
            hasZoomedOut = false;

            hasCalculatedZoomTime = false;
            hasCalculatedMoveTime = false;
            lockOntoDisplayPlanet(planetToView);  // Lock onto the planet when it is selected
        };
    }

    zoomOut(1, dt);
    updateCameraPosition(2, dt);
    updateZoomLevel();
}


let initZoom;
let targetZoom;
let amtToZoom;
let zoomSpeed;
function zoomOut(targetTime, dt) {
    if (hasZoomedOut) { return; }


    if (!hasCalculatedZoomTime)
    {
        initZoom = windowZoom;
        targetZoom = 1;
        amtToZoom = initZoom - targetZoom;
        zoomSpeed = amtToZoom / targetTime;
        hasCalculatedZoomTime = true;
    }

    if (windowZoom > targetZoom) {
        windowZoom -= zoomSpeed * dt;
    }
    else if (windowZoom <= targetZoom) {
        windowZoom = 1;
        hasZoomedOut = true;
    }
}

function lockOntoDisplayPlanet(planet) {
    // Calculate the distance from the center
    let planetFromCenterX = planet.positionX - canvas.width / 2;
    let planetFromCenterY = planet.positionY - canvas.height / 2;

    // Apply the scaling factor to the distance
    let scaledPlanetFromCenterX = planetFromCenterX * scalingFactor;
    let scaledPlanetFromCenterY = planetFromCenterY * scalingFactor;

    // Recalculate the position using the scaled distance
    let scaledPositionX = canvas.width / 2 + scaledPlanetFromCenterX;
    let scaledPositionY = canvas.height / 2 + scaledPlanetFromCenterY;

    targetOffsetX = (canvas.width / 2) - scaledPositionX;
    targetOffsetY = (canvas.height / 2) - scaledPositionY;

    if (xLock && yLock) {
        offsetX = targetOffsetX;
        offsetY = targetOffsetY;
    }


    let scaleRatioToSun = planet.size / Sun.size;
    targetScalingFactor = 1 / scaleRatioToSun;
}

let amtToOffsetX;
let amtToOffsetY;

let offsetSpeedX;
let offsetSpeedY;
function updateCameraPosition(targetTime, dt) {

    if (!hasZoomedOut) { return; }

    if (!hasCalculatedMoveTime) {
        hasCalculatedMoveTime = true;
        
        amtToOffsetX = Math.abs(targetOffsetX - offsetX);
        amtToOffsetY = Math.abs(targetOffsetY - offsetY);

        offsetSpeedX = amtToOffsetX / targetTime;
        offsetSpeedY = amtToOffsetY / targetTime;
    }

    if (xLock && yLock) {
        offsetX = targetOffsetX;
        offsetY = targetOffsetY;
        return;
    }

    // Smoothly transition the offset X
    if (Math.abs(offsetX - targetOffsetX) < offsetSpeedX * dt * 30) {
        offsetX = targetOffsetX;
        xLock = true;
    } else if (offsetX < targetOffsetX) {
        offsetX += offsetSpeedX * dt;
    } else if (offsetX > targetOffsetX) {
        offsetX -= offsetSpeedX * dt;
    }

    // Smoothly transition the offset Y
    if (Math.abs(offsetY - targetOffsetY) < offsetSpeedY * dt * 30) {
        offsetY = targetOffsetY;
        yLock = true;
    } else if (offsetY < targetOffsetY) {
        offsetY += offsetSpeedY * dt;
    } else if (offsetY > targetOffsetY) {
        offsetY -= offsetSpeedY * dt;
    }
}

function updateZoomLevel() {
    if (!canInteractWithMainMenu || !hasZoomedOut) { return; }

    let scaleSpeed = 0.2; // Adjusted to ensure smoother transitions

    // Smoothly transition the zoom level
    if (Math.abs(windowZoom - targetScalingFactor) < scaleSpeed) {
        windowZoom = targetScalingFactor;
    } else if (windowZoom < targetScalingFactor) {
        windowZoom += scaleSpeed;
    } else if (windowZoom > targetScalingFactor) {
        windowZoom -= scaleSpeed;
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
    initialisePlanetDisplays();
    addPlanetsToList();
    planetToView = Sun;
    calledInit = true; //we do not want to call init more than once, so we set the bool to true such that init will not be called again after the first frame
}

function update(dt) {
    //this function will run each frame of the loop, values to be updated should be placed here
    rotateGalaxy(dt);
    generateWarp(dt);
    moveWarp(dt);
    scalePlanetsOnLoad(0.05 * dt);
    rotatePlanetDisplays(dt);
    selectPlanet(dt);
    lockOntoDisplayPlanet(planetToView);
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
    renderPlanetDisplays();
    renderAsteroids(newBelt);
    renderAsteroids(kuiperBelt);
    
}


run(); //call run once and it will call itself repeatedly

//#endregion