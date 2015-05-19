var MESSAGE_LIMIT_WINDOW = 5; // number of seconds before message limit resets
var MESSAGE_LIMIT = 5; // number of messages that can be sent per reset
var COLOR_NAMES = ['maroon', 'red', 'orange', 'yellow', 'olive', 'green', 'purple', 'fuchsia', 'lime', 'teal', 'aqua', 'blue', 'navy', 'black', 'gray', 'silver', 'white', 'indianred', 'lightcoral', 'salmon', 'darksalmon', 'lightsalmon', 'crimson', 'firebrick', 'darkred', 'greenyellow', 'chartreuses', 'lawngreen', 'lime', 'limegreen', 'palegreen', 'lightgreen', 'mediumspringgreen', 'springgreen', 'mediumseagreen', 'seagreen', 'forestgreen', 'darkgreen', 'yellowgreen', 'olivedrab', 'darkolivegreen', 'mediumaquamarine','darkseagreen', 'lightseagreen', 'darkcyan', 'cornsilk', 'blanchedalmond', 'bisque', 'navajowhite', 'wheat', 'burlywood', 'tan', 'rosybrown', 'sandybrown', 'goldenrod', 'darkgoldenrod', 'peru', 'chocolate', 'saddlebrown'];

// Setup basic express server
var express = require('express');
var prompt = require('prompt');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var port = process.env.PORT || 3001;
var users = [];

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
    var addedUser = false;
    var messagesSinceReset = 0;

    socket.color = '#dddddd';

    setInterval(function() {
        messagesSinceReset = 0;
    }, MESSAGE_LIMIT_WINDOW * 1000);

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        if (data.split(' ')[0] == '/color') {
            var color = data.split(' ')[1].trim();
            if (COLOR_NAMES.indexOf(color.toLowerCase()) > -1) {
                setColor(socket.username, color.toLowerCase());
                sendSystemMessage(socket.username + ' changed their color to ' + color.toLowerCase());
            }
            return;
        }
        // we tell the client to execute 'new message'
        if (data.length <= 1000 & messagesSinceReset < MESSAGE_LIMIT && data.trim().length > 0) {
            io.sockets.emit('new message', {
                username: socket.username,
                message: data,
                color: socket.color
            });
            messagesSinceReset++;
        }
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        // we store the username in the socket session for this client

        var address = socket.request.connection.remoteAddress;

        socket.username = username;
        // add the client's username to the global list

        users.push(username);
        currentUsers = users;

        socket.emit("fill roster", users);

        usernames[username] = socket;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        // remove the username from global usernames list
        var address = socket.request.connection.remoteAddress;

        if (addedUser) {
            delete usernames[socket.username];
            --numUsers;

            users.splice(users.indexOf(socket.username), 1);
            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});

function sendSystemMessage(message) {
    io.sockets.emit('system', message);
}

function kick(username) {
    usernames[username].emit('kick');
    sendSystemMessage(username + ' has been kicked.')
    usernames[username].disconnect();
}

function setColor(username, color) {
    usernames[username].color = color;
}

prompt.start();

(function get() {
    prompt.get(['command'], function(error, result) {
        if (result.command == 'system') {
            prompt.get(['message'], function(error, result) {
                sendSystemMessage(result.message);
                get();
            });
        }
        if (result.command == 'kick') {
            prompt.get(['username'], function(error, result) {
                kick(result.username);
                get();
            });
        }
        if (result.command == 'color') {
            prompt.get(['username', 'color'], function(error, result) {
                setColor(result.username, result.color)
                get();
            });
        }
    });
})();
