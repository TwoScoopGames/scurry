var Splat = (function(splat, window, document) {

	function Scene(canvas, simulationFunc, drawFunc) {
		var context = canvas.getContext("2d");
		var lastTimestamp = -1;
		var running = false;
		var that = this;

		this.camera = new Splat.Camera(0, 0, canvas.width, canvas.height);
		this.showFrameRate = true;

		function drawFrameRate(elapsedMillis) {
			var fps = (1000 / elapsedMillis) |0;

			context.font = "24px mono";
			if (fps < 30) {
				context.fillStyle = "#ff0000";
			} else if (fps < 50) {
				context.fillStyle = "#ffff00";
			} else {
				context.fillStyle = "#00ff00";
			}
			var msg = fps + " FPS";
			var w = context.measureText(msg).width;
			that.camera.drawAbsolute(context, function() {
				context.fillText(msg, canvas.width - w - 50, 50);
			});
		}

		function mainLoop(timestamp) {
			if (lastTimestamp === -1) {
				lastTimestamp = timestamp;
			}
			var elapsedMillis = timestamp - lastTimestamp;
			lastTimestamp = timestamp;

			simulationFunc(elapsedMillis);
			that.camera.move(elapsedMillis);

			context.save();
			that.camera.draw(context);
			drawFunc(context);

			if (that.showFrameRate) {
				drawFrameRate(elapsedMillis);
			}

			context.restore();

			if (running) {
				window.requestAnimationFrame(mainLoop);
			}
		}

		this.start = function() {
			running = true;
			window.requestAnimationFrame(mainLoop);
		};

		this.stop = function() {
			running = false;
		};
	}

	function loadAssets(assetLoader, assets) {
		for (var key in assets) {
			if (assets.hasOwnProperty(key)) {
				assetLoader.load(key, assets[key]);
			}
		}
	}
	function Game(canvas, manifest) {
		this.mouse = new splat.MouseInput(canvas);
		this.keyboard = new splat.KeyboardInput(splat.keyMap.US);

		this.images = new splat.ImageLoader();
		loadAssets(this.images, manifest.images);
		this.sounds = new splat.SoundLoader();
		loadAssets(this.sounds, manifest.sounds);

		var that = this;
		this.isLoaded = function() {
			return this.images.allLoaded() && this.sounds.allLoaded();
		};
	}

	splat.Scene = Scene;
	splat.Game = Game;
	return splat;

}(Splat || {}, window, document));
