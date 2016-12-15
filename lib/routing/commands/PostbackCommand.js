'use strict'

const BaseCommand = require('./BaseCommand')

class PostbackCommand extends BaseCommand {
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
        console.log('PostbackCommand.test()')
        console.log('_textPattern=' ,this._textPattern)
        if (!scope.update.postback) {
            return false
        }
        console.log('postback', scope.update.postback.payload)
        return scope.update.postback.payload &&
            scope.update.postback.payload.indexOf(this._textPattern) > -1
    }

    /**
     * @returns {string}
     */
    get handlerName() {
        return this._handler
    }
}

module.exports = PostbackCommand