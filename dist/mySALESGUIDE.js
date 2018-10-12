(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["module", "exports"], factory);
    } else if (typeof exports !== "undefined") {
        factory(module, exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod, mod.exports);
        global.mySALESGUIDE = mod.exports;
    }
})(this, function (module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
    } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    var mySALESGUIDE = function () {

        /**
         * @param {Window} window
         * @param {Object} options
         */
        function mySALESGUIDE(window) {
            var _this = this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            _classCallCheck(this, mySALESGUIDE);

            this.online = true;
            this.callbacks = [];
            this.window = window;
            this.options = {
                defaultTimeout: 100000,
                defaultFilter: function defaultFilter(doc) {
                    if (typeof doc.datetime_deleted !== "undefined" && doc.datetime_deleted === 0) {
                        return doc;
                    }
                },
                defaultOrder: [['created_at', mySALESGUIDE.ORDER_ASC]],
                defaultPage: 1,
                defaultLimit: 25
            };
            this.options = Object.assign({}, this.options, !!options ? options : {});

            this.window.addEventListener('message', function (event) {
                _this._onMessage(event);
            });

            if (typeof this.window.initPresentation === "function") {
                this.checkAvailable().then(function () {
                    _this.getInformation().then(function (information) {
                        _this.window.initPresentation(information);
                    });
                });
            }
        }

        /**
         * @param {MessageEvent} event
         * @private
         */


        _createClass(mySALESGUIDE, [{
            key: "_onMessage",
            value: function _onMessage(event) {
                if (!event.data) {
                    return;
                }
                if (!event.data.hasOwnProperty('callback_identifier')) {
                    return;
                }
                var callbackId = event.data.callback_identifier;
                if (!this.callbacks[callbackId]) {
                    return;
                }
                if (this.callbacks[callbackId].timeout) {
                    clearTimeout(this.callbacks[callbackId].defaultTimeout);
                    this.callbacks[callbackId].timeout = null;
                }
                var parameters = !!event.data.callback_arguments ? event.data.callback_arguments : [];
                if (!!event.data.callback_success) {
                    window.console.log(callbackId, parameters);
                    this.callbacks[callbackId].success.apply(null, parameters);
                } else {
                    this.callbacks[callbackId].error.apply(null, ['mySALESGUIDE 3 API error', mySALESGUIDE.ERROR_API_UNKNOWN]);
                }
                delete this.callbacks[callbackId];
            }
        }, {
            key: "_cancel",
            value: function _cancel(callbackId) {
                var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Unknown Error.';
                var code = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10001;

                message = !!message ? message : 'Timeout.';
                code = !!code ? code : mySALESGUIDE.ERROR_API_TIMEOUT;
                code = typeof code === "undefined" ? mySALESGUIDE.ERROR_API_UNKNOWN : code;
                if (!this.callbacks[callbackId]) {
                    return;
                }
                if (this.callbacks[callbackId].timeout) {
                    clearTimeout(this.callbacks[callbackId].timeout);
                    this.callbacks[callbackId].timeout = null;
                }
                this.callbacks[callbackId].error.apply(null, [message, code]);
                delete this.callbacks[callbackId];
            }
        }, {
            key: "_invoke",
            value: function _invoke(method) {
                var _this2 = this;

                var parameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
                var timeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

                return new Promise(function (resolve, reject) {
                    var callbackId = _this2.uuid();
                    _this2.callbacks[callbackId] = {
                        'success': resolve,
                        'error': reject,
                        'timeout': setTimeout(function () {
                            this._cancel(callbackId, 'Timeout.', mySALESGUIDE.ERROR_API_TIMEOUT);
                        }.bind(_this2), !!timeout ? timeout : _this2.options.defaultTimeout)
                    };
                    try {
                        if (!_this2.online) {
                            _this2._cancel(callbackId, 'mySALESGUIDE 3 API is offline.', mySALESGUIDE.ERROR_API_OFFLINE);
                            return;
                        }
                        var message = parameters || {};
                        message.action = method;
                        message.callback_identifier = callbackId;
                        message.js_api_version = mySALESGUIDE.VERSION;
                        message = JSON.parse(JSON.stringify(message)); // check json data
                        _this2._sendMessage(message);
                    } catch (e) {
                        _this2._cancel(callbackId, e.message, typeof e.code === "undefined" ? mySALESGUIDE.ERROR_API_UNKNOWN : e.code);
                    }
                });
            }
        }, {
            key: "_sendMessage",
            value: function _sendMessage(message) {
                if ((typeof message === "undefined" ? "undefined" : _typeof(message)) !== "object") {
                    return;
                }
                if (!message.action) {
                    return;
                }
                this.window.parent.postMessage(message, '*');
            }
        }, {
            key: "checkAvailable",
            value: function checkAvailable() {
                var _this3 = this;

                return new Promise(function (resolve, reject) {
                    if (!_this3.window.parent || _this3.window.parent === _this3.window) {
                        _this3.online = false;
                        reject('mySALESGUIDE 3 JS-API is not available.', mySALESGUIDE.ERROR_API_OFFLINE);
                        return;
                    }
                    _this3._invoke('checkAvailable', {}, 1000).then(function () {
                        _this3.online = true;
                        resolve();
                    }).catch(function (message, code) {
                        reject(message, code);
                    });
                });
            }
        }, {
            key: "openShortLink",
            value: function openShortLink(url) {
                var close_presentation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

                if (typeof url !== "string") {
                    throw Error('Argument 1 passed to openShortLink must type of string.');
                }
                if (typeof close_presentation !== "boolean") {
                    throw Error('Argument 2 passed to openShortLink must type of boolean.');
                }
                return this._invoke('openShortLink', {
                    'url': url,
                    'close_presentation': close_presentation
                });
            }
        }, {
            key: "openPopup",
            value: function openPopup(url, title) {
                if (typeof url !== "string") {
                    throw Error('Argument 1 passed to openPopup must type of string.');
                }
                if (typeof title !== "string") {
                    throw Error('Argument 2 passed to openPopup must type of string.');
                }
                return this._invoke('openPopup', {
                    'url': url,
                    'title': title
                });
            }
        }, {
            key: "openBrowser",
            value: function openBrowser(url, title) {
                if (typeof url !== "string") {
                    throw Error('Argument 1 passed to openBrowser must type of string.');
                }
                if (typeof title !== "string") {
                    throw Error('Argument 2 passed to openBrowser must type of string.');
                }
                return this._invoke('openBrowser', {
                    'url': url,
                    'title': title
                });
            }
        }, {
            key: "openPdfViewer",
            value: function openPdfViewer(attachment) {
                var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                if (typeof attachment !== "string") {
                    throw Error('Argument 1 passed to openPdfViewer must type of string.');
                }
                if ((typeof options === "undefined" ? "undefined" : _typeof(options)) !== "object") {
                    throw Error('Argument 2 passed to openPdfViewer must type of object.');
                }
                if (attachment.indexOf('data:') === 0) {
                    return this._invoke('openPdfViewer', Object.assign({}, options, { 'content': attachment }));
                }
                return this._invoke('openPdfViewer', Object.assign({}, options, { 'attachment_id': attachment }));
            }
        }, {
            key: "getInformation",
            value: function getInformation() {
                return this._invoke('getInformation', {});
            }
        }, {
            key: "getUsers",
            value: function getUsers() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getUsers must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getUsers must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getUsers must type of number.');
                }
                return this._invoke('getUsers', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getUser",
            value: function getUser(user_id) {
                if (typeof user_id !== "string") {
                    throw Error('Argument 1 passed to getUser must type of string.');
                }
                return this._invoke('getUser', { 'id': user_id });
            }
        }, {
            key: "getMe",
            value: function getMe() {
                return this._invoke('getMe', {});
            }
        }, {
            key: "getAccessToken",
            value: function getAccessToken(scopes) {
                if (!Array.isArray(scopes)) {
                    throw Error('Argument 1 passed to getAccessToken must type of array.');
                }
                return this._invoke('getAccessToken', { 'scopes': scopes });
            }
        }, {
            key: "getGroups",
            value: function getGroups() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getGroups must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getGroups must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getGroups must type of number.');
                }
                return this._invoke('getGroups', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getGroup",
            value: function getGroup(group_id) {
                if (typeof group_id !== "string") {
                    throw Error('Argument 1 passed to getGroup must type of string.');
                }
                return this._invoke('getGroup', { 'id': group_id });
            }
        }, {
            key: "getPermissions",
            value: function getPermissions() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getPermissions must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getPermissions must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getPermissions must type of number.');
                }
                return this._invoke('getPermissions', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getPermission",
            value: function getPermission(permission_id) {
                if (typeof permission_id !== "string") {
                    throw Error('Argument 1 passed to getPermission must type of string.');
                }
                return this._invoke('getPermission', { 'id': permission_id });
            }
        }, {
            key: "getLanguages",
            value: function getLanguages() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getLanguages must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getLanguages must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getLanguages must type of number.');
                }
                return this._invoke('getLanguages', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getLanguage",
            value: function getLanguage(language_id) {
                if (typeof language_id !== "string") {
                    throw Error('Argument 1 passed to getLanguage must type of string.');
                }
                return this._invoke('getLanguage', { 'id': language_id });
            }
        }, {
            key: "getCountries",
            value: function getCountries() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getCountries must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getCountries must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getCountries must type of number.');
                }
                return this._invoke('getCountries', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getCountry",
            value: function getCountry(country_id) {
                if (typeof country_id !== "string") {
                    throw Error('Argument 1 passed to getCountry must type of string.');
                }
                return this._invoke('getCountry', { 'id': country_id });
            }
        }, {
            key: "getCrmIndustries",
            value: function getCrmIndustries() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getCrmIndustries must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getCrmIndustries must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getCrmIndustries must type of number.');
                }
                return this._invoke('getCrmIndustries', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getCrmIndustry",
            value: function getCrmIndustry(crm_industry_id) {
                if (typeof crm_industry_id !== "string") {
                    throw Error('Argument 1 passed to getCrmIndustry must type of string.');
                }
                return this._invoke('getCrmIndustry', { 'id': crm_industry_id });
            }
        }, {
            key: "getCrmPriorities",
            value: function getCrmPriorities() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getCrmPriorities must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getCrmPriorities must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getCrmPriorities must type of number.');
                }
                return this._invoke('getCrmPriorities', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getCrmPriority",
            value: function getCrmPriority(crm_priority_id) {
                if (typeof crm_priority_id !== "string") {
                    throw Error('Argument 1 passed to getCrmPriority must type of string.');
                }
                return this._invoke('getCrmPriority', { 'id': crm_priority_id });
            }
        }, {
            key: "getCrmSources",
            value: function getCrmSources() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getCrmSources must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getCrmSources must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getCrmSources must type of number.');
                }
                return this._invoke('getCrmSources', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getCrmSource",
            value: function getCrmSource(crm_source_id) {
                if (typeof crm_source_id !== "string") {
                    throw Error('Argument 1 passed to getCrmSource must type of string.');
                }
                return this._invoke('getCrmSource', { 'id': crm_source_id });
            }
        }, {
            key: "getCrmCompanies",
            value: function getCrmCompanies() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getCrmCompanies must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getCrmCompanies must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getCrmCompanies must type of number.');
                }
                return this._invoke('getCrmCompanies', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getCrmCompany",
            value: function getCrmCompany(crm_company_id) {
                if (typeof crm_company_id !== "string") {
                    throw Error('Argument 1 passed to getCrmCompany must type of string.');
                }
                return this._invoke('getCrmCompany', { 'id': crm_company_id });
            }
        }, {
            key: "saveCrmCompany",
            value: function saveCrmCompany(data) {
                if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object") {
                    throw Error('Argument 1 passed to saveCrmCompany must type of object.');
                }
                return this._invoke('saveCrmCompany', data);
            }
        }, {
            key: "deleteCrmCompany",
            value: function deleteCrmCompany(crm_company_id) {
                if ((typeof crm_company_id === "undefined" ? "undefined" : _typeof(crm_company_id)) === "object") {
                    crm_company_id = crm_company_id._id;
                }
                if (typeof crm_company_id !== "string") {
                    throw Error('Argument 1 passed to saveCrmCompany must type of string.');
                }
                return this._invoke('deleteCrmCompany', { 'id': crm_company_id });
            }
        }, {
            key: "getCrmCompanyNotes",
            value: function getCrmCompanyNotes() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getCrmCompanyNotes must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getCrmCompanyNotes must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getCrmCompanyNotes must type of number.');
                }
                return this._invoke('getCrmCompanyNotes', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getCrmCompanyNote",
            value: function getCrmCompanyNote(crm_company_note_id) {
                if (typeof crm_company_note_id !== "string") {
                    throw Error('Argument 1 passed to getCrmCompanyNote must type of string.');
                }
                return this._invoke('getCrmCompanyNote', { 'id': crm_company_note_id });
            }
        }, {
            key: "saveCrmCompanyNote",
            value: function saveCrmCompanyNote(data) {
                if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object") {
                    throw Error('Argument 1 passed to saveCrmCompanyNote must type of object.');
                }
                return this._invoke('saveCrmCompanyNote', data);
            }
        }, {
            key: "deleteCrmCompanyNote",
            value: function deleteCrmCompanyNote(crm_company_note_id) {
                if ((typeof crm_company_note_id === "undefined" ? "undefined" : _typeof(crm_company_note_id)) === "object") {
                    crm_company_note_id = crm_company_note_id._id;
                }
                if (typeof crm_company_note_id !== "string") {
                    throw Error('Argument 1 passed to deleteCrmCompanyNote must type of string.');
                }
                return this._invoke('deleteCrmCompanyNote', { 'id': crm_company_note_id });
            }
        }, {
            key: "getCrmCompanyFiles",
            value: function getCrmCompanyFiles() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getCrmCompanyFiles must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getCrmCompanyFiles must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getCrmCompanyFiles must type of number.');
                }
                return this._invoke('getCrmCompanyFiles', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getCrmCompanyFile",
            value: function getCrmCompanyFile(crm_company_file_id) {
                if (typeof crm_company_file_id !== "string") {
                    throw Error('Argument 1 passed to getCrmCompanyFile must type of string.');
                }
                return this._invoke('getCrmCompanyFile', { 'id': crm_company_file_id });
            }
        }, {
            key: "saveCrmCompanyFile",
            value: function saveCrmCompanyFile(data) {
                if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object") {
                    throw Error('Argument 1 passed to saveCrmCompanyFile must type of object.');
                }
                return this._invoke('saveCrmCompanyFile', data);
            }
        }, {
            key: "deleteCrmCompanyFile",
            value: function deleteCrmCompanyFile(crm_company_file_id) {
                if ((typeof crm_company_file_id === "undefined" ? "undefined" : _typeof(crm_company_file_id)) === "object") {
                    crm_company_file_id = crm_company_file_id._id;
                }
                if (typeof crm_company_file_id !== "string") {
                    throw Error('Argument 1 passed to deleteCrmCompanyFile must type of string.');
                }
                return this._invoke('deleteCrmCompanyFile', { 'id': crm_company_file_id });
            }
        }, {
            key: "selectCrmContact",
            value: function selectCrmContact() {
                var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                return this._invoke('selectCrmContact', { 'type': type });
            }
        }, {
            key: "getCrmContacts",
            value: function getCrmContacts() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getCrmContacts must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getCrmContacts must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getCrmContacts must type of number.');
                }
                return this._invoke('getCrmContacts', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getCrmContact",
            value: function getCrmContact(crm_contact_id) {
                if (typeof crm_contact_id !== "string") {
                    throw Error('Argument 1 passed to getCrmContact must type of string.');
                }
                return this._invoke('getCrmContact', { 'id': crm_contact_id });
            }
        }, {
            key: "saveCrmContact",
            value: function saveCrmContact(data) {
                if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object") {
                    throw Error('Argument 1 passed to saveCrmContact must type of object.');
                }
                return this._invoke('saveCrmContact', data);
            }
        }, {
            key: "deleteCrmContact",
            value: function deleteCrmContact(crm_contact_id) {
                if ((typeof crm_contact_id === "undefined" ? "undefined" : _typeof(crm_contact_id)) === "object") {
                    crm_contact_id = crm_contact_id._id;
                }
                if (typeof crm_contact_id !== "string") {
                    throw Error('Argument 1 passed to deleteCrmContact must type of string.');
                }
                return this._invoke('deleteCrmContact', { 'id': crm_contact_id });
            }
        }, {
            key: "getCrmContactNotes",
            value: function getCrmContactNotes() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getCrmContactNotes must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getCrmContactNotes must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getCrmContactNotes must type of number.');
                }
                return this._invoke('getCrmContactNotes', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getCrmContactNote",
            value: function getCrmContactNote(crm_contact_note_id) {
                if (typeof crm_contact_note_id !== "string") {
                    throw Error('Argument 1 passed to getCrmContactNote must type of string.');
                }
                return this._invoke('getCrmContactNote', { 'id': crm_contact_note_id });
            }
        }, {
            key: "saveCrmContactNote",
            value: function saveCrmContactNote(data) {
                if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object") {
                    throw Error('Argument 1 passed to saveCrmContactNote must type of object.');
                }
                return this._invoke('saveCrmContactNote', data);
            }
        }, {
            key: "deleteCrmContactNote",
            value: function deleteCrmContactNote(crm_contact_note_id) {
                if ((typeof crm_contact_note_id === "undefined" ? "undefined" : _typeof(crm_contact_note_id)) === "object") {
                    crm_contact_note_id = crm_contact_note_id._id;
                }
                if (typeof crm_contact_note_id !== "string") {
                    throw Error('Argument 1 passed to deleteCrmContactNote must type of string.');
                }
                return this._invoke('deleteCrmContactNote', { 'id': crm_contact_note_id });
            }
        }, {
            key: "getCrmContactFiles",
            value: function getCrmContactFiles() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getCrmContactFiles must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getCrmContactFiles must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getCrmContactFiles must type of number.');
                }
                return this._invoke('getCrmContactFiles', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getCrmContactFile",
            value: function getCrmContactFile(crm_contact_file_id) {
                if (typeof crm_contact_file_id !== "string") {
                    throw Error('Argument 1 passed to getCrmContactFile must type of string.');
                }
                return this._invoke('getCrmContactFile', { 'id': crm_contact_file_id });
            }
        }, {
            key: "saveCrmContactFile",
            value: function saveCrmContactFile(data) {
                if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object") {
                    throw Error('Argument 1 passed to saveCrmContactFile must type of object.');
                }
                return this._invoke('saveCrmContactFile', data);
            }
        }, {
            key: "deleteCrmContactFile",
            value: function deleteCrmContactFile(crm_contact_file_id) {
                if ((typeof crm_contact_file_id === "undefined" ? "undefined" : _typeof(crm_contact_file_id)) === "object") {
                    crm_contact_file_id = crm_contact_file_id._id;
                }
                if (typeof crm_contact_file_id !== "string") {
                    throw Error('Argument 1 passed to deleteCrmContactFile must type of string.');
                }
                return this._invoke('deleteCrmContactFile', { 'id': crm_contact_file_id });
            }
        }, {
            key: "getCustomDataDocs",
            value: function getCustomDataDocs() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getCustomDataDocs must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getCustomDataDocs must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getCustomDataDocs must type of number.');
                }
                return this._invoke('getCustomDataDocs', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getCustomDataDoc",
            value: function getCustomDataDoc(custom_data_id) {
                if (typeof custom_data_id !== "string") {
                    throw Error('Argument 1 passed to getCustomDataDoc must type of string.');
                }
                return this._invoke('getCustomDataDoc', { 'id': custom_data_id });
            }
        }, {
            key: "saveCustomData",
            value: function saveCustomData(data) {
                if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object") {
                    throw Error('Argument 1 passed to saveCustomData must type of object.');
                }
                if (typeof data.client_id !== "string") {
                    throw Error('Argument 1 passed to saveCustomData must type of object with client_id.');
                }
                if (typeof data.customType !== "string") {
                    throw Error('Argument 1 passed to saveCustomData must type of object with customType.');
                }
                if (typeof data.customKey !== "string") {
                    throw Error('Argument 1 passed to saveCustomData must type of object with customKey.');
                }
                if (!data.client_id || !data.customType || !data.customKey) {
                    throw Error('Could not build custom_data key');
                }
                var id = 'custom_data::' + data.client_id + '::' + data.customType;
                if (!!data.userId) {
                    id += '::' + data.userId;
                }
                data._id = id + '::' + data.customKey;
                return this._invoke('saveCustomData', data);
            }
        }, {
            key: "deleteCustomData",
            value: function deleteCustomData(custom_data_id) {
                if ((typeof custom_data_id === "undefined" ? "undefined" : _typeof(custom_data_id)) === "object") {
                    custom_data_id = custom_data_id._id;
                }
                if (typeof custom_data_id !== "string") {
                    throw Error('Argument 1 passed to deleteCustomData must type of string.');
                }
                return this._invoke('deleteCustomData', { 'id': custom_data_id });
            }
        }, {
            key: "getOwnFiles",
            value: function getOwnFiles() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getOwnFiles must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getOwnFiles must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getOwnFiles must type of number.');
                }
                return this._invoke('getOwnFiles', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getOwnFile",
            value: function getOwnFile(own_file_id) {
                if (typeof own_file_id !== "string") {
                    throw Error('Argument 1 passed to getOwnFile must type of string.');
                }
                return this._invoke('getOwnFile', { 'id': own_file_id });
            }
        }, {
            key: "saveOwnFile",
            value: function saveOwnFile(data) {
                if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object") {
                    throw Error('Argument 1 passed to saveOwnFile must type of object.');
                }
                return this._invoke('saveOwnFile', data);
            }
        }, {
            key: "deleteOwnFile",
            value: function deleteOwnFile(own_file_id) {
                if ((typeof own_file_id === "undefined" ? "undefined" : _typeof(own_file_id)) === "object") {
                    own_file_id = own_file_id._id;
                }
                if (typeof own_file_id !== "string") {
                    throw Error('Argument 1 passed to deleteOwnFile must type of string.');
                }
                return this._invoke('deleteOwnFile', { 'id': own_file_id });
            }
        }, {
            key: "getFileManagerDocs",
            value: function getFileManagerDocs() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getFileManagerDocs must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getFileManagerDocs must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getFileManagerDocs must type of number.');
                }
                return this._invoke('getFileManagerDocs', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getFileManagerDoc",
            value: function getFileManagerDoc(filemanager_id) {
                if (typeof filemanager_id !== "string") {
                    throw Error('Argument 1 passed to getFileManagerDoc must type of string.');
                }
                return this._invoke('getFileManagerDoc', { 'id': filemanager_id });
            }
        }, {
            key: "getLinkGroups",
            value: function getLinkGroups() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getLinkGroups must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getLinkGroups must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getLinkGroups must type of number.');
                }
                return this._invoke('getLinkGroups', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getLinkGroup",
            value: function getLinkGroup(link_group_id) {
                if (typeof link_group_id !== "string") {
                    throw Error('Argument 1 passed to getLinkGroup must type of string.');
                }
                return this._invoke('getLinkGroup', { 'id': link_group_id });
            }
        }, {
            key: "getLinks",
            value: function getLinks() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getLinks must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getLinks must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getLinks must type of number.');
                }
                return this._invoke('getLinks', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getLink",
            value: function getLink(link_id) {
                if (typeof link_id !== "string") {
                    throw Error('Argument 1 passed to getLink must type of string.');
                }
                return this._invoke('getLink', { 'id': link_id });
            }
        }, {
            key: "getTags",
            value: function getTags() {
                var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
                var page = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

                if (typeof filter !== "function" && typeof filter !== "string") {
                    filter = this.options.defaultFilter;
                }
                if (!Array.isArray(order)) {
                    throw Error('Argument 2 passed to getTags must type of array.');
                }
                if (!Number.isInteger(page)) {
                    throw Error('Argument 3 passed to getTags must type of number.');
                }
                if (!Number.isInteger(limit)) {
                    throw Error('Argument 4 passed to getTags must type of number.');
                }
                return this._invoke('getTags', {
                    'filter': filter.toString().replace(' defaultFilter', ''),
                    'order': order || this.options.defaultOrder,
                    'page': page || this.options.defaultPage,
                    'limit': limit || this.options.defaultLimit
                });
            }
        }, {
            key: "getTag",
            value: function getTag(tag_id) {
                if (typeof tag_id !== "string") {
                    throw Error('Argument 1 passed to getTag must type of string.');
                }
                return this._invoke('getTag', { 'id': tag_id });
            }
        }, {
            key: "saveTag",
            value: function saveTag(data) {
                if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object") {
                    throw Error('Argument 1 passed to saveTag must type of object.');
                }
                return this._invoke('saveTag', data);
            }
        }, {
            key: "deleteTag",
            value: function deleteTag(tag_id) {
                if ((typeof tag_id === "undefined" ? "undefined" : _typeof(tag_id)) === "object") {
                    tag_id = tag_id._id;
                }
                if (typeof tag_id !== "string") {
                    throw Error('Argument 1 passed to deleteTag must type of string.');
                }
                return this._invoke('deleteTag', { 'id': tag_id });
            }
        }, {
            key: "getAttachment",
            value: function getAttachment(attachment_id) {
                if (typeof attachment_id !== "string") {
                    throw Error('Argument 1 passed to getAttachment must type of string.');
                }
                return this._invoke('getAttachment', { 'id': attachment_id });
            }
        }, {
            key: "getAttachmentContent",
            value: function getAttachmentContent(attachment_id) {
                if ((typeof attachment_id === "undefined" ? "undefined" : _typeof(attachment_id)) === "object") {
                    attachment_id = attachment_id._id;
                }
                if (typeof attachment_id !== "string") {
                    throw Error('Argument 1 passed to getAttachmentContent must type of string.');
                }
                return this._invoke('getAttachmentContent', { 'id': attachment_id });
            }
        }, {
            key: "saveAttachment",
            value: function saveAttachment(data) {
                if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object") {
                    throw Error('Argument 1 passed to saveAttachment must type of object.');
                }
                if (typeof data.file_url !== "string") {
                    throw Error('Argument 1 passed to saveAttachment must type of object with key file_url.');
                }
                return this._invoke('saveAttachment', data);
            }
        }, {
            key: "uuid",
            value: function uuid() {
                var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                return (!!prefix ? prefix + '_' : '') + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0;
                    var v = c === 'x' ? r : r & 0x3 | 0x8;
                    return v.toString(16);
                });
            }
        }, {
            key: "version_compare",
            value: function version_compare(v1, v2) {
                var v1Array = v1.split('.');
                var v2Array = v2.split('.');
                for (var i = 0; i < v1Array.length; ++i) {
                    var a = v1Array[i];
                    var b = v2Array[i];
                    var aInt = parseInt(a, 10);
                    var bInt = parseInt(b, 10);
                    if (aInt === bInt) {
                        var aLex = a.substr(("" + aInt).length);
                        var bLex = b.substr(("" + bInt).length);
                        if (aLex === '' && bLex !== '') return 1;
                        if (aLex !== '' && bLex === '') return -1;
                        if (aLex !== '' && bLex !== '') return aLex > bLex ? 1 : -1;
                        continue;
                    } else if (aInt > bInt) {
                        return 1;
                    } else {
                        return -1;
                    }
                }
                return 0;
            }
        }]);

        return mySALESGUIDE;
    }();

    Object.defineProperties(mySALESGUIDE, {
        'VERSION': { value: '2.0.0', writeable: false, configurable: false, enumerable: true },
        'ERROR_API_UNKNOWN': { value: 10001, writeable: false, configurable: false, enumerable: true },
        'ERROR_API_TIMEOUT': { value: 10002, writeable: false, configurable: false, enumerable: true },
        'ERROR_API_OFFLINE': { value: 10003, writeable: false, configurable: false, enumerable: true },
        'ORDER_ASC': { value: 'asc', writeable: false, configurable: false, enumerable: true },
        'ORDER_DESC': { value: 'desc', writeable: false, configurable: false, enumerable: true }
    });

    exports.default = mySALESGUIDE;
    module.exports = exports["default"];
});