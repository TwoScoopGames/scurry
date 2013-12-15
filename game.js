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
images.load('box1', 'images/box1.png');
images.load('box2', 'images/box2.png');
images.load('box3', 'images/box3.png');
images.load('can1', 'images/can1.png');
images.load('can2', 'images/can2.png');

function wait_for_images_to_load() {
	if (images.all_loaded()) {
		game.start();
	} else {
		window.setTimeout(wait_for_images_to_load, 200);
	}
}
window.setTimeout(wait_for_images_to_load, 200);

var beetle = new SpriteSheet(images.get('beetle'), 5, 0.50);
var shelf = new ThreePatch(images.get('shelf'));
var shelf_bkgd = new ThreePatch(images.get('shelf background'));

var shelf_item_spacing = 30;

var shelf_items = ['empty', 'box1', 'box2', 'box3', 'can1', 'can2'];
var same_item_chance = 0.50;

function get_shelf_items(len) {
	var num_units = Math.floor(Math.random() * 3 + 2);
	var items = [];
	var possible_items = shelf_items.slice(0);
	for (var i = 0; i < num_units; i++) {
		if (i > 0 && Math.random() < same_item_chance) {
			items.push(items[i - 1]);
			continue;
		}
		var	n = (Math.random() * possible_items.length) |0;
		var item = possible_items[n]
		items.push(item);
		if (item != 'empty') {
			possible_items.splice(n, 1);
		}
	}
	return items;
}
function get_shelf_width(items) {
	var width = 0;
	width += shelf.w1 + shelf.w3;
	for (var i = 0; i < items.length; i++) {
		if (i > 0) {
			width += shelf_item_spacing;
		}

		var item = items[i];
		if (item == 'empty') {
			item = 'box1';
		}
		width += images.get(item).width;
	}
	return width;
}
function draw_shelf_items(context, items, x, y) {
	x += shelf.w1;
	y += 5;
	for (var i = 0; i < items.length; i++) {
		if (i > 0) {
			x += shelf_item_spacing;
		}

		var item = items[i];
		if (item == 'empty') {
			x += images.get('box1').width;
			continue;
		}
		var img = images.get(item);
		context.drawImage(img, x, y - img.height);
		x += img.width;
	}
}

function Shelf(x) {
	var y = getRandomArbitrary(200, 400);
	this.items = get_shelf_items();
	var width = get_shelf_width(this.items);
	Entity.call(this, x, y, width, canvas.height - y);
	this.vx = -70;
}
Shelf.prototype = Object.create(Entity.prototype);
Shelf.prototype.draw = function(context) {
	shelf.draw(context, this.x, this.y, this.width);
	for (var y = this.y - shelf_bkgd.img.height + 1; y > -shelf_bkgd.img.height; y -= shelf_bkgd.img.height - 1) {
		shelf_bkgd.draw(context, this.x, y, this.width);
	}
	for (var y = this.y + shelf.img.height - 1; y < canvas.height; y += shelf_bkgd.img.height - 1) {
		shelf_bkgd.draw(context, this.x, y, this.width);
	}
	draw_shelf_items(context, this.items, this.x, this.y);
};
Shelf.prototype.is_window_lit = function(w) {
	for (var i = 0; i < this.lit_windows.length; i++) {
		if (this.lit_windows[i] == w) {
			return true;
		}
	}
	return false;
}

function deleteInvisibleShelves() {
	while (buildings.length > 0 && buildings[0].x + buildings[0].width < 0) {
		buildings.shift();
	}
}

function populateShelves() {
	while (buildings.length == 0 || buildings[buildings.length - 1].x + buildings[buildings.length - 1].width < canvas.width) {
		var x = 0;
		if (buildings.length > 0) {
			var last = buildings[buildings.length - 1];
			x = last.x + last.width + getRandomArbitrary(x + 100, x + 400);
		}
		buildings.push(new Shelf(x));
	}
}

function moveShelves(elapsedSec) {
	for (var i in buildings) {
		buildings[i].move(elapsedSec);
	}
	deleteInvisibleShelves();
	populateShelves();
}

function reset() {
	buildings = [];
	distance = 0;
	populateShelves();
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

	moveShelves(elapsedSec);

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
