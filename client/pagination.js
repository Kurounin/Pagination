import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Counts } from 'meteor/tmeasday:publish-counts';

const PaginationFactory = ((() => {
  class Pagination {
    constructor(collection, settingsIn = {}) {
      if (!(this instanceof Meteor.Pagination)) {
        // eslint-disable-next-line max-len
        throw new Meteor.Error(4000, 'The Meteor.Pagination instance has to be initiated with `new`');
      }

      this.collection = collection;
      this.settings = new ReactiveDict();
      const settings = _.extend(
        {
          page: 1,
          perPage: 10,
          filters: {},
          fields: {},
          sort: { _id: 1 },
        },
        settingsIn || {}
      );

      if (!this.currentPage()) {
        this.currentPage(settings.page);
      }

      if (!this.perPage()) {
        this.perPage(settings.perPage);
      }

      if (!this.filters()) {
        this.filters(settings.filters);
      }

      if (!this.fields()) {
        this.fields(settings.fields);
      }

      if (!this.sort()) {
        this.sort(settings.sort);
      }

      if (!this.ready()) {
        this.ready(false);
      }
    }

    currentPage(page) {
      if (arguments.length === 1) {
        if (this.settings.get('page') !== page && page >= 1) {
          this.settings.set('page', page);
        }
      }
      return this.settings.get('page');
    }

    perPage(perPage) {
      if (arguments.length === 1) {
        if (this.settings.get('perPage') !== perPage) {
          this.settings.set('perPage', perPage);
        }
      }
      return this.settings.get('perPage');
    }

    filters(filters) {
      if (arguments.length === 1) {
        this.settings.set('filters', !_.isEmpty(filters) ? filters : {});
      }
      return this.settings.get('filters');
    }

    fields(fields) {
      if (arguments.length === 1) {
        this.settings.set('fields', fields);
      }
      return this.settings.get('fields');
    }

    sort(sort) {
      if (arguments.length === 1) {
        this.settings.set('sort', sort);
      }
      return this.settings.get('sort');
    }

    totalItems(totalItems) {
      if (arguments.length === 1) {
        this.settings.set('totalItems', totalItems);
        if (this.currentPage() > 1 && totalItems <= this.perPage() * this.currentPage()) {
          // move to last page available
          this.currentPage(this.totalPages());
        }
      }
      return this.settings.get('totalItems');
    }

    totalPages() {
      const totalPages = this.totalItems() / this.perPage();
      return Math.ceil(totalPages || 1);
    }

    ready(ready) {
      if (arguments.length === 1) {
        this.settings.set('ready', ready);
      }
      return this.settings.get('ready');
    }

    debug(debug) {
      if (arguments.length === 1) {
        this.settings.set('debug', debug);
      }
      return this.settings.get('debug');
    }

    getPage() {
      const options = {
        fields: this.fields(),
        sort: this.sort(),
        skip: (this.currentPage() - 1) * this.perPage(),
        limit: this.perPage(),
      };

      if (this.debug()) {
        console.log(
          'Pagination',
          this.collection._name,
          'subscribe',
          JSON.stringify(this.filters()),
          JSON.stringify(options)
        );
        options.debug = true;
      }

      const handle = Meteor.subscribe(
        this.collection._name,
        this.filters(),
        options
      );

      const query = {};

      this.ready(handle.ready());
      if (handle.ready()) {
        this.totalItems(Counts.get(`sub_count_${handle.subscriptionId}`));
      }

      query[`sub_${handle.subscriptionId}`] = 1;

      const optionsFind = { fields: this.fields(), sort: this.sort() };

      if (this.debug()) {
        console.log(
          'Pagination',
          this.collection._name,
          'find',
          JSON.stringify(query),
          JSON.stringify(optionsFind)
        );
        optionsFind.debug = true;
      }

      return this.collection.find(query, options).fetch();
    }
  }

  return Pagination;
}))();

Meteor.Pagination = PaginationFactory;
