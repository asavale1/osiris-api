var mongodb = require('mongodb');
var mongoController = require('./controller');
var fs = require('fs');

module.exports = {
    getAllSongs: function(callback){
		mongoController.findMultipleItems("songs", {}, function(result){
			callback(result);
		});
    },
    getSingleSong: function(song_id, callback){
        mongoController.findItem("songs", {_id: new mongodb.ObjectID(song_id)}, function(result){
            callback(result);
        });
    },
    searchSongs: function(searchQuery, callback){
        
        mongoController.findMultipleItems("songs", { title: searchQuery }, function(result){
            callback(result);
        });
    },
    addSong: function(item, callback){
		mongoController.insertItem("songs", item, function(result){
			console.log("adding song");
			callback(result);
		});
    },
    deleteSong: function(song, callback){
        mongoController.deleteItem("songs", {_id: new mongodb.ObjectID(song._id)}, function(result){
            if(song.filePath){
                fs.unlink(song.filePath, (err) => {
                    if (err) console.error(err);
                });
            }
            callback(result['result']);
        });
    },
    updateSong: function(song_id, values, callback){
    	mongoController.updateItem("songs", {_id: new mongodb.ObjectID(song_id)}, values, function(result){
    		console.log("updated song " + song_id);
    		callback(result);
    	});
    }
};
