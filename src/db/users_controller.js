var mongodb = require('mongodb');
var mongoController = require('./controller');

module.exports = {
	getSingleUser: function(user_id, callback){
		mongoController.findItem("users", {_id: new mongodb.ObjectID(user_id)}, function(result){
			callback(result);
		});
	},

	getUsers: function(query, callback){
		mongoController.findMultipleItems("users", query, function(result){
			callback(result);
		});
	},

	addUser: function(user, callback){
		mongoController.insertItem("users", user, function(result){
			callback(result);
		});
	},

	deleteUser: function(user_id, callback){
		mongoController.findItem("users", {_id: new mongodb.ObjectID(user_id)}, function(result){

			if (!result) return callback(404, {"error" : "No user found with id " + user_id});

			mongoController.deleteItem("users", {_id: new mongodb.ObjectID(user_id)}, function(result){
				callback(200, {"message" : "User with id " + user_id + " deleted"});
			});
		});
	},

	updateUser: function(user_id, values, callback){
		mongoController.updateItem("users", {_id: new mongodb.ObjectID(user_id)}, values, function(result){
			console.log(result);
			callback(result);
		});
	}
};