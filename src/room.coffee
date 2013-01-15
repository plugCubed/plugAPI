class Room
	constructor: ()->
		@users = {}

	addUser: (user)=>
		@users[user.id] = user

	remUser: (user)=>
		delete @users[user.id]

	getUsers: ()=> return @users

module.exports = Room