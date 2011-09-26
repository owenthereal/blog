---
layout: post
title: PoEAA on Rails
tags: patterns PoEAA rails
---

The book [Patterns of Enterprise Application Architecure][1] (PoEAA) laid the blueprints for Rails' architecture.
When choosing which enterprise design patterns to encode into the framework, Rails picked, to name a few, [Active Record][2], [Template View][3], [Application Controller][4], etc.
By covering these patterns with a sweet coating of convertion-over-configuration, Rails simplfies pattern analysis a lot.

These design assumptions were absolutely pragmatic for the type of applications that Rails was targeted at.
However, as applications growing more and more complex, developers are starting to realize these
default architectural patterns may not scale very well. Typically,
four main areas are overloaded in an enterprise application:

1. high coupling between domain model and data source,
2. bloated domain model with a mix of domain logic and application
   logic,
3. presentation behavior leaked into views, and
4. high coupling between view data and template

To understand these problems better as well as to figure out possible
solutions, I would like to walk you through some enterprise patterns
from the same book that Rails' architecture heavily base upon.

Note that the patterns I am mentioning here will benefit more for
complex applications, for example, an e-commerce web application selling
digital goods.
There's clearly some overhead to use these patterns for small projects
where the default Rails patterns shine.

#### Data Mapper

[Data Mapper][5] is a layer that transfers data between objects
and a database. It typically creates [Domain Model][7] objects by populating
their attributes from the database.

<div class="center" markdown="1">
  ![Data Mapper](/images/posts/data_mapper.png)
</div>

Assuming we are building an e-commerce platform, we get a store object by
going through the store mapper:

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
but also takes responsability of database access, while in the Data Mapper implementation,
Domain Model is igorant of database and become Plain Old Ruby
Object with business logic. Data Mapper allows database logic and the object model to evolve indenpendently.

Note that the Active Record pattern and the Data Mapper pattern
mentioned are not the Ruby libraries these patterns inspire.
The [active_record][9] gem is an implementation of the Active Record pattern.
The [data_mapper][10] gem is also a "Active Record"-ish implementation, although
it has elements of the Data Mapper pattern.

Here is [Martain Fowler][8] on the choice of Active Record or Data Mapper for Domain Model:

> An OO domain model will often look similar to a database model, yet it will still have a lot of differences. A Domain Model mingles data and process, has multivalued attributes and a complex web of associations, and uses inheritance.
> 
> As a result I see two styles of Domain Model in the field. A simple Domain Model looks very much like the database design with mostly one domain object for each database table. A rich Domain Model can look different from the database design, with inheritance, strategies, and other \[Gang of Four\] patterns, and complex webs of interconnected objects. A rich Domain Model is better for more complex logic, but is harder to map to the database. **A simple Domain Model can use Active Record, whereas a rich Domain Model requires Data Mapper**.

In an enterprise Rails application, it's not rare to see complex domain models stuffed with
assoications, validations, scopes and business logics.
It has become a growing pain to deal with such "fat models".
We need to separate the database concerns out into new dedicated
entitis: the data mappers.
However, as far as I know, there's no ORM in Ruby giving us such separation yet,
althought it's been said the upcoming 2.0 release of the data_mapper gem will [fully
implement the Data Mapper pattern][11]. Before we are able to consume
the new data_mapper gem, is there a way to mitigate existing overloaded Rails models?
Besides, switching an ORM for existing code is not effortless.

As a compromised solution, I would extract database related logics for each *ActiveRecord::Base* model,
for exmaple, validations and scopes, out into a module and then mix it in:

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

  # assoications
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
cleanly isolates the defintions of database logic with the ones of business logic.

#### Service Layer

Layering is one of the most common techniques to break apart a complex
software system. The higher layer uses service defined by the lower
layer, but the lower layer is unaware of the higher layer. Each layer
usually hides its lower layers from the layers above. A Rails
project is typically divided into three layers:

1. presentation layer, including views and controllers,
2. domain layer, including models, and
3. data source layer, which is hidden behind models with the
   Active Record pattern.

It's not difficult to understand the Data Mapper pattern is an effort to break
down #3 into another layer to lower the complexity of models. However,
in the context of enterprise application, models are still overwhelmed by complicated business logic.
As Fowler pointed out, business logic can be further divided into "domain logic" and
"application logic", and [Service Layer][13] is a pattern to encapsulate
model's "application logic" by establishing a boundary and set of operations
through which the presentation layers interact with the application:

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
> corrdinates an application's response in each operation. ...
> 
> The easier question to answer is probably when not to use it. You
> probabaly don't need a Service Layer if your application's business
> logic will only have one kind of client - say, a user interface - and
> its use case responses don't involve multiple transactional resources.

To translate this into a code example, let's assume in an e-commerce
platform, we need to email monthly sells report to the store owner.
In this example, *StoreService* acts as a coordinator of multiple models for the mailing sells report workflow:

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

Another place to make good use of Service Layer shine is reusing workflows for different
controllers, say the same workflow in the above example is used in the *Storefront::StoresController* for store front
and in the *Api::StoresController* for REST API calls, where Service Layer becomes a [Facade][12].

#### Presentation Model

It's not uncommon to present multiple models in the same view. Most
importantly, not all attributes of a model are needed for a certain
presentation.
In a complex system where there are lots of screens, views become a very messy place for extracting state and behavior from models.
Here comes the [Presentation Model][14] to ease the pain:

> Presentation Model pulls the state and behavior of the view out into a model class that is part of the presentation. The Presentation Model coordinates with the domain layer and provides an interface to the view that minimizes decision making in the view. The view either stores all its state in the Presentation Model or synchonizes its state with Presentation Model frequently.

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
As a summary, I would like to once again consult Fowler for the benefit of
Presentation Model:

> Presentation Model is a pattern that pulls presentation behavior from a view. ... It's useful for allowing you to test without the UI, support for some form of multiple view and a separation of concerns which may make it easier to develop the user interface.
> 
> ... Presentation Model allows you to write logic that is completely independent of the views used for display. You also do not need to rely on the view to store state. ...

#### Two Step Views

render_cell :product, :name, @product.name
render_cell :product, :description, @product.description
render_cell :product, :price, @product.price
render_cell :product, :reivews, @product.reviews

class AmazonStoreProductCell < Cell::Rails
  def name(name)
    content_tag(:h1, name)
  end
  ...

  def reviews(reviews)
    
  end
end

class AppleStoreProductCell < Cell::Rails
  def name(name)
    content_tag(:div, name, :class => 'title')
  end

  ...

  def reviews(reviews)
  end
end



#### Summary

break down fat models into layers
easier to test and reuse

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
