SockJS = require('./sockjs-client')
http = require('http')
EventEmitter = require('events').EventEmitter

# store a reference to the render headers function, we overwrite it below
http.OutgoingMessage.prototype.__renderHeaders = http.OutgoingMessage.prototype._renderHeaders

# private connection object
client = null
apiId = 0

class PlugAPI extends EventEmitter
	constructor: (@key)->
		if (!key)
			throw new Error("You must pass the authentication cookie into the PlugAPI object to connect correctly")
		@rpcHandlers = {}

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
		client = SockJS.create('http://sjs.plug.dj:443/plug');
		client.send = (data)->
			@write(JSON.stringify(data))

		client.on 'error', (e)->
			console.log('error', e)
			console.log();

		client.on 'data', @dataHandler

		# events to forward
		client.on 'connection', ()=>
			if (room)
				@joinRoom(room)
			@emit('connected')

	dataHandler: (data)=>
		if (typeof data == 'string')
			data = JSON.parse(data);
		if (data.messages)
			@messageHandler msg for msg in data.messages
			return
		if (data.type == 'rpc')
			@rpcHandlers[data.id]?(data.result)
			delete @rpcHandlers[data.id]

	messageHandler: (msg)->
		switch msg.type
			when 'ping' then @sendRPC 'pong'
			else
				console.log('Got this message', msg)

	sendRPC: (name, args, callback)->
		if (args == undefined)
			args = []
		if (args not instanceof Array)
			args = [args]
		rpcId = ++apiId
		@rpcHandlers[rpcId] = callback
		client.send
			type: 'rpc'
			id: rpcId
			name: 'room.join'
			args: args
			
	send: (data)->
		client.send data

	joinRoom: (name, callback)->
		@sendRPC('room.join', [name], callback)



module.exports = PlugAPI