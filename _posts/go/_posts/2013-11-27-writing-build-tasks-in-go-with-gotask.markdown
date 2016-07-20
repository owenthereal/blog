---
title: Write Build Tasks in Go with Gotask
categories: go
---

One of the things that I miss a lot when programming in Go is being able to write build tasks in Go itself.
The de facto build tool for Go is [make](http://www.gnu.org/software/make/).
Make is simple, classic and gets the work done. But it falls when build tasks are becoming complex.
Another drawback with make is that it's completely isolated from the host language: there's no way to import and make use of any Go code.
Build tools like [ant](http://ant.apache.org/) or [maven](http://maven.apache.org/what-is-maven.html) also suffer for similar reasons.

## External DSL vs. Internal DSL

The problems with these build tools come from the fact that they use an external [Domain Specific Language](http://en.wikipedia.org/wiki/Domain_Specific_Language) (DSL) to describe build tasks.
Programming languages like Ruby, on the other hand, adopt an internal DSL approach, à la [rake](http://rake.rubyforge.org/).
It allows you to express build tasks in the host language.
For reference, [Martin Fowler](http://martinfowler.com/) has a very good [article](http://martinfowler.com/bliki/DomainSpecificLanguage.html) on internal DSL and external DSL.

## Idiomatic Build Tool in Go

Go, as a statically-typed language, is not designed to write good DSLs.
[Andrea Fazzi](https://twitter.com/remogatto) has written a [blog post](http://freecella.blogspot.ca/2010/03/is-go-suitable-for-building-dsl.html) on whether Go is suitable for building DSL by comparing it to Ruby.
The conclusion, without surprise, was Go is not good at building complex and general purpose DSLs.
However, we don't necessary need to bend the Go syntax in order to make an idiomatic build tool.
An everyday Go example is [`go test`](http://golang.org/pkg/testing/). Consider the following test function in a file called `time_test.go`:

```go
func TestTimeConsuming(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping test in short mode.")
    }
    ...
}
```

Running `go test` will pick up this test file and execute the test function.
It feels very DSLish yet we're not bending the syntax like we usually do for internal DSLs.
The trick behind `go test` is convention over confication:
if you create a file called `xxx_test.go` and name the test function `TestXxx`, where `xxx` is the test name,
your test will be run.

We could do something similar for an idiomatic build tool in Go: introducing [gotask](https://github.com/jingweno/gotask).

## Gotask

Consider the following task function in a file called `sayhello_task.go`:

```go
// +build gotask

package main

import (
    "github.com/jingweno/gotask/tasking"
    "os/user"
    "time"
)

// NAME
//    say-hello - Say hello to current user
//
// DESCRIPTION
//    Print out hello to current user
//
// OPTIONS
//    --verbose, -v
//        run in verbose mode
func TaskSayHello(t *tasking.T) {
    user, _ := user.Current()
    if t.Flags.Bool("v") || t.Flags.Bool("verbose") {
        t.Logf("Hello %s, the time now is %s\n", user.Name, time.Now())
    } else {
        t.Logf("Hello %s\n", user.Name)
    }
}
```

Running `gotask -h` will display all the tasks:

```
$ gotask -h
NAME:
   gotask - Build tool in Go

USAGE:
   gotask [global options] command [command options] [arguments...]

VERSION:
   0.8.0

COMMANDS:
   say-hello    Say hello to current user
   help, h      Shows a list of commands or help for one command

GLOBAL OPTIONS:
   --generate, -g       generate a task scaffold named pkg_task.go
   --compile, -c        compile the task binary to pkg.task but do not run it
   --debug              run in debug mode
   --version            print the version
   --help, -h           show help
```

Running `gotask say-hello -h` will display usage for a task:

```
$ gotask say-hello -h
NAME:
   say-hello - Say hello to current user

USAGE:
   command say-hello [command options] [arguments...]

DESCRIPTION:
   Print out hello to current user

OPTIONS:
   --verbose, -v        run in verbose mode
   --debug              run in debug mode
```

To execute the task, type:

```
$ gotask say-hello
Hello Owen Ou
```
To execute the task in verbose mode, type:

```
$ gotask say-hello -v
Hello Owen Ou, the time now is 2013-11-20 15:32:00.73771438 -0800 PST
```

Yes, that's [gotask](https://github.com/jingweno/gotask), an idiomatic way of writing build tasks in Go.

### Convention over Configuration

Similar to defining a Go test, you follow the `gotask` convention to describe your build tasks.
You create a file called `TASK_NAME_task.go` and name the task function in the format of

```go
// +build gotask

package main

import "github.com/jingweno/gotask/tasking"

// NAME
//    The name of the task - a one-line description of what it does
//
// DESCRIPTION
//    A textual description of the task function
//
// OPTIONS
//    Definition of what command line options it takes
func TaskXxx(t *tasking.T) {
  ...
}
```

where `Xxx` can be any alphanumeric string (but the first letter must not be in [a-z]) and serves to identify the task name.
By default, `gotask` will dasherize the `Xxx` part of the task function name and use it as the task name.

The `// +build gotask` build tag constraints task functions to `gotask` build only. Without the build tag, task functions will be available to
application build which may not be desired.

### Comments as Man Page™

It's a good practice to document tasks in a sensible way.
In `gotask`, the comments for the task function are parsed as the task's man page by
following the [man page layout](http://en.wikipedia.org/wiki/Man_page#Layout):
Section NAME contains the name of the task and a one-line description of what it does, separated by a "-";
Section DESCRIPTION contains the textual description of the task function;
Section OPTIONS contains the definition of the command line flags it takes.

### Task Scaffolding

`gotask` is able to generate a task scaffolding to quickly get you started for writing build tasks by using the `--generate` or `-g` flag.
The generated task is named as `pkg_task.go` where `pkg` is the name of the package that `gotask` is run:

```
// in a folder where package example is defined
$ gotask -g
create example_task.go
```

### Compiling Tasks

`gotask` is able to compile defined tasks into an executable using `go build`.
This is useful when you need to distribute your build executables.
For the above `say-hello` task, you can compile it into a binary using `--compile` or `-c`:

```
$ gotask -c
$ ./examples.task say-hello
Hello Owen Ou
```

## Conclusion

With `gotask`, you're able to write idiomatic Go code for build tasks.
In the future, I would hope `gotask` can be part of the [Go toolchain](http://golang.org/src/cmd/go), so that you can simply type `go task` without installing another tool.
If you're a Go committer reading this blog post and are convinced that `gotask` worths being port to the Go toolchain, feel free to ping me. I'm happy to help out with the integration :).
If you're a user of `gotask` and would like to help out with the development, the project page is [here](https://github.com/jingweno/gotask).

Happy tasking!
