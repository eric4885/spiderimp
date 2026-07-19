var AppModal = (function() {
	var modal = null;
	var textEl = null;
	var okBtn = null;
	var cancelBtn = null;
	var resolveFn = null;

	function ensure() {
		modal = document.getElementById('app-modal');
		textEl = document.getElementById('app-modal-text');
		okBtn = document.getElementById('app-modal-ok');
		cancelBtn = document.getElementById('app-modal-cancel');
		if (!okBtn._bound) {
			okBtn._bound = true;
			okBtn.onclick = function() {
				close(true);
			};
			cancelBtn.onclick = function() {
				close(false);
			};
		}
	}

	function close(result) {
		ensure();
		if (!modal || modal.style.display === 'none') {
			return;
		}
		modal.style.display = 'none';
		if (typeof resumeGameTimer === 'function') {
			resumeGameTimer();
		}
		if (resolveFn) {
			var fn = resolveFn;
			resolveFn = null;
			fn(!!result);
		}
	}

	function open() {
		ensure();
		if (typeof pauseGameTimer === 'function') {
			pauseGameTimer();
		}
		modal.style.display = 'flex';
	}

	return {
		confirm: function(message) {
			ensure();
			textEl.textContent = message;
			cancelBtn.style.display = '';
			okBtn.textContent = 'OK';
			open();
			return new Promise(function(resolve) {
				resolveFn = resolve;
			});
		},
		alert: function(message) {
			ensure();
			textEl.textContent = message;
			cancelBtn.style.display = 'none';
			okBtn.textContent = 'OK';
			open();
			return new Promise(function(resolve) {
				resolveFn = function() {
					resolve(true);
				};
			});
		},
		isOpen: function() {
			ensure();
			return !!(modal && modal.style.display === 'flex');
		},
		dismiss: function(result) {
			close(result === true);
		}
	};
})();

var GameStats = (function() {
	var KEY = 'spiderimp_stats_v1';

	function loadAll() {
		try {
			return JSON.parse(localStorage.getItem(KEY) || '{}');
		} catch (e) {
			return {};
		}
	}

	function saveAll(data) {
		try {
			localStorage.setItem(KEY, JSON.stringify(data));
		} catch (e) {}
	}

	function ensureMode(data, mode) {
		if (!data[mode]) {
			data[mode] = { played: 0, won: 0, totalMoves: 0, totalTime: 0 };
		}
		return data[mode];
	}

	return {
		recordStart: function(mode) {
			var data = loadAll();
			var s = ensureMode(data, mode);
			s.played += 1;
			saveAll(data);
		},
		recordWin: function(mode, movesCount, seconds) {
			var data = loadAll();
			var s = ensureMode(data, mode);
			s.won += 1;
			s.totalMoves += movesCount || 0;
			s.totalTime += seconds || 0;
			saveAll(data);
		},
		get: function(mode) {
			var data = loadAll();
			return ensureMode(data, String(mode));
		}
	};
})();

var DailyChallenge = (function() {
	var KEY = 'spiderimp_daily_v1';

	function pad(n) {
		return n < 10 ? '0' + n : String(n);
	}

	function loadAll() {
		try {
			return JSON.parse(localStorage.getItem(KEY) || '{}');
		} catch (e) {
			return {};
		}
	}

	function saveAll(data) {
		try {
			localStorage.setItem(KEY, JSON.stringify(data));
		} catch (e) {}
	}

	function hashSeed(str) {
		var h = 2166136261;
		for (var i = 0; i < str.length; i++) {
			h ^= str.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return h >>> 0;
	}

	return {
		todayKey: function() {
			var d = new Date();
			return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
		},
		seedFor: function(dateKey, mode) {
			return hashSeed('spiderimp-daily|' + dateKey + '|' + String(mode));
		},
		mulberry32: function(seed) {
			var a = seed >>> 0;
			return function() {
				a |= 0;
				a = (a + 0x6d2b79f5) | 0;
				var t = Math.imul(a ^ (a >>> 15), 1 | a);
				t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
				return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
			};
		},
		getBest: function(dateKey, mode) {
			var data = loadAll();
			var day = data[dateKey];
			if (!day) {
				return null;
			}
			return day[String(mode)] || null;
		},
		recordWin: function(dateKey, mode, movesCount, seconds) {
			var data = loadAll();
			if (!data[dateKey]) {
				data[dateKey] = {};
			}
			var key = String(mode);
			var prev = data[dateKey][key];
			var next = {
				moves: movesCount || 0,
				time: seconds || 0,
				won: true,
				completedAt: Date.now()
			};
			if (!prev || !prev.won) {
				data[dateKey][key] = next;
				saveAll(data);
				return { best: next, isNewBest: true };
			}
			var better = next.moves < prev.moves ||
				(next.moves === prev.moves && next.time < (prev.time || 0));
			if (better) {
				data[dateKey][key] = next;
				saveAll(data);
				return { best: next, isNewBest: true };
			}
			return { best: prev, isNewBest: false };
		},
		formatShortDate: function(dateKey) {
			if (!dateKey || dateKey.length < 10) {
				return dateKey || '';
			}
			var parts = dateKey.split('-');
			var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			var mi = parseInt(parts[1], 10) - 1;
			return (months[mi] || parts[1]) + ' ' + parseInt(parts[2], 10);
		}
	};
})();

var GameSave = (function() {
	var KEY = 'spiderimp_save_v1';

	return {
		has: function() {
			try {
				return !!localStorage.getItem(KEY);
			} catch (e) {
				return false;
			}
		},
		clear: function() {
			try {
				localStorage.removeItem(KEY);
			} catch (e) {}
		},
		save: function(payload) {
			try {
				localStorage.setItem(KEY, JSON.stringify(payload));
			} catch (e) {}
		},
		load: function() {
			try {
				var raw = localStorage.getItem(KEY);
				return raw ? JSON.parse(raw) : null;
			} catch (e) {
				return null;
			}
		}
	};
})();

function updateProgressUI() {
	var completed = Math.floor((dropout && dropout.children.length) / 13) || 0;
	var dealsLeft = Math.ceil(((cardDeckEl && cardDeckEl.children.length) || 0) / 10);
	var completedText = 'Completed ' + completed + '/8';
	var dealsText = 'Deals left ' + dealsLeft;

	var c1 = document.getElementById('completed-count');
	var d1 = document.getElementById('deals-left');
	var d2 = document.getElementById('deals-label-count');
	if (c1) {
		c1.textContent = completedText;
	}
	if (d1) {
		d1.textContent = dealsText;
	}
	if (d2) {
		d2.textContent = String(dealsLeft);
	}

	var badges = document.getElementById('progress-badges');
	if (badges && cardDeck) {
		badges.style.display = 'flex';
	}
}

function clearMoveHighlights() {
	var cols = document.querySelectorAll('.column');
	for (var i = 0; i < cols.length; i++) {
		cols[i].classList.remove('drop-target', 'drop-target-empty', 'drop-target-stack');
	}
	var selected = document.querySelectorAll('.card.card-selected');
	for (var j = 0; j < selected.length; j++) {
		selected[j].classList.remove('card-selected');
	}
	var landing = document.querySelectorAll('.card.drop-landing');
	for (var k = 0; k < landing.length; k++) {
		landing[k].classList.remove('drop-landing');
	}
}

function getValidDropColumns(cardEl) {
	if (!cardEl || !cardDeck) {
		return [];
	}
	var cardNum = +cardEl.dataset.card.slice(1);
	var sourceCol = cardEl.parentNode;
	var cols = document.querySelectorAll('.column');
	var valid = [];
	for (var i = 0; i < cols.length; i++) {
		var col = cols[i];
		if (col === sourceCol) {
			continue;
		}
		if (!col.children[0]) {
			valid.push(col);
			continue;
		}
		var top = col.lastElementChild;
		if (top && top.classList.contains('open')) {
			var topNum = +top.dataset.card.slice(1);
			if (cardNum + 1 === topNum) {
				valid.push(col);
			}
		}
	}
	return valid;
}

function highlightValidDrops(cardEl) {
	clearMoveHighlights();
	if (cardEl) {
		cardEl.classList.add('card-selected');
	}
	var valid = getValidDropColumns(cardEl);
	for (var i = 0; i < valid.length; i++) {
		var col = valid[i];
		col.classList.add('drop-target');
		if (!col.children[0]) {
			col.classList.add('drop-target-empty');
		} else {
			col.classList.add('drop-target-stack');
			var land = col.lastElementChild;
			if (land) {
				land.classList.add('drop-landing');
			}
		}
	}
	return valid;
}

function canPlaceOnColumn(cardEl, column) {
	if (!cardEl || !column) {
		return false;
	}
	if (cardEl.parentNode === column) {
		return false;
	}
	if (!column.children[0]) {
		return true;
	}
	var top = column.lastElementChild;
	if (!top || !top.classList.contains('open')) {
		return false;
	}
	return +cardEl.dataset.card.slice(1) + 1 === +top.dataset.card.slice(1);
}

function moveCardStackToColumn(cardEl, targetCol) {
	if (!canPlaceOnColumn(cardEl, targetCol)) {
		return false;
	}
	UndoHistory.pushNow();
	var sourceCol = cardEl.parentNode;
	var moving = [];
	var node = cardEl;
	while (node) {
		moving.push(node);
		node = node.nextElementSibling;
	}
	for (var i = 0; i < moving.length; i++) {
		targetCol.appendChild(moving[i]);
	}
	if (sourceCol.children[0]) {
		sourceCol.lastElementChild.classList.add('open');
		sourceCol.lastElementChild.classList.remove('closed');
	}
	noOfMoves++;
	moves.innerHTML = noOfMoves;
	Sound.play('audio/pop.mp3');
	dealer.takeAway(cardDeck.selectors, dropout, true);
	applyColumnHeights();
	updateProgressUI();
	clearMoveHighlights();
	CardSelect.clear();
	persistGame();
	if (dropout.children.length === 104 && typeof window.onGameWon === 'function') {
		window.onGameWon();
	} else if (typeof checkDeadEndHint === 'function') {
		checkDeadEndHint();
	}
	return true;
}

var CardSelect = (function() {
	var selected = null;

	return {
		get: function() {
			return selected;
		},
		clear: function() {
			selected = null;
			clearMoveHighlights();
		},
		set: function(cardEl) {
			if (!cardEl || !dealer.checkStartDrag(cardEl, cardDeck.selectors)) {
				this.clear();
				return;
			}
			selected = cardEl;
			highlightValidDrops(cardEl);
		},
		toggle: function(cardEl) {
			if (selected === cardEl) {
				this.clear();
				return;
			}
			this.set(cardEl);
		}
	};
})();

function hasAnyLegalMove() {
	if (!cardDeck) {
		return false;
	}
	var cols = document.querySelectorAll('.column');
	var emptyCols = [];
	var tops = [];
	for (var i = 0; i < cols.length; i++) {
		if (!cols[i].children[0]) {
			emptyCols.push(cols[i]);
		} else if (cols[i].lastElementChild.classList.contains('open')) {
			tops.push(cols[i].lastElementChild);
		}
	}

	var openCards = document.querySelectorAll('.column .card.open');
	for (var a = 0; a < openCards.length; a++) {
		var card = openCards[a];
		if (!dealer.checkStartDrag(card, cardDeck.selectors)) {
			continue;
		}
		if (emptyCols.length) {
			return true;
		}
		var num = +card.dataset.card.slice(1);
		for (var t = 0; t < tops.length; t++) {
			if (tops[t].parentNode === card.parentNode) {
				continue;
			}
			if (num + 1 === +tops[t].dataset.card.slice(1)) {
				return true;
			}
		}
	}
	return false;
}

function countCardsInHtml(html) {
	var matches = (html || '').match(/class="[^"]*\bcard\b/g);
	return matches ? matches.length : 0;
}

function countColumnCardsFromDom() {
	var cols = document.querySelectorAll('.wrapper .column');
	var total = 0;
	for (var i = 0; i < cols.length; i++) {
		total += cols[i].querySelectorAll('.card').length;
	}
	return total;
}

function countSavedColumnCards(save) {
	if (!save || !save.columnsHtml) {
		return 0;
	}
	var total = 0;
	for (var i = 0; i < save.columnsHtml.length; i++) {
		total += countCardsInHtml(save.columnsHtml[i]);
	}
	return total;
}

function countSavedCards(save) {
	if (!save) {
		return 0;
	}
	var total = countSavedColumnCards(save);
	total += countCardsInHtml(save.sourceHtml);
	total += countCardsInHtml(save.dropoutHtml);
	return total;
}

function isValidSave(save) {
	// Must have a real tableau — all-in-stock saves look like empty boards on Resume
	return !!(save && countSavedColumnCards(save) >= 40 && countSavedCards(save) >= 54);
}

function persistGame() {
	if (!cardDeck) {
		GameSave.clear();
		return;
	}
	revealAllCards();
	if (countColumnCardsFromDom() < 10) {
		return;
	}
	var cols = document.querySelectorAll('.wrapper .column');
	var columnsHtml = [];
	for (var i = 0; i < cols.length; i++) {
		columnsHtml.push(cleanCardHtml(cols[i].innerHTML));
	}
	GameSave.save({
		mode: currentMode,
		moves: noOfMoves,
		time: timer ? timer.getTotalSeconds() : 0,
		columnsHtml: columnsHtml,
		sourceHtml: cleanCardHtml(cardDeckEl.innerHTML),
		dropoutHtml: cleanCardHtml(dropout.innerHTML),
		radioBtnValue: cardDeck.radioBtnValue,
		selectors: cardDeck.selectors,
		cards: cardDeck.getCards(),
		gameType: gameSession && gameSession.type ? gameSession.type : 'random',
		dailyDate: gameSession && gameSession.date ? gameSession.date : null,
		dailySeed: gameSession && typeof gameSession.seed === 'number' ? gameSession.seed : null
	});
}

function cleanCardHtml(html) {
	if (!html) {
		return '';
	}
	// Must use <ul>: browsers drop <li> when parsed inside a <div>
	var wrap = document.createElement('ul');
	wrap.innerHTML = html;
	var nodes = wrap.querySelectorAll('.card');
	for (var i = 0; i < nodes.length; i++) {
		nodes[i].removeAttribute('style');
		nodes[i].classList.remove('ghost');
	}
	return wrap.innerHTML;
}

function scaleGameStage() {
	var vw = window.innerWidth;
	var vh = window.innerHeight;
	if (window.visualViewport) {
		vw = Math.min(vw, window.visualViewport.width);
		vh = Math.min(vh, window.visualViewport.height);
	}

	var landscape = vw >= vh;
	var shortPlay = vh < 520;
	var narrowPlay = vw < 720;
	// Phone landscape: always use the compact chrome layout
	var landscapePlay = landscape && (shortPlay || vw < 1100);

	document.body.classList.toggle('landscape-play', landscapePlay);
	document.body.classList.toggle('short-play', shortPlay);
	document.body.classList.toggle('narrow-play', narrowPlay);

	var topbar = document.getElementById('game-topbar');
	var panel = document.querySelector('.control-panel');
	var topChrome;
	var bottomChrome;

	if (topbar && topbar.style.display !== 'none' && topbar.offsetHeight) {
		topChrome = Math.ceil(topbar.getBoundingClientRect().bottom) + (landscapePlay ? 1 : shortPlay ? 2 : 6);
	} else if (landscapePlay) {
		topChrome = 34;
	} else if (shortPlay) {
		topChrome = 42;
	} else if (narrowPlay) {
		topChrome = 96;
	} else {
		topChrome = 56;
	}

	if (panel && panel.style.display !== 'none' && panel.offsetHeight) {
		var panelTop = panel.getBoundingClientRect().top;
		bottomChrome = Math.max(landscapePlay ? 28 : 36, Math.ceil(vh - panelTop) + (landscapePlay ? 4 : 8));
	} else {
		bottomChrome = landscapePlay ? 32 : shortPlay ? 42 : 64;
	}

	// Design height: stock row + tableau. Landscape uses a much shorter stock strip.
	var designH = 620;
	if (landscapePlay) {
		designH = 400;
	} else if (shortPlay) {
		designH = 560;
	}

	var padX = narrowPlay ? 4 : 12;
	var scaleW = (vw - padX * 2) / 1000;
	var availH = Math.max(120, vh - topChrome - bottomChrome);
	var scaleH = availH / designH;
	var scale = Math.min(scaleW, scaleH, 1.15);
	if (!isFinite(scale) || scale <= 0) {
		scale = Math.max(0.28, scaleW);
	}
	// Never wider than the screen (old 0.42 floor clipped first/last columns on phones).
	scale = Math.min(scale, scaleW);
	// In landscape, prefer fitting height even if sides get a little empty space
	if (landscapePlay) {
		scale = Math.min(scale, scaleH);
	}
	scale = Math.max(0.28, Math.min(1.15, scale));

	var uiScale = Math.max(0.55, Math.min(1, landscapePlay ? Math.min(scale, 0.78) : shortPlay ? Math.min(scale, 0.88) : scale));
	document.documentElement.style.setProperty('--board-scale', String(scale));
	document.documentElement.style.setProperty('--ui-scale', String(uiScale));
	document.documentElement.style.setProperty('--playfield-top', topChrome + 'px');
	document.body.classList.toggle('compact-ui', scale < 0.92 || narrowPlay || shortPlay || landscapePlay);

	if (!scaleGameStage._raf) {
		scaleGameStage._raf = window.requestAnimationFrame(function() {
			scaleGameStage._raf = 0;
			refineGameStageScale();
			if (cardDeck && typeof applyColumnHeights === 'function') {
				applyColumnHeights();
			}
		});
	}
}

function refineGameStageScale() {
	var topbar = document.getElementById('game-topbar');
	var panel = document.querySelector('.control-panel');
	var vh = window.innerHeight;
	var vw = window.innerWidth;
	if (window.visualViewport) {
		vw = Math.min(vw, window.visualViewport.width);
		vh = Math.min(vh, window.visualViewport.height);
	}
	if (topbar && topbar.style.display !== 'none' && topbar.offsetHeight) {
		var topChrome = Math.ceil(topbar.getBoundingClientRect().bottom) + (document.body.classList.contains('landscape-play') ? 1 : vh < 500 ? 2 : 6);
		document.documentElement.style.setProperty('--playfield-top', topChrome + 'px');
	}
	var playfield = document.getElementById('playfield');
	if (!playfield || playfield.offsetParent === null) {
		return;
	}
	var rect = playfield.getBoundingClientRect();
	var cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--board-scale')) || 1;
	var next = cur;
	if (rect.width > vw - 2) {
		next = Math.min(next, cur * ((vw - 6) / rect.width));
	}
	// Keep tableau above the bottom control bar (critical in landscape)
	if (panel && panel.style.display !== 'none' && panel.offsetHeight) {
		var panelTop = panel.getBoundingClientRect().top;
		var fieldTop = rect.top;
		var fieldBottom = rect.bottom;
		var avail = panelTop - fieldTop - 6;
		var used = fieldBottom - fieldTop;
		if (used > 0 && avail > 100 && fieldBottom > panelTop - 4) {
			next = Math.min(next, cur * (avail / used));
		}
	}
	next = Math.max(0.28, Math.min(1.15, next));
	if (Math.abs(next - cur) > 0.005) {
		document.documentElement.style.setProperty('--board-scale', String(next));
	}
}

if (window.visualViewport) {
	window.visualViewport.addEventListener('resize', function() {
		scaleGameStage();
		if (cardDeck && typeof applyColumnHeights === 'function') {
			applyColumnHeights();
		}
	});
}

window.addEventListener('orientationchange', function() {
	window.setTimeout(function() {
		scaleGameStage();
		if (cardDeck && typeof applyColumnHeights === 'function') {
			applyColumnHeights();
		}
	}, 120);
});

function renderStats(mode) {
	var body = document.getElementById('stats-body');
	if (!body) {
		return;
	}
	var s = GameStats.get(mode);
	var winRate = s.played ? Math.round((s.won / s.played) * 100) : 0;
	var avgMoves = s.won ? Math.round(s.totalMoves / s.won) : '—';
	var avgTime = s.won ? formatSeconds(Math.round(s.totalTime / s.won)) : '—';
	body.innerHTML =
		'<div class="stats-row"><span>Games played</span><strong>' + s.played + '</strong></div>' +
		'<div class="stats-row"><span>Games won</span><strong>' + s.won + '</strong></div>' +
		'<div class="stats-row"><span>Win rate</span><strong>' + winRate + '%</strong></div>' +
		'<div class="stats-row"><span>Avg moves (wins)</span><strong>' + avgMoves + '</strong></div>' +
		'<div class="stats-row"><span>Avg time (wins)</span><strong>' + avgTime + '</strong></div>';
}

function formatSeconds(total) {
	var m = Math.floor(total / 60);
	var s = total % 60;
	return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

var stuckPanelOpen = false;

function showStuckPanel() {
	var panel = document.getElementById('stuck-modal');
	if (!panel || stuckPanelOpen || !cardDeck) {
		return;
	}
	stuckPanelOpen = true;
	if (typeof pauseGameTimer === 'function') {
		pauseGameTimer();
	}
	panel.style.display = 'flex';
}

function hideStuckPanel(resumeTimer) {
	var panel = document.getElementById('stuck-modal');
	if (panel) {
		panel.style.display = 'none';
	}
	stuckPanelOpen = false;
	if (resumeTimer !== false && typeof resumeGameTimer === 'function') {
		resumeGameTimer();
	}
}

function checkDeadEndHint() {
	if (!cardDeck || hasAnyLegalMove()) {
		return;
	}
	if (cardDeckEl && cardDeckEl.children.length) {
		dealer.showMessage('No tableau moves — try Deal', window.innerWidth / 2 - 100, 100);
		return;
	}
	if (dropout && dropout.children.length < 104) {
		showStuckPanel();
	}
}

function getSelectedDifficulty() {
	var radios = document.forms.startGame.radioBtn;
	for (var i = 0; i < radios.length; i++) {
		if (radios[i].checked) {
			return radios[i].value;
		}
	}
	return '1';
}
