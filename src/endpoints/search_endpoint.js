var mongoPlaylistsController = require('../db/playlists_controller');
var mongoSongsController = require('../db/songs_controller');
var mongoAlbumsController = require('../db/albums_controller');
var mongoPlaylistsController = require('../db/playlists_controller');
var mongoUsersController = require('../db/users_controller');


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
				mongoSongsController.searchSongs(new RegExp(val, 'i'), function(songs){

					if(songs){
						let albumPromises = []

						for(let i = 0; i < songs.length; i++){
							albumPromises.push(new Promise(function(resolve, reject){
								mongoAlbumsController.getSingleAlbum(songs[i].albumId, function(album){
									resolve(album);
								});
							}));
						}
						Promise.all(albumPromises).then(function(albums){
							for(let i = 0; i < albums.length; i++){
								if(String(albums[i]._id) === String(songs[i].albumId)){
									songs[i].albumTitle = albums[i].title
								}
							}
							resolve(songs);
						});
					}else{
						resolve([]);
					}
				});
			}));

			promises.push(new Promise(function(resolve, reject){
				let val = '.*' + searchQuery + '.*';
				mongoAlbumsController.searchAlbums(new RegExp(val, 'i'), function(albums){
					if(albums){
						resolve(albums);
					}else{
						reject([]);
					}
				});
			}));

			promises.push(new Promise(function(resolve, reject){
				let val = '.*' + searchQuery + '.*';
				mongoPlaylistsController.getPlaylists({ primary: false, title: new RegExp(val, 'i') }, function(playlists){
					if(playlists){

						console.log("playlists", playlists);
						let userPromises = []

						for(let i = 0; i < playlists.length; i++){
							userPromises.push(new Promise(function(resolve, reject){
								mongoUsersController.getSingleUser(playlists[i].userId, function(user){
									resolve(user);
								});
							}));	
						}

						Promise.all(userPromises).then(function(users){
							for(let i = 0; i < users.length; i++){
								let user = users[i];
								if(user){
									playlists[i].userUsername = user.username;
								}else{
									playlists[i].userUsername = '';
								}
							}
							resolve(playlists);
						});
						
					}else{
						resolve([]);
					}
				});
			}));
			
		}else{

			promises.push(new Promise(function(resolve, reject){

				mongoSongsController.getAllSongs(function(songs){
					if(songs){
						let albumPromises = []

						for(let i = 0; i < songs.length; i++){
							albumPromises.push(new Promise(function(resolve, reject){
								mongoAlbumsController.getSingleAlbum(songs[i].albumId, function(album){
									resolve(album);
								});
							}));
						}
						Promise.all(albumPromises).then(function(albums){
							for(let i = 0; i < albums.length; i++){
								if(String(albums[i]._id) === String(songs[i].albumId)){
									songs[i].albumTitle = albums[i].title
								}
							}
							resolve(songs);
						});
					}else{
						resolve([]);
					}
				});
			}));

			promises.push(new Promise(function(resolve, reject){
				mongoAlbumsController.getAllAlbums(function(albums){
					if(albums){
						resolve(albums);
					}else{
						resolve([])
					}
				});
			}));

			promises.push(new Promise(function(resolve, reject){
				mongoPlaylistsController.getPlaylists({ primary: false}, function(playlists){
					if(playlists){

						let userPromises = []

						for(let i = 0; i < playlists.length; i++){
							userPromises.push(new Promise(function(resolve, reject){
								mongoUsersController.getSingleUser(playlists[i].userId, function(user){
									resolve(user);
								});
							}));	
						}

						Promise.all(userPromises).then(function(users){
							for(let i = 0; i < users.length; i++){
								let user = users[i];
								if(user){
									playlists[i].userUsername = user.username;
								}else{
									playlists[i].userUsername = '';
								}
							}
							resolve(playlists);
						});
						
					}else{
						resolve([]);
					}
				});
			}));
		}

		Promise.all(promises).then(function(results){
			console.log("Playlists", results[2]);

			res.status(200).send(
				{ 
					"songs" : results[0].sort(compare), 
					"albums" : results[1].sort(compare),
					"playlists" : results[2].sort(compare)
				}
			);
		});
		
	});

}
