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
		var y = getRandomArbitrary(200, 400);
		var b = new Entity(x, y, getRandomArbitrary(300, 700), canvas.height - y);
		b.xaccel = -70;
		buildings.push(b);
	}
}

function moveBuildings(elapsedSec) {
	for (var i in buildings) {
		var building = buildings[i];
		building.move(elapsedSec);
	}
	deleteInvisibleBuildings();
	populateBuildings();
}

function reset() {
	buildings = [];
	distance = 0;
	populateBuildings();
	player = new Entity(50, 50, 50, 50);
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

	distance -= elapsedSec * buildings[0].xaccel;

	moveBuildings(elapsedSec);

	if (game.keys["left"]) {
		player.x -= elapsedSec * 70;
	}
	if (game.keys["right"]) {
		player.x += elapsedSec * 70;
	}
	var gravityAccel = 50;
	player.yaccel += elapsedSec * gravityAccel;
	player.move(elapsedSec);

	if (player.y > canvas.height) {
		state = "dead";
		return;
	}

	var onGround = false;
	for (var i in buildings) {
		var building = buildings[i];
		if (player.collides(building)) {
			if (player.didOverlapVert(building) && !player.didOverlapHoriz(building)) {
				for (var j in buildings) {
					buildings[j].xaccel = 0;
				}
				player.x = building.x - player.width;
				return;
			}
			player.y = building.y - player.height;
			player.yaccel = 0;
			onGround = true;
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
