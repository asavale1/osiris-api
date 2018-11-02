var mongoController = require('../db/users_controller')

module.exports = function(app){

	app.get('/users', function(req, res){
		mongoController.getUsers({}, function(result){
			res.status(200).send(result);
		});
	});

	app.post('/users', function(req, res){
		console.log("Create User", req.body);
		mongoController.getUsers({ 'pin' : req.body.pin }, function(result){
			if(result.length != 0){
				res.status(400).send({ "error" : "Another user exists with the specified pin"})
			}else{

				let validTillDate = new Date();
				validTillDate.setDate(validTillDate.getDate() + 3);

				let user = {
					'pin' : req.body.pin,
					'oldPin' : null,
					'validTill' : validTillDate,
					'activated' : false
				};

				mongoController.addUser(user, function(result){
					res.status(201).send("User created with pin " + req.body.pin);
				});

				
			}
		});
	});

	app.post('/users/verify', function(req, res){
		if(req.body.pin){
			mongoController.getUsers({ 'pin' : req.body.pin }, function(result){
				console.log(result);
				if(result.length == 0){
					res.status(404).send({ "error" : "Invalid pin"});
				}else{
					let userInfo = result[0];
					let validTillDate = new Date(userInfo['validTill']);
					let currentDate = new Date();
					if(currentDate < validTillDate){
						currentDate.setDate(currentDate.getDate() + 90);
						let values = {
							'activated' : true,
							'validTill' : currentDate
						}
						mongoController.updateUser(userInfo['_id'], values, function(result){
							res.status(200).send({ 'id' : userInfo['_id'] });
						});
					}else{
						res.status(400).send({ "error" : "Your pin has expired, please request a new one" });	
					}
					console.log("User Info", result);
					console.log("Valid Till", validTillDate);
					
				}
			});
		}else{
			res.status(400).send({ "error" : "Please specify a pin"});
		}
	});

	app.put('/users/:id/pin', function(req, res){

		let id = req.params.id;
		mongoController.getSingleUser(id, function(result){
			console.log(result);

			if(result){
				let validTillDate = new Date();
				validTillDate.setDate(validTillDate.getDate() + 3);

				values = {
					"pin" : req.body.pin,
					"validTill" : validTillDate
				}
				mongoController.updateUser(id, values, function(result){
					res.status(200).send();
				});
			}else{
				res.status(404).send({ "error" : "User with id '" + id + "' not found"});
			}
		});
	});

	app.delete("/users/:id", function(req, res){
		let id = req.params.id;
		mongoController.deleteUser(id, function(status, message){
			res.status(status).send(message);
		});
	});

}
