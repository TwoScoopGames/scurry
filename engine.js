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
}

