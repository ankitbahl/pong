const WebSocket = require('ws');
const fs = require('fs');
const args = process.argv

let http;
let serverOptions = {};
let cors;
if (args.includes('--prod')) {
    http = require('https');
    serverOptions = {
        cert: fs.readFileSync('fullchain.pem'),
        key: fs.readFileSync('privkey.pem')
    }
    cors = 'https://ankitbahl.com';
} else {
    http = require('http');
    cors = 'http://localhost:8000';
}

const server = http.createServer(serverOptions,
function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': cors
    })
    res.write(JSON.stringify({users}));
    res.end();
});

server.listen(8080);
console.log('Server listening on port 8080');
// for websocket
const wss = new WebSocket.Server({ server });
let clients = [];
let users = 0;

// for game state
let gameRunning = false;
let tickTime = 10;
const height = 500;
const width = 888;
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

wss.on('connection', function connection(ws) {

  // only 2 users at once
  if (users == 2) {
    ws.terminate();
    return;
  }
  ws.id = users;
  ws.send(JSON.stringify({type: 'init', user: users}));
  clients.push(ws);
  users++;

  // game ready to start
  if (users == 2) {
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({type: 'ready'}));
    })
    gameRunning = true;
    setTimeout(() => {
        wss.clients.forEach((client) => {
            client.send(JSON.stringify({type: 'start'}));
        })
        startGame();
    }, 3000);
    keepAliveCheck();
  }


  ws.on('message', function incoming(message) {
    let user = ws.id;
    if (user == 0) {
        p1y = parseInt(message);
        clients[1].send(JSON.stringify({type: 'player',y: p1y}))
    } else {
        p2y = parseInt(message);
        clients[0].send(JSON.stringify({type: 'player', y: p2y}))
    }
  });
});

function keepAliveCheck() {
    clients.forEach((client) => {
        client.isAlive = true;
    })
    clients.forEach((client) => {
        client.on('pong', () => {
            client.isAlive = true;
        })

        client.on('close', () => {
            clearInterval(interval);
            clients.forEach((client) => {
                if (client.isAlive) {
                    client.isAlive = false;
                    client.terminate();
                }
            });
            gameRunning = false;
        })
    });

    const interval = setInterval(() => {
        clients.forEach((client) => {
            if (!client.isAlive) {
                return client.terminate();
            }
            client.ping();
        })
    }, 5000);
}

function startGame() {
    tick();
}

function tick() {
    if (!gameRunning) {
        resetState();
        return;
    }
    physics();

    // if someone scores
    const result = bounds();
    if (result) {
        setTimeout(() => {
            clients.forEach((client) => {
                client.send(JSON.stringify({type: 'resume'}));
            });
            speed = 5;
            tick();
        }, 3000);
    } else {
        collision();
        sendUpdates();
        setTimeout(tick, tickTime);
    }
}

function sendUpdates() {
    clients.forEach((client) => {
        client.send(JSON.stringify({type: 'ball', x, y}));
    });
}

function physics() {
    x = x + speed * Math.cos(trajectory);
    y = y + speed * Math.sin(trajectory);
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
        if (x < 0) {
            p2Score++;
            clients.forEach((client) => {
                client.send(JSON.stringify({type: 'score', p: 1}));
            });
            trajectory = Math.PI /4;
            direction = true;
        } else {
            p1Score++;
            clients.forEach((client) => {
                client.send(JSON.stringify({type: 'score', p: 0}));
            });
            trajectory = 3 * Math.PI /4;
            direction = false;
        }
        x = width/2;
        y = height/2;
        speed = 0;
        return true;
    }
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
        if(direction) { // right
            trajectory += Math.PI / 2;
        } else { // left
            trajectory -= Math.PI / 2;
        }
    }

    // ball hits p1
    if ((x < p1x + playerWidth) && (x > p1x) && (y + bHeight > p1y) && (y < p1y + p1Height)) {
        direction = true;
        trajectory += Math.PI / 2;
    }

    // ball hits p2
    if ((x > p2x) && (x < p2x + playerWidth) && (y + bHeight > p2y) && (y < p2y + p2Height)) {
        direction = false;
        trajectory += Math.PI / 2;
    }
}

function resetState() {
    users = 0;
    p1y = 200;
    p2y = 200;
    p1Score = 0;
    p2Score = 0;
    x = width/2;
    y = height/2;
    trajectory = 3 * Math.PI /4;
    direction = false;
    speed = 5;
    clients = [];
}