---
layout: post
title: "Multiprocessing in Python"
subtitle: ...
---

# 

Check if you're opening Pools in a loop. I had a function that opened a Pool with four worker processes and then returned the data, no loops involved. But, I was calling that function in a loop for each date in a range. Because the pools weren't being closed in the first function, the system eventually ran out of resources.

For example, the traceback might look like this:

```python
Traceback (most recent call last):
  File "mymodule/myscript.py", line 152, in <module>
    myfunction(args)
  File "mymodule/myscript.py", line 137, in mywrapper
    pool = ThreadPool(4)
  File "/usr/local/Cellar/python/2.7.14/Frameworks/Python.framework/Versions/2.7/lib/python2.7/multiprocessing/__init__.py", line 232, in Pool
    return Pool(processes, initializer, initargs, maxtasksperchild)
  File "/usr/local/Cellar/python/2.7.14/Frameworks/Python.framework/Versions/2.7/lib/python2.7/multiprocessing/pool.py", line 161, in __init__
    self._repopulate_pool()
  File "/usr/local/Cellar/python/2.7.14/Frameworks/Python.framework/Versions/2.7/lib/python2.7/multiprocessing/pool.py", line 225, in _repopulate_pool
    w.start()
  File "/usr/local/Cellar/python/2.7.14/Frameworks/Python.framework/Versions/2.7/lib/python2.7/multiprocessing/process.py", line 130, in start
    self._popen = Popen(self)
  File "/usr/local/Cellar/python/2.7.14/Frameworks/Python.framework/Versions/2.7/lib/python2.7/multiprocessing/forking.py", line 121, in __init__
    self.pid = os.fork()
OSError: [Errno 35] Resource temporarily unavailable
```