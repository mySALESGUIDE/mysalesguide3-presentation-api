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

Just include the file `src/api.js` in your presentation, and you are ready to go.
For examples see the `examples/` directory.

## Usage Examples

### Properties
* `mySalesGuide3Api.version`
* `mySalesGuide3Api.CRM_TYPE_CONTACTS`
* `mySalesGuide3Api.CRM_TYPE_COMPANIES`
* `mySalesGuide3Api.ERROR_API_NOT_AVAILABLE`
* `mySalesGuide3Api.ERROR_BASE64_OPEN_URL_ONLY_NATIVE`
* `mySalesGuide3Api.ERROR_SHORTLINK_OPEN_URL_ONLY_NATIVE`
* `mySalesGuide3Api.ERROR_SHORTLINK_OPEN_URL_NO_BROWSER`
* `mySalesGuide3Api.ERROR_INVALID_CRM_TYPE`

### Methods

#### isAvailable

```javascript
mySalesGuide3Api.isAvailable(function(isAvailable){
    if(isAvailable){
        console.log('API available. :)');
    } else {
        console.error('API not available. :(');
    }
});
```

#### openShortlink

```javascript
var error_handler = function(error_message, error_code){
    console.error('Error '+error_code+': '+error_message);
};
mySalesGuide3Api.openShortlink(function(){
    console.log('App navigated to url of link, folder or opened the file.');
}, error_handler, "/filemanager/filemanager::236a412c721");
  
// jump to file and close presentation
mySalesGuide3Api.openShortlink(null, error_handler, "/filemanager/filemanager::236a412c721", true);
```

#### getUser

```javascript
mySalesGuide3Api.getUser(function(user){
    console.log(user);
    // {"firstname": "Lukas", "_id": "user::2178624178", ...}
}, error_handler);
```

#### openPopup

```javascript
mySalesGuide3Api.openPopup(function(){
    console.log('Window opened. :)');
}, error_handler, 'http://www.google.com', 'Google');
```

#### openBrowser

```javascript
mySalesGuide3Api.openBrowser(function(){
    console.log('Window opened. :)');
}, error_handler, 'http://www.google.com');
```

#### selectCrm

```javascript
mySalesGuide3Api.selectCrm(function(contact){
    console.log(contact);
    // {"firstname": "Max", "_id": "crm_contacts::2178624178", ...}
    // null (on user aborted)
}, error_handler, 'crm_contacts');
  
mySalesGuide3Api.selectCrm(function(contactOrCompany){
    console.log(contactOrCompany);
    // {"firstname": "Max", "_id": "crm_company::2178624178", ...}
    // null (on user aborted)
}, error_handler, null);
```

#### saveCrmFile

```javascript
mySalesGuide3Api.saveCrmFile(function(){
    console.log('Contact/company saved.');
}, error_handler, 'crm_contacts::124224242', 'http://lorempixel.com/64/64', 'Testbild', 'image/png');
  
mySalesGuide3Api.saveCrmFile(function(){
    console.log('Contact/company saved.');
}, error_handler, 'crm_company::124224242', 'data:text/plain;base64,SGVsbG8gV29ybGQh', 'Testnotiz.txt', 'text/plain');
```

#### saveCrmNote

```javascript

mySalesGuide3Api.saveCrmNote(function(){
    console.log('Note saved.');
}, error_handler, 'crm_company::124224242', 'Dies ist eine normale Notiz mit Reminder!', false, null, new Date('2019-12-31'));
  
mySalesGuide3Api.saveCrmNote(function(){
    console.log('Note saved.');
}, error_handler, 'crm_company::124224242', 'Dies ist eine erledigte Notiz mit Deadline!', true, new Date('2017-12-31'));
```

#### storeCustomData

```javascript
mySalesGuide3Api.storeCustomData(function(){
    console.log('Saved :)');
}, error_handler, "my_data_1", "key123", false, {foo:"bar"});
```

#### getCustomData

```javascript
mySalesGuide3Api.getCustomData(function(data){
    console.log(data);
}, error_handler, "my_data_1", "key123", false);
```

#### listCustomData

```javascript
mySalesGuide3Api.listCustomData(function(list){
    console.log(list);
}, error_handler, "my_data_1");
```