var canvas = document.getElementById("game");

function setCanvasSize() {
	var ow = 1136;
	var oh = 640;

	var w = Math.min(window.innerWidth, ow);
	var h = Math.min(window.innerHeight, oh);
	canvas.style.width = w + "px";
	canvas.style.height = h + "px";

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
var startScreen = new Game(canvas, function(elapsedMillis) {
	if (starting) {
		startTime += elapsedMillis;
		if (!lightsOn && startTime > 807) {
			lightsOn = true;
			beetleBlack = new AnimatedEntity(0, 420, 0, 0, beetle_black, 0, 0);
			beetleBlack.vx = 1.40;
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
		sounds.play("lights-on");
	}
	move_shelves(elapsedMillis);
	if (beetleBlack) {
		beetleBlack.move(elapsedMillis);
	}
	delete_invisible_shelves(startScreen.camera.x);
	populate_shelves(startScreen.camera.x);

	bgx += elapsedMillis * -0.05;
	var bg = images.get("bg");
	if (bgx + bg.width < 0) {
		bgx += bg.width;
	}

	logo_white.move(elapsedMillis);
	logo_black.move(elapsedMillis);
}, function(context) {
	drawStage(startScreen, context);

	startScreen.camera.drawAbsolute(context, function() {
		var logo;
		if (lightsOn) {
			context.fillStyle = "rgba(255, 255, 255, 0.7)";
			logo = logo_black;
		} else {
			context.fillStyle = "rgba(0, 0, 0, 0.7)";
			logo = logo_white;
		}
		context.fillRect(0, 0, canvas.width, canvas.height);
		logo.draw(context, (canvas.width / 2) - (logo.width / 2), 0);

		if (lightsOn) {
			beetleBlack.draw(context);
		}
		if (!starting) {
			context.fillStyle = "#ffffff";
			context.font = "48px pixelade";
			centerText(context, clickOrTap() + " TO START", 0, 450);
		}
	});
});
startScreen.camera.vx = 0.2;
startScreen.camera.y = -800;

function clickOrTap() {
	if (mouse.supportsTouch()) {
		return "TAP";
	} else {
		return "CLICK";
	}
}

function centerText(context, text, offsetX, offsetY) {
	var w = context.measureText(text).width;
	var x = offsetX + (canvas.width / 2) - (w / 2) |0;
	var y = offsetY |0;
	context.fillText(text, x, y);
}

var ls = 36;
var lrate = 0.02;
var lmin = 36;
var lmax = 46;
var loading = new Game(canvas, function(elapsedMillis) {
	if (images.allLoaded() && sounds.allLoaded()) {
		assetsLoaded();
		loading.stop();
		startScreen.start();
		return;
	}
	ls += lrate * elapsedMillis;
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
	"start": clickOrTap() + " TO START",
	"paused": "PAUSED"
};
var gravityAccel = 0.005;
var jumpSpeed = -1.50;
var minJump = -0.3;

var bgv = -30;
var bgx = 0;

var images = new ImageLoader();
images.load("bg", "images/Scurry-bg-TEST2.png");
images.load("beetle", "images/scurry-run7f136x80.png", 7);
images.load("beetle-black", "images/scurry-run7f45x26.png", 7);
images.load("beetle-jump", "images/scurry-jump-sprite-7f129x124.png", 7);
images.load("shelf", "images/shelf.png");
images.load("shelf background", "images/shelf-bars-spritesheet.png");
images.load("box1", "images/box1.png");
images.load("box2", "images/box2.png");
images.load("box3", "images/box3.png");
images.load("can1", "images/can1.png");
images.load("can2", "images/can2.png");
images.load("syrup", "images/syrup.png");
images.load("tag1", "images/price-tag1.png");
images.load("tag2", "images/price-tag2.png");
images.load("tag3", "images/price-tag-sale.png");
images.load("logo-white", "images/scurry-logo-white-10f686x399.png", 10);
images.load("logo-black", "images/scurry-logo-black-10f686x399.png", 10);
images.load("sound-off", "images/sound-off-icon.png");
images.load("sound-on", "images/sound-on-icon.png");
images.load("play", "images/play-icon.png");
images.load("pause", "images/pause-icon.png");

var sounds = new SoundLoader();
sounds.load("jump", "audio/jump.wav");
sounds.load("land", "audio/land.wav");
sounds.load("death", "audio/death.wav");
sounds.load("lights-on", "audio/lights-on.wav");

var beetle = new Animation();
var beetle_black = new Animation();
var beetle_jump = new Animation();
var shelf;
var shelf_bkgd;
var logo_white = new Animation();
var logo_black = new Animation();
var soundToggle;
var pauseToggle;

function assetsLoaded() {
	beetle.add(images.get("beetle0"), 30);
	beetle.add(images.get("beetle1"), 30);
	beetle.add(images.get("beetle2"), 30);
	beetle.add(images.get("beetle3"), 30);
	beetle.add(images.get("beetle4"), 30);
	beetle.add(images.get("beetle5"), 30);
	beetle.add(images.get("beetle6"), 30);

	beetle_black.add(images.get("beetle-black0"), 30);
	beetle_black.add(images.get("beetle-black1"), 30);
	beetle_black.add(images.get("beetle-black2"), 30);
	beetle_black.add(images.get("beetle-black3"), 30);
	beetle_black.add(images.get("beetle-black4"), 30);
	beetle_black.add(images.get("beetle-black5"), 30);
	beetle_black.add(images.get("beetle-black6"), 30);

	beetle_jump.add(images.get("beetle-jump0"), 50);
	beetle_jump.add(images.get("beetle-jump1"), 50);
	beetle_jump.add(images.get("beetle-jump2"), 50);
	beetle_jump.add(images.get("beetle-jump3"), 50);
	beetle_jump.add(images.get("beetle-jump4"), 50);
	beetle_jump.add(images.get("beetle-jump5"), 50);
	beetle_jump.add(images.get("beetle-jump6"), 50);
	beetle_jump.add(images.get("beetle-jump5"), 50);
	beetle_jump.repeatAt = 4;

	logo_white.add(images.get("logo-white0"), 100);
	logo_white.add(images.get("logo-white1"), 100);
	logo_white.add(images.get("logo-white2"), 100);
	logo_white.add(images.get("logo-white3"), 100);
	logo_white.add(images.get("logo-white4"), 100);
	logo_white.add(images.get("logo-white5"), 100);
	logo_white.add(images.get("logo-white6"), 100);
	logo_white.add(images.get("logo-white7"), 100);
	logo_white.add(images.get("logo-white8"), 100);
	logo_white.add(images.get("logo-white9"), 100);

	logo_black.add(images.get("logo-black0"), 100);
	logo_black.add(images.get("logo-black1"), 100);
	logo_black.add(images.get("logo-black2"), 100);
	logo_black.add(images.get("logo-black3"), 100);
	logo_black.add(images.get("logo-black4"), 100);
	logo_black.add(images.get("logo-black5"), 100);
	logo_black.add(images.get("logo-black6"), 100);
	logo_black.add(images.get("logo-black7"), 100);
	logo_black.add(images.get("logo-black8"), 100);
	logo_black.add(images.get("logo-black9"), 100);

	shelf = new NinePatch(images.get("shelf"));
	shelf_bkgd = new NinePatch(images.get("shelf background"));

	pauseToggle = new ToggleButton(canvas.width - 84, 12, 72, 72, images.get("play"), images.get("pause"), "pause", function(toggled) {
		if (state === "dead") {
			return false;
		}
		if (toggled) {
			state = "paused";
		} else {
			state = "running";
		}
	});
	soundToggle = new ToggleButton(canvas.width - 84, 108, 72, 72, images.get("sound-on"), images.get("sound-off"), "m", function(toggled) {
		sounds.muted = !toggled;
	});

	reset();
}

var shelf_item_spacing = 30;

var shelf_items = ["empty", "box1", "box2", "box3", "can1", "can2", "syrup"];
var shelf_tags = ["tag1", "tag2", "tag3"];
var same_item_chance = 0.50;

function rand_price() {
	var price = (((Math.random() * 95) |0) + 5) * 10 + 9;
	price = "" + price;
	if (price.length == 2) {
		return "." + price;
	}
	return price[0] + "." + price.substr(1);
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
		if (item.item != "empty") {
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
		if (item == "empty") {
			item = "box1";
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
	if (item.tag == "tag3") {
		context.fillStyle = "#ff0000";
	} else {
		context.fillStyle = "#333333";
	}
	context.font = "36px pixelade";
	context.fillText(price, tagx + 70, tagy + 65);
}
function draw_shelf_item(context, item,	x, y) {
	if (item.item == "empty") {
		return images.get("box1").width;
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

function make_shelf(x) {
	var y = -((canvas.height / 4) + (Math.random() * (canvas.height / 2)));
	var items = x == 0 ? get_shelf_items(6) : get_shelf_items();
	var width = get_shelf_width(items);

	var spacing = (shelf_bkgd.img.height - 1) * 3;
	var height = spacing + shelf.img.height - 1;
	var img = drawCanvas(width, height + 50, function(ctx) {
		var bkgdh = (shelf_bkgd.img.height - 1) * 3;
		shelf_bkgd.draw(ctx, 0, 0, width, bkgdh);
		shelf.draw(ctx, 0, bkgdh, width, shelf.img.height - 1);
		draw_shelf_items(ctx, items, 0, bkgdh);
	});
	return new AnimatedEntity(x, y, width, shelf_bkgd.img.height, img, 0, -spacing);
}

function delete_invisible_shelves(cameraX) {
	while (first_shelf_is_invisible(cameraX)) {
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

		var template = make_shelf(x);

		var bottom = new Entity(x, template.y + template.height, template.width, -(template.y + template.height));
		bottom.draw = function(ctx) {
			shelf_bkgd.draw(ctx, this.x, this.y, this.width, this.height);
		};
		bottom.collides = function(other) {
			return false;
		};
		shelves.push(bottom);

		for (var n = 0; n < 3; n++) {
			var s = template.copy();
			shelves.push(s);
			template.y -= height;
		}
	}
}

function need_shelves(cameraX) {
	return shelves.length == 0 || shelves[shelves.length - 1].x + shelves[shelves.length - 1].width < cameraX + canvas.width;
}

function move_shelves(elapsedMillis) {
	for (var i in shelves) {
		shelves[i].move(elapsedMillis);
	}
}

var deadTime = 0;
function reset() {
	shelves = [];
	distance = 0;
	populate_shelves(0);
	player = new AnimatedEntity(200, 50, 120, 40, beetle, -17, -27);
	player.x = 200;
	player.y = shelves[2].y - player.height;
	player.vx = 1;
	bgv = -0.3;
	bgx = 0;
	game.camera = new EntityBoxCamera(player, player.width, 200, 200, canvas.height / 2);
	deadTime = 0;
	pauseToggle.toggled = true;
}

function simulation(elapsedMillis) {
	soundToggle.move(elapsedMillis);
	pauseToggle.move(elapsedMillis);

	if (state === "dead") {
		deadTime += elapsedMillis;
		if (deadTime > 1000) {
			state = "start";
			reset();
		}
		return;
	}
	if (state === "paused" || state === "start") {
		if (keys.consumePressed("space") || mouse.buttons[0]) {
			state = "running";
			mouse.buttons[0] = false;
			pauseToggle.toggled = false;
		} else {
			return;
		}
	}

	distance = player.x;
	if (distance > max_distance) {
		max_distance = distance;
	}

	move_shelves(elapsedMillis);

	if (keys.isPressed("left")) {
		player.x -= elapsedMillis * 0.70;
	}
	if (keys.isPressed("right")) {
		player.x += elapsedMillis * 0.70;
	}

	player.vy += elapsedMillis * gravityAccel;
	player.move(elapsedMillis);

	delete_invisible_shelves(game.camera.x);
	populate_shelves(game.camera.x);

	if (player.y > -player.height) {
		state = "dead";
		sounds.play("death");
		return;
	}

	var onGround = false;
	for (var i in shelves) {
		var shelf = shelves[i];
		if (shelf.collides(player)) {
			if (player.didOverlapHoriz(shelf) && player.wasAbove(shelf)) {
				player.y = shelf.y - player.height - 0.01;
				player.vy = 0;
				onGround = true;
			}
		}
	}

	if (onGround && player.sprite == beetle_jump) {
		player.sprite = beetle;
		beetle.reset();
		sounds.play("land");
	}
	if (!onGround && player.sprite == beetle) {
		player.sprite = beetle_jump;
		beetle_jump.reset();
	}
	if ((keys.isPressed("space") || mouse.buttons[0]) && onGround) {
		player.vy = jumpSpeed;
		player.sprite = beetle_jump;
		beetle_jump.reset();
		sounds.play("jump");
	}
	if ((!keys.isPressed("space") && !mouse.buttons[0]) && player.vy < minJump) {
		player.vy = minJump;
	}

	bgx += elapsedMillis * bgv;
	var bg = images.get("bg");
	if (bgx + bg.width < 0) {
		bgx += bg.width;
	}
}

function drawStage(game, context) {
	var bg = images.get("bg");

	game.camera.drawAbsolute(context, function() {
		var x = bgx|0;
		context.drawImage(bg, x, 0);
		if (x + bg.width < canvas.width) {
			context.drawImage(bg, x + bg.width, 0);
		}
	});

	for (var i in shelves) {
		shelves[i].draw(context);
	}

	// draw the insta-death floor
	if (game.camera.y > -canvas.height) {
		context.fillStyle = "#000000";
		context.fillRect(game.camera.x|0, 0, canvas.width, canvas.height + game.camera.y + 1|0);
	}
}

function ToggleButton(x, y, width, height, onIcon, offIcon, key, onToggle) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.onIcon = onIcon;
	this.offIcon = offIcon;
	this.key = key;
	this.toggled = true;
	this.onToggle = onToggle;
}
ToggleButton.prototype.move = function(elapsedMillis) {
	if (mouse.buttons[0] && mouse.x >= this.x && mouse.x < this.x + this.width && mouse.y >= this.y && mouse.y < this.y + this.height) {
		mouse.buttons[0] = false;
		this.toggle();
	}
	if (keys.consumePressed(this.key)) {
		this.toggle();
	}
};
ToggleButton.prototype.draw = function(context) {
	var icon = this.offIcon;
	if (this.toggled) {
		icon = this.onIcon;
	}
	context.drawImage(icon, this.x, this.y);
};
ToggleButton.prototype.toggle = function() {
	if (this.onToggle(!this.toggled) !== false) {
		this.toggled = !this.toggled;
	}
};

function draw(context) {
	drawStage(game, context);
	player.draw(context);

	game.camera.drawAbsolute(context, function() {
		soundToggle.draw(context);
		pauseToggle.draw(context);

		context.fillStyle = "#000000";
		context.font = "36px pixelade";
		var dist = Math.round(distance / player.width * 100) / 100;
		context.fillText(dist, 20, 40);
		dist = Math.round(max_distance / player.width * 100) / 100;
		context.fillText("Max: " + dist, 300, 40);

		if (stateMessages[state]) {
			context.fillStyle = "rgba(0, 0, 0, 0.7)";
			context.fillRect(0, 400, canvas.width, 70);
			context.fillStyle = "#ffffff";
			context.font = "48px pixelade";
			centerText(context, stateMessages[state], 0, 450);
		}
	});
}
