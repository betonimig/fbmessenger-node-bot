'use strict'

const
    bodyParser = require('body-parser'),
    express = require('express'),
    request = require('request'),
    config = require('config'),
    FBMessengerApi = require('./FBMessengerApi'),
    MessageEventProcessor = require('./MessageEventProcessor'),
    FBMessengerRouter = require('./routing/FBMessengerRouter'),
    Ivan = require('./localization/Ivan'),
    path = require('path');;


// WebHook request format:
// {
//   "object":"page",
//   "entry":[
//     {
//       "id":"PAGE_ID",
//       "time":1458692752478,
//       "messaging":[
//         {
//           "sender":{
//             "id":"USER_ID"
//           },
//           "recipient":{
//             "id":"PAGE_ID"
//           },
//           "message": "text"
//         }
//       ]
//     }
//   ]
// } 

class FBMessenger {
    /**
     *
     * @param {string} token
     * @param {{
     * localization: Object[],
     * webhook: {port: number}
     * }} options
     */
    constructor(token, options) {
        options = options || {}
        this._token = token
        this._localization = new Ivan((options.localization || []))

        this._dataSource = {
            api: new FBMessengerApi(token),
            router: new FBMessengerRouter(),
            localization: this._localization
        }
        this._beforeUpdateFunction = null

        this._messageEventProcessor = new MessageEventProcessor(this._dataSource)

        let app = express()
        app.use(bodyParser.json())
        app.set('port', process.env.PORT || options.webhook.port)
        app.use('/testhtml', express.static('testhtml'))
        app.get('/privacypolicy', function(req, res) {
            res.sendFile(path.join(__dirname + '/../../privacypolicy.htm'));
        });
        app.get('/test', (req, res) => console.log('test'))
        app.get('/webhook', (req, res)=>{this._handleGet(req, res)})
        app.post('/webhook', (req, res)=>{this._handlePost(req, res)})

        app.listen(app.get('port'), () => console.log('Node app is running on port', app.get('port')))
    }

    /*
     * Use your own validation token. Check that the token used in the Webhook 
     * setup is the same token used here.
     *
     */
    _handleGet(req, res) {
        console.log(req)
        if (req.query['hub.mode'] === 'subscribe' &&
            req.query['hub.verify_token'] === config.get('fb.VALIDATION_TOKEN')) {
            console.log('Validating webhook');
            res.status(200).send(req.query['hub.challenge']);
        } else {
            console.error('Failed validation. Make sure the validation tokens match.');
            res.sendStatus(403);
        }
    }

    /*
     * All callbacks for Messenger are POST-ed. They will be sent to the same
     * webhook. Be sure to subscribe your app to your page to receive callbacks
     * for your page. 
     * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
     *
     */
    _handlePost(req, res) {

        let data = req.body;
        log.info(JSON.stringify(data))

        // Make sure this is a page subscription
        if (data.object == 'page') {
            // Iterate over each entry
            // There may be multiple if batched
            data.entry.forEach(this._entryProcess.bind(this));

            // Assume all went well.
            //
            // You must send back a 200, within 20 seconds, to let us know you've 
            // successfully received the callback. Otherwise, the request will time out.
            res.sendStatus(200);
        }
    }

    /**
     * Your handler function passed to this method will be called after getting
     * any update, but before it's processing.
     *
     * Also to your function will be passed callback function,
     * if you call that function with 'true' argument, then update handling will be continued,
     * else the update will not be handled.
     *
     * @param {beforeHandler} handler
     */
    before(handler) {
        this._beforeUpdateFunction = handler
    }

    _entryProcess(pageEntry) {
        let pageID = pageEntry.id;
        let timeOfEvent = pageEntry.time;
        // Iterate over each messaging event
        pageEntry.messaging.forEach(messageEvent => {
            if (!this._beforeUpdateFunction) {
                this._messageEventProcessor.process(messageEvent)
                return
            }

            this._beforeUpdateFunction(messageEvent, handle => {
                if (handle === true) {
                    this._messageEventProcessor.process(messageEvent)
                }
            })
            
        });
    }

    /**
     *
     * @returns {FBMessengerApi}
     */
    get api() {
        return this._dataSource.api
    }

    /**
     *
     * @returns {FBMessengerRouter}
     */
    get router() {
        return this._dataSource.router
    }
}


function receivedMessage(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;
    let timeOfMessage = event.timestamp;
    let message = event.message;

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    let messageId = message.mid;

    // You may get a text or attachment but not both
    let messageText = message.text;
    let messageAttachments = message.attachments;

    if (messageText) {

        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.
        switch (messageText) {
            case 'image':
                sendImageMessage(senderID);
                break;

            case 'button':
                sendButtonMessage(senderID);
                break;

            case 'generic':
                sendGenericMessage(senderID);
                break;

            case 'receipt':
                sendReceiptMessage(senderID);
                break;

            default:
                sendTextMessage(senderID, messageText);
        }
    } else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
    }
}


/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;
    let delivery = event.delivery;
    let messageIDs = delivery.mids;
    let watermark = delivery.watermark;
    let sequenceNumber = delivery.seq;

    if (messageIDs) {
        messageIDs.forEach(function(messageID) {
            console.log("Received delivery confirmation for message ID: %s",
                messageID);
        });
    }

    console.log("All message before %d were delivered.", watermark);
}


function sendTextMessage(recipientId, messageText) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData);
}


function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData

    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            let recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s",
                messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}



module.exports = FBMessenger
