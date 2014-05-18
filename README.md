plugapi
=======

A generic API for creating plug.dj bots.

Originally by [Chris Vickery](https://github.com/chrisinajar), now maintained by [TAT](https://github.com/TATDK).

## How to use
Run the following:

```npm install plugapi --production```

To connect, do this!

```
var PlugAPI = require('plugapi'),
    AUTH = 'xxxxxxxxxxxxxxxxxxxxxxxxxxx=?_expires=xxxxxxxxxxxxxxxxxx==&user_id=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=', // Put your auth token here, it's the cookie value for usr
    ROOM = '';

var bot = new PlugAPI(AUTH);
bot.connect(ROOM);

bot.on('roomJoin', function(room) {
    console.log("Joined " + room);
});
```

##Examples
Here are some bots using this API.

* FoxBot in Approaching Nirvana
* Upcoming LiteBot in Radiant Music

Have a bot that uses the API? Let me know!

## EventListener
You can listen on essentially any event that plug emits.
```
// basic chat handler to show incoming chats formatted nicely
bot.on('chat', function(data) {
    if (data.type == 'emote')
        console.log(data.from + data.message);
    else
        console.log(data.from + "> " + data.message);
});
```

Here's an example for automatic reconnecting on errors / close events!
```
var reconnect = function() { bot.connect(ROOM); };

bot.on('close', reconnect);
bot.on('error', reconnect);
```

## Events

Read about some of the events on the [wiki](https://github.com/TATDK/plugapi/wiki/events).

## Actions

Read about the actions on the [wiki](https://github.com/TATDK/plugapi/wiki/actions).

## Contribute
1. Clone repository to empty folder.
2. Cd to the repository.
3. Run `npm install` to set up the environment.
4. Edit your code.
5. Run `grunt` to compile the code and test.
6. After it's bug free, you may submit it as a Pull Request to the main repo.

## Misc

#### Multi line chat
Since Plug.dj cuts off chat messages at 250 characters, you can choose to have your bot split up chat messages into multiple lines:

```
var bot = new PlugAPI(auth);
bot.multiLine = true; // Set to true to enable multi line chat. Default is false
bot.multiLineLimit = 5; // Set to the maximum number of lines the bot should split messages up into. Any text beyond this number will just be omitted. Default is 5.
```

#### TCP Server
You can start up a TCP server the bot will listen to, for remote administration

Example:
```
    bot.tcpListen(6666, 'localhost');
    bot.on('tcpConnect', function(socket) {
        // executed when someone telnets into localhost port 6666
    });

    bot.on('tcpMessage', function(socket, msg) {
        // Use socket.write, for example, to send output back to the telnet session
        // 'msg' is whatever was entered by the user in the telnet session
    });
```