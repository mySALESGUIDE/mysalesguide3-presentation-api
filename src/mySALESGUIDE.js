"use strict";

class mySALESGUIDE {

    /**
     * @param {Window} window
     * @param {Object} options
     */
    constructor(window, options = {}) {
        this.ERROR_API_UNKNOWN = 10001;
        this.ERROR_API_TIMEOUT = 10002;
        this.ERROR_API_OFFLINE = 10003;

        this.ORDER_ASC = 'asc';
        this.ORDER_DESC = 'desc';

        this.online = true;
        this.callbackId = 0;
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

        this.information = {};
        this.isAvailable().then(() => {
            this.getInformation().then((information) => {
                this.information = information;
                if (typeof this.window.initPresentation === "function") {
                    this.window.initPresentation(this.information);
                }
            });
        });
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
            this.callbacks[callbackId].error.apply(null, parameters);
        }
        delete this.callbacks[callbackId];
    }

    /**
     * @param {String} callbackId
     * @param {String|null} message
     * @param {Number|null} code
     * @private
     */
    _onTimeout(callbackId, message = 'Unknown Error.', code = 10001) {
        message = !!message ? message : 'Timeout.';
        code = !!code ? code : this.ERROR_API_TIMEOUT;
        if (!this.callbacks[callbackId]) {
            return;
        }
        this.callbacks[callbackId].timeout = null;
        this.callbacks[callbackId].error.apply(null, [message, code]);
        delete this.callbacks[callbackId];
    }

    /**
     * @param {String} method
     * @param {Object} parameters
     * @return {Promise}
     * @private
     */
    _invoke(method, parameters = {}) {
        return new Promise((resolve, reject) => {
            let callbackId = 'callback' + (this.callbackId++);
            this.callbacks[callbackId] = {
                'success': resolve,
                'error': reject,
                'timeout': setTimeout(function () {
                    this._onTimeout(callbackId, 'Timeout.', this.ERROR_API_TIMEOUT);
                }.bind(this), this.options.defaultTimeout)
            };
            try {
                if (!this.online) {
                    this._onTimeout(callbackId, 'mySALESGUIDE 3 API is offline.', this.ERROR_API_OFFLINE);
                    return;
                }
                let message = parameters || {};
                message.action = method;
                message.callback_identifier = callbackId;
                this._sendMessage(message);
            } catch (e) {
                this._onTimeout(callbackId, e.message, e.code);
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
    isAvailable() {
        return new Promise((resolve, reject) => {
            if (!this.window.parent || this.window.parent === this.window) {
                this.online = false;
                this.window.console.error('mySALESGUIDE 3 JS-API is not available.');
                reject('mySALESGUIDE 3 JS-API is not available.', this.ERROR_API_OFFLINE);
                return;
            }
            this._invoke('isAvailable', {})
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
     */
    openShortLink(url, close_presentation) {
        return this._invoke('openShortlink', {
            'url': url,
            'close_presentation': close_presentation
        });
    }

    /**
     * @param {String} url
     * @param {String} title
     * @return {Promise}
     */
    openPopup(url, title) {
        return this._invoke('openShortlink', {
            'url': url,
            'title': title
        });
    }

    /**
     * @param {String} url
     * @param {String} title
     * @return {Promise}
     */
    openBrowser(url, title) {
        return this._invoke('openBrowser', {'url': url, 'title': title});
    }

    /**
     * @param {String} attachment
     * @param {Object} options
     * @return {Promise}
     */
    openPdfViewer(attachment, options) {
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
        return this._invoke('information', {});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getUsers(filter, order, page, limit) {
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
     */
    getUser(user_id) {
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
     */
    getAccessToken(scopes) {
        return this._invoke('getAccessToken', {'scopes': scopes});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getGroups(filter, order, page, limit) {
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
     */
    getGroup(group_id) {
        return this._invoke('getGroup', {'id': group_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getPermissions(filter, order, page, limit) {
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
     */
    getPermission(permission_id) {
        return this._invoke('getPermission', {'id': permission_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getLanguages(filter, order, page, limit) {
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
     * @param {String} permission_id
     * @return {Promise}
     */
    getLanguage(permission_id) {
        return this._invoke('getLanguage', {'id': language_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getCountries(filter, order, page, limit) {
        return this._invoke(
            'getCountries',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            },
            success,
            error
        );
    }

    /**
     * @param {String} country_id
     * @return {Promise}
     */
    getCountry(country_id) {
        return this._invoke('getCountry', {'id': country_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getCrmIndustries(filter, order, page, limit) {
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
     */
    getCrmIndustry(crm_Industry_id) {
        return this._invoke('getCrmIndustry', {'id': crm_Industry_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getCrmPriorities(filter, order, page, limit) {
        return this._invoke(
            'getCrmPriorities',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            },
            success,
            error
        );
    }

    /**
     * @param {String} crm_priority_id
     * @return {Promise}
     */
    getCrmPriority(crm_priority_id) {
        return this._invoke('getCrmPriority', {'id': crm_priority_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getCrmSources(filter, order, page, limit) {
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
     */
    getCrmSource(crm_source_id) {
        return this._invoke('getCrmSource', {'id': crm_source_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getCrmCompanies(filter, order, page, limit) {
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
     */
    getCrmCompany(crm_company_id) {
        return this._invoke('getCrmCompany', {'id': crm_company_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     */
    saveCrmCompany(data) {
        return this._invoke('saveCrmCompany', data);
    }

    /**
     * @param {String} crm_company_id
     * @return {Promise}
     */
    deleteCrmCompany(crm_company_id) {
        if (typeof crm_company_id === "object") {
            crm_company_id = crm_company_id._id;
        }
        return this._invoke('deleteCrmCompany', {'id': crm_company_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getCrmCompanyNotes(filter, order, page, limit) {
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
     */
    getCrmCompanyNote(crm_company_note_id) {
        return this._invoke('getCrmCompanyNote', {'id': crm_company_note_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     */
    saveCrmCompanyNote(data) {
        return this._invoke('saveCrmCompanyNote', data);
    }

    /**
     * @return {Promise}
     *
     * @param {String} crm_company_note_id
     */
    deleteCrmCompanyNote(crm_company_note_id) {
        if (typeof crm_company_note_id === "object") {
            crm_company_note_id = crm_company_note_id._id;
        }
        return this._invoke('deleteCrmCompanyNote', {'id': crm_company_note_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getCrmCompanyFiles(filter, order, page, limit) {
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
     */
    getCrmCompanyFile(crm_company_file_id) {
        return this._invoke('getCrmCompanyFile', {'id': crm_company_file_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     */
    saveCrmCompanyFile(data) {
        return this._invoke('saveCrmCompanyFile', data);
    }

    /**
     * @param {String} crm_company_file_id
     * @return {Promise}
     */
    deleteCrmCompanyFile(crm_company_file_id) {
        if (typeof crm_company_file_id === "object") {
            crm_company_file_id = crm_company_file_id._id;
        }
        return this._invoke('deleteCrmCompanyFile', {'id': crm_company_file_id});
    }

    /**
     * @return {Promise}
     */
    selectCrmContact(success = null, error = null) {
        return this._invoke('selectCrmContact', {});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getCrmContacts(filter, order, page, limit) {
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
     */
    getCrmContact(crm_contact_id) {
        return this._invoke('getCrmContact', {'id': crm_contact_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     */
    saveCrmContact(data) {
        return this._invoke('saveCrmContact', data);
    }

    /**
     * @param {String} crm_contact_id
     * @return {Promise}
     */
    deleteCrmContact(crm_contact_id) {
        if (typeof crm_contact_id === "object") {
            crm_contact_id = crm_contact_id._id;
        }
        return this._invoke('deleteCrmContact', {'id': crm_contact_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getCrmContactNotes(filter, order, page, limit) {
        return this._invoke(
            'getCrmContactNotes',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            },
            success,
            error
        );
    }

    /**
     * @param {String} crm_contact_note_id
     * @return {Promise}
     */
    getCrmContactNote(crm_contact_note_id) {
        return this._invoke('getCrmContactNote', {'id': crm_contact_note_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     */
    saveCrmContactNote(data) {
        return this._invoke('saveCrmContactNote', data);
    }

    /**
     * @param {String} crm_contact_note_id
     * @return {Promise}
     */
    deleteCrmContactNote(crm_contact_note_id) {
        if (typeof crm_contact_note_id === "object") {
            crm_contact_note_id = crm_contact_note_id._id;
        }
        return this._invoke('deleteCrmContactNote', {'id': crm_contact_note_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getCrmContactFiles(filter, order, page, limit) {
        return this._invoke(
            'getCrmContactFiles',
            {
                'filter': filter || this.options.defaultFilter,
                'order': order || this.options.defaultOrder,
                'page': page || this.options.defaultPage,
                'limit': limit || this.options.defaultLimit,
            },
            success,
            error
        );
    }

    /**
     * @param {String} crm_contact_file_id
     * @return {Promise}
     */
    getCrmContactFile(crm_contact_file_id) {
        return this._invoke('getCrmContactFile', {'id': crm_contact_file_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     */
    saveCrmContactFile(data) {
        return this._invoke('saveCrmContactFile', data);
    }

    /**
     * @param {String} crm_contact_file_id
     * @return {Promise}
     */
    deleteCrmContactFile(crm_contact_file_id) {
        if (typeof crm_contact_file_id === "object") {
            crm_contact_file_id = crm_contact_file_id._id;
        }
        return this._invoke('deleteCrmContactFile', {'id': crm_contact_file_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getCustomDataDocs(filter, order, page, limit) {
        return this._invoke(
            'getCustomDataDocss',
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
     */
    getCustomDataDoc(custom_data_id) {
        return this._invoke('getCustomDataDoc', {'id': custom_data_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     */
    saveCustomData(data) {
        return this._invoke('saveCustomData', data);
    }

    /**
     * @param {String} custom_data_id
     * @return {Promise}
     */
    deleteCustomData(custom_data_id) {
        if (typeof custom_data_id === "object") {
            custom_data_id = custom_data_id._id;
        }
        return this._invoke('deleteCustomData', {'id': custom_data_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getOwnFiles(filter, order, page, limit) {
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
     */
    getOwnFile(own_file_id) {
        return this._invoke('getOwnFile', {'id': own_file_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     */
    saveOwnFile(data) {
        return this._invoke('saveOwnFile', data);
    }

    /**
     * @param {String} own_file_id
     * @return {Promise}
     */
    deleteOwnFile(own_file_id) {
        if (typeof own_file_id === "object") {
            own_file_id = own_file_id._id;
        }
        return this._invoke('deleteOwnFile', {'id': own_file_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getFileManagerDocs(filter, order, page, limit) {
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
     */
    getFileManagerDoc(filemanager_id) {
        return this._invoke('getFileManagerDoc', {'id': filemanager_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getLinkGroups(filter, order, page, limit) {
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
     */
    getLinkGroup(link_group_id) {
        return this._invoke('getLinkGroup', {'id': link_group_id});
    }

    /**
     * @return {Promise}
     *
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     */
    getLinks(filter, order, page, limit) {
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
     */
    getLink(link_id) {
        return this._invoke('getLink', {'id': link_id});
    }

    /**
     * @param {Array} filter
     * @param {Array} order
     * @param {Number} page
     * @param {Number} limit
     * @return {Promise}
     */
    getTags(filter, order, page, limit) {
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
     */
    getTag(tag_id) {
        return this._invoke('getTag', {'id': tag_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     */
    saveTag(data) {
        return this._invoke('saveTag', data);
    }

    /**
     * @param {String} tag_id
     * @return {Promise}
     */
    deleteTag(tag_id) {
        if (typeof tag_id === "object") {
            tag_id = tag_id._id;
        }
        return this._invoke('deleteTag', {'id': tag_id});
    }

    /**
     * @param {String} attachment_id
     * @return {Promise}
     */
    getAttachment(attachment_id) {
        return this._invoke('getAttachment', {'id': attachment_id});
    }

    /**
     * @param {Object} data
     * @return {Promise}
     */
    saveAttachment(data) {
        return this._invoke('saveAttachment', data);
    }

}

export default mySALESGUIDE;
