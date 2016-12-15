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
        } else if (messageEvent.postback) {
            this._receivedPostback(messageEvent)
        } else if (messageEvent.delivery) {
            this._receivedDeliveryConfirmation(messageEvent)
        } else {
            this._dataSource.logger.warn({'Update was not handled': messageEvent})
        }
        // if (messageEvent.optin) {
        //     receivedAuthentication(messageEvent);
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
        this._dataSource.logger.log({
            'Received postback': '',
            'for user': userId,
            'page': recipientID,
            'payload': payload,
            'at': timeOfPostback
        });

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
                this._dataSource.logger.error({
                    'error': e,
                    'in controller': controller,
                    'for update': scope.update
                })
            }
        })

        if (controllers.length === 0) {
            this._dataSource.logger.warn({
                'Cant find controller for update': scope.update
            })
        }
    }

    /*
     * Delivery Confirmation Event
     *
     * This event is sent to confirm the delivery of a message. Read more about 
     * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference#message_delivery
     *
     */
    _receivedDeliveryConfirmation(event) {
        let delivery = event.delivery,
            messageIDs = delivery.mids,
            watermark = delivery.watermark

        if (messageIDs) {
            messageIDs.forEach(function(messageID) {
                this._dataSource.logger.log({'Received delivery confirmation for message ID:': messageID})
            });
        }

        this._dataSource.logger.log({'All message before %d were delivered.': watermark})
    }
}

module.exports = MessageEventProcessor
