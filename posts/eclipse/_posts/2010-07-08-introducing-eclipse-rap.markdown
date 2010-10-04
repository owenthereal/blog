---
layout: post
title: Introducing Eclipse RAP
tags: eclipse rap
---

RAP, what? The Eclipse community is expanding its range to Hip Hop :)? Not exactly, although there is a chance. [Eclipse Rich Ajax Platform][4] (RAP) is a framework that empowers developers to build rich web clients “the Eclipse way.” From the latest [Helios download][5], RAP Tooling has become a default component of the RCP bundle:

![Eclipse rap download](/images/posts/rap_download.png){: width="463" height="37"}

So what exactly is the Eclipse paradigm? Can we benefit from it?

#### Architecture

RAP is to the web as RCP to the desktop. It inherits all the goodness from RCP such as workbench extension points model, event-driven SWT/JFace APIs, and componentized OSGi design. As indicated below [4], the only difference between the architecture of RAP and that of RCP is the implementation of SWT/RWT. RWT is actually a bundle providing web-specific implementation of SWT’s widgets based on the [qooxdoo][6] toolkit. In RAP, almost no SWT API is changed.

The following is the architecture of RAP:

![rap architecture](/images/posts/rap_archi.png){: width="521" height="158"}

This architecture determines that developers can bring their RCP applications to the web with a single code base, also called single sourcing[^1]. Like building a RCP application, building a RAP application is a process of building plug-ins and bundles: On the UI side, contributing widget plug-ins; On the server side, since it is powered by [server-side Equinox][7], contributing servlet plug-ins. Unsurprisingly, it also inherits the benefits of any OSGi application such as dynamically adding/removing bundles.

This architecture also determines that RAP is a server-centric AJAX framework[^3]. As indicated below, in a server-centric framework, the application is hosted on the application server and all processing is done on the server. The client browser is only used for data presentation. Consequently, it leaves small footprints on browsers: it waits for instructions from the server to create corresponding widgets on demand. In contrast, client-centric framework such as GWT statically compiles all widgets beforehand.

![server centric vs client centric](/images/posts/server_centric_client_centric.png){: width="468" height="331"}

Both methods have pros and cons. Server-centric frameworks handle all communication  automatically and leaves as few JavaScript codes on the browsers as possible, hence potentially having less security holes on the browsers. Client-centric frameworks are more flexible but require more work to step deep into low-level implementations of client-to-server communication, e.g., figuring out how to update widgets effectively in an asynchronous callback.

#### UI Testing

For a Java-based rich AJAX application, while server side can be tested with JUnit, testing UI is always a headache. Like GWT, testing UI has to rely on external JavaScript libraries such as [JsUnit][8]. But for RAP, since it’s server-centric, UI code can be tested using JUnit with the special [RAPTestCase][9]. Moreover, since the workbench APIs haven’t been changed, all existing SWT testing tools can be reused, e.g., [Selenium][10] or [SWTBot][11].

#### Performance

In general, RAP pushes more work off the client onto the server, thus communicating more information and more frequently with the server. Some performance testings were available[^12].

#### Deployment

RAP is extremely easy to deploy on an OSGi based server [^2], e.g., [Spring dm server][13] which has moved to the [Eclipse Virgo][14] project, because its server side implementation bases on the http OSGi standard. Deploying to a traditional J2EE such as Tomcat requires packaging an extra "[Servlet Bridge][15]" into the war. A drawback of RAP is that it can’t be deployed to a *plain* web server such as Apache. You can do this to a GWT-based application without RPC and the generated JavaScript codes will still work fine on a browser.
h4. Summary

RAP is created to provide developers a possibility to bring the goodness of RCP applications to the web without the need to digging through low-level web-technologies. This greatly reduces cost by reuse of knowledge and code. It provides a thin client with a rich widget set and a stageful server-side on top of OSGi, and reuses the Eclipse workbench paradigm.  As OSGi-based web containers such as Spring dm server are getting more prevalent, RAP will definitely enjoy more popularity.
h4. Reference


[^1]: [Eclipse Rich Ajax Platform: Bringing Rich Client to the Web](http://www.amazon.com/Eclipse-Rich-Ajax-Platform-Firstpress/dp/1430218835/ref=sr_1_1?ie=UTF8&s=books&qid=1278568095&sr=8-1)
[^2]: [EclipseCon 09: RAP or GWT - Which Java-Based AJAX Technology is for You?](http://live.eclipse.org/node/722)
[^3]: [ZK vs. GWT : Server-Centric Matters](http://www.zkoss.org/smalltalks/gwtZk/)
[4]: <a href="http://eclipse.org/rap/" target="_blank">Eclipse Rich Ajax Platform (RAP)</a>
[5]: http://www.eclipse.org/downloads/
[6]: http://qooxdoo.org/
[7]: http://www.eclipse.org/equinox/server/
[8]: http://www.jsunit.net/
[9]: http://www.eclipse.org/rap/noteworthy/1.1/news_M4.php#Tooling
[10]: http://seleniumhq.org/
[11]: http://www.eclipse.org/swtbot/
[^12]: [The new Eclipse download wizard and RAP performance](http://eclipsesource.com/blogs/2008/09/17/the-new-eclipse-download-wizard-and-rap-performance)
[13]: http://www.springsource.org/osgi
[14]: http://www.eclipse.org/proposals/virgo/
[15]: http://dev.eclipse.org/viewcvs/index.cgi/org.eclipse.equinox/server-side/bundles/org.eclipse.equinox.servletbridge/?root=RT_Project