var MESSAGE_LIMIT_WINDOW = 5; // number of seconds before message limit resets
var MESSAGE_LIMIT = 5; // number of messages that can be sent per reset
var COLOR_NAMES = ['maroon', 'red', 'orange', 'yellow', 'olive', 'green', 'purple', 'fuchsia', 'lime', 'teal', 'aqua', 'blue', 'navy', 'black', 'gray', 'silver', 'white', 'indianred', 'lightcoral', 'salmon', 'darksalmon', 'lightsalmon', 'crimson', 'firebrick', 'darkred', 'greenyellow', 'chartreuses', 'lawngreen', 'lime', 'limegreen', 'palegreen', 'lightgreen', 'mediumspringgreen', 'springgreen', 'mediumseagreen', 'seagreen', 'forestgreen', 'darkgreen', 'yellowgreen', 'olivedrab', 'darkolivegreen', 'mediumaquamarine','darkseagreen', 'lightseagreen', 'darkcyan', 'cornsilk', 'blanchedalmond', 'bisque', 'navajowhite', 'wheat', 'burlywood', 'tan', 'rosybrown', 'sandybrown', 'goldenrod', 'darkgoldenrod', 'peru', 'chocolate', 'saddlebrown', 'sienna', 'brown', 'maroon', 'lightsalmon', 'coral', 'tomato', 'orangered', 'darkorange', 'orange', 'gold', 'yellow', 'lightyellow', 'lemonchiffon', 'lightgoldenrodyellow', 'papayawhip', 'moccasin', 'peachpuff', 'palegoldenrod', 'khaki', 'darkkhaki', 'snow', 'honeydew', 'mintecream', 'azure', 'aliceblue', 'ghostwhite', 'whitesmoke', 'seashell', 'beige', 'oldlace', 'floralwhite', 'ivory', 'antiquewhite', 'linen', 'lavenderblush', 'mistyrose', 'aqua', 'cyan', 'lightcyan', 'paleturqoise', 'aquamarine', 'turqoise', 'mediumturqoise', 'darkturqoise', 'cadetblue', 'steelblue', 'lightsteelblue', 'powderblue', 'lightblue', 'skyblue', 'lightskyblue', 'deepskyblue', 'dodgerblue', 'cornflowerblue', 'mediumslateblue', 'royalblue', 'blue', 'mediumblue', 'darkblue', 'navy', 'midnightblue', 'lavender', 'thistle', 'plum', 'violet', 'orchid', 'magenta', 'mediumorchid', 'mediumpurple', 'amethyst', 'blueviolet', 'darkviolet', 'darkorchid', 'darkmagenta', 'purple', 'indigo', 'gainsboro', 'lightgrey', 'silver', 'darkgray', 'gray', 'dimgray', 'lightslategray', 'slategray', 'darkslategray', 'pink', 'lightpink', 'hotpink', 'deeppink', 'mediumvioletred', 'palevioletred'];
var USER;


// Setup basic express server
var express = require('express');
var prompt = require('prompt');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var port = process.env.PORT || 3000;
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
        /*if (data.split(' ')[0] == '/pm') {
            var usernames = data.split(/ (.+)?/)[1].trim().split(',');
            // var username = data.split(/ (.+)?/)[1].trim();
            // if (usernames[username]) {
            //     spin(username);
            //     sendSystemMessage(username + ' has been spun by ' + socket.username);
            // }
        }*/

        if (data.split(' ')[0] == '/color') {
            var color = data.split(' ')[1].trim();
            if (COLOR_NAMES.indexOf(color.toLowerCase()) > -1) {
                setColor(socket.username, color.toLowerCase());
                sendSystemMessage(socket.username + ' changed their color to ' + color.toLowerCase());
            }
            return;
        }

        if (data.split(' ')[0] == '/pm') {
            privatemsg = data.split(' ');
            //for (i=2;i<privatemsg.length;i++) {
            //    sendSystemMessage(privatemsg[i]);
            //}
            privatemsg.splice(1, 1);
            privatemsg.splice(0, 1)
            sendSystemMessage(privatemsg.join(' '));
        }

        if (messagesSinceReset == MESSAGE_LIMIT) {
            spin(socket.username);
            sendSystemMessage(socket.username + ' has been spun for spamming.');
            if (MESSAGE_LIMIT_WINDOW == 8) {
                kick(socket.username);
                sendSystemMessage(socket.username + ' has been kicked for excessive spam.');
            }
        }

        if (data.length <= 1000 & messagesSinceReset < MESSAGE_LIMIT && data.length > 0) {
            io.sockets.emit('new message', {
                username: socket.username,
                message: data,
                color: socket.color
            });
            messagesSinceReset += (data.length / 200);
        }
        messagesSinceReset++;
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        if (username.length > 64 || username.length < 1) {
            socket.emit('alert', 'Usernames must be between 1 and 64 characters.');
            socket.disconnect();
            return;
        }
        if (username.indexOf(' ') > -1) {
            socket.emit('alert', 'Usernames may not contain the space character " ".');
            socket.disconnect();
            return;
        }
        if (username[usernames]) {
            socket.emit('alert', 'That username is taken.');
            socket.disconnect();
            return;
        }
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

    socket.on('call admin', function (username, problem) {
        console.log(username + " is requesting an admin. Reason: " + problem);
    });

    socket.on('process pm', function(message, username) {
        messageArr = message.split(' ');
        sendTo = messageArr[1];
        for (i=2;i<messageArr.length;i++) {
            console.log(messageArr[i]);
        }
        messageArr.splice(0, 1);
        messageArr.splice(0, 1);
        socket.emit('send pm', messageArr, sendTo);
    })

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
    usernames[username].emit('alert', 'You have been kicked from the server.');
    usernames[username].disconnect();
    sendSystemMessage(username + " has been kicked.");
}

function spin(username) {
    usernames[username].emit('spin');
    sendSystemMessage(username + " has been spun by an administrator.");
}

function stop(username) {
    usernames[username].emit('stop');
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
        if (result.command == 'spin') {
            prompt.get(['username'], function(error, result) {
                spin(result.username);
                get();
            });
        }
    });
})();