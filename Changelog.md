plugAPI Changelog
=================

5.1.1
---
* **UPDATED:** Dependencies to latest versions. (Commit [18f9c01](https://github.com/plugCubed/plugAPI/commit/18f9c019814f261df224254ee96c77feaaf2a2fc))
* **ADDED/CHANGED:** Added in ability to change both long description and short description (Commit [7f53b32](https://github.com/plugCubed/plugAPI/commit/7f53b32d468f9b1114cb1cf2c7721be439893bed))

5.1.0
----
* **ADDED:** Added methods to set / get badges (Commit [1ff7f73](https://github.com/plugCubed/plugAPI/commit/1ff7f7335a))
* **CHANGED:**  Remove logging for some plugdj events and ignore instead (Will still be emitted) (Commit [8e8474c](https://github.com/plugcubed/plugapi/commit/8e8474c05d))
* **CHANGED:**  Parse strings as numbers in API methods that require it (Commit [8e8474c](https://github.com/plugcubed/plugapi/commit/8e8474c05d))
* **CHANGED:** Also accept 0 for sendChat delete timeout (Commit [c7a28ef](https://github.com/plugcubed/plugapi/commit/c7a28efdca))
* **CHANGED:** Websocket URL has been changed to ws-prod.plug.dj (Commit [3138c43](https://github.com/plugCubed/plugAPI/commit/3138c43156caeb1dcae7b4aa62d299624a05aef4))
* **CHANGED:** Get History before setting ADVANCE object on startup (Commit [349f478](https://github.com/plugCubed/plugAPI/commit/349f4781fd0cf815b279daab460304d01ac2ba07))
* **FIXED:**  HTTP Status checks for API routes (Commit [8e8474c](https://github.com/plugcubed/plugapi/commit/8e8474c05d))
* **FIXED:** Return empty array if currentDJ or waitingDJs is null for getWaitList & getDJs (Commit [8e63576](https://github.com/plugcubed/plugapi/commit/8e63576c33))
* **FIXED:** Set grabs properly (Commit [484fdb2](https://github.com/plugcubed/plugapi/commit/484fdb2a50))
* **FIXED:** Error swallowing with API requests. (Commit [6b44907](https://github.com/plugcubed/plugapi/commit/6b449073cf))
* **FIXED:** Permissions for global roles (Commit [4c2c545](https://github.com/plugcubed/plugapi/commit/4c2c545fa9))
* **FIXED:** endpoint for waitlist unban (Commit [cb6825c](https://github.com/plugcubed/plugapi/commit/cb6825cf4f)])
* **FIXED:** revert bot.mutedTriggerNormalEvents conditional change in chat event (Commit [00af49c](https://github.com/plugcubed/plugapi/commit/00af49c8ed))
* **FIXED:** Do not assume we were given a valid array for room.usersToArray (Commit [d99576b](https://github.com/plugcubed/plugapi/commit/d99576bd4e))
* **FIXED:** Command args should now convert properly for mentioned users. Also filter out empty strings and null/undefined. (Commit [a1b8bc0](https://github.com/plugcubed/plugapi/commit/a1b8bc045e))
* **UPDATED:** Message splitting & escaping now provided by [plug-message-split](https://www.npmjs.com/package/plug-message-split) (Commit [54f7077](https://github.com/plugcubed/plugapi/commit/54f70775b7))
* **UPDATED:** Throw on joining room if user is banned, room is over capacity or other error. (Commit [bead8c8](https://github.com/plugCubed/plugAPI/commit/bead8c86be16bf4fe5bd10dd22ec2394029ba5cf))
* **UPDATED:** Add URL on 403 error (Commit [dd9d4c1](https://github.com/plugCubed/plugAPI/commit/dd9d4c16f796b5897660d9ae06bf0c675d821221))

5.0.0
----
* **ADDED:** Added support for FORCE_NAME_CHANGE. (Commit [878ed6e](https://github.com/plugCubed/plugAPI/commit/878ed6e6ca))
* **ADDED:** Experimental auto reconnect (Commit [dbc113a](https://github.com/plugCubed/plugAPI/commit/dbc113a76e))
* **BREAKING:** humanized / jsdoc more events (Commit [af3b9d7](https://github.com/plugCubed/plugAPI/commit/af3b9d7ef7))
* **BREAKING:** more humanized event types & more JSDoc (Commit [b095179](https://github.com/plugCubed/plugAPI/commit/b0951794a1)])
* **DOCS:** Upload first iteration of auto generated docs. (Commit [b6909f7](https://github.com/plugCubed/plugAPI/commit/b6909f7ad1))
* **UPDATED:** Moved constants to a JSON & updated for new roles (Commit [ae022ab](https://github.com/plugCubed/plugAPI/commit/ae022ab898))
* **UPDATED:** Role update for plug.dj. * 1000 roles (Commit [6968cf5](https://github.com/plugCubed/plugAPI/commit/6968cf5c69))
* **UPDATED:** Added new gRoles Part 2 (#137) (Commit [273e39b](https://github.com/plugCubed/plugAPI/commit/273e39b339))
* **UPDATED:** Role Update for 9/19/17 (#136) (Commit [0ac160a](https://github.com/plugCubed/plugAPI/commit/0ac160a2b6))
* **UPDATED:** Added Socket Class for Auto Reconnect. WaitList Ban event & methods added. Updated dependencies. (Commit [ba08530](https://github.com/plugCubed/plugAPI/commit/ba08530499))
* **UPDATED:** got to latest & chalk. Fixed breaking changes. (Commit [7f327bf](https://github.com/plugCubed/plugAPI/commit/7f327bf0b9))


5.0.0-beta.3
----
* **CHANGED:** Authentication now uses endpoints instead of parsing HTML (Commit [d7fefcf](https://github.com/plugCubed/plugAPI/commit/12976f93004be233f0b1a7c76efaaca58d7fefcf))
* **CHANGED / FIXED:** Guests now don't need to parse HTML page to login, and set cookies correctly for guest mode (Commit [8023591](https://github.com/plugCubed/plugAPI/commit/d4435def7fa1ca4900864569f0be86a088023591))
* **CHANGED:** PlugAPI is now ES2015 class based. Begin working on JSDoc (Commit [4ce3a43](https://github.com/plugCubed/plugAPI/commit/644c1ce054da8b968e5a5aaab99fe42644ce3a43))
* **ADDED:** Facebook Login is now possible (Commit [ff7ddee](https://github.com/plugCubed/plugAPI/commit/68ce54e1db461763757c8ceb8f8134a17ff7ddee))
* **UPDATED:** WS to 2.1.0 (Commit [ca772be](https://github.com/plugCubed/plugAPI/commit/c990b5234886de23fcbdd7269b006d72fca772be))
* **FIXED:** updateUser should now also update bot's user data as well. (Bug since 4.2.3) (Commit [8982a70](https://github.com/plugCubed/plugAPI/commit/89636a14fca563b564e6010ad3203dc4a8982a70))
* **CHANGED:** Readme is now modernized to ES2015 with new code examples (Commit [7d2daef](https://github.com/plugCubed/plugAPI/commit/c01dcc51af8e327e2b829c0aae887b5f27d2daef))


5.0.0-beta.2
-----
* **FIXED:** Check if ws exists and is open before sending socket events. (Commit [e07cdc1](https://github.com/plugCubed/plugAPI/commit/c9debeb17461873cc88c731f2d44176b8e07cdc1))
* **UPDATED:** Chat Handler performance should be better. (Commit [e07cdc1](https://github.com/plugCubed/plugAPI/commit/c9debeb17461873cc88c731f2d44176b8e07cdc1))
* **CHANGED:** Replace request for got. Installing PlugAPI should take less time now. (Commit [27b56e8](https://github.com/plugCubed/plugAPI/commit/0b88343c34065502b91f3289df4eab6fb27b56e8))
* **FIXED:** Guest mode checks for functions it cant use. Make getPlaylists callback optional. Improved error message for logging in. (Commit [3083a43](https://github.com/plugCubed/plugAPI/commit/683cf3193f4fcb322f4b93afeb4d3aa483083a43))

5.0.0-beta.1
-----
* **ADDED:** data.rawun to the user object, decode HTML entities for username in data.username, added silver property (Commit [1fd534d](https://github.com/plugCubed/plugAPI/commit/33802506a012944cba4ca9c2c05f1ac8f1fd534d))
* **FIXED:** data.type should now be set properly for /em messages (Commit [6795d3b](https://github.com/plugCubed/plugAPI/commit/e5fbc67a8b5ad1b0ad1aca4d4338cc0c56795d3b))
* **FIXED:** Playlist management functionality (Thanks @au2001) (Commit [10e06ed](https://github.com/plugCubed/plugAPI/commit/dd1b9d541d011bfcfdc44bb21a455c24c10e06ed))
* **FIXED:** Callback of advance should now be binded properly to avoid errors (Commit [acc9bdf](https://github.com/plugCubed/plugAPI/commit/d9fa3ac448e1bf83b444dcd114a263adcacc9bdf))
* **FIXED:** Guest users should no longer say the bot has left the room (Commit [c111c3c](https://github.com/plugCubed/plugAPI/commit/4438c2e2db1b641a34257bb1ed1973988c111c3c))
* **UPDATED:** Events & Endpoints are now in separate JSON files for easy maintenance (Commit [afe3f73](https://github.com/plugCubed/plugAPI/commit/d1d3e18be232b8c34e25bcb14cf424f55afe3f73))
* **UPDATED:** Added constants to bot prototype. Now it is possible to do bot.ROOM_ROLE.RESIDENTDJ, etc. (Commit [51dd1cb](https://github.com/plugCubed/plugAPI/commit/5136b0fcb32623eb29c5afa3727424c5e51dd1cb))
* **ADDED:** Guest Mode (Thanks @Dazzuh) (Commit [cee7c4e](https://github.com/plugCubed/plugAPI/commit/e00c8fac717e2be7436c2af5deef836e9cee7c4e))
* **FIXED:** getHistory should now be the correct data, Fixed empty strings in messageData.args for command event. (Commit [b29e55b](https://github.com/plugCubed/plugAPI/commit/f1d8167771628b9e6e0dfcf0d28f98043b29e55b))
* **BREAKING:** PlugAPI now does not support node versions < 4 (Commit [2979234](https://github.com/plugCubed/plugAPI/commit/24e00348ee0a9db00131a50db3ff644cd2979234))
* **BREAKING:** Dropped PlugAPI logger for [Jethro](https://github.com/JethroLogger/Jethro/tree/v2/docs/v2/) (Commit [0094238](https://github.com/plugCubed/plugAPI/commit/db247ec3f7c06a268553e54f5aadaf19c0094238))
* **DEPRECATE:** CreateLogger is no longer usable (Commit [0094238](https://github.com/plugCubed/plugAPI/commit/db247ec3f7c06a268553e54f5aadaf19c0094238))

* **FIXED:** Playlist counts should now be correct for playlist functions (Commit[ca3f8b8](https://github.com/plugCubed/plugAPI/commit/38c7c263083288f7015c6b300fa8bad20ca3f8b8))
* **FIXED:** Logger to be less strict on type checks and dropped cookie handler for request.jar (Commit[30a65da](https://github.com/plugCubed/plugAPI/commit/3e2fa9e20707d62341e3c1d3c7046f66730a65da))

4.2.3
-----
* **UPDATED:** Eventemitter3 to 1.2.0 and mocha-eslint to 2.0.2 (Commit [2f1d6b4](https://github.com/plugCubed/plugAPI/commit/dafe0eb48544d88b41ee5fd8bb666b7862f1d6b4))
* **FIXED:** Moved deleteAllChat to correct location (Commit [58fe475](https://github.com/plugCubed/plugAPI/commit/5dad3fc2ef9fc343c849224dfa0a24e4458fe475))

4.2.2
-----
* **UPDATED:** All dependencies to latest versions. (Commit [a4615d8](https://github.com/plugCubed/plugAPI/commit/c4d8cbe933a92664062d6f845dd6e4938a4615d8))
* **FIXED:**  moderateDeleteChat should check for bouncer permissions (Commit [c0d0e33](https://github.com/plugCubed/plugAPI/commit/b4f03f842a9d38ce44f98519cb5e5dd7ac0d0e33))

4.2.1
-----
* **ADDED:** Option to delete all chat regardless of role (Commit [3b6ccc4](https://github.com/plugCubed/plugAPI/commit/37de0ccc2356c378d2a10532fe20e72b13b6ccc4))
* **UPDATED:** All dependencies to latest versions. (Commit [7aed7be](https://github.com/plugCubed/plugAPI/commit/70c74e18c851b2120f9cf12c38ace2dbe7aed7be))
* **UPDATED:** Codestyle to match newest ESLint config.(Commit [fc41705](https://github.com/plugCubed/plugAPI/commit/600a708fb7681752c9356d9e7d12ff6f1fc41705))
* **ADDED:** Linting for tests. (Commit [fc41705](https://github.com/plugCubed/plugAPI/commit/600a708fb7681752c9356d9e7d12ff6f1fc41705))

4.2.0
------
* **FIXED:** Commands should now be able to be deleted. (Commit [3aacf8c](https://github.com/plugCubed/plugAPI/commit/548b4b06d463f32a98e745aeceae415c83aacf8c))
* **FIXED:** parseInt if getUser uid is String (Commit [3aacf8c](https://github.com/plugCubed/plugAPI/commit/548b4b06d463f32a98e745aeceae415c83aacf8c))
* **ADDED:** MAINT_MODE and MAINT_MODE_ALERT events (Commit [3aacf8c](https://github.com/plugCubed/plugAPI/commit/548b4b06d463f32a98e745aeceae415c83aacf8c))
* **IMPROVE:** JSDoc to be more consistent (Commit [3aacf8c](https://github.com/plugCubed/plugAPI/commit/548b4b06d463f32a98e745aeceae415c83aacf8c))
* **IMPROVE:** Typo in utils comment (Commit [322bcbb](https://github.com/plugCubed/plugAPI/commit/44f130bf24b60274fe7fd58e5e0ca1f15322bcbb))
4.1.2
------
* **ADDED:** `Object.assign` Ponyfill (Commit [48d3c92](https://github.com/plugCubed/plugAPI/commit/106f9eed0b89d26c74152d1e7336431ca48d3c92))
* **UPDATED:** Request to 2.61.0 , ws to 0.8.0 (Commit [48d3c92](https://github.com/plugCubed/plugAPI/commit/106f9eed0b89d26c74152d1e7336431ca48d3c92))
* **CHANGED:** Use `Array.isArray` instead of `util.isArray` due to being deprecated (Commit [ac2bdbc](https://github.com/plugCubed/plugAPI/commit/83a28892112ee12ed1d9f8cff4a4001b0ac2bdbc))
* **CHANGED:** Use `Object.assign` ponyfill instead of util._extend (Commit [1927037](https://github.com/plugCubed/plugAPI/commit/3a26d81482e2c15bc0d2c624083da7d841927037))
* **FIXED:** Null / Undefined messages should not break sendChat (Commit [ac2bdbc](https://github.com/plugCubed/plugAPI/commit/83a28892112ee12ed1d9f8cff4a4001b0ac2bdbc))

4.1.1
------
* **FIXED:** Null issue with ws (Commit [73d9409](https://github.com/plugCubed/plugAPI/commit/5431ffa108aa4eca6f59a86b8ee2420db73d9409))
* **FIXED:** A few broken links in readme (Commit [d635862](https://github.com/plugCubed/plugAPI/commit/f56d59e93ba7b1f5dd3e7ae762d42b453d635862))

4.1.0
------
* **ADDED:** Starting work on mocha test. Linting added for now. (Commit [33375f3](https://github.com/plugCubed/plugAPI/commit/2ca5357b9c10d9251ca44022afe37a22533375f3))
* **CHANGED:** Linted and fixed many issues with code. (Commit [33375f3](https://github.com/plugCubed/plugAPI/commit/2ca5357b9c10d9251ca44022afe37a22533375f3))
* **FIXED:** Forgot to rename function in switch case. (Commit [33375f3](https://github.com/plugCubed/plugAPI/commit/2ca5357b9c10d9251ca44022afe37a22533375f3))
* **ADDED:** Default case for mutes (sets to null if time is not defined) (Commit [33375f3](https://github.com/plugCubed/plugAPI/commit/2ca5357b9c10d9251ca44022afe37a22533375f3))
* **CHANGED:** JSDoc to be valid and descriptions where needed. (Commit [33375f3](https://github.com/plugCubed/plugAPI/commit/2ca5357b9c10d9251ca44022afe37a22533375f3))
* **CHANGED:** Use Strict mode. (Commit [33375f3](https://github.com/plugCubed/plugAPI/commit/2ca5357b9c10d9251ca44022afe37a22533375f3))

4.0.1
------
* **FIXED:** Room.js was returning Internal Users Array and not the local variable. (Commit [07793b8](https://github.com/plugCubed/plugAPI/commit/f02a2d57afbda19f9247863fd49d2a59307793b8))

4.0.0
------
* **CHANGED:** Room.js object checks to find both null and undefined (Commit [c54e34b](https://github.com/plugCubed/plugAPI/commit/864070e1fd2662e0254dddf801bcdff4b1c54e3b))
* **REMOVED:** cookies saving / cookies.tmp file. Was causing too many issues. (Commit [10059f7](https://github.com/plugCubed/plugAPI/commit/977925a931b89e8ba0300ced2fe7bcbb710059f7)) (Commit [30b2a13](https://github.com/plugCubed/plugAPI/commit/17014bfaf92b5532f26ab5b2c6e368b7d30b2a13))
* **CHANGED:** Most of plugAPI is now compliant to the node.js style of callback(err, data) (Commit [10059f7](https://github.com/plugCubed/plugAPI/commit/977925a931b89e8ba0300ced2fe7bcbb710059f7))
* **CHANGED:** Use IsFinite ES6 polyfill for a more accurate check of numbers. (Commit [10059f7](https://github.com/plugCubed/plugAPI/commit/977925a931b89e8ba0300ced2fe7bcbb710059f7))
* **ADDED:** Use Handle-Errors to throw if no callback is defined, else return the error. (Commit [10059f7](https://github.com/plugCubed/plugAPI/commit/977925a931b89e8ba0300ced2fe7bcbb710059f7))
* **FIXED:** Empty Arguments getting interpreted as 0. (Commit [10059f7](https://github.com/plugCubed/plugAPI/commit/977925a931b89e8ba0300ced2fe7bcbb710059f7))
* **FIXED:** moderateForceSkip skipping other users. (Commit [77baafb](https://github.com/plugCubed/plugAPI/commit/6cf13b75a7d85ba436dadff8a1fe952a377baafb))
* **CHANGED:** From Eventemitter 2 to Eventemitter 3. (Commit [bea2829](https://github.com/plugCubed/plugAPI/commit/7c5806b8da427a26e546c8c2e87d47cdabea2829))


**BREAKING CHANGES:**
* OnAny and OffAny are now removed.
* Async now requires end users to handle errors by plugAPI.

3.5.0
------
* **REMOVED:** Removed Bin and Minification build. Not neccesary for a node.js library. (Commit [7ddf40](https://github.com/plugCubed/plugAPI/commit/63ab9c23fbaaa6f45fc901d8c0995e89dd7ddf40))
* **ADDED:** selfSkip method to skip self (Commit [44c6b78](https://github.com/plugCubed/plugAPI/commit/58ddd2eb187ef459fe18f5d6015fc7ec744c6b78)).
* **CHANGED:** moderateForceSkip will skip self if person djing is the bot (Commit [44c6b78](https://github.com/plugCubed/plugAPI/commit/58ddd2eb187ef459fe18f5d6015fc7ec744c6b78)).
* **CHANGED:** Codestyle to be multiple var declarations. Fixed a duplicate var in room.js as well (Commit [44c6b78](https://github.com/plugCubed/plugAPI/commit/58ddd2eb187ef459fe18f5d6015fc7ec744c6b78)).
* **CHANGED:** Added in a baseURL to request (Commit [44c6b78](https://github.com/plugCubed/plugAPI/commit/58ddd2eb187ef459fe18f5d6015fc7ec744c6b78)).
* **UPDATED:** Dependencies: chalk@1.1.0, request to 2.60.0 (Commit [44c6b78](https://github.com/plugCubed/plugAPI/commit/58ddd2eb187ef459fe18f5d6015fc7ec744c6b78)).
* **CHANGED:** Removed outdated node-html-encoder for [he](https://npmjs.com/package/he) (Commit [44c6b78](https://github.com/plugCubed/plugAPI/commit/58ddd2eb187ef459fe18f5d6015fc7ec744c6b78)).
* **CHANGED:** Src is now Lib to fit the pattern of node.js modules. (Commit [44c6b78](https://github.com/plugCubed/plugAPI/commit/58ddd2eb187ef459fe18f5d6015fc7ec744c6b78)).
* **REMOVED:** Grunt and ClosureCompiler. Will add testing later on. (Commit [7ddf40](https://github.com/plugCubed/plugAPI/commit/63ab9c23fbaaa6f45fc901d8c0995e89dd7ddf40))

3.4.0
-------

* **CHANGED:** Removed getStatus and setStatus and updated plugAPI's status object. (Commit [e2e331e](https://github.com/plugCubed/plugAPI/commit/077946781eb1a2ac72a47c3d11b7ab7c6e2e331e)).
* **ADDED:** Added friendRequest, gifted, and modBan to ignore list. (Commit [f9c703d](https://github.com/plugCubed/plugAPI/commit/b07028daef2e7eba04d5176006e9e0e20f9c703d)).
* **ADDED:** Added djListCycle and djListLocked event objects, Added getBoothMeta function. (Commit [0010d0b](https://github.com/plugCubed/plugAPI/commit/e3533aa8e78b667a101da562149bdb3920010d0b)).
* **CHANGED:** Changed djListUpdate to emit user objects instead of ids. (Commit [0010d0b](https://github.com/plugCubed/plugAPI/commit/e3533aa8e78b667a101da562149bdb3920010d0b)).
* **UPDATED:** Updated user object properties and defaults.(Commit [b5abec1](https://github.com/plugCubed/plugAPI/commit/fcb031643df302495bdd2dec1495df0f5b5abec1)).
* **ADDED:** Added room description, name, and welcome update events. Added getRoomMeta function. Don't add guests to users listing. (Commit [aab71a9](https://github.com/plugCubed/plugAPI/commit/9ced439cdcbabec1b3e0a488e253a58f5aab71a9)).
* **ADDED:** Added 2 more bots to readme info. QBot and Holly Refbots (Commit [9bfd810](https://github.com/plugCubed/plugAPI/commit/6b3c24c8de4c28c598945513a5b98d8ba9bfd810)). (Commit [f9aa9a8](https://github.com/plugCubed/plugAPI/commit/b3a53099804b7f3cb3c552026f6620d6bf9aa9a8)).

3.3.0
-------
* **CHANGED:** Changed Package.json license to new [format](https://docs.npmjs.com/files/package.json#license) (Commit [46dc1fe](https://github.com/plugCubed/plugAPI/commit/086561bf265b040768d4a99f84c0b05cd46dc1fe)).
* **UPDATED:** Dependencies.  - Deasync@0.1.0, Request@2.56.0, Source Map Support@0.3.1 (Commit [46dc1fe](https://github.com/plugCubed/plugAPI/commit/086561bf265b040768d4a99f84c0b05cd46dc1fe)).
* **FIXED:** Playlist functions not working properly due to callbacks. (Commit [4c1f915](https://github.com/plugCubed/plugAPI/commit/90c3816177cda33faf3263f15d644dcac4c1f915))

3.2.1
-------
* **CHANGED:** Npmignore apparently is case sensitive... actually ignore Gruntfile.js
* **FIXED:** Markdown in Changelog was wrong in previous entries.

3.2.0
-------
* **REMOVED:** REPL Example. Not very used anymore.
* **ADDED:** Npmignore file to ignore files when publishing.
* **FIXED:** Latest WS was breaking connection due to removal of Origin Header.
* **CHANGED:** Pinned dependencies to avoid issues with breaking changes.
* **CHANGED:** Changed TAT to contributor and Thedark1337 to Author
* **ADDED:** Bugs URL in package json to link to Github issues.
* **ADDED:** David Badge to check if dependencies are at latest version.

3.1.4
-------
* **ADDED:** Chat Level Update Object and notificaton when it changes.
* **IMPROVE:** Logging in to plug.dj via plugAPI should show more descriptive errors instead of stacktraces that were unreadable.
* **CHANGED:** Code change for cookies.js, should be typeof === 'undefined'
* **FIXED:** CreatePlaylist typeof check was String instead of string. Fix provided by @purechaose

3.1.3
-------
* **FIXED:** Grab was always false, and users were not being removed from staff properly. Fix provided by @anjanms.
* **FIXED:** ModerateBanUser was not returning true if successful.Fix provided by @chrishayesmu.

3.1.2
-------
* **FIXED:** Added type back to chat messages.

3.1.1
-------
* **FIXED:** Update for Go DJ web socket

3.1.0
-------
* **ADDED:** Added utils
* **FIXED:** Fixed being unable to lock and unlock the booth without reloading the bot. (#57)

3.0.0
-------
* **FIXED:** Working with plug.dj > v1.0.0
 * New connection method for socket server (Chat server and socket server combined)
* **ADDED:** Manage a history of chat, limited to 512 messages (Same limit as browser clients)
* **ADDED:** Documentation in JSDoc format (If you're using an IDE, this should give you in-editor documentation)
* **CHANGED:** Uses e-mail and password as authentication
* **CHANGED:** `bot.ROLE` split up into `bot.ROOM_ROLE` and `bot.GLOBAL_ROLE`
* **REMOVED:** All deprecated functions are removed
* **REMOVED:** `bot.isUsernameAvailable(name, callback)` and `bot.changeUsername(name, callback)` removed
* A lot more, can't remember everything I have done...

2.4.1
-------
* **FIXED:** Compatibility with pre-2.4.0 command eventlisteners using chatID (Commit [b9afcba](https://github.com/TATDK/plugapi/commit/b9afcba861d7eb85e05df3e47506db2de4f950e2))

2.4.0
-------
* **ADDED:** Added deleteCommands (Commit [bf8acd8](https://github.com/TATDK/plugapi/commit/bf8acd87927f05caeed737b8162621a13740a0e1))
* **IMPROVE:** Improvements for plug.dj v0.9.833 (Commit [5fa24ad](https://github.com/TATDK/plugapi/commit/5fa24adfafca678dbb60f86b1a072c38e3c63714))

2.3.2
-------
* **FIXED:** Temporary fix for plug.dj v0.9.833 (Commit [69e2f51](https://github.com/TATDK/plugapi/commit/69e2f51310dabbeda9dc6017eb522d05089ce5de))

2.3.1
-------
* **FIXED:** Fix detecting numbers (Commit [0319ad7](https://github.com/TATDK/plugapi/commit/0319ad7f173a2bae92212744053109801203ce1c))

2.3.0
-------
* **ADDED:** Set status via `setStatus` (Commit [7bd4390](https://github.com/TATDK/plugapi/commit/7bd4390d15d8946e66ce2680b88336a32ab10dfc))
* **IMPROVE:** Convert numbers in args to actual numbers (Commit [629a655](https://github.com/TATDK/plugapi/commit/629a6553358b2dd0ee001b269154067b67cc4331))
* **FIXED:** Fix error with commandPrefix longer than 1 character (Commit [c259fe8](https://github.com/TATDK/plugapi/commit/c259fe81b26de6f97c4291c0617e0bc853d9c35f))

2.2.8
-------
* **IMPROVE:** Include all user data on `USER_LEAVE` (Commit [b198ddc](https://github.com/TATDK/plugapi/commit/b198ddc33143e68943d794f66d1ac2b5acbf62cb))

2.2.7
-------
* **FIXED:** Gateway error requesting captcha (Commit [f5e4590](https://github.com/TATDK/plugapi/commit/f5e4590dd7189dc6b9125f30034fd93eca09d51d))

2.2.6
-------
* **FIXED:** Fix dependency for `sockjs-client-node` (Commit [a1650eb](https://github.com/TATDK/plugapi/commit/a1650ebdbc14e102991e93e0fe4f650e39f34d40))

2.2.5
-------
* **FIXED:** Be sure the user exists while handling MODERATE_STAFF messages - Fixes #14 (Commit [7883859](https://github.com/TATDK/plugapi/commit/788385993247e01eb9633e65bf524edaf868eecf))

2.2.4
-------
* **IMPROVE:** Allow command prefixes longer than 1 character (Commit [56374ed](https://github.com/TATDK/plugapi/commit/56374ed0bb970416bb825918ae20b7c7c78fee41))
* **IMPROVE:** Added sourcemap for easier tracking of issues and bugs (Commit [56374ed](https://github.com/TATDK/plugapi/commit/56374ed0bb970416bb825918ae20b7c7c78fee41))

2.2.3
-------
* **IMPROVE:** Improve invalid roomname detection (Commit [3d0dbee](https://github.com/TATDK/plugapi/commit/3d0dbeeb28fa6073ef53dd530517d86dea928a90))

2.2.2
-------
* **IMPROVE:** Allow banning people not in the room (Commit [78e7945](https://github.com/TATDK/plugapi/commit/78e794527174635a57adbd11a3f9be0ac0fabd2c))

2.2.1
-------
* **FIXED:** Fixed coding error (Commit [ba52159](https://github.com/TATDK/plugapi/commit/ba5215962360a48300e1ddb2b2a3aeb7d2df0c4e))

2.2.0
-------
* **ADDED:** Added `havePermission` (Commit [a323aa8](https://github.com/TATDK/plugapi/commit/a323aa8f0860ee5e0b2444b5fded4fa80174cac0))

2.1.0
-------
* **ADDED:** Added `close` (Commit [ffa6f65](https://github.com/TATDK/plugapi/commit/ffa6f65efc1a9f57a8417637f5978185a95f6fe6))
* **ADDED:** Ability to set other command prefix (Commit [a122f47](https://github.com/TATDK/plugapi/commit/a122f473b4934b49d09a8f73c1263433eb6f18ab))
* **ADDED:** Ability to have bot's own messages processed (Commit [ea226c8](https://github.com/TATDK/plugapi/commit/ea226c8fdaab117560d9e235c0d3e05bb6129cca))
* **ADDED:** Add function to move a user in waitlist through user object (Commit [303d5fc](https://github.com/TATDK/plugapi/commit/303d5fced045d0e6e06aea54fa912347122349ac))
* **IMPROVE:** Improve code for joining room (Commit [47335b2](https://github.com/TATDK/plugapi/commit/47335b257ff4bbdb62231e014e9818ed374ca5ae))
* **IMPROVE:** Added checks to prevent unnecessary requests (Commit [c1691ca](https://github.com/TATDK/plugapi/commit/c1691cac98c557b65a91bc9b5ef3993eb2e41d4a))
* **FIXED:** Connect to p3's socket server via HTTPS (Commit [d5b32d3](https://github.com/TATDK/plugapi/commit/d5b32d3da5bcaf89e54c65f704b39d71ee05248e))
* **DEPRECATE:** Deprecate `setLogObject` (Commit [3e8c690](https://github.com/TATDK/plugapi/commit/3e8c690caba5946e198b361c0693419a84ff3054))
* **DEPRECATE:** Deprecate old parameters for `getTwitterAuth` (Commit [b7e2579](https://github.com/TATDK/plugapi/commit/b7e2579064f438ba94f63e82d269583320798d32))
* **DEPRECATE:** Deprecate `moderateUnBanUser` (Commit [5bb2fda](https://github.com/TATDK/plugapi/commit/5bb2fda5fd1900a2a64ad9de106f10e9a42a8de6))
* **DEPRECATE:** Deprecate `addToWaitlist` and `removeFromWaitlist` on user objects (Commit [b1cf712](b1cf712bd77374f5f8471e51fccbf66ead2de225))

2.0.3
-------
* **FIXED:** Fix broken `getHistory` (Commit [645f03a](https://github.com/TATDK/plugapi/commit/645f03a30504183ce24d7034c66fe08579657281))

2.0.2
-------
* **FIXED:** More inteligent way of running the `queueTicker` (Commit [80e314c](https://github.com/TATDK/plugapi/commit/80e314c6bc4a18a109d3bf14f3602c6d8ccbc3de))

2.0.1
-------
* **FIXED:** Changed required node version from 0.6 to 0.10 (Commit [78ec90f](https://github.com/TATDK/plugapi/commit/78ec90fca5d2fa1404e85e8df49b14ea76bc3372))

2.0.0
-------
* **ADDED:** Settings files for formatting in .jsbeautifyrc and .editorconfig format (Commit [5123fbc](https://github.com/TATDK/plugapi/commit/5123fbce7206c15d0e985cc73c0e3ba82c8bb258))
* **ADDED:** Prevent spamming plug.dj's servers (Commit [e52a3ef](https://github.com/TATDK/plugapi/commit/e52a3eff27df94914911f0cbdcd67d4bb2888062))
* **ADDED:** Support to use plugCubed's socket server for PMs (Commit [e52a3ef](https://github.com/TATDK/plugapi/commit/e52a3eff27df94914911f0cbdcd67d4bb2888062))
* **FIXED:** plug.dj backend changes (Commit [e52a3ef](https://github.com/TATDK/plugapi/commit/e52a3eff27df94914911f0cbdcd67d4bb2888062))
* **FIXED:** `plug-dj-login` is now an optional dependency as it was supposed to be (Commit [9003025](https://github.com/TATDK/plugapi/commit/90030251ac2120c81634d8fad6604678a6c348c6))
* Using Grunt to run Closure Compiler on the api (Commit [7719cdc](https://github.com/TATDK/plugapi/commit/7719cdc760e21cf1a61dac1fb6485e11f9fc89f7))
* Fix order of readme (Commit [b7b66a6](https://github.com/TATDK/plugapi/commit/b7b66a695de892cc218d973032ccb7e1ab249183))
* Facepalm, bin folder needs to be included (Commit [7719cdc](https://github.com/TATDK/plugapi/commit/7719cdc760e21cf1a61dac1fb6485e11f9fc89f7))

1.1.4
-------
* **FIXED:** Ensure gateway requests sends an array (Commit [d000f9d](https://github.com/TATDK/plugapi/commit/d000f9d8b77c92594773f5808546ef39a442e0bb))

1.1.3
-------
* **FIXED:** Uncompress the updatecode from the server (Commit [963235a](https://github.com/TATDK/plugapi/commit/963235af51a80e160f1a07a7ca162203c59720ea))
* **REMOVE:** Removed `cheerio` as a dependency as it wasn't used (Commit [52731a6](https://github.com/TATDK/plugapi/commit/52731a6af870120888731e6b559eb0b82b65cdd8))

1.1.2
-------
* **CHANGED:** Now getting the updateCode from server (Commit [b32bc48](https://github.com/TATDK/plugapi/commit/b32bc4801c1208236f81fa46441a7e72a845786b))

1.1.1
-------
* **FIXED:** Hopefully give an error when gateway returns invalid JSON (Commit [dfb9c6c](https://github.com/TATDK/plugapi/commit/dfb9c6c19ed19bac5c6f318d349b97963d0ee0bf))
* **FIXED:** Actually remove the user when the user leaves the room (Commit [dfb9c6c](https://github.com/TATDK/plugapi/commit/dfb9c6c19ed19bac5c6f318d349b97963d0ee0bf))

1.1.0
-------
* **ADDED:** Added optional autodelete of message (Commit [af6f879](https://github.com/TATDK/plugapi/commit/af6f879f52239bc0c67d46c84c9cb464f17e57c6))
    1. Added respondTimeout for commands
    1. Added timeout parameter for `intChat`, `chat` and `sendChat`
* **CHANGED:** Now using MIT license (Commit [93da87d](https://github.com/TATDK/plugapi/commit/93da87d3ad0655a5cb265ee50a80c6189f92004d))

1.0.0
-------
* Initial Release
* TAT is added as maintainer of the official npm package
