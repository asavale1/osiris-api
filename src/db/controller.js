var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;
var mongoURL = "mongodb://localhost:27017/"

module.exports = {
    insertItem: function(collection, item, callback){
    	mongoClient.connect(mongoURL, function(err, db) {
            if(err || !db){
                callback(null);
            }else{
                var dbo = db.db("groovy");
                dbo.collection(collection).insertOne(item, function(err, res){
                    if (err) throw err;
                    console.log("1 item inserted into " + collection)
                    db.close();
                    callback(res);
                });
            }
    	});
    },
    findItem: function(collection, query, callback){
    	mongoClient.connect(mongoURL, function(err, db) {
            if(err || !db){
                callback(null);
            }else{
                var dbo = db.db("groovy");
                dbo.collection(collection).findOne(query, function(err, result){
                    if (err) throw err;
                    console.log("Found item in collection " + collection);
                    db.close();
                    callback(result);
                });
            }
    		
    	});
    },
    findMultipleItems: function(collection, query, callback){
    	mongoClient.connect(mongoURL, function(err, db) {
            if(err || !db){
                callback(null);
            }else{
                var dbo = db.db("groovy");
                dbo.collection(collection).find(query).toArray(function(err, result){
                    if (err) throw err;
                    console.log("Found items in collection " + collection);
                    db.close();
                    callback(result);
                });
            }
    	});
    },
    deleteItem: function(collection, query, callback){
    	mongoClient.connect(mongoURL, function(err, db) {
            if(err || !db){
                callback(null);
            }else{
                var dbo = db.db("groovy");
                dbo.collection(collection).deleteOne(query, function(err, result){
                    if (err) throw err;
                    console.log("Deleted item in collection " + collection);
                    db.close();
                    callback(result);
                });
            }
    	});
    },
    updateItem: function(collection, query, values, callback){
    	mongoClient.connect(mongoURL, function(err, db){
            if(err || !db){
                callback(null);
            }else{
                var dbo = db.db("groovy");
                dbo.collection(collection).updateOne(query, { $set: values }, function(err, result){
                    if (err) throw err;
                    console.log("Updated item in collection " + collection);
                    db.close();
                    callback(result);
                });
            }
    	});
    }
};


