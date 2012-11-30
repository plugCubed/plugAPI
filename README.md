plugapi
=======

A generic API for creating Plug.dj bots


## How to use
Just grab it from npm, or optionally use the lastest version for github

```
npm install plugapi
```

To connect, do this!

```
var AUTH = 'xxxxxxxxxxxxxxxxxxxxxxxxxxx=?_expires=xxxxxxxxxxxxxxxxxx==&user_id=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx='; // Put your auth token here, it's the cookie value for usr
var ROOM = 'coding-soundtrack';

var bot = new PlugAPI(AUTH);
bot.connect();

bot.on('connected', function() {
	bot.joinRoom('coding-soundtrack');
})
```

You can also pass the room directly to connect to save SO MUCH TIME
```
bot.connect(ROOM);
```

##Examples
Here are some bots using this API. Check out how they did it!

* https://github.com/chrisinajar/roboJar-plug
* https://github.com/martindale/snarl

Have a bot that uses the API? Let me know!

## Events
You can listen on essentially any event that plug emits. Many of the events also emit an alias event named after the ttapi version
```
// basic chat handler to show incoming chats formatted nicely
bot.on('chat', function(data) {
	if (data.type == 'emote')
		console.log(data.from+data.message)
	else
		console.log(data.from+"> "+data.message)
})
```

Here's an example for automatic reconnecting on errors / close events!
```
var reconnect = function() { bot.connect('coding-soundtrack'); };

bot.on('close', reconnect);
bot.on('error', reconnect);
```

Here's a list of events:

####	chat
```
data:
	fromID: 'user id'
	message: 'message text'
	from: 'username'
	type: 'message type'
	chatID: 'chat id'
type: 'chat'
```
Example:
```
{ data: 
   { fromID: 'xxxxxxxxxxxxxxxxxxxxxxxx',
     message: 'hello world',
     from: 'mnme',
     type: 'message',
     chatID: 'xxxxxxxxxx' },
  type: 'chat' }
```
####	userLeave
```
data:
	id: 'user id'
type: 'userLeave'
```
Example:
```
{ data: { id: 'xxxxxxxxxxxxxxxxxxxxxxxx' }, type: 'userLeave' }
```

####	userJoin
```
data:
	username: 'username'
	status: 0/1/2/3/4/5
	fans: fans
	listenerPoints: points from listeners
	language: 'language'
	avatarID: 'bud03'
	id: 'xxxxxxxxxxxxxxxxxxxxxxxx'
	curatorPoints: points from curators
	djPoints: points from DJing
type: 'userJoin'
```
Example:
```
{ data: 
   { username: 'mnme',
     status: 0,
     fans: 3,
     listenerPoints: 164,
     language: 'en',
     avatarID: 'bud03',
     id: 'xxxxxxxxxxxxxxxxxxxxxxxx',
     curatorPoints: 0,
     djPoints: 76 },
  type: 'userJoin' }
```

####	userUpdate
```
sorry, only saw one time :(
```

####	voteUpdate
```
data:
	vote: 1/0
	id: 'user id'
type: 'voteUpdate'
```
Example:
```
{ data: { vote: 1, id: 'user id' },
  type: 'voteUpdate' }
```

####	curateUpdate
```
data:
	id: 'user id' 
	type: 'curateUpdate'
```
Example:
```
{ data: { id: 'xxxxxxxxxxxxxxxxxxxxxxxx' },
  type: 'curateUpdate' }
```

####	djAdvance
```
data:
	currentDJ: 'user id'
	djs: [ [Object], [Object], [Object], [Object], [Object] ]
	mediaStartTime: 'start time'
	media: 
		title: 'song title'
		format: 'x'
		author: 'song author'
		cid: 'xxxxxxxx'
		duration: duration in seconds
		id: 'format:cid'
	playlistID: 'playlist id'
	earn: true/false
	historyID: 'id for song history'
type: 'djAdvance'
```
Example:
```
{ data: 
   { currentDJ: 'xxxxxxxxxxxxxxxxxxxxxxxx',
     djs: [ [Object], [Object], [Object], [Object], [Object] ],
     mediaStartTime: '2012-11-28 21:12:28.674382',
     media: 
      { title: 'Freefire - Dataloss (Darth & Vader Remix)',
        format: 'x',
        author: 'Mateus Rossetto',
        cid: 'xxxxxxxx',
        duration: 332.935,
        id: 'x:xxxxxxxx' },
     playlistID: 'xxxxxxxxxxxxxxxxxxxxxxxx',
     earn: true,
     historyID: 'xxxxxxxxxxxxxxxxxxxxxxxx' },
  type: 'djAdvance' }
```

####	djUpdate
```
data: 
	plays: times the dj played a song, id: 'user id'
	plays: times the dj played a song, id: 'user id'
	plays: times the dj played a song, id: 'user id'
	plays: times the dj played a song, id: 'user id'
    plays: times the dj played a song, id: 'user id'
type: 'djUpdate'
```
Example:
```
{ data: 
   [ { plays: 2, id: 'xxxxxxxxxxxxxxxxxxxxxxxx' },
     { plays: 13, id: 'xxxxxxxxxxxxxxxxxxxxxxxx' },
     { plays: 7, id: 'xxxxxxxxxxxxxxxxxxxxxxxx' },
     { plays: 10, id: 'xxxxxxxxxxxxxxxxxxxxxxxx' },
     { plays: 0, id: 'xxxxxxxxxxxxxxxxxxxxxxxx' } ],
  type: 'djUpdate' }
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

##Misc

#### setLogObject(logger)
You can set your own custom logger for the API to use when it logs important events, such as errors or stack traces from the server.

The logger object must have a function called "log" that takes any number of parameters and prints them.

```
var prompt = new Prompt();
bot.setLogObject(prompt);
```