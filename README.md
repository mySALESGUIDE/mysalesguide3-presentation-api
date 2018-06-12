# `mySALESGUIDE3` Presentation API

This is the official repository for the `mySALESGUIDE3` presentation API.
It provides an JavaScript-API to access functionalities and/or data of the `mySALESGUIDE3` app.
This API only works inside of a `mySALESGUIDE3` presentation.

If you want to know more about `mySALESGUIDE3` please visit [http://www.my-salesguide.com](http://www.my-salesguide.com) and contact us.

## Create a `mySALESGUIDE3` Presentation

A `mySALESGUIDE3` presentation is just a ZIP-file with HTML sources.
You can including CSS, JS, images, fonts, etc. by using relative paths.
*Note* not all ZIP-files are treated as presentation.
To be a valid presentation-ZIP it needs following requirements.
* `manifest.json` file exists in ZIP (can be empty)
* `index.html` file exists in ZIP (this is the start point of the presentation)

Common errors:
* Folder containing files is zipped instead of files itself (`manifest.json` and `index.html` are not on the root directory of the ZIP). Backend detects ZIP as normal ZIP and not as presentation.

## Use the Presentation API

```js
import { mySALESGUIDE } from "mySALESGUIDE";

window.initPresentation = function(information) {
    window.console.log('Presentation API is online',information);
};

const api = new mySALESGUIDE(window,{
    defaultTimeout: 100000, // 10 sec. per default
    defaultLimit: 100 // 100 items per default
});
```

or

```js
import { mySALESGUIDE } from "mySALESGUIDE";

const api = new mySALESGUIDE(window,{
    defaultTimeout: 100000, // 10 sec. per default
    defaultLimit: 100 // 100 items per default
});

api.checkAvailable().then((information) => {
    api.selectCrmContact().then((crm) => {
        window.console.log(crm);
    }).catch((message, code) => {
        window.console.log('ERROR[',code,']',message);
    });
}).catch((message, code) => {
    window.console.log('ERROR[',code,']',message);
});
```
