---
layout: post
title: Why code navigation sucks on most SCM's web interfaces?
tags: hci codefaces
---

I am not surprised that you feel the same. It sucks to navigate codes on most source control system's web interfaces! Here are whys.

1. **The display of files in most SCM's web interface is not in a tree, but in a list**. Files are in a tree structure; displaying them as a list is definitely a mismatch! The consequence of converting a tree structure to a list one is that the file context is lost during navigation. I believe you must feel annoying when clicking back and forth in order to find more than one file on [GitHub][1]'s web interface: 

	![GitHub](/images/posts/github.png){: width="559" height="220"}

2. **There is a disconnection between opened file's context and opened file's content**. Take <a href="http://code.google.com/" target="_blank">Google Code</a>'s web interface as an example, although its display of files is in a tree structure, but after a file is opened, the context where the file belongs to is gone: only the path of the file is still kept:

	![Google Code](/images/posts/google_code.png){: width="560" height="560"}
	
3. **Being impossible to open multiple files at once**. File is a module to separate concerns in almost all programming languages. At most of the time, reading code only from one file is not informative enough. In a programming language sense, files have connections to each other and being able to show related file modules at once is critical to understand the application. Moreover, we have been used to exploring pages with multiple tabs on a browser, and have been used to navigate codes with multiple viewers in an IDE. This feature is definitely a must!

4. **There is no unified UI to navigate codes across all source control systems**. We have [ViewVC][2], [Gitweb][3], [Warehouse][4], many many... But we don't have a web interface that adapts to all kinds of version control systems.

If you feel there is a need to improve existing SCM's web interface, I would like to introduce to you a neat tool that [we][5] built lately: [CodeFaces][6].  CodeFaces is a source control client made for browsers. It provides an IDE-looking page to structurally navigate codes from a version control system. 
Check out <http://codefaces.org> for more updates and here is a screencast that walks you through all its features: <http://www.youtube.com/watch?v=JNVcyi0cDQ0&hd=1>.

[1]: http://github.com/
[2]: http://www.viewvc.org/
[3]: https://git.wiki.kernel.org/index.php/Gitweb
[4]: http://www.warehouseapp.com/
[5]: http://codefaces.com/about/
[6]: http://codefaces.org
