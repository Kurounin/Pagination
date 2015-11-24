var fs = Npm.require('fs'),
    path = Npm.require('path'),
    meteorPackages = fs.readFileSync(path.resolve('.meteor/packages'), 'utf8');

function isBlazeUsed() {
    return !!meteorPackages.match(/blaze-html-templates\n/);
}

function isReactUsed() {
    return !!meteorPackages.match(/react\n/);
}

Package.describe({
    "name": "kurounin:pagination",
    "summary": "Meteor pagination done right. Usable in ReactJS or Blaze templates.",
    "version": "1.0.6",
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

    if (isBlazeUsed()) {
        api.use([
            "templating",
            "blaze"
        ], "client");

        api.addFiles([
            "client/template.html",
            "client/template.js"
        ], "client");
    }

    if (isReactUsed()) {
        api.use([
            "react"
        ], "client");

        api.addFiles([
            "client/paginator.jsx"
        ], "client");

        api.export("DefaultBootstrapPaginator", "client");
    }

    api.addFiles([
        "client/pagination.js"
    ], "client");
});