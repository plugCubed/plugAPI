class Room
	constructor: ()->
		@users = {}
		@djs = {}
		@media = {}

	addUser: (user)=>
		@users[user.id] = user

	remUser: (user)=>
		delete @users[user.id]

	setDjs: (djs)=>
		@djs = {}
		for dj in djs
			@djs[dj.user.id] = dj.user

	setMedia: (media)=>
		@media = media

	getUsers: ()=> 
		return @users

	getDjs: ()=> @djs

	getAudience: ()=>
		audience = []
		for id,user of @users
			if id not in Object.keys(@djs)
				audience.push user
		return audience

	getMedia: ()=> @media

module.exports = Room