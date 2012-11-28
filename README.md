plugapi
=======

A generic API for creating Plug.dj bots


## How to use
Just grab it from npm, or optionally use the lastest version for github

```
npm install plugapi
```

To connect, do this!

```js
var AUTH = 'xxxxxxxxxxxxxxxxxxxxxxxxxxx=?_expires=xxxxxxxxxxxxxxxxxx==&user_id=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx='; // Put your auth token here, it's the cookie value for usr
var ROOM = 'coding-soundtrack';

var bot = new PlugAPI(AUTH);
bot.connect();

bot.on('connected', function() {
	bot.joinRoom('coding-soundtrack');
})
```

You can also pass the room directly to connect to save SO MUCH TIME
```js
bot.connect(ROOM);
```

## Events
You can listen on essentially any event that plug emits. Many of the events also emit an alias event named after the ttapi version
```js
// basic chat handler to show incoming chats formatted nicely
bot.on('chat', function(data) {
	if (data.type == 'emote')
		console.log(data.from+data.message)
	else
		console.log(data.from+"> "+data.message)
})
```

Here's an example for automatic reconnecting on errors / close events!
```js
var reconnect = function() { bot.connect('coding-soundtrack'); };

bot.on('close', reconnect);
bot.on('error', reconnect);
```

## Actions
There aren't that many functions implemented yet, and I'm too lazy to document each one yet (HALP?)....

Here's a list:
####	connect: ([roomName])
####	joinRoom: (name, [, callback:fn ])
####	chat: (msg)
####	woot: ([ callback:fn ])
####	meh: ([ callback:fn ])
####	vote: (updown, [, callback:fn ])
####	changeRoomInfo: (name, description, [, callback:fn ])
####	changeRoomOptions: (boothLocked, waitListEnabled, maxPlays, maxDJs, [, callback:fn ])
####	joinBooth: ([ callback:fn ])
####	leaveBooth: ([ callback:fn ])
####	removeDj: (userid [, callback:fn ])
####	skipSong: ([ callback:fn ])
