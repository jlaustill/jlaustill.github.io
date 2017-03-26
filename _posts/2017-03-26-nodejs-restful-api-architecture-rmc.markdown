---
layout: post
title: Node.js RESTful API Architecture (RMC)
tags: restful node.js architecture api
date: '2017-03-26 01:58:25 -0600'
categories: Architeture
published: true
comments: true
share: true
---
So you've been tasked with writing a RESTful API in Node.js.  You google and find tons of examples using all different libraries and frameworks.  They all have a different file layout and it's really confusing.  How do you structure your API?  I've been through this myself, and this blog post is going to discuss that and propose the architecture I've come to use in my own projects.

The first thing to note here is that we are talking about architecture, not frameworks/libraries.  You can use any libraries you want with this architecture.  Express.js, Restify, Hapy, or Koa will all work for the web framework.  MongoDB, MySQL, or PostgreSQL will all work for the storage engine.  I am going to discuss project layout and my examples will use Express.js and MongoDB.

I call my architecture RMC, which stands for Routers, Models, and Contexts.  You may have done MVC development in the past, and what I am proposing is very similar.  Routers will handle incoming and outgoing traffic and define your endpoints.  Models will be the classes you use to define your objects.  Lastly, contexts will be classes that interact with your data store.  Depending on your framework choices, these models and contexts and routers will look slightly different.  The important thing is to understand the function of each and separate your concerns.

So let's start with a simple file structure like this:
```
root
|   app.js
|   package.json
|
└───routers
└───models
└───contexts
```

For this example, I will design a very simple API that stores and retrieves things.  A thing will have a name, and the date it was last updated.  I'll keep it as simple as I possibly can so we can concentrate on where files are stored and not the code.  I'll use Mongoose, but you can just as easily use the native MongoDB driver, and it will perform better.  

So the first thing we'll do is create our thing model.  Create a file in the models directory, and name it thingModel.js.  

```
const mongoose = require("mongoose"),
      Schema = mongoose.Schema,

// create the thing schema
thingSchema = new Schema({
    name: String,
    date: { type: Date, default: Date.now }
});

// on every save, add the date
thingSchema.pre('save', (next) => {
    // change the date field to current date
    this.date = new Date();

    next();
});

// the schema is useless so far
// we need to create a model using it
const Thing = mongoose.model("Thing", thingSchema);

// make this available to our users in our Node applications
module.exports = Thing;
```

This is a very simple model, don't worry if you don't understand it.  The important thing to note is that the model will define the thing object.  It should be able to parse incoming JSON objects, and store them out to the format your data store expects.  Things that your model should NOT do are interact with the datastore, parse query strings, and send responses to clients.  It should only parse your object and return your object in the formats needed.

Now our file structure looks like this:
```
root
|   app.js
|   package.json
|
└───routers
└───models
|   thingModel.js
|
└───contexts
```

Next, we can use this model to create a context.  A context is a simple class that exposes an interface for your data store.  You can create a new instance of a context, and call specific functions, something like this.

```
const thingContext = new ThingContext();
thingContext.getThingById("arstarstarstrst", (thing) => {
  console.log(thing);
  });
```

When using this context, the calls should read like a book.  You shouldn't have to concern yourself with the shape of the data, because the model should handle that.  And at this point, you shouldn't have any concern about routes.  So lets create a new file under the contexts folder called thingContext.js and put this code in it.

```
const ObjectId = require("mongodb").ObjectID,
      Thing = require("../models/thingModel.js");

module.exports = class {
    getThingById (id, callback) {
        Thing.find(
                {"_id": new ObjectId(id)},
                (err, thing) => {
                    if (null !== err) {
                        return callback({"errors": [err]});
                    } else {
                        return callback(thing);
                    }
                });
    } // getThingById

    saveThing (thing, callback) {
        thing.save( (err, result) => {
                if (err === null) {
                    return callback(result);
                } else {
                    return callback({"errors": [err]});
                } // if
            }); // insertOne()
    } // saveThing

    getAllThings (callback) {
        Thing.find((err, result) => {
                if (err === null) {
                    return callback(result);
                } else {
                    return callback({"errors": [err]});
                } // if
            }); // find
    } // getAllThings
}; // module.exports
```

This class defines 3 calls, getAllThings, saveThing, and getThingById.  These are hopefully straight forward, getAllThings will return an array of every thing in the data store.  In a real world example, you'd probably create a method that returned a page of data and took a page number instead.  But this example is super simple, just get them all.  saveThing takes an instance of the thingModel and saves it to the data store.  getThingById just does what it says, takes an ID and returns the associated thing.

Now our file structure looks like this:
```
root
|   app.js
|   package.json
|
└───routers
└───models
|   thingModel.js
|
└───contexts
|   thingContext.js
```

Alright, now all we need is some way to accept an incoming request, call the context, and return the result.  Easy as pie right?  We call these routers.  I use a structure where I name the files the same as the routes.  So assuming I want a route that is GET /some/little/cat/by/id I would have the following structure

```
root
|   app.js
|   package.json
|
└───routers
    └───some
        └───little
            └───cat
            |   by.js
```

This example makes no sense, but I think it illustrates the files matching the endpoint.  For my example project, I will define the following routes
```
GET / => return version and environment info
GET /thing/all => return every thing
GET /thing?id=???? => return specific thing
POST /thing {name: "value"} => save thing
```

To do this, we will need a database connection.  So create a file in the root called environment.json and save a configuration.
```
{
	"local": {
		"connectionString": "mongodb://root:rjvRhE1t03j5v9go@hawstelcluster-shard-00-00-0kqfj.mongodb.net:27017,hawstelcluster-shard-00-01-0kqfj.mongodb.net:27017,hawstelcluster-shard-00-02-0kqfj.mongodb.net:27017/rmc?ssl=true&replicaSet=HawstelCluster-shard-0&authSource=admin",
		"database": "rmc"
	}
}
```
Then create another file called environment.js
```
if (!process.env.description) {
    console.log("Environment not defined, assuming local.");
    process.env.description = "local";
} else {
    console.log("Environment is " + process.env.description + ".");
}

var environment = require("./environment.json");
module.exports = environment[process.env.description];
```

This is a simple way of defining multiple configs for local/dev/qa/prod etc and storing them away.  Which we can use in our routers.  So create a file called index.js in the routers folder.
```
const router = require("express").Router();

router.use("/thing", require("./thing"));

router.get("/", (req, res) => {
    res.json({"request": "successful", "version": "0.0.3", "environment": process.env.description});
});

module.exports = router;
```

Here we can see that we create a router, and define our first route GET /.  This route simply returns a json object and that's it.  We also include our thing router, which will be named thing.js.  I choose not to call it thingRouter.js so it matches the route exactly.  Next, we create our thing router, create a file called thing.js.
```
const router = require("express").Router(),
    Thing = require(__appRoot + "/models/thingModel.js"),
    ThingContext = require(__appRoot + "/contexts/thingContext.js");

const thingContext = new ThingContext();

router.use(require("./thing/all"));

router.route("/")
    .get((req, res) => {
        const id = req.query.id;
        thingContext.getThingById(id, (thing) => {
            res.json(thing);
        }); // getThingById
    }) // route.get
    .post((req, res) => {
        const thing = new Thing({"name": req.body.name});

        thingContext.saveThing(thing, (result) => {
            res.json(result);
        }); // postThing
    }); // route.post

module.exports = router;
```

Here you can see we define GET /thing and POST /thing.  We also include the /thing/all routes, which will live in a file under /routers/thing/all.js.  This way, it matches the route /thing/all.  You will end up with a file and a route file for each route.  In this case thing.js and /thing.  You can always know that the folders contains the routes further down the line, and they will always match the route.  

So create the all.js file under /routers/thing
```
const router = require("express").Router();
const ThingContext = require(__appRoot + "/contexts/thingContext.js");
const thingContext = new ThingContext();

router.route("/all")
    .get((req, res) => {
        thingContext.getAllThings((things) => {
            res.json(things);
        }); // getAllThings
    }); // route.get

module.exports = router;
```

This is a simple route that calls our getAllThings method on our context and returns them.  I don't think I could make it much simpler than this.  Now our file structure looks like this:
```
root
|   app.js
|   package.json
|   enviroment.json
|   enviroment.js
|
└───routers
|   index.js
|   thing.js
    └───thing
    |   all.js
└───models
|   thingModel.js
|
└───contexts
|   thingContext.js
```       

We now have a complete API that you can make calls against.  When you call GET /thing/all, you KNOW the code is in /routers/thing/all.js just by the url.  You will know that the database code is handled in the context used in all.js, in this case thingContext.  And you will know that the object is handled in the model used in the context, in this case, thingModel.js.

You can scale this architecture easily, the routers grow and the folder structure always matches.  You can store submodels under the same folder structure.  If things had dodads, you could create /models/thing/dodadsModel.js.

Lastly, you can version easily if you want.  You can create a folder called /routers/v1 and start all your routes with /v1/thing.  You can save your models and contexts the same way under /model/v1 and context/v1.  Then when the time comes to create v2, you can copy and paste the directories to v2 and start from there.  Or you can create the v2 routes, models, and contexts from scratch without affecting v1.

I've put this example together at [github](https://github.com/jlaustill/rmc) and included the connection to my MongoDB Atlas database(for now).  If you run this repo, store me a thing with a nice little message :)

I'd welcome feedback on this architecture, and any way to improve it.  I've put a lot of thought and trial and error into it.  I've written an API for an entire intranet using this architecture and it was a very smooth and pleasant experience.

Happy coding!
Joshua
