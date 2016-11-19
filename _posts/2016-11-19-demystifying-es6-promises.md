---
published: true
layout: post
date: '2016-11-19 05:10:10 -0600'
categories: Javascript
title: Demystifying es6 Promises
tags: es6 javascript
comments: true
share: true
---
## Demystifying es6 Promises

Why would you use es6 promises?  What's the point?  I struggled with this at first.  There were plenty of posts arguing about why jQuery deferreds weren't as good, or about all the technical details.  But I just wanted to know "why?" It finally clicked for me, and then I was trying to explain it to another developer and I realized he had the same question.  So in this post I'm going to try to answer that question.  I am not going to go into details about "how" to use promises.  I am not going to get overly technical.  I'm going to try to keep it as simple as possible, and just answer the "why" question.

I am a firm believer in simple examples without any extra details to confuse or get in the way of understanding.  So let's start out with a super simple example of something called callback hell.  If you know this term, bear with me.  If not, well, you'll figure it out.

Say we have two functions, one that adds, and one that subtracts.  They look like this:

```
function add(x, y, callback) {
  return callback(x + y);
}

function subtract(x, y, callback) {
  return callback(x - y);
}
```

In a real world scenario, these would probably be functions that saved data to a database or deleted it.  You would use a callback to keep it async so it didn't block your UI while it did it's thing.  In our example, simple is good, so we are just going to add numbers and subtract them, async(not really, just pretend with me)...

Using these functions is easy enough, but say you wanted to do a sequence like add x to y, then subtract x from the result, then add y to that result, then subtract y from that result, then finally add x to that result and print it out.  This is highly contrived, it's not likely you would do that many database calls in a row.  But, it illustrates the callback hell pretty well.  It would look like this:

```
var x = 1,
    y = 2;

add(x, y, function (result) {
  subtract(result, x, function (result) {
    add(result, y, function (result) {
      subtract(result, y, function (result) {
        add(result, x, function (result) {
          console.log(result);
        });
      });
    });
  });
});
```

All those dangly }); can get super hard to keep track of.  This is where promises come in.  First, here's a [bin](http://jsbin.com/tohaza/edit?js,console) of this contrived example.

So let's convert our add and subtract functions to promises.  Something like this, again, no how, just the code.  Don't worry if these don't make sense, not the point of this post.

```
function add(x, y) {
  return new Promise (function(resolve, reject) {
    resolve (x + y);
  });
}

function subtract(x, y ) {
  return new Promise (function(resolve, reject) {
    resolve(x - y);
  });
}
```

Now comes the fun part, how do you use a promise to get rid of that callback hell?  Like this:

```
var x = 1,
    y = 2;

add(x, y)
.then(function (result) {
  return subtract(result, x);
})
.then(function (result) {
  return add(result, y);
})
.then(function (result) {
  return subtract(result, y);
})
.then(function (result) {
  return add(result, x);
})
.then(function (result) {
  return console.log(result);
});
```

Now the code reads a bit more like synchronous code, but it's still very much async code(for real this time even).  So what's going on here?  Basically, the add function takes two parameters and returns a promise.  The promise will, at some point, execute a resolve function, which we use as a .then call.  This was uber confusing to me at first, but basically when your promise calls resolve, it executes .then.  I didn't design it.  Anywho, .then gets as parameters whatever you pass to resolve, in this example, I call it result.  I think it reads pretty well, add x and y, then subtract x, then add y, then subtract y, then add x, then log it.

Here is a bin of the [promise example](http://jsbin.com/qezufuy/edit?html,js,console)

What do you think, does this example help at all?  Let me know.

Happy coding,
Joshua
