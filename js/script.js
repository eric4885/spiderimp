var cardDeckEl = document.getElementById('source');
var dropout = document.getElementById('dropout');
var dragObj = new DragEvents();
var dealer = new CardDealer();
var timeKeeper = 0;
var noOfMoves = 0;
var limitHeight;
var cardDeck;
var timer;
var currentMode = '1';
var scoreBoardMode = '1';
var statsMode = '1';
var moves = document.getElementById('score');
var highScores = document.querySelector('ol#high-scores');
var scoreBoard = document.getElementById('scoreBoard');
var statsBoard = document.getElementById('statsBoard');
var modeBadge = document.getElementById('mode-badge');
var soundToggle = document.getElementById('sound-toggle');
var volumeSlider = document.getElementById('volume-slider');
var gameStartedCounted = false;
var gameSession = { type: 'random' };
var lastDailyWinMeta = null;

var MODE_LABELS = {
	'1': '1 Suit',
	'2': '2 Suits',
	'4': '4 Suits'
};

function scoreKey(mode) {
	return 'spiderimp_scores_' + mode;
}

window.addEventListener('resize', function() {
	scaleGameStage();
	if (cardDeck) {
		applyColumnHeights();
	}
});

function applyColumnHeights() {
	limitHeight = dealer.getLimitHeight();
	var cols = typeof getTableauColumns === 'function' ? getTableauColumns() : document.querySelectorAll('.wrapper .column');
	for (var i = 0; i < cols.length; i++) {
		dealer.setSuitedHeight(cols[i], limitHeight);
	}
}

function resetTimer(seconds) {
	clearInterval(timeKeeper);
	timeKeeper = 0;
	timer = new TimeCounter();
	timer.reset();
	if (seconds) {
		timer.totalSeconds = seconds;
		timer.secondsLabel.innerHTML = timer.pad(seconds % 60);
		timer.minutesLabel.innerHTML = timer.pad(parseInt(seconds / 60, 10));
	}
	timerPauseDepth = 0;
	timeKeeper = setInterval(timer.setTime, 1000);
}

var timerPauseDepth = 0;
var gamePaused = false;

function pauseGameTimer() {
	if (!timer || !cardDeck) {
		return;
	}
	timerPauseDepth++;
	timer.paused = true;
}

function resumeGameTimer() {
	if (!timer || !cardDeck) {
		timerPauseDepth = 0;
		return;
	}
	timerPauseDepth = Math.max(0, timerPauseDepth - 1);
	if (timerPauseDepth === 0) {
		timer.paused = false;
	}
}

function clearPauseUI() {
	gamePaused = false;
	var overlay = document.getElementById('pause-overlay');
	if (overlay) {
		overlay.style.display = 'none';
	}
	var btn = document.getElementById('btn-pause');
	if (btn) {
		btn.textContent = 'Pause';
	}
}

function setGamePaused(paused) {
	if (!cardDeck) {
		return;
	}
	paused = !!paused;
	if (paused === gamePaused) {
		return;
	}
	gamePaused = paused;
	var overlay = document.getElementById('pause-overlay');
	var btn = document.getElementById('btn-pause');
	if (paused) {
		pauseGameTimer();
		if (overlay) {
			overlay.style.display = 'flex';
		}
		if (btn) {
			btn.textContent = 'Resume';
		}
	} else {
		if (overlay) {
			overlay.style.display = 'none';
		}
		if (btn) {
			btn.textContent = 'Pause';
		}
		resumeGameTimer();
	}
}

function toggleGamePause() {
	if (!cardDeck) {
		return;
	}
	setGamePaused(!gamePaused);
}

function updateModeBadge() {
	modeBadge.style.display = 'block';
	if (gameSession && gameSession.type === 'daily') {
		modeBadge.textContent = 'Daily · ' + DailyChallenge.formatShortDate(gameSession.date) +
			' · ' + (MODE_LABELS[currentMode] || currentMode);
		modeBadge.classList.add('daily-badge');
	} else {
		modeBadge.textContent = 'Mode: ' + (MODE_LABELS[currentMode] || currentMode);
		modeBadge.classList.remove('daily-badge');
	}
}

function refreshDailyStatus() {
	var el = document.getElementById('daily-status');
	var dailyBtn = document.getElementById('daily-btn');
	if (typeof DailyChallenge === 'undefined') {
		return;
	}
	var dateKey = DailyChallenge.todayKey();
	var mode = menuDifficulty || getSelectedDifficulty() || '1';
	var best = DailyChallenge.getBest(dateKey, mode);
	var modeLabel = MODE_LABELS[mode] || mode;
	if (el) {
		if (best && best.won) {
			var mins = Math.floor((best.time || 0) / 60);
			var secs = (best.time || 0) % 60;
			var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
			el.textContent = 'Today\'s daily (' + modeLabel + ') best: ' + best.moves + ' moves · ' + timeStr;
		} else {
			el.textContent = 'Daily Challenge · ' + DailyChallenge.formatShortDate(dateKey) +
				' · ' + modeLabel + ' — same deal for everyone today';
		}
	}
	if (dailyBtn) {
		if (best && best.won) {
			dailyBtn.classList.add('beaten');
			dailyBtn.textContent = 'Daily ✓ Beat today';
			dailyBtn.title = 'Play again to improve today\'s best';
		} else {
			dailyBtn.classList.remove('beaten');
			dailyBtn.textContent = 'Daily Challenge';
			dailyBtn.title = 'Same deal for everyone today';
		}
	}
}

function setRandomSession() {
	gameSession = { type: 'random' };
	lastDailyWinMeta = null;
}

function setDailySession(mode) {
	var dateKey = DailyChallenge.todayKey();
	gameSession = {
		type: 'daily',
		date: dateKey,
		mode: String(mode),
		seed: DailyChallenge.seedFor(dateKey, mode)
	};
	lastDailyWinMeta = null;
}

function updateSoundButton() {
	var muted = Sound.isMuted() || Sound.getVolume() <= 0;
	soundToggle.textContent = muted ? '🔇' : '🔊';
	soundToggle.title = muted ? 'Unmute' : 'Mute';
	soundToggle.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
	if (volumeSlider) {
		volumeSlider.value = String(Math.round(Sound.getVolume() * 100));
	}
}

function forceScrollTop() {
	window.scrollTo(0, 0);
	document.documentElement.scrollTop = 0;
	document.body.scrollTop = 0;
	if (document.scrollingElement) {
		document.scrollingElement.scrollTop = 0;
	}
}

function setMenuMode(isMenu) {
	forceScrollTop();
	document.body.classList.toggle('menu-mode', !!isMenu);
	document.body.classList.toggle('playing', !isMenu);
	document.documentElement.classList.toggle('playing-lock', !isMenu);
	var seo = document.getElementById('seo-content');
	if (seo) {
		seo.style.display = isMenu ? '' : 'none';
	}
	forceScrollTop();
}

function clearBoard() {
	dropout.innerHTML = '';
	var cols = document.querySelectorAll('.wrapper .column');
	for (var i = 0; i < cols.length; i++) {
		cols[i].innerHTML = '';
		cols[i].removeAttribute('data-height');
	}
}

function showGameChrome() {
	setMenuMode(false);
	forceScrollTop();
	var wrapper = document.querySelector('.wrapper');
	var offside = document.querySelector('.offside');
	var panel = document.querySelector('.control-panel');
	var topbar = document.getElementById('game-topbar');
	wrapper.style.display = 'block';
	offside.style.display = 'block';
	panel.style.display = 'block';
	panel.classList.remove('opaque');
	if (topbar) {
		topbar.style.display = 'flex';
	}
	document.getElementById('progress-badges').style.display = 'flex';
	clearPauseUI();
	updateModeBadge();
	scaleGameStage();
	void wrapper.offsetHeight;
	void offside.offsetHeight;
	forceScrollTop();
}

function hideGameChrome() {
	setMenuMode(true);
	clearPauseUI();
	document.querySelector('.wrapper').style.display = 'none';
	document.querySelector('.offside').style.display = 'none';
	document.querySelector('.control-panel').style.display = 'none';
	var topbar = document.getElementById('game-topbar');
	if (topbar) {
		topbar.style.display = 'none';
	}
	modeBadge.style.display = 'none';
	document.getElementById('progress-badges').style.display = 'none';
	forceScrollTop();
}

function revealAllCards() {
	if (typeof clearDealGhosts === 'function') {
		clearDealGhosts();
	}
	var cards = document.querySelectorAll('.wrapper .card, #source .card, #dropout .card, .drag-el .card');
	for (var i = 0; i < cards.length; i++) {
		cards[i].removeAttribute('style');
		cards[i].classList.remove('ghost');
	}
}

function getTableauColumns() {
	var cols = document.querySelectorAll('.wrapper .columns-row .column');
	if (!cols.length) {
		cols = document.querySelectorAll('.wrapper .column');
	}
	return cols;
}

function hardDealInitial() {
	var cols = getTableauColumns();
	if (!cols.length) {
		return 0;
	}
	var dealt = 0;
	for (var i = 0; i < 54; i++) {
		var card = cardDeckEl.lastElementChild;
		if (!card) {
			break;
		}
		if (i >= 44) {
			card.classList.add('open');
			card.classList.remove('closed');
		} else {
			card.classList.add('closed');
			card.classList.remove('open');
		}
		card.removeAttribute('style');
		cols[i % cols.length].appendChild(card);
		dealt++;
	}
	revealAllCards();
	applyColumnHeights();
	updateProgressUI();
	return dealt;
}

function getDealRng() {
	if (gameSession && gameSession.type === 'daily' && typeof gameSession.seed === 'number') {
		return DailyChallenge.mulberry32(gameSession.seed);
	}
	return null;
}

function prepareAndDealNewHand() {
	forceScrollTop();
	clearBoard();
	cardDeckEl.innerHTML = '';
	if (typeof clearDealGhosts === 'function') {
		clearDealGhosts();
	}

	var cards = cardDeck.getCards();
	if (!cards || cards.length !== 104) {
		cardDeck.build(cardDeck.radioBtnValue || currentMode || 1);
		cards = cardDeck.getCards();
	}
	dealer.shuffle(cards, getDealRng());
	dealer.reUpload(cardDeck.getCards());
	void cardDeckEl.offsetHeight;

	var dealt = hardDealInitial();
	if (dealt < 54) {
		clearBoard();
		dealer.reUpload(cardDeck.getCards());
		dealt = hardDealInitial();
	}
	return dealt;
}

function dealFreshGame() {
	UndoHistory.clear();
	CardSelect.clear();
	hideStuckPanel(false);
	dealer.hintCount = 0;
	showGameChrome();
	prepareAndDealNewHand();
	noOfMoves = 0;
	moves.innerHTML = noOfMoves;
	resetTimer();
	persistGame();
	forceScrollTop();
}

function startGame(deck, options) {
	options = options || {};
	cardDeck = deck;
	currentMode = String(deck.radioBtnValue || '1');
	UndoHistory.clear();
	CardSelect.clear();
	dealer.hintCount = 0;

	showGameChrome();
	forceScrollTop();

	if (!options.resume) {
		GameStats.recordStart(currentMode);
		prepareAndDealNewHand();
		noOfMoves = 0;
		moves.innerHTML = noOfMoves;
		resetTimer();
	}

	revealAllCards();
	applyColumnHeights();
	updateProgressUI();
	persistGame();
	refreshResumeButton();
	forceScrollTop();
	setTimeout(forceScrollTop, 0);
	setTimeout(forceScrollTop, 50);
}

function restoreSavedGame(save) {
	if (!isValidSave(save)) {
		GameSave.clear();
		refreshResumeButton();
		AppModal.alert('Saved game is incomplete. Please start a new game.');
		return;
	}

	var deck = new CardDeck();
	deck.radioBtnValue = String(save.radioBtnValue || save.mode || '1');
	deck.selectors = save.selectors || [];
	deck.cards = save.cards || [];
	deck.pattern = [];
	for (var i = 0; i <= 12; i++) {
		deck.pattern[i] = i + 101;
	}
	if (!deck.selectors.length) {
		deck.init();
		deck.cards = save.cards || deck.cards;
	}

	dealer = new CardDealer();
	cardDeck = deck;
	currentMode = String(save.mode || deck.radioBtnValue);
	setMenuDifficulty(currentMode);

	document.forms.startGame.style.display = 'none';
	document.forms.startGame.classList.remove('start-form-visible');
	showGameChrome();

	var cols = document.querySelectorAll('.wrapper .column');
	for (var c = 0; c < cols.length; c++) {
		cols[c].innerHTML = cleanCardHtml((save.columnsHtml && save.columnsHtml[c]) || '');
		cols[c].removeAttribute('data-height');
	}
	cardDeckEl.innerHTML = cleanCardHtml(save.sourceHtml || '');
	dropout.innerHTML = cleanCardHtml(save.dropoutHtml || '');
	revealAllCards();

	var restoredCards = document.querySelectorAll('.wrapper .column .card');
	for (var r = 0; r < restoredCards.length; r++) {
		restoredCards[r].removeAttribute('style');
	}

	if (countColumnCardsFromDom() < 10) {
		GameSave.clear();
		clearBoard();
		cardDeckEl.innerHTML = '';
		cardDeck = null;
		hideGameChrome();
		document.forms.startGame.style.display = 'block';
		document.forms.startGame.classList.add('start-form-visible');
		refreshResumeButton();
		AppModal.alert('Saved game is incomplete. Please start a new game.');
		return;
	}

	noOfMoves = save.moves || 0;
	moves.innerHTML = noOfMoves;
	resetTimer(save.time || 0);
	if (save.gameType === 'daily' && save.dailyDate && typeof save.dailySeed === 'number') {
		gameSession = {
			type: 'daily',
			date: save.dailyDate,
			mode: currentMode,
			seed: save.dailySeed
		};
	} else {
		setRandomSession();
	}
	applyColumnHeights();
	updateProgressUI();
	updateModeBadge();
	UndoHistory.clear();
	persistGame();
}

function goToMainMenu(clearSave) {
	Sound.stopBgMusic();
	dealer.hideCongratulation();
	dealer.closeFaq();
	hideStuckPanel(false);
	clearPauseUI();
	clearInterval(timeKeeper);
	timeKeeper = 0;
	timerPauseDepth = 0;
	UndoHistory.clear();
	CardSelect.clear();

	if (clearSave) {
		GameSave.clear();
	} else if (cardDeck) {
		revealAllCards();
		if (countColumnCardsFromDom() >= 10) {
			persistGame();
		} else {
			GameSave.clear();
		}
	}

	clearBoard();
	cardDeckEl.innerHTML = '';
	var lastMode = currentMode;
	cardDeck = null;

	hideGameChrome();
	document.forms.startGame.style.display = 'block';
	document.forms.startGame.classList.add('start-form-visible');
	setMenuDifficulty(lastMode || '1');
	scoreBoard.style.display = 'none';
	statsBoard.style.display = 'none';

	noOfMoves = 0;
	moves.innerHTML = '0';
	document.getElementById('minutes').innerHTML = '00';
	document.getElementById('seconds').innerHTML = '00';
	setRandomSession();
	refreshResumeButton();
	refreshDailyStatus();
}

function showVictoryPanel() {
	var timeStr = timer ? timer.getTimeString() : '00:00';
	var modeLabel = MODE_LABELS[currentMode] || currentMode;
	var statsEl = document.getElementById('victory-stats');
	var noteEl = document.getElementById('victory-daily-note');
	if (gameSession && gameSession.type === 'daily') {
		statsEl.innerHTML = 'Daily · ' + DailyChallenge.formatShortDate(gameSession.date) +
			' · ' + modeLabel + ' · ' + noOfMoves + ' moves · ' + timeStr;
		if (noteEl) {
			if (lastDailyWinMeta && lastDailyWinMeta.isNewBest) {
				noteEl.style.display = 'block';
				noteEl.textContent = 'New personal best for today’s daily!';
			} else if (lastDailyWinMeta && lastDailyWinMeta.best) {
				noteEl.style.display = 'block';
				noteEl.textContent = 'Today’s best remains ' + lastDailyWinMeta.best.moves + ' moves.';
			} else {
				noteEl.style.display = 'none';
			}
		}
	} else {
		statsEl.innerHTML = modeLabel + ' · ' + noOfMoves + ' moves · ' + timeStr;
		if (noteEl) {
			noteEl.style.display = 'none';
		}
	}
	dealer.showCongratulation();
}

function getShareText() {
	var timeStr = timer ? timer.getTimeString() : '00:00';
	var modeLabel = MODE_LABELS[currentMode] || currentMode;
	if (gameSession && gameSession.type === 'daily') {
		return 'Spider Solitaire Daily (' + gameSession.date + ', ' + modeLabel + '): ' +
			noOfMoves + ' moves in ' + timeStr + '! Play today’s deal at https://spiderimp.com';
	}
	return 'I beat Spider Solitaire (' + modeLabel + ') in ' + noOfMoves +
		' moves and ' + timeStr + '! Play free at https://spiderimp.com';
}

function buildShareCardBlob(callback) {
	var w = 1200;
	var h = 630;
	var canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	var ctx = canvas.getContext('2d');
	if (!ctx) {
		callback(null);
		return;
	}

	var g = ctx.createLinearGradient(0, 0, w, h);
	g.addColorStop(0, '#145232');
	g.addColorStop(0.45, '#1a5c3a');
	g.addColorStop(1, '#0e3d2a');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = 'rgba(255,255,255,0.06)';
	for (var i = 0; i < 8; i++) {
		ctx.beginPath();
		ctx.arc(80 + i * 150, 80 + (i % 3) * 160, 90, 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.fillStyle = 'rgba(7, 71, 68, 0.88)';
	roundRect(ctx, 70, 70, w - 140, h - 140, 28);
	ctx.fill();
	ctx.strokeStyle = '#f6bf5b';
	ctx.lineWidth = 4;
	roundRect(ctx, 70, 70, w - 140, h - 140, 28);
	ctx.stroke();

	var timeStr = timer ? timer.getTimeString() : '00:00';
	var modeLabel = MODE_LABELS[currentMode] || currentMode;
	var isDaily = gameSession && gameSession.type === 'daily';

	ctx.fillStyle = '#f6bf5b';
	ctx.font = 'bold 54px Georgia, serif';
	ctx.textAlign = 'center';
	ctx.fillText('SpiderImp', w / 2, 170);

	ctx.fillStyle = '#ffffff';
	ctx.font = '36px Georgia, serif';
	ctx.fillText(isDaily ? 'Daily Challenge Cleared!' : 'Spider Solitaire Cleared!', w / 2, 240);

	ctx.fillStyle = '#e8f0ea';
	ctx.font = 'bold 64px Georgia, serif';
	ctx.fillText(noOfMoves + ' moves  ·  ' + timeStr, w / 2, 340);

	ctx.font = '32px Georgia, serif';
	ctx.fillStyle = '#c9d9d2';
	var sub = modeLabel + (isDaily ? '  ·  ' + DailyChallenge.formatShortDate(gameSession.date) : '');
	ctx.fillText(sub, w / 2, 410);

	ctx.fillStyle = '#f6bf5b';
	ctx.font = '28px Georgia, serif';
	ctx.fillText('Play free · no download · spiderimp.com', w / 2, 500);

	if (canvas.toBlob) {
		canvas.toBlob(function(blob) {
			callback(blob, canvas);
		}, 'image/png');
	} else {
		callback(null, canvas);
	}
}

function roundRect(ctx, x, y, width, height, radius) {
	var r = Math.min(radius, width / 2, height / 2);
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + width, y, x + width, y + height, r);
	ctx.arcTo(x + width, y + height, x, y + height, r);
	ctx.arcTo(x, y + height, x, y, r);
	ctx.arcTo(x, y, x + width, y, r);
	ctx.closePath();
}

function downloadShareCard(canvas) {
	try {
		var a = document.createElement('a');
		a.href = canvas.toDataURL('image/png');
		a.download = 'spiderimp-score.png';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		dealer.showMessage('Saved!', window.innerWidth / 2 - 40, window.innerHeight / 2 - 20);
	} catch (err) {
		AppModal.alert('Could not save the image. Try Copy Score instead.');
	}
}

function refreshResumeButton() {
	var btn = document.getElementById('resume-btn');
	if (!btn) {
		return;
	}
	var save = GameSave.load();
	if (!isValidSave(save)) {
		if (save) {
			GameSave.clear();
		}
		btn.style.display = 'none';
		return;
	}
	btn.style.display = '';
}

function tryDealStock(e) {
	if (!cardDeck || gamePaused) {
		return;
	}
	if (!cardDeckEl.lastElementChild) {
		dealer.showMessage('No more deals left', (e && e.pageX) || window.innerWidth / 2, (e && e.pageY) || 120);
		return;
	}
	var empty = dealer.checkEmpty(document.querySelectorAll('.column'));
	if (empty) {
		dealer.showMessage('Cannot deal to an empty column', (e && e.pageX - 140) || 40, (e && e.pageY - 60) || 80);
		return;
	}
	UndoHistory.pushNow();
	dealer.delivery(10, true, true);
	applyColumnHeights();
	noOfMoves++;
	moves.innerHTML = noOfMoves;
	updateProgressUI();
	persistGame();
	checkDeadEndHint();
}

var menuDifficulty = '1';

function setMenuDifficulty(mode) {
	menuDifficulty = String(mode || '1');
	if (menuDifficulty !== '1' && menuDifficulty !== '2' && menuDifficulty !== '4') {
		menuDifficulty = '1';
	}
	var radios = document.forms.startGame.radioBtn;
	for (var i = 0; i < radios.length; i++) {
		radios[i].checked = radios[i].value === menuDifficulty;
	}
	var options = document.forms.startGame.querySelectorAll('.game-option');
	for (var o = 0; o < options.length; o++) {
		var input = options[o].querySelector('input[type="radio"]');
		options[o].classList.toggle('selected', !!(input && input.value === menuDifficulty));
	}
	refreshDailyStatus();
}

function bindDifficultyPicker() {
	var form = document.forms.startGame;
	var options = form.querySelectorAll('.game-option');
	for (var i = 0; i < options.length; i++) {
		(function(option) {
			option.addEventListener('click', function(e) {
				var input = option.querySelector('input[type="radio"]');
				if (!input) {
					return;
				}
				setMenuDifficulty(input.value);
				// Clicking the radio: allow native check. Clicking text/icons: we already set mode.
				if (e.target !== input) {
					e.preventDefault();
				}
			});
		})(options[i]);
	}
	var radios = form.radioBtn;
	for (var r = 0; r < radios.length; r++) {
		radios[r].addEventListener('change', function() {
			setMenuDifficulty(this.value);
		});
	}
}

function beginNewGameFromMenu() {
	var mode = parseInt(menuDifficulty || getSelectedDifficulty(), 10) || 1;
	if (mode !== 1 && mode !== 2 && mode !== 4) {
		mode = 1;
	}
	setMenuDifficulty(String(mode));
	setRandomSession();
	forceScrollTop();
	var deck = new CardDeck();
	deck.build(mode);
	dealer = new CardDealer();
	GameSave.clear();
	startGame(deck);
	document.forms.startGame.style.display = 'none';
	document.forms.startGame.classList.remove('start-form-visible');
	forceScrollTop();
}

function beginDailyChallengeFromMenu() {
	var mode = parseInt(menuDifficulty || getSelectedDifficulty(), 10) || 1;
	if (mode !== 1 && mode !== 2 && mode !== 4) {
		mode = 1;
	}
	setMenuDifficulty(String(mode));
	setDailySession(mode);
	forceScrollTop();
	var deck = new CardDeck();
	deck.build(mode);
	dealer = new CardDealer();
	GameSave.clear();
	startGame(deck);
	document.forms.startGame.style.display = 'none';
	document.forms.startGame.classList.remove('start-form-visible');
	forceScrollTop();
}

document.forms.startGame.onsubmit = function(e) {
	if (e && e.preventDefault) {
		e.preventDefault();
	}
	beginNewGameFromMenu();
	return false;
};

document.getElementById('play-btn').onclick = function(e) {
	e.preventDefault();
	beginNewGameFromMenu();
};

document.getElementById('daily-btn').onclick = function(e) {
	e.preventDefault();
	beginDailyChallengeFromMenu();
};

bindDifficultyPicker();
setMenuDifficulty('1');

cardDeckEl.onclick = function(e) {
	var t = e.target;
	while (t && t !== this && !(t.classList && t.classList.contains('card'))) {
		t = t.parentNode;
	}
	if (!t || !t.classList || !t.classList.contains('card')) {
		return;
	}
	if (this.lastElementChild != t) {
		return;
	}
	tryDealStock(e);
};

document.querySelector('.btn-undo').onclick = function() {
	if (gamePaused) {
		return;
	}
	if (!cardDeck) {
		return;
	}
	if (UndoHistory.undo()) {
		Sound.play('audio/drag.mp3');
		CardSelect.clear();
		hideStuckPanel(true);
		updateProgressUI();
		persistGame();
	}
};

document.getElementById('btn-pause').onclick = function() {
	toggleGamePause();
};

document.getElementById('btn-resume-pause').onclick = function() {
	setGamePaused(false);
};

document.querySelector('.btn-new').onclick = function() {
	if (!cardDeck) {
		return;
	}
	AppModal.confirm('Restart the current game?').then(function(ok) {
		if (!ok) {
			return;
		}
		Sound.stopBgMusic();
		dealer.hideCongratulation();
		hideStuckPanel(false);
		dealFreshGame();
	});
};

document.querySelector('.btn-menu').onclick = function() {
	AppModal.confirm('Return to main menu? You can resume later.').then(function(ok) {
		if (!ok) {
			return;
		}
		hideStuckPanel(false);
		goToMainMenu(false);
	});
};

document.querySelector('.btn-hint').onclick = function(e) {
	if (!cardDeck || gamePaused) {
		return;
	}
	CardSelect.clear();
	var allCards = document.querySelectorAll('.column .card.open');
	var allPlaces = document.querySelectorAll('.column .card.open:last-child');

	if (allCards.length == 0) {
		dealer.showMessage('No open cards to hint', e.pageX - 80, e.pageY - 80);
		return;
	}
	var found = dealer.hint(allCards, allPlaces, cardDeck.selectors);
	if (!found) {
		if (cardDeckEl.children.length) {
			dealer.showMessage('No tableau moves — try Deal', e.pageX - 80, e.pageY - 80);
		} else {
			dealer.showMessage('No moves available', e.pageX - 80, e.pageY - 80);
		}
	}
};

document.querySelector('.btnFaq').onclick = function() {
	pauseGameTimer();
	dealer.showFaq();
};

document.querySelector('#scoreBoard .faq-close').onclick = function() {
	scoreBoard.style.display = 'none';
	document.getElementById('scoreBoard-shadow').classList.remove('visible');
	resumeGameTimer();
};

document.querySelector('#statsBoard .faq-close').onclick = function() {
	statsBoard.style.display = 'none';
	document.getElementById('statsBoard-shadow').classList.remove('visible');
	resumeGameTimer();
};

document.querySelector('#faq .faq-close').onclick = function() {
	dealer.closeFaq();
	resumeGameTimer();
};

document.querySelector('.faq-shadow').onclick = function() {
	dealer.closeFaq();
	resumeGameTimer();
};

document.getElementById('scoreBoard-shadow').onclick = function() {
	scoreBoard.style.display = 'none';
	this.classList.remove('visible');
	resumeGameTimer();
};

document.getElementById('statsBoard-shadow').onclick = function() {
	statsBoard.style.display = 'none';
	this.classList.remove('visible');
	resumeGameTimer();
};

document.getElementById('victory-again').onclick = function() {
	if (!cardDeck) {
		return;
	}
	Sound.stopBgMusic();
	dealer.hideCongratulation();
	hideStuckPanel(false);
	GameStats.recordStart(currentMode);
	dealFreshGame();
};

document.getElementById('victory-menu').onclick = function() {
	GameSave.clear();
	goToMainMenu(true);
};

document.getElementById('victory-share').onclick = function() {
	var text = getShareText();
	var btn = document.getElementById('victory-share');
	function markCopied() {
		if (!btn) {
			return;
		}
		var prev = btn.getAttribute('data-label') || btn.textContent;
		btn.setAttribute('data-label', prev);
		btn.textContent = 'Copied!';
		btn.classList.add('copied');
		setTimeout(function() {
			btn.textContent = btn.getAttribute('data-label') || 'Copy Score';
			btn.classList.remove('copied');
		}, 1800);
		dealer.showMessage('Copied!', window.innerWidth / 2 - 50, window.innerHeight / 2 - 20);
	}
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(text).then(markCopied).catch(function() {
			AppModal.alert(text);
		});
	} else {
		AppModal.alert(text);
	}
};

document.getElementById('victory-share-image').onclick = function() {
	var btn = document.getElementById('victory-share-image');
	var text = getShareText();
	buildShareCardBlob(function(blob, canvas) {
		if (!blob && !canvas) {
			AppModal.alert('Could not create share image.');
			return;
		}
		function flashSaved() {
			if (!btn) {
				return;
			}
			var prev = btn.getAttribute('data-label') || btn.textContent;
			btn.setAttribute('data-label', prev);
			btn.textContent = 'Ready!';
			btn.classList.add('copied');
			setTimeout(function() {
				btn.textContent = btn.getAttribute('data-label') || 'Share Image';
				btn.classList.remove('copied');
			}, 1800);
		}
		if (blob && navigator.canShare) {
			var file = new File([blob], 'spiderimp-score.png', { type: 'image/png' });
			var payload = { files: [file], title: 'SpiderImp', text: text };
			if (navigator.canShare(payload)) {
				navigator.share(payload).then(flashSaved).catch(function() {
					downloadShareCard(canvas);
					flashSaved();
				});
				return;
			}
		}
		if (canvas) {
			downloadShareCard(canvas);
			flashSaved();
		}
	});
};

soundToggle.onclick = function() {
	Sound.toggleMute();
	updateSoundButton();
};

if (volumeSlider) {
	volumeSlider.value = String(Math.round(Sound.getVolume() * 100));
	volumeSlider.addEventListener('input', function() {
		Sound.setVolume(parseInt(volumeSlider.value, 10) / 100);
		updateSoundButton();
	});
}
updateSoundButton();
setMenuMode(true);

document.getElementById('howto-btn').onclick = function() {
	window.location.href = 'how-to-play.html';
};

document.addEventListener('touchstart', function(e) {
	dragObj.startDrag(e);
}, { passive: false });

document.addEventListener('mousedown', function(e) {
	if (e.which != 1) {
		return;
	}
	dragObj.startDrag(e);
});

document.addEventListener('touchmove', dragObj.moveDrag, { passive: false });
document.addEventListener('mousemove', dragObj.moveDrag);
document.addEventListener('touchend', dragObj.endDrag);
document.addEventListener('mouseup', dragObj.endDrag);

function closestByClass(el, cls) {
	while (el && el !== document.body) {
		if (el.classList && el.classList.contains(cls)) {
			return el;
		}
		el = el.parentNode;
	}
	return null;
}

document.addEventListener('click', function(e) {
	if (!cardDeck || gamePaused) {
		return;
	}
	var col = closestByClass(e.target, 'column');
	var card = closestByClass(e.target, 'card');
	if (col && CardSelect.get()) {
		if (moveCardStackToColumn(CardSelect.get(), col)) {
			e.preventDefault();
			e.stopPropagation();
		}
		return;
	}
	if (!card && !col && !closestByClass(e.target, 'control-panel') && !closestByClass(e.target, 'source') && !closestByClass(e.target, 'game-hud')) {
		CardSelect.clear();
	}
});

document.addEventListener('keydown', function(e) {
	var tag = e.target && e.target.tagName;
	if (tag === 'INPUT' || tag === 'TEXTAREA') {
		return;
	}
	var key = e.key.toLowerCase();
	if (key === 'escape') {
		CardSelect.clear();
		if (gamePaused) {
			setGamePaused(false);
			return;
		}
		if (typeof AppModal !== 'undefined' && AppModal.isOpen()) {
			AppModal.dismiss(false);
			return;
		}
		if (stuckPanelOpen) {
			hideStuckPanel(true);
			return;
		}
		var closedSomething = false;
		var faqEl = document.getElementById('faq');
		if (faqEl && faqEl.style.left === '0%') {
			dealer.closeFaq();
			closedSomething = true;
		}
		if (scoreBoard.style.display === 'block') {
			scoreBoard.style.display = 'none';
			document.getElementById('scoreBoard-shadow').classList.remove('visible');
			closedSomething = true;
		}
		if (statsBoard.style.display === 'block') {
			statsBoard.style.display = 'none';
			document.getElementById('statsBoard-shadow').classList.remove('visible');
			closedSomething = true;
		}
		if (closedSomething) {
			resumeGameTimer();
		}
		return;
	}
	if (!cardDeck) {
		return;
	}
	if (key === 'p') {
		e.preventDefault();
		toggleGamePause();
		return;
	}
	if (gamePaused) {
		return;
	}
	if (key === 'z') {
		e.preventDefault();
		document.querySelector('.btn-undo').click();
	}
	if (key === 'h') {
		e.preventDefault();
		document.querySelector('.btn-hint').click();
	}
	if (key === 'd' || e.key === ' ') {
		e.preventDefault();
		tryDealStock({ pageX: window.innerWidth / 2, pageY: 120 });
	}
});

document.querySelector('#high-score-btn').onclick = function() {
	scoreBoardMode = getSelectedDifficulty();
	setActiveScoreTab(scoreBoardMode);
	HighScores(scoreBoardMode);
	scoreBoard.style.display = 'block';
	document.getElementById('scoreBoard-shadow').classList.add('visible');
	if (cardDeck) {
		pauseGameTimer();
	}
};

document.getElementById('stats-btn').onclick = function() {
	statsMode = getSelectedDifficulty();
	setActiveStatsTab(statsMode);
	renderStats(statsMode);
	statsBoard.style.display = 'block';
	document.getElementById('statsBoard-shadow').classList.add('visible');
	if (cardDeck) {
		pauseGameTimer();
	}
};

document.getElementById('resume-btn').onclick = function() {
	var save = GameSave.load();
	if (!isValidSave(save)) {
		GameSave.clear();
		refreshResumeButton();
		AppModal.alert('No valid saved game found. Please start a new game.');
		return;
	}
	restoreSavedGame(save);
};

document.getElementById('stuck-undo').onclick = function() {
	hideStuckPanel(false);
	if (cardDeck && UndoHistory.undo()) {
		Sound.play('audio/drag.mp3');
		CardSelect.clear();
		updateProgressUI();
		persistGame();
	}
	resumeGameTimer();
};

document.getElementById('stuck-restart').onclick = function() {
	hideStuckPanel(false);
	Sound.stopBgMusic();
	dealer.hideCongratulation();
	dealFreshGame();
};

document.getElementById('stuck-dismiss').onclick = function() {
	hideStuckPanel(true);
};

function setActiveScoreTab(mode) {
	var tabs = document.querySelectorAll('.score-tab');
	for (var i = 0; i < tabs.length; i++) {
		tabs[i].classList.toggle('active', tabs[i].getAttribute('data-mode') === String(mode));
	}
}

function setActiveStatsTab(mode) {
	var tabs = document.querySelectorAll('.stats-tab');
	for (var i = 0; i < tabs.length; i++) {
		tabs[i].classList.toggle('active', tabs[i].getAttribute('data-mode') === String(mode));
	}
}

var scoreTabs = document.querySelectorAll('.score-tab');
for (var t = 0; t < scoreTabs.length; t++) {
	scoreTabs[t].onclick = function() {
		scoreBoardMode = this.getAttribute('data-mode');
		setActiveScoreTab(scoreBoardMode);
		HighScores(scoreBoardMode);
	};
}

var statsTabs = document.querySelectorAll('.stats-tab');
for (var st = 0; st < statsTabs.length; st++) {
	statsTabs[st].onclick = function() {
		statsMode = this.getAttribute('data-mode');
		setActiveStatsTab(statsMode);
		renderStats(statsMode);
	};
}

function migrateLegacyScores() {
	try {
		if (!localStorage['highScores']) {
			return;
		}
		if (localStorage[scoreKey('1')]) {
			return;
		}
		var legacy = JSON.parse(localStorage['highScores']);
		var migrated = [];
		for (var i = 0; i < legacy.length; i++) {
			if (legacy[i] === null || typeof legacy[i] === 'undefined' || legacy[i] === '') {
				continue;
			}
			if (typeof legacy[i] === 'object') {
				migrated.push(legacy[i]);
			} else {
				migrated.push({ moves: parseInt(legacy[i], 10), time: 0 });
			}
		}
		localStorage[scoreKey('1')] = JSON.stringify(migrated.slice(0, 10));
	} catch (e) {}
}

function HighScores(mode) {
	mode = String(mode || scoreBoardMode || '1');
	if (typeof Storage === 'undefined') {
		highScores.style.display = 'none';
		return;
	}

	highScores.style.display = 'block';
	highScores.innerHTML = '';

	var raw = localStorage[scoreKey(mode)];
	var scores = raw ? JSON.parse(raw) : [];
	scores.sort(function(a, b) {
		var am = parseInt(a.moves, 10);
		var bm = parseInt(b.moves, 10);
		if (am !== bm) {
			return am - bm;
		}
		return (a.time || 0) - (b.time || 0);
	});

	for (var i = 0; i < 10; i++) {
		var s = scores[i];
		var fragment = document.createElement('li');
		if (s) {
			fragment.innerHTML = '<span></span><span>' + s.moves + '</span><span>' + formatSeconds(s.time || 0) + '</span>';
		} else {
			fragment.innerHTML = '<span></span><span>—</span><span>—</span>';
		}
		highScores.appendChild(fragment);
	}
}

migrateLegacyScores();
HighScores('1');
refreshResumeButton();
scaleGameStage();

function UpdateScore() {
	if (typeof Storage === 'undefined') {
		return;
	}

	var entry = {
		moves: noOfMoves,
		time: timer ? timer.getTotalSeconds() : 0
	};

	var key = scoreKey(currentMode);
	var scores = [];
	if (localStorage[key]) {
		scores = JSON.parse(localStorage[key]);
	}

	scores.push(entry);
	scores.sort(function(a, b) {
		if (a.moves !== b.moves) {
			return a.moves - b.moves;
		}
		return (a.time || 0) - (b.time || 0);
	});
	scores = scores.slice(0, 10);
	localStorage[key] = JSON.stringify(scores);
	HighScores(currentMode);
}

window.onGameWon = function() {
	hideStuckPanel(false);
	clearInterval(timeKeeper);
	timeKeeper = 0;
	timerPauseDepth = 0;
	clearPauseUI();
	lastDailyWinMeta = null;
	if (gameSession && gameSession.type === 'daily') {
		lastDailyWinMeta = DailyChallenge.recordWin(
			gameSession.date,
			currentMode,
			noOfMoves,
			timer ? timer.getTotalSeconds() : 0
		);
	}
	GameStats.recordWin(currentMode, noOfMoves, timer ? timer.getTotalSeconds() : 0);
	UpdateScore();
	GameSave.clear();
	refreshResumeButton();
	refreshDailyStatus();
	showVictoryPanel();
	Sound.playBgMusic('audio/bg-music.mp3');
};

window.addEventListener('beforeunload', function() {
	if (cardDeck) {
		persistGame();
	}
});
