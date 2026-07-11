function CardDeck() {
	this.suit = ['s', 'h', 'c', 'd'];
	this.pattern = [];
	this.selectors = [];
	this.newDeck = [];
	this.cards = [];
	this.radioBtnValue = 1;

	var that = this;

	this.getValueFromRadioButton = function(buttons) {
		for (var i = 0; i < buttons.length; i++) {
			if (buttons[i].checked) {
				this.radioBtnValue = parseInt(buttons[i].value, 10) || 1;
				return this.radioBtnValue;
			}
		}
		return null;
	};

	this.init = function() {
		var suitCount = parseInt(this.radioBtnValue, 10) || 1;
		if (suitCount !== 1 && suitCount !== 2 && suitCount !== 4) {
			suitCount = 1;
		}
		this.radioBtnValue = suitCount;

		noOfMoves = 0;
		this.pattern = [];
		this.selectors = [];
		this.newDeck = [];

		for (var i = 0; i <= 12; i++) {
			this.pattern[i] = i + 101;
		}

		for (var s = 0; s < suitCount; s++) {
			this.selectors[s] = '';
			for (var j = 12; ;) {
				this.selectors[s] += '.' + this.suit[s] + this.pattern[j];
				if (--j < 0) {
					break;
				}
				this.selectors[s] += ' + ';
			}
		}

		for (var k = 0; k < suitCount; k++) {
			this.pattern.forEach(function(item) {
				that.newDeck.push(that.suit[k] + item);
			});
		}
	};

	this.create = function() {
		if (!this.newDeck.length) {
			this.cards = [];
			return;
		}
		var deck = this.newDeck.slice();
		while (deck.length < 104) {
			deck = deck.concat(deck);
		}
		this.cards = deck.slice(0, 104);
	};

	this.build = function(suitCount) {
		this.radioBtnValue = parseInt(suitCount, 10) || 1;
		this.init();
		this.create();
		return this.cards;
	};

	this.getCards = function() {
		return this.cards;
	};
}
