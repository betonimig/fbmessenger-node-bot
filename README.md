# fbmessenger-node-bot
Very powerful module for creating Facebook Messenger bots.

## Get started

Now let's write simple bot!

```js
'use strict'
const FBMB = require('fbmessenger-node-bot'),
    FBMessenger = FBMB.FBMessenger,
    FBMessengerBaseController = FBMB.FBMessengerBaseController
    TextCommand = FBMB.TextCommand;

let fb = new FBMessenger(config.get('fb.PAGE_ACCESS_TOKEN'), { 
    webhook: config.get('fb.webhook'),
    validation_token: config.get('fb.VALIDATION_TOKEN')
})

class PingController extends FBMessengerBaseController {
    /**
     * @param {Scope} $
     */
    pingHandler($) {
        $.api.sendTextMessage('pong')
    }

    get routes() {
        return {
            'pingCommand': 'pingHandler'
        }
    }
}

fb.router
    .when(
        new TextCommand('ping', 'pingCommand'),
        new PingController()
    )
```
