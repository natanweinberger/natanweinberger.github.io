---
layout: post
title: "Reverse-engineering the Smartrent API"
subtitle: ...
published: false
---

Apartment building recently added smart home capabilities which are maanged by a company called Smartrent. Their app allows control of thermo and door lock. A bit slow to load, so want to explore if there's way to get around the app.

The app likely just makes simple API calls under the hood. If I can figure out how their API works, I can make those calls myself and bypass the app entirely.

Where to begin?

1. Figure out what the app does
- What is happening in the background when I click the button to change the thermostat in the app?

The app is making network requests in the background, so how can I view the requests and responses?

[Charles](https://www.charlesproxy.com/documentation/welcome/) is perfect for this. It will set up a proxy to route my iPhone's network traffic through my laptop, then I can capture each network request that goes by and see exactly what the app is doing. I followed the excellent instructions for [using Charles from an iPhone](https://www.charlesproxy.com/documentation/faqs/using-charles-from-an-iphone/) and was quickly up and running.

1. Introduction
- What will this be about?
- What problem does it solve?
- What does the optimal outcome look like?
    - API client
    - Marshmallow schemas to document their API
    - A bookmarklet that sets my thermostat to 73

2. Theory
- What do I think the solution will look like?
    - My hunch is that Smartrent has an API that the the app uses. It makes GET and PATCH requests to retrieve and update info about the devices in my home.
- What tools will I use?

3. Starting out - what don't I know?
- The API base
    - Smartrent's has a website at smartrent.com, so an intuitive guess would be something like api.smartrent.com
- The endpoints available
- The headers I'll need to include
- How authentication works - presumably will need to send a token with each request

4. Discovering the API
- The app makes network requests, so if I can see those requests, I can make them myself
- Don't need to decompile the app, just find a way to watch the network requests go by
- Charles does just this - connect to laptop via HTTPS proxy and observe the network traffic
- We're going to need to authenticate, so start with that - log in
- It's a post request with headers and data

5. Try them out in cURL
- It works!

6. Start modeling the Python wrapper
- post function
- try it out - it works!

7. Let's see some of the other endpoints
- rooms
- devices
- hub
