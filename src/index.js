const cluster = require('cluster');

if(cluster.isMaster){

	var cpuCount = require('os').cpus().length;
	for (var i = 0; i < cpuCount; i += 1) {
		cluster.fork();
	}

}else{
	const express = require('express')
	const fileUpload = require('express-fileupload')
	const app = express()

	app.use(fileUpload());
	app.use(express.json());
	if(process.env.OSIRIS_APP_HOME){
		app.use('/file', express.static(process.env.OSIRIS_APP_HOME + '/resources/public'));

		app.get('/', function (req, res) {
		    res.send("Welcome to Osiris");
		})

		require('./endpoints/songs_endpoint')(app);
		require('./endpoints/playlists_endpoint')(app);
		require('./endpoints/albums_endpoint')(app);
		require('./endpoints/users_endpoint')(app);
		require('./endpoints/search_endpoint')(app);

		app.listen(3000,'0.0.0.0', () => console.log("Osiris listening on port 3000"))
	}else{
		console.error("Please specify OSIRIS_APP_HOME");
	}
}

