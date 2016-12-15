---
layout: post
title: Require.js build in one file.
tags: requirejs javascript bundling
date: '2016-12-14 04:58:25 -0600'
categories: Javascript
published: true
comments: true
share: true
---
Have you ever done a require.js build and wondered why you still have to load require.js and THEN your bundle?  I sure have, but I never gave it much thought until I had to make my site work on REALLY slow internet.  Think bad 2g speeds.  

Require.js has a 5 second timeout on loading files, and when your bundle is 500kb, that doesn't load on bad 2g speeds.  Sure, it works GREAT on normal speeds, and your app feels like a native app, but that doesn't matter when some of your users can't use it at all...

So I decided to experiment, and here's what I came up with.  You can indeed combine require.js and your bundle, minify it, and async load one file.  So I'll walk you through an example.  At any point reading this or working through this, if you have suggestions, feedback, or ways to improve it please let me know in the comments.

Let's start with a well known example, clone the repo at [example jquery shim](https://github.com/requirejs/example-jquery-shim).  If you don't have Node.js installed, you will need to install it for this tutorial.  Go ahead and run this example with the following.

```bash
cd tools
node server.js
```

Then browse to http://localhost:8888 and see the result.  Hit f12, or option apple i, and look at the network tab.  Hit reload and you'll see it is loading about 8 javascript files, yuck!

So let's build it, run the following, still in the /tools directory.

```bash
node r.js -o build.js
node server.js
```

This time browse to http://localhost:8888/www-build/app.html and reload with the dev tools network tab open, you'll see it loads require.js and then app.js.  This is better, but why two files?  Let's see if we can fix that shall we?  Create a new file in the tools directory, call it build.sh

```bash
nano build.sh
```

Add the following to this file (you will need minify installed globally, npm install -g minify)
```bash
#!/bin/bash

node r.js -o build.js
cat ../www-build/js/lib/require.js ../www-build/js/app.js > ../www-build/js/build.js
minify ../www-build/js/build.js > ../www-build/js/build.min.js
```

Then make it executable, and execute it (sorry windows peeps, you are on your own here)
```bash
chmod +x build.sh
./build.sh
```

This will leave you with two files in your www-build/js directory called build.js, and build.min.js.  Now all we need to do is use the .min.js file and we are done.  So open up www-build/app.html and change the following line

```html
<script data-main="js/app" src="js/lib/require.js"></script>
```
To this
```html
<script data-main="js/app" src="js/build.min.js" async></script>
```

Start the sever back up
```bash
node server.js
```

And browse back to http://localhost:8888/www-build/app.html and check out the network tab.  It is now loading just one file, build.min.js, and that file is very small, around 98k, and very minimized.  Best yet, it's loaded async, so even on REALLY slow connections, it won't block your page.  Why the r.js build process doesn't do this for us is beyond me, but I do this on a very large and complex project without issue, so I'm curious to know what your mileage is if you try it out.  So let me know!

Happy coding,
Joshua
