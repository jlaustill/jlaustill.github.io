---
layout: post
title: Why I chose MongoDB
tags: MongoDB NoSQL
date: '2016-03-02 14:58:25 -0600'
categories: MongoDB
published: true
comments: true
share: true
---
My journey to MongoDB starts a long time ago, probably back in 2005.  When I graduated college, I was offered a job as an MSSQL developer.  I had never used a database before, and they hired me based upon my aptitude for development, which was shocking because I had only done it as a hobby up until that point.  This first company I worked for wrote Pharmacy software, and we really struggled with performance, but we always managed to make it work.

At my next company, I worked at a bank for 8 years.  We had data approaching a billion rows, but never quite.  Performance was always an issue for us there, and it was made even harder by a hardware team that constantly tried to make due with sub-par hardware specs.  Then about a year ago I took a job at a 3rd party health-care administrator.  This was eye-opening for me, as it was the first time I ran into people that thought 250M rows of data was a "lot."  We had roughly 1 million subscribers, and trying to report and analyse 7 years of claims came out to roughly 250M.  I remember having a discussion that went something like this "What are you thinking?  SQL Server can't handle that much data!!!"

This was when I started looking into NoSQL solutions.  I was just bored with the fight over more resources for performance after a decade.  I signed up for the MongoDB developer class after reviewing Gartners quadrant on big data.  I actually started with Hadoop and was just shocked at how complicated it seemed.  Then I downloaded MongoDB, followed the first tutorial, and in one night I was like "it can't be this easy..."  After the 7 week class, I was convinced, big data really COULD be THIS easy.

Flash forward another few months and I took a job at a retailer, where I am currently employed.  My new boss asked me one day shortly after starting, "How would you feel about using MongoDB?"  I just said let's do it!  Irony is that I am not using it for anything big data related(yet), but for the data store for our Intranet.  All of our Intranet is 100% based on MongoDB.  And it works BEAUTIFULLY.  I have implemented a real-time chat that looks and acts pretty much like facebook chat, a forum/blog posting setup, and a dual security system with MongoDB as the datastore.  It's probably the smallest data setup MongoDB has been used for yet, less than a gigabyte of data once dumped.

So now that I'm committed to it, I've only run into 2 pain points, which I may blog about in the future, but not today.  But the pain points of SSIS, MSSQL, and schema changes is a thing of the past!  I love that I can push out a new field, and all I have to do it give it a default so old documents are updated the next time they are modified.  I love that I am running on VM's with 1 VCPU and 4gb of ram, and my response times are milliseconds.  I love that I spend my time developing instead of doing database design, change scripts, versioning, and complicated data-motioning.  The agility MongoDB gives me is absolutely awesome.

So there you have it, my story doesn't contain any fancy POC's, big decision matrixes, or even arguments.  It was simply hey I CAN do this, SWEET!!!
