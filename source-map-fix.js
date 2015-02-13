var fs = require('fs');

fs.readdir('./bin', function(err, files) {
    if (err) throw err;
    for (var i in files) {
        if (!files.hasOwnProperty(i)) continue;
        var file, content;

        file = files[i];
        content = fs.readFileSync('./bin/' + file);
        if (file.substr(file.length - 4) === '.map') {
            var json = JSON.parse(content);
            json.mappings = ';;;;;;;;;;;;;;;;;;;;;;;;' + json.mappings;
            fs.writeFileSync('./bin/' + file, JSON.stringify(json, null, 4));
        } else {
            fs.writeFileSync('./bin/' + file, "//# sourceMappingURL=./" + file + ".map\nrequire('source-map-support').install();\n" + content);
        }
    }
});