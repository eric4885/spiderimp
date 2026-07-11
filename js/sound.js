var Sound = (function() {
	var cache = {};
	var bgMusic = null;
	var muted = false;
	var volume = 0.6;

	try {
		muted = localStorage.getItem('spiderimp_muted') === '1';
		var savedVol = localStorage.getItem('spiderimp_volume');
		if (savedVol !== null) {
			var parsed = parseFloat(savedVol);
			if (!isNaN(parsed)) {
				volume = Math.max(0, Math.min(1, parsed));
			}
		}
	} catch (e) {}

	function applyVolume(audio) {
		if (!audio) {
			return;
		}
		audio.volume = muted ? 0 : volume;
	}

	function applyAllVolumes() {
		Object.keys(cache).forEach(function(key) {
			applyVolume(cache[key]);
		});
	}

	function getAudio(src) {
		if (!cache[src]) {
			var audio = document.createElement('audio');
			audio.src = src;
			audio.setAttribute('preload', 'auto');
			audio.style.display = 'none';
			document.body.appendChild(audio);
			cache[src] = audio;
		}
		applyVolume(cache[src]);
		return cache[src];
	}

	return {
		isMuted: function() {
			return muted;
		},
		getVolume: function() {
			return volume;
		},
		setVolume: function(value) {
			volume = Math.max(0, Math.min(1, Number(value) || 0));
			try {
				localStorage.setItem('spiderimp_volume', String(volume));
			} catch (e) {}
			if (volume > 0 && muted) {
				muted = false;
				try {
					localStorage.setItem('spiderimp_muted', '0');
				} catch (e2) {}
			}
			applyAllVolumes();
		},
		setMuted: function(value) {
			muted = !!value;
			try {
				localStorage.setItem('spiderimp_muted', muted ? '1' : '0');
			} catch (e) {}
			if (muted) {
				this.stopBgMusic();
			}
			applyAllVolumes();
		},
		toggleMute: function() {
			this.setMuted(!muted);
			return muted;
		},
		play: function(src) {
			if (muted || volume <= 0) {
				return;
			}
			var audio = getAudio(src);
			audio.currentTime = 0;
			var p = audio.play();
			if (p && p.catch) {
				p.catch(function() {});
			}
		},
		playBgMusic: function(src) {
			if (muted || volume <= 0) {
				return;
			}
			bgMusic = getAudio(src);
			bgMusic.loop = true;
			var p = bgMusic.play();
			if (p && p.catch) {
				p.catch(function() {});
			}
		},
		stopBgMusic: function() {
			if (bgMusic) {
				bgMusic.pause();
				bgMusic.currentTime = 0;
			}
		}
	};
})();
