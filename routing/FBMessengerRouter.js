'use strict'

const FBMessengerRoute = require('./FBMessengerRoute')
const AnyCommand = require('./commands/AnyCommand')


class FBMessengerRouter {

    constructor() {
        this._routes = []
        this._otherwiseController = null

        this._callbackQueryController = null
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
            log.debug('Route='.yellow, route.controller.constructor.name)

            let command = route.test(scope)

            if (command !== false) {
                log.debug(command.constructor.name, 'true')
                log.debug('command.handlerName'.yellow, command.handlerName)
                let controllerRoutes = route.controller.routes
                log.debug('controllerRoutes'.yellow, controllerRoutes)
                let controllerHandler

                if (controllerRoutes && controllerRoutes[command.handlerName]) {
                    controllerHandler = controllerRoutes[command.handlerName]
                }
                else {
                    controllerHandler = 'handle'
                }
                log.debug('controllerHandler'.yellow, controllerHandler)
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

