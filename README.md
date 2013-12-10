plugapi
=======

A generic API for creating Plug.dj bots


## How to use
Due to a Plug update, the original version of PlugAPI from npm no longer works. You will have to use this fork for now.

You'll need a few npm packages first. Run the following:

```npm install node-uuid request uuid node-html-encoder cheerio ws```

To connect, do this!

```
var PlugAPI = require('./plugapi'); // git clone (or unzip) into the same directory as your .js file. There should be plugapi/package.json, for example (and other files)
var ROOM = 'chillout-mixer-ambient-triphop';
var UPDATECODE = '$&2h72=^^@jdBf_n!`-38UHs'; // We're not quite sure what this is yet, but the API doesn't work without it. It's possible that a future Plug update will change this, so check back here to see if this has changed, and set appropriately, if it has. You can omit using it if you wish - the value as of writing needs to be '$&2h72=^^@jdBf_n!`-38UHs', and is hardcoded into the bot in the event it is not specified below.

// Instead of providing the AUTH, you can use this static method to get the AUTH cookie via twitter login credentials:
PlugAPI.getAuth({
	username: 'xxx',
	password: 'xxx'
}, function(err, auth) { // if err is defined, an error occurred, most likely incorrect login
	if(err) {
		console.log("An error occurred: " + err);
		return;
	}
	var bot = new PlugAPI(auth, UPDATECODE);
	bot.connect(ROOM);

	bot.on('roomJoin', function(data) {
		// data object has information on the room - list of users, song currently playing, etc.
		console.log("Joined " + ROOM + ": ", data);
	});
});


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

####    roomJoin
```
data:
	user: [User object],
	room: [Room object]
```
Example:
```
 { user:
   { profile:
      { username: 'bot',
        status: 0,
        language: 'en',
        dateJoined: '2013-12-09T22:48:36.776000',
        djPoints: 0,
        fans: 2,
        listenerPoints: 0,
        avatarID: 'animal05',
        id: '...',
        curatorPoints: 0 },
     following: [],
     followers: [] },
  room:
   { boothCycle: false,
     ownerName: 'some user',
     owner: '...',
     ambassadors: { '...' }
     id: 'chillout-mixer-ambient-triphop',
     users: [ [Object], [Object] ],
     djs: [ [Object], [Object] ],
     media:
      { author: 'Killigrew',
        cid: 'h2grXTuoSaQ',
        format: '1',
        duration: 368,
        title: 'You  ||  Chillout',
        id: '1:h2grXTuoSaQ' },
     playlistID: '52906884877b92238ad962fc',
     admins: [ '...', '...' ],
     custom: null,
     lounge: null,
     score: 1,
     staff: { '...' : 3, '...' : 2 },
     description: '...',
     welcome: '...',
     votes: { '...': 1, '...': 1 },
     boothLocked: false,
     mediaStartTime: '2013-12-10 02:00:02.418000',
     currentDJ: '...',
     name: 'Chillout Mixer Ambient + Triphop',
     historyID: '...',
     curates: { '...': true } } }
```

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
{
	fromID: 'xxxxxxxxxxxxxxxxxxxxxxxx',
    message: 'hello world',
    from: 'mnme',
    type: 'chat',
    chatID: 'xxxxxxxxxx'
}
```
####	emote
```
data:
	fromID: 'user id'
	message: 'message text'
	from: 'username'
	type: 'emote'
	chatID: 'chat id'
```
Example:
```
{	fromID: 'xxxxxxxxxxxxxxxxxxxxxxxx',
    message: 'hello world',
    from: 'mnme',
    type: 'chat',
    chatID: 'xxxxxxxxxx' 
}
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


#### createPlaylist: (name, callback)


#### addSongToPlaylist: (playlist id, song id, callback)


#### getPlaylists: (callback)


#### activatePlaylist: (playlist id, callback)


#### playlistMoveSong: (playlist, song id, position, callback)
The 'playlist' argument must be a playlist object, the type that is returned from getPlaylists(). Song id is the the id of the song you wish to move, position an integer of where in the playlist it should be moved to (0 = first).


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

#### Multi line chat
Since Plug.dj cuts off chat messages at 250 characters, you can choose to have your bot split up chat messages into multiple lines:

```
var bot = new PlugAPI(auth, UPDATECODE);
bot.multiLine = true; // Set to true to enable multiline chat. Default is false
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

