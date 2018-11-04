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
		mongoController.deleteItem("users", {_id: new mongodb.ObjectID(user_id)}, function(result){
			callback(result['result']);
		});
	},

	updateUser: function(user_id, values, callback){
		mongoController.updateItem("users", {_id: new mongodb.ObjectID(user_id)}, values, function(result){
			console.log(result);
			callback(result);
		});
	}
};