---
layout: post
title: Patching with Class Shadowing and Maven
tags: java maven
---

Before we start, you may speculate about the usefulness of [class shadowing][1]. Class shadowing can be used as a trick to patch or replace behaviours of  classes at runtime, taking advantage of the first-come first-served  algorithm of Java’s class loader. If there are more than one class with  the same fully qualified name in the Java class loader, the first one  that shows up always take precedence over the rest.

This is extremely useful in some cases. For example, in order to make some out-of-the-box (OOTB) methods extensible without directly changing the source, or to provide backward-compatibility support, class  shadowing is a good technique to separate the OOTB code and the  customized code. By creating a patch jar against the OOTB jar and  putting it before the OOTB jar on classpath, classes with the same  qualified name are merged at runtime.

Class shadowing is only one way of patching a class. It’s based on class loader’s runtime class resolution. Another way is to use class  overlay. For example, the Maven [war overlays plugin][2] expands the war file and copy them on top of the  host classes.

If you are already familiar with OSGi based technology, [patch fragment][3] is actually taking advantage of the class shadowing mechanism. This post is not targeting at building OSGi application but  at standard Maven project.

To instruct Java’s class loader to load jars in a specific order, we can make use of the “-cp” option. For example,

	java -cp patch.jar ootb.jar -jar main.jar

It tells the class loader that patch.jar is loaded before ootb.jar, hence any classes in patch.jar is overriding the ones in ootb.jar. Besides, we can also make use of the Class-Path attribute of the [jar  manifest][4] to specify the classpath. We will adopt this method in the follow-up example.

Here is an example we are going to build. HelloWorldProxy is a *proxy* artifact that exports its classpath in such an order that classes in HelloWorldPatch are replacing classes in HelloWorld. HelloWorldTest depends on HelloWorldProxy and doesn’t know which implementation (HelloWorld or HelloWorldPatch) HelloWorldProxy is exporting. The dependency graph is as followed:

![example dependency](http://idisk.me.com/jingweno/Public/Pictures/Skitch/maven_example_dep-20110213-233540.jpg){: width="447" height="245"}

In the pom.xml of HelloWorldProxy, it has two dependencies and we put HelloWorldPatch before HelloWorld, since we would like to see classes in HelloWorldPatch replacing the ones in HelloWorld. As of Maven 2.0.9, the ordering of dependencies on the classpath is [preserved][5]. The code snippet is as followed:

{% highlight xml %}
<dependencies>
    <dependency>
        <groupId>HelloWorld</groupId>
        <artifactId>HelloWorldPatch</artifactId>
        <version>0.0.1-SNAPSHOT</version>
        <type>jar</type>
        <scope>compile</scope>
    </dependency>
    <dependency>
        <groupId>HelloWorld</groupId>
        <artifactId>HelloWorld</artifactId>
        <version>0.0.1-SNAPSHOT</version>
        <type>jar</type>
        <scope>compile</scope>
    </dependency>
</dependencies>
{% endhighlight %}

We also need to make sure HelloWorldProxy exports the two jars in the  Class-Path attribute of the MANIFEST.MF file with the correct ordering.  The key is to set the [addClasspath][6] flag to true in the maven-jar-plugin:

{% highlight xml %}
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jar-plugin</artifactId>
    <version>2.3.1</version>
    <configuration>
        <archive>
            <manifest>
                <addClasspath>true</addClasspath>
            </manifest>
        </archive>
    </configuration>
</plugin>
{% endhighlight %}

Run “mvn package” in HelloWorldProxy and take a look at the generated MANIFEST.MF:

![manifest](http://idisk.me.com/jingweno/Public/Pictures/Skitch/maven_manifest-20110213-233556.jpg){: width="594" height="102"}

Voila! That’s what we expect! HelloWorldPatch takes precedence over HelloWorld on HelloWorldProxy’s classpath!

Now HelloWorldTest can safely depends on HelloWorldProxy and expects that HelloWorldProxy will export HelloWorldPatch’s implementations at  runtime:

{% highlight xml %}
<dependency>
    <groupId>HelloWorld</groupId>
    <artifactId>HelloWorldProxy</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <type>jar</type>
    <scope>compile</scope>
</dependency>
{% endhighlight %}

The source of this example is available on GitHub <http://github.com/jingweno/patching_with_class_shadowing_and_maven>. You can also view it directly with CodeFaces <http://codefaces.org/http://github.com/jingweno/patching_with_class_shadowing_and_maven>.

[1]: http://mindprod.com/jgloss/shadow.html
[2]: http://maven.apache.org/plugins/maven-war-plugin/examples/war-overlay.html
[3]: http://wiki.eclipse.org/FAQ_Can_fragments_be_used_to_patch_a_plug-in%3F
[4]: http://download.oracle.com/docs/cd/E17476_01/javase/1.5.0/docs/guide/jar/jar.html#JAR%20Manifest
[5]: http://stackoverflow.com/questions/793054/maven-classpath-order-issues
[6]: http://maven.apache.org/shared/maven-archiver/examples/classpath.html