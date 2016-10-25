---
layout: post
title: When Not To Use Push on a Knockout ObservableArray
tags: Knockout.js ObservableArray javascript
date: '2016-10-25 15:00:25 -0600'
categories: Knockout.js
published: true
comments: true
share: true
---
So you have a Knockout.js app, and you are having some performance issues?  Well, I've been there, and I've learned a few patterns along the way that I just always use now.  This post is about one of them.  It's super convenient to have an ObservableArray and push to it, like so

```javascript
var things = ko.observableArray([1,2,3]);
things.push(4);
```

The issue here is that push is slow by nature, because it requires rebinding the entire DOM(only the part it's bound to).  As your array grows, so does the time to push.  This isn't a huge issue when you have 1 item to push, but what happens when you have a few thousand?  

```javascript
self.moreThings = function () {
    for (i = 0; i < 10 * 1000; i++) {
      self.things.push(i + 2);
    }
  }
```

This takes 85 seconds on my 2015 maxed out MacBook Pro.  Here's a [demo](http://jsbin.com/nenedu/6/edit?html,js,output).  Warning, this will bomb your computer if it isn't up to snuff.  

So why would you do this?  Lots of reasons, retrieving a list of chat messages, search results, or comments on a post that come back as an array.  When your observable array already has records, it's tempting to just push them all.  When your data requires a data model especially.

So to fix this, I always grab the array into a local array, push to that, then set the observable array to the new array.  Like this

```javascript
self.moreThings = function () {
    var tempThings = self.things();
    _.times(10 * 1000, function (i) {
      tempThings.push(i + 2);
    });
    self.things(tempThings);
}
```

I also use lodash in this example, it's FAST.  In this case it doesn't make a huge difference, but if you are iterating an array you got from an ajax call, it can be a factor of many times faster using _.forEach vs a for loop.  Here's a [demo](http://jsbin.com/wiqigu/4/edit?html,js,output) This runs in 5 seconds on my mbp.

Here's an [example](http://jsbin.com/wuxaji/4/edit?html,js,output) with a data model.  Imagine getting the ajaxResult from a standard jQuery $.get() call.  This runs in about 7 seconds, using push directly crashes my browser.  So as a general rule, I use this pattern anytime I'm pushing more than 1 item.  It may only save a few milliseconds on smaller arrays, but those add up fast in a large application.  

```javascript
var ajaxResult = [];

_.times(10 * 1000, function (i) {
  ajaxResult.push(i);
});

function DataModel(data) {
  var self = this;
  self.data = data;
}

function ViewModel () {
  var self = this;
  self.things = ko.observableArray([new DataModel(1),new DataModel(2)]);

  self.moreThings = function () {
    var tempThings = self.things();
    _.forEach(ajaxResult, function (i) {
      tempThings.push(new DataModel(i + 2));
    });
    self.things(tempThings);
  }
}
```

So let me know if you have any suggestions to improve this pattern, I'd love to hear your ideas!!!
