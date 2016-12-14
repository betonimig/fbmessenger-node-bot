'use strict'

const FBMessenger = require('./lib/FBMessenger'),
    FBMessengerApi = require('./lib/FBMessengerApi'),
    FBMessengerRouter = require('./lib/routing/FBMessengerRouter'),
    FBMessengerRoute = require('./lib/routing/FBMessengerRoute'),
    TextCommand = require('./lib/routing/commands/TextCommand'),
    RegexpCommand = require('./lib/routing/commands/RegexpCommand'),
    PostbackCommand = require('./lib/routing/commands/PostbackCommand'),
    FBMessengerBaseController = require('./lib/FBMessengerBaseController');

module.exports = {
    FBMessenger,
    FBMessengerApi,
    FBMessengerRouter,
    FBMessengerRoute,
    TextCommand,
    RegexpCommand,
    PostbackCommand,
    FBMessengerBaseController
}