---
layout: post
title: Mock, MagicMock, speccing and more
subtitle: ...
---

## Introduction

The first time I really looked into unit testing, I was overwhelmed by the multitude of tools, gadgets, and techniques that come along with it. On the whole, it's easy to see why it's a good idea - but where do you start?

Forget mocks, fixtures, and parametrization for now - let's start at the basics and answer:

- Why should I unit test?
- How do I unit test?
- What should I unit test?
- When should I unit test?
- Where should I unit test?

## Why should I unit test?


> "Why should I write unit tests? My code isn't complicated and hasn't failed yet."


It's just a matter of time until it does. At some point, you _will_ encounter a bug that you didn't expect, and the first time you see it will be due to a failed unit test.

I've found calls where I ran


```python
    for item in dict:
        ...
```

instead of

```python
    for item in dict.values():
        ...
```