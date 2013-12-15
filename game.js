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

var images = new ImageLoader();
images.load('beetle', 'images/scurry-player-run 86x57 .png');
images.load('shelf', 'images/shelf.png');
images.load('shelf background', 'images/shelf-bars-spritesheet.png');

var beetle = new SpriteSheet(images.get('beetle'), 5, 0.50);
var shelf = new ThreePatch(images.get('shelf'));
var shelf_bkgd = new ThreePatch(images.get('shelf background'));

var shelf_unit_width = 50;

function Building(x) {
	var y = getRandomArbitrary(200, 400);
	var num_units = Math.floor(Math.random() * 10 + 6);
	var width = num_units * shelf_unit_width;
	Entity.call(this, x, y, width, canvas.height - y);
	this.vx = -70;
}
Building.prototype = Object.create(Entity.prototype);
Building.prototype.draw = function(context) {
	shelf.draw(context, this.x, this.y, this.width);
	for (var y = this.y - shelf_bkgd.img.height + 1; y > -shelf_bkgd.img.height; y -= shelf_bkgd.img.height - 1) {
		shelf_bkgd.draw(context, this.x, y, this.width);
	}
	for (var y = this.y + shelf.img.height - 1; y < canvas.height; y += shelf_bkgd.img.height - 1) {
		shelf_bkgd.draw(context, this.x, y, this.width);
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
	player = new AnimatedEntity(50, 50, 56, 25, beetle, -17, -14);
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
		if (game.keys["space"] || game.mouse.buttons['0']) {
			if (state === "dead") {
				reset();
			}
			state = "running";
			game.keys["space"] = false;
			game.mouse.buttons['0'] = false;
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

	if ((game.keys["space"] || game.mouse.buttons['0']) && onGround) {
		player.vy = -150;
	}
}

function draw(context) {
	context.fillStyle = "#87ceeb";
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = "#00ff00";
	context.fillRect(0, canvas.height - 100, canvas.width, 100);

	for (var i in buildings) {
		buildings[i].draw(context);
	}

	player.draw(context);

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
