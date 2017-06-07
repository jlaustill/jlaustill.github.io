---
layout: post
title: JSON Update Support in PostgreSQL vs MongoDB
tags: MongoDB PostgreSQL JSON NoSQL
date: '2017-06-05 19:14:25 -0600'
categories: Databases
published: true
comments: true
share: true
---

## Introduction
I came across a post on [Quora][4] the other day where someone was asking about whether to use [PostgreSQL][6] or [MongoDB][7] and why.  I have had great experiences with both databases, so it caught my interest.  I was, however, surprised at the extent to which generalities were thrown around and no details were given.  I saw two themes repeating themselves over and over again.

* MongoDB isn't really schemaless, all data has a schema
* PostgreSQL has had native JSON support for years

Both of these statements are overly general at best and misleading at worst.  So, I decided to concoct a very simple JSON challenge and then try to solve it in both.  I went out of my way to find an example that would serve as a good reference for why both of these statements above should be taken with a grain of salt.

My experiences with PostgreSQL are mainly in the form of an IBM Netezza Appliance used for data warehousing.  That experience was like a breath of fresh air after trying to do the same thing in MSSQL.  I have nothing but good things to say about PostgreSQL and its use in analytics.  If you are starting a new DW project, I'd recommend checking out [PostgreSQL-XL.][5]  However, last time I checked it out for use as a document storage database I was left wanting.  That was a few versions ago, so it's time to review the newest version and compare it with the newest version of MongoDB.  

This post will concern itself strictly with MongoDB 3.4 and PostgreSQL 9.6.  The challenge will be simple, and we will see how they stack up to each other with specific regard to updating JSON.  There are plenty of posts out there about how to query JSON data with PostgreSQL and plenty about indexes as well.  So, I will concentrate purely on updating in this post.

## The challenge
The challenge I came up with is this: given a collection of documents, update one.  That's pretty much it.  The update will be to a sub-document stored in an array, a very common pattern when working with documents.  The documents will be stored in a table or collection called test and look like this:

```javascript
{
    "name" : "John Doe",
    "phones" : [
        {
            "type" : "mobile",
            "number" : "555-555-0000",
            "deleted": false
        },
        {
            "type" : "home",
            "number" : "555-555-0001",
            "needsUpdated": true
        },
        {
            "type" : "work",
            "number" : "555-555-0002"
        }
    ]
},
{
    "name" : "Jane Dane",
    "phones" : [
        {
            "type" : "mobile",
            "number" : "555-555-0030",
            "needsUpdated": true
        },
        {
            "type" : "home",
            "number" : "555-555-0020"
        },
        {
            "type" : "work",
            "number" : "555-555-0010"
        }
    ]
}
```
The update is to find the document for the person named John Doe and update his mobile number to 555-555-0003.  This must be done without data loss and in an [ACID][8] compliant fashion.  

## PostgreSQL
PostgreSQL is up first.  First things first, we can't use a database that doesn't exist.

```sql
postgres=# \connect test;
FATAL:  database "test" does not exist
Previous connection kept
postgres=#
```

So, first, we will create it and connect to it.
```sql
postgres=# create database test;
CREATE DATABASE
postgres=# \connect test;
You are now connected to database "test" as user "postgres".
test=#
```
Next, PostgreSQL is not schemaless.  You MUST define your schema before you can insert data into it.  

```sql
test=# insert into t_json (c_json) values ('{"name":"John Doe","phones": [{"type":"mobile","number":"555-555-0000", "deleted": false},{"type":"home","number":"555-555-0001", "needsUpdated": true},{"type": "work","number": "555-555-0002"}]}');
ERROR:  relation "t_json" does not exist
LINE 1: insert into t_json (c_json) values ('{"name":"John Doe","pho...
                    ^
test=#
```
So, we will create a simple table called t_json, with one column, c_json.  Creative right?

```sql
create table t_json (c_json json not null);
CREATE TABLE
test=#
```

At this point, we can insert our sample documents.  Awesome!

```sql
test=# insert into t_json (c_json) values ('{"name":"John Doe","phones": [{"type":"mobile","number":"555-555-0000", "deleted": false},{"type":"home","number":"555-555-0001", "needsUpdated": true},{"type": "work","number": "555-555-0002"}]}');
INSERT 0 1
test=# insert into t_json (c_json) values ('{"name":"Jane Dane","phones": [{"type":"mobile","number":"555-555-0030", "needsUpdated": true},{"type":"home","number":"555-555-0020"},{"type": "work","number": "555-555-0010"}]}');
INSERT 0 1
test=#
```

Next, we will verify that our data looks as intended.
```sql
test=# select * from t_json;
                                                                                               c_json                                                             

------------------------------------------------------------------------------------------------------------------------------------------------------------------
-----------------------------------
 {"name":"John Doe","phones": [{"type":"mobile","number":"555-555-0000", "deleted": false},{"type":"home","number":"555-555-0001", "needsUpdated": true},{"type":
"work","number": "555-555-0002"}]}
 {"name":"Jane Dane","phones": [{"type":"mobile","number":"555-555-0030", "needsUpdated": true},{"type":"home","number":"555-555-0020"},{"type": "work","number":
"555-555-0010"}]}
(2 rows)

test=#
```

We are now set up for our challenge, all we need to do is write a query to update John Doe's mobile number and we are done.  I dug into the PostgreSQL docs [here.][1] First things first, they have a way to select the document we want using a ->> selector.  It looks like you need a different selector -> to select an object by name.  But since our name field is text, we use the ->> selector.

```sql
test=# select c_json from t_json where c_json->>'name' = 'John Doe';
                                                                                               c_json                                                             

------------------------------------------------------------------------------------------------------------------------------------------------------------------
-----------------------------------
 {"name":"John Doe","phones": [{"type":"mobile","number":"555-555-0000", "deleted": false},{"type":"home","number":"555-555-0001", "needsUpdated": true},{"type":
"work","number": "555-555-0002"}]}
(1 row)

test=#
```
And we get back the proper document!  Now we need to select the sub-document in the phones array that has the type of mobile.  This is where I got stuck.  So I took my challenge to [Stack Overflow][2] like you would expect.  The documentation doesn't seem to have examples of how to update JSON, but one nice experienced person showed up with this query.

```sql
test=# UPDATE t_json SET c_json = newvalue FROM (
test(#     SELECT to_json(updated) AS newvalue FROM (
test(#         SELECT c_json ->> 'name' as "name",
test(#             json_agg(json_build_object('type', phones.type, 'number',
test(#                 CASE phones.type WHEN 'mobile' THEN '555-555-0003' ELSE phones.number END)
test(#             ) AS phones
test(#     FROM t_json
test(#     CROSS JOIN json_to_recordset(c_json -> 'phones')
test(#         AS phones("type" TEXT, "number" TEXT)
test(#     WHERE c_json->>'name' = 'John Doe'
test(#     GROUP BY name
test(#     ) as updated
test(# ) AS sub WHERE c_json ->> 'name' = 'John Doe';
UPDATE 1
test=#
```
So it updates t_json and sets c_json to a new object.  This new object is built using a mix of a to_json, selecting the name and building a new json_agg, which uses a json_build_object where you have to define the sub-document.  This is then cross joined to a json_to_recordset, and grouped by name.  WOW, this is intense.  I give many kudo's to this person, quite the answer!  So what does this give us?

```sql
test=# select c_json from t_json where c_json->>'name' = 'John Doe';
                                                                                  c_json                                                                          

------------------------------------------------------------------------------------------------------------------------------------------------------------------
---------
 {"name":"John Doe","phones":[{"type" : "mobile", "number" : "555-555-0003"}, {"type" : "home", "number" : "555-555-0001"}, {"type" : "work", "number" : "555-555-
0002"}]}
(1 row)

test=#
```
Wait!  What happened to my deleted and needsUpdated fields?  Well, in order to do an update like this your JSON needs to have a schema!  It doesn't appear that PostgreSQL gives you a way to reach inside that array and update the mobile number.  You have to replace the entire document with the one you build up.  This speaks to one of my two main bullet points.  Yes, PostgreSQL has native JSON support.  But not very good support in this case.

One of our challenge requirements was also ACID compliance.  Since this update loses data, it doesn't meet the consistency goal.  In order to be consistent, we must leave the database in a valid state.  Losing our deleted and needsUpdated fields leaves our database in a non-valid state.

So what are our options?  We could retrieve the object in code, parse it into an object, change the number and then save it back.  But this wouldn't be ACID compliant, what if that document was updated between the time you pulled it and the time you saved it?  This again breaks the consistency requirement.  In this challenge, PostgreSQL fails as far as I can tell.  If I'm missing something leave me a comment and I'll be happy to update this post.

## MongoDB
Now it is MongoDB's turn.  This is where we return to the concept of being schemaless.  So the first thing we'll do is list our databases and make sure one named test doesn't already exist.

```javascript
> show dbs;
admin  0.000GB
local  0.000GB
>
```
As you can see, this is a brand new install, nothing.  So let's switch to the test database.
```javascript
> use test;
switched to db test
> show dbs;
admin  0.000GB
local  0.000GB
>
```
How can you switch to a database that doesn't exist?  Simple, because MongoDB is schemaless.  It does not require you to define your schema before you can use it.  Let's look at our collections in the test database.
```javascript
> show collections;
>
```
Nothing.  This doesn't mean we can't use it, it just means nothing has been saved here yet.  So let's insert our test data.
```javascript
> db.people.insert({"name":"John Doe","phones": [{"type":"mobile","number":"555-555-0000", "deleted": false},{"type":"home","number":"555-555-0001", "needsUpdated": true},{"type": "work","number": "555-555-0002"}]});
WriteResult({ "nInserted" : 1 })
> db.people.insert({"name":"Jane Dane","phones": [{"type":"mobile","number":"555-555-0030", "needsUpdated": true},{"type":"home","number":"555-555-0020"},{"type": "work","number": "555-555-0010"}]});
WriteResult({ "nInserted" : 1 })
> db.people.find();
{ "_id" : ObjectId("59321e31bd7153e9ec51795e"), "name" : "John Doe", "phones" : [ { "type" : "mobile", "number" : "555-555-0000", "deleted" : false }, { "type" : "home", "number" : "555-555-0001", "needsUpdated" : true }, { "type" : "work", "number" : "555-555-0002" } ] }
{ "_id" : ObjectId("59321e4fbd7153e9ec51795f"), "name" : "Jane Dane", "phones" : [ { "type" : "mobile", "number" : "555-555-0030", "needsUpdated" : true }, { "type" : "home", "number" : "555-555-0020" }, { "type" : "work", "number" : "555-555-0010" } ] }
>
```
It lets us insert even though the database and collection weren't defined.  This is half of the essense of being schemaless, but as we'll see in a moment, it's not the most exciting part.  The first part of updating our document is to find it, we do that by giving the find command a key:value pair for name John Doe.
```javascript
> db.people.find({"name":"John Doe"}).pretty();
{
    "_id" : ObjectId("59321e31bd7153e9ec51795e"),
    "name" : "John Doe",
    "phones" : [
        {
            "type" : "mobile",
            "number" : "555-555-0000",
            "deleted" : false
        },
        {
            "type" : "home",
            "number" : "555-555-0001",
            "needsUpdated" : true
        },
        {
            "type" : "work",
            "number" : "555-555-0002"
        }
    ]
}
>
```
I also added .pretty() so the output is formatted as expected. Now how do we select that sub-document?  Easy, we use javascript dot notation and ask for phones.type = mobile.
```javascript
> db.people.find({"name":"John Doe", "phones.type": "mobile"}).pretty();
{
    "_id" : ObjectId("59321e31bd7153e9ec51795e"),
    "name" : "John Doe",
    "phones" : [
        {
            "type" : "mobile",
            "number" : "555-555-0000",
            "deleted" : false
        },
        {
            "type" : "home",
            "number" : "555-555-0001",
            "needsUpdated" : true
        },
        {
            "type" : "work",
            "number" : "555-555-0002"
        }
    ]
}
>
```
But that doesn't look any different?  True, but it does add for us a reference to the sub-document that we can update using the positional $ operator.  If we look at the [MongoDB Documentation][3] we see that we can use the $set operator, combined with the positional $ operator to set the mobile number to the new value.  When you put the two together it looks like this.

```javascript
> db.people.update(
  {"name":"John Doe", "phones.type": "mobile"},
  {$set: {"phones.$.number": "555-555-0003"}}
);
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
> db.people.find({"name":"John Doe", "phones.type": "mobile"}).pretty();
{
    "_id" : ObjectId("59321e31bd7153e9ec51795e"),
    "name" : "John Doe",
    "phones" : [
        {
            "type" : "mobile",
            "number" : "555-555-0003",
            "deleted" : false
        },
        {
            "type" : "home",
            "number" : "555-555-0001",
            "needsUpdated" : true
        },
        {
            "type" : "work",
            "number" : "555-555-0002"
        }
    ]
}
>
```
There we go, John Doe's mobile number is updated to 555-555-0003.  Also, no data was lost, the deleted and needsUpdated data is still there.  This is the real meaning behind schemaless.  Your data not only doesn't have to define a schema, but you can interact with only part of the object and the rest of the object stays intact.  This ensures consistent data in a valid state because MongoDB assumes you will only care about the part of the object you are updating or selecting, etc.  

Lastly, MongoDB is ACID compliant at the document level.  Since this update affects only this document we are safe.  Many people that haven't worked with document stores a lot don't understand this concept and still think in terms of tables and joins.  This makes it hard to understand how a database that is only atomic at the document level can work.  This very simple example demonstrates one-way data is modeled in documents that would be multiple tables in an RDBMS.  You would need a person table and a phones table with a foreign key back to the person table.  In that case being ACID would require a transaction to update the person table and phones table.  In MongoDB, since they are in the same document we don't have that requirement.

## Conclusion
After this look at doing a very simple JSON update in PostgreSQL and MongoDB, I think it's pretty clear that working with JSON is much more robust and straight forward in MongoDB.  That doesn't take away from PostgreSQL as an RDBMS however.  And I would encourage you to check it out when it is the right tool for the job at hand.

This was a very simple challenge that barely scratched the surface of what you can do with MongoDB, and also illustrates that native JSON support doesn't mean much in and of itself.  It clearly showed what is meant by schemaless, which has nothing to do with whether your data has a schema (of course it does!).

Happy coding!
Joshua

[1]: https://www.postgresql.org/docs/current/static/functions-json.html
[2]: https://stackoverflow.com/questions/44297400/how-do-i-select-and-update-a-json-array-element-in-postgresql/44300451?noredirect=1#comment75665645_44300451
[3]: https://docs.mongodb.com/manual/reference/operator/update/positional/
[4]: https://www.quora.com/When-should-I-use-MongoDB-instead-of-PostgreSQL-in-web-projects
[5]: http://www.postgres-xl.org/
[6]: https://www.postgresql.org/
[7]: https://www.mongodb.com/
[8]: https://en.wikipedia.org/wiki/ACID
