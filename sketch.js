class World {
	constructor(gravity, ground, drag) {
		this.gravity = gravity ?? 5;
		this.ground = ground ?? 500;
		this.drag = drag ?? 4;
	}
}

// Mostly copied
function clamp(input, limits) {
	const [min, max] = limits;
	if (input > max) return max;
	else if (input < min) return min;
	return input;
}

class PID {
	constructor(kp, ki, kd, setpoint, min, max) {
		this.kp = kp;
		this.ki = ki;
		this.kd = kd;
		this.limits = [min, max];
		this.setpoint = setpoint;
		this.last_error = 0;
		this.last_integral = 0;
	}
	update(input) {
		const error = this.setpoint - input;

		const propotional = error;
		const integral = this.last_integral + error;
		const derivative = this.last_error - error;
		const output =
			this.kp * propotional + this.ki * integral + this.kd * derivative;
		/* console.log(output); */
		return clamp(output, this.limits);
	}
}

class Drone {
	constructor(x, y, world) {
		this.velocity = createVector(0, 1);
		this.acceleration = createVector(0, 0);
		this.max_velocity = 10;
		this.world = world;

		if (x == undefined) {
			x = W / 2 - 100;
			y = 0;
		}
		this.position = createVector(x, y);
	}
	update(thrust) {
		// bounce back
		// slow down
		// not go below ground
		this.velocity.add(0, thrust);
		this.velocity.add(this.acceleration);
		this.velocity.add(0, this.world.gravity);
		this.acceleration.mult(0);

		if (this.velocity.mag() < 0.1) {
			this.velocity.mult(0);
		}

		if (this.position.y >= this.world.ground) {
			// Below ground
			this.velocity.mult(-0.1);
			this.position.y = this.world.ground - 5;
		}

		this.position.add(this.velocity);
	}
	draw() {
		image(drone_image, this.position.x, this.position.y);
	}
}

const W = 600;
const H = 600;
const drone_height = 200;

// Colors
const RED = [255, 0, 0];
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];
const GRAVITY = 0.2;
const ground = H - drone_height;
const world = new World(GRAVITY, 550, 0);
// 								PID(kp , ki, kd, setpoint,  [min, max]);
let altitude_controller = new PID(0.001, 0, 0, 100, -1, 1);

let drone;
let drone_image;

let kpInput;
let kiInput;
let kdInput;
let maxInput
let minInput;
function drawGrid() {
	for (let i = 0; i < H; i += 100) {
		fill(255);
		stroke(255);
		line(100, i + 3, W, i + 3);
		text(i, 100, i);
	}
}
function resetSim() {
	altitude_controller = new PID(0.01, 0, 0, 100, -2, 2);
	drone = new Drone(W / 2 - drone_height / 2, 0, world);
	kpInput.value(altitude_controller.kp);
	kiInput.value(altitude_controller.ki);
	kdInput.value(altitude_controller.kd);

	maxInput.value(altitude_controller.limits[1]);
	minInput.value(altitude_controller.limits[0]);
}
function setupInputs() {
	let inputsDiv = select('#inputs');
	let limitsDiv = select('#limits');
	let kpDiv = createDiv().id("kp");
	let kiDiv = createDiv().id("ki");
	let kdDiv = createDiv().id("kd");

	let maxDiv = createDiv().id("max");
	let minDiv = createDiv().id("min");


	kpDiv.child(createP("Kp"));
	kiDiv.child(createP("Ki"));
	kdDiv.child(createP("Kd"));

	kpInput = createInput(altitude_controller.kp.toString()).size(100);
	kiInput = createInput(altitude_controller.ki.toString()).size(100);
	kdInput = createInput(altitude_controller.kd.toString()).size(100);

	kpDiv.child(kpInput);
	kiDiv.child(kiInput);
	kdDiv.child(kdInput);

	inputsDiv.style("display:grid; grid: 'a s b' ");
	inputsDiv.child(kpDiv);
	inputsDiv.child(kiDiv);
	inputsDiv.child(kdDiv);

	maxDiv.child(createP("Max Output"));
	minDiv.child(createP("Min Output"));
	maxInput = createInput(altitude_controller.limits[1].toString()).size(150);
	minInput = createInput(altitude_controller.limits[0].toString()).size(150);

	maxDiv.child(maxInput);
	minDiv.child(minInput);

	limitsDiv.child(maxDiv);
	limitsDiv.child(minDiv);
}


let history = [];
function setup() {
	drone = new Drone(W / 2 - drone_height / 2, 0, world);
	createCanvas(W, H);
	drone_image.resize(0, drone_height);
	drone_image.filter(THRESHOLD, 0.3);
	setupInputs();
}
function preload() {
	drone_image = loadImage("drone_white.png");
}
function smoothArray(values, smoothing) {
	var value = values[0]; // start with the first input
	for (var i = 1, len = values.length; i < len; ++i) {
		var currentValue = values[i];
		value += (currentValue - value) / smoothing;
		values[i] = value;
	}
}
function draw() {
	background('#141414');
	drawGrid();
	altitude_controller.kp = kpInput.value() != NaN ? kpInput.value() : altitude_controller.kp;
	altitude_controller.ki = kpInput.value() != NaN ? kiInput.value() : altitude_controller.ki;
	altitude_controller.kp = kpInput.value() != NaN ? kpInput.value() : altitude_controller.kp;

	altitude_controller.limits[1] = maxInput.value() != NaN ? maxInput.value() : altitude_controller.limits[1];
	altitude_controller.limits[0] = minInput.value() != NaN ? minInput.value() : altitude_controller.limits[0];
	history.push(altitude_controller.update(drone.position.y));
	if (history.length > 100) {
		smoothArray(history, 1);
		const smoothMeasurement = history[0];
		history.shift();
		drone.update(smoothMeasurement);
		drone.draw();
	}
}
