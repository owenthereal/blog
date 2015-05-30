---
layout: post
title: Adaptive Implementations with Eclipse's Optional Plugin Dependencies
categories: eclipse osgi
---

[Equinox][1] is an [OSGI][2] implementation that allows bundles to find out what capabilities are available on the system and adapt the functionality they can provide. This adaptivity is achieved through the OSGi service registry. In this blog post, I am gonna talk about how to make use of Eclipse's optional plugin dependencies to support diverse runtime environment.

<!--more-->

Let's get started with an example: When a HTML file is clicked, it should be open with the HTML editor from [WTP][3] if the plugin is installed. Otherwise open it with a text editor. (This is a real world example from [FITpro][4] BTW :) ).

* First, we need to add the WTP UI component as an *optional* dependency.

	![push method](/images/posts/optional_dependencies.png){: width="304" height="307"}

	The MANIFEST.MF should look something like this:

		Require-Bundle:
		 ...
		 org.eclipse.wst.sse.ui;resolution:=optional

* Create a HTML editor if WTP is installed on the client, otherwise fallback to text editor. Wait...here we might have more than one solution:

First of all, we might consider directly initializing the HTML editor class from WTP and if it doesn't exist, initialize the text editor. However, [BundleLoader][5] won't let this happen since it throws out ClassNotFoundException if a class doesn't exist (in the case of WTP not being installed on the client), and this exception can't be caught in client implementations.
	
Secondly, we might also consider initializing the HTML editor class through reflection. In this way, we can catch our own ClassNotFoundException and fallback to create a text editor.
	
{% highlight java %}
public TextEditor createHTMLTextEditor() {
	try {
		Class cls = Class
			.forName("org.eclipse.wst.sse.ui.StructuredTextEditor");
		for (Constructor constructor : cls.getDeclaredConstructors()) {
			if (constructor.getGenericParameterTypes().length == 0) {
				return (TextEditor) constructor.newInstance(new Object[0]);
			}
		}
	} catch (Throwable throwable) {
		// couldn't find the WTP plugin
	}

	return new TextEditor();
}
{% endhighlight %}
						
However...this is not quite "OSGI". Actually, Equinox provides [APIs][6] to retrieve extension configurations and initialize their implemented classes. It uses the same way to initialize classes like what we are doing here.

We can ask Equinox for all the registered editor extensions and find out whether WTP's HTML editor is one of them. If yes, just initialize it. Otherwise, create the text editor that is available to all clients.

{% highlight java %}
private static final String HTML_EDITOR_ID = "org.eclipse.wst.sse.ui.StructuredTextEditor";

private static final String ATTRIBUTE_CLASS = "class";

private static final String ATTRIBUTE_ID = "id";

private static final String EDITOR_EXTENSION_POINT_ID = "org.eclipse.ui.editors";

public TextEditor createHTMLTextEditor() {
	try {
		IExtensionPoint extensionPoint = Platform.getExtensionRegistry()
			.getExtensionPoint(EDITOR_EXTENSION_POINT_ID);
		if (extensionPoint != null) {
			IConfigurationElement[] configurationElements = extensionPoint
				.getConfigurationElements();
			for (IConfigurationElement element : configurationElements) {
				if (StringUtils.equals(element.getAttribute(ATTRIBUTE_ID),
				HTML_EDITOR_ID)) {
					return (TextEditor) element.createExecutableExtension(ATTRIBUTE_CLASS);
				}
			}
		}
	} catch (Exception exception) {
		// couldn't find the WTP plugin
	}

	return new TextEditor();
}
{% endhighlight %}

Now we see how flexible it is to provide an adaptive Implementation with Eclipse's optional plugin dependencies. With this power, we can also support something like upgrading a system without ruining the old working legacy components. A tips can be found [here][7].

[1]: http://www.eclipse.org/equinox/
[2]: http://www.osgi.org
[3]: http://www.eclipse.org/webtools/
[4]: http://sourceforge.net/projects/fitpro/
[5]: http://mobius.inria.fr/eclipse-doc/org/eclipse/osgi/framework/internal/core/BundleLoader.html#findClass(java.lang.String)
[6]: http://help.eclipse.org/help32/index.jsp?topic=/org.eclipse.platform.doc.isv/reference/api/org/eclipse/core/runtime/IConfigurationElement.html
[7]: http://www.developer.com/java/web/article.php/3655231/Eclipse-Tip-Use-Optional-Plug-in-Dependencies-to-Support-Diverse-Runtime-Environments.htm
