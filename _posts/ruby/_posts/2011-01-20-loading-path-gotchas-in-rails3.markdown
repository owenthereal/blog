---
title: Loading Path Gotchas in Rails 3
categories: rails
---

The algorithm of load path inferring in Rails 3 is a bit weird when class caching is turned off. <!--more--> Assuming you add all subdirectories under app/models to the load paths by using the new "config.autoload_paths" setting in config/application.rb:

```ruby
config.autoload_paths += Dir["#{config.root}/app/models/**/"]
```

And you have a subdirectory under app/models with name class1 and a file under this subdirectory with the same name class1.rb. When you are referring any classes in class1.rb under this subdirectory, you have to make sure they are in the namespace of Class1. Otherwise Rails will complain about your referred class is not in the namespace of Class1. In more details, if you have a directory structure like this:

```
- app
  - models
    - class1
      - class1.rb
      - class1_reference.rb
```

When you refer to Class1Reference in Class1, you will get "**Expected app/models/class1/class1_reference.rb to define Class1::Class1Reference**". If the subdirectory is not named class1, strangely this example will work... Let's take a look at a comparing directory structure:

```
- app
  - models
    - not_class2
      - class2.rb
      - class2_reference.rb
```

This second example have everything the same as the first one (Class2 referring to Class2Reference) except that the subdirectory name (not_class2) is different from the file name (class2.rb). There is no exception raised and everything works as expected.  

The result indicates either a (strange) directory naming convention in Rails 3 or a potential bug in its path inferring algorithm. Here are the [lines][1] in Rails 3 that does the magic:

```ruby
# Load the constant named +const_name+ which is missing from +from_mod+. If
# it is not possible to load the constant into from_mod, try its parent module
# using const_missing.
def load_missing_constant(from_mod, const_name)
  ...

  file_path = search_for_file(path_suffix)

  if file_path && ! loaded.include?(File.expand_path(file_path)) # We found a matching file to load
    require_or_load file_path
    raise LoadError, "Expected #{file_path} to define #{qualified_name}" unless local_const_defined?(from_mod, const_name)
    return from_mod.const_get(const_name)
  elsif
	...
end
```

Please note that if class caching is turned on, both cases work. Now everything becomes quite clear, the line with "unless" after the "raise" is causing the problem: when class caching is turned off, "local_const_defined?" always returns false hence raising the "LoadError". I have created a [bug report][3] on this issue and I will post replies here once I get anything :).

The code of the two examples above are available [here][2]. It has a simple view to display the output of the load path exception. To get started, just run:

```
> bundle install
> rails server
```

And check two pages: <http://localhost:3000/class1> and <http://localhost:3000/class2>.

[1]: https://github.com/rails/rails/blob/master/activesupport/lib/active_support/dependencies.rb 
[2]: https://github.com/jingweno/loading_path_gotchas_in_rails3/tree/master/app/models
[3]: https://rails.lighthouseapp.com/projects/8994-ruby-on-rails/tickets/6320-autoloading-behaves-weird-when-class-caching-is-turned-off
