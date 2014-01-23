var canvas = document.getElementById("game");

var manifest = {
	"images": {
		"bg": "images/Scurry-bg-TEST2.png",
		"beetle": "images/scurry-run7f136x80.png",
		"beetle-black": "images/scurry-run7f45x26.png",
		"beetle-jump": "images/scurry-jump-sprite-7f129x124.png",
		"beetle-dead": "images/scurry-dead-1f132x72.png",
		"shelf": "images/shelf.png",
		"shelf background": "images/shelf-bars-spritesheet.png",
		"box1": "images/box1.png",
		"box2": "images/box2.png",
		"box3": "images/box3.png",
		"can1": "images/can1.png",
		"can2": "images/can2.png",
		"syrup": "images/syrup.png",
		"tag1": "images/price-tag1.png",
		"tag2": "images/price-tag2.png",
		"tag3": "images/price-tag-sale.png",
		"logo-white": "images/scurry-logo-white-10f686x399.png",
		"logo-black": "images/scurry-logo-black-10f686x399.png",
		"sound-off": "images/sound-off-icon.png",
		"sound-on": "images/sound-on-icon.png",
		"play": "images/play-icon.png",
		"pause": "images/pause-icon.png",
	},
	"sounds": {
		"jump": "audio/jump.wav",
		"land": "audio/land.wav",
		"death": "audio/death.wav",
		"lights-on": "audio/lights-on.wav",
	},
	"fonts": [
		"pixelade"
	]
};
var scurry = new Splat.Game(canvas, manifest);

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
window.addEventListener("resize", setCanvasSize);
setCanvasSize();

var game = new Splat.Scene(canvas, simulation, draw);

var starting = false;
var lightsOn = false;
var beetleBlack;
var startScreen = new Splat.Scene(canvas, function(elapsedMillis) {
	if (!lightsOn && startScreen.timer("start") > 807) {
		lightsOn = true;
		beetleBlack = new Splat.AnimatedEntity(0, 420, 0, 0, beetle_black, 0, 0);
		beetleBlack.vx = 1.40;
	}
	if (startScreen.timer("start") > 2300) {
		startScreen.stop();
		reset();
		game.start();
		return;
	}
	if (!starting && (scurry.keyboard.consumePressed("space") || scurry.mouse.buttons[0])) {
		starting = true;
		startScreen.startTimer("start");
		scurry.mouse.buttons[0] = false;
		scurry.sounds.play("lights-on");
	}
	move_shelves(elapsedMillis);
	if (beetleBlack) {
		beetleBlack.move(elapsedMillis);
	}
	delete_invisible_shelves(startScreen.camera.x);
	populate_shelves(startScreen.camera.x);

	bgx += elapsedMillis * -0.05;
	var bg = scurry.images.get("bg");
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
	if (scurry.mouse.supportsTouch()) {
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
var loading = new Splat.Scene(canvas, function(elapsedMillis) {
	if (scurry.isLoaded()) {
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
var powerUps = [];
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

var beetle = new Splat.Animation();
var beetle_black = new Splat.Animation();
var beetle_jump = new Splat.Animation();
var shelf;
var shelf_bkgd;
var logo_white = new Splat.Animation();
var logo_black = new Splat.Animation();
var soundToggle;
var pauseToggle;

function assetsLoaded() {
	beetle = Splat.makeAnimation(scurry.images.get("beetle"), 7, 30);
	beetle_black = Splat.makeAnimation(scurry.images.get("beetle-black"), 7, 30);

	beetle_jump = Splat.makeAnimation(scurry.images.get("beetle-jump"), 7, 50);
	beetle_jump.repeatAt = 4;

	logo_white = Splat.makeAnimation(scurry.images.get("logo-white"), 10, 100);
	logo_black = Splat.makeAnimation(scurry.images.get("logo-black"), 10, 100);

	shelf = new Splat.NinePatch(scurry.images.get("shelf"));
	shelf_bkgd = new Splat.NinePatch(scurry.images.get("shelf background"));

	pauseToggle = new ToggleButton(0, 12, 72, 72, scurry.images.get("play"), scurry.images.get("pause"), "escape", function(toggled) {
		if (state === "dead") {
			return false;
		}
		if (toggled) {
			state = "paused";
		} else {
			state = "running";
		}
	});
	pauseToggle.attachToRight(canvas, 12);

	soundToggle = new ToggleButton(0, 108, 72, 72, scurry.images.get("sound-on"), scurry.images.get("sound-off"), "m", function(toggled) {
		scurry.sounds.muted = !toggled;
	});
	soundToggle.attachToRight(canvas, 12);

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
function getShelfItems(width) {
	var items = [];
	var possible_items = shelf_items.slice(0);
	function getItemWidth(item) {
		var name = item.item;
		if (name == "empty") {
			name = "box1";
		}
		var img = scurry.images.get(name);
		var tag = scurry.images.get(item.tag);
		if (tag.width > img.width) {
			return tag.width;
		} else {
			return img.width;
		}
	}
	function makeItem(item) {
		var tag = (Math.random() * shelf_tags.length) |0;
		return {
			item: item,
			tag: shelf_tags[tag],
			price: rand_price()
		};
	}
	var i, w;
	while (width > 0 && possible_items.length > 0) {
		if (items.length > 0 && Math.random() < same_item_chance) {
			i = items[items.length - 1];
			w = getItemWidth(i);
			if (w < width) {
				width -= w + shelf_item_spacing;
				items.push(i);
				continue;
			}
		}
		while (possible_items.length > 0) {
			var	n = (Math.random() * possible_items.length) |0;
			i = possible_items[n];
			possible_items.splice(n, 1);
			var item = makeItem(i);
			w = getItemWidth(item);
			if (w > width) {
				continue;
			}
			items.push(item);
			width -= w + shelf_item_spacing;
			break;
		}
	}
	return items;
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
function draw_shelf_item(context, item, x, y) {
	if (item.item == "empty") {
		return scurry.images.get("box1").width;
	}
	var img = scurry.images.get(item.item);
	context.drawImage(img, x, y - img.height);

	var tag = scurry.images.get(item.tag);
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

function make_shelf(x, width, drawBackground) {
	var y = -((canvas.height / 4) + (Math.random() * (canvas.height / 2)));
	var items = getShelfItems(width - shelf.w1 - shelf.w3);

	var spacing = (shelf_bkgd.img.height - 1) * 3;
	var height = spacing + shelf.img.height - 1;
	var img = Splat.makeBuffer(width, height + 50, function(ctx) {
		var bkgdh = (shelf_bkgd.img.height - 1) * 3;
		if (drawBackground) {
			shelf_bkgd.draw(ctx, 0, 0, width, bkgdh);
		}
		shelf.draw(ctx, 0, bkgdh, width, shelf.img.height - 1);
		draw_shelf_items(ctx, items, 0, bkgdh);
	});
	return new Splat.AnimatedEntity(x, y, width, shelf_bkgd.img.height, img, 0, -spacing);
}

function delete_invisible_shelves(cameraX) {
	while (firstEntityIsInvisible(shelves, cameraX)) {
		shelves.shift();
	}
	while (firstEntityIsInvisible(powerUps, cameraX)) {
		powerUps.shift();
	}
}

function firstEntityIsInvisible(entities, cameraX) {
	return entities.length > 0 && entities[0].x + entities[0].width < cameraX;
}

function getNextShelfX() {
	if (shelves.length > 0) {
		var last = shelves[shelves.length - 1];
		return last.x + last.width + getRandomArbitrary(150, 400);
	}
	return 0;
}

function makeShelfBottom(template) {
	var bottom = new Splat.Entity(template.x, template.y + template.height, template.width, -(template.y + template.height));
	bottom.draw = function(ctx) {
		shelf_bkgd.draw(ctx, this.x, this.y, this.width, this.height);
	};
	bottom.collides = function(other) {
		return false;
	};
	return bottom;
}

function populate_shelves(cameraX) {
	while (need_shelves(cameraX)) {
		var x = getNextShelfX();
		var width = x === 0 ? 600 : getRandomArbitrary(400, 1000) |0;

		var spacing = (shelf_bkgd.img.height - 1) * 3;
		var height = spacing + shelf.img.height - 1;

		var s = make_shelf(x, width, true);

		shelves.push(makeShelfBottom(s));
		shelves.push(s);
		var y = s.y - height;

		var shelvesInRack = 3 + (Math.random() * 3) |0;
		for (var n = 0; n < shelvesInRack; n++) {
			s = make_shelf(x, width, n < shelvesInRack -1);
			s.y = y;
			shelves.push(s);
			if (Math.random() < 0.3) {
				powerUps.push(makePowerUp(s.x + (s.width / 2) - 25, s.y - 100));
			}
			y -= height;
		}
	}
}

var possiblePowerUps = [
	{ "name": "superjump", "color": "#ff0000" },
	{ "name": "superspeed", "color": "#00ff00" },
];
function makePowerUp(x, y) {
	var e = new Splat.Entity(x, y, 50, 50);
	e.elapsedSec = 0;

	var pnum = Math.random() * possiblePowerUps.length |0;
	console.log(pnum);
	var p = possiblePowerUps[pnum];
	e.name = p.name;

	e.move = function(elapsedSec) {
		this.elapsedSec += elapsedSec;
		this.y = y + Math.sin(this.elapsedSec / 1000.0 * Math.PI) * 20 |0;
	};
	e.draw = function(context) {
		context.fillStyle = p.color;
		context.fillRect(this.x, this.y, this.width, this.height);
	};
	return e;
}

function need_shelves(cameraX) {
	return shelves.length === 0 || shelves[shelves.length - 1].x + shelves[shelves.length - 1].width < cameraX + canvas.width;
}

function move_shelves(elapsedMillis) {
	for (var i in shelves) {
		shelves[i].move(elapsedMillis);
	}
	for (var i in powerUps) {
		powerUps[i].move(elapsedMillis);
	}
}

function reset() {
	shelves = [];
	powerUps = [];
	distance = 0;
	populate_shelves(0);
	player = new Splat.AnimatedEntity(200, 50, 120, 40, beetle, -17, -27);
	player.x = 200;
	player.y = shelves[2].y - player.height;
	player.vx = 1;
	bgv = -0.3;
	bgx = 0;
	game.camera = new Splat.EntityBoxCamera(player, player.width, 200, 200, canvas.height / 2);
	game.clearTimers();
	pauseToggle.toggled = true;
}

function simulation(elapsedMillis) {
	soundToggle.move(elapsedMillis);
	pauseToggle.move(elapsedMillis);

	if (game.timer("superjump") > 5000) {
		game.stopTimer("superjump");
	}
	if (game.timer("superspeed") > 5000) {
		game.stopTimer("superspeed");
	}
	if (state === "dead") {
		if (game.timer("dead") > 300) {
			player.sprite = scurry.images.get("beetle-dead");
		}
		if (game.timer("dead") > 1000) {
			state = "start";
			reset();
		}
		return;
	}
	if (state === "paused" || state === "start") {
		if (scurry.keyboard.consumePressed("space") || scurry.mouse.buttons[0]) {
			state = "running";
			scurry.mouse.buttons[0] = false;
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

	if (scurry.keyboard.isPressed("left")) {
		player.x -= elapsedMillis * 0.70;
	}
	if (game.timer("superspeed") > 0) {
		player.x += elapsedMillis * 0.70;
	}
	if (scurry.keyboard.isPressed("right")) {
		player.x += elapsedMillis * 0.70;
	}

	player.vy += elapsedMillis * gravityAccel;
	player.move(elapsedMillis);

	delete_invisible_shelves(game.camera.x);
	populate_shelves(game.camera.x);

	if (player.y > -player.height) {
		state = "dead";
		scurry.sounds.play("death");
		game.startTimer("dead");
		return;
	}

	for (var i in powerUps) {
		var powerUp = powerUps[i];
		if (powerUp.collides(player)) {
			powerUps.splice(i, 1);
			game.startTimer(powerUp.name);
		}
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
		scurry.sounds.play("land");
	}
	if (!onGround && player.sprite == beetle) {
		player.sprite = beetle_jump;
		beetle_jump.reset();
	}
	if ((scurry.keyboard.isPressed("space") || scurry.mouse.buttons[0]) && onGround) {
		player.vy = jumpSpeed;
		if (game.timer("superjump") > 0) {
			player.vy += -1;
		}
		if (scurry.keyboard.isPressed("up")) {
			player.vy += -1;
		}

		player.sprite = beetle_jump;
		beetle_jump.reset();
		scurry.sounds.play("jump");
	}
	if ((!scurry.keyboard.isPressed("space") && !scurry.mouse.buttons[0]) && player.vy < minJump) {
		player.vy = minJump;
	}

	bgx += elapsedMillis * bgv;
	var bg = scurry.images.get("bg");
	if (bgx + bg.width < 0) {
		bgx += bg.width;
	}
}

function drawStage(scene, context) {
	var bg = scurry.images.get("bg");

	scene.camera.drawAbsolute(context, function() {
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
	if (scene.camera.y > -canvas.height) {
		context.fillStyle = "#000000";
		context.fillRect(scene.camera.x|0, 0, canvas.width, canvas.height + scene.camera.y + 1|0);
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
	if (scurry.mouse.buttons[0] && scurry.mouse.x >= this.x && scurry.mouse.x < this.x + this.width && scurry.mouse.y >= this.y && scurry.mouse.y < this.y + this.height) {
		scurry.mouse.buttons[0] = false;
		this.toggle();
	}
	if (scurry.keyboard.consumePressed(this.key)) {
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
ToggleButton.prototype.attachToRight = function(canvas, xOffset) {
	var that = this;
	var adjustX = function() {
		that.x = canvas.width - that.width - xOffset;
	};
	adjustX();
	window.addEventListener("resize", adjustX);
};

function draw(context) {
	drawStage(game, context);
	for (var i in powerUps) {
		powerUps[i].draw(context);
	}
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

		if (game.timer("superspeed") > 0) {
			context.fillStyle = "#00ff00";
			context.font = "48px pixelade";
			centerText(context, "SUPERSPEED!", 0, canvas.height - 70);
		}
		if (game.timer("superjump") > 0) {
			context.fillStyle = "#ff0000";
			context.font = "48px pixelade";
			centerText(context, "SUPERJUMP!", 0, canvas.height - 50);
		}

		if (stateMessages[state]) {
			context.fillStyle = "rgba(0, 0, 0, 0.7)";
			context.fillRect(0, 400, canvas.width, 70);
			context.fillStyle = "#ffffff";
			context.font = "48px pixelade";
			centerText(context, stateMessages[state], 0, 450);
		}
	});
}
