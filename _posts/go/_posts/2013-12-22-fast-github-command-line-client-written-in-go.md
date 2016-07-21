---
title: Fast GitHub Command Line Client Written in Go
categories: go
---

About [nine months ago](https://github.com/jingweno/gh/commit/d5615fcb6f9c983fbf5d1297700a26531ddf1173), I started [gh](https://github.com/jingweno/gh),
a fast command line wrapper around git with extra features and commands that make working with GitHub easier.
Today, I'm very glad to announce its [1.0.0](https://github.com/jingweno/gh/releases/tag/v1.0.0) release has landed!

## What is gh?

`gh` is a command line client to GitHub.
It's designed to run as fast as possible with easy installation across operating systems.
Here is a typical workflow of contributing to OSS on GitHub by cloning a repository, forking it and making a pull request with `gh`:

```
$ gh clone rails/rails
$ gh fork

# make some changes

$ gh pull-request -m "Implemented feature X" -b rails:master -h jingweno:feature
```

## Hub in Go

The Ruby [hub](https://github.com/github/hub) has been one of my long-time favorite tools in my toolbox.
It has been an indispensable part of my open source journey.
The brains of `hub`, [@defunkt](https://github.com/defunkt) and [@mislav](https://github.com/mislav), are also top on my programming heroes list.
My passion for `hub` kept me thinking what I could do to help make one of my favorite tools better.
I ended up building `gh`, by referring to the implementation of the Ruby `hub`, but in Go.

## Native vs. VM

It's pretty exciting that VM technology is getting more and more mature and code runs faster and faster on a VM.
However, for a command line tool whose running cycle is usually short, there's no need for a VM:
the command line program exits before the [JIT compiler](http://en.wikipedia.org/wiki/Just-in-time_compilation) can kick in.
Besides, a command line tool built with a VM-based language means an extra piece of software (the VM itself) needs to be installed in order to run it.
A command line program doesn't gain much advantage from a VM but bear the cost of it.
Therefore, implementing a command line tool in a native language is not only of great benefit to performance, but also to the ease of distribution.
The Go programming language, with its runtime, systems access, and its capability of compiling to a single, statically linked binary with no
dependencies, is a very appealing platform for building command line tools. Let's take a look what `gh` offers with the power of Go :-).

## Faster

For **equivalent functionalities**, `gh` performs in general 5 to 10 times better than `hub`.
Here's the result of comparing `gh` version `1.0.0` with `hub` version `1.11.0` on my machine:

```
$ time hub version > /dev/null
hub version > /dev/null  0.13s user 0.05s system 95% cpu 0.183 total

$ time gh version > /dev/null
gh version > /dev/null  0.01s user 0.01s system 83% cpu 0.016 total

$ time hub browse > /dev/null
hub browse > /dev/null  0.15s user 0.08s system 90% cpu 0.250 total

$ time gh browse > /dev/null
gh browse > /dev/null  0.02s user 0.02s system 84% cpu 0.051 total
```

Note that there's almost no perfect benchmark, especially for a command line program like `gh`.
The numbers above is to show `gh` is in general more responsive.

## Muti-platforms & Easy Installation

`gh` is fully implemented in the Go language and is designed to run across operating systems.
By making use of [cross-compilation](http://dave.cheney.net/2012/09/08/an-introduction-to-cross-compilation-with-go),
`gh` can be easily compiled to binaries for any major operating systems.
There're no pre-requirements to install `gh` (no VMs!). Download the [binary](https://github.com/jingweno/gh/releases) and go!

## Compatibility with Hub

I've tried very hard to make `gh` a drop-in replacement to `hub`.
I've pulled in all the [cucumber tests](https://github.com/jingweno/gh/tree/master/features) from `hub` and 90% of them are passing now.
I'll continuously put efforts on making `gh` fully compatible with `hub`.

## More Features

`gh` has features like [autoupdate](https://github.com/jingweno/gh#autoupdate), [releases](https://github.com/jingweno/gh#gh-release-beta) and [issues](https://github.com/jingweno/gh#gh-issues-beta) that are not available in `hub`.
There're plans to add more features in the upcoming releases, for example, the support of [creating releases](https://github.com/jingweno/gh/pull/129).

## Thanks

It's been nine months of hard work on `gh`.
I would like to thank all the [contributors](https://github.com/jingweno/gh/graphs/contributors),
especially [@calavera](https://github.com/calavera), [@dgryski](https://github.com/dgryski) and [@tgkokk](https://github.com/tgkokk).
I would also like to thank all the early adopters of `gh`.
If you have any suggestions to `gh`,
feel free to fire us a [GitHub issue](https://github.com/jingweno/gh/issues?state=open).
If you're interested in helping out, shoot me an email.
I'm very excited to see more great stuff coming to `gh` in the new year!

May `gh` be with you!
