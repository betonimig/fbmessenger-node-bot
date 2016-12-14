'use strict'

const BaseCommand = require('./BaseCommand')

class RegexpCommand extends BaseCommand {
    /**
     * @param {RegExp} regexp
     * @param {string} [handler]
     */
    constructor(regexp, handler) {
        super()
        this._regexp = regexp
        this._handler = handler
    }

    /**
     * @param {Scope} scope
     * @returns {boolean}
     */
    test(scope) {
        log.debug('RegexpCommand.test()'.yellow)
        log.debug('_textPattern='.yellow, this._regexp)
        let text = '';
        if (scope.update.message){
            text = scope.update.message.text
        } else if (scope.update.postback){
            text = scope.update.postback.payload
        }
        log.debug('text='.cyan, text)
        return text && this._regexp.test(text)
    }

    /**
     * @returns {string}
     */
    get handlerName() {
        return this._handler
    }
}

module.exports = RegexpCommand