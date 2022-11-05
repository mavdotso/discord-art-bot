import Canvas  from '@napi-rs/canvas';

// Document setup
export default async function generateMaviggle() {
    
let canvas = Canvas.createCanvas(800, 800)
let context = canvas.getContext('2d');
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.style.backgroundColor = "#121212"; // dark mode
}

let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
let squiggleStart = 20;
let squiggleEnd = canvas.width - 20;
let step = canvas.width / 13;

// Document styles
context.lineWidth = 40;
context.lineCap = 'round';

// Gradient setup
let gradient = context.createLinearGradient(0, centerY, canvas.width, canvas.height);
let gradients = {
	grad1: ['#c501e1', '#9a26f8', '#6564fe', '#2b97fa', '#02c4e7', '#16e6cc', '#2ef9a0','#67ff6c','#c7e602','#e7c501','#ff6a63','#f82d98','#e830ce'],
	grad2: ['#ffff66', '#fc6e22', '#ff1493', '#c24cf6'],
	grad3: ['#08f7fe', '#09fbd3', '#fe53bb', '#f5d300'],
	grad4: ['#75d5fd', '#b76cfd', '#ff2281', '#011ffd'],
}

let palette = Object.values(gradients)[Math.floor(Math.random() * Object.values(gradients).length)];

for(i = 0; i < palette.length; i++) {
	gradient.addColorStop(i / palette.length, palette[i]);
}

context.strokeStyle = gradient;


// 🅿ushing 🅿oints v2
let squigglePoints = [];
let random;
let point;

function pushPoint (point) {
	squigglePoints.push(point);
}

point = {x: squiggleStart, y: centerY};
pushPoint(point);

for(i = step; i < canvas.width - step - 1; i+=step) {
	random = (Math.random() < 0.5 ? -1 : 1) * Math.random() * 150;
	point = {x: i, y: centerY + random};
	pushPoint(point);
}


point = {x: squiggleEnd, y: centerY};
pushPoint(point);


// Drawing & smoothing
context.moveTo(squigglePoints[0].x, squigglePoints[0].y);

for(i = 1; i < squigglePoints.length - 2; i++) {
	let xc = (squigglePoints[i].x + squigglePoints[i + 1].x) / 2;
    let yc = (squigglePoints[i].y + squigglePoints[i + 1].y) / 2;
	context.quadraticCurveTo(squigglePoints[i].x, squigglePoints[i].y, xc, yc);
}

context.quadraticCurveTo(squigglePoints[i].x, squigglePoints[i].y, squigglePoints[i+1].x, squigglePoints[i+1].y);

context.stroke();

}