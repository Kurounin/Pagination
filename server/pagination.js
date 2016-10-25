import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Counts } from 'meteor/tmeasday:publish-counts';

class PaginationFactory {
  constructor(collection, settingsIn) {
    if (!(this instanceof Meteor.Pagination)) {
      // eslint-disable-next-line max-len
      throw new Meteor.Error(4000, 'The Meteor.Pagination instance has to be initiated with `new`');
    }

    const settings = _.extend(
      {
        filters: {},
        dynamic_filters() {
          return {};
        },
      },
      settingsIn || {}
    );

    if (typeof settings.filters !== 'object') {
      // eslint-disable-next-line max-len
      throw new Meteor.Error(4001, 'Invalid filters provided. Server side filters need to be an object!');
    }

    if (typeof settings.dynamic_filters !== 'function') {
      // eslint-disable-next-line max-len
      throw new Meteor.Error(4002, 'Invalid dynamic filters provided. Server side dynamic filters needs to be a function!');
    }

    this.publish(collection, settings);
  }

  publish(collection, settings) {
    Meteor.publish(collection._name, function addPub(query = {}, optionsInput = {}) {
      check(query, Match.Optional(Object));
      check(optionsInput, Match.Optional(Object));

      const self = this;
      let options = optionsInput;
      let findQuery = {};
      let filters = [];

      if (!_.isEmpty(query)) {
        filters.push(query);
      }

      if (!_.isEmpty(settings.filters)) {
        filters.push(settings.filters);
      }

      const dynamic_filters = settings.dynamic_filters.call(self);

      if (typeof dynamic_filters === 'object') {
        if (!_.isEmpty(dynamic_filters)) {
          filters.push(dynamic_filters);
        }
      } else {
        // eslint-disable-next-line max-len
        throw new Meteor.Error(4002, 'Invalid dynamic filters return type. Server side dynamic filters needs to be a function that returns an object!');
      }

      if (typeof settings.transform_filters === 'function') {
        filters = settings.transform_filters.call(self, filters, options);
      }

      if (typeof settings.transform_options === 'function') {
        options = settings.transform_options.call(self, filters, options);
      }


      if (filters.length > 0) {
        if (filters.length > 1) {
          findQuery.$and = filters;
        } else {
          findQuery = filters[0];
        }
      }

      Counts.publish(
        self,
        `sub_count_${self._subscriptionId}`,
        collection.find(findQuery),
        { noReady: true }
      );

      if (options.debug) {
        console.log(
          'Pagination',
          collection._name,
          'find',
          JSON.stringify(findQuery),
          JSON.stringify(options)
        );
      }

      const handle = collection.find(findQuery, options).observeChanges({
        added(id, fields) {
          const newFields = {};

          self.added(collection._name, id, fields);

          newFields[`sub_${self._subscriptionId}`] = 1;
          self.changed(collection._name, id, newFields);
        },
        changed(id, fields) {
          self.changed(collection._name, id, fields);
        },
        removed(id) {
          self.removed(collection._name, id);
        },
      });

      self.ready();

      self.onStop(() => {
        handle.stop();
      });
    });
  }
}

Meteor.Pagination = PaginationFactory;
