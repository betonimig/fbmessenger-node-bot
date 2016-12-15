'use strict'

const request = require('request')

/**
 * Facebook messenger API class
 */
class FBMessengerApi {
    constructor(token, logger, notificationType) {
        this.token = token
        this.notificationType = notificationType || 'REGULAR'
        this._url = 'https://graph.facebook.com/v2.6/'
        this._logger = logger
    }

    sendAction(id, action) {
        return this.sendMessage(id, action)
    }

    sendTextMessage(id, text, notificationType) {
        const messageData = {
            text: text
        }
        return this.sendMessage(id, messageData, notificationType)
    }

    sendImageMessage(id, imageURL, notificationType) {
        const messageData = {
            'attachment': {
                'type': 'image',
                'payload': {
                    'url': imageURL
                }
            }
        }
        return this.sendMessage(id, messageData, notificationType)
    }

    sendHScrollMessage(id, elements, notificationType) {
        const messageData = {
            'attachment': {
                'type': 'template',
                'payload': {
                    'template_type': 'generic',
                    'elements': elements
                }
            }
        }
        return this.sendMessage(id, messageData, notificationType)
    }

    sendButtonsMessage(id, text, buttons, notificationType) {
        const messageData = {
            'attachment': {
                'type': 'template',
                'payload': {
                    'template_type': 'button',
                    'text': text,
                    'buttons': buttons
                }
            }
        }
        return this.sendMessage(id, messageData, notificationType)
    }

    sendReceiptMessage(id, payload, notificationType) {
        payload.template_type = 'receipt'
        const messageData = {
            'attachment': {
                'type': 'template',
                'payload': payload
            }
        }
        return this.sendMessage(id, messageData, notificationType)
    }

    sendQuickRepliesMessage(id, attachment, quickReplies, notificationType) {
        const attachmentType = (typeof attachment === 'string' ? 'text' : 'attachment')
        const attachmentObject = typeof attachment === 'string' ? attachment : {
            type: 'template',
            'payload': {
                'template_type': 'generic',
                'elements': attachment
            }
        }
        const messageData = {
            [attachmentType]: attachmentObject,
            'quick_replies': quickReplies
        }
        return this.sendMessage(id, messageData, notificationType)
    }

    sendMessage(id, data, notificationType = this.notificationType) {

        const json = {
            recipient: {
                id: id
            }
        }

        if (typeof data === 'string') {
            json.sender_action = data
        } else {
            json.message = data
            json.notification_type = notificationType
        }

        const req = {
            url: `${this._url}me/messages`,
            qs: { access_token: this.token },
            method: 'POST',
            json: json
        }

        let reqPromise = sendRequest(req)
        reqPromise
        .then(body=>this._logger.log({'api response': JSON.stringify(body)}))
        .catch(err=>this._logger.error({'api error': JSON.stringify(err)}))
        if (typeof notificationType === 'function') {
            reqPromise.then(notificationType)
        }
        return reqPromise
    }

    getProfile(id) {
        const req = {
            method: 'GET',
            uri: `${this._url}${id}`,
            qs: {
                fields: 'first_name,last_name,profile_pic,locale,timezone,gender',
                access_token: this.token
            },
            json: true
        }
        return sendRequest(req)
    }

    setWelcomeMessage(pageId, message, cb) {
        if (typeof message === 'string') {
            message = {
                text: message
            }
        } else {
            message = {
                attachment: {
                    type: 'template',
                    payload: message
                }
            }
        }
        const jsonObject = {
            setting_type: 'call_to_actions',
            thread_state: 'new_thread',
            call_to_actions: [{
                message: message
            }]
        }
        this.sendThreadSettingsMessage(pageId, jsonObject, cb)
    }

    setGreetingText(pageId, message, cb) {
        const jsonObject = {
            setting_type: 'greeting',
            greeting: {
                text: message
            }
        }
        this.sendThreadSettingsMessage(pageId, jsonObject, cb)
    }

    setPersistentMenu(pageId, menuItems, cb) {
        const jsonObject = {
            setting_type: 'call_to_actions',
            thread_state: 'existing_thread',
            call_to_actions: menuItems
        }
        this.sendThreadSettingsMessage(pageId, jsonObject, cb)
    }

    sendThreadSettingsMessage(pageId, jsonObject, cb) {
        const req = {
            method: 'POST',
            uri: `${this._url}${pageId}/thread_settings`,
            qs: {
                access_token: this.token
            },
            json: jsonObject
        }
        return sendRequest(req)
    }
}

const sendRequest = (req) => {
    return new Promise((resolve, reject)=>{
        request(req, (err, res, body) => {
            if (err) return reject(err)
            if (body.error) return reject(body.error)
            resolve(body)
        })
    })
}

module.exports = FBMessengerApi
