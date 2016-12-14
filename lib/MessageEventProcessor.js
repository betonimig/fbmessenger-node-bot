'use strict'


class MessageEventProcessor {

    constructor(dataSource) {
        this._dataSource = dataSource
        this._waitingRequests = {}
        this._waitingCallbackQueries = {}
    }

    /**
     *
     * @param {Update} update
     */
    process(messageEvent) {

        if (messageEvent.message) {
            this._receivedMessage(messageEvent)
            return
        } else if (messageEvent.postback) {
            this._receivedPostback(messageEvent)
            return
        } else if (messageEvent.delivery) {
            log.info('messageEvent.delivery')
            return
        }
        log.info('Update was not handled', messageEvent)

        // if (messageEvent.optin) {
        //     receivedAuthentication(messageEvent);
        // } else if (messageEvent.delivery) {
        //     receivedDeliveryConfirmation(messageEvent);
        // } else {
        //     console.log("Webhook received unknown messageEvent: ", messageEvent);
        // }
    }

    _receivedMessage(event) {
        let userId = event.sender.id
        let scope = {
            update: event,
            api: this._dataSource.api,
            userId: userId
        }
        this._runControllers(scope)
    }

    _receivedPostback(event) {
        let userId = event.sender.id;
        let recipientID = event.recipient.id;
        let timeOfPostback = event.timestamp;

        // The 'payload' param is a developer-defined field which is set in a postback 
        // button for Structured Messages. 
        let payload = event.postback.payload;

        let scope = {
            update: event,
            api: this._dataSource.api,
            userId: userId
        }
        log.info('Received postback for user %d and page %d with payload \'%s\' ' + 
            'at %d', userId, recipientID, payload, timeOfPostback);

        this._runControllers(scope)
    }

    _runControllers(scope) {
        const controllers = this._dataSource.router.controllersForScope(scope)

        controllers.forEach(controller => {
            controller.controller.api = this._dataSource.api
            controller.controller.localization = this._dataSource.localization

            try {
                controller.controller[controller.handler](controller.controller.before(scope))
            }
            catch (e) {
                log.info('error '+e+' in controller '+controller)
            }
        })

        if (controllers.length === 0) {
            log.info('Cant find controller for event', event)
        }
    }
}

module.exports = MessageEventProcessor
