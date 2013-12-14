function Game(canvas, simulationFunc, drawFunc) {
	var context = canvas.getContext("2d");
	var lastTimestamp = -1;
	var running = false;

	function mainLoop(timestamp) {
		if (lastTimestamp === -1) {
			lastTimestamp = timestamp;
		}
		var timeDiff = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		simulationFunc(timeDiff);
		drawFunc(context);

		if (running) {
			window.requestAnimationFrame(mainLoop);
		}
	}

	this.start = function() {
		running = true;
		window.requestAnimationFrame(mainLoop);
	}

	this.stop = function() {
		running = false;
	}

	this.keys = {};

	this.mapKeys = function(keyMap) {
		var game = this;
		for (var kc in keyMap) {
			game.keys[keyMap[kc]] = false;
		}
		window.onkeydown = function(event) {
			if (keyMap.hasOwnProperty(event.keyCode)) {
				game.keys[keyMap[event.keyCode]] = true;
			}
		}
		window.onkeyup = function(event) {
			if (keyMap.hasOwnProperty(event.keyCode)) {
				game.keys[keyMap[event.keyCode]] = false;
			}
		}
	}

	var relMouseCoords = function(event) {
		var x = event.x - canvas.offsetLeft + document.body.scrollLeft;
		var y = event.y - canvas.offsetTop + document.body.scrollTop;
		return {x:x, y:y};
	};

	var mouse = {
		x: 0,
		y: 0,
		buttons: {
			'0': false,
			'1': false,
			'2': false
		}
	};
	window.oncontextmenu = function() {
		return false;
	};
	this.mouse = mouse;
	canvas.onmousedown = function(event) {
		var m = relMouseCoords(event);
		mouse.x = m.x;
		mouse.y = m.y;
		mouse.buttons[event.button] = true;
	};
	canvas.onmouseup = function(event) {
		var m = relMouseCoords(event);
		mouse.x = m.x;
		mouse.y = m.y;
		mouse.buttons[event.button] = false;
	};
	canvas.addEventListener("touchstart", function(event) {
		var touch = event.touches[0];
		var m = relMouseCoords({x:touch.pageX, y:touch.pageY})
		mouse.x = m.x;
		mouse.y = m.y;
		mouse.buttons[0] = true;
	});
	canvas.addEventListener("touchend", function(event) {
		mouse.buttons[0] = false;
	});
}

function Entity(x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.vx = 0;
	this.vy = 0;
	this.lastx = 0;
	this.lasty = 0;
}
Entity.prototype.move = function(elapsedSec) {
	this.lastx = this.x;
	this.lasty = this.y;
	this.x += elapsedSec * this.vx;
	this.y += elapsedSec * this.vy;
}
Entity.prototype.overlapsHoriz = function(other) {
	return this.x + this.width > other.x && this.x < other.x + other.width;
}
Entity.prototype.overlapsVert = function(other) {
	return this.y + this.height > other.y && this.y < other.y + other.height;
}
Entity.prototype.collides = function(other) {
	return this.overlapsHoriz(other) && this.overlapsVert(other);
}

Entity.prototype.didOverlapHoriz = function(other) {
	return this.lastx + this.width > other.lastx && this.lastx < other.lastx + other.width;
}
Entity.prototype.didOverlapVert = function(other) {
	return this.lasty + this.height > other.lasty && this.lasty < other.lasty + other.height;
}

function SpriteSheet(path, numFrames, framesPerSec) {
	this.img = new Image();
	this.loaded = false;
	this.numFrames = numFrames;
	this.frame = 0;
	this.framesPerSec = framesPerSec;
	this.elapsedSec = 0;

	var that = this;
	this.img.onload = function() {
		that.loaded = true;
		that.frameWidth = that.img.width / that.numFrames;
	};
	this.img.src = path;
}
SpriteSheet.prototype.move = function(elapsedSec) {
	this.elapsedSec += elapsedSec;
	var advance = Math.floor(this.elapsedSec / this.framesPerSec);
	if (advance == 0) {
		return;
	}
	this.frame += advance;
	this.frame %= this.numFrames;
	this.elapsedSec -= advance * this.framesPerSec;
};
SpriteSheet.prototype.draw = function(context) {
	if (!this.loaded) {
		return;
	}
	var sx = this.frame * this.frameWidth
	context.drawImage(this.img, sx, 0, this.frameWidth, this.img.height, 0, 0, this.frameWidth, this.img.height);
};
