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
  constructor(kp, ki, kd, setpoint, limits) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.limits = limits;
    this.setpoint = setpoint;
    this.last_error = 0;
    this.last_integral = 0;
  }
  update(input) {
    const error = this.setpoint - input;

    const propotional = error;
    const integral = this.last_integral + error;
    const derivative = this.last_error - error;
    return this.kp * propotional + this.ki * integral + this.kd * derivative;
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
const altitude_controller = new PID(0.00, 0, 0, 100, [0, 1]);

let drone;
let drone_image;

function setup() {
  drone = new Drone(W / 2 - drone_height / 2, 0, world);
  createCanvas(W, H);
  drone_image.resize(0, drone_height);
  drone_image.filter(THRESHOLD, 0.3);
}
function preload() {
  drone_image = loadImage("drone.png");
}
function draw() {
  background(225);

  drone.update(altitude_controller.update(drone.position.y));
  drone.draw();
}
