Package.describe({
  name: 'kurounin:pagination',
  summary: 'Meteor pagination done right. Usable in ReactJS or Blaze templates.',
  version: '1.0.14',
  git: 'https://github.com/Kurounin/Pagination.git',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('METEOR@1.2.1');
  api.use([
    'ecmascript',
    'meteor-base',
    'check',
    'underscore',
    'mongo',
    'tmeasday:publish-counts@0.8.0',
  ]);

  api.addFiles([
    'server/pagination.js',
  ], 'server');

  api.use([
    'reactive-var',
    'reactive-dict',
  ], 'client');

  api.addFiles([
    'client/pagination.js',
  ], 'client');
});
