---
layout: post
title: "Disappearing Bash History"
subtitle: ...
---

Every now and then, a command would be missing from shell history on my Mac when I scrolled through using the up arrow.

For example:

```bash
$ > echo test
test
# press up arrrow
$ > echo test
# as expected, `echo test` shows

$ > touch test.txt
# file is created - now press up arrow to see this command again
$ > echo test
# ??? why is this not `touch test.txt`?
```

Two of the commands were consistently skipped in the bash history were `touch` and `time`.

I finally solved it by examining the `HISTIGNORE` environment variable:

```bash
$ > echo $HISTIGNORE
&:ls:[bf]g:exit:[ \t]*
```

`HISTIGNORE` contains [shell patterns](https://www.gnu.org/software/findutils/manual/html_node/find_html/Shell-Pattern-Matching.html) (not regular expressions), separated by colons, that are skipped in bash history.

So, `ls`, `bg`, `fg`, `exit`, and any commands that start with a space or a tab should be ignored in the bash history. But there's no indication that `touch`  or `time` should be skipped, so why are they missing?

Could it be that the tab character was being interpreted incorrectly?

```bash
$ > echo test
$ > touch test.txt
# press up arrow
$ > echo test
# confirmed that touch is ignored, now remove the \t from HISTIGNORE

$ > HISTIGNORE='&:ls:[bf]g:exit:[ ]*'
$ > touch test.txt
# press up arrow
$ > touch test.txt
# it worked!
```

That worked! So the tab character isn't interpreted correctly here, all commands that start with "t" are being ignored rather than all commands that start with a tab.

I ended up setting my `HISTIGNORE` to `&:[ ]*:exit`, so only `exit` and commands with a leading space are ignored.
