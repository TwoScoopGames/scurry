"use strict";

var canvas = document.getElementById("canvas");

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
		"cookies": "images/cookies.png",
		"bottle": "images/bottle.png",
		"waffles": "images/waffles.png",
		"icecream": "images/icecream.png",
		"syrup": "images/syrup.png",
		"butter": "images/butter.png",
		"milk": "images/milk.png",
		"milk2": "images/milk2.png",
		"oj": "images/oj.png",
		"tag1": "images/price-tag1.png",
		"tag2": "images/price-tag2.png",
		"tag3": "images/price-tag-sale.png",
		"sound-off": "images/sound-off-icon.png",
		"sound-on": "images/sound-on-icon.png",
		"play": "images/play-icon.png",
		"pause": "images/pause-icon.png",
		"hotel-front": "images/hotel-front.png",
		"hotel-back": "images/hotel-bg.png",
	},
	"sounds": {
		"music": "audio/RoccoW_-_09_-_Weeklybeats_2014_9_-_This_Little_Piggy_Danced.mp3",
		"jump": "audio/jump.wav",
		"superjump": "audio/superjump.wav",
		"land": "audio/land.wav",
		"death": "audio/death.wav",
		"lights-on": "audio/lights-on.wav",
		"powerup-jump": "audio/powerup-jump.wav",
		"powerup-speed": "audio/powerup-speed.wav",
		"crumble": "audio/crumble.wav"
	},
	// "fonts": {
	// 	"helvetica": {
	// 		"embedded-opentype": "fonts/bebasneue-webfont.eot",
	// 		"woff": "fonts/bebasneue-webfont.woff",
	// 		"truetype": "fonts/bebasneue-webfont.ttf",
	// 		"svg": "fonts/bebasneue-webfont.svg#helvetica'"
	// 	}
	// },
	"animations": {
		"two-scoop": {
			"strip": "images/two-scoop-anim.png",
			"frames": 32,
			"msPerFrame": 50,
			"repeatAt": 31
		},
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
		"beetle-fall": {
			"strip": "images/scurry-fall-9f.png",
			"frames": 9,
			"msPerFrame": 50,
			"repeatAt": 6
		},
		"coffee-bean": {
			"strip": "images/coffee-bean-16f.png",
			"frames": 16,
			"msPerFrame": 70
		},
		"logo-white": {
			"strip": "images/scurry-logo-white-10f686x399.png",
			"frames": 6,
			"msPerFrame": 100
		},
		"logo-black": {
			"strip": "images/scurry-logo-black-10f686x399.png",
			"frames": 6,
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
		"superSpeedAnim": {
			"strip": "images/super-speed.png",
			"frames": 4,
			"msPerFrame": 100
		},
		"superJumpAnim": {
			"strip": "images/super-jump.png",
			"frames": 4,
			"msPerFrame": 100
		},
		"deathPopUp": {
			"strip": "images/death1.png",
			"frames": 2,
			"msPerFrame": 150
		}
	}
};
var scurry = new Splat.Game(canvas, manifest);
var deathPopUpShow = false;
var beetleBlack;
var player = {};
var shelves = new EntityGroup();
var hotels = [];
var powerUps = new EntityGroup();
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
var possiblePowerUps;

var score = 0;
var bestScore = 0;
var newBestScore = false;
var shelfItemSpacing = 30;
var shelfItems = [
	["empty", "box1", "box2", "box3", "can1", "can2", "syrup", "waffles", "bottle"],
	["empty", "cookies", "icecream", "butter", "milk", "milk2", "oj"]
];
var shelfTags = ["tag1", "tag2", "tag3"];
var sameItemChance = 0.50;

var soundToggle;
var pauseToggle;
var onGround = true;


function clickOrTap() {
	if (scurry.mouse.supportsTouch()) {
		return "TAP";
	} else {
		return "CLICK";
	}
}

function centerText(context, text, offsetX, offsetY) {
	var w = context.measureText(text).width;
	var x = offsetX + (canvas.width / 2) - (w / 2) | 0;
	var y = offsetY | 0;
	context.fillText(text, x, y);
}

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

function assetsLoaded() {
	var sugarCube = scurry.animations.get("sugar-cube");
	var coffeeBean = scurry.animations.get("coffee-bean");

	possiblePowerUps = [{
		"name": "superjump",
		"animation": sugarCube,
		"sound": "powerup-jump"
	}, {
		"name": "superspeed",
		"animation": coffeeBean,
		"sound": "powerup-speed"
	}, {
		"name": "roachMotel",
		"animation": scurry.images.get("hotel-back")
	}];

	shelf = new Splat.NinePatch(scurry.images.get("shelf"));
	shelfBkgd = new Splat.NinePatch(scurry.images.get("shelf background"));
}

function randPrice() {
	var price = (((Math.random() * 95) | 0) + 5) * 10 + 9;
	price = "" + price;
	if (price.length === 2) {
		return "." + price;
	}
	return price[0] + "." + price.substr(1);
}

function getShelfItems(width, itemGroup) {
	var items = [];
	var possibleItems = itemGroup.slice(0);

	function getItemWidth(item) {
		var name = item.item;
		if (name === "empty") {
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
		var tag = (Math.random() * shelfTags.length) | 0;
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
			var n = (Math.random() * possibleItems.length) | 0;
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
	if (item.tag === "tag3") {
		context.fillStyle = "#c61505";
	} else {
		context.fillStyle = "#333333";
	}
	context.font = "28px helvetica";
	context.fillText(price, tagx + 65, tagy + 65);
}

function drawShelfItem(context, item, x, y) {
	if (item.item === "empty") {
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

function makeShelf(x, width, drawBackground, itemGroup) {
	var y = -((canvas.height / 4) + (Math.random() * (canvas.height / 2)));
	var items = getShelfItems(width - shelf.w1 - shelf.w3, itemGroup);

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
	while (firstEntityIsInvisible(shelves.entities, cameraX)) {
		shelves.entities.shift();
	}
	while (firstEntityIsInvisible(powerUps.entities, cameraX)) {
		powerUps.entities.shift();
	}
	while (firstEntityIsInvisible(hotels, cameraX)) {
		hotels.shift();
	}
}

function firstEntityIsInvisible(entities, cameraX) {
	return entities.length > 0 && entities[0].x + entities[0].width < cameraX;
}

function getNextShelfX() {
	if (shelves.entities.length > 0) {
		var last = shelves.entities[shelves.entities.length - 1];
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
		var width = x === 0 ? 600 : getRandomArbitrary(400, 1000) | 0;

		var spacing = (shelfBkgd.img.height - 1) * 3;
		var height = spacing + shelf.img.height - 1;

		var itemGroup = shelfItems[(Math.random() * shelfItems.length) | 0];

		var shelvesInRack = 4 + (Math.random() * 3) | 0;
		for (var n = 0; n < shelvesInRack; n++) {
			var s = makeShelf(x, width, n < shelvesInRack - 1, itemGroup);
			var y;
			if (n === 0) {
				shelves.entities.push(makeShelfBottom(s));
				y = s.y - height;
			} else {
				s.y = y;
				y -= height;
			}
			shelves.entities.push(s);
			if (x > 3000 && Math.random() < 0.3) {
				powerUps.entities.push(makePowerUp(s.x + (s.width / 2) - 25, s.y - 100));
			}
		}
	}
}

function makePowerUp(x, y) {
	var pnum = Math.random() * possiblePowerUps.length | 0;
	var p = possiblePowerUps[pnum];

	var a;
	if (p.name === "roachMotel") {
		a = new Splat.AnimatedEntity(x - (p.animation.width / 2), y + 60, 265, 30, p.animation, -25, -60);
		var fg = scurry.images.get("hotel-front");
		hotels.push(new Splat.AnimatedEntity(x - (fg.width / 2) - 25, y + 20, fg.width, 95, fg, 0, -20));
	} else {
		a = new Splat.AnimatedEntity(x - (p.animation.width / 2), y, p.animation.width, p.animation.height, p.animation, 0, 0);
		a.elapsedSec = 0;
		a.move = function(elapsedSec) {
			this.elapsedSec += elapsedSec;
			this.y = y + Math.sin(this.elapsedSec / 1000.0 * Math.PI) * 20 | 0;
			Splat.AnimatedEntity.prototype.move.call(this, elapsedSec);
		};
	}
	a.name = p.name;
	a.sound = p.sound;
	return a;
}

function needShelves(cameraX) {
	var e = shelves.entities;
	return e.length === 0 || e[e.length - 1].x + e[e.length - 1].width < cameraX + canvas.width;
}

function moveShelves(elapsedMillis) {
	shelves.move(elapsedMillis);
	powerUps.move(elapsedMillis);
}

function drawStage(scene, context) {
	var bg = scurry.images.get("bg");

	scene.camera.drawAbsolute(context, function() {
		var x = bgx | 0;
		context.drawImage(bg, x, 0);
		if (x + bg.width < canvas.width) {
			context.drawImage(bg, x + bg.width, 0);
		}
	});

	shelves.draw(context);

	// draw the insta-death floor
	if (scene.camera.y > 50 - canvas.height) {
		linearGradient(context, scene.camera.x, -50, canvas.width, 50, "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 1)");
	}
	if (scene.camera.y > -canvas.height) {
		context.fillStyle = "#000000";
		context.fillRect(scene.camera.x | 0, 0, canvas.width, canvas.height + scene.camera.y + 1 | 0);
	}
}

function linearGradient(context, x, y, width, height, startColor, stopColor) {
	x = x | 0;
	y = y | 0;
	var grd = context.createLinearGradient(x, y, x, y + height);
	grd.addColorStop(0, startColor);
	grd.addColorStop(1, stopColor);
	context.fillStyle = grd;
	context.fillRect(x, y, width, height);
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

function drawEntities(context, entities) {
	entities.sort(function(a, b) {
		return b.y - a.y;
	});
	for (var i in entities) {
		entities[i].draw(context);
	}
}

function EntityGroup() {
	this.entities = [];
}
EntityGroup.prototype.move = function(elapsedMillis) {
	var e = this.entities.slice(0);
	for (var i = 0; i < e.length; i++) {
		e[i].move(elapsedMillis);
	}
};
EntityGroup.prototype.draw = function(context) {
	for (var i = 0; i < this.entities.length; i++) {
		this.entities[i].draw(context);
	}
};
EntityGroup.prototype.collides = function(other, handler) {
	var e = this.entities.slice(0);
	for (var i = 0; i < e.length; i++) {
		if (e[i].collides(other)) {
			handler(e[i]);
		}
	}
};
EntityGroup.prototype.remove = function(entity) {
	var i = this.entities.indexOf(entity);
	if (i > -1) {
		this.entities.splice(i, 1);
	}
};



/*=========================================
				 Scenes 
===========================================*/

scurry.scenes.add("title", new Splat.Scene(canvas, function() {
	this.timers.running = new Splat.Timer(null, 1500, function() {
		scurry.scenes.switchTo("game-title");
	});
	this.timers.running.start();
}, function(elapsedMillis) {
	scurry.animations.get("two-scoop").move(elapsedMillis);
}, function(context) {
	context.fillStyle = "#93cbcd";
	context.fillRect(0, 0, canvas.width, canvas.height);
	var anim = scurry.animations.get("two-scoop");
	context.fillStyle = "#ffffff";
	context.font = "50px helvetica";
	centerText(context, "Two Scoop Games", 0, (canvas.height / 2) + (anim.height / 2) + 30);

	anim.draw(context, (canvas.width / 2) - (anim.width / 2), (canvas.height / 2) - (anim.height / 2));
}));

scurry.scenes.add("game-title", new Splat.Scene(canvas, function() {
		assetsLoaded();
		this.camera.vx = 0.2;
		this.camera.y = -800;
		this.timers.lightsOn = new Splat.Timer(null, 807, function() {
			beetleBlack = new Splat.AnimatedEntity(0, 420, 0, 0, scurry.animations.get("beetle-black"), 0, 0);
			beetleBlack.vx = 1.40;
		});
		this.timers.starting = new Splat.Timer(null, 2300, function() {
			scurry.scenes.switchTo("level-1");
		});
	},
	function(elapsedMillis) {
		if (!this.timers.starting.running && (scurry.keyboard.consumePressed("space") || scurry.mouse.buttons[0])) {
			this.timers.lightsOn.start();
			this.timers.starting.start();
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

		var self = this;
		this.camera.drawAbsolute(context, function() {
			var logo;
			if (self.timers.lightsOn.expired()) {
				context.fillStyle = "rgba(255, 255, 255, 0.7)";
				logo = scurry.animations.get("logo-black");
			} else {
				context.fillStyle = "rgba(0, 0, 0, 0.7)";
				logo = scurry.animations.get("logo-white");
			}
			context.fillRect(0, 0, canvas.width, canvas.height);
			logo.draw(context, (canvas.width / 2) - (logo.width / 2), 0);

			if (self.timers.lightsOn.expired()) {
				beetleBlack.draw(context);
			}
			if (!self.timers.starting.running) {
				context.fillStyle = "#ffffff";
				context.font = "48px helvetica";
				centerText(context, clickOrTap() + " TO START", 0, 450);
			}
		});
	}));

scurry.scenes.add("level-1", new Splat.Scene(canvas, function() {
		deathPopUpShow = false;
		shelves = new EntityGroup();
		hotels = [];
		powerUps = new EntityGroup();
		populateShelves(0);
		player = new Splat.AnimatedEntity(200, 50, 120, 40, scurry.animations.get("beetle"), -17, -27);
		player.x = 200;
		player.y = shelves.entities[2].y - player.height;
		onGround = true;
		shelves.entities[2].counted = true;
		player.vx = 1;
		bgv = -0.3;
		bgx = 0;
		this.camera = new Splat.EntityBoxCamera(player, player.width, 200, 200, canvas.height / 2);
		score = 0;
		newBestScore = false;
		state = "start";
		scurry.sounds.play("music", true);

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
		pauseToggle.toggled = true;

		soundToggle = new ToggleButton(0, 108, 72, 72, scurry.images.get("sound-on"), scurry.images.get("sound-off"), "m", function(toggled) {
			scurry.sounds.muted = !toggled;
		});
		soundToggle.attachToRight(canvas, 12);

		this.timers.superjump = new Splat.Timer(null, 5000, function() {
			this.reset();
		});
		this.timers.superspeed = new Splat.Timer(function(elapsedMillis) {
			player.x += elapsedMillis * 0.70;
		}, 5000, function() {
			this.reset();
		});
		this.timers.dead = new Splat.Timer(function(elapsedMillis) {
			player.vx = 0.6;
			player.vy = 0.6;
			player.move(elapsedMillis);
		}, 1000, function() {
			scurry.scenes.switchTo("score");
		});
		var self = this;
		this.timers.roachMotel = new Splat.Timer(null, 1000, function() {
			if (!onGround) {
				this.start();
				return;
			}
			player.sprite = scurry.animations.get("skeleton-crumble");
			player.sprite.reset();
			scurry.sounds.play("crumble");

			self.timers.crumble.start();
		});
		this.timers.crumble = new Splat.Timer(function(elapsedMillis) {
			player.vx *= 0.9;
		}, 500, function() {
			scurry.scenes.switchTo("score");
		});
	},
	function(elapsedMillis) {
		scurry.animations.get("superJumpAnim").move(elapsedMillis);
		scurry.animations.get("superSpeedAnim").move(elapsedMillis);
		scurry.animations.get("deathPopUp").move(elapsedMillis);
		soundToggle.move(elapsedMillis);
		pauseToggle.move(elapsedMillis);

		if (state === "dead") {
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
			this.timers.dead.start();
			if (!this.timers.roachMotel.running && !this.timers.crumble.running) {
				player.sprite = scurry.animations.get("beetle-fall");
			}
			return;
		}

		onGround = false;
		shelves.collides(player, function(shelf) {
			if (player.wasAbove(shelf)) {
				player.y = shelf.y - player.height - 0.01;
				player.vy = 0;
				onGround = true;
				if (!shelf.counted && player.sprite.name === "beetle") {
					shelf.counted = true;
					score++;
					if (score > bestScore) {
						newBestScore = true;
						bestScore = score;
					}
				}
			}
		});

		for (var i = 0; i < hotels.length; i++) {
			var hotel = hotels[i];
			if (hotel.collides(player)) {
				if (player.wasAbove(hotel)) {
					player.y = hotel.y - player.height - 0.01;
					player.vy = 0;
					onGround = true;
				}
			}
		}

		if (this.timers.crumble.running > 0 && onGround) {
			return;
		}

		var inHotel = false;
		var scene = this;
		powerUps.collides(player, function(powerUp) {
			if (powerUp.name === "roachMotel") {
				if (powerUp.avoided || player.wasBelow(powerUp)) {
					powerUp.avoided = true;
					return;
				}
				// only switch to skeleton when hidden inside motel.
				if (player.x > powerUp.x + 30) {
					deathPopUpShow = true;
					player.sprite = scurry.animations.get("skeleton");
				} else {
					deathPopUpShow = false;
				}
				inHotel = true;
			}
			if (!scene.timers.roachMotel.running) {
				scene.timers[powerUp.name].reset();
				scene.timers[powerUp.name].start();
				if (powerUp.name !== "roachMotel") {
					powerUps.remove(powerUp);
				}
				if (powerUp.sound) {
					scurry.sounds.play(powerUp.sound);
				}
			}
		});

		if (onGround && player.sprite === scurry.animations.get("beetle-jump")) {
			player.sprite = scurry.animations.get("beetle");
			scurry.animations.get("beetle").reset();
			scurry.sounds.play("land");
		}
		if (!onGround && player.sprite === scurry.animations.get("beetle")) {
			player.sprite = scurry.animations.get("beetle-jump");
			scurry.animations.get("beetle-jump").reset();
		}
		if ((scurry.keyboard.isPressed("space") || scurry.mouse.buttons[0]) && onGround && !inHotel) {
			player.vy = jumpSpeed;
			if (this.timers.superjump.running) {

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

		if (this.timers.roachMotel.running && !inHotel) {
			player.sprite = scurry.animations.get("skeleton");
		}

		bgx += elapsedMillis * bgv;
		var bg = scurry.images.get("bg");
		if (bgx + bg.width < 0) {
			bgx += bg.width;
		}
	},
	function(context) {

		drawStage(this, context);
		powerUps.draw(context);

		var toDraw = hotels.slice(0);
		toDraw.push(player);
		drawEntities(context, toDraw);

		var superJumpAnim = scurry.animations.get("superJumpAnim");
		var superSpeedAnim = scurry.animations.get("superSpeedAnim");
		var deathPopUp = scurry.animations.get("deathPopUp");

		var scene = this;
		this.camera.drawAbsolute(context, function() {
			soundToggle.draw(context);
			pauseToggle.draw(context);

			context.fillStyle = "#000000";
			context.font = "100px helvetica";
			centerText(context, score, 0, 70);

			if (!deathPopUpShow && scene.timers.superspeed.running && !scene.timers.superjump.running) {
				superSpeedAnim.draw(context, (canvas.width - superSpeedAnim.width) - 20, (canvas.height - superSpeedAnim.height) - 20);
			}
			if (!deathPopUpShow && scene.timers.superjump.running && !scene.timers.superspeed.running) {
				superJumpAnim.draw(context, (canvas.width - superJumpAnim.width) - 20, (canvas.height - superJumpAnim.height) - 20);
			}
			if (!deathPopUpShow && scene.timers.superspeed.running && scene.timers.superjump.running) {
				superSpeedAnim.draw(context, 20, (canvas.height - superSpeedAnim.height) - 20);
				superJumpAnim.draw(context, (canvas.width - superJumpAnim.width) - 20, (canvas.height - superJumpAnim.height) - 20);
			}
			if (deathPopUpShow) {
				deathPopUp.draw(context, (canvas.width - deathPopUp.width) - 20, (canvas.height - deathPopUp.height) - 20);
			}
			if (stateMessages[state]) {
				context.fillStyle = "rgba(0, 0, 0, 0.7)";
				context.fillRect(0, 400, canvas.width, 70);
				context.fillStyle = "#ffffff";
				context.font = "48px helvetica";
				centerText(context, stateMessages[state], 0, 450);
			}


		});



	}));

scurry.scenes.add("score", new Splat.Scene(canvas, function() {
		this.timers.run = new Splat.Timer(null, 1000, function() {
			scurry.scenes.switchTo("level-1");
		});
		this.timers.run.start();
	},
	function(elapsedMillis) {},
	function(context) {
		context.fillStyle = "#000000";
		context.fillRect(0, 0, canvas.width, canvas.height);

		context.fillStyle = "#ffffff";
		context.font = "42px helvetica";
		centerText(context, "SCORE", 0, 200);
		context.font = "100px helvetica";
		centerText(context, score, 0, 290);

		var bestText = "HIGH SCORE";
		if (newBestScore) {
			context.fillStyle = "#6bc255";
			bestText = "NEW HIGH SCORE!";
		}
		context.font = "42px helvetica";
		centerText(context, bestText, 0, 400);
		context.font = "100px helvetica";
		centerText(context, bestScore, 0, 490);
	}));
scurry.scenes.switchTo("loading");