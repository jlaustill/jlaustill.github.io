---
published: true
layout: post
date: '2016-10-17 10:10:10 -0600'
categories: Magento
title: How to get a token from a Magento 1.0 REST API
tags: Magento RESTful API Node.js
comments: true
share: true
---
## How to get a token from a Magento 1.0 REST API

Today I had to get a token from our Magento site, which is 1.14.2.  The [documentation is shady at best](http://devdocs.magento.com/guides/m1x/api/rest/authentication/oauth_authentication.html), and man was I frustrated by the end of the day.  It required non standard oauth headers that Postman didn't seem to support.  I found [another tutorial](http://stackoverflow.com/questions/28045800/how-to-use-postman-rest-client-with-magento-rest-api-with-oauth-how-to-get-toke) that was a few years old, but the steps didn't work anymore.  It was frustrating enough that I decided I needed to write down the steps and script out how I finally accomplished it for future reference.  If it helps you out too, even better.

My final solution ended up being 2 [Node.js](https://nodejs.org/en/) scripts and a manual step.  The basic process takes 3 steps, for which you'll need a consumer token and a consumer secret.  If you don't have these yet, [here is a great guide on setting up Magento](http://inchoo.net/magento/configure-magento-rest-and-oauth-settings/).

**Step 1**
The first step is to do a POST request to /oauth/initiate.  I actually got this one to work in Postman, but I decided to script it out so I can run it again quickly in future.  I used Node.js and a library called ['request'](https://github.com/request/request).

You will need the consumer key and consumer secret you got when you setup the site, as per the guide on setting up Magento in my intro.  Then, the script looks like this

```
var request = require('request');

var consumerKey = '57d84828608840c7dbaa637f2f66ee13',
    consumerSecret = "82fbea317ff08682cdd73d9eb242f0c7",
    siteUrl = "http://dev.yoursite.com";

// step 1
var qs = require('querystring'),
    oauth = {
		callback : 'http://thisis.broken/callback/',
		consumer_key : consumerKey,
		consumer_secret : consumerSecret
	},
	url = siteUrl + '/oauth/initiate';

request.post({
	url : url,
	oauth : oauth
}, function (err, req, body) {
	// All we need from this is the returned oauth_token and oauth_token_secret
	console.log(body);
});
```

Just clone the [gist](https://gist.github.com/d726407f3d74b3115e0f4d18fc5bc15c.git), replace your key, secret, and url, and run it with
```
npm install request
node MagentoStep1.js
```

It should output something that looks like this
```
oauth_token=ff1469e90aa9b25868c8ed4865aa8ecb&oauth_token_secret=d11447b004681b063c86accae032cc4c&oauth_callback_confirmed=true
```
Save these, you will need them in the next steps.

**Step 2**
Next, we will skip to the browser.  This is the part that really really confused me.  Just browse to
```
http://dev.yoursite.com/admin/oauth_authorize?oauth_token=ff1469e90aa9b25868c8ed4865aa8ecb
```
Of course replacing yoursite.com with your actual site, and use the oauth_token that was returned in step 1.  This will bring up a screen that looks like this
![img/copyAllAsHAR.png]({{site.baseurl}}/images/magentorestapi1/step1.png)
Login using the admin user you setup when configuring the magento site, if you are already logged in you wont' see this screen.  You will just see the second screen, which looks like this.
![img/copyAllAsHAR.png]({{site.baseurl}}/images/magentorestapi1/step2.png)
Click the "Authorize" button, and it will try to redirect to the url in step 1, in this case, http://thisis.broken/callback. Since all we need is the result, we don't really care if it works.  It will look like this

![img/copyAllAsHAR.png]({{site.baseurl}}/images/magentorestapi1/step3.png)
All we are interested in is the oauth_verifier in the callback url, copy it straight from the browser address bar.  Hacky isn't it?

**Step 3**
The final step is another POST request to /oauth/token.  I wrote another [gist](https://gist.github.com/8c18a05b414b4851a794a796d1212c19.git) that you can clone.  You will need a stupid amount of tokens for this one.  You will need the consumer key and consumer secret from when you configured the Magento REST API.  You will need the oauth_token and oauth_token_secret from step 1.  Lastly, you will need the oauth_verifier from step 2.  Put it all together, and the script looks like this
```
var request = require('request');

var consumerKey = "57d84828608840c7dbaa637f2f66ee13",
    consumerSecret = "82fbea317ff08682cdd73d9eb242f0c7",
	  token= "ce50bf275b8face27b9f6c43c91f9058",
	  token_secret="13a59b2e7547b239d116b62b35142528",
	  verifier="399860495fab9eea64b69375fd5c5aca",
    siteUrl = "http://dev.yoursite.com";

// step 3
var qs = require('querystring'),
    oauth = {
		callback: 'http://mysite.com/callback/'
		, consumer_key: consumerKey
		, consumer_secret: consumerSecret
		, token: token
		, token_secret: token_secret
		, verifier: verifier
    }
  , url = siteUrl + '/oauth/token';

request.post({url:url, oauth:oauth}, function (err, req, body) {
  console.log(body);
});
```
Just replace all the values at the beginning, and run it like this
```
npm install request
node MagentoAuthStep3.js
```
If all goes well, you should get back a permanent token and secret that looks like this
```
oauth_token=5aac4eac990c14d0646c680375f4a724&oauth_token_secret=0256cbbdc7943206666e8bd7684d6da4
```
Keep this safe, back them up, don't loose these.  This process is horrible, and you probably don't want to go through it anymore times than I do!

Let me know if you have any suggestions to improve upon this in the comments.  It would be possible with a little work to automate step 2, parse out the html form, and auto post it.  I don't think it's worth the work at this point however as I won't be doing this very often.

Happy coding,
Joshua
