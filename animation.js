var Splat = (function(splat, window, document) {

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

	splat.Animation = Animation;
	return splat;

}(Splat || {}, window, document));
