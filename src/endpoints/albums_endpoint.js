var mongoSongsController = require('../db/songs_controller')
var mongoAlbumsController = require('../db/albums_controller')

module.exports = function(app){

	app.get('/albums', function(req, res){
		mongoAlbumsController.getAllAlbums(function(result){
			if(result){
				return res.send(result);
			}else{
				return res.status(500).send({ "error" : "Error connecting to albums db" });
			}
			
		});
	});

	app.get('/albums/:id', function(req, res){
		let id = req.params.id;
		let detailedView = req.query.detailed;
		mongoAlbumsController.getSingleAlbum(id, function(album){
			if(album){
				if(detailedView === "true" || detailedView === "True"){
					response = {
						"_id" : album._id,
						"title" : album.title,
						"songs" : []
					}

					let promises = [];

					for(let i = 0; i < album.songs.length; i++){
						promises.push(new Promise(function(resolve, reject){
							mongoSongsController.getSingleSong(album.songs[i], function(song){
								song.albumTitle = album.title;
								resolve(song);
							});
						}));
					}

					Promise.all(promises).then(function(songs){
						response.songs = songs;
						res.status(200).send(response);
					});

				}else{
					res.status(200).send(album);
				}
			}else{
				return res.status(404).send({ error: "Album with id '" + id + "' not found" });
			}
		});
	});

	app.delete("/albums/:id", function(req, res){
		let id = req.params.id;
		mongoAlbumsController.getSingleAlbum(id, function(result){

			if(!result){ return res.status(404).send({ error: "No album found with id '" + id + "'" }) }
			
			mongoAlbumsController.deleteAlbum(id, function(result){
				if(result.ok === 1){
					return res.status(200).send({ message: "Album '" + id + "' deleted" });
				}else{
					return res.status(500).send({ message: "An error occurred, failed to delete '" + id + "'" });
				}
			});
			
		});

	});

}
