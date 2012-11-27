plugapi
=======

A generic API for creating Plug.dj bots


## How to use
Until it's in NPM, include the PlugAPI object by doing

```js
var PlugAPI = require('./src/')
```

To connect, do this!

```js
var AUTH = ''; // Put your auth token here, it's the cookie value for usr
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

## Actions
There aren't that many functions implemented yet, and I'm too lazy to document each one yet (HALP?)....

Here's a list:
	joinRoom: (name, callback)
	chat: (msg)
	woot: (callback)
	meh: (callback)
	vote: (updown, callback)
	changeRoomInfo: (name, description, callback)
	changeRoomOptions: (boothLocked, waitListEnabled, maxPlays, maxDJs, callback)