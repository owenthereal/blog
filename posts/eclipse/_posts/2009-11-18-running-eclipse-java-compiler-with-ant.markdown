---
layout: post
title: Running Eclipse Java Compiler with Ant
tags: eclipse java ant
---

[Eclipse Java Compiler][1] (EJC) is an [incremental compiler][2] that is generally faster than any JDKs. 
It also fixes some incompatible problems related to JDK6, e.g. <http://issues.apache.org/jira/browse/OPENJPA-640>. 
This post is about how to run EJC with an ant target to compile your Java projects.

1. Install [Ant][3] 1.7+.

2. Download the latest [JDT Core Batch Compiler][4] 
and put it directly into your $ANT_HOME/lib folder. 
Or, if you have Eclipse installed, you have the compiler by default! 
Locate the *org.eclipse.jdt.core_xxx.jar* in the plugins directory of your Eclipse installation, 
put that jar file into the $ANT_HOME/lib folder, 
and at the same time unzip this jar file and make *jdtCompilerAdapter.jar* available to ant.

3. You are now ready to test the Eclipse compiler in command line. 
The key is to direct ant to use EJC by specifying the compiler parameter *-Dbuild.compiler* to *org.eclipse.jdt.core.JDTCompilerAdapter*. 
Go to a Java project and type in:

{% highlight bash linenos %}
ant -Dbuild.compiler=org.eclipse.jdt.core.JDTCompilerAdapter
    -Dant.build.javac.target=1.6
    -Dant.build.javac.source=1.6 compile
{% endhighlight %}

4. You can also set up an ant target to play around with it:
<script src="http://gist.github.com/499762.js?file=build.xml"></script>

[1]: http://www.eclipse.org/jdt/core/index.php
[2]: http://en.wikipedia.org/wiki/Incremental_compiler
[3]: http://ant.apache.org
[4]: http://download.eclipse.org/eclipse/downloads/drops/R-3.6.1-201009090800/index.php#JDTSDK