var mongoPlaylistsController = require('../db/playlists_controller');
var mongoSongsController = require('../db/songs_controller');
var mongoAlbumsController = require('../db/albums_controller');


function compare(a,b) {
  if (a.title < b.title)
    return -1;
  if (a.title > b.title)
    return 1;
  return 0;
}

module.exports = function(app){

	app.get('/search', function(req, res){
		console.log("Request", req.query);

		let searchQuery = req.query.query;
		let promises = []

		if(searchQuery){

			promises.push(new Promise(function(resolve, reject){
				let val = '.*' + searchQuery + '.*';
				mongoSongsController.searchSongs(new RegExp(val, 'i'), function(result){
					
					let albumPromises = []

					for(let i = 0; i < result.length; i++){
						albumPromises.push(new Promise(function(resolve, reject){
							mongoAlbumsController.getSingleAlbum(result[i].albumId, function(album){
								resolve(album);
							});
						}));
					}
					Promise.all(albumPromises).then(function(albums){
						for(let i = 0; i < albums.length; i++){
							if(String(albums[i]._id) === String(result[i].albumId)){
								result[i].albumTitle = albums[i].title
							}
						}
						resolve(result);
					});
				});
			}));

			promises.push(new Promise(function(resolve, reject){
				let val = '.*' + searchQuery + '.*';
				mongoAlbumsController.searchAlbums(new RegExp(val, 'i'), function(result){
					resolve(result);
				});
			}));
			
		}else{

			promises.push(new Promise(function(resolve, reject){


				mongoSongsController.getAllSongs(function(result){

					let albumPromises = []

					for(let i = 0; i < result.length; i++){
						albumPromises.push(new Promise(function(resolve, reject){
							mongoAlbumsController.getSingleAlbum(result[i].albumId, function(album){
								resolve(album);
							});
						}));
					}
					Promise.all(albumPromises).then(function(albums){
						for(let i = 0; i < albums.length; i++){
							if(String(albums[i]._id) === String(result[i].albumId)){
								result[i].albumTitle = albums[i].title
							}
						}
						resolve(result);
					});
				});
			}));

			promises.push(new Promise(function(resolve, reject){
				mongoAlbumsController.getAllAlbums(function(result){
					resolve(result);
				});
			}));

		}

		Promise.all(promises).then(function(results){
			res.status(200).send({ "songs" : results[0].sort(compare), "albums" : results[1].sort(compare) });
		});
		
	});

}
