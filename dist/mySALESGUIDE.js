"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},_createClass=function(){function n(e,t){for(var i=0;i<t.length;i++){var n=t[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(e,t,i){return t&&n(e.prototype,t),i&&n(e,i),e}}();function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var mySALESGUIDE=function(){function n(e){var t=this,i=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{};_classCallCheck(this,n),this.online=!0,this.callbacks=[],this.window=e,this.options={defaultTimeout:3e5,defaultFilter:[],defaultOrder:[["created_at",this.ORDER_ASC]],defaultPage:1,defaultLimit:25},this.options=Object.assign({},this.options,i||{}),this.window.addEventListener("message",function(e){t._onMessage(e)}),this.information={},this.checkAvailable().then(function(){t.getInformation().then(function(e){t.information=e,"function"==typeof t.window.initPresentation&&t.window.initPresentation(t.information)})})}return _createClass(n,[{key:"_onMessage",value:function(e){if(e.data&&e.data.hasOwnProperty("callback_identifier")){var t=e.data.callback_identifier;if(this.callbacks[t]){this.callbacks[t].timeout&&(clearTimeout(this.callbacks[t].defaultTimeout),this.callbacks[t].timeout=null);var i=e.data.callback_arguments?e.data.callback_arguments:[];e.data.callback_success?this.callbacks[t].success.apply(null,i):this.callbacks[t].error.apply(null,i),delete this.callbacks[t]}}}},{key:"_onTimeout",value:function(e){var t=1<arguments.length&&void 0!==arguments[1]?arguments[1]:"Unknown Error.",i=2<arguments.length&&void 0!==arguments[2]?arguments[2]:10001;t=t||"Timeout.",i=i||this.ERROR_API_TIMEOUT,this.callbacks[e]&&(this.callbacks[e].timeout=null,this.callbacks[e].error.apply(null,[t,i]),delete this.callbacks[e])}},{key:"_invoke",value:function(o){var r=this,a=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{};return new Promise(function(e,t){var i=r.uuid("callback");r.callbacks[i]={success:e,error:t,timeout:setTimeout(function(){this._onTimeout(i,"Timeout.",this.ERROR_API_TIMEOUT)}.bind(r),r.options.defaultTimeout)};try{if(!r.online)return void r._onTimeout(i,"mySALESGUIDE 3 API is offline.",r.ERROR_API_OFFLINE);var n=a||{};n.action=o,n.callback_identifier=i,n=JSON.parse(JSON.stringify(n)),r._sendMessage(n)}catch(e){r._onTimeout(i,e.message,e.code)}})}},{key:"_sendMessage",value:function(e){"object"===(void 0===e?"undefined":_typeof(e))&&e.action&&this.window.parent.postMessage(e,"*")}},{key:"checkAvailable",value:function(){var t=this;return new Promise(function(e,i){if(!t.window.parent||t.window.parent===t.window)return t.online=!1,t.window.console.error("mySALESGUIDE 3 JS-API is not available."),void i("mySALESGUIDE 3 JS-API is not available.",t.ERROR_API_OFFLINE);t._invoke("checkAvailable",{}).then(function(){t.online=!0,e()}).catch(function(e,t){i(e,t)})})}},{key:"openShortLink",value:function(e,t){return this._invoke("openShortlink",{url:e,close_presentation:t})}},{key:"openPopup",value:function(e,t){return this._invoke("openShortlink",{url:e,title:t})}},{key:"openBrowser",value:function(e,t){return this._invoke("openBrowser",{url:e,title:t})}},{key:"openPdfViewer",value:function(e,t){return 0===e.indexOf("data:")?this._invoke("openPdfViewer",Object.assign({},t,{content:e})):this._invoke("openPdfViewer",Object.assign({},t,{attachment_id:e}))}},{key:"getInformation",value:function(){return this._invoke("getInformation",{})}},{key:"getUsers",value:function(e,t,i,n){return this._invoke("getUsers",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getUser",value:function(e){return this._invoke("getUser",{id:e})}},{key:"getMe",value:function(){return this._invoke("getMe",{})}},{key:"getAccessToken",value:function(e){return this._invoke("getAccessToken",{scopes:e})}},{key:"getGroups",value:function(e,t,i,n){return this._invoke("getGroups",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getGroup",value:function(e){return this._invoke("getGroup",{id:e})}},{key:"getPermissions",value:function(e,t,i,n){return this._invoke("getPermissions",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getPermission",value:function(e){return this._invoke("getPermission",{id:e})}},{key:"getLanguages",value:function(e,t,i,n){return this._invoke("getLanguages",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getLanguage",value:function(e){return this._invoke("getLanguage",{id:language_id})}},{key:"getCountries",value:function(e,t,i,n){return this._invoke("getCountries",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit},success,error)}},{key:"getCountry",value:function(e){return this._invoke("getCountry",{id:e})}},{key:"getCrmIndustries",value:function(e,t,i,n){return this._invoke("getCrmIndustries",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getCrmIndustry",value:function(e){return this._invoke("getCrmIndustry",{id:e})}},{key:"getCrmPriorities",value:function(e,t,i,n){return this._invoke("getCrmPriorities",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit},success,error)}},{key:"getCrmPriority",value:function(e){return this._invoke("getCrmPriority",{id:e})}},{key:"getCrmSources",value:function(e,t,i,n){return this._invoke("getCrmSources",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getCrmSource",value:function(e){return this._invoke("getCrmSource",{id:e})}},{key:"getCrmCompanies",value:function(e,t,i,n){return this._invoke("getCrmCompanies",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getCrmCompany",value:function(e){return this._invoke("getCrmCompany",{id:e})}},{key:"saveCrmCompany",value:function(e){return this._invoke("saveCrmCompany",e)}},{key:"deleteCrmCompany",value:function(e){return"object"===(void 0===e?"undefined":_typeof(e))&&(e=e._id),this._invoke("deleteCrmCompany",{id:e})}},{key:"getCrmCompanyNotes",value:function(e,t,i,n){return this._invoke("getCrmCompanyNotes",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getCrmCompanyNote",value:function(e){return this._invoke("getCrmCompanyNote",{id:e})}},{key:"saveCrmCompanyNote",value:function(e){return this._invoke("saveCrmCompanyNote",e)}},{key:"deleteCrmCompanyNote",value:function(e){return"object"===(void 0===e?"undefined":_typeof(e))&&(e=e._id),this._invoke("deleteCrmCompanyNote",{id:e})}},{key:"getCrmCompanyFiles",value:function(e,t,i,n){return this._invoke("getCrmCompanyFiles",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getCrmCompanyFile",value:function(e){return this._invoke("getCrmCompanyFile",{id:e})}},{key:"saveCrmCompanyFile",value:function(e){return this._invoke("saveCrmCompanyFile",e)}},{key:"deleteCrmCompanyFile",value:function(e){return"object"===(void 0===e?"undefined":_typeof(e))&&(e=e._id),this._invoke("deleteCrmCompanyFile",{id:e})}},{key:"selectCrmContact",value:function(){0<arguments.length&&void 0!==arguments[0]&&arguments[0],1<arguments.length&&void 0!==arguments[1]&&arguments[1];return this._invoke("selectCrmContact",{})}},{key:"getCrmContacts",value:function(e,t,i,n){return this._invoke("getCrmContacts",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getCrmContact",value:function(e){return this._invoke("getCrmContact",{id:e})}},{key:"saveCrmContact",value:function(e){return this._invoke("saveCrmContact",e)}},{key:"deleteCrmContact",value:function(e){return"object"===(void 0===e?"undefined":_typeof(e))&&(e=e._id),this._invoke("deleteCrmContact",{id:e})}},{key:"getCrmContactNotes",value:function(e,t,i,n){return this._invoke("getCrmContactNotes",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit},success,error)}},{key:"getCrmContactNote",value:function(e){return this._invoke("getCrmContactNote",{id:e})}},{key:"saveCrmContactNote",value:function(e){return this._invoke("saveCrmContactNote",e)}},{key:"deleteCrmContactNote",value:function(e){return"object"===(void 0===e?"undefined":_typeof(e))&&(e=e._id),this._invoke("deleteCrmContactNote",{id:e})}},{key:"getCrmContactFiles",value:function(e,t,i,n){return this._invoke("getCrmContactFiles",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit},success,error)}},{key:"getCrmContactFile",value:function(e){return this._invoke("getCrmContactFile",{id:e})}},{key:"saveCrmContactFile",value:function(e){return this._invoke("saveCrmContactFile",e)}},{key:"deleteCrmContactFile",value:function(e){return"object"===(void 0===e?"undefined":_typeof(e))&&(e=e._id),this._invoke("deleteCrmContactFile",{id:e})}},{key:"getCustomDataDocs",value:function(e,t,i,n){return this._invoke("getCustomDataDocss",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getCustomDataDoc",value:function(e){return this._invoke("getCustomDataDoc",{id:e})}},{key:"saveCustomData",value:function(e){return this._invoke("saveCustomData",e)}},{key:"deleteCustomData",value:function(e){return"object"===(void 0===e?"undefined":_typeof(e))&&(e=e._id),this._invoke("deleteCustomData",{id:e})}},{key:"getOwnFiles",value:function(e,t,i,n){return this._invoke("getOwnFiles",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getOwnFile",value:function(e){return this._invoke("getOwnFile",{id:e})}},{key:"saveOwnFile",value:function(e){return this._invoke("saveOwnFile",e)}},{key:"deleteOwnFile",value:function(e){return"object"===(void 0===e?"undefined":_typeof(e))&&(e=e._id),this._invoke("deleteOwnFile",{id:e})}},{key:"getFileManagerDocs",value:function(e,t,i,n){return this._invoke("getFileManagerDocs",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getFileManagerDoc",value:function(e){return this._invoke("getFileManagerDoc",{id:e})}},{key:"getLinkGroups",value:function(e,t,i,n){return this._invoke("getLinkGroups",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getLinkGroup",value:function(e){return this._invoke("getLinkGroup",{id:e})}},{key:"getLinks",value:function(e,t,i,n){return this._invoke("getLinks",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getLink",value:function(e){return this._invoke("getLink",{id:e})}},{key:"getTags",value:function(e,t,i,n){return this._invoke("getTags",{filter:e||this.options.defaultFilter,order:t||this.options.defaultOrder,page:i||this.options.defaultPage,limit:n||this.options.defaultLimit})}},{key:"getTag",value:function(e){return this._invoke("getTag",{id:e})}},{key:"saveTag",value:function(e){return this._invoke("saveTag",e)}},{key:"deleteTag",value:function(e){return"object"===(void 0===e?"undefined":_typeof(e))&&(e=e._id),this._invoke("deleteTag",{id:e})}},{key:"getAttachment",value:function(e){return this._invoke("getAttachment",{id:e})}},{key:"saveAttachment",value:function(e){return this._invoke("saveAttachment",e)}},{key:"uuid",value:function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:null;return(e?e+"_":"")+"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var t=16*Math.random()|0;return("x"===e?t:3&t|8).toString(16)})}}]),n}();Object.defineProperties(mySALESGUIDE,{VERSION:{value:"2.0.0",writeable:!1,configurable:!1,enumerable:!0},ERROR_API_UNKNOWN:{value:10001,writeable:!1,configurable:!1,enumerable:!0},ERROR_API_TIMEOUT:{value:10002,writeable:!1,configurable:!1,enumerable:!0},ERROR_API_OFFLINE:{value:10003,writeable:!1,configurable:!1,enumerable:!0},ORDER_ASC:{value:"asc",writeable:!1,configurable:!1,enumerable:!0},ORDER_DESC:{value:"desc",writeable:!1,configurable:!1,enumerable:!0}}),exports.default=mySALESGUIDE;