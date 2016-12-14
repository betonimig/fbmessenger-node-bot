'use strict'

const BaseCommand = require('./BaseCommand')

class TextCommand extends BaseCommand {
    /**
     * @param {string} textPattern
     * @param {string} [handler]
     */
    constructor(textPattern, handler) {
        super()
        this._textPattern = textPattern
        this._handler = handler
    }

    /**
     * @param {Scope} scope
     * @returns {boolean}
     */
    test(scope) {
        log.debug('TextCommand.test()'.yellow)
        log.debug('TextCommand.test()'.yellow, '_textPattern=',this._textPattern)
        if (!scope.update.message){
            return false
        }
        log.debug('text', scope.update.message.text)
        return scope.update.message.text &&
            scope.update.message.text.indexOf(this._textPattern) > -1
    }

    /**
     * @returns {string}
     */
    get handlerName() {
        return this._handler
    }
}

module.exports = TextCommand