var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var w = document.body.clientWidth;
var h = document.body.clientHeight;
canvas.width = w;
canvas.height = h;

var nodes = [];
function resizeCanvas() {
	w = document.body.clientWidth;
	h = document.body.clientHeight;
	canvas.width = w;
	canvas.height = h;
}

window.addEventListener('resize', resizeCanvas);

function draw() {
	requestAnimationFrame(draw);

	ctx.clearRect(0, 0, w, h);

	ctx.globalCompositeOperation = 'xor';
	ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
	ctx.fillRect(0, 0, w, h);
	ctx.globalCompositeOperation = 'lighter';

	var l = nodes.length;
	var node;

	while (l--) {
		node = nodes[l];
		drawNode(node);
		if (node.dead) {
			nodes.splice(l, 1);
		}
	}

	if (nodes.length < 20) {
		l = rand(4, 1) | 0;
		while (l--) {
			nodes.push(
				makeNode(
					(Math.random() * w) | 0,
					(Math.random() * h) | 0,
					100,
					'hsl(' + (rand(300, 0) | 0) + ', 100%, 50%)',
					100
				)
			);
		}
	}
}

function drawNode(node) {
	var l = node.children.length;
	var point;
	while (l--) {
		point = node.children[l];
		ctx.beginPath();
		ctx.fillStyle = point.color;
		ctx.arc(point.x, point.y, 1, 0, PI2);
		ctx.fill();
		ctx.closePath();
		updatePoint(point);
		if (point.dead) {
			node.children.splice(l, 1);
			if (node.count > 100) {
				nodes.push(
					makeNode(point.x, point.y, node.radius * 10, node.color, (node.count / 10) | 0)
				);
			}
		}
	}
	if (!node.children.length) {
		node.dead = true;
	}
}

function updatePoint(point) {
	var dx = point.x - point.dx;
	var dy = point.y - point.dy;
	var c = Math.sqrt(dx * dx + dy * dy);
	point.dead = c < 1;
	point.x -= dx * point.velocity;
	point.y -= dy * point.velocity;
}

var rad = Math.PI / 180;
var PI2 = Math.PI * 2;
var ttt = 0;

function rand(max, min) {
	min = min || 0;
	return Math.random() * (max - min) + min;
}

function makeNode(x, y, radius, color, partCount) {
	radius = radius || 0;
	partCount = partCount || 0;
	var count = partCount;

	var children = [];
	var kof = 0;
	var r = 0;

	while (partCount--) {
		kof = (100 * Math.random()) | 0;
		r = (radius * Math.random()) | 0;
		children.push({
			x: x,
			y: y,
			dx: x + r * Math.cos(ttt * kof * rad),
			dy: y + r * Math.sin(ttt * kof * rad),
			color: color,
			velocity: rand(1, 0.06)
		});
		ttt++;
	}

	return {
		radius: radius,
		count: count,
		color: color,
		x: x,
		y: y,
		children: children
	};
}

draw();
