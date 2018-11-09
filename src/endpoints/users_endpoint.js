var mongoController = require('../db/users_controller');
var mongoPlaylistsController = require('../db/playlists_controller');

module.exports = function(app){

	app.get('/users', function(req, res){
		mongoController.getUsers({}, function(result){
			if(result){
				return res.status(200).send(result);	
			}else{
				return res.status(500).send({ "error" : "Error connecting to db" });
			}
		});
	});

	app.post('/users', function(req, res){
		console.log("Create User", req.body);
		mongoController.getUsers({ 'pin' : req.body.pin }, function(result){
			if(result){
				if(result.length != 0){
					res.status(400).send({ "error" : "Another user exists with the specified pin"})
				}else{

					let validTillDate = new Date();
					validTillDate.setDate(validTillDate.getDate() + 3);

					let user = {
						'pin' : req.body.pin,
						'oldPin' : null,
						'validTill' : validTillDate,
						'activated' : false
					};

					mongoController.addUser(user, function(result){
						if(result){
							mongoPlaylistsController.getPlaylists({ 'title' : "Library", 'userId' : result.insertedId }, function(playlists){
								if(playlists){
									if(playlists.length != 0) return res.status(400).send({ 'error': "You have another playlist with the same name" });

									let playlist = {
										'title' : "Library",
										'userId' : String(result.insertedId),
										'primary' : true,
										'songs' : [],
										"subscribers" : []
									};

									mongoPlaylistsController.addPlaylist(playlist, function (resut){
										if(result){
											return res.status(201).send("User created with pin " + req.body.pin);
										}else{
											return res.status(500).send({ "error" : "Error connecting to db" });
										}
									});
								}else{
									return res.status(500).send({ "error" : "Error connecting to db" });
								}
							});
						}else{
							return res.status(500).send({ "error" : "Error connecting to db" });
						}
					});
				}
			}else{
				return res.status(500).send({ "error" : "Error connecting to db" });
			}
		});
	});

	app.post('/users/verify', function(req, res){
		if(req.body.pin){
			mongoController.getUsers({ 'pin' : req.body.pin }, function(result){
				if(result){
					if(result.length == 0){
						res.status(404).send({ "error" : "Invalid pin"});
					}else{
						let userInfo = result[0];
						let validTillDate = new Date(userInfo['validTill']);
						let currentDate = new Date();
						if(currentDate < validTillDate){
							currentDate.setDate(currentDate.getDate() + 90);
							let values = {
								'activated' : true,
								'validTill' : currentDate
							}
							mongoController.updateUser(userInfo['_id'], values, function(result){
								res.status(200).send({ '_id' : userInfo['_id'] });
							});
						}else{
							res.status(400).send({ "error" : "Your pin has expired, please request a new one" });	
						}
					}
				}else{
					return res.status(500).send({ "error" : "Error connecting to db" });
				}
				
			});
		}else{
			res.status(400).send({ "error" : "Please specify a pin"});
		}
	});

	app.put('/users/:id/pin', function(req, res){

		let id = req.params.id;
		mongoController.getSingleUser(id, function(result){
			console.log(result);

			if(result){
				let validTillDate = new Date();
				validTillDate.setDate(validTillDate.getDate() + 3);

				values = {
					"pin" : req.body.pin,
					"validTill" : validTillDate
				}
				mongoController.updateUser(id, values, function(result){
					res.status(200).send();
				});
			}else{
				res.status(404).send({ "error" : "User with id '" + id + "' not found"});
			}
		});
	});

	app.delete("/users/:id", function(req, res){
		let userId = req.params.id;
		mongoController.getSingleUser(userId, function(result){

			if (!result) return res.status(404).send({ "error" : "No user found with id " + userId });

			mongoPlaylistsController.getPlaylists({ 'userId' : userId }, function(playlists){
				if(playlists){
					let promises = [];

					for(let i = 0; i < playlists.length; i++){

						promises.push(new Promise(function(resolve, reject){
							mongoPlaylistsController.deletePlaylist(playlists[i]._id, function(result){
								resolve(result);
							});
						}));
					}

					Promise.all(promises).then(function(result){
						mongoController.deleteUser(userId, function(result){
							if(result.ok === 1){
								return res.status(200).send({ message: "User '" + userId + "' deleted" });
							}else{
								return res.status(500).send({ message: "An error occurred, failed to delete '" + userId + "'" });
							}
						});
					});
				}else{
					return res.status(500).send({ "error" : "Error connecting to db" });
				}
				
			});
		});
	});

}
