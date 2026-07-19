function CardDealer() {
	var that = this;

	this.shuffle = function(allCardsArr, rng) {
		var random = typeof rng === 'function' ? rng : Math.random;
		var i = allCardsArr.length;
		var j, t;
		while (i) {
			j = Math.floor((i--) * random());
			t = allCardsArr[i];
			allCardsArr[i] = allCardsArr[j];
			allCardsArr[j] = t;
		}
	};

	this.reUpload = function(allCardsArr) {
		var ul = document.createElement('ul');
		for (var i = 0; i < allCardsArr.length; i++) {
			var li = document.createElement('li');
			li.className = 'card closed';
			li.classList.add(allCardsArr[i]);
			li.dataset.card = allCardsArr[i];
			ul.appendChild(li);
		}
		cardDeckEl.innerHTML = ul.innerHTML;
	};

	this.delivery = function(n, opened, animation) {
		var cols = document.querySelectorAll('.wrapper .column');
		if (!cols.length) {
			cols = document.querySelectorAll('.column');
		}
		var c = 0;

		for (var i = 0; i < n; i++) {
			if (!cardDeckEl.lastElementChild || !cols.length) {
				break;
			}
			if (opened) {
				cardDeckEl.lastElementChild.classList.add('open');
				cardDeckEl.lastElementChild.classList.remove('closed');
			}

			if (animation) {
				animationAppendChild(cols[c], cardDeckEl.lastElementChild);
			} else {
				cardDeckEl.lastElementChild.removeAttribute('style');
				cols[c].appendChild(cardDeckEl.lastElementChild);
			}

			if (++c >= cols.length) {
				c = 0;
			}
		}
	};

	this.checkEmpty = function(elems) {
		for (var i = 0; i < elems.length; i++) {
			if (!elems[i].children[0]) {
				return true;
			}
		}
		return false;
	};

	this.checkStartDrag = function(target, selectors) {
		var parent = target.parentNode;

		if (!target.classList.contains('card')) {
			return false;
		}
		if (!target.classList.contains('open')) {
			return false;
		}
		if (parent.lastElementChild == target) {
			return true;
		}

		var sibling = target.nextElementSibling;
		var str = '';

		while (sibling) {
			str += ' + .' + sibling.dataset.card;
			sibling = sibling.nextElementSibling;
		}

		str = '.' + target.dataset.card + str;

		for (var k = 0; k < selectors.length; k++) {
			if (selectors[k].indexOf(str) !== -1) {
				return true;
			}
		}
		return false;
	};

	this.showCongratulation = function() {
		document.querySelector('.congratulation').style.display = 'block';
	};

	this.hideCongratulation = function() {
		document.querySelector('.congratulation').style.display = 'none';
	};

	this.hint = function(allCards, allPlaces, selectors) {
		this.hintCount = this.hintCount || 0;
		var emptyCols = [];
		var cols = document.querySelectorAll('.column');
		for (var e = 0; e < cols.length; e++) {
			if (!cols[e].children[0]) {
				emptyCols.push(cols[e]);
			}
		}

		var find = search(this.hintCount) || search(0);
		if (!find) {
			return false;
		}

		find[0].classList.add('backlight');
		setTimeout(function() {
			find[1].classList.add('backlight');
		}, 200);
		setTimeout(function() {
			find[0].classList.remove('backlight');
			find[1].classList.remove('backlight');
		}, 1500);

		function search(position) {
			for (var i = position; i < allCards.length; i++) {
				dealer.hintCount = i + 1;
				if (!dealer.checkStartDrag(allCards[i], selectors)) {
					continue;
				}
				var card1 = +allCards[i].dataset.card.slice(1);

				if (emptyCols.length) {
					Sound.play('audio/hint.mp3');
					return [allCards[i], emptyCols[0]];
				}

				for (var j = 0; j < allPlaces.length; j++) {
					if (allCards[i].parentNode == allPlaces[j].parentNode) {
						continue;
					}
					var card2 = +allPlaces[j].dataset.card.slice(1);
					if (card1 + 1 == card2) {
						Sound.play('audio/hint.mp3');
						return [allCards[i], allPlaces[j]];
					}
				}
			}
			return null;
		}

		return true;
	};

	this.showMessage = function(text, left, top) {
		if (document.getElementById('message1')) {
			return;
		}
		var el = document.createElement('div');
		el.innerHTML = text;
		el.setAttribute('id', 'message1');
		el.className = 'message';

		var x = typeof left === 'number' ? left : window.innerWidth / 2 - 120;
		var y = typeof top === 'number' ? top : 80;
		x = Math.max(10, Math.min(x, window.innerWidth - 260));
		y = Math.max(10, Math.min(y, window.innerHeight - 60));

		el.style.left = x + 'px';
		el.style.top = y + 'px';
		document.body.appendChild(el);
		setTimeout(function() {
			if (el.parentNode) {
				document.body.removeChild(el);
			}
		}, 2500);
	};

	this.showFaq = function() {
		document.getElementById('faq').style.left = '0%';
		document.querySelector('.faq-shadow').classList.add('visible');
	};

	this.closeFaq = function() {
		document.getElementById('faq').style.left = '-100%';
		document.querySelector('.faq-shadow').classList.remove('visible');
	};

	this.closeScoreBoard = function() {
		document.getElementById('scoreBoard').style.display = 'none';
	};

	this.getLimitHeight = function() {
		var panel = document.querySelector('.control-panel');
		var pad = document.body.classList.contains('short-play') || document.body.classList.contains('landscape-play') ? 8 : 12;
		if (panel && panel.style.display !== 'none') {
			var top = panel.getBoundingClientRect().top;
			if (isFinite(top) && top > 60) {
				return top - pad;
			}
		}
		return window.innerHeight - (document.body.classList.contains('short-play') ? 48 : 72);
	};

	this.setSuitedHeight = function(el, maxHeight) {
		el.dataset.height = '';
		var c = 1;
		var maxLevel = document.body.classList.contains('landscape-play') || document.body.classList.contains('short-play') ? 10 : 6;
		while (el.getBoundingClientRect().bottom > maxHeight) {
			el.dataset.height = c;
			if (++c > maxLevel) {
				break;
			}
		}
	};

	this.takeAway = function(selectors, dropoutEl, animation) {
		var coinc = [];

		for (var i = 0; i < selectors.length; i++) {
			var elems = document.querySelectorAll('.open' + cardDeck.selectors[i]);
			elems = Array.prototype.slice.call(elems);
			coinc = coinc.concat(elems);
		}

		while (coinc[0]) {
			var p = coinc.pop().parentNode;

			for (var j = 12; j >= 0; j--) {
				if (animation) {
					animationAppendChild(dropoutEl, p.lastElementChild);
				} else {
					dropoutEl.appendChild(p.lastElementChild);
				}
				if (p.children[0]) {
					p.lastElementChild.classList.add('open');
					p.lastElementChild.classList.remove('closed');
				}
			}
		}
	};
}
