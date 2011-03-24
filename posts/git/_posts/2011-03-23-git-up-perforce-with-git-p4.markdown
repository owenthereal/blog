---
layout: post
title: Git Up Perforce with git-p4
tags: git perforce version_control
---

[Distributed version control systems][11] open up lots of flexibility and provide lots of efficiency in work-flow than their centralized cousins (namely [Perforce][12]). There's often value to use DVCS in the team. 

The case that I run into frequently is where there is a corporate standard for a deficient and less powerful VCS, but the team wish to work efficiently. In that case, there are lots of successful stories of using [dual VCS][13]: DVCS for local version control and committing to a shared centralized VCS with a DVCS-to-VCS bridge. 

Git is particularly good at this aspect which provides tons of [bridges][1] to other VCS (That's another reason for preferring git over mercurial). I have been using the [git-p4][2] bridge to synchronize codes between a centralized Perforce repository and a local Git repository lately. Here is a tutorial on setting it up.

<div class="center" markdown="1">	
	![git-p4 bridge](http://idisk.me.com/jingweno/Public/Pictures/Skitch/git-p4-20110323-172404.jpg)
</div>

#### Setting up Perforce command line client

The git-p4 bridge requires the [p4 command line client][3] properly being set up. There is a [lengthy tutorial][14] on Perforce's [documentation website]. The following is a short sum-up:

1. install the p4 command line client (use [MacPort][5] or [Homebrew][6] if you are a Mac guy :-))
2. create a .p4settings file in your home directory and set up some global [environment variables][7] for your Perforce repository. For example here is my local settings:

		P4PORT=repo_url:repo_port
		P4USER=user_name
		P4PASSWD=password
		P4CLIETNT=clien_workspace_name
		P4EDITOR=vim

3. Run "p4 client" to define the workspace mapping
4. Run "p4 info" to verify the settings

After you have done all these, don't forget to issue "p4 sync repo_url" to test whether you are able to checkout stuff from your repository.

#### Installing git-p4 bridge

The [git-p4][8] bridge is a Python script to enable bidirectional operation between a Perforce depot and Git. It doesn't come with the Git distribution by default. So to install it, you need to download the script and put it into your system path. For me, I clone the whole Git repository from GitHub and make a soft-link to the script:

1. Clone the Git repository to somewhere 

		git clone https://github.com/git/git.git git_source_path

2. Create a soft-link to the git-p4 script

		ln -s git_source_path/contrib/fast-import/git-p4 /usr/bin/git-p4 

Windows users need to include the [git-p4.bat][10] file in the system path.

#### Commands

Four things to remember when using git-p4: 

* Instead of using "git push" to push local commits to remote repository, use "git-p4 submit"
* Instead of using "git fetch" to fetch changes from remote repository to local, use "git-p4 sync"
* Instead of using "git pull" to fetch and merge changes from remote repository to local, use "git-p4 rebase"
* Instead of using "git merge" to merge local branches, use "git rebase"

For the last one, the reason is that when you run "git merge", Git creates extra commit on top of the stack for the merging. This is not something we wanna show in the remote non-git repository. Details explanation of the difference between git-merge and git-rebase goes here: <http://www.jarrodspillers.com/2009/08/19/git-merge-vs-git-rebase-avoiding-rebase-hell/>. 

That's it! We are ready to roll! 

#### Workflow

There is a [detail explanation][9] on the usage of git-p4 in Git's source repository. Here is an quick example:

1. Clone a Perforce project

		git-p4 clone //depot/path/project

2. Make some changes to the project and commit locally to Git

		git commit changed_file

3. In the meantime somebody in the team submitted changes to the remote Perforce repository. Merge it to your local repository

		git-p4 rebase

4. Submit your local changes back to Perforce

		git-p4 submit

#### Under the hook

There is no magic happening here for git-p4. What it does is simply invoking the p4 command line tool to download sources to local, and then clone a Git repository out of it. You can simply verify this by typing "git branch -a":

<div class="center" markdown="1">	
	![under the hook of git-p4](http://idisk.me.com/jingweno/Public/Pictures/Skitch/Terminal_%E2%80%94_%E2%8C%981-20110323-171241.jpg)
</div>

You will be amazed once again by how flexible the design of Git is which makes all this possible! 

#### Summary

To quote from [Martin Fowler][16]'s [post][15] on VCS, "a lot of teams can benefit from this dual-VCS working style, particularly if there's a lot of corporate ceremony enforced by their corporate VCS. Using dual-VCS can often make both the local development team happier and the corporate controllers happier as their motivations for VCS are often different".

[1]: https://github.com/git/git/tree/master/contrib
[2]: https://github.com/git/git/blob/master/contrib/fast-import/git-p4
[3]: http://www.perforce.com/perforce/products/p4.html
[4]: http://www.perforce.com/perforce/doc.current/manuals/p4guide/02_config.html
[5]: http://www.macports.org/
[6]: http://mxcl.github.com/homebrew/
[7]: http://www.perforce.com/perforce/doc.current/manuals/cmdref/_env.html#1045283
[8]: https://github.com/git/git/tree/master/contrib/fast-import
[9]: https://github.com/git/git/blob/master/contrib/fast-import/git-p4.txt
[10]: https://github.com/git/git/blob/master/contrib/fast-import/git-p4.bat
[11]: http://en.wikipedia.org/wiki/Distributed_revision_control
[12]: http://www.perforce.com/
[13]: http://martinfowler.com/bliki/VersionControlTools.html
[14]: http://www.perforce.com/perforce/doc.current/manuals/p4guide/02_config.html
[15]: http://martinfowler.com/bliki/VersionControlTools.html
[16]: http://martinfowler.com