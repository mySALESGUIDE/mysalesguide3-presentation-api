/**
 * This class represents the API to interact with mySALESGUIDE 3.0
 * app from within presentations.
 *
 * A global object named "mySalesGuide3Api" will be exposed to the global scope.
 *
 * @class mySalesGuide3Api
 */
(function () {
    "use strict";

    var API = {};
    var API_METHOD_IS_AVAILABLE = 'isAvailable';
    var API_METHOD_OPEN_SHORT_LINK = 'shortLink';
    var API_METHOD_GET_USER = 'getUser';
    var API_METHOD_OPEN_POPUP = 'openPopup';
    var API_METHOD_OPEN_BROWSER = 'openBrowser';
    var API_METHOD_SELECT_CRM = 'selectCrm';
    var API_METHOD_SAVE_CRM_FILE = 'saveCrmFile';
    var API_METHOD_SAVE_CRM_NOTE = 'saveCrmNote';
    var API_METHOD_STORE_CUSTOM_DATA = 'storeCustomData';
    var API_METHOD_GET_CUSTOM_DATA = 'getCustomData';
    var API_METHOD_LIST_CUSTOM_DATA = 'listCustomData';

    API.version = '1.1.1';
    API.CRM_TYPE_CONTACTS = 'crm_contacts';
    API.CRM_TYPE_COMPANIES = 'crm_company';

    API.ERROR_API_NOT_AVAILABLE = 10001;
    API.ERROR_BASE64_OPEN_URL_ONLY_NATIVE = 10002;
    API.ERROR_SHORTLINK_OPEN_URL_ONLY_NATIVE = 10003;
    API.ERROR_SHORTLINK_OPEN_URL_NO_BROWSER = 10004;
    API.ERROR_INVALID_CRM_TYPE = 10005;


    var callbackCounter = 1;
    var cachedIsAvailable = null;
    var callbacks = {};
    var defaultTimeout = 300000; // 5 minutes
    var specificTimeouts = {};
    specificTimeouts[API_METHOD_IS_AVAILABLE] = 10000; // 10 seconds
    specificTimeouts[API_METHOD_OPEN_SHORT_LINK] = 10000; // 10 seconds
    specificTimeouts[API_METHOD_GET_USER] = 10000; // 10 seconds
    specificTimeouts[API_METHOD_OPEN_POPUP] = 10000; // 10 seconds
    specificTimeouts[API_METHOD_OPEN_BROWSER] = 30000; // 30 seconds
    specificTimeouts[API_METHOD_SELECT_CRM] = 3600000; // 1 hour

    function _defaultErrorCallback(error_message) {
        throw new Error(error_message);
    }

    function _cleanData(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function _dateToIso8601(date) {
        if (!(date instanceof Date)) {
            throw new Error('Obj must be instance of Date.');
        }

        var padDigits = function padDigits(number, digits) {
            return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
        };

        var offsetMinutes = date.getTimezoneOffset();
        var negativeOffset = false;
        if (offsetMinutes < 0) {
            offsetMinutes = -offsetMinutes;
            negativeOffset = true;
        }
        var offsetHours = offsetMinutes / 60;
        offsetMinutes = offsetMinutes % 60;

        return date.getFullYear()
            + '-' + padDigits((date.getMonth() + 1), 2)
            + '-' + padDigits(date.getDate(), 2)
            + 'T' + padDigits(date.getHours(), 2)
            + ':' + padDigits(date.getMinutes(), 2)
            + ':' + padDigits(date.getSeconds(), 2)
            + (negativeOffset ? '+' : '-') + padDigits(offsetHours, 2)
            + ':' + padDigits(offsetMinutes, 2);
    }

    /**
     * @param {Function} success_callback
     * @param {Function} error_callback
     * @param {Integer} timeout
     * @returns {String}
     */
    function _generateCallbackIdentifier(success_callback, error_callback, timeout) {
        var callbackIdentifier = 'callback_' + (callbackCounter++);
        var timeoutTimer = null;
        if(timeout) {
            timeoutTimer = setTimeout(function(){
                var callback = callbacks[callbackIdentifier];
                callback.timeoutTimer = null;
                _callCallbackByIdentifier(callbackIdentifier, false, ['Timeout']);
            }, timeout);
        }
        callbacks[callbackIdentifier] = {
            success: success_callback,
            error: error_callback,
            timeoutTimer: timeoutTimer
        };
        return callbackIdentifier;
    }

    /**
     * @param {String} callback_identifier
     * @param {Boolean} callback_success
     * @param {Array} callback_arguments
     */
    function _callCallbackByIdentifier(callback_identifier, callback_success, callback_arguments) {
        if (callbacks.hasOwnProperty(callback_identifier)) {
            var callback = callbacks[callback_identifier];
            if(callback.timeoutTimer) {
                clearTimeout(callback.timeoutTimer);
            }
            if(!callback_success) {
                console.warn('Calling error callback:', callback_arguments);
            }
            callback = callback_success ? callback.success : callback.error;

            if (callback) {
                callback.apply(null, callback_arguments || []);
            }

            delete callbacks[callback_identifier].success;
            delete callbacks[callback_identifier].error;
            delete callbacks[callback_identifier].timeoutTimer;
            delete callbacks[callback_identifier];
        } else {
            var parts = callback_identifier.split('_');
            var i = parseInt(parts[parts.length-1]);
            if(i < callbackCounter) {
                console.warn('Failed to call callback, called multiple times...');
            } else {
                throw new Error('Failed to call callback, no such callback '+JSON.stringify(callback_identifier)+' defined.');
            }
        }
    }

    window.addEventListener("message", function (event) {
        if(event.data) {
            if (event.data.hasOwnProperty('callback_identifier') && event.data.hasOwnProperty('callback_success')) {
                _callCallbackByIdentifier(event.data.callback_identifier, event.data.callback_success, event.data.callback_arguments);
            } else {
                console.warn('Unknown message received.', event);
            }
        }
    }, false);

    /**
     * This is a private method which invokes the native API call
     *
     * @method _invoke
     * @private
     * @param {String} method
     * @param {Object|null} params
     * @param {Function|null} success_callback
     * @param {Function|null} error_callback
     */
    function _invoke(method, params, success_callback, error_callback) {
        error_callback = error_callback || _defaultErrorCallback;
        if (!window.parent || window.parent === window) {
            error_callback('The mySalesGuide3 API is not available.', API.ERROR_API_NOT_AVAILABLE);
            return;
        }

        var message = params || {};

        try {
            message.action = method;
            var timeout = specificTimeouts.hasOwnProperty(method) ? specificTimeouts[method] : defaultTimeout;
            message.callback_identifier = _generateCallbackIdentifier(success_callback, error_callback, timeout);

            window.parent.postMessage(message, '*');
        } catch (err) {
            error_callback(err.message, err.code);
        }
    }

    /**
     * This method checks if the javascript API is loaded within a valid app context.
     *
     * @return {Boolean}
     */
    API.isAvailable = function (callback) {
        if (cachedIsAvailable === null) {
            _invoke(API_METHOD_IS_AVAILABLE, null, function () {
                cachedIsAvailable = true;
                callback(cachedIsAvailable);
            }, function () {
                console.warn('The mySalesGuide3 API is not available.');
                cachedIsAvailable = false;
                callback(cachedIsAvailable);
            });
        } else {
            callback(cachedIsAvailable);
        }
        return cachedIsAvailable;
    };

    /**
     * This method opens a shortLink in a overlay window
     *
     * @method openShortLink
     * @param {Function} success_callback
     * @param {Function} error_callback
     * @param {String} short_link
     * @param {Boolean} close_presentation
     */
    API.openShortlink = function (success_callback, error_callback, short_link, close_presentation) {
        // remove leading slash
        if(short_link && short_link.substr(0, 1) === '/') {
            short_link = short_link.substr(1);
        }
        _invoke(API_METHOD_OPEN_SHORT_LINK, {
            url: short_link,
            close_presentation: close_presentation || false
        }, success_callback, error_callback);
    };

    /**
     * This method retrieves the currently logged in user
     *
     * @method getUser
     * @param {Function} success_callback
     * @param {Function} error_callback
     */
    API.getUser = function (success_callback, error_callback) {
        _invoke(API_METHOD_GET_USER, null, success_callback, error_callback);
    };

    var _isAbsoluteShortlink = function (url) {
        // TODO detect ONLY correct syntax, not others, don't know correct syntax yet
        return url.toLowerCase().substr(0, 3) === 'msg'
            || url.toLowerCase().substr(0, 4) === 'mysg'
            || url.toLowerCase().substr(0, 12) === 'mysalesguide'
    };

    /**
     * This method downloads and opens the given url
     *
     * @method openUrl
     * @param {Function} success_callback
     * @param {Function} error_callback
     * @param {String} url
     * @param {String} title
     */
    API.openPopup = function (success_callback, error_callback, url, title) {
        error_callback = error_callback || _defaultErrorCallback;
        API.isAvailable(function (isAvailable) {
            if (!isAvailable) {
                if (url.substr(0, 5) === 'data:') {
                    error_callback('Open base64 urls is only possible with the native api.', API.ERROR_BASE64_OPEN_URL_ONLY_NATIVE);
                    return;
                }
                if (_isAbsoluteShortlink(url)) {
                    error_callback('Open shortLink urls is only possible with the native api.', API.ERROR_SHORTLINK_OPEN_URL_ONLY_NATIVE);
                    return;
                }
                var win = window.open(url, '_blank');
                win.focus();
                return;
            }

            if (_isAbsoluteShortlink(url)) {
                API.openShortlink(success_callback, error_callback, url);
            } else {
                _invoke(API_METHOD_OPEN_POPUP, {
                    url: url,
                    title: title
                }, success_callback, error_callback);
            }
        });
    };

    /**
     * This method downloads and opens the given url
     *
     * @method openUrl
     * @param {Function} success_callback
     * @param {Function} error_callback
     * @param {String} url
     */
    API.openBrowser = function (success_callback, error_callback, url) {
        error_callback = error_callback || _defaultErrorCallback;

        if (_isAbsoluteShortlink(url)) {
            error_callback('Open shortLink urls is not possible within the browser.', API.ERROR_SHORTLINK_OPEN_URL_NO_BROWSER);
            return;
        }

        API.isAvailable(function (isAvailable) {
            if (!isAvailable) {
                if (url.substr(0, 5) === 'data:') {
                    error_callback('Open base64 urls is only possible with the native api.', API.ERROR_BASE64_OPEN_URL_ONLY_NATIVE);
                    return;
                }
                var win = window.open(url, '_blank');
                win.focus();
                return;
            }

            _invoke(API_METHOD_OPEN_BROWSER, {
                url: url
            }, success_callback, error_callback);
        });
    };

    /**
     * This method shows a contact/company picker
     *
     * @method selectCrm
     * @param {Function} success_callback
     * @param {Function} error_callback
     * @param {String} type
     */
    API.selectCrm = function (success_callback, error_callback, type) {
        type = type || null;
        if(type !== null && type !== API.CRM_TYPE_CONTACTS && type !== API.CRM_TYPE_COMPANIES) {
            error_callback('Invalid crm-type \''+type+'\' provided.', API.ERROR_INVALID_CRM_TYPE);
        }
        _invoke(API_METHOD_SELECT_CRM, {type: type || null}, success_callback, error_callback);
    };

    /**
     * This method saves files to a contact/company
     *
     * @method saveCrmFile
     * @param {Function} success_callback
     * @param {Function} error_callback
     * @param {String} crm_id
     * @param {String} file_url
     * @param {String} display_name
     * @param {String} content_type
     * @param {Object} pdf_settings
     */
    API.saveCrmFile = function (success_callback, error_callback, crm_id, file_url, display_name, content_type, pdf_settings) {
        _invoke(API_METHOD_SAVE_CRM_FILE, {
            crm_id: crm_id,
            file_url: file_url,
            display_name: display_name,
            content_type: content_type,
            pdf_settings: pdf_settings
        }, success_callback, error_callback);
    };

    /**
     * This method saves a note and attaches it to a contact.
     *
     * @method saveCrmNote
     * @param {Function} success_callback
     * @param {Function} error_callback
     * @param {String} crm_id
     * @param {String} note
     * @param {Boolean} is_done
     * @param {Date} deadline
     * @param {Date} reminder
     */
    API.saveCrmNote = function (success_callback, error_callback, crm_id, note, is_done, deadline, reminder) {
        _invoke(API_METHOD_SAVE_CRM_NOTE, {
            crm_id: crm_id,
            note: note,
            is_done: is_done,
            datetime_deadline: deadline ? _dateToIso8601(deadline) : null,
            datetime_reminder: reminder ? _dateToIso8601(reminder) : null
        }, success_callback, error_callback);
    };

    /**
     * This method saves CustomData
     *
     * @method storeCustomData
     * @param {Function} success_callback
     * @param {Function} error_callback
     * @param {String} custom_type
     * @param {String} custom_key
     * @param {boolean} is_private
     * @param {Object} data
     */
    API.storeCustomData = function (success_callback, error_callback, custom_type, custom_key, is_private, data) {
        _invoke(API_METHOD_STORE_CUSTOM_DATA, {
            custom_type: custom_type,
            custom_key: custom_key,
            is_private: is_private,
            custom_data: _cleanData(data)
        }, success_callback, error_callback);
    };

    /**
     * This method loads a specific CustomData Document
     *
     * @method getCustomData
     * @param {Function} success_callback
     * @param {Function} error_callback
     * @param {String} custom_type
     * @param {String} custom_key
     * @param {boolean} is_private
     */
    API.getCustomData = function (success_callback, error_callback, custom_type, custom_key, is_private) {
        _invoke(API_METHOD_GET_CUSTOM_DATA, {
            custom_type: custom_type,
            custom_key: custom_key,
            is_private: is_private
        }, success_callback, error_callback);
    };

    /**
     * This method loads a list of CustomData Documents of a specific type
     *
     * @method listCustomData
     * @param {Function} success_callback
     * @param {Function} error_callback
     * @param {String} custom_type
     * @param {boolean} is_private
     */
    API.listCustomData = function (success_callback, error_callback, custom_type, is_private) {
        _invoke(API_METHOD_LIST_CUSTOM_DATA, {
            custom_type: custom_type,
            is_private: is_private
        }, success_callback, error_callback);
    };

    /**
     * This method creates an unique id with a given prefix
     *
     * @param {String|null} prefix
     * @returns {String}
     */
    API.uuid = function (prefix) {
        return (prefix ? (prefix + '_') : '')
            + (new Date()).valueOf().toString(36) + '-'
            + (parseInt(Math.random() * 1000000).toString(36));
    };


    window.mySalesGuide3Api = API;
}());