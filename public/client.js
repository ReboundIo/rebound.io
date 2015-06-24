var mySocket;
var unreadMessages = 0;
var i, link_tag;
var themeSelect;

$(function() {
    var FADE_TIME = 300; // ms
    var TYPING_TIMER_LENGTH = 400; // ms

    // Initialize varibles
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box
    var userRoster = document.getElementById('userRoster');
    var $loginPage = $('.login.page'); // The login page
    var $chatPage = $('.chat.page'); // The chatroom page
    // The variable holding the amount of messages sent
    var messagesSent = 0;
    var bannedNames = ["rA1nB0wUn1c0rN", "rA1Nb0wUn1c0rN", "rA1Nb0w_Un1c0rN", "ra1nb0wun1c0rn", "rainbowunicorn"];
    // Prompt for setting a username
    var username;
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();

    var socket = io();

    function addParticipantsMessage (data) {
        var message = '';
        if (data.numUsers === 1) {
            message += "There is currently 1 user.";
        } else {
            message += "There are currently " + data.numUsers + " users.";
        }
        log(message);
    }

    // Sets the client's username
    function setUsername () {
        username = cleanInput($usernameInput.val().trim());

        // If the username is valid
        if (username) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            $currentInput = $inputMessage.focus();
            // Tell the server your username

            //addUserToRoster(username);

            //removeUserFromRoster(username);
            socket.emit('add user', username);

            //addUserToRoster(users);
        }
    }

    function spamBlock(){
        messagesSent = 0;
    };

    // Sends a chat message
    function sendMessage () {
        var message = $inputMessage.val();

        // Prevent markup from being injected into the message
        message = cleanInput(message);
        message = message + " "; //adding a blank space

        $inputMessage.val('');

        if (message == "/color ") {
            log("You can enter the name of any color from this site: http://www.quackit.com/html/html_color_codes.cfm");
        } else if (message == "/calladmin ") {
            reportReason = prompt("Why do you need an admin (if someone is causing trouble, include their username)?");
            socket.emit('call admin', username, reportReason);
        } else if (message == "/kickme ") {
            addSystemMessage("You kicked yourself.");
            alert("Why? Why did you do this to yourself?");
            socket.disconnect();
        } else if (message == "/help ") {
            log("/help - displays the list of available commands");
            log("/color - gives you a list of the available colors");
            log("/color colornamehere - changes your username color");
            log("/calladmin - allows you to send a private message to the admins, especially to alert them of spammers");
            log("/pm username message - sends private messages ##does not work yet");
            log("/kickme - kick yourself from the server");
        } else if (message == "/kick ") {
            var verifyKey = prompt("Enter your admin key:");
            var kickUser = prompt("Who do you want to kick?");
            socket.emit('send admin key: kick', verifyKey, kickUser, username);
        } else if (message == "/spin ") {
            verifyKey = prompt("Enter your admin key:");
            var spinUser = prompt("Who would you like to spin?");
            socket.emit('send admin key: spin', verifyKey, spinUser, username);
        } else {
            socket.emit('new message', message);
        }
    }

    // Log a message
    function log (message, options) {
        var $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    socket.on('fill roster', function (connectedUsers) {
      for (i = 0; i < connectedUsers.length; i++) {
        addUserToRoster(connectedUsers[i]);
      }
    })

    socket.on('send pm', function(message, recipient) {
        if (username == recipient) {
            log("PM: " + message);
        }
    })



    // Adds the visual chat message to the message list
    function addChatMessage (data, options) {
        // Don't fade the message in if there is an 'X was typing'
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var $usernameDiv = $('<span class="username"/>')
        .text(data.username)
        .css('color', data.color);
        var $messageBodyDiv = $('<span class="messageBody">')
        .text(data.message);

        var typingClass = data.typing ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>')
        .data('username', data.username)
        .addClass(typingClass)
        .append($usernameDiv, $messageBodyDiv);

        if ($messageDiv !== " ") {
            addMessageElement($messageDiv, options);
        } else {
            alert("You have been kicked for spam.");
            socket.disconnect();
        }
    }

    function addSystemMessage(message) {
        var messageElement = document.createElement('li');
        messageElement.className = 'message';

        var messageBody = document.createElement('span');
        messageBody.innerHTML = '[System] ' + message;
        messageBody.className = 'system';

        messageElement.appendChild(messageBody);
        addMessageElement(messageElement);
    }

    // Adds the visual chat typing message
    function addChatTyping (data) {
        data.typing = true;
        data.message = 'is typing...';
        addChatMessage(data);
    }

    // Removes the visual chat typing message
    function removeChatTyping (data) {
        getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        });
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    function addMessageElement (el, options) {
        var $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    // Prevents input from having injected markup
    function cleanInput (input) {
        return $('<div/>').text(input).text();
    }

    // Updates the typing event
    function updateTyping () {
        if (connected) {
            if (!typing) {
                typing = true;
                socket.emit('typing');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(function () {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    socket.emit('stop typing');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    // Gets the 'X is typing' messages of a user
    function getTypingMessages (data) {
        return $('.typing.message').filter(function (i) {
            return $(this).data('username') === data.username;
        });
    }

    // Keyboard events

    $window.keydown(function (event) {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                setUsername();
            }
        }
    });

    $inputMessage.on('input', function() {
        updateTyping();
    });

    // Click events

    // Focus input when clicking anywhere on login page
    $loginPage.click(function () {
        $currentInput.focus();
    });

    // Focus input when clicking on the message input's border
    $inputMessage.click(function () {
        $inputMessage.focus();
    });

    // Socket events

    // Whenever the server emits 'login', log the login message
    socket.on('login', function (data) {
        connected = true;
        // Display the welcome message
        var message = "You have been successfully connected to the chatroom.";
        log(message, {
            prepend: true
        });
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'new message', update the chat body
    socket.on('new message', function(message, room) {
        if (!windowFocused) {
            unreadMessages++;
            updateTitle();
        }
        addChatMessage(message);
    });

    socket.on('system', addSystemMessage);

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function (data) {
        log(data.username + ' has entered the room.');
        addParticipantsMessage(data);
        addUserToRoster(data.username);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (data) {
        log(data.username + ' has exited the room.');
        addParticipantsMessage(data);
        removeChatTyping(data);
        removeUserFromRoster(data.username);
    });

    // Whenever the server emits 'typing', show the typing message
    socket.on('typing', function (data) {
        addChatTyping(data);
    });

    // Whenever the server emits 'stop typing', kill the typing message
    socket.on('stop typing', function (data) {
        removeChatTyping(data);
    });

    socket.on('alert', function(message) {
        alert(message);
    });

    socket.on('spin', function() {
        document.body.className = 'spinning';
    });
});


var userItems = {};

function addUserToRoster(username) {
    var userItem = document.createElement('li');
    userItem.innerHTML = username;
    userRoster.appendChild(userItem);
    userItems[username] = userItem;
}

function removeUserFromRoster(username) {
    userRoster.removeChild(userItems[username]);
}

function defaultTheme() {
    theme = "Dark";
    document.cookie = theme+"; expires=Thu, 31 Dec 2099 12:34:56 UTC";
}

window.onload=function() {
    setInterval(updateTheme, 1);
};

window.onfocus = function() {
    windowFocused = true;
    unreadMessages = 0;
    updateTitle();
};

window.onblur = function() {
    windowFocused = false;
}

function updateTheme() {
    if (theme == "Dark") {

    }
}

function updateTitle() {
    if (unreadMessages == 0) {
        document.title = 'Rebound Chat';
    }
    else {
        document.title = '[' + unreadMessages + '] Rebound Chat';
    }
}

//Script for changing the theme.

function switchStyle(css_title) {
  var i, link_tag ;
  for (i = 0, link_tag = document.getElementsByTagName("link") ;
    i < link_tag.length ; i++ ) {
    if ((link_tag[i].rel.indexOf( "stylesheet" ) != -1) &&
      link_tag[i].title) {
      link_tag[i].disabled = true ;
      if (link_tag[i].title == css_title) {
        link_tag[i].disabled = false ;
      }
    }
  }
}

function updateTheme() {
    themeSelect = document.getElementById("themeSelect").value;
    
    if (themeSelect = "Dark Theme") {
        switchStyle('dark');
        return false;
    } else if (themeSelect = "Light Theme") {
        switchStyle('dark');
        return false;
    } else if (themeSelect = "Seahawks Theme") {
        switchStyle('blue');
        return false;
    }
}
