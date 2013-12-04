var canvas = document.getElementById('game');
var context = canvas.getContext("2d");

var lastTimestamp = -1;
function mainLoop(timestamp) {
	if (lastTimestamp === -1) {
		lastTimestamp = timestamp;
	}
	var timeDiff = timestamp - lastTimestamp;
	lastTimestamp = timestamp;

	simulation(timeDiff);
	draw();

	window.requestAnimationFrame(mainLoop);
}
window.requestAnimationFrame(mainLoop);

var player = { x: 50, y: 50, width: 50, height: 50, xaccel: 0, yaccel: 0 };

var buildings = [
	{ x: 30, y: 400, width: 200 },
	{ x: 400, y: 300, width: 200 }
];


function simulation(timeDiffMillis) {
	//var fps = 1000 / timeDiffMillis;
	var elapsedSec = timeDiffMillis / 100;
	if (keys["left"]) {
		player.x -= elapsedSec * 70;
	}
	if (keys["right"]) {
		player.x += elapsedSec * 70;
	}
	if (keys["space"]) {
		player.yaccel = -100;
	}
	var gravityAccel = 50;
	player.yaccel += elapsedSec * gravityAccel;
	player.y += elapsedSec * player.yaccel;
	for (var i in buildings) {
		var building = buildings[i];
		if (player.x + player.width > building.x && player.x < building.x + building.width) {
			if (player.y + player.height > building.y) {
				player.y = building.y - player.height;
				player.yaccel = 0;
			}
		}

	}
}

function draw() {
	context.fillStyle = "#87ceeb";
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = "#00ff00";
	context.fillRect(0, 450, canvas.width, 30);

	for (var i in buildings) {
		var building = buildings[i];
		console.log(building);
		context.fillStyle = "#666666";
		context.fillRect(building.x, building.y, building.width, canvas.height - building.y);
	}

	context.fillStyle = "#ff0000";
	context.fillRect(player.x, player.y, player.width, player.height);
}

var keys = {};
var keyMap = { 
	32: "space",
	37: "left", 
	38: "up",
	39: "right",
	40: "down"
};
for (var kc in keyMap) {
	keys[keyMap[kc]] = false;
}
window.onkeydown = function(event) {
	// console.log("keydown " + event.keyCode);
	if (keyMap.hasOwnProperty(event.keyCode)) {
		keys[keyMap[event.keyCode]] = true;
	}
}
window.onkeyup = function(event) {
	// console.log("keyup " + event.keyCode);
	if (keyMap.hasOwnProperty(event.keyCode)) {
		keys[keyMap[event.keyCode]] = false;
	}
}
