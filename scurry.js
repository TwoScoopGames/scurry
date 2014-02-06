var canvas = document.getElementById("game");

var manifest = {
	"images": {
		"bg": "images/Scurry-bg-TEST2.png",
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
		"sound-off": "images/sound-off-icon.png",
		"sound-on": "images/sound-on-icon.png",
		"play": "images/play-icon.png",
		"pause": "images/pause-icon.png",
		"progress-marker": "images/scurry-head.png",
		"progress": "images/scurry-progress.png",
		"hotel-front": "images/hotel-front.png",
		"hotel-back": "images/hotel-bg.png",
	},
	"sounds": {
		"jump": "audio/jump.wav",
		"superjump": "audio/superjump.wav",
		"land": "audio/land.wav",
		"death": "audio/death.wav",
		"lights-on": "audio/lights-on.wav",
		"powerup-jump": "audio/powerup-jump.wav",
		"powerup-speed": "audio/powerup-speed.wav",
		"crumble": "audio/crumble.wav"
	},
	"fonts": [
		"pixelade"
	],
	"animations": {
		"beetle": {
			"strip": "images/scurry-run7f136x80.png",
			"frames": 7,
			"msPerFrame": 30
		},
		"beetle-black": {
			"strip": "images/scurry-run7f45x26.png",
			"frames": 7,
			"msPerFrame": 30
		},
		"beetle-jump": {
			"strip": "images/scurry-jump-sprite-7f129x124.png",
			"frames": 7,
			"msPerFrame": 50,
			"repeatAt": 4
		},
		"logo-white": {
			"strip": "images/scurry-logo-white-10f686x399.png",
			"frames": 10,
			"msPerFrame": 100
		},
		"logo-black": {
			"strip": "images/scurry-logo-black-10f686x399.png",
			"frames": 10,
			"msPerFrame": 100
		},
		"sugar-cube": {
			"strip": "images/sugar-cube-19f.png",
			"frames": 19,
			"msPerFrame": 200
		},
		"skeleton": {
			"strip": "images/skelerun-spritesheet.png",
			"frames": 8,
			"msPerFrame": 30
		},
		"skeleton-crumble": {
			"strip": "images/skelecrumble.png",
			"frames": 15,
			"msPerFrame": 60,
			"repeatAt": 14
		},
	}
};
var scurry = new Splat.Game(canvas, manifest);

var starting = false;
var lightsOn = false;
var beetleBlack;
scurry.scenes.add("title", new Splat.Scene(canvas, function() {
	assetsLoaded();
	this.camera.vx = 0.2;
	this.camera.y = -800;
},
function(elapsedMillis) {
	if (!lightsOn && this.timer("start") > 807) {
		lightsOn = true;
		beetleBlack = new Splat.AnimatedEntity(0, 420, 0, 0, scurry.animations.get("beetle-black"), 0, 0);
		beetleBlack.vx = 1.40;
	}
	if (this.timer("start") > 2300) {
		scurry.scenes.switchTo("level-1");
		return;
	}
	if (!starting && (scurry.keyboard.consumePressed("space") || scurry.mouse.buttons[0])) {
		starting = true;
		this.startTimer("start");
		scurry.mouse.buttons[0] = false;
		scurry.sounds.play("lights-on");
	}
	moveShelves(elapsedMillis);
	if (beetleBlack) {
		beetleBlack.move(elapsedMillis);
	}
	deleteInvisibleShelves(this.camera.x);
	populateShelves(this.camera.x);

	bgx += elapsedMillis * -0.05;
	var bg = scurry.images.get("bg");
	if (bgx + bg.width < 0) {
		bgx += bg.width;
	}

	scurry.animations.get("logo-white").move(elapsedMillis);
	scurry.animations.get("logo-black").move(elapsedMillis);
}, function(context) {
	drawStage(this, context);

	this.camera.drawAbsolute(context, function() {
		var logo;
		if (lightsOn) {
			context.fillStyle = "rgba(255, 255, 255, 0.7)";
			logo = scurry.animations.get("logo-black");
		} else {
			context.fillStyle = "rgba(0, 0, 0, 0.7)";
			logo = scurry.animations.get("logo-white");
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
}));

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


function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

var player = {};
var shelves = [];
var powerUps = [];
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

var shelf;
var shelfBkgd;
var soundToggle;
var pauseToggle;
var possiblePowerUps;

function assetsLoaded() {
	var sugarCube = scurry.animations.get("sugar-cube");

	possiblePowerUps = [
		{ "name": "superjump", "animation": sugarCube, "sound": "powerup-jump" },
		{ "name": "superspeed", "animation": sugarCube, "sound": "powerup-speed" },
		{ "name": "roach motel", "animation": scurry.images.get("hotel-back") }
	];

	shelf = new Splat.NinePatch(scurry.images.get("shelf"));
	shelfBkgd = new Splat.NinePatch(scurry.images.get("shelf background"));

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
}

var shelfItemSpacing = 30;

var shelfItems = ["empty", "box1", "box2", "box3", "can1", "can2", "syrup"];
var shelfTags = ["tag1", "tag2", "tag3"];
var sameItemChance = 0.50;

function randPrice() {
	var price = (((Math.random() * 95) |0) + 5) * 10 + 9;
	price = "" + price;
	if (price.length == 2) {
		return "." + price;
	}
	return price[0] + "." + price.substr(1);
}
function getShelfItems(width) {
	var items = [];
	var possibleItems = shelfItems.slice(0);
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
		var tag = (Math.random() * shelfTags.length) |0;
		return {
			item: item,
			tag: shelfTags[tag],
			price: randPrice()
		};
	}
	var i, w;
	while (width > 0 && possibleItems.length > 0) {
		if (items.length > 0 && Math.random() < sameItemChance) {
			i = items[items.length - 1];
			w = getItemWidth(i);
			if (w < width) {
				width -= w + shelfItemSpacing;
				items.push(i);
				continue;
			}
		}
		while (possibleItems.length > 0) {
			var	n = (Math.random() * possibleItems.length) |0;
			i = possibleItems[n];
			possibleItems.splice(n, 1);
			var item = makeItem(i);
			w = getItemWidth(item);
			if (w > width) {
				continue;
			}
			items.push(item);
			width -= w + shelfItemSpacing;
			break;
		}
	}
	return items;
}
function drawTagPrice(context, item, tagx, tagy) {
	var price = item.price;
	if (item.tag == "tag3") {
		context.fillStyle = "#ff0000";
	} else {
		context.fillStyle = "#333333";
	}
	context.font = "36px pixelade";
	context.fillText(price, tagx + 70, tagy + 65);
}
function drawShelfItem(context, item, x, y) {
	if (item.item == "empty") {
		return scurry.images.get("box1").width;
	}
	var img = scurry.images.get(item.item);
	context.drawImage(img, x, y - img.height);

	var tag = scurry.images.get(item.tag);
	var tagx = x + ((img.width - tag.width) / 2);
	var tagy = y + 10;
	context.drawImage(tag, tagx, tagy);
	drawTagPrice(context, item, tagx, tagy);

	if (tag.width > img.width) {
		return tag.width;
	} else {
		return img.width;
	}
}
function drawShelfItems(context, items, x, y) {
	x += shelf.w1;
	y += 5;
	for (var i = 0; i < items.length; i++) {
		if (i > 0) {
			x += shelfItemSpacing;
		}

		var item = items[i];
		var width = drawShelfItem(context, item, x, y);
		x += width;
	}
}

function makeShelf(x, width, drawBackground) {
	var y = -((canvas.height / 4) + (Math.random() * (canvas.height / 2)));
	var items = getShelfItems(width - shelf.w1 - shelf.w3);

	var spacing = (shelfBkgd.img.height - 1) * 3;
	var height = spacing + shelf.img.height - 1;
	var img = Splat.makeBuffer(width, height + 50, function(ctx) {
		var bkgdh = (shelfBkgd.img.height - 1) * 3;
		if (drawBackground) {
			shelfBkgd.draw(ctx, 0, 0, width, bkgdh);
		}
		shelf.draw(ctx, 0, bkgdh, width, shelf.img.height - 1);
		drawShelfItems(ctx, items, 0, bkgdh);
	});
	return new Splat.AnimatedEntity(x, y, width, shelfBkgd.img.height, img, 0, -spacing);
}

function deleteInvisibleShelves(cameraX) {
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
		shelfBkgd.draw(ctx, this.x, this.y, this.width, this.height);
	};
	bottom.collides = function(other) {
		return false;
	};
	return bottom;
}

function populateShelves(cameraX) {
	while (needShelves(cameraX)) {
		var x = getNextShelfX();
		var width = x === 0 ? 600 : getRandomArbitrary(400, 1000) |0;

		var spacing = (shelfBkgd.img.height - 1) * 3;
		var height = spacing + shelf.img.height - 1;

		var shelvesInRack = 4 + (Math.random() * 3) |0;
		for (var n = 0; n < shelvesInRack; n++) {
			var s = makeShelf(x, width, n < shelvesInRack -1);
			if (n === 0) {
				shelves.push(makeShelfBottom(s));
				y = s.y - height;
			} else {
				s.y = y;
				y -= height;
			}
			shelves.push(s);
			if (Math.random() < 0.3) {
				powerUps.push(makePowerUp(s.x + (s.width / 2) - 25, s.y - 100));
			}
		}
	}
}

function makePowerUp(x, y) {
	var pnum = Math.random() * possiblePowerUps.length |0;
	var p = possiblePowerUps[pnum];

	var a = new Splat.AnimatedEntity(x - (p.animation.width / 2), y, p.animation.width, p.animation.height, p.animation, 0, 0);
	a.name = p.name;
	a.sound = p.sound;
	if (p.name != "roach motel") {
		a.elapsedSec = 0;
		a.move = function(elapsedSec) {
			this.elapsedSec += elapsedSec;
			this.y = y + Math.sin(this.elapsedSec / 1000.0 * Math.PI) * 20 |0;
			Splat.AnimatedEntity.prototype.move.call(this, elapsedSec);
		};
	}
	return a;
}

function needShelves(cameraX) {
	return shelves.length === 0 || shelves[shelves.length - 1].x + shelves[shelves.length - 1].width < cameraX + canvas.width;
}

function moveShelves(elapsedMillis) {
	for (var i in shelves) {
		shelves[i].move(elapsedMillis);
	}
	for (i in powerUps) {
		powerUps[i].move(elapsedMillis);
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

function drawProgress(context, dist, end) {
	var progress = scurry.images.get("progress");
	var progressX = (canvas.width / 2) - (progress.width / 2);
	context.drawImage(progress, progressX, canvas.height - progress.height);
	var marker = scurry.images.get("progress-marker");

	var pct = Math.min(dist / end, 1.0);
	var markerX = progressX + ((progress.width - marker.width) * pct) - marker.width;
	context.drawImage(marker, markerX, canvas.height - marker.height);
}

scurry.scenes.add("level-1", new Splat.Scene(canvas, function() {
	shelves = [];
	powerUps = [];
	populateShelves(0);
	player = new Splat.AnimatedEntity(200, 50, 120, 40, scurry.animations.get("beetle"), -17, -27);
	player.x = 200;
	player.y = shelves[2].y - player.height;
	player.vx = 1;
	bgv = -0.3;
	bgx = 0;
	this.camera = new Splat.EntityBoxCamera(player, player.width, 200, 200, canvas.height / 2);
	this.clearTimers();
	pauseToggle.toggled = true;
},
function (elapsedMillis) {
	soundToggle.move(elapsedMillis);
	pauseToggle.move(elapsedMillis);

	if (this.timer("superjump") > 5000) {
		this.stopTimer("superjump");
	}
	if (this.timer("superspeed") > 5000) {
		this.stopTimer("superspeed");
	}
	if (state === "dead") {
		if (this.timer("dead") > 300 && !this.timer("roach motel") && !this.timer("crumble")) {
			player.sprite = scurry.images.get("beetle-dead");
		}
		if (this.timer("dead") > 1000) {
			state = "start";
			scurry.scenes.switchTo("level-1");
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

	moveShelves(elapsedMillis);

	if (scurry.keyboard.isPressed("left")) {
		player.x -= elapsedMillis * 0.70;
	}
	if (this.timer("superspeed") > 0) {
		player.x += elapsedMillis * 0.70;
	}
	if (scurry.keyboard.isPressed("right")) {
		player.x += elapsedMillis * 0.70;
	}

	player.vy += elapsedMillis * gravityAccel;
	player.move(elapsedMillis);

	deleteInvisibleShelves(this.camera.x);
	populateShelves(this.camera.x);

	if (player.y > -player.height) {
		state = "dead";
		scurry.sounds.play("death");
		this.startTimer("dead");
		return;
	}

	if (!this.timer("roach motel")) {
		for (var i in powerUps) {
			var powerUp = powerUps[i];
			if (powerUp.collides(player)) {
				this.startTimer(powerUp.name);
				if (powerUp.name != "roach motel") {
					powerUps.splice(i, 1);
				}
				if (powerUp.sound) {
					scurry.sounds.play(powerUp.sound);
				}
			}
		}
	}

	var onGround = false;
	for (i in shelves) {
		var shelf = shelves[i];
		if (shelf.collides(player)) {
			if (player.didOverlapHoriz(shelf) && player.wasAbove(shelf)) {
				player.y = shelf.y - player.height - 0.01;
				player.vy = 0;
				onGround = true;
			}
		}
	}

	if (this.timer("crumble") > 0 && onGround) {
		player.vx *= 0.9;
		if (this.timer("crumble") > 1000) {
			scurry.scenes.switchTo("level-1");
		}
		return;
	}

	if (onGround && player.sprite == scurry.animations.get("beetle-jump")) {
		player.sprite = scurry.animations.get("beetle");
		scurry.animations.get("beetle").reset();
		scurry.sounds.play("land");
	}
	if (!onGround && player.sprite == scurry.animations.get("beetle")) {
		player.sprite = scurry.animations.get("beetle-jump");
		scurry.animations.get("beetle-jump").reset();
	}
	if ((scurry.keyboard.isPressed("space") || scurry.mouse.buttons[0]) && onGround) {
		player.vy = jumpSpeed;
		if (this.timer("superjump") > 0) {
			player.vy += -1;
			scurry.sounds.play("superjump");
		} else {
			scurry.sounds.play("jump");
		}
		if (scurry.keyboard.isPressed("up")) {
			player.vy += -1;
		}

		player.sprite = scurry.animations.get("beetle-jump");
		scurry.animations.get("beetle-jump").reset();
	}
	if ((!scurry.keyboard.isPressed("space") && !scurry.mouse.buttons[0]) && player.vy < minJump) {
		player.vy = minJump;
	}

	if (this.timer("roach motel") > 0) {
		player.sprite = scurry.animations.get("skeleton");
	}
	if (this.timer("roach motel") > 3000) {
		player.sprite = scurry.animations.get("skeleton-crumble");
		player.sprite.reset();
		scurry.sounds.play("crumble");
		this.stopTimer("roach motel");
		this.startTimer("crumble");
	}

	bgx += elapsedMillis * bgv;
	var bg = scurry.images.get("bg");
	if (bgx + bg.width < 0) {
		bgx += bg.width;
	}
},
function (context) {
	drawStage(this, context);
	for (var i in powerUps) {
		powerUps[i].draw(context);
	}
	player.draw(context);

	var scene = this;
	this.camera.drawAbsolute(context, function() {
		soundToggle.draw(context);
		pauseToggle.draw(context);

		var dist = Math.round(player.x / player.width * 100) / 100;
		drawProgress(context, dist, 1000);


		if (scene.timer("superspeed") > 0) {
			context.fillStyle = "#00ff00";
			context.font = "48px pixelade";
			centerText(context, "SUPERSPEED!", 0, canvas.height - 70);
		}
		if (scene.timer("superjump") > 0) {
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
}));

scurry.scenes.switchTo("loading");
