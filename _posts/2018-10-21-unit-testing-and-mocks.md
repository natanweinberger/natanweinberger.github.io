---
layout: post
title: Unit testing and mocks
subtitle: ...
comments: true
published: false
---

I put off learning about unit tests for years. I'd search for it, but the top results tended to be a mixed bag of testing techniques geared towards readers with various degrees of understanding. 

Mocks, autospeccing, patching, and fixtures were overwhelming. Some unit tests were embedded in classes, others were just plain functions. Some had fake database setup and teardown. I couldn't tell which of these things were integral to unit tests and which were just helpful tools that I could punt on till later on. It was hard to find a clear answer to what I really wanted to know: where do I start?

Here's what I wish I knew.

The simplest unit test is a plain function that tests a boolean statement.
{: .center .standout-text}

That's it. A unit test is a function that makes an _assertion_ and evaluates if it is true. It uses the keyword `assert` to do this (most of the time).

Let's write a simple unit test for the built-in `max` function:
```python
def test_max():
    assert max([1, 2, 3]) == 3
```

Granted, we should probably try a few more scenarios and ensure that it handles errors gracefully, but this is a fine start!

Let's run this test. Save that function in a file called `sample_tests.py`.

We'll use `pytest` to run our tests. [It's a solid alternative to Python's built-in `unittest`](https://docs.python-guide.org/writing/tests/#tools).

From the command prompt, we'll run `pytest` with verbose mode on:
<pre class='code-bash'>
$ pytest sample_tests.py -v
...
collected 1 item

sample_tests.py::test_max <span class='tests-pass'>PASSED</span>
<span class='tests-pass'>=== 1 passed in 0.00 seconds ===</span>
</pre>

So, this test passed. The unit test `test_max` was called, which evaluated that the statement `max([1, 2, 3]) == 3` was True.

You can also have multiple assertions in a unit test. Below, we test a function that removes any consecutive repeating characters
```python
def test_remove_repeated_characters():
    assert remove_repeated_characters('aaaabbcccdd') == 'abcd'
    assert remove_repeated_characters('teeesst') == 'test'
```

The unit test is the whole test function. If any single assertion fails within this unit test, the unit test fails.

What about for more complex functions?
<span data-toggle="tooltip" data-placement="top" title="" data-original-title="192 words">1 min read</span>

---
{: .ellipse}

One of the first unit tests I'd seen was for a utility function that tested truthiness. It took in a value that could be of any type, and the logic of the function dictated whether or not the value was truthy.

The unit test comprises several realistic cases:
```python
def test_is_truthy():
    assert is_truthy('true')
    assert not is_truthy('false')
    assert not is_truthy([None, None])
```

And this works. It's a valid test. But when are you done? Writing tests for five cases, ten cases? Should you just write as many cases as you can?

Maybe. Probably not. An _aha!_ moment for me:

You know after you write a function, sometimes you go into the REPL and call your function with some argument to make sure it works? Or perhaps write some print statements in the middle for the purposes of debugging? That's what unit testing replaces. Unit testing is not a chore - it's the same debugging and testing you normally do, but in a far more structured and automated way.

If you wouldn't be concerned about trying something manually or you wouldn't print out any debugging statements, odds are that you don't need a unit test for it. Write enough assertions to be confident that your function does what you think it does. That's the heart of unit testing.

---
{: .ellipse}

Now the concept of unit testing is a bit clearer. It clearly has a useful role and can frequently replace some tedious manual testing and debugging that we're already doing. What else can we do?

## Mocks

Mocks confused the hell out of me. I originally thought they were these special objects with a bunch of unique properties, so I'd have to do a ton of research to figure out to use them. I wish someone had told me to stop trying so hard to wrap my head around it, because it's truthfully so simple:

**Mocks are dumb, placeholder objects that collect info on how they are called.**
{: .center .standout-text}

They do practically nothing. They exist only to absorb calls to other, real functions, and they keep a record of the arguments they are called with.

## Basics

Let's write an example. We'll start with some basic functions that we want to unit test, and see how mocks can help us. We'll have two functions, `add` and `multiply`, where `multiply` naively calls `add` in a loop to generate the product.

In a file called `sandbox.py`, let's define both functions:

```python
def add(a, b):
    return a + b


def multiply(a, b):
    ret = 0
    while b > 0:
        ret = add(ret, a)
        b -= 1

    return ret
```

We want to test both of these functions. Let's create a new file in the same directory and call it `sandbox_tests.py`.

The directory structure now looks like this:
```
- sandbox.py
- sandbox_tests.py
```

In `sandbox_tests.py`, we can write a unit test for `add` that simply verifies some test cases:

```python
from sandbox import add, multiply


def test_add():
    assert add(1, 2) == 3
    assert add(5, 5) == 10
```

From the command line, running `pytest sandbox_tests.py` will inform you that the test passes:

<pre class='code-bash'>
$ pytest sandbox_tests.py
...
<strong>collected 1 item</strong>

sandbox_tests.py .
<span class='tests-pass'>=== 1 passed in 0.01 seconds ===</span>
</pre>

Now, we want to verify that the multiply function works.

We could naively test it like we did with `add`:

```python
def test_multiply():
    assert multiply(2, 3) == 6
```

And in fact, if you again run `pytest sandbox_tests.py`, you'll find that both tests pass:

<pre class='code-bash'>
$ pytest sandbox_tests.py
...
<strong>collected 2 items</strong>

sandbox_tests.py ..
<span class='tests-pass'>=== 2 passed in 0.02 seconds ===</span>
</pre>

## What should unit tests really be testing?

But hang on a minute - what if a bug is introducted in the `add` function?

Let's intentionally break the `add` function:

```python
def add(a, b):
    return a + b + 1
```

<pre class='code-bash'>
$ pytest sandbox_tests.py -v
<strong>collected 2 items</strong>

sandbox_tests.py::test_add <span class='tests-fail'>FAILED</span>
sandbox_tests.py::test_multiply <span class='tests-fail'>FAILED</span>
</pre>

Uh-oh. We expected `test_add` to fail, but it looks like `test_multiply` did too. We didn't change anything in `multiply`, and we know that as soon as `add` is fixed, `test_multiply` will pass again without any issues.

Is this really the behavior we want?

Ideally, only `test_add` should be failing, making it clear that the bug exists in the `add` function and that our `multiply` function is still fine. However, because we wrote the test for `multiply` naively, we've found that both our tests for `add` and for `multiply` broke.

We've set up a test that may be useful, but more likely suited as an integration test - observing and testing the system as a whole.

So when we're writing a test for `multiply`, let's trust that `add` works - after all, its tests pass. If `add` doesn't work, we'll know because `test_add` will break.

What we really want `test_multiply` to do is ensure is that our naive algorithm _does what we expect it to_. **Read that again** - we're not verifying the result, we're verifying that it literally does the actions it is intended to. At its core, that means that we are testing that the developer's code is doing what they intend it to do. We aren't going to verify that other function calls are working correctly - we trust their own unit tests to take care of that. We know `multiply` needs to call `add` `b` times. We know `add` needs to have two specific arguments passed in. We know `multiply` is supposed to return a numeric value. We can check all of these things with mocks!

What does that look like?

Well, here's what we know:
- `multiply` takes in two arguments, `a` and `b`
- It initializes a local variable `ret` to 0
- It adds `a` to `ret` `b` times using our function `add`
- We trust that `add` works properly

So what can we verify? Anything that a developer is responsible for.
- `add` was called the right number of times
- `add` had the correct arguments passed to it
- The `multiply` function returns a numeric value

If all of those actions are called, we will get the right result because all of those actions are themselves tested. The `multiply` function calls `add` a given number of times, with particular arguments. So our test is simple - let's ensure that `add` was indeed called the right number of times, and with the arguments we expect.


This where mocks come in.


If the add function works as it should, then the multiply function will work. The goal of unit testing in this fashion is to ensure that the multiply function executes the code it is designed to execute - not that the implementation is correct.

Writing unit tests naturally makes your code better - you are forced to write more modular, testable functions. Future developers will appreciate not just the tests, but the improved structure and readability that follows.
