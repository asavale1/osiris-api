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
		console.log("Get User Playlists");
		let id = req.params.id;
		mongoPlaylistsController.getPlaylists({ 'userId' : req.params.id }, function(result){
			if(result){
				return res.status(200).send(result);
			}else{
				return res.status(500).send({ "error" : "Error connecting to db" });
			}
		});
	});

	app.post('/playlists', function(req, res){
		console.log('Create playlist');
		console.log(req.body);

		if(!req.body || !req.body.title || !req.body.userId){
			console.log("Invalid request");
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
						"songs" : []
					}

					let promises = [];

					for(let i = 0; i < playlist.songs.length; i++){
						promises.push(new Promise(function(resolve, reject){
							mongoSongsController.getSingleSong(playlist.songs[i], function(song){
								mongoAlbumsController.getSingleAlbum(song.albumId, function(album){
									song.albumTitle = album.title;
									resolve(song);
								});
							});
						}));
					}

					Promise.all(promises).then(function(songs){
						response.songs = songs;
						res.status(200).send(response);
					});

				}else{
					res.status(200).send(playlist);
				}
			}else{
				res.status(400).send({"error" : "No playlist found with id '" + playlistId + "'"})
			}
			
		});
	});

	app.put('/playlists/:id/song', function(req, res){
		console.log("Add song to playlist");
		console.log(req.body);

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
				console.log("Result", playlist);

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
		console.log("Delete playlist");
		console.log(req.params.id);
		let id = req.params.id;
		mongoPlaylistsController.deletePlaylist(id, function(status, message){
			res.status(status).send(message);
		});
	});

}
