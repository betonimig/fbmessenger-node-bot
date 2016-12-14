'use strict'

const Localization = require('./Localization')

/**
 * Localization class
 */
class Ivan {
    /**
     *
     * @param {Object[]} localizations
     */
    constructor(localizations) {
        this._localizations = []
        this._loc = {}

        const locHandler = {
            set: () => {
                throw 'Cant set value for localization'
            },
            get: (target, key, receiver) => {
                let loc = this.localizationForLanguage(key)
                if (loc) {
                    return this.localizationForLanguage(key)
                }
                else {
                    return Reflect.get(target, key, receiver)
                }
            }
        }
        localizations.forEach(localization => {
            if (!this._checkLocalization(localization)) throw `Wrong localization: ${localization}`

            this._localizations.push(Localization.deserialize(localization))
        })

        return new Proxy(this, locHandler)
    }

    /**
     * Translates localized string to other language
     *
     * @param {string} localizedString
     * @param {string} toLang
     * @returns {string}
     */
    translate(localizedString, toLang) {
        return this.loc[toLang][this.getPhraseKey(localizedString)]
    }

    /**
     * Returns phrases for language
     *
     * @param {string} lang
     * @returns {Object|null}
     */
    localizationForLanguage(lang) {
        let loc = this._localizations.find(localization => localization.lang === lang)
        return loc ? loc.phrases : null
    }

    /**
     * Returns language by phrase
     * 
     * @param inputPhrase
     * @returns {string|null}
     */
    languageByPhrase(inputPhrase) {
        for (const loc of this._localizations) {
            for (const phrase in loc.phrases) {
                if (loc.phrases[phrase] === inputPhrase) {
                    return loc.lang
                }
            }
        }
        
        return null
    }

    /**
     * Returns the key name of phrase
     * 
     * @param {string} inputPhrase
     * @returns {string|null}
     */
    getPhraseKey(inputPhrase) {
        for (const loc of this._localizations) {
            for (const phrase in loc.phrases) {
                if (loc.phrases[phrase] === inputPhrase) {
                    return phrase
                }
            }
        }

        return null
    }

    /**
     *
     * @param {Object} rawLocalization
     * @returns {Boolean}
     * @private
     */
    _checkLocalization(rawLocalization) {
        return rawLocalization.lang && rawLocalization.phrases
    }
}

module.exports = Ivan