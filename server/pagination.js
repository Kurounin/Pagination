var Pagination = (function () {
    function Pagination(collection) {
        if (!(this instanceof Meteor.Pagination)) {
            throw new Meteor.Error(4000, "The Meteor.Pagination instance has to be initiated with `new`");
        }

        this.publish(collection)
    }

    Pagination.prototype.publish = function(collection) {
        Meteor.publish(collection._name, function(query, options) {
            check(query, Match.Optional(Object));
            check(options, Match.Optional(Object));

            var self = this;
            query = query || {};
            options = options || {};

            Counts.publish(this, 'sub_count_' + self._subscriptionId, collection.find(query), {noReady: true});

            var handle = collection.find( query, options ).observeChanges({
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