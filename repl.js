(function() {
    var AUTH, PlugAPI, ROOM, UPDATECODE, bot, repl;

    PlugAPI = require('./src/client.js');

    repl = require('repl');

    AUTH = 'YOUR AUTH HERE';

    ROOM = 'ROOM-URL';

    UPDATECODE = 'UPDATECODE';

    if (AUTH == 'YOUR AUTH HERE' || ROOM == 'ROOM-URL' || UPDATECODE == 'UPDATECODE') {
        console.log('You have not configured the repl.');
        console.log('Set the AUTH, ROOM and UPDATECODE variables in repl.js');
        process.exit(0);
    }

    bot = new PlugAPI(AUTH, UPDATECODE);

    bot.connect(ROOM);

    bot.on('connected', function() {
        console.log('[+] Connected to server');
    });

    bot.on('roomChanged', function() {
        var botrepl;
        console.log('[+] Joined ' + ROOM);
        botrepl = repl.start('bot>');
        return botrepl.context.bot = bot;
    });
}).call(this);