## plugAPI  [![Build Status](https://img.shields.io/travis/plugCubed/plugAPI.svg)](https://travis-ci.org/plugCubed/plugAPI) [![npm version](http://img.shields.io/npm/v/plugapi.svg)](https://npmjs.org/package/plugapi) [![npm downloads](https://img.shields.io/npm/dm/plugapi.svg)](https://npmjs.org/package/plugapi) [![NPM](https://img.shields.io/npm/l/plugapi.svg)](https://github.com/plugCubed/plugAPI/blob/master/LICENSE.md) [![David](https://img.shields.io/david/plugcubed/plugapi.svg)](https://david-dm.org/plugcubed/plugapi) [![Slack Status](https://slack.plugcubed.net/badge.svg)](https://slack.plugcubed.net)


## About

A generic NodeJS API for creating plug.dj bots.

Originally by [Chris Vickery](https://github.com/chrisinajar), now maintained by [TAT](https://github.com/TATDK) and [The plug³ Team](https://github.com/plugCubed).

## How to use
Run the following:

``` javascript
npm install plugapi
```

You can choose to instantiate plugAPI with either Sync or Async:

**Sync:**

```javascript
const PlugAPI = require('plugapi');
const bot = new PlugAPI({
    email: '',
    password: ''
});

bot.connect('roomslug'); // The part after https://plug.dj

bot.on(PlugAPI.events.ROOM_JOIN, (room) => {
    console.log(`Joined ${room}`);
});
```

**Async:**

```javascript
const PlugAPI = require('plugapi');

new PlugAPI({
    email: '',
    password: ''
}, (err, bot) => {
    if (!err) {
        bot.connect('roomslug'); // The part after https://plug.dj

        bot.on(PlugAPI.events.ROOM_JOIN, (room) => {
            console.log(`Joined ${room}`);
        });
    } else {
        console.log(`Error initializing plugAPI: ${err}`);
    }
});
```
---
**New features in V5.0.0**

Guest login is now possible if no userdata is passed into plugAPI or guest is set to true

**Guest:**
```javascript
const PlugAPI = require('plugapi');
const bot = new PlugAPI();
// OR
const bot = new PlugAPI({
    guest: true
});
```

Facebook login is now possible. Easiest way to obtain the Access Token and user ID is to login via fb on plug and view the request data.

**Facebook:**
```javascript
const PlugAPI = require('plugapi');
const bot = new PlugAPI({
    facebook: {
        accessToken: 'xxxxxxxx',
        userID: 'xxxxxxxx'
    }
});
```

PlugAPI now uses tough-cookie to store cookies. Refer to the wiki for more information.

---
## Examples
Here are some bots that are using this API.

| Botname                                              | Room                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| AuntJackie                                           | [Mix-N-Mash](https://plug.dj/mix-n-mash-2)                      |
| BotX                                                 | [NightCore Fanclub](https://plug.dj/nightcore-fanclub)          |
| [BeavisBot](https://github.com/AvatarKava/BeavisBot) | [I <3 the 80's and 90's](https://plug.dj/i-the-80-s-and-90-s-1) |
| brainbot                                             | [5M4R7](https://plug.dj/5m4r7)                                  |
| Charlotte                                            | [Youtunes](https://plug.dj/youtunes)                            |
| -DnB-                                                | [Drum & Bass](https://plug.dj/drum-bass)                        |
| DRPG                                                 | [Discord Dungeons](https://plug.dj/discorddungeons)             |
| Ekko                                                 | [EDT](https://plug.dj/edtentertainment)                         |
| [F!shtank](https://github.com/botnation/fishtank)    | [SWaQ Hanger](https://plug.dj/swaq-hanger/)                     |
| FlavorBar                                            | [Flavorz](https://plug.dj/flavorz)                              |
| FoxBot                                               | [Approaching Nirvana](https://plug.dj/approachingnirvana)       |
| Holly Refbots                                        | [Connect The Songs (Read Info!)](https://plug.dj/connect-the-songs-read-info/) |
| KawaiiBot                                            | [AnimeMusic](https://plug.dj/hummingbird-me)                    |
| prehibicja                                           | [[PL] Prohibicja.xyz ANY GENRE](https://plug.dj/prohibicja)     |
| QBot                                                 | [EDM Qluster](https://plug.dj/qluster)                          |
| Skynet Cubed                                         | [PlugCubed](https://plug.dj/plugcubed)                          |
| TFLBot                                               | [The F**k Off Lounge \| TFL](https://plug.dj/thedark1337)       |
| [Toaster-chan](https://git.io/vDTfR)                 | [☆ ♥ Nightcore-331 ♥ ☆](https://plug.dj/nightcore)           |
Have a bot that uses the API? [**Let us know!**](https://github.com/plugCubed/plugAPI/issues/new)
---
## EventListener
You can listen on essentially any event that plug emits.
```javascript
// basic chat handler to show incoming chats formatted nicely
bot.on(PlugAPI.events.CHAT, (data) => {
    if (data.type === 'emote') {
        console.log(data.from + data.message);
    } else {`
        console.log(`${data.from} > ${ data.message}`);
    }
});
```

Here's an example for automatic reconnecting on errors / close events
```javascript
const reconnect = () => { bot.connect(ROOM); };

bot.on('close', reconnect);
bot.on('error', reconnect);
```
---

## API Documentation
For V4 documentation, the [Wiki](https://github.com/plugcubed/plugapi/wiki)  is the best resource.
For V5 documentation, please refer to the [Docs](https://plugcubed.github.io/PlugAPI) for documentation on methods and events.
The documentation is written in JSDoc in the respective files found in the lib/ folder.
If there are changes to be made, edit the JSDoc and run the followng command:
```javascript
npm run docs
```
Submit a pull request and wait for review

---
## Contribute
1. Clone repository to an empty folder.
2. CD to the folder containing the repository.
3. Run `npm install` to set up the environment.
4. Edit your changes in the code, and make sure it follows our codestyle.
5. Run `npm test` to make sure all tests pass.
6. After it's bug free, you may submit it as a Pull Request to this repository.
---
## Misc Options

**Multi line chat**

Since plug.dj cuts off chat messages at 250 characters, you can choose to have your bot split up chat messages into multiple lines.

**Delete Message Blocks**

With how plug currently works, deleting messages deletes the entire group of messages from the same user. Set this option to disallow that.

**Delete All Chat**

PlugAPI mimics plug's behavior in disallowing deletion of chat of users above the bot's rank. Setting this option to true will bypass that check.

```javascript
var bot = new PlugAPI(auth);
bot.deleteMessageBlocks = false; //set to true if you want the bot to not delete grouped messages. Default is false.
bot.deleteAllChat = false; // Set to true to enable deletion of chat regardless of role . Default is false
bot.multiLine = true; // Set to true to enable multi line chat. Default is false
bot.multiLineLimit = 5; // Set to the maximum number of lines the bot should split messages up into. Any text beyond this number will just be omitted. Default is 5.
```
