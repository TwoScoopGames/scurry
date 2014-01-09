var canvas = document.getElementById('game');

function setCanvasSize() {
	var ow = 1136;
	var oh = 640;

	var w = Math.min(window.innerWidth, ow);
	var h = Math.min(window.innerHeight, oh);
	canvas.style.width = w + 'px';
	canvas.style.height = h + 'px';

	canvas.width = oh / window.innerHeight * window.innerWidth;
	canvas.height = oh;
}
window.onresize = setCanvasSize;
setCanvasSize();

// prevent springy scrolling on ios
document.ontouchmove = function(e) {
	e.preventDefault();
};

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
var shelves = [];
var distance = 0;
var max_distance = 0;
var state = "start";
var stateMessages = {
	"start": "Press space to start",
	"paused": "Paused. Space starts",
	"dead": "You died. Space restarts"
};

var bgv = -30;
var bgx = 0;

var images = new ImageLoader();
images.load('bg', 'images/Scurry-bg-TEST2.png');
images.load('beetle', 'images/scurry-run7f136x80.png', 7);
images.load('beetle-jump', 'images/scurry-jump-sprite-7f129x124.png', 7);
images.load('shelf', 'images/shelf.png');
images.load('shelf background', 'images/shelf-bars-spritesheet.png');
images.load('box1', 'images/box1.png');
images.load('box2', 'images/box2.png');
images.load('box3', 'images/box3.png');
images.load('can1', 'images/can1.png');
images.load('can2', 'images/can2.png');
images.load('syrup', 'images/syrup.png');
images.load('tag1', 'images/price-tag1.png');
images.load('tag2', 'images/price-tag2.png');
images.load('tag3', 'images/price-tag-sale.png');

var sounds = new SoundLoader();
sounds.load('jump', 'audio/jump.wav');
sounds.load('land', 'audio/land.wav');
sounds.load('death', 'audio/death.wav');

function wait_for_assets_to_load() {
	if (images.all_loaded() && sounds.all_loaded()) {
		assets_loaded();
	} else {
		window.setTimeout(wait_for_assets_to_load, 200);
	}
}
window.setTimeout(wait_for_assets_to_load, 200);

var beetle = new Animation();
var beetle_jump = new Animation();
var shelf;
var shelf_bkgd;

function assets_loaded() {
	beetle.add(images.get('beetle0'), 0.3);
	beetle.add(images.get('beetle1'), 0.3);
	beetle.add(images.get('beetle2'), 0.3);
	beetle.add(images.get('beetle3'), 0.3);
	beetle.add(images.get('beetle4'), 0.3);
	beetle.add(images.get('beetle5'), 0.3);
	beetle.add(images.get('beetle6'), 0.3);

	beetle_jump.add(images.get('beetle-jump0'), 0.5);
	beetle_jump.add(images.get('beetle-jump1'), 0.5);
	beetle_jump.add(images.get('beetle-jump2'), 0.5);
	beetle_jump.add(images.get('beetle-jump3'), 0.5);
	beetle_jump.add(images.get('beetle-jump4'), 0.5);
	beetle_jump.add(images.get('beetle-jump5'), 0.5);
	beetle_jump.add(images.get('beetle-jump6'), 0.5);
	beetle_jump.add(images.get('beetle-jump5'), 0.5);
	beetle_jump.repeatAt = 4;

	shelf = new ThreePatch(images.get('shelf'));
	shelf_bkgd = new ThreePatch(images.get('shelf background'));
	reset();
	game.start();
}

var shelf_item_spacing = 30;

var shelf_items = ['empty', 'box1', 'box2', 'box3', 'can1', 'can2', 'syrup'];
var shelf_tags = ['tag1', 'tag2', 'tag3'];
var same_item_chance = 0.50;

function rand_price() {
	var price = (((Math.random() * 95) |0) + 5) * 10 + 9;
	price = '' + price;
	if (price.length == 2) {
		return '.' + price;
	}
	return price[0] + '.' + price.substr(1);
}
function get_shelf_items(num_units) {
	if (arguments.length == 0) {
		num_units = Math.floor(Math.random() * 3 + 2);
	}
	var items = [];
	var possible_items = shelf_items.slice(0);
	for (var i = 0; i < num_units; i++) {
		if (i > 0 && Math.random() < same_item_chance) {
			items.push(items[i - 1]);
			continue;
		}
		var	n = (Math.random() * possible_items.length) |0;
		var tag = (Math.random() * shelf_tags.length) |0;
		var item = {
			item: possible_items[n],
			tag: shelf_tags[tag],
			price: rand_price()
		};
		items.push(item);
		if (item.item != 'empty') {
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

		var item = items[i].item;
		var tag = images.get(items[i].tag);
		if (item == 'empty') {
			item = 'box1';
		}
		var img = images.get(item);
		if (tag.width > img.width) {
			width += tag.width;
		} else {
			width += img.width;
		}
	}
	return width;
}
function draw_tag_price(context, item, tagx, tagy) {
	var price = item.price;
	if (item.tag == 'tag3') {
		context.fillStyle = '#ff0000';
	} else {
		context.fillStyle = '#333333';
	}
	context.font = "36px pixelade";
	context.fillText(price, tagx + 70, tagy + 65);
}
function draw_shelf_item(context, item,	x, y) {
	if (item.item == 'empty') {
		return images.get('box1').width;
	}
	var img = images.get(item.item);
	context.drawImage(img, x, y - img.height);

	var tag = images.get(item.tag);
	var tagx = x + ((img.width - tag.width) / 2);
	var tagy = y + 10;
	context.drawImage(tag, tagx, tagy);
	draw_tag_price(context, item, tagx, tagy);

	if (tag.width > img.width) {
		return tag.width;
	} else {
		return img.width;
	}
}
function draw_shelf_items(context, items, x, y) {
	x += shelf.w1;
	y += 5;
	for (var i = 0; i < items.length; i++) {
		if (i > 0) {
			x += shelf_item_spacing;
		}

		var item = items[i];
		var width = draw_shelf_item(context, item, x, y);
		x += width;
	}
}
function draw_shelf(context, items, x, y, width) {
	shelf.draw(context, x, y, width);
	for (var r = 1; r < 4; r++) {
		var y1 = y - (r * shelf_bkgd.img.height) + r;
		shelf_bkgd.draw(context, x, y1, width);
	}
	draw_shelf_items(context, items, x, y);
}

function Shelf(x) {
	var y = (canvas.height / 4) + (Math.random() * (canvas.height / 2));
	var items = x == 0 ? get_shelf_items(6) : get_shelf_items();
	var width = get_shelf_width(items);
	Entity.call(this, x, y, width, canvas.height - y);

	var height = (shelf_bkgd.img.height - 1) * 3 + shelf.img.height - 1;
	this.img = draw_canvas(width, height + 50, function(ctx) {
		var y = 0;
		for (var r = 0; r < 3; r++) {
			shelf_bkgd.draw(ctx, 0, y, width);
			y += shelf_bkgd.img.height - 1;
		}
		shelf.draw(ctx, 0, y, width);
		draw_shelf_items(ctx, items, 0, y);
	});
}
Shelf.prototype = Object.create(Entity.prototype);
Shelf.prototype.draw = function(context) {
	var spacing = (shelf_bkgd.img.height - 1) * 3;
	var height = spacing + shelf.img.height - 1;
	context.drawImage(this.img, this.x, this.y - spacing);
};
Shelf.prototype.copy = function(y) {
	var s = new Shelf(this.x);
	s.img = this.img;
	s.width = this.width;
	s.y = y;
	return s;
}

function deleteInvisibleShelves() {
	while (shelves.length > 0 && shelves[0].x + shelves[0].width < game.camerax) {
		shelves.shift();
	}
}

function populateShelves() {
	while (shelves.length == 0 || shelves[shelves.length - 1].x + shelves[shelves.length - 1].width < game.camerax + canvas.width) {
		var x = 0;
		if (shelves.length > 0) {
			var last = shelves[shelves.length - 1];
			x = last.x + last.width + getRandomArbitrary(x + 150, x + 400);
		}

		var spacing = (shelf_bkgd.img.height - 1) * 3;
		var height = spacing + shelf.img.height - 1;

		var s = new Shelf(x);
		shelves.push(s.copy(s.y + height));
		shelves.push(s);
		shelves.push(s.copy(s.y - height));
	}
}

function moveShelves(elapsedSec) {
	for (var i in shelves) {
		shelves[i].move(elapsedSec);
	}
}

function reset() {
	shelves = [];
	distance = 0;
	game.camerax = 0;
	populateShelves();
	player = new AnimatedEntity(200, 50, 120, 40, beetle, -17, -27);
	player.x = 200;
	player.y = shelves[1].y - player.height;
	player.vx = 100;
	bgv = -30;
	bgx = 0;
}

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

	distance += elapsedSec * player.vx;
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
	game.camerax = player.x - 200;
	// game.cameray = player.y - (canvas.height / 2);

	deleteInvisibleShelves();
	populateShelves();

	if (player.y > canvas.height) {
		state = "dead";
		sounds.play('death');
		return;
	}

	var onGround = false;
	for (var i in shelves) {
		var shelf = shelves[i];
		if (player.collides(shelf)) {
			if (player.didOverlapHoriz(shelf) && player.wasAbove(shelf)) {
				player.y = shelf.y - player.height;
				player.vy = 0;
				onGround = true;
			}
		}
	}

	if (onGround && player.sprite == beetle_jump) {
		player.sprite = beetle;
		beetle.reset();
		sounds.play('land');
	}
	if (!onGround && player.sprite == beetle) {
		player.sprite = beetle_jump;
		beetle_jump.reset();
	}
	if ((game.keys["space"] || game.mouse.buttons['0']) && onGround) {
		player.vy = -150;
		player.sprite = beetle_jump;
		beetle_jump.reset();
		sounds.play('jump');
	}

	bgx += elapsedSec * bgv;
	var bg = images.get('bg');
	if (bgx + bg.width < 0) {
		bgx += bg.width;
	}
}

function shadowText(context, text, x, y) {
	context.fillStyle = "#000000";
	context.fillText(text, x + 3, y + 3);
	context.fillStyle = "#00cc00";
	context.fillText(text, x, y);
}

function draw(context) {
	var bg = images.get('bg');
	context.drawImage(bg, game.camerax + bgx, game.cameray);
	if (bgx + bg.width < canvas.width) {
		context.drawImage(bg, game.camerax + bgx + bg.width, game.cameray);
	}

	for (var i in shelves) {
		shelves[i].draw(context);
	}

	player.draw(context);

	context.fillStyle = "#000000";
	context.font = "36px pixelade";
	var dist = Math.round(distance / player.width * 100) / 100;
	context.fillText(dist, game.camerax + 20, game.cameray + 40);
	dist = Math.round(max_distance / player.width * 100) / 100;
	context.fillText("Max: " + dist, game.camerax + 300, game.cameray + 40);
	context.fillText(game.fps + " FPS", game.camerax + 20, game.cameray + 100);

	if (state != "running") {
		context.font = "100px pixelade";
		shadowText(context, stateMessages[state], game.camerax + 100, game.cameray + 200);
	}
}
