function time(f, iters) {
	var start = window.performance.now();
	for (var i = 0; i < iters; i++) {
		f();
	}
	var stop = window.performance.now();
	return stop - start;
}

function makeCanvas(width, height) {
	var c = document.createElement("canvas");
	c.width = width;
	c.height = height;
	return c;
}

function drawCanvas(width, height, drawFun) {
	var canvas = makeCanvas(width, height);
	var ctx = canvas.getContext("2d");
	drawFun(ctx);
	return canvas;
}

function get_context_with_image(image) {
	var canvas = makeCanvas(image.width, image.height);
	var ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0, image.width, image.height);
	return ctx;
}

function MouseInput(canvas) {
	var relMouseCoords = function(event) {
		var x = event.pageX - canvas.offsetLeft + document.body.scrollLeft;
		var y = event.pageY - canvas.offsetTop + document.body.scrollTop;

		// scale based on ratio of canvas internal dimentions to css dimensions
		x *= canvas.width / canvas.style.width.substring(0, canvas.style.width.indexOf("p"));
		y *= canvas.height / canvas.style.height.substring(0, canvas.style.height.indexOf("p"));

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
	canvas.addEventListener("mousedown", function(event) {
		var m = relMouseCoords(event);
		that.x = m.x;
		that.y = m.y;
		that.buttons[event.button] = true;
	});
	canvas.addEventListener("mouseup", function(event) {
		var m = relMouseCoords(event);
		that.x = m.x;
		that.y = m.y;
		that.buttons[event.button] = false;
	});
	canvas.addEventListener("touchstart", function(event) {
		var touch = event.touches[0];
		var m = relMouseCoords(touch);
		that.x = m.x;
		that.y = m.y;
		that.buttons[0] = true;
	});
	canvas.addEventListener("touchend", function(event) {
		that.buttons[0] = false;
	});
}
MouseInput.prototype.supportsTouch = function() {
	return "ontouchstart" in window || navigator.msMaxTouchPoints;
};

function Animation() {
	this.frames = [];
	this.frame = 0;
	this.elapsedMillis = 0;
	this.repeatAt = 0;
	this.width = 0;
	this.height = 0;
}
Animation.prototype.add = function(img, time) {
	this.frames.push({img: img, time: time});
	if (frames.length === 0) {
		this.width = img.width;
		this.height = img.height;
	}
};
Animation.prototype.move = function(elapsedMillis) {
	this.elapsedMillis += elapsedMillis;
	while (this.elapsedMillis > this.frames[this.frame].time) {
		this.elapsedMillis -= this.frames[this.frame].time;
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
	this.elapsedMillis = 0;
};

function NinePatch(image) {
	this.img = image;
	var imgw = image.width - 1;
	var imgh = image.height - 1;

	var context = get_context_with_image(image);
	var firstDiv = imgw;
	var secondDiv = imgw;
	var pixel;
	var alpha;
	for (var x = 0; x < imgw; x++) {
		pixel = context.getImageData(x, imgh, 1, 1).data;
		alpha = pixel[3];
		if (firstDiv == imgw && alpha > 0) {
			firstDiv = x;
		}
		if (firstDiv < imgw && alpha === 0) {
			secondDiv = x;
			break;
		}
	}
	this.w1 = firstDiv;
	this.w2 = secondDiv - firstDiv;
	this.w3 = imgw - secondDiv;

	firstDiv = secondDiv = imgh;
	for (var y = 0; y < imgh; y++) {
		pixel = context.getImageData(imgw, y, 1, 1).data;
		alpha = pixel[3];
		if (firstDiv == imgh && alpha > 0) {
			firstDiv = y;
		}
		if (firstDiv < imgh && alpha === 0) {
			secondDiv = y;
			break;
		}
	}
	this.h1 = firstDiv;
	this.h2 = secondDiv - firstDiv;
	this.h3 = imgh - secondDiv;
}
NinePatch.prototype.draw = function(context, x, y, width, height) {
	x = x|0;
	y = y|0;
	width = width |0;
	height = height |0;
	var cx, cy, w, h;

	for (cy = y + this.h1; cy < y + height - this.h3; cy += this.h2) {
		for (cx = x + this.w1; cx < x + width - this.w3; cx += this.w2) {
			w = Math.min(this.w2, x + width - this.w3 - cx);
			h = Math.min(this.h2, y + height - this.h3 - cy);
			context.drawImage(this.img, this.w1, this.h1, w, h, cx, cy, w, h);
		}
	}
	for (cy = y + this.h1; cy < y + height - this.h3; cy += this.h2) {
		h = Math.min(this.h2, y + height - this.h3 - cy);
		if (this.w1 > 0) {
			context.drawImage(this.img, 0,                 this.h1, this.w1, h, x,                   cy, this.w1, h);
		}
		if (this.w3 > 0) {
			context.drawImage(this.img, this.w1 + this.w2, this.h1, this.w3, h, x + width - this.w3, cy, this.w3, h);
		}
	}
	for (cx = x + this.w1; cx < x + width - this.w3; cx += this.w2) {
		w = Math.min(this.w2, x + width - this.w3 - cx);
		if (this.h1 > 0) {
			context.drawImage(this.img, this.w1, 0,                 w, this.h1, cx, y,                    w, this.h1);
		}
		if (this.h3 > 0) {
			context.drawImage(this.img, this.w1, this.w1 + this.w2, w, this.h3, cx, y + height - this.h3, w, this.h3);
		}
	}
	if (this.w1 > 0 && this.h1 > 0) {
		context.drawImage(this.img, 0, 0, this.w1, this.h1, x, y, this.w1, this.h1);
	}
	if (this.w3 > 0 && this.h1 > 0) {
		context.drawImage(this.img, this.w1 + this.w2, 0, this.w3, this.h1, x + width - this.w3, y, this.w3, this.h1);
	}
	if (this.w1 > 0 && this.h3 > 0) {
		context.drawImage(this.img, 0, this.h1 + this.h2, this.w1, this.h3, x, y + height - this.h3, this.w1, this.h3);
	}
	if (this.w3 > 0 && this.h3 > 0) {
		context.drawImage(this.img, this.w1 + this.w2, this.h1 + this.h2, this.w3, this.h3, x + width - this.w3, y + height - this.h3, this.w3, this.h3);
	}
};

