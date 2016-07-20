---
title: How to set up and run PDE build
categories: eclipse
---

The [Plug-in Development Environment][1] (PDE) provides tools to build Eclipse plug-ins, fragments, features, update sites and RCP products. This post is about how to set up and run the PDE [headless build][2]. Headless build means making the build outside the Eclipse IDE. You can also manually build it inside Eclipse with [its GUI][3].

<!--more-->

Before running the PDE build, you need to set up the followings:

* build directory
* target platform
* build configuration file

## Build directory

The first step in setting up a build is to create the directory in which the build will take place. Next, create two subdirectories called "*plugins*" and "*features*", and copy the plug-ins and features that you want to build respectively into these two folders. The directory structure for the build directory should look like this:

	- build_directory
	    - plugins
	        - plugin_to_build_a
	        - plugin_to_build_b
	        - ...
	    - features
	        - feature_to_build
	        - ...

## Target platform

Features and plugins are compiled and run against a set of pre-built features and plugins. These dependencies constitute the target platform. For example, most RCP applications contribute to the UI by depending on the *org.eclipse.ui* plug-in. 

In this step, you also need to create a directory with two subdirectories called "*plugins*" and "*features*", and copy all the dependencies over. For developing RCP applications for multiple platforms, the [RCP delta pack][4] is a good option since it contains all the platform specific fragments from the Eclipse SDK. Download the delta pack and unzip it, then you finish setting up the target platform :). The directory structure for the target platform should look like this:

	- target_platform
	    - plugins
	        - org.eclipse.core.runtime
	        - org.eclipse.ui
	        - ...
	    - features
	        - org.eclipse.equinox.launcher
	        - ...

## Build configuration file

After setting up the directory structure for the plugins/features to build and the target platform, we need to tell PDE how we want the build. We can configure it by adding a *build.properties* file. The template of this file is available in any Eclipse distribution:

	#{eclipseInstall}/plugins/org.eclipse.pde.build_#{version}/templates/headless-build/build.properties

Create a directory for the configuration file, copy the template file over, comment out unnecessary properties in the template file. The directory structure should look something like this:

	- build_config
	    - build.properties 

PDE build provides [a variety of properties][5] that we can configure for the build, from checking out source from CVS to controlling the whole build lifecycle. In this post, we only discuss the most essential ones:

	topLevelElementType: feature or plugin
	topLevelElementId: the id of the top level element we are building
	archivePrefix: the prefix that will be used in the generated archive
	collectingFolder: the location under which all of the build output will be collected
	configs: the list of {os, ws, arch} configurations to build

## Running PDE build

If you have followed me this far, you should have the following directory structure ready:

	- build_directory
	    - plugins
	        - plugin_to_build_a
	        - plugin_to_build_b
	        - ...
	    - features
	        - feature_to_build
	        - ...
	- target_platform
	    - plugins
	        - org.eclipse.core.runtime
	        - org.eclipse.ui
	        - ...
	    - features
	        - org.eclipse.equinox.launcher
	        - ...
	- build_config
	    - build.properties

Open up a terminal, type in: 

	java -jar #{eclipseInstall}/plugins/org.eclipse.equinox.launcher_#{version}.jar
	     -application org.eclipse.ant.core.antRunner
	     -buildfile #{eclipseInstall}/plugins/org.eclipse.pde.build_#{version}/scripts/build.xml
	     -DbuildDirectory=#{path_to_the_build_directory}
	     -DbaseLocation=#{path_to_the_target_platform_directory}
	     -Dbuilder=#{path_to_the_build_configuration_directory}

You should see PDE starts building :).

## Summary

Setting up the PDE build looks scary at first, but once you understand [Equinox][6] a little bit more, you will find everything make a lot of sense. All you need to get it to run is creating the directory structure for the plug-ins/features to build and their dependencies, and configuring some properties. The directory structure, probably as you have already realized, is Equinox's [convention][7] of managing components.

You can also set up [Ant][8] tasks or [Rake][9] tasks to automate the whole process. Like the exercise that I have done lately, I used Rake to automate the PDE build for the Eclipse [FITPro][10] plugin. The source is available here: <https://fitpro.svn.sourceforge.net/svnroot/fitpro/Eclipse/trunk/com.luxoft.eclipse.fit.runner.releng/>.

[1]: http://www.eclipse.org/pde/
[2]: http://wiki.eclipse.org/index.php/PDEBuild
[3]: http://www.eclipse.org/articles/Article-PDE-Automation/automation.html
[4]: http://archive.eclipse.org/eclipse/downloads/drops/S-3.6RC4-201006031500/index.php#DeltaPack
[5]: http://help.eclipse.org/galileo/index.jsp?topic=/org.eclipse.pde.doc.user/tasks/pde_feature_generating_antcommandline.htm
[6]: http://www.eclipse.org/equinox/
[7]: http://en.wikipedia.org/wiki/Convention_over_configuration
[8]: http://ant.apache.org/
[9]: http://rake.rubyforge.org/
[10]: http://sourceforge.net/projects/fitpro/
