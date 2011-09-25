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

1. high coupling between domain model and data source
2. bloated domain model with a mix of domain logic and application logic
3. presentation behavior leaked into views
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
with Active Record, Domain Model not only encapsulates business logic,
but also takes responsability of database access, while with Data Mapper,
Domain Model is igorant of database and become Plain Old Ruby
Object. Data Mapper allows database logic and the objct model to evolve indenpendently.

Note that the Active Record pattern and the Data Mapper pattern
mentioned above are not the Ruby libraries these patterns inspire.
The [active_record][9] gem is an implementation of the Active Record pattern.
The [data_mapper][10] gem is also a "Active Record"-ish implementation, although
it has elements of the Data Mapper pattern.

Here is [Martain Fowler][8] on Domain Model:

> An OO domain model will often look similar to a database model, yet it will still have a lot of differences. A Domain Model mingles data and process, has multivalued attributes and a complex web of associations, and uses inheritance.
> 
> As a result I see two styles of Domain Model in the field. A simple Domain Model looks very much like the database design with mostly one domain object for each database table. A rich Domain Model can look different from the database design, with inheritance, strategies, and other [Gang of Four] patterns, and complex webs of interconnected objects. A rich Domain Model is better for more complex logic, but is harder to map to the database. **A simple Domain Model can use Active Record, whereas a rich Domain Model requires Data Mapper**.

In an enterprise Rails application, it's not rare to see complex domain models stuffed with
assoications, validations, scopes and business logics.
It has become a growing pain to deal with such "fat models".
We need to separate the database concerns out into data mappers.
As far as I know, there's no ORM in Ruby giving us such separation yet,
althought it's been said the upcoming 2.0 update of the data_mapper gem will [fully
implement the Data Mapper pattern][11]. Before we are able to consume
the new data_mapper gem, is there a way to mitigate existing overloaded Rails models?
Afterall, switching an ORM for existing code is not effortless.

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

send email

#### Presentation Model

validate confirmation of

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

Testing REST web services client can be less complex if we have full control over objects on the web server. ActiveResource and dRuby
stand out to help! They make writing web service client tests feel like writing local unit tests.

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
