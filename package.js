Package.describe({
    "name": "kurounin:pagination",
    "summary": "Meteor pagination done right. Usable in ReactJS or Blaze templates.",
    "version": "1.0.7",
    "git": "https://github.com/Kurounin/Pagination.git"
});

Package.onUse(function (api) {
    api.versionsFrom("METEOR@1.2.1");
    api.use([
        "meteor-base",
        "underscore",
        "mongo",
        "tmeasday:publish-counts@0.7.2"
    ]);

    api.addFiles([
        "server/pagination.js"
    ], "server");

    api.use([
        "reactive-var",
        "reactive-dict",
        "ccorcos:subs-cache@0.0.5"
    ], "client");

    api.addFiles([
        "client/pagination.js"
    ], "client");
});