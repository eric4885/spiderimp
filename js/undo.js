var UndoHistory = (function() {
	var stack = [];
	var maxSize = 40;
	var pending = null;

	function captureBoard() {
		var cols = document.querySelectorAll('.wrapper .column');
		var columnsHtml = [];
		for (var i = 0; i < cols.length; i++) {
			columnsHtml.push(cols[i].innerHTML);
		}
		return {
			columnsHtml: columnsHtml,
			sourceHtml: cardDeckEl ? cardDeckEl.innerHTML : '',
			dropoutHtml: dropout ? dropout.innerHTML : '',
			moves: noOfMoves
		};
	}

	function restoreBoard(state) {
		var cols = document.querySelectorAll('.wrapper .column');
		for (var i = 0; i < cols.length; i++) {
			var html = state.columnsHtml[i] || '';
			if (typeof cleanCardHtml === 'function') {
				html = cleanCardHtml(html);
			}
			cols[i].innerHTML = html;
		}
		if (cardDeckEl) {
			cardDeckEl.innerHTML = state.sourceHtml;
		}
		if (dropout) {
			dropout.innerHTML = state.dropoutHtml;
		}
		noOfMoves = state.moves;
		if (moves) {
			moves.innerHTML = noOfMoves;
		}
		if (typeof applyColumnHeights === 'function') {
			applyColumnHeights();
		}
		if (typeof updateProgressUI === 'function') {
			updateProgressUI();
		}
		updateUndoButton();
	}

	function updateUndoButton() {
		var btn = document.querySelector('.btn-undo');
		if (!btn) {
			return;
		}
		btn.disabled = stack.length === 0;
	}

	return {
		clear: function() {
			stack = [];
			pending = null;
			updateUndoButton();
		},
		beginAction: function() {
			pending = captureBoard();
		},
		commitAction: function() {
			if (!pending) {
				return;
			}
			stack.push(pending);
			if (stack.length > maxSize) {
				stack.shift();
			}
			pending = null;
			updateUndoButton();
		},
		cancelAction: function() {
			pending = null;
		},
		pushNow: function() {
			stack.push(captureBoard());
			if (stack.length > maxSize) {
				stack.shift();
			}
			updateUndoButton();
		},
		undo: function() {
			if (!stack.length) {
				return false;
			}
			var state = stack.pop();
			restoreBoard(state);
			return true;
		},
		updateButton: updateUndoButton,
		canUndo: function() {
			return stack.length > 0;
		}
	};
})();
