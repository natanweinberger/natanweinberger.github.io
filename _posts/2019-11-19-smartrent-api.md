---
layout: post
title: "Reverse-engineering the Smartrent API"
subtitle: ...
published: false
---

## Introduction

My apartment building uses a smarthome app called Smartrent that allows each resident to control the AC in their unit from the app. The app can be slow to load, so I want to explore the possibility of uncovering the API that it uses and circumventing the app.

The app has a few key features that I want to replicate:

  - Read the current temperature
  - Set the AC to cool or heat to a target temperature, or turn off
  - Schedule the AC to cool, heat, or turn off at times of day

It also has a few shortcomings that I want to explore working around:

  - I can't activate the fan that is built in to the unit
  - The cooling and heating triggers are limited to a set time-of-day schedule (how about through Siri or geofencing?)

## My hunch

Most apps are just user interfaces that rest on an underlying API. The Smartrent app is probably no different, allowing users to send commands to each device in the apartment through an API.

If I can find out what network requests the app makes to the API for each action available in the app, I'll be able to duplicate them and achieve the same functionality as the app.  The duplicated requests will have to match the app's requests exactly - if they don't, the apps developers might notice that they aren't generated from the app. Specifically, this means that the request headers and payload should match as closely as possible.

## Uncovering the API

So, step 1 is finding out which requests the app makes. I'll use [Charles](https://www.charlesproxy.com/) on my laptop to view the network traffic on my iPhone as I use the app. I'll click the buttons in the app to perform each action I want to replace, and note down the endpoint, headers, and payload that the app uses.

The first thing I'll do is log out and log back into the app, to see how authentication works. As I log in, I see the request and response in Charles.

<img src="/public/images/smartrent-charles-sessions.png" alt="Charles shows the HTTP request to /sessions" style="width: 100%;">

This tells us a few things:
- the API is hosted at `https://control.smartrent.com/api/v1`
- the `/sessions` endpoint allows you to obtain an authentication token
- the authentication token is a [JSON Web Token](https://jwt.io/)

Let's use that information to request a token outside of the app. We can use cURL to make the same request.

<img src="/public/images/smartrent-curl-sessions.png" alt="Using cURL to request a token at /sessions" style="width: 100%;">

It worked, we were able to authenticate to Smartrent and obtain a token outside of the app.

# Uncovering the endpoints

Having successfully replicated a request for a token, let's repeat the same process for other endpoints. I'll poke around the app and perform all the actions I want to replicate, then check Charles to see what the corresponding network requests were.

3. Uncovering the API
- Use Charles to spy on the requests that the app makes
- Gives me the API domain
- Each action that I take in the app exposes the endpoint, headers, and payload that I can replicate exactly
- Each endpoint starts with control.smartrent.com/api/v1
- Example endpoints:
    - GET /hubs
    - GET /hubs/XXX/devices
    - PATCH /hubs/XXX/devices
- Record all of these
- Also, log out and back into the app to see how tokens are obtained
- I make an interesing note: there's one call that hits control.smartrent.com/api/v2. Let's make a note of that and come back to it. Right now, I'm excited to see if I can get some minimal calls working.

4. Try it!
- I can see that POST /hubs/XXX/devices with a payload of {} will turn the AC mode to "cool"
- In the shell, I copy the endpoint, headers, and payload and execute it. It works!
- Change the mode back to "off" - also works!
- Mess around with the other calls, like changing the temp - they all work as well. Bare minimum goal achieved!
- I might stop here and build out an API wrapper, but I'm super curious about the v2 api - it might have even more functionality, so I'll see if I can figure it out before I invest in the v1 api wrapper.

5. v2 api
- This is a challenge - with the v1 api, the app exposed the exact HTTP requests that each action issued. There's no guidance on what the v2 api offers.
- Another thought - since the app isn't using api v2 for most things, will this raise any flags on their end? -shrug-
- Gotta start somewhere - try the same calls and see what happens? Hopefully they don't block my account :)
- Start with `GET /hubs/XXX/devices`: it works, response is pretty similar though there are some slight differences - instead of keys for each property of the device, it's a list of key-value pairs
- Notably, there's an entry for fan_mode! That's promising :)
- I'll try to change the fan_mode - two barriers though:
    - I suspect the old PATCH format probably doesn't work - in v1 it mirrored the dict, in v2 there is no dict
- PATCH request failed :(
- While I'm here, I'll manually toggle the fan on and off on the physical thermostat, then read the data from this endpoint to obtain the possible values
    - they are "auto_low" (off) and "on_low" (on)

6. How can I use the v2 api?
- If the v2 api was functionally identical to v1, I probably would call it here - there's not much point in spending time figuring out how to use the v2 api if it doesn't offer anything more, and the v1 api is effectively documented already since the app actions tell me what I need to know
- v2 controls the fan...let's see if there are any other scraps of info to be gathered
- when in doubt, back to Google?
- search for smartrent, eventually stumble onto control.smartrent.com/resident - a web interface with similar controls! does it use v2?
- It uses...websockets?
- Let's see an example payload record that gets sent to their server when I turn on the AC: ["1","3","devices:1","update_attributes",{"device_id":"1","attributes":[{"name":"mode","value":"cool"},{"name":"heating_setpoint","value":"73"},{"name":"cooling_setpoint","value":"76"}]}]
- Cool, that format with the attributes actually looks really similar to the v2 attributes listing! Maybe that's the format I need to send in the PATCH request?

```bash
curl -X PATCH https://control.smartrent.com/api/v2/hubs/1/devices/2
-H "accept: application/json"
-H "content-type: application/json"
-H "Authorization: Bearer $TOKEN"
-d '{"device_id":"250634","attributes":[{"name":"mode","value":"cool"},{"name":"heating_setpoint","value":"68"},{"name":"cooling_setpoint","value":"76"}]}' |
jq

{
  "errors": [
    {
      "code": "required",
      "description": "This value cannot be blank.",
      "field": "attributes.2.state"
    },
    {
      "code": "not_accepted",
      "description": "This property is not accepted; please remove it.",
      "field": "attributes.2.value"
    },
    {
      "code": "required",
      "description": "This value cannot be blank.",
      "field": "attributes.1.state"
    },
    {
      "code": "not_accepted",
      "description": "This property is not accepted; please remove it.",
      "field": "attributes.1.value"
    },
    {
      "code": "required",
      "description": "This value cannot be blank.",
      "field": "attributes.0.state"
    },
    {
      "code": "not_accepted",
      "description": "This property is not accepted; please remove it.",
      "field": "attributes.0.value"
    },
    {
      "code": "not_accepted",
      "description": "This property is not accepted; please remove it.",
      "field": "device_id"
    }
  ]
}
```
- Super promising! From this, I'm gathering:
    - dot notation is used to refer to fields in the payload
    - attributes.N refers to the N-th list item
    - In each one "value" is not accepted and "state" cannot be missing - I wonder if apiv2 just calls it "state" instead of "value", so I'll change those references of "value" to "state".
    - device_id is not accepted - sorta makes sense, device_id is already in the path and is redundant here. I'll get rid of it
- Let's retry the patch request to api v2 with these fixes...
- It works!
- One last thing - turn the fan on and off from the website to see what the allowed values of state

7. Wrapping up
- Goal achieved! Can control the AC, set the temp, and even control the fan
- Write a wrapper to access api in Python
- Write a simpler API in Flask and deploy to ZEIT Now
- Hook up to Apple Shortcuts:
    - Siri, turn on/off the fan
    - Siri, set the cooling temperature
        - 73