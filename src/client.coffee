SockJS = require('./sockjs-client')
http = require('http')
EventEmitter = require('events').EventEmitter
Encoder = require('node-html-encoder').Encoder

# create our entity encoder for decoding chat messages
encoder = new Encoder('entity')

# store a reference to the render headers function, we overwrite it below
http.OutgoingMessage.prototype.__renderHeaders = http.OutgoingMessage.prototype._renderHeaders

# private connection object
client = null
apiId = 0
logger = 
	log: ()->
		console.log.apply(console, arguments)

class PlugAPI extends EventEmitter
	constructor: (@key)->
		if (!key)
			throw new Error("You must pass the authentication cookie into the PlugAPI object to connect correctly")
		@rpcHandlers = {}

	setLogObject: (c)->
		logger = c

	connect: (room)->
		cookie = @key
		# because plug.dj only supports authentication through cookies, we need to violate the
		# http spec and manually edit the cookie on the outgoing request
		http.OutgoingMessage.prototype._renderHeaders = ()->
			if (@_header)
				throw new Error('Can\'t render headers after they are sent to the client.')

			@setHeader('Cookie', 'usr="'+cookie+'\"')
			return @__renderHeaders()

		# now that we've set the header, we start connecting...
		client = SockJS.create('https://sjs.plug.dj:443/plug');
		client.send = (data)->
			@write(JSON.stringify(data))

		client.on 'error', (e)=>
			@emit 'error', e

		client.on 'data', @dataHandler
		client.on 'data', (data)=>
			@emit 'tcpMessage', data

		client.on 'close', ()=>
			@emit 'close'

		# events to forward
		client.on 'connection', ()=>
			if (room)
				@joinRoom(room)
			@emit('connected')
			@emit('tcpConnect', client)

	dataHandler: (data)=>
		if (typeof data == 'string')
			data = JSON.parse(data);
		if (data.messages)
			@messageHandler msg for msg in data.messages
			return
		if (data.type == 'rpc')
			reply = data.result
			if (data.result?.stacktrace)
				logger.log data.result.stacktrace
			if (data.status != 0)
				reply = data
			@rpcHandlers[data.id]?.callback?(reply)
			@parseRPCReply @rpcHandlers[data.id]?.type, reply
			delete @rpcHandlers[data.id]

	parseRPCReply: (name, data)->
		# for doing special things when certain RPC events finish
		switch name
			when 'room.join'
				@emit('roomChanged', data)
				# logger.log(data)
				@userId = data.user.profile.id
				@roomId = data.room.id
				@historyID = data.room.historyID

	messageHandler: (msg)->
		switch msg.type
			when 'ping' then @sendRPC 'user.pong'
			# these are all for ttapi event name compatibility
			# leave them here, don't document them, purely convenience
			when 'userJoin' then @emit 'registered', msg.data
			when 'userLeave' then @emit 'registered', msg.data
			when 'chat'
				msg.data.message = encoder.htmlDecode(msg.data.message)
				@emit 'speak', msg.data
			when 'voteUpdate' then @emit 'update_votes', msg.data
			when 'djAdvance'
				#logger.log('New song', msg.data)
				@historyID = msg.data.historyID
			when undefined then logger.log('UNKNOWN MESSAGE FORMAT', msg)
		if (msg.type)
			@emit(msg.type, msg.data)

	sendRPC: (name, args, callback)->
		if (args == undefined)
			args = []
		if (Object.prototype.toString.apply(args) != "[object Array]")
			args = [args]
		rpcId = ++apiId

		@rpcHandlers[rpcId] = 
			callback: callback
			type: name

		sendArgs =
			type: 'rpc'
			id: rpcId
			name: name
			args: args

		client.send sendArgs
			
	send: (data)->
		client.send data

	# sane functions. This is the actual API
	# any function who differs in name from the ttfm ones have a copy that calls said ttfm function
	# this is for API compatibility between ttapi and plugapi
	joinRoom: (name, callback)->
		@sendRPC('room.join', [name], callback)

	# alias for ttapi compatibility
	roomRegister: (name, callback)->
		@joinRoom(name, callback)

	chat: (msg)->
		@send
			type: 'chat'
			msg: msg

	# alias for ttapi compatibility
	speak: (msg)->
		@chat msg

	upvote: (callback)->
		@sendRPC "room.cast", [true, @historyID, (@lastHistoryID == @historyID)], callback
		@lastHistoryID = @historyID

	downvote: (callback)->
		@sendRPC "room.cast", [false, @historyID, (@lastHistoryID == @historyID)], callback
		@lastHistoryID = @historyID

	woot: (callback)->
		@upvote(callback)

	meh: (callback)->
		@downvote(callback)

	vote: (updown, callback)->
		if (updown.toLowerCase() == "up")
			@upvote(callback)
		else
			@downvote(callback)

	changeRoomInfo: (name, description, callback)->
		roomInfo = 
			name: name
			description: description
		@sendRPC "moderate.update", roomInfo, callback

	changeRoomOptions: (boothLocked, waitListEnabled, maxPlays, maxDJs, callback)->
		if (!@roomId)
			throw new Error 'You must be in a room to change its options'
		options =
			boothLocked: boothLocked
			waitListEnabled: waitListEnabled
			maxPlays: maxPlays
			maxDJs: maxDJs
		@sendRPC "room.update_options", [@roomId, options], callback

	joinBooth: (callback)->
		@sendRPC "booth.join", [], callback

	leaveBooth: (callback)->
		@sendRPC "booth.leave", [], callback

	removeDj: (userid, callback)->
		@sendRPC "moderate.remove_dj", userid, callback

	addDj: (callback)->
		@joinBooth(callback)

	remDj: (userid, callback)->
		if (userid && userid == @userid)
			@leaveBooth(callback)
		else
			@removeDj(userid, callback)

	skipSong: (callback)->
		@sendRPC "moderate.skip", @historyID, callback


module.exports = PlugAPI
