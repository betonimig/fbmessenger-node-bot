'use strict'

const FBMessengerRoute = require('./FBMessengerRoute')
const AnyCommand = require('./commands/AnyCommand')


class FBMessengerRouter {

    constructor(logger) {
        this._routes = []
        this._otherwiseController = null
        this._callbackQueryController = null
        this._logger = logger
    }

    when(commands, controller) {
        this._routes.push(new FBMessengerRoute(commands, controller))

        return this
    }

    /**
     * This child of FBMessengerBaseController will be called for all updates
     *
     * @param {FBMessengerBaseController} controller
     * @returns {FBMessengerRouter}
     */
    any(controller) {
        this._routes.push(new FBMessengerRoute(new AnyCommand(), controller))

        return this
    }

    /**
     * This child of FBMessengerBaseController will be called
     * if there is no controller for that update (except controller passed to 'any' method)
     *
     * @param {FBMessengerBaseController} controller
     * @returns {FBMessengerRouter}
     */
    otherwise(controller) {
        this._otherwiseController = controller

        return this
    }

    /**
     * @param {Scope} scope
     * @returns { { controller: FBmessengerBaseController, handler: string }[] }
     */
    controllersForScope(scope) {
        let controllers = []
        this._routes.forEach(route => {
            let command = route.test(scope)

            if (command !== false) {
                this._logger.log({
                    controller: route.controller.constructor.name,
                    command: command.constructor.name,
                    handlerName: command.handlerName||'handle'
                })
                let controllerRoutes = route.controller.routes
                let controllerHandler
                if (controllerRoutes && controllerRoutes[command.handlerName]) {
                    controllerHandler = controllerRoutes[command.handlerName]
                }
                else {
                    controllerHandler = 'handle'
                }
                controllers.push({
                    controller: route.controller,
                    handler: controllerHandler
                })
            }
        })

        if (controllers.length === 0 && this._otherwiseController !== null) {
            controllers.push({ controller: this._otherwiseController, handler: 'handle'})
        }

        return controllers
    }
}

module.exports = FBMessengerRouter

