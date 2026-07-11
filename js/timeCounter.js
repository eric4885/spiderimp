function TimeCounter() {
	this.minutesLabel = document.getElementById('minutes');
	this.secondsLabel = document.getElementById('seconds');
	this.totalSeconds = 0;
	this.paused = false;
	var that = this;

	this.pad = function(val) {
		var valString = val + '';
		if (valString.length < 2) {
			return '0' + valString;
		}
		return valString;
	};

	this.setTime = function() {
		if (that.paused) {
			return;
		}
		++that.totalSeconds;
		that.secondsLabel.innerHTML = that.pad(that.totalSeconds % 60);
		that.minutesLabel.innerHTML = that.pad(parseInt(that.totalSeconds / 60, 10));
	};

	this.reset = function() {
		this.totalSeconds = 0;
		this.paused = false;
		this.minutesLabel.innerHTML = '00';
		this.secondsLabel.innerHTML = '00';
	};

	this.getTotalSeconds = function() {
		return this.totalSeconds;
	};

	this.getTimeString = function() {
		return this.pad(parseInt(this.totalSeconds / 60, 10)) + ':' + this.pad(this.totalSeconds % 60);
	};
}
