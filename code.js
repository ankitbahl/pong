let c = document.getElementById("game");
let tickTime = 10;
let scoreBoard = document.getElementById('score');
let sctx = scoreBoard.getContext('2d');
let ctx = c.getContext("2d");
const height = c.getAttribute('height');
const width = c.getAttribute('width');
const p1x = 50;
const p2x = width - p1x;
let p1y = 200;
let p2y = 200;
let p1Score = 0;
let p2Score = 0;
const playerWidth = 10;
const playerHeight = 100;
let p1Height = 100;
let p2Height = 100;
const bWidth = 10;
const bHeight = 10;
let x = width/2;
let y = height/2;
let trajectory = 3 * Math.PI /4;
let direction = false; //false = left, true = right
let speed = 5;
let p1down = false;
let p1up = false;
let p2down = false;
let p2up = false;
window.onkeydown = function (e) {
  switch(e.code) {
      case 'ArrowUp':
          p1up = true;
          break;
      case 'ArrowDown':
          p1down = true;
          break;
      case 'Space':
          speed = 10;
          break;
//      case 'KeyW':
//          p2up = true;
//          break;
//      case 'KeyS':
//          p2down = true;
//          break;
  }
};
window.onkeyup = function (e) {
  switch(e.code) {
      case 'ArrowUp':
          p1up = false;
          break;
      case 'ArrowDown':
          p1down = false;
          break;
      case 'Space':
                speed = 5;
                break;
//      case 'KeyW':
//          p2up = false;
//          break;
//      case 'KeyS':
//          p2down = false;
//          break;
  }
};

function clear() {
    ctx.clearRect(p1x, p1y, playerWidth, playerHeight);
    ctx.clearRect(p2x, p2y, playerWidth, playerHeight);
    ctx.clearRect(x - 1 , y - 1, bWidth + 2, bHeight + 2);
}

function collision() {
    //top wall
    if (y < 0) {
        if(direction) { // right
            trajectory += Math.PI / 2;
        } else { // left
            trajectory -= Math.PI / 2;
        }
    }

    //bottom wall
    if (y > height - bHeight) {
        if(direction) { //right
            trajectory += Math.PI / 2;
        } else { //left
            trajectory -= Math.PI / 2;
        }
    }

    // ball hits p1
    if (x < p1x + playerWidth && x > p1x && (y + bHeight > p1y) && (y < p1y + p1Height)) {
        direction = true;
        trajectory += Math.PI / 2;
    }

    // ball hits p2
    if (x > p2x && x < p2x + playerWidth && (y + bHeight > p2y) && (y < p2y + p2Height)) {
        direction = false;
        trajectory += Math.PI / 2;
    }
}
function movement() {
    if (p1up) {
        p1y -= 10
    }
    if (p1down) {
        p1y += 10;
    }
    if (p2up) {
        p2y -= 10
    }
    if (p2down) {
        p2y += 10;
    }
}

function cpu_move() {
    let y_guess = y + (2 * Math.random() - 1) * height * 0.15
    if (p2y > y_guess) {
        p2down = false;
        p2up = true;
    } else {
        p2up = false;
        p2down = true;
    }
}

function bounds() {
    if (p1y < 0) {
        p1y = 0;
    }
    if (p1y > height - p1Height) {
        p1y = height - p1Height;
    }
    if (p2y < 0) {
        p2y = 0;
    }
    if (p2y > height - p2Height) {
        p2y = height - p2Height;
    }

    // point
    if (x < 0 || x > width) {
        if(x < 0) {
            p2Score++;
        } else {
            p1Score++;
        }
        x = width/2;
        y = height/2;
        tickTime = 1000;
        speed *= -1;
    }
}

function physics() {
    x = x + speed * Math.cos(trajectory);
    y = y + speed * Math.sin(trajectory);
}

function draw() {
    ctx.fillRect(p1x, p1y, playerWidth, p1Height);
    ctx.fillRect(p2x, p2y, playerWidth, p2Height);
    ctx.fillRect(x,y,bWidth,bHeight);
}

function harder() {
    if (p1Score == 8) {
        alert('You Win')
        tickTime = 99999999;
    } else if (p2Score == 8) {
        alert('You Lose');
        tickTime = 99999999;
    } else {
        p1Height = playerHeight - p1Score * 10;
    }
}

function score() {
    sctx.clearRect(0, 0, scoreBoard.width, scoreBoard.height);
    sctx.font = '30px Arial';
    sctx.fillText(`Score: ${p1Score}:${p2Score}`, 100,100);
}

function tick() {
    tickTime = 10;
    clear();
    collision();
    movement();
    cpu_move();
    physics();
    bounds();
    draw();
    score();
    harder();
    window.setTimeout(tick, tickTime);
}

tick();
