var mongoPlaylistsController = require('../db/playlists_controller');
var mongoSongsController = require('../db/songs_controller');

module.exports = function(app){

	app.get('/search', function(req, res){
		console.log("Request", req.query);
		let searchQuery = req.query.query;
		if(searchQuery){

			let response = {
				"songs" : [],
				"albums" : []
			}

			let promises = []

			promises.push(new Promise(function(resolve, reject){
				mongoSongsController.searchSongs(searchQuery, function(result){
					resolve(result);
				});
			}));

			Promise.all(promises).then(function(results){
				console.log("Songs", results)
				response.songs = results[0];
				res.status(200).send(response);
			});
			
		}else{
			mongoSongsController.getAllSongs(function(result){
				res.send(result);
			});
		}
		
	});

}
