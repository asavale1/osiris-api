var mongoSongsController = require('../db/songs_controller')
var mongoAlbumsController = require('../db/albums_controller')

module.exports = function(app){

	app.get('/albums', function(req, res){
		mongoAlbumsController.getAllAlbums(function(result){
			res.send(result);
		});
	});

	app.get('/albums/:id', function(req, res){
		let id = req.params.id;
		mongoAlbumsController.getSingleAlbum(id, function(result){
			res.send(result);
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
