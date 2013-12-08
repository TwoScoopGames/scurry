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
var max_distance = 0;
var state = "start";
var stateMessages = {
	"start": "Press space to start",
	"paused": "Paused. Space starts",
	"dead": "You died. Space restarts"
};

var window_width = 50;
var window_spacing = 40;
var window_height = 70;

function Building(x) {
	var y = getRandomArbitrary(200, 400);
	var num_windows = Math.floor(Math.random() * 5 + 3);
	var width = (num_windows * (window_width + window_spacing)) + window_spacing + 1;
	Entity.call(this, x, y, width, canvas.height - y);
	this.vx = -70;

	var num_lit_windows = Math.random() * 5;
	this.lit_windows = [];
	for (var i = 0; i < num_lit_windows; i++) {
		var w = Math.random() * num_windows * (this.height / (window_height + window_spacing));
		this.lit_windows.push(Math.floor(w));
	}
}
Building.prototype = Object.create(Entity.prototype);
Building.prototype.draw = function(context) {
	context.fillStyle = "#666666";
	context.fillRect(this.x, this.y, this.width, canvas.height - this.y);
	var w = 0;
	for (var y = window_spacing; y < this.height; y += window_height + window_spacing) {
		for (var x = window_spacing; x < this.width - window_width - window_spacing; x += window_width + window_spacing) {
			if (this.is_window_lit(w)) {
				context.fillStyle = "#ffff00";
			} else {
				context.fillStyle = "#333333";
			}
			context.fillRect(this.x + x, this.y + y, window_width, window_height);
			w++;
		}
	}
};
Building.prototype.is_window_lit = function(w) {
	for (var i = 0; i < this.lit_windows.length; i++) {
		if (this.lit_windows[i] == w) {
			return true;
		}
	}
	return false;
}

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
		buildings.push(new Building(x));
	}
}

function moveBuildings(elapsedSec) {
	for (var i in buildings) {
		buildings[i].move(elapsedSec);
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

	distance -= elapsedSec * buildings[0].vx;
	if (distance > max_distance) {
		max_distance = distance;
	}

	moveBuildings(elapsedSec);

	if (game.keys["left"]) {
		player.x -= elapsedSec * 70;
	}
	if (game.keys["right"]) {
		player.x += elapsedSec * 70;
	}
	var gravityAccel = 50;
	player.vy += elapsedSec * gravityAccel;
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
					buildings[j].vx = 0;
				}
				player.x = building.x - player.width;
				return;
			}
			player.y = building.y - player.height;
			player.vy = 0;
			onGround = true;
		}
	}

	if (game.keys["space"] && onGround) {
		player.vy = -150;
	}
}

function draw(context) {
	context.fillStyle = "#87ceeb";
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = "#00ff00";
	context.fillRect(0, 450, canvas.width, 30);

	for (var i in buildings) {
		buildings[i].draw(context);
	}

	context.fillStyle = "#ff0000";
	context.fillRect(player.x, player.y, player.width, player.height);

	context.fillStyle = "#ffffff";
	context.font = "bold 24px mono";
	var dist = Math.round(distance / player.width * 100) / 100;
	context.fillText(dist, 20, 40);
	dist = Math.round(max_distance / player.width * 100) / 100;
	context.fillText("Max: " + dist, 300, 40);

	if (state != "running") {
		context.fillStyle = "#ffffff";
		context.font = "bold 36px mono";
		context.fillText(stateMessages[state], 100, 200);
	}
}
