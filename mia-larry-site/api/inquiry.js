'use strict';

const { createHandler } = require('../lib/handler');
const { puppies } = require('../data/puppies.json');

module.exports = createHandler({ puppies });
