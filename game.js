var canvas = document.getElementById('game');

var game = new Game(canvas, simulation, draw);
game.mapKeys({
	27: "pause",
	32: "space",
	37: "left",
	38: "up",
	39: "right",
	40: "down",
});
game.start();

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

var player = {};
var buildings = [];
var distance = 0;
var state = "start";
var stateMessages = {
	"start": "Press space to start",
	"paused": "Paused. Space starts",
	"dead": "You died. Space restarts"
};

function deleteInvisibleBuildings() {
	while (buildings.length > 0 && buildings[0].x + buildings[0].width < 0) {
		buildings.shift();
	}
}

function populateBuildings() {
	while (buildings.length == 0 || buildings[buildings.length - 1].x + buildings[buildings.length - 1].width < canvas.width) {
		var x = 0;
		if (buildings.length > 0) {
			var last = buildings[buildings.length - 1];
			x = last.x + last.width + getRandomArbitrary(x + 100, x + 400);
		}
		buildings.push({ x: x, y: getRandomArbitrary(200, 400), width: getRandomArbitrary(300, 700) });
	}
}

function moveBuildings(elapsedSec) {
	for (var i in buildings) {
		var building = buildings[i];
		building.x -= elapsedSec * player.xaccel;
	}
	deleteInvisibleBuildings();
	populateBuildings();
}

function reset() {
	buildings = [];
	distance = 0;
	populateBuildings();
	player = { x: 50, y: 50, width: 50, height: 50, xaccel: 70, yaccel: 0 }
	player.y = buildings[0].y - player.height;
}
reset();

function simulation(timeDiffMillis) {
	if (game.keys["pause"]) {
		game.keys["pause"] = false;
		if (state === "paused") {
			state = "running";
		} else if (state === "running") {
			state = "paused";
		}
	}
	if (state === "paused" || state === "start" || state === "dead") {
		if (game.keys["space"]) {
			if (state === "dead") {
				reset();
			}
			state = "running";
			game.keys["space"] = false;
		} else {
			return;
		}
	}
	var elapsedSec = timeDiffMillis / 100;

	distance += elapsedSec * player.xaccel;

	moveBuildings(elapsedSec);

	if (game.keys["left"]) {
		player.x -= elapsedSec * 70;
	}
	if (game.keys["right"]) {
		player.x += elapsedSec * 70;
	}
	var gravityAccel = 50;
	player.yaccel += elapsedSec * gravityAccel;
	player.y += elapsedSec * player.yaccel;

	if (player.y > canvas.height) {
		state = "dead";
	}

	var onGround = false;
	for (var i in buildings) {
		var building = buildings[i];
		if (player.x + player.width > building.x && player.x < building.x + building.width) {
			if (player.y + player.height > building.y) {
				player.y = building.y - player.height;
				player.yaccel = 0;
				onGround = true;
			}
		}
	}

	if (game.keys["space"] && onGround) {
		player.yaccel = -150;
	}
}

function draw(context) {
	context.fillStyle = "#87ceeb";
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = "#00ff00";
	context.fillRect(0, 450, canvas.width, 30);

	for (var i in buildings) {
		var building = buildings[i];
		context.fillStyle = "#666666";
		context.fillRect(building.x, building.y, building.width, canvas.height - building.y);
	}

	context.fillStyle = "#ff0000";
	context.fillRect(player.x, player.y, player.width, player.height);

	context.fillStyle = "#ffffff";
	context.font = "bold 24px mono";
	var dist = Math.round(distance / player.width * 100) / 100;
	context.fillText(dist, 20, 40);

	if (state != "running") {
		context.fillStyle = "#ffffff";
		context.font = "bold 36px mono";
		context.fillText(stateMessages[state], 100, 200);
	}
}
