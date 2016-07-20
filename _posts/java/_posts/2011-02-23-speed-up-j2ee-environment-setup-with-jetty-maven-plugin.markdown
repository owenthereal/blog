---
title: Speed Up J2EE Environment Setup With Jetty Maven Plugin
categories: java
---

Setting up a J2EE development environment is typically complex and full of repetition. It wastes a lot of programmers' time before they can happily get the app up and running. They need to configure the IDE, set up the database, configure the server, deploy app to the server, etc.. What's worse, they have to repeat all the setup steps or a subset of the setup steps if they have multiple workspaces. I am not saying all of these steps are unnecessary. But can we just think for a moment why this is causing pain? How can we be [DRY][2] in environment setup?

Let's take a look at where other web frameworks such as [Rails][7] shine. If you carefully think about how you get a Rails app running, you will be surprised to find out almost no configuration is needed. And it's so automatic! Here is how it rolls:

```
> git clone <some_app>
> cd <some_app>
> bundle install
> rails server
```

Boom! Your app is up with just 2 commands (ignoring the step to download the source)! The last command is especially interesting. It is to start up the Rails server with the app loaded. Can we do the same in the Java world? Of course, Maven + Jetty Maven Plugin.

## Introducing Jetty Maven Plugin

Jetty is a web server and javax.servlet container. One of its greatest features is its ability to be embedded into any Java application. The Jetty Maven plugin is just a simple integration of Jetty into the Maven build process. But don't get it wrong, being embeddable doesn't mean being less performing. Jetty is actually the powering engine behind [Google App Engine][3] and [VMware Zimbra][4]. After all, scalability is more related to your app's implementation than the container.

## Running a single web app

To run a single web app, it is as simple as including the Jetty Maven Plugin as a plugin dependency in your pom file and run the "*mvn jetty:run*" command: 

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
<modelVersion>4.0.0</modelVersion>
<name>foo</name>
<artifactId>foo</artifactId>
<packaging>war</packaging>
<build>
	<finalName>foo</finalName>
	<plugins>
		<plugin>
			<groupId>org.mortbay.jetty</groupId>
			<artifactId>jetty-maven-plugin</artifactId>
			<version>7.2.2.v20101205</version>
		</plugin>
	</plugins>
</build>
</project>
```

There are lots of useful [settings][5] that you can fine-tune Jetty, such as "scanIntervalSeconds" for the time interval of automatic hot redeploy, "systemProperties" for System properties of the execution of the plugin, and "jettyEnvXml" for the file that defines JNDI bindings.

## Running a single web app with JNDI

In the case that you are defining data source using JNDI, you need to describe the data source in a "jetty-env.xml" file and refer it in the Jetty Maven Plugin. The jetty-env.xml file may look something like this:

```xml
<?xml version="1.0"?>
<!DOCTYPE Configure PUBLIC "-//Mort Bay Consulting//DTD Configure//EN" "http://jetty.mortbay.org/configure.dtd">
<Configure class="org.eclipse.jetty.webapp.WebAppContext">
	<New id="jndi" class="org.eclipse.jetty.plus.jndi.Resource">
		<Arg>jdbc/jndi</Arg>
		<Arg>
			<New class="org.apache.commons.dbcp.BasicDataSource">
				<Set name="driverClassName">${db_connection_driver_class}</Set>
				<Set name="url">${db_connection_url}</Set>
				<Set name="username">${db_connection_username}</Set>
				<Set name="password">${db_connection_password}</Set>
			</New>
		</Arg>
	</New>
</Configure>
```

The pom.xml now becomes:

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
<modelVersion>4.0.0</modelVersion>
<name>foo</name>
<artifactId>foo</artifactId>
<packaging>war</packaging>
<build>
	<finalName>foo</finalName>
	<plugins>
		<plugin>
			<groupId>org.mortbay.jetty</groupId>
			<artifactId>jetty-maven-plugin</artifactId>
			<version>7.2.2.v20101205</version>
			<webAppConfig>
				<jettyEnvXml>${basedir}/src/over/here/jetty-env.xml</jettyEnvXml>
			</webAppConfig>
		</plugin>
	</plugins>
</build>
</project>
```

## Running multiple web apps

It's a bit tricky to run multiple web apps at once with the Jetty Maven Plugin. You need to have a running web app to delegate the requests. If you are using JNDI to define data source, you also need to configure your web apps to load up their environment settings.

As an example, assuming you have two web apps **foo** and **bar**. They are organized in different Maven projects like the followings:

	- pom.xml
	- foo/
	  - pom.xml
	- bar/
	  - pom.xml

If we wanna deploy both servers with the Jetty Maven Plugin, we need to either get foo running and delegate requests to bar, or the other way around. So it's a good practice to keep foo and bar untouched and introduce a third server to do the request delegation. The ultimate folder structure will look like this:

	- pom.xml
	- foo/
	  - pom.xml
	- bar/
	  - pom.xml
	- servers/
	  - pom.xml

The servers project is basically an empty server with nothing but a web.xml. In its pom file, we define the redirection path and make sure it loads up settings such as JNDI for each web app:

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
<modelVersion>4.0.0</modelVersion>
<parent>
	<groupId>mavenJettyPluginExample</groupId>
	<artifactId>parent</artifactId>
	<version>1.0-SNAPSHOT</version>
</parent>
<artifactId>servers</artifactId>
<packaging>war</packaging>
<name>servers</name>
<build>
	<finalName>servers</finalName>
	<plugins>
		<plugin>
			<groupId>org.mortbay.jetty</groupId>
			<artifactId>jetty-maven-plugin</artifactId>
			<configuration>
				<contextHandlers>            
					<contextHandler implementation="org.eclipse.jetty.webapp.WebAppContext">
						<contextPath>/foo</contextPath>
						<resourceBase>${basedir}/../foo/target/foo</resourceBase>
						<configurationClasses>
							<configurationClass>org.eclipse.jetty.webapp.WebInfConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.webapp.WebXmlConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.webapp.MetaInfConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.webapp.FragmentConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.plus.webapp.EnvConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.plus.webapp.PlusConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.webapp.JettyWebXmlConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.webapp.TagLibConfiguration</configurationClass>
						</configurationClasses>
					</contextHandler>
					<contextHandler implementation="org.eclipse.jetty.webapp.WebAppContext">
						<contextPath>/bar</contextPath>
						<resourceBase>${basedir}/../bar/target/bar</resourceBase>
						<configurationClasses>
							<configurationClass>org.eclipse.jetty.webapp.WebInfConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.webapp.WebXmlConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.webapp.MetaInfConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.webapp.FragmentConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.plus.webapp.EnvConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.plus.webapp.PlusConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.webapp.JettyWebXmlConfiguration</configurationClass>
							<configurationClass>org.eclipse.jetty.webapp.TagLibConfiguration</configurationClass>
						</configurationClasses>
					</contextHandler>
				</contextHandlers>  
			</configuration>
		</plugin>
	</plugins>
</build>
</project>
```

The "resourceBase" of each web app is set to its corresponding target folder. That means we have to compile the web app before running them. The "contextPath" is to tell Jetty the path of the web app. The list of "configurationClasses" is to tell Jetty to load corresponding configurations including the jetty-env.xml file for JNDI definition. 

Again, running "*mvn jetty:run*" will start up these two servers at once. 

## Summary

As you may see, after setting up Jetty in the build process, we are able to start up the server with just one command. It speeds up the setup of our development environment and free ourselves from repeating the setup steps in the future. Most importantly, your teammates will thank you for saving a lot of their precious time.

The source code of the example is available here: <https://github.com/jingweno/maven_jetty_plugin_example>.


[1]: http://wiki.eclipse.org/Jetty/Feature/Jetty_Maven_Plugin
[2]: http://en.wikipedia.org/wiki/Don%27t_repeat_yourself
[3]: http://code.google.com/appengine
[4]: http://www.zimbra.com
[5]: http://wiki.eclipse.org/Jetty/Feature/Jetty_Maven_Plugin
[6]: http://download.eclipse.org/jetty/stable-7/apidocs/org/eclipse/jetty/server/handler/ContextHandler.html
[7]: http://rubyonrails.org
