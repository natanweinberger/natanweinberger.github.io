---
layout: post
title: "Creating intuitive tools"
subtitle: ...
---

During my first couple years working in a software team, I placed a great deal of value in logic and flexibility in systems.

The most prominent example of this trait was a database schema I designed. It was intended to store a variety of event types, sequenced by a incrementing key. There would be times when analysts would want to query for all events, and other times where they would want only certain types. No problem - I'll store all the events in one table, and add flags for each type so that analysts can filter out what they don't want.

One day, I was explaining to a contractor how the flags worked and how they should properly be accessing the database. I showed them the documentation, listed the pitfalls

The biggest takeaway for me was this: if you don't want people to get tripped up, don't create pitfalls.

Importantly, the blame is not on the analysts. The system should generally work for them and minimize the cognitive load for accessing it.

In my case, I redesigned the database. My guiding principle was that each table should answer a question. If there was a question that couldn't be easily answered without query gymnastics, that was a sign that we should consider creating a new table to answer it.
<!-- 
Intro

A few years ago, I launched a signficant refactor team's database for analysts to use. I walked them through how it was structured, explained why I made some decisions that weren't obvious, and cautioned them about potential pitfalls.

I was fairly happy with how it worked out. People learned how the system worked, and though they made querying mistakes here and there, I could always get them back on the right path with a quick DM.

I was never thrilled with the structure, but I chalked it up to the inherent complexity in such a large database. The occasional mistakes that our skilled analysts were making were unavoidable, and we'd all have to live to learn with that.

That should have been a red flag.

--

Months later, we brought a contractor on board. I set up a quick video call to walk him through the database structure. We were planning for them to do significant work for us, but they were far less versed in the types of data we had available than our own analysts were.


While building out data infrastructure, my goals were clear: I wanted a system that is quick to learn, intuitive to use, and easy to interact with.

No system will do these things perfectly, but any system should be able to do them well enough.

How did I become aware of the problem?
I gave my colleagues a tour of the system when it went into production. They all vaguely knew what data would be available 

What did I realize?

What should I have done?

Background and links - Documentation Driven Development. Take it a step further - explain how to use this structure. Are you embarrassed or tripping over yourself to explain the proper way to use it? Rethink it.
https://gist.github.com/zsup/9434452

Awhile back, I welcomed a contractor onto our team and took them on a brief tour of our database. Our database, which I had iterated on to keep the structure logical and elegant, should have been a cinch to show off and get them started with right away. But I found myself struggling to keep track of caveats here and there.
 -->