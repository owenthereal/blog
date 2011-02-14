---
layout: post
title: "Pushing Adaptive Implementations with Eclipse's Extension Points"
tags: eclipse osgi
---

A week ago, I blogged about [implementing adaptive components using Eclipse's optional plugin dependencies][1]. In that post, I gave an example on displaying HTML files with different editors based on client's environment: open the HTML file with the HTML editor from [WTP][2] if the plugin is installed, otherwise fallback to open with the default text editor. The final solution was to query the existence of the WTP editor through [Equinox][3].

However, the implementation is far from enjoyable: our main plugin knows everything about WTP! In other words, in order to specify the query, our main plugin has to know about WTP, hence containing environment-specific implementations. The following graph shows the dependency:
	
![pull method](http://idisk.me.com/jingweno/Public/Pictures/Skitch/pull-20110213-233614.jpg){: width="300" height="200"}

The reason causing this environment-specific coupling is that our main plugin uses the **pull** method to retrieve the HTML editor implementations from WTP (code snippet goes [here][1]). To solve this, we can [inverse the control][4] and have another plugin to **push** specific implementations to the main plugin.

![push method](http://idisk.me.com/jingweno/Public/Pictures/Skitch/push-20110213-233648.jpg){: width="400" height="252"}

Equinox has already offered a very powerful tool for this purpose: [extension points][5]. In the dependency graph above, we separate the concerns by creating an adaptor plugin between the main plugin and the WTP plugin. We declare its dependency on WTP as optional to make sure the plugin will be installed on clients even if the WTP dependency is missing. If somehow WTP is installed in the future, the adaptor will automatically hook it up. Besides, we define an extension point in the main plugin so that the adaptor plugin knows what to contribute and where to contribute.

Here are steps to implement:

* Create an extension point in the main plugin to allow editor contributions. We confine that the contributing editors should be an instance of ITextEditor. The schema looks something like this:

{% highlight xml %}
<element name="extension">
  <complextype>
    <sequence>
	  <element ref="sourceEditor"></element>
    </sequence>
	...
  </complextype>
</element>

<element name="sourceEditor">
  <complextype>
    <attribute name="id" type="string" use="required">
	  ...
	</attribute>
    <attribute name="class" type="string" use="required">
	  <annotation>
	    <appinfo>
		  <meta.attribute kind="java" basedon=":org.eclipse.ui.texteditor.ITextEditor"/>
	    </appinfo>
      </annotation>
    </attribute>
  </complextype>
</element>
{% endhighlight %}

* Create a factory class in the main plugin that knows how to create an ITextEditor after reading the extensions. We also need to reconcile that only one editor extension is initialized (in the case of multiple contributions):

{% highlight java %}
public class SourceEditorFactory {
	private static IConfigurationElement cachedConfigurationElement;

	private static final String ATTRIBUTE_CLASS = "class";

	public static ITextEditor createSourceEditor() {
		if (cachedConfigurationElement == null) {
			cachedConfigurationElement = readConfigurationElement();
		}

		if (cachedConfigurationElement != null) {
			try {
				return (ITextEditor) cachedConfigurationElement
						.createExecutableExtension(ATTRIBUTE_CLASS);
			} catch (Exception exception) {
				// errors when initializing the source editor
			}
		}

		return new TextEditor();
	}

	// Reads the first configuration element whose implemented class is not
	// TextEditor
	private static IConfigurationElement readConfigurationElement() {
		IExtensionPoint extensionPoint = Platform.getExtensionRegistry()
				.getExtensionPoint(FitPlugin.PLUGIN_ID, "fitSourceEditor");

		for (IConfigurationElement configurationElement : extensionPoint
				.getConfigurationElements()) {
			if (!StringUtils.equals(TextEditor.class.getCanonicalName(),
					configurationElement.getAttribute(ATTRIBUTE_CLASS))) {
				return configurationElement;
			}
		}

		return null;
	}
}
{% endhighlight %}

You might have noticed that lines 15 to 20 silently catch all exceptions and return the default text editor if there are any errors when initializing the extension. It ensures that even if WTP is not installed on the client, there is a fallback implementation.

* Declare an extension in the adaptor plugin which refers to the HTML editor from WTP.

{% highlight xml %}
<extension point="com.luxoft.eclipse.fit.runner.fitSourceEditor">
  <sourceeditor class="org.eclipse.wst.sse.ui.StructuredTextEditor" 
		id="com.luxoft.eclipse.fit.runner.optional.wtpHTMLEditor"/>
</extension>
{% endhighlight %}

For more details, please check out [the source][6]. 

From above, we learn how to *push* adaptive implementations using extension points, which decouples environment-specific implementations by inverting the controls. Another powerful tool that Equinox provides for adaptive implementations is [Fragment][7]. If you are careful enough, you might have noticed that our adaptor plugin actually acts as a fragment, a library that is specific to a particular operating system or windowing system. In the next blog post, I will talk more about it in details.

[1]: /2010/04/07/adaptive-implementations-with-eclipses-optional-plugin-dependencies/
[2]: http://www.eclipse.org/webtools/
[3]: http://www.eclipse.org/equinox/
[4]: http://en.wikipedia.org/wiki/Inversion_of_control
[5]: http://wiki.eclipse.org/FAQ_What_are_extensions_and_extension_points%3F
[6]: http://fitpro.svn.sourceforge.net/viewvc/fitpro/Eclipse/trunk/
[7]: http://wiki.eclipse.org/FAQ_What_is_a_plug-in_fragment%3F