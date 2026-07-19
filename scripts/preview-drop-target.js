const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const root = path.join(__dirname, '..');
const mime = {
	'.html': 'text/html',
	'.css': 'text/css',
	'.js': 'application/javascript',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.svg': 'image/svg+xml',
	'.mp3': 'audio/mpeg'
};

const server = http.createServer(function (req, res) {
	var p = decodeURIComponent((req.url || '/').split('?')[0]);
	if (p === '/') p = '/index.html';
	var fp = path.join(root, p.replace(/^\//, ''));
	if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
		res.writeHead(404);
		res.end('no');
		return;
	}
	res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'application/octet-stream' });
	fs.createReadStream(fp).pipe(res);
});

server.listen(8765, async function () {
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
	await page.goto('http://127.0.0.1:8765/', { waitUntil: 'domcontentloaded' });
	await page.click('label.game-option:has(input[value="2"])');
	await page.click('#play-btn');
	await page.waitForSelector('body.playing');
	await page.waitForTimeout(1600);

	await page.evaluate(function () {
		var cols = document.querySelectorAll('.column');
		for (var i = 3; i < 7; i++) {
			cols[i].innerHTML = '';
		}
		var king = null;
		for (var c = 0; c < cols.length; c++) {
			var card = cols[c].lastElementChild;
			if (card && card.classList.contains('open') && card.dataset.card && card.dataset.card.slice(1) === '13') {
				king = card;
				break;
			}
		}
		if (!king) {
			for (var d = 0; d < cols.length; d++) {
				if (cols[d].lastElementChild && cols[d].lastElementChild.classList.contains('open')) {
					king = cols[d].lastElementChild;
					break;
				}
			}
		}
		if (king && typeof highlightValidDrops === 'function') {
			highlightValidDrops(king);
		}
	});

	await page.waitForTimeout(300);
	var out = path.join(root, 'images', 'howto', '_drop-target-preview.png');
	await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1366, height: 720 } });
	console.log('wrote', out);
	await browser.close();
	server.close();
});
