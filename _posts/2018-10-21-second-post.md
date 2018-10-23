---
layout: post
title: Second post
tags: [python, clean code]
---

**A second post**

One thing I think is important is to always write clean code.

```python
def badFunction():
    ''' Not a real docstring '''
    pass
```

There are a number of things wrong with this code:

* The function name is camelCase
* The docstring sucks

How can we improve this code?

```python
def good_function():
    ''' Does nothing. '''
    pass
```