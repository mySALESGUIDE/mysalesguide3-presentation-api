import database from "inc/Database";
import Server from "inc/Server";

const server = new Server(window, database);

window.addEventListener('message', function (event) {
    if (typeof event.data !== "object") {
        return;
    }
    if (typeof event.data.action !== "string") {
        return;
    }
    if (typeof event.data.callback_identifier !== "string") {
        return;
    }
    let result = {
        callback_success: false,
        callback_identifier: event.data.callback_identifier,
        callback_arguments: []
    };
    let method = !!server[event.data.action] ? event.data.action : '_unknown';
    let id = event.data.callback_identifier;
    delete event.data.action;
    delete event.data.callback_identifier;
    window.console.log('Call', id, ':', method, '(', event.data, ')');
    result = Object.assign({}, result, server[method](event.data));
    if (!Array.isArray(result.callback_arguments)) {
        throw new Error('Result.callback_arguments must be and array!');
    }
    window.console.log('  - Result',result);
    event.source.postMessage(result, '*');
}, false);
