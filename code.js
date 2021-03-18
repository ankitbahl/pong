const devMode = true;
let serverUrl, websocketUrl, ws;
if (devMode) {
    serverUrl = 'http://localhost:8080';
    websocketUrl = 'ws://localhost:8080';
} else {
    serverUrl = 'https://pong.ankitbahl.com:8080';
    websocketUrl = 'wss://pong.ankitbahl.com:8080';
}

refreshStatus();

function refreshStatus() {
    let req = new XMLHttpRequest();
    req.timeout = 5000;
    req.onload = function(e) {
        const status = JSON.parse(req.response);
        document.getElementById('status').innerText = `Server online, ${status.users}/2 connected`;
        const button = document.getElementById('connect');
        button.onclick = () => {
            connectToServer();
            button.onclick = ()=>{};
            button.disabled = true;
        };
        button.disabled = false;
    }
    req.onerror = function(e) {
        document.getElementById('status').innerText = 'Server offline';
    }
    req.ontimeout = function(e) {
        document.getElementById('status').innerText = 'Server offline';
    }
    req.open('GET', serverUrl);
    req.send();
}

let connected = false;
let user;

function connectToServer() {
    ws = new WebSocket(websocketUrl);
    ws.onopen = function(event) {
        connected = true;
        ws.onmessage = function(event) {
            let json = JSON.parse(event.data);
            switch(json.type) {
                case 'init':
                    user = json.user;
                    console.log('you are user %s', user);
                    document.getElementById('status').innerText = `Server online, ${user + 1}/2 connected`;
                    break;
                case 'ready':
                    console.log('ready');
                    document.getElementById('status').innerText = 'All players connected, starting in 3s';
                    setTimeout(() => {
                        document.getElementById('status').innerText = 'All players connected, starting in 2s';
                        setTimeout(() => {
                            document.getElementById('status').innerText = 'All players connected, starting in 1s';
                        }, 1000);
                    }, 1000);
                    break;
                case 'start':
                    console.log('game start');
                    document.getElementById('status').innerText = 'Game started';
                    tick();
                    break;
                case 'ball':
                    x = json.x;
                    y = json.y;
                    break;
                case 'player':
                    if (user == 0) {
                        p2y = json.y;
                    } else {
                        p1y = json.y;
                    }
                    break;
                case 'score':
                    speed = 0;
                    if (json.p == 0) {
                        p1Score += 1;
                        trajectory = 3 * Math.PI /4;
                        direction = false;
                    } else {
                        p2Score += 1;
                        trajectory = Math.PI /4;
                        direction = true;
                    }
                    x = width/2;
                    y = height/2;
                    break;
                case 'resume':
                    speed = 5;
                default:
                break;
            }
        }
    }

    ws.onclose = function(event) {
        console.log('connection closed by server');
        alert('connection broke, have to refresh');
        connected = false;
    }
}

// STATE
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
          if (user == 0) {
              p1up = true;
          } else {
              p2up = true;
          }
          break;
      case 'ArrowDown':
          if (user == 0) {
              p1down = true;
          } else {
              p2down = true;
          }
          break;
  }
};
window.onkeyup = function (e) {
  switch(e.code) {
      case 'ArrowUp':
          if (user == 0) {
            p1up = false;
          } else {
            p2up = false;
          }
          break;
      case 'ArrowDown':
            if (user == 0) {
              p1down = false;
            } else {
              p2down = false;
            }
          break;
  }
};

function clear() {
    ctx.clearRect(0 , 0, width, height);
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

function sendUpdates() {
    if (user == 0) {
        ws.send(p1y);
    } else {
        ws.send(p2y);
    }
}

function tick() {
    sendUpdates()
    movement();
    physics();
    bounds();
    collision();
    clear();
    draw();
    score();
//    harder();
    if (connected) {
        window.setTimeout(tick, tickTime);
    }
}
