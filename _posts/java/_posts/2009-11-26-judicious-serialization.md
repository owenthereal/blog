---
title: Judicious Serialization
categories: java
---

I was fixing a bug related to [Java Serialization][1] the other day: Server 1 tried to send out an email by using one of the web services from Server 2 with serialized objects passed along. It almost took me half a day to dig out the problem because the stack trace wasn’t helpful enough other than saying there were [Serializable][2] exceptions. After lots of debugging, I finally found out that the problem was one of the Serializable objects having non-Serializable attributes.

There must be some lessons we can learn from here! I quickly checked the hierarchy of the object. Okay...great! Its interface indirectly inherited from Serializable. A code smell came into my mind immediately: **if a class is designed for inheritance (including interfaces), rarely extend it from Serializable**. It isn't too hard to understand why: once a class implements Serializable,

1. all its attributes have to either accept the fact that they are Serializable or [transient][3], and

2. all its subclasses have to tightly couple to the Serializable club, including their attributes.

With Serializable exposed to interface level, the flexibility of the interface is highly reduced and we have to spend proportional effort on maintaining them. Just imagine there are 3 classes with 5 attributes each. To successfully transmit them through Internet, you need to make sure 18 items are Serializable (15 attributes + 3 classes). If you forget any of them, well, you could imagine how painful it is to count which one is missing with all your fingers (that's exactly what I have been through!!). Needless to say how to test them. For testing, you must ensure 18 times both that the serialization-deserialization process succeeds and that it results in a faithful replica of the original object.

Alright, this is enough frustration! Serialization should be used judiciously! But how? First of all, of course, **never expose Serializable to classes that are meant to be inherited**. Do it in its subclasses like the following:

```java
interface Foo { ... }
class Bar implements Foo, Serializable { ... }
```

Secondly, **try to minimize as much as possible the scope of serialization**. Never serialize more than you need. It will just make it harder to debug if anything wrong happened. For example, you are passing the following Serializable object from Server 1 to Server 2. 

```java
class Baz implements Serializable {
    private A a;
    private B b;
    private C c;
    ...
}
```

But somehow you know that only Baz.a and Baz.c are used on Server 2. So just pass Baz.a and Baz.c instead of the whole object! This is also true from the perspective of design: [YAGNI][4], only pass the objects that you care about.

Finally, **use as much as possible classes from the Java library in serialization, or use other alternative technologies**. ArrayList, BigDecimal and many others come with the Serializable ability by default. Why reinventing the wheels and creating you own mess? Popular alternatives are XML, JSON, or YAML.

There are lots of great articles on this topic, e.g.,  Chapter 11 of [Effective Java][5]. I don't wanna [DRY][6] myself here :). Last but not least, bewared when you see Serializable! It's tricky!

[1]: http://en.wikipedia.org/wiki/Serialization
[2]: http://java.sun.com/javase/7/docs/api/java/io/Serializable.html
[3]: http://en.wikibooks.org/wiki/Java_Programming/Keywords/transient
[4]: http://en.wikipedia.org/wiki/You_ain%27t_gonna_need_it
[5]: http://www.amazon.com/Effective-Java-2nd-Joshua-Bloch/dp/0321356683
[6]: http://en.wikipedia.org/wiki/Don%27t_repeat_yourself
