"use strict";

class mySALESGUIDE {

    /**
     * @param {Window} window
     * @param {Object} options
     */
    constructor(window, options = {}) {
        this.online = true;
        this.callbacks = [];
        this.window = window;
        this.options = {
            defaultTimeout: 300000,
            defaultFilter: [],
            defaultOrder: [['created_at', this.ORDER_ASC]],
            defaultPage: 1,
            defaultLimit: 25,
        };
        this.options = Object.assign({}, this.options, !!options ? options : {});

        this.window.addEventListener('message', (event) => {
            this._onMessage(event)
        });

        if (typeof this.window.initPresentation === "function") {
            this.checkAvailable().then(() => {
                this.getInformation().then((information) => {
                    this.window.initPresentation(information);
                });
            });
        }
    }

    /**
     * @param {MessageEvent} event
     * @private
     */
    _onMessage(event) {
        if (!event.data) {
            return;
        }
        if (!event.data.hasOwnProperty('callback_identifier')) {
            return;
        }
        let callbackId = event.data.callback_identifier;
        if (!this.callbacks[callbackId]) {
            return;
        }
        if (this.callbacks[callbackId].timeout) {
            clearTimeout(this.callbacks[callbackId].defaultTimeout);
            this.callbacks[callbackId].timeout = null;
        }
        let parameters = !!event.data.callback_arguments ? event.data.callback_arguments : [];
        if (!!event.data.callback_success) {
            this.callbacks[callbackId].success.apply(null, parameters);
        } else {
            this.callbacks[callbackId].error.apply(null, ['mySALESGUIDE 3 API error', this.ERROR_API_UNKNOWN]);
        }
        delete this.callbacks[callbackId];
    }

    /**
     * @param {String} callbackId
     * @param {String|null} message
     * @param {Number|null} code
     * @private
     */
    _cancel(callbackId, message = 'Unknown Error.', code = 10001) {
        message = !!message ? message : 'Timeout.';
        code = !!code ? code : this.ERROR_API_TIMEOUT;
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

    /**
     * @param {String} method
     * @param {Object} parameters
     * @param {Number} timeout
     * @return {Promise}
     * @private
     */
    _invoke(method, parameters = {}, timeout = 0) {
        return new Promise((resolve, reject) => {
            let callbackId = this.uuid('callback');
            this.callbacks[callbackId] = {
                'success': resolve,
                'error': reject,
                'timeout': setTimeout(function () {
                    this._cancel(callbackId, 'Timeout.', this.ERROR_API_TIMEOUT);
                }.bind(this), !!timeout ? timeout : this.options.defaultTimeout)
            };
            try {
                if (!this.online) {
                    this._cancel(callbackId, 'mySALESGUIDE 3 API is offline.', this.ERROR_API_OFFLINE);
                    return;
                }
                let message = parameters || {};
                message.action = method;
                message.callback_identifier = callbackId;
                message = JSON.parse(JSON.stringify(message)); // check json data
                this._sendMessage(message);
            } catch (e) {
                this._cancel(callbackId, e.message, e.code);
            }
        });
    }

    /**
     * @param {Object} message
     * @private
     */
    _sendMessage(message) {
        if (typeof message !== "object") {
            return;
        }
        if (!message.action) {
            return;
        }
        this.window.parent.postMessage(message, '*');
    }

    /**
     * @return {Promise}
     */
    checkAvailable() {
        return new Promise((resolve, reject) => {
            if (!this.window.parent || this.window.parent === this.window) {
                this.online = false;
                this.window.console.error('mySALESGUIDE 3 JS-API is not available.');
                reject('mySALESGUIDE 3 JS-API is not available.', this.ERROR_API_OFFLINE);
                return;
            }
            this._invoke('checkAvailable', {}, 1000)
                .then(() => {
                    this.online = true;
                    resolve();
                })
                .catch((message, code) => {
                    reject(message, code);
                });
        });
    }

    /**
     * @param {String} url
     * @param {Boolean} close_presentation
     * @return {Promise}
     * @throws {Error}
     */
    openShortLink(url, close_presentation = false) {
        if (typeof url !== "string") {
            throw Error('Argument 1 passed to openShortLink must type of string.');
        }
        if (typeof close_presentation !== "boolean") {
            throw Error('Argument 2 passed to openShortLink must type of boolean.');
        }
        return this._invoke('openShortlink', {
            'url': url,
            'close_presentation': close_presentation
        });
    }

    /**
     * @param {String} url
     * @param {String} title
     * @return {Promise}
     * @throws {Error}
     */
    openPopup(url, title) {
        if (typeof url !== "string") {
            throw Error('Argument 1 passed to openPopup must type of string.');
        }
        if (typeof title !== "string") {
            throw Error('Argument 2 passed to openPopup must type of string.');
        }
        return this._invoke('openShortlink', {
            'url': url,
            'title': title
        });
    }

    /**
     * @param {String} url
     * @param {String} title
     * @return {Promise}
     * @throws {Error}
     */
    openBrowser(url, title) {
        if (typeof url !== "string") {
            throw Error('Argument 1 passed to openBrowser must type of string.');
        }
        if (typeof title !== "string") {
            throw Error('Argument 2 passed to openBrowser must type of string.');
        }
        return this._invoke('openBrowser', {'url': url, 'title': title});
    }

    /**
     * @param {String} attachment
     * @param {Object} options
     * @return {Promise}
     * @throws {Error}
     */
    openPdfViewer(attachment, options = {}) {
        if (typeof attachment !== "string") {
            throw Error('Argument 1 passed to openPdfViewer must type of string.');
        }
        if (typeof options !== "object") {
            throw Error('Argument 2 passed to openPdfViewer must type of object.');
        }
        if (attachment.indexOf('data:') === 0) {
            return this._invoke(
                'openPdfViewer',
                Object.assign({}, options, {'content': attachment})
            );
        }
        return this._invoke(
            'openPdfViewer',
            Object.assign({}, options, {'attachment_id': attachment})
        );
    }

    /**
     * @return {Promise}
     */
    getInformation() {
        return this._invoke('getInformation', {});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getUsers(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getUsers must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getUsers must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getUsers must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getUsers must type of number.');
        }
        return this._invoke(
            'getUsers',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} user_id
     * @return {Promise}
     * @throws {Error}
     */
    getUser(user_id) {
        if (typeof user_id !== "string") {
            throw Error('Argument 1 passed to getUser must type of string.');
        }
        return this._invoke('getUser', {'id': user_id});
    }

    /**
     * @return {Promise}
     */
    getMe() {
        return this._invoke('getMe', {});
    }

    /**
     * @param {Array} scopes
     * @return {Promise}
     * @throws {Error}
     */
    getAccessToken(scopes) {
        if (!Array.isArray(scopes)) {
            throw Error('Argument 1 passed to getAccessToken must type of array.');
        }
        return this._invoke('getAccessToken', {'scopes': scopes});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getGroups(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getGroups must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getGroups must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getGroups must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getGroups must type of number.');
        }
        return this._invoke(
            'getGroups',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} group_id
     * @return {Promise}
     * @throws {Error}
     */
    getGroup(group_id) {
        if (typeof group_id !== "string") {
            throw Error('Argument 1 passed to getGroup must type of string.');
        }
        return this._invoke('getGroup', {'id': group_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getPermissions(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getPermissions must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getPermissions must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getPermissions must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getPermissions must type of number.');
        }
        return this._invoke(
            'getPermissions',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} permission_id
     * @return {Promise}
     * @throws {Error}
     */
    getPermission(permission_id) {
        if (typeof permission_id !== "string") {
            throw Error('Argument 1 passed to getPermission must type of string.');
        }
        return this._invoke('getPermission', {'id': permission_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getLanguages(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getLanguages must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getLanguages must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getLanguages must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getLanguages must type of number.');
        }
        return this._invoke(
            'getLanguages',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} language_id
     * @return {Promise}
     * @throws {Error}
     */
    getLanguage(language_id) {
        if (typeof language_id !== "string") {
            throw Error('Argument 1 passed to getLanguage must type of string.');
        }
        return this._invoke('getLanguage', {'id': language_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getCountries(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getCountries must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getCountries must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getCountries must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getCountries must type of number.');
        }
        return this._invoke(
            'getCountries',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} country_id
     * @return {Promise}
     * @throws {Error}
     */
    getCountry(country_id) {
        if (typeof country_id !== "string") {
            throw Error('Argument 1 passed to getCountry must type of string.');
        }
        return this._invoke('getCountry', {'id': country_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getCrmIndustries(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getCrmIndustries must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getCrmIndustries must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getCrmIndustries must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getCrmIndustries must type of number.');
        }
        return this._invoke(
            'getCrmIndustries',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} crm_Industry_id
     * @return {Promise}
     * @throws {Error}
     */
    getCrmIndustry(crm_Industry_id) {
        if (typeof crm_Industry_id !== "string") {
            throw Error('Argument 1 passed to getCrmIndustry must type of string.');
        }
        return this._invoke('getCrmIndustry', {'id': crm_Industry_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getCrmPriorities(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getCrmPriorities must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getCrmPriorities must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getCrmPriorities must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getCrmPriorities must type of number.');
        }
        return this._invoke(
            'getCrmPriorities',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} crm_priority_id
     * @return {Promise}
     * @throws {Error}
     */
    getCrmPriority(crm_priority_id) {
        if (typeof crm_priority_id !== "string") {
            throw Error('Argument 1 passed to getCrmPriority must type of string.');
        }
        return this._invoke('getCrmPriority', {'id': crm_priority_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getCrmSources(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getCrmSources must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getCrmSources must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getCrmSources must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getCrmSources must type of number.');
        }
        return this._invoke(
            'getCrmSources',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} crm_source_id
     * @return {Promise}
     * @throws {Error}
     */
    getCrmSource(crm_source_id) {
        if (typeof crm_source_id !== "string") {
            throw Error('Argument 1 passed to getCrmSource must type of string.');
        }
        return this._invoke('getCrmSource', {'id': crm_source_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getCrmCompanies(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getCrmCompanies must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getCrmCompanies must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getCrmCompanies must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getCrmCompanies must type of number.');
        }
        return this._invoke(
            'getCrmCompanies',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} crm_company_id
     * @return {Promise}
     * @throws {Error}
     */
    getCrmCompany(crm_company_id) {
        if (typeof crm_company_id !== "string") {
            throw Error('Argument 1 passed to getCrmCompany must type of string.');
        }
        return this._invoke('getCrmCompany', {'id': crm_company_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     * @throws {Error}
     */
    saveCrmCompany(data) {
        if (typeof data !== "object") {
            throw Error('Argument 1 passed to saveCrmCompany must type of object.');
        }
        return this._invoke('saveCrmCompany', data);
    }

    /**
     * @param {String} crm_company_id
     * @return {Promise}
     * @throws {Error}
     */
    deleteCrmCompany(crm_company_id) {
        if (typeof crm_company_id === "object") {
            crm_company_id = crm_company_id._id;
        }
        if (typeof crm_company_id !== "string") {
            throw Error('Argument 1 passed to saveCrmCompany must type of string.');
        }
        return this._invoke('deleteCrmCompany', {'id': crm_company_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getCrmCompanyNotes(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getCrmCompanyNotes must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getCrmCompanyNotes must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getCrmCompanyNotes must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getCrmCompanyNotes must type of number.');
        }
        return this._invoke(
            'getCrmCompanyNotes',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} crm_company_note_id
     * @return {Promise}
     * @throws {Error}
     */
    getCrmCompanyNote(crm_company_note_id) {
        if (typeof crm_company_note_id !== "string") {
            throw Error('Argument 1 passed to getCrmCompanyNote must type of string.');
        }
        return this._invoke('getCrmCompanyNote', {'id': crm_company_note_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     * @throws {Error}
     */
    saveCrmCompanyNote(data) {
        if (typeof data !== "object") {
            throw Error('Argument 1 passed to saveCrmCompanyNote must type of object.');
        }
        return this._invoke('saveCrmCompanyNote', data);
    }

    /**
     * @param {String} crm_company_note_id
     * @return {Promise}
     * @throws {Error}
     */
    deleteCrmCompanyNote(crm_company_note_id) {
        if (typeof crm_company_note_id === "object") {
            crm_company_note_id = crm_company_note_id._id;
        }
        if (typeof crm_company_note_id !== "string") {
            throw Error('Argument 1 passed to deleteCrmCompanyNote must type of string.');
        }
        return this._invoke('deleteCrmCompanyNote', {'id': crm_company_note_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getCrmCompanyFiles(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getCrmCompanyFiles must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getCrmCompanyFiles must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getCrmCompanyFiles must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getCrmCompanyFiles must type of number.');
        }
        return this._invoke(
            'getCrmCompanyFiles',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} crm_company_file_id
     * @return {Promise}
     * @throws {Error}
     */
    getCrmCompanyFile(crm_company_file_id) {
        if (typeof crm_company_file_id !== "string") {
            throw Error('Argument 1 passed to getCrmCompanyFile must type of string.');
        }
        return this._invoke('getCrmCompanyFile', {'id': crm_company_file_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     * @throws {Error}
     */
    saveCrmCompanyFile(data) {
        if (typeof data !== "object") {
            throw Error('Argument 1 passed to saveCrmCompanyFile must type of object.');
        }
        return this._invoke('saveCrmCompanyFile', data);
    }

    /**
     * @param {String} crm_company_file_id
     * @return {Promise}
     * @throws {Error}
     */
    deleteCrmCompanyFile(crm_company_file_id) {
        if (typeof crm_company_file_id === "object") {
            crm_company_file_id = crm_company_file_id._id;
        }
        if (typeof crm_company_file_id !== "string") {
            throw Error('Argument 1 passed to deleteCrmCompanyFile must type of string.');
        }
        return this._invoke('deleteCrmCompanyFile', {'id': crm_company_file_id});
    }

    /**
     * @return {Promise}
     */
    selectCrmContact() {
        return this._invoke('selectCrmContact', {});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getCrmContacts(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getCrmContacts must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getCrmContacts must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getCrmContacts must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getCrmContacts must type of number.');
        }
        return this._invoke(
            'getCrmContacts',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} crm_contact_id
     * @return {Promise}
     * @throws {Error}
     */
    getCrmContact(crm_contact_id) {
        if (typeof crm_contact_id !== "string") {
            throw Error('Argument 1 passed to getCrmContact must type of string.');
        }
        return this._invoke('getCrmContact', {'id': crm_contact_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     * @throws {Error}
     */
    saveCrmContact(data) {
        if (typeof data !== "object") {
            throw Error('Argument 1 passed to saveCrmContact must type of object.');
        }
        return this._invoke('saveCrmContact', data);
    }

    /**
     * @param {String} crm_contact_id
     * @return {Promise}
     * @throws {Error}
     */
    deleteCrmContact(crm_contact_id) {
        if (typeof crm_contact_id === "object") {
            crm_contact_id = crm_contact_id._id;
        }
        if (typeof crm_contact_id !== "string") {
            throw Error('Argument 1 passed to deleteCrmContact must type of string.');
        }
        return this._invoke('deleteCrmContact', {'id': crm_contact_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getCrmContactNotes(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getCrmContactNotes must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getCrmContactNotes must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getCrmContactNotes must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getCrmContactNotes must type of number.');
        }
        return this._invoke(
            'getCrmContactNotes',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} crm_contact_note_id
     * @return {Promise}
     * @throws {Error}
     */
    getCrmContactNote(crm_contact_note_id) {
        if (typeof crm_contact_note_id !== "string") {
            throw Error('Argument 1 passed to getCrmContactNote must type of string.');
        }
        return this._invoke('getCrmContactNote', {'id': crm_contact_note_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     * @throws {Error}
     */
    saveCrmContactNote(data) {
        if (typeof data !== "object") {
            throw Error('Argument 1 passed to saveCrmContactNote must type of object.');
        }
        return this._invoke('saveCrmContactNote', data);
    }

    /**
     * @param {String} crm_contact_note_id
     * @return {Promise}
     * @throws {Error}
     */
    deleteCrmContactNote(crm_contact_note_id) {
        if (typeof crm_contact_note_id === "object") {
            crm_contact_note_id = crm_contact_note_id._id;
        }
        if (typeof crm_contact_note_id !== "string") {
            throw Error('Argument 1 passed to deleteCrmContactNote must type of string.');
        }
        return this._invoke('deleteCrmContactNote', {'id': crm_contact_note_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getCrmContactFiles(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getCrmContactFiles must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getCrmContactFiles must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getCrmContactFiles must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getCrmContactFiles must type of number.');
        }
        return this._invoke(
            'getCrmContactFiles',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} crm_contact_file_id
     * @return {Promise}
     * @throws {Error}
     */
    getCrmContactFile(crm_contact_file_id) {
        if (typeof crm_contact_file_id !== "string") {
            throw Error('Argument 1 passed to getCrmContactFile must type of string.');
        }
        return this._invoke('getCrmContactFile', {'id': crm_contact_file_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     * @throws {Error}
     */
    saveCrmContactFile(data) {
        if (typeof data !== "object") {
            throw Error('Argument 1 passed to saveCrmContactFile must type of object.');
        }
        return this._invoke('saveCrmContactFile', data);
    }

    /**
     * @param {String} crm_contact_file_id
     * @return {Promise}
     * @throws {Error}
     */
    deleteCrmContactFile(crm_contact_file_id) {
        if (typeof crm_contact_file_id === "object") {
            crm_contact_file_id = crm_contact_file_id._id;
        }
        if (typeof crm_contact_file_id !== "string") {
            throw Error('Argument 1 passed to deleteCrmContactFile must type of string.');
        }
        return this._invoke('deleteCrmContactFile', {'id': crm_contact_file_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getCustomDataDocs(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getCustomDataDocs must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getCustomDataDocs must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getCustomDataDocs must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getCustomDataDocs must type of number.');
        }
        return this._invoke(
            'getCustomDataDocs',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} custom_data_id
     * @return {Promise}
     * @throws {Error}
     */
    getCustomDataDoc(custom_data_id) {
        if (typeof custom_data_id !== "string") {
            throw Error('Argument 1 passed to getCustomDataDoc must type of string.');
        }
        return this._invoke('getCustomDataDoc', {'id': custom_data_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     * @throws {Error}
     * @throws {Error}
     */
    saveCustomData(data) {
        if (typeof data !== "object") {
            throw Error('Argument 1 passed to saveCustomData must type of object.');
        }
        if (typeof data.client_id !== "string") {
            throw Error('Argument 1 passed to saveCustomData must type of object with client_id.');
        }
        if (typeof data.custom_type !== "string") {
            throw Error('Argument 1 passed to saveCustomData must type of object with custom_type.');
        }
        if (typeof data.custom_key !== "string") {
            throw Error('Argument 1 passed to saveCustomData must type of object with custom_key.');
        }
        if (!data.client_id || !data.custom_type || !data.custom_key) {
            throw Error('Could not build custom_data key');
        }
        let id = 'custom_data::' + data.client_id + '::' + data.custom_type;
        if (!!data.user_id) {
            id += '::' + data.user_id;
        }
        data.id = id + '::' + data.custom_key;
        return this._invoke('saveCustomData', data);
    }

    /**
     * @param {String} custom_data_id
     * @return {Promise}
     * @throws {Error}
     */
    deleteCustomData(custom_data_id) {
        if (typeof custom_data_id === "object") {
            custom_data_id = custom_data_id._id;
        }
        if (typeof custom_data_id !== "string") {
            throw Error('Argument 1 passed to deleteCustomData must type of string.');
        }
        return this._invoke('deleteCustomData', {'id': custom_data_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getOwnFiles(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getOwnFiles must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getOwnFiles must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getOwnFiles must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getOwnFiles must type of number.');
        }
        return this._invoke(
            'getOwnFiles',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} own_file_id
     * @return {Promise}
     * @throws {Error}
     */
    getOwnFile(own_file_id) {
        if (typeof own_file_id !== "string") {
            throw Error('Argument 1 passed to getOwnFile must type of string.');
        }
        return this._invoke('getOwnFile', {'id': own_file_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     * @throws {Error}
     */
    saveOwnFile(data) {
        if (typeof data !== "object") {
            throw Error('Argument 1 passed to saveOwnFile must type of object.');
        }
        return this._invoke('saveOwnFile', data);
    }

    /**
     * @param {String} own_file_id
     * @return {Promise}
     * @throws {Error}
     */
    deleteOwnFile(own_file_id) {
        if (typeof own_file_id === "object") {
            own_file_id = own_file_id._id;
        }
        if (typeof own_file_id !== "string") {
            throw Error('Argument 1 passed to deleteOwnFile must type of string.');
        }
        return this._invoke('deleteOwnFile', {'id': own_file_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getFileManagerDocs(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getFileManagerDocs must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getFileManagerDocs must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getFileManagerDocs must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getFileManagerDocs must type of number.');
        }
        return this._invoke(
            'getFileManagerDocs',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} filemanager_id
     * @return {Promise}
     * @throws {Error}
     */
    getFileManagerDoc(filemanager_id) {
        if (typeof filemanager_id !== "string") {
            throw Error('Argument 1 passed to getFileManagerDoc must type of string.');
        }
        return this._invoke('getFileManagerDoc', {'id': filemanager_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getLinkGroups(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getLinkGroups must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getLinkGroups must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getLinkGroups must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getLinkGroups must type of number.');
        }
        return this._invoke(
            'getLinkGroups',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} link_group_id
     * @return {Promise}
     * @throws {Error}
     */
    getLinkGroup(link_group_id) {
        if (typeof link_group_id !== "string") {
            throw Error('Argument 1 passed to getLinkGroup must type of string.');
        }
        return this._invoke('getLinkGroup', {'id': link_group_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getLinks(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getLinks must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getLinks must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getLinks must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getLinks must type of number.');
        }
        return this._invoke(
            'getLinks',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} link_id
     * @return {Promise}
     * @throws {Error}
     */
    getLink(link_id) {
        if (typeof link_id !== "string") {
            throw Error('Argument 1 passed to getLink must type of string.');
        }
        return this._invoke('getLink', {'id': link_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     * @throws {Error}
     */
    getTags(filter = [], order = [], page = 0, limit = 0) {
        if (typeof filter !== "string") {
            throw Error('Argument 1 passed to getTags must type of array.');
        }
        if (typeof order !== "object") {
            throw Error('Argument 2 passed to getTags must type of array.');
        }
        if (typeof page !== "string") {
            throw Error('Argument 3 passed to getTags must type of number.');
        }
        if (typeof limit !== "object") {
            throw Error('Argument 4 passed to getTags must type of number.');
        }
        return this._invoke(
            'getTags',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            }
        );
    }

    /**
     * @param {String} tag_id
     * @return {Promise}
     * @throws {Error}
     */
    getTag(tag_id) {
        if (typeof tag_id !== "string") {
            throw Error('Argument 1 passed to getTag must type of string.');
        }
        return this._invoke('getTag', {'id': tag_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     * @throws {Error}
     */
    saveTag(data) {
        if (typeof data !== "object") {
            throw Error('Argument 1 passed to saveTag must type of object.');
        }
        return this._invoke('saveTag', data);
    }

    /**
     * @param {String} tag_id
     * @return {Promise}
     * @throws {Error}
     */
    deleteTag(tag_id) {
        if (typeof tag_id === "object") {
            tag_id = tag_id._id;
        }
        if (typeof tag_id !== "string") {
            throw Error('Argument 1 passed to deleteTag must type of string.');
        }
        return this._invoke('deleteTag', {'id': tag_id});
    }

    /**
     * @param {String} attachment_id
     * @return {Promise}
     * @throws {Error}
     */
    getAttachment(attachment_id) {
        if (typeof attachment_id !== "string") {
            throw Error('Argument 1 passed to getAttachment must type of string.');
        }
        return this._invoke('getAttachment', {'id': attachment_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     * @throws {Error}
     */
    saveAttachment(data) {
        if (typeof data !== "object") {
            throw Error('Argument 1 passed to saveAttachment must type of object.');
        }
        return this._invoke('saveAttachment', data);
    }

    /**
     * @param {String|null} prefix
     * @returns {string}
     */
    uuid(prefix = null) {
        return (!!prefix ? prefix + '_' : '') + ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0;
            let v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }));
    }

}

Object.defineProperties(mySALESGUIDE, {
    'VERSION': {value: '2.0.0', writeable: false, configurable: false, enumerable: true},
    'ERROR_API_UNKNOWN': {value: 10001, writeable: false, configurable: false, enumerable: true},
    'ERROR_API_TIMEOUT': {value: 10002, writeable: false, configurable: false, enumerable: true},
    'ERROR_API_OFFLINE': {value: 10003, writeable: false, configurable: false, enumerable: true},
    'ORDER_ASC': {value: 'asc', writeable: false, configurable: false, enumerable: true},
    'ORDER_DESC': {value: 'desc', writeable: false, configurable: false, enumerable: true}
});

export default mySALESGUIDE;
