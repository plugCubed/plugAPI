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
var ROOM = 'chillout-mixer-ambient-triphop;

var bot = new PlugAPI(AUTH);
bot.connect(ROOM); // Right now, you MUST specify the room here.

bot.on('connected', function() {
	bot.joinRoom(ROOM, function(data) {
		// data object has information on the room - list of users, song currently playing, etc.
		console.log("Joined " + ROOM + ": ", data);
	});
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

#### connect: ([roomName])

Connects to plug.dj and optionally joins a room.

##### roomName
*<small>string (optional)</small>*

The name of the room to join after succesful connection.

#### joinRoom: (name, [, callback:fn ])

Join a room on plug.dj

##### name
*<small>string (required)</small>*

The name of the room to join.

##### callback
*<small>callback (optional)</small>*

##### Example
*<small>This is not a parameter!</small>*
```
bot.joinRoom('coding-soundtrack');
```
#### chat: (msg)

Sends a Message in the Chat.

##### msg
*<small>string</small>*

The Message to send.

##### Example
*<small>This is not a parameter!</small>*
```
bot.chat('Hello World!');
```
#### woot: ([ callback:fn ])

Woots the actual song.

##### callback
*<small>callback (optional)</small>*

##### Example
*<small>This is not a parameter!</small>*
```
bot.woot();
```
#### meh: ([ callback:fn ])

Mehs the actual song.

##### callback
*<small>callback (optional)</small>*

##### Example
*<small>This is not a parameter!</small>*
```
bot.meh();
```
#### vote: (updown, [, callback:fn ])

Vote on the actual song with a string.

##### updown
*<small>string (required)</small>*

Either 'up' or 'down', calls the appropriate function (woot() or meh()).

##### callback
*<small>callback (optional)</small>*

##### Example
*<small>This is not a parameter!</small>*
```
bot.vote('up'); //woot the song
```
```
bot.vote('down'); //meh the song
```
#### changeRoomInfo: (name, description, [, callback:fn ])

Change actual room information. Only available if you are the host.

##### name
*<small>string (required)</small>*

A (new) name for the room.

##### description
*<small>string (required)</small>*

The rooms description.

##### callback
*<small>callback (optional)</small>*

##### Example
*<small>This is not a parameter!</small>*
```
bot.changeRoomInfo('Hello World', 'This is a new description for my room.');
```
#### changeRoomOptions: (boothLocked, waitListEnabled, maxPlays, maxDJs, [, callback:fn ])

If you are in a room and you are host, you can change the room options with this function.

##### boothLocked
*<small>boolean (required)</small>*

Toggles the booths state (locked or unlocked).

##### waitListEnabled
*<small>boolean (required)</small>*

Is there a waitlist in this room?

##### maxPlays
*<small>integer (required)</small>*

Maximum Plays per DJ.

##### maxDJs
*<small>integer (required)</small>*

Limit DJs on the booth to this number (usually 5).

##### callback
*<small>callback (optional)</small>*

##### Example
*<small>This is not a parameter!</small>*
```
bot.changeRoomOptions(false, false, 1, 5);
```
#### joinBooth: ([ callback:fn ])

Joins the DJ booth if there is a free place.

##### callback
*<small>callback (optional)</small>*

##### Example
*<small>This is not a parameter!</small>*
```
bot.joinBooth();
```
#### leaveBooth: ([ callback:fn ])

Leave the DJ booth.

##### callback
*<small>callback (optional)</small>*

##### Example
*<small>This is not a parameter!</small>*
```
bot.leaveBooth();
```
#### removeDj: (userid [, callback:fn ])

Removes a DJ from the DJ booth if possible. The user has to be in the booth and you need the permission to remove DJs from the booth.

##### callback
*<small>callback (optional)</small>*

##### Example
*<small>This is not a parameter!</small>*
```
bot.removeDJ('xxxxxxxxxxxxxxxxxxxxxxxx');
```
#### skipSong: ([ callback:fn ])

Skips the current song. You need to be DJ or have the permission to skip a song.

##### callback
*<small>callback (optional)</small>*

##### Example
*<small>This is not a parameter!</small>*

```
bot.skipSong();
```

#### getUsers: ()

Returns an object containing all the users currently in the room at the moment of calling.  Identical to Plug.DJ's API.getUsers()

#### getAmbassadors: ()

Returns array containing ambassadors currently in the room

#### getAudience: ()


#### getDJs: ()


#### getUsers: ()


#### getUser: (id)


#### getSelf: ()


#### getStaff: ()


#### getAdmins: ()


#### getAmbassadors: ()


#### getHost: ()


#### getMedia: ()


#### getWaitList: ()


#### getRoomScore: ()


#### sendChat: (message)


#### waitListJoin: ()


#### waitListLeave: ()


#### moderateForceSkip: ()


#### moderateAddDJ: (id)


#### moderateRemoveDJ: (id)


#### moderateKickUser: (id, reason)



## Avatars

this is a list of avatar names that can be used in user.set_avatar

* su01
* su02
* luclin01
* luclin02
* luclin03
* lazyrich
* revolvr
* anniemac
* halloween01
* halloween02
* halloween03
* halloween04
* halloween05
* halloween06
* halloween07
* halloween08
* halloween09
* halloween10
* halloween11
* halloween12
* halloween13
* lucha01
* lucha02
* lucha03
* lucha04
* lucha05
* lucha06
* lucha07
* lucha08
* monster01
* monster02
* monster03
* monster04
* monster05
* animal01
* animal02
* animal03
* animal04
* animal05
* animal06
* animal07
* animal08
* animal09
* animal10
* animal11
* animal12
* animal13
* bud01
* bud02
* bud03
* bud04
* bud05
* bud06
* bud07
* bud08
* bud09
* bud10
* bud11
* space01
* space02
* space03
* space04
* space05
* space06


##Misc

#### setLogObject(logger)
You can set your own custom logger for the API to use when it logs important events, such as errors or stack traces from the server.

The logger object must have a function called "log" that takes any number of parameters and prints them.

```
var prompt = new Prompt();
bot.setLogObject(prompt);
```