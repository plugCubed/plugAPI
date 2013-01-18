(function() {
  var AUTH, PlugAPI, ROOM, bot, repl,
    _this = this;

  PlugAPI = require("./src/index.js");

  repl = require("repl");

  AUTH = "YOUR AUTH HERE";

  ROOM = "ROOM-URL";

  if(AUTH == "YOUR AUTH HERE" || ROOM == "ROOM-URL"){
      console.log("You have not configured the repl.");
      console.log("Set the AUTH and ROOM variables in repl.js");
      process.exit(0);
  }
  bot = new PlugAPI(AUTH);

  bot.connect();

  bot.on("connected", function() {
    return bot.joinRoom(ROOM);
  });

  bot.on("roomChanged", function() {
    var botrepl;
    console.log("[+] Joined " + ROOM);
    botrepl = repl.start("bot>");
    return botrepl.context.bot = bot;
  });

}).call(this);
