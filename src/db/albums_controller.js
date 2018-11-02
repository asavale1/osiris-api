var mongodb = require('mongodb');
var mongoController = require('./controller');

module.exports = {
	getAllAlbums: function(callback){
		mongoController.findMultipleItems("albums", {}, function(result){
			callback(result);
		});
    },
    getSingleAlbum: function(album_id, callback){
		mongoController.findItem("albums", {_id: new mongodb.ObjectID(album_id)}, function(result){
			callback(result);
		});
	},
	searchAlbums: function(searchQuery, callback){
		mongoController.findMultipleItems("albums", { title: searchQuery}, function(result){
			callback(result);
		});
	},
	addAlbum: function(item, callback){
		mongoController.insertItem("albums", item, function(result){
			callback(result);
		});
	},
	deleteAlbum: function(album_id, callback){
		mongoController.deleteItem("albums", {_id: new mongodb.ObjectID(album_id)}, function(result){
			callback(result['result']);
		});
	},
	updateAlbum: function(album_id, values, callback){
    	mongoController.updateItem("albums", {_id: new mongodb.ObjectID(album_id)}, values, function(result){
    		console.log("updated album " + album_id);
    		callback(result);
    	});
    }
}