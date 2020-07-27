---
layout: post
title: "Git Workflow"
subtitle: What works for me
---

# Git

I've started writing all my commit messages for my future self. In fact, this entire blog is for my future self. In six months, I'll inevitably go back to look at a piece of code I've written and I'll look for context as to why I did it that way. Having the git log written for that purpose saves hours.


My overarching philosophy is that commits and pull requests are best when written for others and for your future self. The odds of being a solo developer on a project forever are slim. You can save future collaborators and maintainers a huge deal of pain by writing clean, clear commit messages that accurately summarize the changes in each unit of committed code. Inevitably, they'll go back at some point to find out when and why a piece of code was written and they'll thank you for it.

Good employers value this. Not only is your code inherently more maintainable by being well-documented in version control at at minimum, having the wherewithal to pause and think about the implications for other developers is a highly attractive trait.

# Commits

Any good Git-related post should mention Chris Beams' excellent [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/). It's the gold standard for writing responsible commit messages, and is one of the best-written and convincing guides I've been fortunate enough to come across. Read it.

Many workflow practices are based on an organizational approach or opinion. I know many people say there's no one right way to do things. But when it comes to writing commit messages, I think there are a few things where there really is a right way.

- Write commit messages in the imperative tense: "Fix "

Commits should be atomic. You should never be able to rollback to a broken state. Not only is it hard to understand what's not working within code you wrote, imagine the bewilderment of colleagues!

You can optionally squash commits


# Remotes


Intro

There are two types of git use: solo and on a team. The difference between 1 and 2 devs is the biggest incremental difference you'll ever have when it comes to collaboration. Adding a new dev means you need to think critically about committing to the master branch. As you scale there are more considerations to make, but the jump from 1 to 2 introduces more complexity than any other addition.

I develop on the master branch locally. It's simple and straightforward. This doesn't mean I don't branch. I branch all the time to try out an alternate implementation to see how it performs, or to skip ahead and do some work that will be needed down the line if it helps me build a clearer picture of how to build the foundation.

Working in a team