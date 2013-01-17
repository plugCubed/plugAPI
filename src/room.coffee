class Room
	constructor: ()->
		@users = {}
		@staffIds = {}
		@adminIds = {}
		@ownerId = ''
		@self = {}
		@djs = {}
		@media = 
			info: {}
			stats: 
				votes   : {}
				curates : {}
		@waitlist = {}

	### helpers ###

	# Takes an object of users like
	# {id: {user obj}, id2: {user2 obj}, etc}
	# and spits out:
	# [{user obj}, {user2 obj}, etc]
	# identical to plug.dj api
	usersToArray: (usersObj)->
		users = []
		for id, user of usersObj
			users.push user
		return users

	isStaff: (userid)=> return @staffIds[userid]?

	### write room variables ###

	reset: ()=>
		@users = {}
		@djs = {}
		@media = 
			info: {}
			stats: 
				votes : {}
				curates : {}
		@waitlist = {}
		@staffIds = {}
		@ownerId = ''

	addUser: (user)=>
		@users[user.id] = user
		if @isStaff(user.id) then @users[user.id]['permission'] = @staffIds[user.id] 
		else @users[user.id]['permission'] = 0

	remUser: (user)=>
		delete @users[user.id]

	setUsers: (users)=>
		@users = {}
		for user in users
			@users[user.id] = user

	setStaff: (ids)=>
		@staffIds = ids
		@setPermissions()

	setAdmins: (ids)=>
		@adminIds = ids

	setOwner: (ownerId)=>
		@ownerId = ownerId

	setSelf: (user)=>
		@self = user

	setDjs: (djs)=>
		@djs = {}
		for dj in djs
			@djs[dj.user.id] = dj.user

	setMedia: (mediaInfo, votes={}, curates={})=>
		@media = 
			info: {}
			stats: 
				votes : {}
				curates : {}
		@media.info = mediaInfo
		for id,vote of votes
			if vote is 1 then @media.stats.votes[id] = 'woot' 
			else @media.stats.votes[id] ='meh'
		for id,val of curates
			@media.stats.curates[id] = val

	setPermissions: ()=>
		for id, user of @users
			if @isStaff(id) then @users[id]['permission'] = @staffIds[id] else @users[id]['permission'] = 0

	logVote: (voterId, vote)=>
		if vote is 'woot' or vote is 'meh'
			@media.stats.votes[voterId] = vote
		else if vote is 'curate'
			@media.stats.curates[voterId] = vote


	setWaitlist: (waitlist)=>
		@waitlist = {}
		for user in waitlist
			@waitlist[user.id] = user

	### read room variables ###

	getUsers: ()=> 
		return @usersToArray @users

	getUser: (userId)=>
		return @users[userId] if @users[userId]?

	getSelf: ()=>
		return @self if @self?

	getDjs: ()=> 
		return @usersToArray @djs

	getAudience: ()=>
		audience = []
		for id,user of @users
			if id not in Object.keys(@djs)
				audience.push user
		return audience

	getAmbassadors: ()=>
		ambassadors = []
		for id, user of @users
			if user.ambassador
				ambassdors.push user
		return ambassadors

	getStaff: ()=>
		staff = []
		for id, user of @users
			if id of @staffIds
				staff.push user 
		return staff

	getAdmins: ()=>
		admins = []
		for id, user of @users
			if id of @adminIds
				admins.push user 
		return admins

	getHost: ()=>
		for id,user of @users
			if id is @ownerId
				return user
		return null

	getWaitlist: ()=>
		return @usersToArray @waitlist

	getMedia: ()=> @media.info

	getRoomScore: ()=>
		woots = mehs = curates = 0
		for id, vote of @media.stats.votes
			woots++ if vote is 'woot'
			mehs++ if vote is 'meh'
		for id, val of @media.stats.curates
			curates++
		return {
			'curates' : curates
			'negative': mehs
			'positive': woots
		}


module.exports = Room