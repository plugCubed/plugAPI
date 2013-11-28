var request = require('request')
var cheerio = require('cheerio')

var jar = request.jar()

// var creds = {
//     username: 'some twitter handle'
//   , password: 'some twitter password'
// }

module.exports = function (creds, cb) {
  getTwitterLogin(function(err, location) {
    if (err) {return cb(err)}

    getTwitterTokens(location, function(err, tokens) {
      if (err) {return cb(err)}

      var authCreds = {
          authenticity_token: tokens.authenticity_token
        , oauth_token: tokens.oauth_token
        , 'session[username_or_email]': creds.username
        , 'session[password]': creds.password
      }

      twitterLogin(authCreds, function(err, plugLoginUrl) {
        if (err) {return cb(err)}

        var opts = {
            url: plugLoginUrl
          , jar: jar
        }
        request(opts, function(err, res, body) {
          var cookies = res.headers['set-cookie']
          cb(err, jar)
        })
      })

    })
    
  })
  
}


function twitterLogin (creds, cb) {
  var opts = {
      url: 'https://api.twitter.com/oauth/authenticate'
    , form: creds
    , jar: jar
  }
  request.post(opts, function(err, res, body) {
    var $ = cheerio.load(body);
    var metas = $('head meta');
	var meta_refresh = false;
    for (var i = metas.length - 1; i >= 0; i--) {
      var meta = metas[i];
      if (meta.attribs['http-equiv'] == 'refresh') {
		  meta_refresh = meta;
      }
    };
	if(meta_refresh !== false) {
        var plugLoginUrl = meta_refresh.attribs.content.split('url=')[1];
        cb(err, plugLoginUrl);
	} else {
		cb("Login failed.", plugLoginUrl);
	}
	
	

  })
}

function getTwitterTokens (url, cb) {
  var opts = {
      url: url
    , jar: jar
  }
  request.get(opts, function(err, res, body) {
    var $ = cheerio.load(body)
    
    var authenticity = $('input[name="authenticity_token"]')[0].attribs.value
    var oauth = $('input[name="oauth_token"]')[0].attribs.value

    var tokens = {
        authenticity_token: authenticity
      , oauth_token: oauth
    }
    cb(err, tokens)
  })
}

function getTwitterLogin (cb) {
  var url = 'http://plug.dj/authenticate/oauth/?next=http%3A%2F%2Fplug.dj%2F'

  opts = {
      url: url
    , form: { provider: 'twitter' }
    , jar: jar
  }

  request.post(opts, function (err, res, body) {
    cb(err, res.headers.location)
  })
}