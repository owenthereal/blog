---
title: Running a single JUnit test in Eclipse
categories: testing
---

A lot of the test-driven developers may find it annoying to run a single JUnit test in Eclipse: 
if there is a test suite with multiple tests, when running a single unit test, either from the context menu of the code editor, or from the JUnit view, Eclipse seems to always insist on running the entire suite, rather than the single test. 


Like the example below, running *testOne* will trigger running the rest of the tests in the suite which are grouped under the "**Unrooted Tests**" node. This is quite irritating sometimes since running unexpected tests may slow down the workflow if they take time to finish. It's also quite confusing since programmers get unwanted test results. Some of my coworkers solve this problem by commenting out unwanted tests each time before running a test. However, it's not very effective and it's error-prone.

![A single test triggers multiple tests]({% asset_path "a_single_test_triggers_multiple_tests.png" %}){: .align-center}

This happens mainly because we are running JUnit 3 tests with the JUnit 4 runner. Before version 4.6, the [JUnit 4 runner][1] seems to have the problem of falling back to run a single JUnit 3 test.

![Running JUnit 3 tests with JUnit 4 runner]({% asset_path "running_junit3_with_junit4_runner.png" %}){: .align-center}

So...the solution is quite simple:

1. **change the JUnit runner to JUnit 3 in Eclipse**, or
2. **upgrade your JUnit 4 library to 4.6 or higher**.

Now the problem is gone and the test-driven developers are happy :-).

[1]: https://github.com/KentBeck/junit/blob/r4.6/src/main/java/org/junit/runners/BlockJUnit4ClassRunner.java
