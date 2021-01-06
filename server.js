//Server-side request handler for Recipe Display page
//Made for Comp2406 Winter 2017 - Assignment 4
//Author: Alexander Kuhn (ID 101023154)
var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const ROOT = "./public";

app.set('views', './public');
app.set('view engine', 'pug');

app.use(function(req, res, next) {
    console.log(req.method + " request for " + req.url);
    next();
});

var db;

//connect to the db
MongoClient.connect("mongodb://localhost:27017/recipeDB", function(err, database) {
    if (err) throw err;
    app.listen(2406, function() {
        console.log("Server is alive!!");
    });
    db = database;
});

app.get("/recipes", function(req, res) {
    //scans each recipe in the recipes collection, adds names to an object which it sends to the client
    var recipes = {
        "names": []
    };
    var cursor = db.collection("recipes").find();
    cursor.each(function(err, document) {
        if (document == null) {
            res.send(recipes);
        } else {
            recipes.names.push(document.name);
        }
    });
});


app.get("/recipe/:name", function(req, res) {
	//responds to GET requests for specific recipes requested by name by the client, serves them if present
	//if an error occurs, serves a 500 error; if no recipe by that name exists, serves 404
    db.collection("recipes").findOne({
        "name": req.params.name
    }, function(err, result) {
        if (err) {
            console.log("Error performing find: ", err);
            res.sendStatus(500);
        } else if (result) {
            res.send(result);
        } else { //user not found
            res.sendStatus(404);
        }
    });
});

app.use("/recipe", bodyParser.urlencoded({
    extended: true
})); //extended means allow nested object
app.post("/recipe", function(req, res) {
	//handles POST requests given when the user hits the submit button
	//if attempting to submit a recipe with no name, this function ends early with a 400 code
	//otherwise, checks the database to see if that name is already present
	//if so, it replaces the existing version; if not, it adds a new recipe; and if the database can't add it, it serves a 500 code
    if (req.body.name.length == 0) {
        console.log("ERROR: attempting to add nameless recipe")
        res.sendStatus(400);
    }
	
	else{
		db.collection("recipes").findOne({
			"name": req.body.name
		}, function(err, result) {
			if (err) {
				console.log("Error performing find: ", err);
				res.sendStatus(500);
			} else if (result) {
				db.collection("recipes").findOneAndReplace({
						"name": req.body.name
					}, {
						"name": req.body.name,
						"duration": req.body.duration,
						"ingredients": req.body.ingredients,
						"directions": req.body.directions,
						"notes": req.body.notes
					},
					function(err, result) {
						if (err) {
							console.log("Something's gone wrong");
							res.sendStatus(500);
						} else {
							console.log("Recipe for " + req.body.name + " successfully replaced");
							res.sendStatus(200);
						}
					});
			} else { //recipe not found
				db.collection("recipes").insertOne({
						"name": req.body.name,
						"duration": req.body.duration,
						"ingredients": req.body.ingredients,
						"directions": req.body.directions,
						"notes": req.body.notes
					},
					function(err, result) {
						if (err) {
							console.log("Something's gone wrong");
							res.sendStatus(500);
						} else {
							console.log("Recipe for " + req.body.name + " successfully added");
							res.sendStatus(200);
						}
					});
			}

		});
	}
});

app.get(['/', '/index.html', '/home', '/index'], function(req, res) {
	//tells the server to display index.pug on requests for the root directory
    res.render('index', {});

});

app.use(express.static(ROOT)); //handle all static requests

app.all("*", function(req, res) {
    res.sendStatus(404);
}); // handles page not found errors