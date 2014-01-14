function time(f, iters) {
	var start = window.performance.now();
	for (var i = 0; i < iters; i++) {
		f();
	}
	var stop = window.performance.now();
	return stop - start;
}

function makeCanvas(width, height) {
	var c = document.createElement('canvas');
	c.width = width;
	c.height = height;
	return c;
}

function drawCanvas(width, height, drawFun) {
	var canvas = makeCanvas(width, height);
	var ctx = canvas.getContext('2d');
	drawFun(ctx);
	return canvas;
}

function Game(canvas, simulationFunc, drawFunc) {
	var context = canvas.getContext("2d");
	var lastTimestamp = -1;
	var running = false;
	this.cameraX = 0;
	this.cameraY = 0;
	this.fps = 0;
	var that = this;

	function mainLoop(timestamp) {
		if (lastTimestamp === -1) {
			lastTimestamp = timestamp;
		}
		var timeDiff = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		that.fps = (1000 / timeDiff) |0;

		simulationFunc(timeDiff);

		context.save();
		context.translate(-that.cameraX, -that.cameraY);
		drawFunc(context);
		context.restore();

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
}

function KeyboardInput(keyMap) {
	this.keys = {};

	var that = this;
	for (var kc in keyMap) {
		this.keys[keyMap[kc]] = 0;
	}
	window.addEventListener('keydown', function(event) {
		if (keyMap.hasOwnProperty(event.keyCode)) {
			if (that.keys[keyMap[event.keyCode]] == 0) {
				that.keys[keyMap[event.keyCode]] = 1;
			}
			return false;
		}
	});
	window.addEventListener('keyup', function(event) {
		if (keyMap.hasOwnProperty(event.keyCode)) {
			that.keys[keyMap[event.keyCode]] = 0;
			return false;
		}
	});
}
KeyboardInput.prototype.isPressed = function(name) {
	return this.keys[name] == 1;
};
KeyboardInput.prototype.consumePressed = function(name) {
	var p = this.isPressed(name);
	if (p) {
		this.keys[name] = -1;
	}
	return p;
};

function MouseInput(canvas) {
	var relMouseCoords = function(event) {
		var x = event.pageX - canvas.offsetLeft + document.body.scrollLeft;
		var y = event.pageY - canvas.offsetTop + document.body.scrollTop;

		// scale based on ratio of canvas internal dimentions to css dimensions
		x *= canvas.width / canvas.style.width.substring(0, canvas.style.width.indexOf('p'));
		y *= canvas.height / canvas.style.height.substring(0, canvas.style.height.indexOf('p'));

		return {x:x, y:y};
	};

	this.x = 0;
	this.y = 0;
	this.buttons = [false, false, false];

	// prevent springy scrolling on ios
	document.ontouchmove = function(e) {
		e.preventDefault();
	};

	// prevent right-click on desktop
	window.oncontextmenu = function() {
		return false;
	};

	var that = this;
	canvas.addEventListener('mousedown', function(event) {
		var m = relMouseCoords(event);
		that.x = m.x;
		that.y = m.y;
		that.buttons[event.button] = true;
	});
	canvas.addEventListener('mouseup', function(event) {
		var m = relMouseCoords(event);
		that.x = m.x;
		that.y = m.y;
		that.buttons[event.button] = false;
	});
	canvas.addEventListener('touchstart', function(event) {
		var touch = event.touches[0];
		var m = relMouseCoords(touch)
		that.x = m.x;
		that.y = m.y;
		that.buttons[0] = true;
	});
	canvas.addEventListener('touchend', function(event) {
		that.buttons[0] = false;
	});
}

function Entity(x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.vx = 0;
	this.vy = 0;
	this.lastX = x;
	this.lastY = y;
}
Entity.prototype.move = function(elapsedSec) {
	this.lastX = this.x;
	this.lastY = this.y;
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
	return this.lastX + this.width > other.lastX && this.lastX < other.lastX + other.width;
}
Entity.prototype.didOverlapVert = function(other) {
	return this.lastY + this.height > other.lastY && this.lastY < other.lastY + other.height;
}
Entity.prototype.wasAbove = function(other) {
	return this.lastY + this.height <= other.lastY;
}

function ImageLoader() {
	this.images = {};
	this.totalImages = 0;
	this.loadedImages = 0;
}
ImageLoader.prototype.load = function(name, path, numFrames) {
	if (arguments.length == 2) {
		numFrames = 1;
	}
	this.totalImages++;

	var img = new Image();
	var that = this;
	img.addEventListener('load', function() {
		that.loadedImages++;

		if (numFrames == 1) {
			that.images[name] = img;
		} else {
			var frameWidth = img.width / numFrames;
			for (var f = 0; f < numFrames; f++) {
				var slice = drawCanvas(frameWidth, img.height, function(ctx) {
					var sx = f * frameWidth
					ctx.drawImage(img, sx, 0, frameWidth, img.height, 0, 0, frameWidth, img.height);
				});
				that.images[name + f] = slice;
			}
		}
	});
	img.src = path;
};
ImageLoader.prototype.allLoaded = function() {
	return this.totalImages == this.loadedImages;
};
ImageLoader.prototype.get = function(name) {
	return this.images[name];
};

function SoundLoader() {
	this.sounds = {};
	this.totalSounds = 0;
	this.loadedSounds = 0;
	this.muted = false;

	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	this.context = new AudioContext();
}
SoundLoader.prototype.load = function(name, path) {
	var that = this;

	if (this.totalSounds == 0) {
		// safari on iOS mutes sounds until they're played in response to user input
		// play a dummy sound on first touch
		var firstTouchHandler = function(event) {
			window.removeEventListener('click', firstTouchHandler);
			window.removeEventListener('keydown', firstTouchHandler);
			window.removeEventListener('touchstart', firstTouchHandler);

			var source = that.context.createOscillator();
			source.connect(that.context.destination);
			source.start(0);
			source.stop(0);

			if (that.firstPlay) {
				that.play(that.firstPlay);
			} else {
				that.firstPlay = 'workaround';
			}

		};
		window.addEventListener('click', firstTouchHandler);
		window.addEventListener('keydown', firstTouchHandler);
		window.addEventListener('touchstart', firstTouchHandler);
	}

	this.totalSounds++;

	var request = new XMLHttpRequest();
	request.open('GET', path, true);
	request.responseType = 'arraybuffer';
	request.onload = function() {
		that.context.decodeAudioData(request.response, function(buffer) {
			that.sounds[name] = buffer;
			that.loadedSounds++;
		});
	}
	request.send();
};
SoundLoader.prototype.allLoaded = function() {
	return this.totalSounds = this.loadedSounds;
};
SoundLoader.prototype.play = function(name) {
	if (!this.firstPlay) {
		// let the iOS user input workaround handle it
		this.firstPlay = name;
		return;
	}
	if (this.muted) {
		return;
	}
	var source = this.context.createBufferSource();
	source.buffer = this.sounds[name];
	source.connect(this.context.destination);
	source.start(0);
};

function Animation() {
	this.frames = [];
	this.frame = 0;
	this.elapsedSec = 0;
	this.repeatAt = 0;
	this.width = 0;
	this.height = 0;
}
Animation.prototype.add = function(img, time) {
	this.frames.push({img: img, time: time});
	if (frames.length == 0) {
		this.width = img.width;
		this.height = img.height;
	}
};
Animation.prototype.move = function(elapsedSec) {
	this.elapsedSec += elapsedSec;
	while (this.elapsedSec > this.frames[this.frame].time) {
		this.elapsedSec -= this.frames[this.frame].time;
		this.frame++;
		if (this.frame >= this.frames.length) {
			this.frame = this.repeatAt;
		}
	}
};
Animation.prototype.draw = function(context, x, y) {
	var img = this.frames[this.frame].img;
	context.drawImage(img, x, y);
};
Animation.prototype.reset = function() {
	this.frame = 0;
	this.elapsedSec = 0;
};

function AnimatedEntity(x, y, width, height, sprite, spriteOffsetX, spriteOffsetY) {
	this.sprite = sprite;
	this.spriteOffsetX = spriteOffsetX;
	this.spriteOffsetY = spriteOffsetY;
	Entity.call(this, x, y, width, height);
}
AnimatedEntity.prototype = Object.create(Entity.prototype);
AnimatedEntity.prototype.move = function(elapsedSec) {
	Entity.prototype.move.call(this, elapsedSec);
	if (typeof this.sprite.move === 'function') {
		this.sprite.move(elapsedSec);
	}
};
AnimatedEntity.prototype.draw = function(context) {
	if (typeof this.sprite.draw === 'function') {
		this.sprite.draw(context, this.x + this.spriteOffsetX, this.y + this.spriteOffsetY);
	} else {
		context.drawImage(this.sprite, this.x + this.spriteOffsetX, this.y + this.spriteOffsetY);
	}
	// draw bounding boxes
	// context.strokeStyle = "#ff0000";
	// context.strokeRect(this.x, this.y, this.width, this.height);
};
AnimatedEntity.prototype.copy = function() {
	return new AnimatedEntity(this.x, this.y, this.width, this.height, this.sprite, this.spriteOffsetX, this.spriteOffsetY);
}

function get_context_with_image(image) {
	var canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	var context = canvas.getContext("2d");
	context.drawImage(image, 0, 0, image.width, image.height);
	return context;
}

function ThreePatch(image) {
	this.img = image;

	var context = get_context_with_image(image);
	var firstDiv = secondDiv = image.width;
	for (var x = 0; x < image.width; x++) {
		var pixel = context.getImageData(x, image.height - 1, 1, 1).data;
		var alpha = pixel[3];
		if (firstDiv == image.width && alpha > 0) {
			firstDiv = x;
		}
		if (firstDiv < image.width && alpha == 0) {
			secondDiv = x;
			break;
		}
	}
	this.w1 = firstDiv;
	this.w2 = secondDiv - firstDiv;
	this.w3 = this.img.width - secondDiv - 1;

	firstDiv = secondDiv = image.height;
	for (var y = 0; y < image.height; y++) {
		var pixel = context.getImageData(image.width - 1, y, 1, 1).data;
		var alpha = pixel[3];
		if (firstDiv == image.height && alpha > 0) {
			firstDiv = y;
		}
		if (firstDiv < image.height && alpha == 0) {
			secondDiv = y;
			break;
		}
	}
	this.h1 = firstDiv;
	this.h2 = secondDiv - firstDiv;
	this.h3 = this.img.height - secondDiv - 1;
}
ThreePatch.prototype.draw = function(context, x, y, width) {
	x = x|0;
	y = y|0;
	var h = this.img.height - 1;

	context.drawImage(this.img, 0, 0, this.w1, h, x, y, this.w1, h);

	var startThirdDiv = x + width - this.w3;
	context.drawImage(this.img, this.w1 + this.w2, 0, this.w3, h, startThirdDiv, y, this.w3, h);

	for (var x2 = this.w1; x2 < width - this.w3; x2 += this.w2) {
		var drawWidth = startThirdDiv - x - x2;
		drawWidth = Math.min(drawWidth, this.w2);
		context.drawImage(this.img, this.w1, 0, drawWidth, h, x + x2, y, drawWidth, h);
	}
};

