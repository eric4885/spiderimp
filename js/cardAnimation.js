function clearDealGhosts() {
	var ghosts = document.querySelectorAll('.ghost');
	for (var i = ghosts.length - 1; i >= 0; i--) {
		if (ghosts[i].parentNode) {
			ghosts[i].parentNode.removeChild(ghosts[i]);
		}
	}
}

function animationAppendChild(parent, child) {
	if (!parent || !child) {
		return child;
	}

	var startRect = child.getBoundingClientRect();
	var startCoords = {
		top: startRect.top,
		left: startRect.left
	};

	parent.appendChild(child);

	var endRect = child.getBoundingClientRect();
	var endCoords = {
		top: endRect.top,
		left: endRect.left
	};

	// Keep card in layout; only hide visually so a missed transitionend cannot strand it
	child.style.opacity = '0';
	child.style.pointerEvents = 'none';

	var ghost = document.createElement('div');
	ghost.className = child.className;
	ghost.classList.add('ghost');
	ghost.style.top = startCoords.top + 'px';
	ghost.style.left = startCoords.left + 'px';
	document.body.insertBefore(ghost, document.body.children[0]);

	var queue = Math.max(0, document.querySelectorAll('.ghost').length - 1);
	ghost.style.transitionDelay = queue * 40 + 'ms';

	var done = false;
	function finish() {
		if (done) {
			return;
		}
		done = true;
		child.style.opacity = '';
		child.style.pointerEvents = '';
		child.style.display = '';
		if (ghost.parentNode) {
			ghost.parentNode.removeChild(ghost);
		}
	}

	setTimeout(function() {
		ghost.style.top = endCoords.top + 'px';
		ghost.style.left = endCoords.left + 'px';
	}, 0);

	ghost.addEventListener('transitionend', function(e) {
		if (e.target !== ghost) {
			return;
		}
		finish();
	});

	// Fallback: never leave cards invisible if transitionend does not fire
	setTimeout(finish, 500 + queue * 40);

	return child;
}
