window.onload = function () {
    const box = new ReconnectingWebSocket(location.protocol.replace("http", "ws") + "//" + location.host + "/ws");
    const canvas = document.getElementById('myPics');
    const context = canvas.getContext('2d');
    const myId = s4() + s4() + '-' + s4();

    let pointermove;
    let isMobile;
    let server_connection = false;
    const puck = {
        color: 'black',
        fillcolor: 'red',
        radius: 10
    };
    const mallet = {
        color: 'black',
        fillcolor: 'white',
        radius: 15
    };

    if (navigator.userAgent.match(/iPhone|Android.+Mobile/)) {
        pointermove = 'touchmove';
        isMobile = true;
    } else {
        pointermove = 'mousemove';
        isMobile = false;
    }

    box.onmessage = (message) => {
        let data = JSON.parse(message.data);
        switch (data.message) {
            case 'ongame':
                context.clearRect(0, 0, canvas.width, canvas.height);
                drawCircle(context, puck.color, puck.fillcolor, puck.radius, data.puck);
                drawCircle(context, mallet.color, mallet.fillcolor, mallet.radius, data.p1);
                if (typeof data.p2 !== 'undefined') {
                    drawCircle(context, mallet.color, mallet.fillcolor, mallet.radius, data.p2);
                }
                break;
            case 'win':
                drawText(context, 'You Win!', '48px serif', 'red', canvas.width / 2, canvas.height / 2);
                drawText(context, 'Press ESC', '24px serif', 'black', canvas.width / 2, canvas.height - 30);
                break;
            case 'lose':
                drawText(context, 'You Lose!', '48px serif', 'blue', canvas.width / 2, canvas.height / 2);
                drawText(context, 'Press ESC', '24px serif', 'black', canvas.width / 2, canvas.height - 30);
                break;
            default:
                break;
        }
    };

    box.onclose = () => {
        console.log('box closed');
        server_connection = false;
        document.getElementById('log').textContent = 'Connecting to the server...';
        this.box = new ReconnectingWebSocket(box.url);
    };

    box.onopen = () => {
        console.log('connected to server');
        document.getElementById('log').textContent = 'Connected';
        server_connection = true;
        box.send(JSON.stringify({
            id: myId,
            message: 'first connection'
        }));
    };


    canvas.addEventListener(pointermove, e => {
        e.preventDefault();
        [x, y] = getPos(e, isMobile);
        y = clamp(y, canvas.height / 2 + mallet.radius, canvas.height - mallet.radius);
        x = clamp(x, mallet.radius, canvas.width - mallet.radius);

        if (server_connection === true) {
            try {
                box.send(JSON.stringify({
                    id: myId,
                    coord: { x: x, y: y },
                    message: 'move'
                }));
            } catch (err) {
                console.log(err);
            }
        }
    });

    window.addEventListener('keydown', e => {
        switch (e.key) {
            case 'Enter':
                box.send(JSON.stringify({ message: 'start' }));
                break;
            case 'Esc':
            case 'Escape':
                box.send(JSON.stringify({ message: 'reset' }));
                break;
            default:
                break;
        }
    });
};

function drawCircle(context, color, fillcolor, radius, coord) {
    context.beginPath();

    context.arc(coord.x, coord.y, radius, 0.0, 2.0 * Math.PI, false);
    context.fillStyle = fillcolor;
    context.fill();

    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
}

function drawText(context, text, font, color, x, y) {
    context.font = font;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.fillText(text, x, y);
}

function getPos(e, mobile) {
    if (mobile) {
        rect = e.target.getBoundingClientRect();
        x = (e.touches[0].clientX - window.pageXOffset - rect.left);
        y = (e.touches[0].clientY - window.pageYOffset - rect.top);
    } else {
        x = e.offsetX;
        y = e.offsetY;
    }
    return [x, y];
}

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}