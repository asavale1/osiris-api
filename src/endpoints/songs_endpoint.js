var mongoSongsController = require('../db/songs_controller')
var mongoAlbumsController = require('../db/albums_controller')

const mime = require('mime-types')
const musicMetadata = require('music-metadata');
const util = require('util')
const fs = require('fs');

module.exports = function(app){

	app.get('/songs', function(req, res){
		mongoSongsController.getAllSongs(function(result){
			res.send(result);
		});
	});

	app.get('/songs/:id', function(req, res){
		let id = req.params.id;
		mongoSongsController.getSingleSong(id, function(result){
			res.send(result);
		});
	});

	app.post('/songs', function(req, res){


		let songFile = req.files.songFile;

		if(!songFile){ return res.status(400).send({ "error" : "Invalid file" }); }

		mongoSongsController.addSong({}, function(result){
			let id = result.insertedId;

			let fileExt = songFile.name.split(".").pop();

			let extension;
			if(mime.extensions[songFile.mimetype].indexOf(fileExt) != -1){
				extension = fileExt;
			}else{
				extension = mime.extension(songFile.mimetype);
			}
			
			let filePath = process.env.OSIRIS_APP_HOME + '/resources/public/' + id + "." + extension;

			
			songFile.mv(filePath, function(err){
				if(err){
					mongoSongsController.deleteSong(id, function(result){
						return res.status(500).send(err);
					});
				}else{
					musicMetadata.parseFile(filePath, {native: true})
					.then( metadata => {
						
						let promises = [];

						promises.push(new Promise(function(resolve, reject){
							mongoAlbumsController.searchAlbums(metadata["common"]["album"], function(result){

								if(result.length == 0){

									let albumData = { title: metadata["common"]["album"], songs: [ id ]};
									mongoAlbumsController.addAlbum( albumData, function(result){
										resolve(result.insertedId);
									});

								}else{
									let album = result[0];
									album.songs.push(id);

									mongoAlbumsController.updateAlbum(album._id, album, function(result){
										resolve(album._id);
									});
								}
							});
						}));

						Promise.all(promises).then(function(results){
							let albumId = results[0];
							mongoSongsController.updateSong(id, { 
								"title" : metadata["common"]["title"], 
								"albumId" : albumId, 
								"filePath" : filePath, 
								"fileUrl" : "/file/" + id + "." + extension }, function(result){
									
								return res.status(200).send({ message: "Song added" });
							});
						});

					})
					.catch( err => {
						console.error(err);
						mongoSongsController.deleteSong(id, function(result){
							return res.status(500).send(err);
						});
					});
				}
			});
		});
	});

	app.delete("/songs/:id", function(req, res){
		let id = req.params.id;

		mongoSongsController.getSingleSong(id, function(song){
			if(!song){ return res.status(404).send({ error: "No song found with id '" + id + "'" }); }

			mongoSongsController.deleteSong(song, function(result){
				if(result.ok === 1){
					mongoAlbumsController.getSingleAlbum(song.albumId, function(album){
						if(album){

							let stringSongIds = album.songs.map(function(item){ return String(item); })

							album.songs.splice( stringSongIds.indexOf(id), 1 );
							
							if(album.songs.length == 0){
								mongoAlbumsController.deleteAlbum(album._id, function(result){
									if(result.ok === 1){
										return res.status(200).send({ message: "Song '" + id + "' deleted" });
									}
								});
							}else{
								mongoAlbumsController.updateAlbum(album._id, album, function(result){
									return res.status(200).send({ message: "Song '" + id + "' deleted" });
								});
							}
						}
					});
					
				}else{
					return res.status(500).send({ message: "An error occurred, failed to delete Song with id '" + id + "'" });
				}
			});
		});

	});

	app.put("/songs/:id", function(req, res){
		let id = req.params.id;

		mongoSongsController.updateSong(id, req.body, function(result){
			res.send(result);
		});
	});
}
