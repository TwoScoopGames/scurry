var canvas = document.getElementById('game');

function setCanvasSize() {
	var ow = 1136;
	var oh = 640;

	var w = Math.min(window.innerWidth, ow);
	var h = Math.min(window.innerHeight, oh);
	canvas.style.width = w + 'px';
	canvas.style.height = h + 'px';

	if (w != ow || h != oh) {
		canvas.width = oh / window.innerHeight * window.innerWidth;
		canvas.height = oh;
	}

	// console.log(window.innerWidth + "x" + window.innerHeight + " - " + canvas.style.width + "x" + canvas.style.height + " - " + canvas.width + "x" + canvas.height);
}
window.onresize = setCanvasSize;
setCanvasSize();

var keys = new KeyboardInput({
	27: "pause",
	32: "space",
	37: "left",
	38: "up",
	39: "right",
	40: "down",
	77: "m"
});
var mouse = new MouseInput(canvas);

var game = new Game(canvas, simulation, draw);

var starting = false;
var startTime = 0;
var lightsOn = false;
var beetleBlack;
var startScreen = new Game(canvas, function(timeDiffMillis) {
	if (starting) {
		startTime += timeDiffMillis;
		if (!lightsOn && startTime > 807) {
			lightsOn = true;
			beetleBlack = new AnimatedEntity(startScreen.cameraX, 420, 0, 0, beetle_black, 0, 0);
			beetleBlack.vx = 140;
		}
		if (startTime > 2300) {
			startScreen.stop();
			reset();
			game.start();
			return;
		}
	}
	if (!starting && (keys.consumePressed("space") || mouse.buttons[0])) {
		starting = true;
		mouse.buttons[0] = false;
		sounds.play('lights-on');
	}
	var elapsedSec = timeDiffMillis / 100;
	move_shelves(elapsedSec);
	if (beetleBlack) {
		beetleBlack.move(elapsedSec);
	}
	startScreen.cameraX += 20 * elapsedSec;
	delete_invisible_shelves(startScreen.cameraX);
	populate_shelves(startScreen.cameraX);

	bgx += elapsedSec * -5;
	var bg = images.get('bg');
	if (bgx + bg.width < 0) {
		bgx += bg.width;
	}

	logo_white.move(elapsedSec);
	logo_black.move(elapsedSec);
}, function(context) {
	var bg = images.get('bg');
	context.drawImage(bg, startScreen.cameraX + bgx, startScreen.cameraY);
	if (bgx + bg.width < canvas.width) {
		context.drawImage(bg, startScreen.cameraX + bgx + bg.width, startScreen.cameraY);
	}

	for (var i in shelves) {
		shelves[i].draw(context);
	}

	var logo;
	if (lightsOn) {
		context.fillStyle = "rgba(255, 255, 255, 0.7)";
		logo = logo_black;
	} else {
		context.fillStyle = "rgba(0, 0, 0, 0.7)";
		logo = logo_white;
	}
	context.fillRect(startScreen.cameraX, startScreen.cameraY, canvas.width, canvas.height);
	logo.draw(context, startScreen.cameraX + (canvas.width / 2) - (logo.width / 2), startScreen.cameraY);

	if (lightsOn) {
		beetleBlack.draw(context);
	}
	if (!starting) {
		context.fillStyle = "#ffffff";
		context.font = "48px pixelade";
		var msg = "TAP TO START";
		var w = context.measureText(msg).width;
		context.fillText(msg, startScreen.cameraX + (canvas.width / 2) - (w / 2), startScreen.cameraY + 450);
	}
});

var ls = 36;
var lrate = 0.02;
var lmin = 36;
var lmax = 46;
var loading = new Game(canvas, function(elapsedSec) {
	if (images.allLoaded() && sounds.allLoaded()) {
		assetsLoaded();
		loading.stop();
		startScreen.start();
		return;
	}
	ls += lrate * elapsedSec;
	if (ls > lmax) {
		lrate *= -1;
		ls = lmax;
	} else if (ls < lmin) {
		lrate *= -1;
		ls = lmin;
	}
}, function(context) {
	context.fillStyle = "#000000";
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.font = ls + "px mono";
	context.fillStyle = "#00cc00";
	context.fillText("Loading...", 100, (canvas.height / 2) - 18);
});
loading.start();

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
images.load('beetle-black', 'images/scurry-run7f45x26.png', 7);
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
images.load('logo-white', 'images/scurry-logo-white-10f686x399.png', 10);
images.load('logo-black', 'images/scurry-logo-black-10f686x399.png', 10);

var sounds = new SoundLoader();
sounds.load('jump', 'audio/jump.wav');
sounds.load('land', 'audio/land.wav');
sounds.load('death', 'audio/death.wav');
sounds.load('lights-on', 'audio/lights-on.wav');

var beetle = new Animation();
var beetle_black = new Animation();
var beetle_jump = new Animation();
var shelf;
var shelf_bkgd;
var logo_white = new Animation();
var logo_black = new Animation();

function assetsLoaded() {
	beetle.add(images.get('beetle0'), 0.3);
	beetle.add(images.get('beetle1'), 0.3);
	beetle.add(images.get('beetle2'), 0.3);
	beetle.add(images.get('beetle3'), 0.3);
	beetle.add(images.get('beetle4'), 0.3);
	beetle.add(images.get('beetle5'), 0.3);
	beetle.add(images.get('beetle6'), 0.3);

	beetle_black.add(images.get('beetle-black0'), 0.3);
	beetle_black.add(images.get('beetle-black1'), 0.3);
	beetle_black.add(images.get('beetle-black2'), 0.3);
	beetle_black.add(images.get('beetle-black3'), 0.3);
	beetle_black.add(images.get('beetle-black4'), 0.3);
	beetle_black.add(images.get('beetle-black5'), 0.3);
	beetle_black.add(images.get('beetle-black6'), 0.3);

	beetle_jump.add(images.get('beetle-jump0'), 0.5);
	beetle_jump.add(images.get('beetle-jump1'), 0.5);
	beetle_jump.add(images.get('beetle-jump2'), 0.5);
	beetle_jump.add(images.get('beetle-jump3'), 0.5);
	beetle_jump.add(images.get('beetle-jump4'), 0.5);
	beetle_jump.add(images.get('beetle-jump5'), 0.5);
	beetle_jump.add(images.get('beetle-jump6'), 0.5);
	beetle_jump.add(images.get('beetle-jump5'), 0.5);
	beetle_jump.repeatAt = 4;

	logo_white.add(images.get('logo-white0'), 1.0);
	logo_white.add(images.get('logo-white1'), 1.0);
	logo_white.add(images.get('logo-white2'), 1.0);
	logo_white.add(images.get('logo-white3'), 1.0);
	logo_white.add(images.get('logo-white4'), 1.0);
	logo_white.add(images.get('logo-white5'), 1.0);
	logo_white.add(images.get('logo-white6'), 1.0);
	logo_white.add(images.get('logo-white7'), 1.0);
	logo_white.add(images.get('logo-white8'), 1.0);
	logo_white.add(images.get('logo-white9'), 1.0);

	logo_black.add(images.get('logo-black0'), 1.0);
	logo_black.add(images.get('logo-black1'), 1.0);
	logo_black.add(images.get('logo-black2'), 1.0);
	logo_black.add(images.get('logo-black3'), 1.0);
	logo_black.add(images.get('logo-black4'), 1.0);
	logo_black.add(images.get('logo-black5'), 1.0);
	logo_black.add(images.get('logo-black6'), 1.0);
	logo_black.add(images.get('logo-black7'), 1.0);
	logo_black.add(images.get('logo-black8'), 1.0);
	logo_black.add(images.get('logo-black9'), 1.0);

	shelf = new ThreePatch(images.get('shelf'));
	shelf_bkgd = new ThreePatch(images.get('shelf background'));
	reset();
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

function make_shelf(x) {
	var y = (canvas.height / 4) + (Math.random() * (canvas.height / 2));
	var items = x == 0 ? get_shelf_items(6) : get_shelf_items();
	var width = get_shelf_width(items);

	var spacing = (shelf_bkgd.img.height - 1) * 3;
	var height = spacing + shelf.img.height - 1;
	var img = drawCanvas(width, height + 50, function(ctx) {
		var y = 0;
		for (var r = 0; r < 3; r++) {
			shelf_bkgd.draw(ctx, 0, y, width);
			y += shelf_bkgd.img.height - 1;
		}
		shelf.draw(ctx, 0, y, width);
		draw_shelf_items(ctx, items, 0, y);
	});
	return new AnimatedEntity(x, y, width, shelf_bkgd.img.height, img, 0, -spacing);
}

function delete_invisible_shelves(cameraX) {
	while (first_shelf_is_invisible()) {
		shelves.shift();
	}
}

function first_shelf_is_invisible(cameraX) {
	return shelves.length > 0 && shelves[0].x + shelves[0].width < cameraX;
}

function populate_shelves(cameraX) {
	while (need_shelves(cameraX)) {
		var x = 0;
		if (shelves.length > 0) {
			var last = shelves[shelves.length - 1];
			x = last.x + last.width + getRandomArbitrary(x + 150, x + 400);
		}

		var spacing = (shelf_bkgd.img.height - 1) * 3;
		var height = spacing + shelf.img.height - 1;

		var s2 = make_shelf(x);
		var s3 = s2.copy();
		s3.y += height;
		shelves.push(s3);

		shelves.push(s2);

		var s1 = s2.copy();
		s1.y -= height;
		shelves.push(s1);
	}
}

function need_shelves(cameraX) {
	return shelves.length == 0 || shelves[shelves.length - 1].x + shelves[shelves.length - 1].width < cameraX + canvas.width;
}

function move_shelves(elapsedSec) {
	for (var i in shelves) {
		shelves[i].move(elapsedSec);
	}
}

function reset() {
	shelves = [];
	distance = 0;
	game.cameraX = 0;
	populate_shelves(0);
	player = new AnimatedEntity(200, 50, 120, 40, beetle, -17, -27);
	player.x = 200;
	player.y = shelves[1].y - player.height;
	player.vx = 100;
	bgv = -30;
	bgx = 0;
}

function simulation(timeDiffMillis) {
	if (keys.consumePressed("m")) {
		sounds.muted = !sounds.muted;
	}
	if (mouse.buttons[0] && mouse.x >= canvas.width - 80 && mouse.x < canvas.width - 40 && mouse.y >= 40 && mouse.y < 80) {
		sounds.muted = !sounds.muted;
		mouse.buttons[0] = false;
	}
	if (keys.consumePressed("pause")) {
		if (state === "paused") {
			state = "running";
		} else if (state === "running") {
			state = "paused";
		}
	}
	if (state === "paused" || state === "start" || state === "dead") {
		if (keys.consumePressed("space") || mouse.buttons[0]) {
			if (state === "dead") {
				reset();
			}
			state = "running";
			mouse.buttons[0] = false;
		} else {
			return;
		}
	}
	var elapsedSec = timeDiffMillis / 100;

	distance += elapsedSec * player.vx;
	if (distance > max_distance) {
		max_distance = distance;
	}

	move_shelves(elapsedSec);

	if (keys.isPressed("left")) {
		player.x -= elapsedSec * 70;
	}
	if (keys.isPressed("right")) {
		player.x += elapsedSec * 70;
	}
	var gravityAccel = 50;
	player.vy += elapsedSec * gravityAccel;
	player.move(elapsedSec);
	game.cameraX = player.x - 200;

	var half_canvas_height = canvas.height / 2;
	var bounds_from_center = 100;
	if (player.y < game.cameraY + half_canvas_height - bounds_from_center) {
		game.cameraY = player.y - half_canvas_height + bounds_from_center;
	}
	if (player.y + player.height > game.cameraY + half_canvas_height + bounds_from_center) {
		game.cameraY = player.y + player.height - half_canvas_height - bounds_from_center;
	}

	delete_invisible_shelves(game.cameraX);
	populate_shelves(game.cameraX);

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
	if ((keys.isPressed("space") || mouse.buttons[0]) && onGround) {
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

function shadow_text(context, text, x, y) {
	context.fillStyle = "#000000";
	context.fillText(text, x + 3, y + 3);
	context.fillStyle = "#00cc00";
	context.fillText(text, x, y);
}

function draw(context) {
	var bg = images.get('bg');
	context.drawImage(bg, game.cameraX + bgx, game.cameraY);
	if (bgx + bg.width < canvas.width) {
		context.drawImage(bg, game.cameraX + bgx + bg.width, game.cameraY);
	}

	for (var i in shelves) {
		shelves[i].draw(context);
	}

	player.draw(context);

	if (sounds.muted) {
		context.fillStyle = "#ff0000";
	} else {
		context.fillStyle = "#0000ff";
	}
	context.fillRect(game.cameraX + canvas.width - 80, game.cameraY + 40, 40, 40);

	context.fillStyle = "#000000";
	context.font = "36px pixelade";
	var dist = Math.round(distance / player.width * 100) / 100;
	context.fillText(dist, game.cameraX + 20, game.cameraY + 40);
	dist = Math.round(max_distance / player.width * 100) / 100;
	context.fillText("Max: " + dist, game.cameraX + 300, game.cameraY + 40);

	if (game.fps < 30) {
		context.fillStyle = "#ff0000";
	} else if (game.fps < 50) {
		context.fillStyle = "#ffff00";
	} else {
		context.fillStyle = "#00ff00";
	}
	context.fillText(game.fps + " FPS", game.cameraX + 20, game.cameraY + 100);

	if (state != "running") {
		context.font = "100px pixelade";
		shadow_text(context, stateMessages[state], game.cameraX + 100, game.cameraY + 200);
	}
}
