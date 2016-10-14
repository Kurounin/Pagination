var Pagination = (function () {
    function Pagination(collection, settings) {
        if (!(this instanceof Meteor.Pagination)) {
            throw new Meteor.Error(4000, "The Meteor.Pagination instance has to be initiated with `new`");
        }

        settings = _.extend(
            {
                filters: {},
                dynamic_filters: function () {
                    return {};
                }
            },
            settings || {}
        );

        if (typeof settings.filters != 'object') {
            throw new Meteor.Error(4001, "Invalid filters provided. Server side filters need to be an object!");
        }

        if (typeof settings.dynamic_filters != 'function') {
            throw new Meteor.Error(4002, "Invalid dynamic filters provided. Server side dynamic filters needs to be a function!");
        }

        this.publish(collection, settings)
    }

    Pagination.prototype.publish = function(collection, settings) {
        Meteor.publish(collection._name, function(query, options) {
            check(query, Match.Optional(Object));
            check(options, Match.Optional(Object));

            var self = this,
                findQuery = {},
                filters = [];
            query = query || {};
            options = options || {};

            if (!_.isEmpty(query)) {
                filters.push(query);
            }

            if (!_.isEmpty(settings.filters)) {
                filters.push(settings.filters);
            }

            var dynamic_filters = settings.dynamic_filters.call(self);

            if (typeof dynamic_filters == 'object') {
                if (!_.isEmpty(dynamic_filters)) {
                    filters.push(dynamic_filters);
                }
            } else {
                throw new Meteor.Error(4002, "Invalid dynamic filters return type. Server side dynamic filters needs to be a function that returns an object!");
            }

            if (filters.length > 0) {
                if (filters.length > 1) {
                    findQuery['$and'] = filters;
                } else {
                    findQuery = filters[0];
                }
            }

            Counts.publish(self, 'sub_count_' + self._subscriptionId, collection.find(findQuery), {noReady: true});

            var handle = collection.find( findQuery, options ).observeChanges({
                added: function (id, fields) {
                    var newFields = {};

                    self.added(collection._name, id, fields);

                    newFields['sub_' + self._subscriptionId] = 1;
                    self.changed(collection._name, id, newFields);
                },
                changed: function (id, fields) {
                    self.changed(collection._name, id, fields);
                },
                removed: function (id) {
                    self.removed(collection._name, id);
                }
            });

            self.ready();

            self.onStop(function () {
                handle.stop();
            });
        });
    };

    return Pagination;
})();

Meteor.Pagination = Pagination;
