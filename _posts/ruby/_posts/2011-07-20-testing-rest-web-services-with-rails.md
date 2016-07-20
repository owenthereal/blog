---
title: Automatic Testing of REST Web Services Client with Rails
categories: testing rails web_service
---

Testing REST web services client has never been easy. It requires a running web
server, multiple threads, network conection and complex transaction management.

Ideally, REST web service client test should have the following characteristics:

1. The experience of testing REST resource is similar to that of
   testing a ActiveRecord model
2. Start up and shut down web server for the purpose of running REST web services
3. Rollback test data after each test
4. Control fixture creation for REST web services
5. All tests are automatic

In this article, I demonstrate solutions to each of those mentioned.

As an example throughout the article, let's assume we have web services for
a model called *Task* and we are testing its corresponding client code.
Here is a sample action in the *TasksController* of the web server:

```ruby
# server/app/controllers/tasks_controller.rb

def index
  @tasks = Task.all
  render :status => :ok, :json => @tasks
end
```

We render *@tasks* as the JSON format where *to_json* is
called on the object. When you run "*curl http://localhost:3000/tasks.json*", you will
get the following result:

```bash
$ curl http://localhost:3000/tasks.json
[{"id":1,"name":"Write a blog post","created_at":"2011-07-20T04:05:41Z","updated_at":"2011-07-20T04:05:41Z","ends_at":"2011-08-20T03:15:00Z"}]
```

## ActiveResource

In order to test our REST web services, we need a HTTP client. There
are [lots of them][6] out there, but I found [ActiveResource][5] the most
enjoyable to use in a less complex situation. ActiveResource provides ActiveRecord
compatible APIs, so when writing web service client tests, we feel like we are
writing unit tests for a ActiveRecord model.

To start with, we just need to extend it from ActiveResource::Base and
give it the web server URL and representation format. That's it!

```ruby
# client/app/models/task.rb

class Task < ActiveResource::Base
  self.site = "http://localhost:3000"
  self.format = :json
end
```

And we are using it as if you are using an ActiveRecord object:

```ruby
# client/spec/models/task_spec.rb

describe Task do
  it "should return all the tasks" do
    @tasks = Task.all
    @tasks.size.should == 1
  end
end
```

## Web Server

To maintain a zero-setup test environment, we’ll have our test control the stratup and shutdown of
a web server. By having the tests start and stop the web server, they can be easily run with
no external dependencies.

To control the startup and shutdown of a web server before and after all
suites run, it's as simple as having something like this:

```ruby
# client/spec_helper.rb

RSpec.configure do |config|
  config.before :suite do
    @server = Server.new(server_path)
    @server.start
  end

  config.after :suite do
    @server.stop
  end
end
```

The implementation of *Server* is also dead simple. Execute "script/rails server -d" to
daemonize the server and issue a kill to stop it:

```ruby
# client/lib/server.rb

class Server
  def initialize(server_path)
    @server_path = server_path
  end

  def start
    `#{rails_script} server -d -e test`
  end

  def stop
    pid = File.read(pidfile)
    `kill -9 #{pid}`
  end

  private

  def rails_script
    File.join(@server_path, 'script', 'rails')
  end

  def pidfile
    File.join(@server_path, 'tmp', 'pids', 'server.pid')
  end
end
```

## Transaction Rollback

For testing strategies of web services, most people recommend to
either truncate test data on each run or to mock out the request and response.
These approaches are less ideal since they're either less effective or
they're not testing full stack of the targeted web services.

Would it be possible to wrap web services calls in a transaction
and rollback data after each test, like what Rails's [transactional fixture][8] does?

Of course! But let's first try to understand why making transaction rollback
for web service calls is difficult:

* Tests and web server are running in two separate threads, web server's
  transactional boundary can't expand to tests

* Web service calls may commit its transaction

* Web server doesn't know when to rollback the test data

To overcome these problems, we’ll need to fully control the lifecycle of web server's
database connection in the client tests. But how are we able to do this in a client-server architecture?

[dRuby][1] to rescue!

For those who are not familiar with it, dRuby is as the **Remote Method Invocation** to Java as to Ruby.
It allows methods to be called in one Ruby process upon a Ruby object located in another Ruby process.
[Here][7] is a good introduction to brush you up.

We’ll make use of dRuby to directly control the lifecycle of web service's
database connection ([ActiveRecord::Base.connection][2]) in our web
services client tests.
To do that, we add the following code to web server's "*config/environments/test.rb*":

```ruby
# server/config/environments/test.rb

config.after_initialize do
  ActiveRecord::ConnectionAdapters::ConnectionPool.class_eval do
    alias_method :old_checkout, :checkout

    def checkout
      @cached_connection ||= old_checkout
    end
  end

  require 'drb'
  DRb.start_service("druby://localhost:8000", ActiveRecord::Base)
end
```

The above code snippet does two things:

1. Patch *ActiveRecord::ConnectionAdapters::ConnectionPool#checkout* to make sure only one connection is shared
across threads
2. Start a dRuby service for ActiveRecord::Base to be used in
   tests

In case you are wondering why it's necessary to share one database
connection across threads: [ActiveRecord creates one database connection for each thread][3] in its connection pool.
Our web service client tests run in a separate thread from the server's so it's impossible to track which connection to
rollback data for the web services calls.
What we are doing here is to make sure there is only one connection created and we always rollback data for this connection.

After the aforementioned setup, we are able to expand the transaction boundary to
tests:

```ruby
# client/spec/models/task_spec.rb

describe Task do
  before :all do
    @semaphore = Mutex.new
    DRb.start_service
    @remote_base = DRbObject.new nil, "druby://localhost:8000"
  end

  before :each do
    begin_remote_transaction
  end

  after :each do
    rollback_remote_transaction
  end

  it "creates a task through web serices" do
    task = Task.create(:name => "Write a blog post", :ends_at => Date.tomorrow)
    Task.find(task.id).should == task
  end

  private

  def begin_remote_transaction
    @semaphore.lock
    @remote_base.connection.increment_open_transactions
    @remote_base.connection.transaction_joinable = false
    @remote_base.connection.begin_db_transaction
  end

  def rollback_remote_transaction
    @remote_base.connection.rollback_db_transaction
    @remote_base.connection.decrement_open_transactions
    @remote_base.clear_active_connections!
    @semaphore.unlock
  end
end
```

Voila! With dRuby, we use begin+rollback to isolate changes of web services calls to the database,
instead of having to delete+insert for every test case. A huge performance boost!

Note that the Mutex lock in the code is to make sure that multiple web service
client tests can run concurrently, for exmaple, using the [parallel_tests][9] gem.
Without this lock, while the remote ActiveRecord connection is shared, the tests will
behavior strangely in a multi-threads environment. You can ignore those
lines if your web service client tests never run concurrently.

We can easily refactor out the *begin_remote_transaction* method and the
*rollback_remote_transaction* method to *spec_helper.rb*,
so that our web services client tests have little difference from usual ActiveRecord unit tests.

```ruby
# client/spec_helper.rb

RSpec.configure do |config|
  config.before :all do
    @semaphore = Mutex.new
    DRb.start_service
    @remote_base = DRbObject.new nil, "druby://localhost:8000"
  end

  config.before :each do
    @semaphore.lock
    @remote_base.connection.increment_open_transactions
    @remote_base.connection.transaction_joinable = false
    @remote_base.connection.begin_db_transaction
  end

  config.after :each do
    @remote_base.connection.rollback_db_transaction
    @remote_base.connection.decrement_open_transactions
    @remote_base.clear_active_connections!
    @semaphore.unlock
  end
end
```

```ruby
# client/spec/models/task_spec.rb

describe Task do
  it "creates a task through web serices" do
    task = Task.create(:name => "Write a blog post", :ends_at => Date.tomorrow)
    Task.find(task.id).should == task
  end
end
```

## Fixture Creation

Most of the time, we create test fixtures to quickly define prototypes for each
of the models and ask for instances with properties that are important to the test at hand. But in the context
of REST web services, we can't create fixtures unless there is a REST API defined.
To break this constraint, we use dRuby to open up another channel to directly interact with fixture data on web server.

Assuming we are using the [factory_girl][4] gem for fixture creation,
We create a dRuby service for port discovery and a dRuby service for each fixture instance:

```ruby
# server/lib/drb_active_record_instance_factory.rb

require 'factory_girl'

class DRbActiveRecordInstanceFactory
  def get_port_for_fixture_instance(factory_instance)
    port = create_port
    inst = Factory.create(factory_instance)
    DRb.start_service("druby://localhost:#{port}", inst)
    port
  end

  def create_port
    # create a random port
  end
end

DRb.start_service('druby://localhost:9000', DRbActiveRecordInstanceFactory.new)
```

In tests, we ask for the port of the fixture instance and query its corresponding remote reference:

```ruby
# client/spec/models/task_spec.rb

describe Task do
  before :all do
    @drb_factory = DRbObject.new(nil, 'druby://localhost:9000')
  end

  before do
    remote_task_port = @drb_factory.get_port_for_fixture_instance(:task)
    @remote_task = DRbObject.new(nil, "druby://localhost:#{remote_task_port}")
  end

  it "should ..."
    # test REST web services calls with @remote_task
  end
end
```

## Summary

Testing REST web services client can be less complex if we have full control over objects on the web server. ActiveResource and dRuby
stand out to help! They make writing web service client tests feel like writing local unit tests.

[1]: http://www.ruby-doc.org/stdlib/libdoc/drb/rdoc/classes/DRb.html
[2]: http://ar.rubyonrails.org/classes/ActiveRecord/Base.html#M000431
[3]: https://github.com/rails/rails/blob/master/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb#L160
[4]: https://github.com/thoughtbot/factory_girl/
[5]: http://api.rubyonrails.org/classes/ActiveResource/Base.html
[6]: http://ruby-toolbox.com/categories/http_clients.html
[7]: http://segment7.net/projects/ruby/drb/introduction.html
[8]: http://ar.rubyonrails.org/classes/Fixtures.html
[9]: https://github.com/grosser/parallel_tests
