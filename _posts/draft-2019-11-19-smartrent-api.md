---
layout: post
title: "Reverse-engineering the Smartrent API"
subtitle: ...
published: false
---

Outline:

1. Introduction
- Apartment building introduced a smarthome app called Smartrent that controls the thermostat, among other devices
- App is a little slower than I like and only supports time-based triggers
- Can I control the thermostat outside the app?
- Goals:
    - Replicate the commands that the app can send to the thermostat (e.g., in cURL)
- Nice to haves:
    - Control the fan (the app has no way to do this)
    - Write an API wrapper in Python that manages authentication, setting request headers to impersonate the app
    - Set up a webserver with simple paths to toggle and set the AC, fan, etc for easy dev use

2. Theory
- Smartrent app leverages an API that controls the devices in my home
- The app uses my username and password to authenticate and make requests to read and write the device statuses
- If I can find out the API domain, the paths, the payloads, I can impersonate the app and open up new avenues to set my devices - use IFTTT, iPhone triggers, or other triggers
- Will have to be careful not to raise any flags with the requests I make

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