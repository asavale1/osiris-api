var mongodb = require('mongodb');
var mongoController = require('./controller');

module.exports = {
	getSinglePlaylist: function(playlist_id, callback){
		mongoController.findItem("playlists", {_id: new mongodb.ObjectID(playlist_id)}, function(result){
			callback(result);
		});
	},

	getPlaylists: function(query, callback){
		console.log("Query", query);
		mongoController.findMultipleItems("playlists", query, function(result){
			callback(result);
		});
	},

	addPlaylist: function(playlist, callback){
		mongoController.insertItem("playlists", playlist, function(result){
			callback(result);
		});
	},

	deletePlaylist: function(playlist_id, callback){
		mongoController.findItem("playlists", {_id: new mongodb.ObjectID(playlist_id)}, function(result){

			if (!result) return callback(404, {"error" : "No playlist found with id " + playlist_id});

			mongoController.deleteItem("playlists", {_id: new mongodb.ObjectID(playlist_id)}, function(result){
				callback(200, {"message" : "Playlist with id " + playlist_id + " deleted"});
			});
		});
	},

	updatePlaylist: function(playlist_id, values, callback){
		mongoController.updateItem("playlists", {_id: new mongodb.ObjectID(playlist_id)}, values, function(result){
			callback(result);
		});
	}
};