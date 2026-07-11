function getEventCoords(e) {
	if (e.touches && e.touches.length) {
		return { pageX: e.touches[0].pageX, pageY: e.touches[0].pageY };
	}
	if (e.changedTouches && e.changedTouches.length) {
		return { pageX: e.changedTouches[0].pageX, pageY: e.changedTouches[0].pageY };
	}
	return { pageX: e.pageX, pageY: e.pageY };
}

function DragEvents() {
	this.el = document.getElementById('drag-el');
	this.shiftX = 0;
	this.shiftY = 0;
	var that = this;
	this.parentOld = '';
	this.dragMoved = false;
	this.startX = 0;
	this.startY = 0;
	this.pendingCard = null;
	this.dragging = false;

	this.startDrag = function(e) {
		if (typeof gamePaused !== 'undefined' && gamePaused) {
			return;
		}
		var t = e.target;
		while (t && t !== document.body && !(t.classList && t.classList.contains('card'))) {
			t = t.parentNode;
		}
		if (!t || !t.classList || !t.classList.contains('card')) {
			return;
		}
		if (!cardDeck || that.el.children[0] || !dealer.checkStartDrag(t, cardDeck.selectors)) {
			return;
		}

		var coords = getEventCoords(e);
		that.pendingCard = t;
		that.dragMoved = false;
		that.dragging = false;
		that.startX = coords.pageX;
		that.startY = coords.pageY;
		that.shiftX = coords.pageX - t.getBoundingClientRect().left;
		that.shiftY = coords.pageY - t.getBoundingClientRect().top;
		that.parentOld = t.parentNode;
		e.preventDefault();
	};

	this.moveDrag = function(e) {
		var coords = getEventCoords(e);
		if (!that.dragging && that.pendingCard) {
			var dx = Math.abs(coords.pageX - that.startX);
			var dy = Math.abs(coords.pageY - that.startY);
			if (dx > 6 || dy > 6) {
				that.dragging = true;
				that.dragMoved = true;
				CardSelect.clear();
				if (typeof UndoHistory !== 'undefined') {
					UndoHistory.beginAction();
				}
				var t = that.pendingCard;
				that.el.style.left = coords.pageX - that.shiftX + 'px';
				that.el.style.top = coords.pageY - that.shiftY + 'px';
				while (t != t.parentNode.lastElementChild) {
					that.el.insertBefore(t.parentNode.lastElementChild, that.el.children[0]);
				}
				that.parentOld = t.parentNode;
				that.el.insertBefore(t, that.el.children[0]);
				highlightValidDrops(that.el.children[0]);
			} else {
				return;
			}
		}

		if (!that.el.children[0]) {
			return;
		}
		that.el.style.left = coords.pageX - that.shiftX + 'px';
		that.el.style.top = coords.pageY - that.shiftY + 'px';
		e.preventDefault();
	};

	this.endDrag = function(e) {
		if (!that.dragging && that.pendingCard) {
			var card = that.pendingCard;
			that.pendingCard = null;
			var selected = typeof CardSelect !== 'undefined' ? CardSelect.get() : null;
			if (selected && selected !== card) {
				var targetCol = card.parentNode;
				if (targetCol && targetCol.classList.contains('column') &&
					typeof moveCardStackToColumn === 'function' &&
					moveCardStackToColumn(selected, targetCol)) {
					return;
				}
			}
			CardSelect.toggle(card);
			return;
		}

		that.pendingCard = null;
		if (!that.el.children[0]) {
			clearMoveHighlights();
			return;
		}

		that.parentNew = that.getDroppable(that.el.children[0], that.parentOld);

		while (that.el.children[0]) {
			if (that.parentNew) {
				that.parentNew.appendChild(that.el.children[0]);
			} else {
				that.parentOld.appendChild(that.el.children[0]);
			}
		}

		clearMoveHighlights();
		that.dragging = false;

		if (!that.parentNew) {
			if (typeof UndoHistory !== 'undefined') {
				UndoHistory.cancelAction();
			}
			return;
		}

		if (that.parentOld.children[0]) {
			that.parentOld.lastElementChild.classList.add('open');
			that.parentOld.lastElementChild.classList.remove('closed');
		}

		dealer.takeAway(cardDeck.selectors, dropout, true);
		if (typeof applyColumnHeights === 'function') {
			applyColumnHeights();
		}
		if (typeof updateProgressUI === 'function') {
			updateProgressUI();
		}
		if (typeof persistGame === 'function') {
			persistGame();
		}

		if (typeof UndoHistory !== 'undefined') {
			UndoHistory.commitAction();
		}

		if (dropout.children.length == 104) {
			if (typeof window.onGameWon === 'function') {
				window.onGameWon();
			}
		} else if (typeof checkDeadEndHint === 'function') {
			checkDeadEndHint();
		}
	};

	this.getDroppable = function(target, source) {
		if (!target) {
			return;
		}

		var pointX = target.getBoundingClientRect().left + target.offsetWidth / 2;
		var pointY = target.getBoundingClientRect().top - 3;
		this.container = document.elementFromPoint(pointX, pointY);

		while (this.container) {
			if (this.container.classList.contains('column')) {
				break;
			}
			this.container = this.container.parentElement;
		}

		if (!this.container || this.container === source) {
			return;
		}

		if (!this.container.children[0]) {
			noOfMoves++;
			document.getElementById('score').innerHTML = noOfMoves;
			Sound.play('audio/pop.mp3');
			return this.container;
		}

		var cardNum1 = +target.dataset.card.slice(1);
		var cardNum2 = +this.container.lastElementChild.dataset.card.slice(1);
		if (cardNum1 + 1 == cardNum2) {
			noOfMoves++;
			document.getElementById('score').innerHTML = noOfMoves;
			Sound.play('audio/pop.mp3');
			return this.container;
		}
		Sound.play('audio/drag.mp3');
	};
}
