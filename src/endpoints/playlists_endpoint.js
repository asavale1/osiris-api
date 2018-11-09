var mongoPlaylistsController = require('../db/playlists_controller');
var mongoUsersController = require('../db/users_controller');
var mongoSongsController = require('../db/songs_controller');
var mongoAlbumsController = require('../db/albums_controller');

module.exports = function(app){

	app.get('/playlists', function(req, res){
		mongoPlaylistsController.getPlaylists({}, function(result){
			if(result){
				return res.status(200).send(result);
			}else{
				return res.status(500).send({ "error" : "Error connecting to db" });
			}
		});
	});

	app.get('/playlists/user/:id', function(req, res){
		let userId = req.params.id;
		mongoPlaylistsController.getPlaylists({ 'userId' : userId }, function(playlists){
			if(playlists){
				let userPromise = new Promise(function(resolve, reeject){
					mongoUsersController.getSingleUser(userId, function(user){
						resolve(user);
					});
				});

				userPromise.then(function(user){
					for(let i = 0; i < playlists.length; i++){
						if(user){
							playlists[i].userUsername = user.username;
						}else{
							playlists[i].userUsername = '';
						}
					}
					return res.status(200).send(playlists); 
				});
				/*let userPromises = [];
				userPromises.push(new Promise(function(resolve, reject){
					mongoUsersController.getSingleUser(userId, function(user){
						resolve(user);
					});
				}));
				

				Promise.all(userPromises).then(function(user){
					for(let i = 0; i < playlists.length; i++){
						if(user){
							playlists[i].userUsername = user.username;
						}else{
							playlists[i].userUsername = '';
						}
					}
					return res.status(200).send(playlists);
				});*/
			}else{
				return res.status(500).send({ "error" : "Error connecting to db" });
			}
		});
	});

	app.post('/playlists', function(req, res){
		if(!req.body || !req.body.title || !req.body.userId){
			res.status(400).send({ 'message' : "Please specify 'title' and 'userId' in json" });
		}else{
			mongoUsersController.getSingleUser(req.body.userId, function(result){
				if(!result){
					res.status(404).send({ 'message' : "Failed to find user with id '"+ req.body.userId +"'"})
					
				}else{
					mongoPlaylistsController.getPlaylists({ 'title' : req.body.title, 'userId' : req.body.userId }, function(result){
						if(result){
							if(result.length != 0) return res.status(400).send({ 'error': "You have another playlist with the same name" });

							let playlist = {
								'title' : req.body.title,
								'userId' : req.body.userId,
								'primary' : false,
								'songs' : [],
								"subscribers" : []
							};

							mongoPlaylistsController.addPlaylist(playlist, function (resut){
								if(result){
									return res.status(201).send("Playlist '" + req.body.title + "' created");
								}else{
									return res.status(500).send({ "error" : "Error connecting to db" });
								}
							});
						}else{
							return res.status(500).send({ "error" : "Error connecting to db" });
						}
					});
				}
			});
		}
	});

	app.get('/playlists/:id', function(req, res){
		let playlistId = req.params.id;
		let detailedView = req.query.detailed;

		mongoPlaylistsController.getSinglePlaylist(playlistId, function(playlist){
			if(playlist){
				
				if(detailedView === "true" || detailedView === "True"){
					response = {
						"_id" : playlist._id,
						"title" : playlist.title,
						"userId" : playlist.userId,
						"primary" : playlist.primary,
						"songs" : [],
						"subscribers" : playlist.subscribers
					}

					let promises = [];

					promises.push(new Promise(function(resolve, reject){
						let songPromises = [];

						for(let i = 0; i < playlist.songs.length; i++){
							songPromises.push(new Promise(function(resolve, reject){
								mongoSongsController.getSingleSong(playlist.songs[i], function(song){
									mongoAlbumsController.getSingleAlbum(song.albumId, function(album){
										song.albumTitle = album.title;
										resolve(song);
									});
								});
							}));
						}

						Promise.all(songPromises).then(function(songs){
							resolve(songs);
						});

					}));

					promises.push(new Promise(function(resolve, reject){
						mongoUsersController.getSingleUser(playlist.userId, function(user){
							if(user){
								resolve(user.username);
							}else{
								resolve('');
							}
						});
					}));
					
					Promise.all(promises).then(function(results){
						response.songs = results[0];
						response.userUsername = results[1];
						res.status(200).send(response);
					});
				}else{
					mongoUsersController.getSingleUser(playlist.userId, function(user){
						if(user){
							playlist.userUsername = user.username;
						}else{
							playlist.userUsername = '';
						}

						res.status(200).send(playlist);
					});
				}
			}else{
				res.status(400).send({"error" : "No playlist found with id '" + playlistId + "'"})
			}
		});
	});

	app.put('/playlists/:id/song', function(req, res){
		if(req.body.songId && req.body.userId){
			let playlistId = req.params.id;
			mongoPlaylistsController.getSinglePlaylist(playlistId, function(playlist){
				console.log("Result", playlist);

				if(playlist){
					if(playlist.userId == req.body.userId){
						mongoSongsController.getSingleSong(req.body.songId, function(song){
							if(song){
								let currentSongs = playlist.songs;

								if(!currentSongs.includes(req.body.songId)){
									currentSongs.push(req.body.songId);
									values = {
										"songs" : currentSongs
									}
									mongoPlaylistsController.updatePlaylist(playlistId, values, function(result){
										res.status(200).send({ "message" : "Song added to playlist"});
									});
								}else{
									res.status(404).send({"error" : "Song '" + song.title + "' already exists in playlist"});
								}
							}else{
								res.status(404).send({"error" : "No song found with id '" + req.body.songId + "'"});
							}
						});
					}else{
						res.status(403).send({"error" : "User '" + req.body.userId + "' is not the owner of playlist '" + playlistId + "'"})
					}
				}else{
					res.status(404).send({"error" : "No playlist found with id '" + playlistId + "'"});
				}
			});
		}else{
			res.status(400).send({"error" : "Please specify 'songId' and 'userId'"});
		}
		
	});

	app.delete("/playlists/:id/song", function(req, res){
		if(req.body.songId){
			let playlistId = req.params.id;
			let songId = req.body.songId;

			mongoPlaylistsController.getSinglePlaylist(playlistId, function(playlist){
				if(playlist){
					let stringSongIds = playlist.songs.map(function(item){ return String(item); })
					playlist.songs.splice( stringSongIds.indexOf(songId), 1 );

					mongoPlaylistsController.updatePlaylist(playlistId, playlist, function(result){
						res.status(200).send({ message: "Song '" + songId + "' deleted" });
					});

				}else{
					res.status(404).send({"error" : "No playlist found with id '" + playlistId + "'"});
				}
			});
		}else{
			res.status(400).send({"error" : "Please specify 'songId'"});
		}
	});

	app.delete("/playlists/:id", function(req, res){
		let id = req.params.id;
		mongoPlaylistsController.deletePlaylist(id, function(status, message){
			res.status(status).send(message);
		});
	});

}
