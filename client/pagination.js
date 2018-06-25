import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';

const Counts = {};

function getConnectionId(connection) {
  if (typeof connection._stream === 'object') {
    if (
        typeof connection._stream.socket === 'object' &&
        typeof connection._stream.socket._base_url === 'string' &&
        connection._stream.socket._base_url.length > 0
    ) {
      return connection._stream.socket._base_url;
    }

    if (typeof connection._stream.rawUrl === 'string' && connection._stream.rawUrl.length > 0) {
      return connection._stream.rawUrl;
    }
  }
  
  return 'unknown';
}

function getSubscriptionCount(id, connection) {
  const connectionId = getConnectionId(connection);
  
  if (!Counts.hasOwnProperty(connectionId)) {
      Counts[connectionId] = new Meteor.Collection('pagination-counts', { connection })
  }
  
  const doc = Counts[connectionId].findOne(id);

  return (doc && doc.count) || 0;
}

class PaginationFactory {
  constructor(collection, settingsIn = {}) {
    if (!(this instanceof Meteor.Pagination)) {
      // eslint-disable-next-line max-len
      throw new Meteor.Error(4000, 'The Meteor.Pagination instance has to be initiated with `new`');
    }

    this.connection = settingsIn && settingsIn.connection ? settingsIn.connection : Meteor.connection;
    this.collection = collection;
    this.settings = new ReactiveDict();
    const settings = _.extend(
      {
        name: collection._name,
        page: 1,
        perPage: 10,
        filters: {},
        fields: {},
        skip: 0,
        sort: { _id: 1 },
        reactive: true,
        debug: false
      },
      settingsIn || {}
    );

    this.settings.set('name', settings.name);

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

    if (!this.skip()) {
      this.skip(settings.skip);
    }

    if (!this.sort()) {
      this.sort(settings.sort);
    }

    if (!this.debug()) {
      this.debug(settings.debug);
    }

    this._activeObservers = {};

    Tracker.autorun(() => {
      const options = {
        fields: this.fields(),
        sort: this.sort(),
        skip: (this.currentPage() - 1) * this.perPage() + this.skip(),
        limit: this.perPage(),
        reactive: settings.reactive
      };

      if (this.debug()) {
        console.log(
          'Pagination',
          this.settings.get('name'),
          options.reactive === false ? 'non-reactive' : 'reactive',
          'subscribe',
          JSON.stringify(this.filters()),
          JSON.stringify(options)
        );
        options.debug = true;
      }

      this.settings.get('resubscribe');

      this.settings.set('ready', false);

      this.subscription = this.connection.subscribe(
        this.settings.get('name'),
        this.filters(),
        options,
        () => {
          this.settings.set('ready', true);
        }
      );
    });
  }

  _checkObservers() {
    if (!Tracker.active) {
      return;
    }

    const currentComputationId = Tracker.currentComputation._id;

    if (this._activeObservers.hasOwnProperty(currentComputationId)) {
      return;
    }

    if (_.isEmpty(this._activeObservers) && !this.subscription) {
      this.settings.set('resubscribe', Date.now());
    }

    this._activeObservers[currentComputationId] = true;

    Tracker.currentComputation.onStop((c) => {
      // only mark the computation as stopped for future computations
      if (this._activeObservers[c._id] === true) {
        this._activeObservers[c._id] = false;
      }
    });

    Tracker.onInvalidate((c) => {
      // remove stopped computations
      _.each(this._activeObservers, (value, id) => {
        if (!value) {
          delete this._activeObservers[id];
        }
      });

      if (c.stopped && this._activeObservers.hasOwnProperty(c._id)) {
        delete this._activeObservers[c._id];

        // unsubscribe if all computations were stopped
        if (_.isEmpty(this._activeObservers)) {
          if (this.debug()) {
            console.log(
              'Pagination',
              this.settings.get('name'),
              'unsubscribe'
            );
          }

          if (this.subscription) {
            this.subscription.stop();

            this.subscription = null;
            this.settings.set('ready', false);
          }
        }
      }
    });
  }

  currentPage(page) {
    if (arguments.length === 1) {
      if (page >= 1) {
        this.settings.set('page', page);
      }
    } else {
      return this.settings.get('page');
    }
  }

  perPage(perPage) {
    if (arguments.length === 1) {
      this.settings.set('perPage', perPage);
    } else {
      return this.settings.get('perPage');
    }
  }

  filters(filters) {
    if (arguments.length === 1) {
      this.settings.set('filters', !_.isEmpty(filters) ? filters : {});
    } else {
      return this.settings.get('filters');
    }
  }

  fields(fields) {
    if (arguments.length === 1) {
      this.settings.set('fields', fields);
    } else {
      return this.settings.get('fields');
    }
  }

  skip(skip) {
    if (arguments.length === 1) {
      this.settings.set('skip', skip);
    } else {
      return this.settings.get('skip');
    }
  }

  sort(sort) {
    if (arguments.length === 1) {
      this.settings.set('sort', sort);
    } else {
      return this.settings.get('sort');
    }
  }

  totalItems() {
    return this.settings.get('totalItems');
  }

  totalPages() {
    const totalPages = this.totalItems() / this.perPage();

    return Math.ceil(totalPages || 1);
  }

  ready() {
    this._checkObservers();

    return this.settings.get('ready');
  }

  debug(debug) {
    if (arguments.length === 1) {
      this.settings.set('debug', debug);
    } else {
      return this.settings.get('debug');
    }
  }

  refresh() {
    this.settings.set('resubscribe', Date.now());
  }

  getPage() {
    const query = {};

    if (!this.subscription) {
      this.settings.get('resubscribe');

      return [];
    }

    if (this.ready()) {
      const totalItems = getSubscriptionCount(`sub_${this.subscription.subscriptionId}`, this.connection);
      this.settings.set('totalItems', totalItems);

      if (this.currentPage() > 1 && totalItems <= this.perPage() * this.currentPage()) {
        // move to last page available
        this.currentPage(this.totalPages());
      }
    }

    query[`sub_${this.subscription.subscriptionId}`] = 1;

    const optionsFind = { fields: this.fields(), sort: this.sort() };

    if (this.debug()) {
      console.log(
        'Pagination',
        this.settings.get('name'),
        'find',
        JSON.stringify(query),
        JSON.stringify(optionsFind)
      );
      optionsFind.debug = true;
    }

    this._checkObservers();

    return this.collection.find(query, optionsFind).fetch();
  }
}

Meteor.Pagination = PaginationFactory;
