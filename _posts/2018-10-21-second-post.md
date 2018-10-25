---
layout: post
title: Second post
tags: [python, clean code]
---

**A second post**

```python
def badFunction():
    ''' Not a real docstring '''
    pass
```

There are a number of things wrong with this code:

* The function name is camelCase
* The docstring sucks

```python
def good_function():
    ''' Does nothing. '''
    pass
```