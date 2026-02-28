/**
 * BENEATH THE SURFACE - A 2D PLATFORMER
 * Handle: @Sempera_beneath
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 900;
canvas.height = 500;

// CONFIG
const GRAVITY = 0.6;
const FRICTION = 0.8;
let gameStarted = false;
let isTransitioning = false;
let currentWorld = "surface";
let currentLevelIndex = 0;
let shakeAmount = 0;
let cloudOffset = 0;
let particles = [];
const keys = {};

// UI
const levelDisplay = document.getElementById("levelDisplay");
const worldDisplay = document.getElementById("worldDisplay");
const switchDisplay = document.getElementById("switchDisplay");

// AUDIO
const surfaceMusic = new Audio('surface_ambient.mp3');
const beneathMusic = new Audio('beneath_distorted.mp3');
surfaceMusic.loop = true;
beneathMusic.loop = true;

// LEVEL DATA
const levels = [
    { 
        name: "Awareness",
        switchesActivated: 0,
        requiredSwitches: 1, 
        objects: [
            { x: 0, y: 450, width: 600, height: 50, world: "both", type: "platform" },
            { x: 200, y: 350, width: 150, height: 20, world: "surface", type: "platform" }, 
            { x: 400, y: 300, width: 120, height: 20, world: "beneath", type: "platform" }, 
            { x: 600, y: 450, width: 300, height: 50, world: "surface", type: "platform" }, 
            { x: 650, y: 250, width: 30, height: 30, world: "surface", type: "switch" },
            { x: 820, y: 410, width: 40, height: 40, world: "beneath", type: "door" }
        ]
    },
    { 
        name: "Consequences",
        switchesActivated: 0,
        requiredSwitches: 0,
        objects: [
            { x: 0, y: 450, width: 300, height: 50, world: "both", type: "platform" },
            { x: 350, y: 380, width: 200, height: 20, world: "surface", type: "platform" }, 
            { x: 350, y: 380, width: 200, height: 20, world: "beneath", type: "spike" }, 
            { x: 350, y: 250, width: 100, height: 20, world: "both", type: "platform" },
            { x: 550, y: 200, width: 100, height: 20, world: "both", type: "platform" },
            { x: 750, y: 450, width: 150, height: 50, world: "both", type: "platform" },
            { x: 820, y: 410, width: 40, height: 40, world: "beneath", type: "door" }
        ]
    }
];

const player = { x: 50, y: 300, width: 30, height: 40, vX: 0, vY: 0, grounded: false };

// UTILS
function initParticles() {
    particles = [];
    for(let i = 0; i < 50; i++) {
        particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.random()*3, spd: Math.random()*0.5 + 0.2 });
    }
}

function resetPlayer() {
    player.x = 50; player.y = 300; player.vX = 0; player.vY = 0;
    shakeAmount = 12;
}

// COLLISION & PHYSICS
function update() {
    if (!gameStarted) return;

    if (keys["ArrowRight"] || keys["d"]) player.vX += 0.5;
    if (keys["ArrowLeft"] || keys["a"]) player.vX -= 0.5;
    if ((keys["ArrowUp"] || keys["w"] || keys[" "]) && player.grounded) {
        player.vY = -13; player.grounded = false;
    }

    player.vY += GRAVITY;
    player.vX *= FRICTION;
    player.x += player.vX;
    player.y += player.vY;

    if (player.y > canvas.height) resetPlayer();

    player.grounded = false;
    const level = levels[currentLevelIndex];
    level.objects.forEach(obj => {
        if (obj.world !== currentWorld && obj.world !== "both") return;
        
        if (player.x < obj.x + obj.width && player.x + player.width > obj.x &&
            player.y < obj.y + obj.height && player.y + player.height > obj.y) {
            
            if (obj.type === "spike") resetPlayer();
            else if (obj.type === "platform") {
                const pMid = player.y + player.height/2;
                const oMid = obj.y + obj.height/2;
                if (pMid < oMid) { 
                    player.y = obj.y - player.height; player.vY = 0; player.grounded = true; 
                } else {
                    player.y = obj.y + obj.height; player.vY = 0;
                }
            }
            else if (obj.type === "switch") { obj.type = "used"; level.switchesActivated++; }
            else if (obj.type === "door" && currentWorld === "beneath" && level.switchesActivated >= level.requiredSwitches) {
                currentLevelIndex++; resetPlayer();
            }
        }
    });
}

// DRAWING
function render() {
    ctx.save();
    if (shakeAmount > 0) {
        ctx.translate(Math.random()*shakeAmount - shakeAmount/2, Math.random()*shakeAmount - shakeAmount/2);
        shakeAmount *= 0.9;
    }

    // BACKGROUNDS
    if (currentWorld === "surface") {
        ctx.fillStyle = "#87ceeb"; ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.fillStyle = "rgba(255,255,255,0.5)"; cloudOffset += 0.5;
        for(let i=0; i<5; i++) {
            let x = (i*250 + cloudOffset) % (canvas.width+200) - 100;
            ctx.beginPath(); ctx.arc(x, 50+(i*20), 30, 0, Math.PI*2); ctx.fill();
        }
    } else {
        ctx.fillStyle = "#121220"; ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.fillStyle = "rgba(255,0,0,0.15)";
        particles.forEach(p => {
            p.y -= p.spd; if(p.y < 0) p.y = canvas.height;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
    }

    // OBJECTS
    const level = levels[currentLevelIndex];
    level.objects.forEach(obj => {
        if (obj.world !== currentWorld && obj.world !== "both") return;
        ctx.fillStyle = obj.type === "spike" ? "#ff4d4d" : (currentWorld === "surface" ? "#2ecc71" : "#444");
        if (obj.type === "switch") ctx.fillStyle = "#3498db";
        if (obj.type === "used") ctx.fillStyle = "#1a5276";
        if (obj.type === "door") ctx.fillStyle = "#f1c40f";
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    });

    // PLAYER
    ctx.fillStyle = currentWorld === "surface" ? "#222" : "#eee";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.restore();

    if (!gameStarted) {
        ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.font = "bold 32px 'JetBrains Mono'";
        ctx.fillText("BENEATH", canvas.width/2, canvas.height/2);
        ctx.font = "16px 'JetBrains Mono'";
        ctx.fillText("PRESS ANY KEY TO START", canvas.width/2, canvas.height/2 + 40);
    }

    levelDisplay.innerText = `LEVEL: ${currentLevelIndex + 1}`;
    worldDisplay.innerText = `REALITY: ${currentWorld.toUpperCase()}`;
    switchDisplay.innerText = `DATA: ${level.switchesActivated}/${level.requiredSwitches}`;
}

// EVENTS
function switchWorld() {
    if (isTransitioning) return;
    isTransitioning = true;
    shakeAmount = 8;
    setTimeout(() => {
        currentWorld = currentWorld === "surface" ? "beneath" : "surface";
        if (gameStarted) {
            surfaceMusic.volume = currentWorld === "surface" ? 0.5 : 0;
            beneathMusic.volume = currentWorld === "surface" ? 0 : 0.5;
            surfaceMusic.play(); beneathMusic.play();
        }
        isTransitioning = false;
    }, 150);
}

document.addEventListener("keydown", e => {
    if(!gameStarted) { gameStarted = true; surfaceMusic.play(); beneathMusic.play(); beneathMusic.volume = 0; }
    keys[e.key] = true;
    if (e.key.toLowerCase() === "e" || e.key === "Shift") switchWorld();
});
document.addEventListener("keyup", e => keys[e.key] = false);

initParticles();
function loop() { update(); render(); requestAnimationFrame(loop); }
loop();