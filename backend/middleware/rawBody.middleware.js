'use strict';

const express = require('express');

const rawBodyMiddleware = express.raw({
  type: 'application/json',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
});

module.exports = rawBodyMiddleware;
