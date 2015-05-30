---
layout: post
title: PoEAA on Rails
categories: patterns rails
---

The book [Patterns of Enterprise Application Architecture][1] (PoEAA) laid the blueprints for Rails' architecture.
When choosing which enterprise design patterns to encode into the framework, Rails picked, to name a few, [Active Record][2], [Template View][3], [Application Controller][4], etc.
By covering these patterns with a sweet coating of convention-over-configuration, Rails simplifies pattern analysis a lot.

These design assumptions were absolutely pragmatic for the type of applications that Rails was targeting at.
However, as applications growing more and more complex, developers are starting to realize these
default architectural patterns may not scale very well. Typically,
four main areas are overloaded in an enterprise application:

1. high coupling between domain model and data source,
2. bloated domain model with a mix of domain logic and application
   logic,
3. presentation behaviour leaked into views, and
4. high coupling between view data and template

To understand these problems better as well as to figure out possible
solutions, I would like to walk you through some enterprise patterns
from the same book that Rails' architecture heavily bases upon.

<!--more-->

Note that the patterns I am mentioning here will benefit more for
complex applications, for example, an e-commerce web application selling
digital goods.
There's clearly some overhead to use these patterns for simple projects
where the default Rails patterns shine. Most importantly, you should
only apply these patterns where they make sense. I am a strong believer in
contextual solution and these patterns are definitely not the only way
to go.

## Data Mapper

[Data Mapper][5] is a layer that transfers data between objects
and a database. It typically creates [Domain Model][7] objects by populating
their attributes from the database.

![Data Mapper](/images/posts/data_mapper.png)

Assuming we are building an e-commerce platform, we get a store object by
going through the store mapper which connects to the database:

{% highlight ruby %}
# app/controllers/stores_controller.rb

class StoreController < ApplicationController
  def show
    @store = StoreMapper.find(params[:id])
  end
end
{% endhighlight %}

The difference between [Active Record][6] and Data Mapper is actually that
in the Active Record implementation, Domain Model not only encapsulates business logic,
but also takes responsibility of database access, while in the Data Mapper implementation,
Domain Model is ignorant of database and become Plain Old Ruby
Object with business logic. Data Mapper allows database logic and the object model to evolve independently.

Note that the Active Record pattern and the Data Mapper pattern
mentioned are not the Ruby libraries these patterns inspire.
The [active_record][9] gem is an implementation of the Active Record pattern.
The [data_mapper][10] gem is also a "Active Record"-ish implementation, although
it has elements of the Data Mapper pattern. For those who are interested
in seeing the implementation difference between these two gems, I created a [gist][18] for you.

Here is [Martin Fowler][8] on the choice of Active Record or Data Mapper for Domain Model:

> An OO domain model will often look similar to a database model, yet it will still have a lot of differences. A Domain Model mingles data and process, has multivalued attributes and a complex web of associations, and uses inheritance.
> 
> As a result I see two styles of Domain Model in the field. A simple Domain Model looks very much like the database design with mostly one domain object for each database table. A rich Domain Model can look different from the database design, with inheritance, strategies, and other \[Gang of Four\] patterns, and complex webs of interconnected objects. A rich Domain Model is better for more complex logic, but is harder to map to the database. **A simple Domain Model can use Active Record, whereas a rich Domain Model requires Data Mapper**.

In an enterprise Rails application, it's not rare to see complex domain models stuffed with
associations, validations, scopes and business logics.
It has become a growing pain to deal with such "fat models".
We need to separate the database concerns out into a new dedicated
layer: the data mappers.
However, as far as I know, there's no ORM in Ruby giving us such separation yet,
although it's been said the upcoming 2.0 release of the data_mapper gem will [fully
implement the Data Mapper pattern][11]. Before we are able to consume
the new data_mapper gem, is there a way to mitigate existing overloaded Rails models?
Besides, switching an ORM for existing code is not effortless.

\[Updated 01/10 2012\] [Piotr Solnica](http://solnic.eu/) from the data_mapper gem made an official announcement saying they are actively working on Data Mapper 2.0. Announcement goes [here](http://solnic.eu/2012/01/10/ruby-datamapper-status.html).  

As a compromised solution, I would extract database related logic for each *ActiveRecord::Base* model (e.g., validations and scopes)
out into a module and then mix it in:

{% highlight ruby %}
# app/mappers/store_mapper.rb

module StoreMapper
  extend ActiveSupport::Concern

  included do
    # validations
    validates_presence_of :name
    ...

    # scopes
    scope :disabled, where(:disabled => true)
    ...
  end
end
{% endhighlight %}

{% highlight ruby %}
# app/models/store.rb

class Store < ActiveRecord::Base
  include StoreMapper

  # associations
  has_many :products
  belongs_to :company
  ...

  # business logics
  def calculate_sells(from_date, to_date)
    # calculate sells from date to date
  end
  ...
end
{% endhighlight %}

This half-baked solution, although not migrating to the Data Mapper pattern,
cleanly isolates the definitions of database logic with the ones of business logic.
Of course, it's recommended to use the Data Mapper pattern where
possible.

## Service Layer

Layering is one of the most common techniques to break apart a complex
software system. The higher layer uses service defined by the lower
layer, but the lower layer is unaware of the higher layer. Each layer
usually hides its lower layers from the layers above. A Rails
project is typically divided into three layers:

1. presentation layer, including views and controllers,
2. domain layer, including models, and
3. data source layer, which is hidden behind models extending from *ActiveRecord::Base*.

It's not difficult to understand the Data Mapper pattern is an effort to break
down #3 into another layer to lower the complexity of models. However,
in the context of enterprise application, models are still overwhelmed by complicated business logic.
As Fowler pointed out, business logic can be further divided into "domain logic" and
"application logic", and [Service Layer][13] is a pattern to encapsulate
model's "application logic" by establishing a boundary where the presentation layers interact with the application:

> ... Service Layer is a pattern for organization business logic. Many
> Designers, including me, like to divide "business logic" into two
> kinds: "domain logic", having to do purely with the problem domain
> (such as strategies for calculating revenue recognition on a
> contract), and "application logic", having to do with application
> responsibilities \[Cockburn UC\] (such as notifying contract
> administrators, and integrated applications, of revenue recognition
> calculations). Application logic is sometimes referred to as "workflow
> logic", although different people have different interpretations of
> "workflow".

He also pointed out, Service Layer is a good fit for coordinating operations among multiple models,
as well as for talking to multiple presentation layers:

> The benefit of Service Layer is that it defines a common set of
> application operations available to many kinds of clients and it
> coordinates an application's response in each operation. ...
> 
> The easier question to answer is probably when not to use it. You
> probably don't need a Service Layer if your application's business
> logic will only have one kind of client - say, a user interface - and
> its use case responses don't involve multiple transactional resources.

To translate this into a code example, let's assume in an e-commerce
platform, we need to email monthly sells report to the store owner.
In this example, *StoreService* acts as a coordinator of multiple models for the "mailing sells report" workflow:

{% highlight ruby %}
# app/services/store_service.rb

class StoreService
  def mail_sells_report(store_id, from_date, to_date)
    store = StoreMapper.find(store_id)
    store_sells = store.calculate_sells(from_date, to_date)
    store_report = SellsReport.generate(store_sells)
    SellsReportMailer.report_mailer(store.owner, store_report).deliver
  end
end
{% endhighlight %}

Another place where Service Layer shines is reusing workflows for different
controllers, for example, the same workflow in the above example is used in the *Storefront::StoresController* for store front
and in the *Api::StoresController* for REST API calls. Service Layer becomes a [Facade][12] in this case.

## Presentation Model

It's not uncommon to present multiple models in a view. Most
importantly, not all attributes of a model are needed for a certain
presentation.
In a complex system where there are lots of screens, views become a very busy place for extracting state and behavior from models.
The [Presentation Model][14] comes to ease the pain:

> Presentation Model pulls the state and behavior of the view out into a model class that is part of the presentation. The Presentation Model coordinates with the domain layer and provides an interface to the view that minimizes decision making in the view. The view either stores all its state in the Presentation Model or synchronizes its state with Presentation Model frequently.

As an example, let's build a view for the scenario "creating a store for a user":

{% highlight ruby %}
# app/presenters/create_store_presenter.rb

class CreateStorePresenter
  attr_reader :store, :user

  delegate :name, :to => :store, :prefix => true
  delegate :email, :to => :user, :prefix => true

  def initialize(params)
    @store = Store.new(params[:store])
    @user = @store.build_user(params[:user])
  end

  def valid?
    @user.valid? && @store.valid?
  end

  def save
    @store.save
  end
end
{% endhighlight %}

{% highlight erb %}
<!-- app/views/stores/create_store.html.erb -->

<h1>Create a store</h1>

<%= form_for(@create_store_presenter) do |f| %>
  <p>
    <%= f.label :store_name %><br/>
    <%= f.text_field :store_name %>
  </p>

  <p>
    <%= f.label :user_email %><br/>
    <%= f.text_field :user_email %>
  </p>

  <p>
    <%= f.submit "Create" %>
  </p>
<% end %>
{% endhighlight %}

In the example, we wrap two models (*Store* and *User*) into a presenter and
extract only the attributes needed (*Store#name* and *User#email*) for the "create store" screen.
To summarize this pattern, I would like to once again consult Fowler:

> Presentation Model is a pattern that pulls presentation behavior from a view. ... It's useful for allowing you to test without the UI, support for some form of multiple view and a separation of concerns which may make it easier to develop the user interface.
> 
> ... Presentation Model allows you to write logic that is completely independent of the views used for display. You also do not need to rely on the view to store state. ...

## Two Step Views

Rails comes with a neat templating system that allows you to quickly create
dynamic pages. However, this [Template View][15] pattern has drawbacks as
Fowler pointed out, especially in a situation where the view is very
complex:

> ... the common implementations make it too easy to put complicated logic in the page,
> thus making it hard to maintain, particularly by nonprogrammers. You
> need good discipline to keep the page simple and display oriented,
> putting logic in the helper. ...

What's worse, if the display of a view is based on conditions,
for example in a multi-appearance application,
you will find logic that determines which template to render leaked into many places in views or controllers.
Again, this is fine for a simple Rails application.
But it becomes unmanageable as the application growing more complex.

Let's think about an example: an e-commerce platform supports multiple
stores and each store has its own storefront to display a product.
It's common to see the following solution:

{% highlight erb %}
<!-- app/views/products/_product.html.erb -->

<% if store.amazon_store? %>
  <%= render :partial => '/amazon/products/_product.html.erb', :object => product %>
<% elsif store.apple_store? %>
  <%= render :partial => '/apple/products/_product.html.erb', :object => product %>
<% else %>
  <%= render :partial => '/default/products/_product.html.erb', :object => product %>
<% end %>
{% endhighlight %}

The determination logic for displaying a product based on store is leaked into the product partial.
Apparently, to build the whole multi-appearance application, this approach does not
scale. Thankfully, Fowler has something good for us - the [Two Step View][16]
pattern:

> ... You may also want to make global changes to the appearance of the site easily, but common approaches using Template View or Transform View make this difficult because presentation decisions are often duplicated across multiple pages or transform modules. A global change can force you to change several files.
>
> Two Step View deals with this problem by splitting the transformation into two stages. The first transforms the model data into a logical presentation without any special formatting; the second converts that logical presentation with the actual formatting needed. ...

![Two Step View](/images/posts/two_step_view.png)

From the above diagram, the multi-storefront example can be reimplemented with the Two Step
View pattern. The process is in two steps. The first step is to
transform the product data into a logical presentation. The second step
is to convert this logical presentation into different HTML.

Note that in the implementation, a gem called [cells][17] is used to
help define logical presentation. The cells gem
is very helpful in this respect although it was originally designed for
other purposes.

For the logical presentation, we define it to display name, description, price and
reviews of a product for every store:

{% highlight erb %}
<!-- app/views/products/_product.html.erb -->

<%= render_cell :product, :name, product.name %>
<%= render_cell :product, :description, product.description %>
<%= render_cell :product, :price, product.price %>
<%= render_cell :product, :reviews, product.reviews %>
{% endhighlight %}

We then define three strategies (*ProductCell*, *Amazon::ProductCell*, and
*Apple::ProductCell*) to convert the logical presentation to different HTML.
We make use of cells' strategy builder to return strategy class based on current store in session:

{% highlight ruby %}
# app/cells/product_cell.rb

class ProductCell < Cell::Rails
  # return strategy class based on current store in session
  build { "#{current_store.name}::ProductCell".classify.constantize rescue nil }

  def name(name)
    content_tag(:h1, name)
  end

  ...

  def reviews(reviews)
    # display reviews
  end
end
{% endhighlight %}

{% highlight ruby %}
# app/cells/amazon/product_cell.rb

module Amazon
  class ProductCell < ::ProductCell
    def name(name)
      content_tag(:p, name)
    end

    ...

    def reviews(reviews)
      # display reviews for Amazon store
    end
  end
end
{% endhighlight %}

{% highlight ruby %}
# app/cells/apple/product_cell.rb

module Apple
  class ProductCell < ::ProductCell
    def name(name)
      content_tag(:div, name, :class => 'title')
    end

    ...

    def reviews(reviews)
      # display reviews for Apple store
    end
  end
end
{% endhighlight %}

As you may see, the Two Step View pattern makes multi-appearance implementation manageable in a way that
different appearance implementations are organized in a set of strategy classes to parse a common logial presentation.

## Summary

The default enterprise design patterns encoded into Rails are perfect matches for small/medium size projects.
They are light weight and easy to understand. However, as the application growing more mature,
these patterns do not scale well due to layers taking too much responsibility.
That said, a "fat" layer need to be broken into smaller ones:

1. Data Mapper is an effort to extract out data source layer from Domain
   Model that implements Active Record,
2. Service Layer is an endeavor to extract out application logic from
   Domain Model,
3. Presentation Model is an attempt to extract out presentation logic
   from a single or multiple Domain Model, and
4. Two Step View is a try to break down presentation logic into two
   processing steps so that a view can be generated in different formats.

In return for breaking apart a system into smaller layers, each layer
becomes easier to maintain, reuse, test and scale.

Last but not least, I would like to thank Martin Fowler for his awesome book and would love
to hear any feedback for you.

[1]: http://www.amazon.com/Patterns-Enterprise-Application-Architecture-Martin/dp/0321127420
[2]: http://martinfowler.com/eaaCatalog/activeRecord.html
[3]: http://martinfowler.com/eaaCatalog/templateView.html
[4]: http://martinfowler.com/eaaCatalog/applicationController.html
[5]: http://martinfowler.com/eaaCatalog/dataMapper.html
[6]: http://martinfowler.com/eaaCatalog/activeRecord.html
[7]: http://martinfowler.com/eaaCatalog/domainModel.html
[8]: http://martinfowler.com/
[9]: http://rubygems.org/gems/activerecord
[10]: http://datamapper.org/
[11]: https://github.com/datamapper/dm-core/wiki/Roadmap
[12]: http://en.wikipedia.org/wiki/Facade_pattern
[13]: http://martinfowler.com/eaaCatalog/serviceLayer.html
[14]: http://martinfowler.com/eaaDev/PresentationModel.html
[15]: http://martinfowler.com/eaaCatalog/templateView.html
[16]: http://martinfowler.com/eaaCatalog/twoStepView.html
[17]: https://github.com/apotonick/cells
[18]: https://gist.github.com/1244351
