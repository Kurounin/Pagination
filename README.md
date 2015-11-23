Kurounin:Pagination
=================

This package allows you to paginate the subscriptions over meteor's collections. It can be used in a Blaze template or in ReactJS.

# Usage

In your collections file (e.g. lib/collections.js):
```js
MyCollection = new Meteor.Collection('myCollectionName');

```

In your publications file (e.g. server/publications.js):
```js
new Meteor.Pagination(MyCollection);

```

For Blaze template
--------------------------------------------------
In your template file (e.g. client/views/mylist.html):
```html
<template name="myList">
	<div>
    	<ul>
          {{#each documents}}
              <li>Document #{{_id}}</li>
          {{/each}}
        </ul>
        {{> defaultBootstrapPagination pagination=templatePagination limit=10 containerClass="text-center"}}
	</div>
</template>
```

In your template javascript file (e.g. client/scripts/mylist.js):
```js
Template.myList.created = function () {
	this.pagination = new Meteor.Pagination(MyCollection, {
        sort: {
            _id: -1
        }
    });
}

Template.myList.helpers({
    templatePagination: function () {
        return Template.instance().pagination;
    },
	documents: function () {
		return Template.instance().pagination.getPage();
	}
});
```

For ReactJS template
--------------------------------------------------
In this example for paginator I used a [React-Bootstrap](http://react-bootstrap.github.io/) component.
In your view file (e.g. client/views/mylist.jsx):
```html
MyListPage = React.createClass({
    mixins: [ReactMeteorData],

    pagination: new Meteor.Pagination(MyCollection),

    getMeteorData: function() {
        return {
            documents: this.pagination.getPage(),
            ready: this.pagination.ready()
        };
    },

    renderDocument: function(document) {
        return (
        	<li>Document #{document._id}	</li>
        );
    },

    handleChangePage(event, selectedPage) {
        this.pagination.currentPage(selectedPage.eventKey);
    },

    render: function() {
        return (
          <div>
              <ul>
                  {this.data.documents.map(this.renderDocument)}
              </ul>
              <nav>
                <ReactBootstrap.Pagination
                  prev={true}
                  next={true}
                  ellipsis={false}
                  items={this.pagination.totalPages()}
                  maxButtons={10}
                  activePage={this.pagination.currentPage()}
                  onSelect={this.handleChangePage} />
  				</nav>
          </div>
        );
    }
});
```


# Client Pagination available settings on init

* `page`: set the initial page, for example the page parameter from url (defaults to **1**)
* `perPage`: set the number of documents to be fetched per page (defaults to **10**)
* `filters`: filters to be applied to the subscription (defaults to **{}**, meaning no filters)
* `fields`: fields to be returned (defaults to **{}**, meaning all fields)
* `sort`: set the sorting for retrieved documents (defaults to **{_id: -1}**)


# Client Pagination available methods

* `currentPage([int])`: get/set the current page
* `perPage([int])`: get/set the number of documents per page
* `filters([Object])`: get/set the current filters
* `fields([Object])`: get/set the retrieved fields
* `sort([Object])`: get/set the sorting order
* `totalItems()`: get the total number of documents
* `totalPages()`: get the total number of pages
* `ready()`: checks if the subscription for the current page is ready
* `getPage()`: returns the documents for the current page


# Paginator template

A template is also provided to navigate through available pages:

```html
{{> defaultBootstrapPagination pagination=templatePagination limit=10 containerClass="text-center"}}
```
Available template parameters are:
* `pagination`: pagination instance
* `limit`: the maximum number of page links to display
* `containerClass`: optional container class for the paginator


### Packages used as inspiration:

 * [alethes:pages](https://atmospherejs.com/alethes/pages) for pagination instantiation 
 * [aida:pagination](https://atmospherejs.com/aida/pagination) for bootstrap paginator template
