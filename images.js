var Splat = (function(splat, window) {

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

		function makeFrame(img, frameWidth, f) {
			return splat.makeBuffer(frameWidth, img.height, function(ctx) {
				var sx = f * frameWidth;
				ctx.drawImage(img, sx, 0, frameWidth, img.height, 0, 0, frameWidth, img.height);
			});
		}
		var img = new Image();
		var that = this;
		img.addEventListener("load", function() {
			that.loadedImages++;

			if (numFrames == 1) {
				that.images[name] = img;
			} else {
				var frameWidth = img.width / numFrames;
				for (var f = 0; f < numFrames; f++) {
					that.images[name + f] = makeFrame(img, frameWidth, f);
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

	splat.images = new ImageLoader();
	return splat;

}(Splat || {}, window));
