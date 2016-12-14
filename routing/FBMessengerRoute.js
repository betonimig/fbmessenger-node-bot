'use strict'


class FBMessengerRoute {
    /**
     * @param {BaseCommand|BaseCommand[]} commands
     * @param {FBMessengerBaseController} controller
     */
    constructor(commands, controller) {
        this._commands = Array.isArray(commands) ? commands : [commands]
        this._controller = controller
    }

    /**
     * @returns {BaseCommand[]}
     */
    get commands() {
        return this._commands
    }

    /**
     * @returns {FBMessengerBaseController}
     */
    get controller() {
        return this._controller
    }

    /**
     * @param {Scope} scope
     * @returns {boolean|BaseCommand}
     */
    test(scope) {
        log.debug('Scope'.yellow, scope)
        for (let command of this._commands) {
            if (command.test(scope) == true) {
                return command
            }
        }

        return false
    }
}


module.exports = FBMessengerRoute