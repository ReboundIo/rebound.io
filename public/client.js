var mySocket;
var unreadMessages = 0;
var i, link_tag;
var themeSelect;
//checkNameColor();
var bannedWords = ["shit", "SHIT", "fuck", "FUCK", "damn", "DAMN", "bitch", "BITCH", "dick", "DICK", "cock", "COCK", "pussy", "PUSSY", "asshole", "ASSHOLE", "fag", "FAG", "bastard", "BASTARD", "hoda", "HODA"];
var replaceWords = ["potatoes", "POTATOES", "hug", "HUG", "throw tomatoes at", "THROW TOMATOES AT", "illuminati", "ILLUMINATI", "nose", "NOSE", "candy", "CANDY", "music box", "MUSIC BOX", "avocado", "AVOCADO", "amazing person", "AMAZING PERSON", "gift to the world", "GIFT TO THE WORLD", "one-does-not-simply-walk-into-hordor", "naturally-a-disaster"];

var messageAlert = new Audio('messagealert.mp3');

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
            log("/pm username message - sends a private message to a user");
            log("/kickme - kick yourself from the server");
            log("/emoji - shows you a list of all the available symbols/emoticons");
        } else if (message == "/emoji ") {
            log(":)");
            log(":(");
            log("YesCat");
            log("NoCat");
            log("AngryCat");
            log("InLove");
            log("ThumbsUp");
            log("ConfusedCat");
            log("ExcitedCat");
            log("HiCat");
            log("ShrugCat");
            log("SleepyCat");
            log("LaughingCat");
            log("GrossCat");
            log("CatCat");
            log("PizzaCat");
            log("BurgerCat");
            log("EyeRoll");
            log("SunglassesCat");
            log("DogCat");
            log("All emoji made by Cindy Suen");
        } else if (message == "/kick ") {
            var verifyKey = prompt("Enter your admin key:");
            var kickUser = prompt("Who do you want to kick?");
            socket.emit('send admin key: kick', verifyKey, kickUser, username);
        } else if (message == "/spin ") {
            verifyKey = prompt("Enter your admin key:");
            var spinUser = prompt("Who would you like to spin?");
            socket.emit('send admin key: spin', verifyKey, spinUser, username);
        } else if (message.split(' ')[0] == "/pm") {
            socket.emit('process pm', message, message.split(' ')[1], username);
        } else if (message = "/theme ") {
          log("defauilt");
          log("light");
          log("seahawks");
        } else if (message = message.split(' ')[0] == "/settheme") {
          switchStyle(message.split(' ')[1]);
        } else {
          socket.emit('new message', message, 1, username);
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

    socket.on('send pm', function(message, recipient, sender) {
        if (username == recipient) {
            log(sender + " sent you: " + message);
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
        messageData = data.message;
        // adding variables for the emoji
        var $yesEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/10-cindysuen--yes.gif" alt="YesCat" height="60" width="60">')
        var $noEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/11-cindysuen-no.gif" alt="NoCat" height="60" width="60">')
        var $happyEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/01-cindysuen-happy-cat.gif" alt="HappyCat" height="60" width="60">')
        var $sadEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/02-cindysuen-sad.gif" alt="SadCat" height="60", width="60">')
        var $angryEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/04-cindysuen-angry.gif" alt="AngryCat" height="60" width="60">')
        var $winkEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/03-cindysuen-wink.gif" alt="WinkCat" height="60" width="60">')
        var $loveEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/05-cindysuen-love.gif" alt="LoveCat" height="60" width="60">')
        var $thumbsUp = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/06-cindysuen-thumbs-up.gif" alt="ThumbsUp" height="60" width="60">')
        var $confusedEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/07-cindysuen-confused.gif" alt="ConfusedCat" height="60" width="60">')
        var $excitedEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/08-cindysuen-excited.gif" alt="ExcitedCat" height="60" width="60">')
        var $helloEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/09-cindysuen-hi.gif" alt="HiCat" height="60" width="60">')
        var $shrugEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/12-cindysuen-shrug.gif" alt="ShrugCat" height="60" width="60">')
        var $tiredEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/13-cindysuen-tired.gif" alt="SleepyCat" height="60" width="60">')
        var $laughingEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/14-cindysuen-laughing.gif" alt="LaughingCat" height="60" width="60">')
        var $grossEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/15-cindysuen-gross.gif" alt="GrossCat" height="60" width="60">')
        var $catEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/16-cindysuen-cat.gif" alt="CatCat" height="60" width="60">')
        var $pizzaEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/17-cindysuen-pizza.gif" alt="PizzaCat" height="60" width="60">')
        var $burgerEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/18-cindysuen--burger.gif" alt="BurgerCat" height="60" width="60">')
        var $eyerollEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/19-cindysuen-eye-roll.gif" alt="EyeRoll" height="60" width="60">')
        var $sunglassesEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/20-cindysuen-glasses.gif" alt="SunglassesCat" height=="60" width="60">')
        var $dogEmoji = $('<img src="http://payload229.cargocollective.com/1/6/216395/6882409/21-cindysuen-dog.gif" alt="DogCat" height="60" width="60">')

        var typingClass = data.typing ? 'typing' : '';
        if (data.message.indexOf("YesCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("YesCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $yesEmoji);
        } else if (data.message.indexOf("NoCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("NoCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $noEmoji);
        } else if (data.message.indexOf(":)") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace(":)", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $happyEmoji);
        } else if (data.message.indexOf(":(") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace(":(", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $sadEmoji);
        } else if (data.message.indexOf("AngryCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("AngryCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $angryEmoji);
        } else if (data.message.indexOf(";)") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace(";)", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $winkEmoji);
        } else if (data.message.indexOf("InLove") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("InLove", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $loveEmoji);
        } else if (data.message.indexOf("ThumbsUp") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("ThumbsUp", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $thumbsUp);
        } else if (data.message.indexOf("ConfusedCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("ConfusedCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $confusedEmoji);
        } else if (data.message.indexOf("ExcitedCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("ExcitedCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $excitedEmoji);
        } else if (data.message.indexOf("HiCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("HiCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $helloEmoji);
        } else if (data.message.indexOf("ShrugCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("ShrugCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $shrugEmoji);
        } else if (data.message.indexOf("SleepyCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("SleepyCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $tiredEmoji);
        } else if (data.message.indexOf("LaughingCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("LaughingCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $laughingEmoji);
        } else if (data.message.indexOf("GrossCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("GrossCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $grossEmoji);
        } else if (data.message.indexOf("CatCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("CatCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $catEmoji);
        } else if (data.message.indexOf("PizzaCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("PizzaCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $pizzaEmoji);
        } else if (data.message.indexOf("BurgerCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("BurgerCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $burgerEmoji);
        } else if (data.message.indexOf("EyeRoll") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("EyeRoll", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $eyerollEmoji);
        } else if (data.message.indexOf("SunglassesCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("SunglassesCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $sunglassesEmoji);
        } else if (data.message.indexOf("DogCat") != -1) {
          $messageBodyDiv = $('<span class="messageBody">')
          .text(messageData.replace("DogCat", ""));
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv, $dogEmoji);
        } else {
          var $messageDiv = $('<li class="message"/>')
          .data('username', data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv);
        }

        for (i = 0;i < 24;i++) {

          if (data.message.indexOf(bannedWords[i]) != -1) {
            $messageBodyDiv = $('<span class="messageBody">')
            .text(messageData.replace(bannedWords[i], replaceWords[i]));
            var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);
          }

        }

        var messageArray = data.message.split(' ');
        for (i=0;i<messageArray.length;i++) {
          if (messageArray[i].indexOf('http://') != -1) {
            $messageBodyDiv = $('<span class="messageBody">')
            .text(messageArray[i].replace(messageArray[i], " "));
            var $messageImage = $('<a href="' + messageArray[i] + '">' + '<img src="' + messageArray[i] + '" height="10%" width="10%">');
            var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageImage, $messageBodyDiv);
          }
        }

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
            messageAlert.play();
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

    socket.on('save color to cookie', function(color){
      setCookie("name color", color, "Thu, 31 Dec 2099 12:00:00 UTC");
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

//Name color stuff

/*function checkNameColor() {
  var checkColor = document.cookie;
  socket.emit('set prev color', checkColor, username);
}

function setCookie(cookiename,cookievalue,expdate) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname+"="+cvalue+"; "+expires;
}*/
