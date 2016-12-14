'use strict'

const
    path = require('path'),
    bodyParser = require('body-parser'),
    express = require('express'),
    FBMessengerApi = require('./FBMessengerApi'),
    MessageEventProcessor = require('./MessageEventProcessor'),
    FBMessengerRouter = require('./routing/FBMessengerRouter'),
    Ivan = require('./localization/Ivan');


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
        this._validation_token = options.validation_token
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
            req.query['hub.verify_token'] === this._validation_token) {
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


module.exports = FBMessenger
