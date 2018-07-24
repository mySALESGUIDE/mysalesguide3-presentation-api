class Server {
    constructor(window,database) {
        this.window = window;
        this.database = database;
    }
    checkAvailable(data) {
        return {
            callback_success: true
        };
    }
    getInformation(data) {
        return {
            callback_success: true,
            callback_arguments: [
                {
                    version: '3.0.0-fake',
                    device: navigator.userAgent,
                    os: navigator.platform,
                    short_url: 'msgapp://',
                    org_short: this.database.clients[Object.keys(this.database.clients)[0]].orgShort,
                    language: this.database.users[Object.keys(this.database.users)[0]].lang,
                    connection: 'WLAN',
                    server_url: '/api/v3',
                    uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
                }
            ]
        };
    }
    openShortLink(data) {
        if (data.close_presentation) {
            window.alert('Open in app view '+data.url+ ' and close presentation.');
        } else {
            window.alert('Open in app view: '+data.url);
        }
        return {callback_success: true};
    }
    openPopup(data) {
        window.open(data.url);
        return {callback_success: true};
    }
    openBrowser(data) {
        window.open(data.url);
        return {callback_success: true};
    }
    openPdfViewer(data) {
        return {callback_success: false};
    }
    getUsers(data) {
        return {
            callback_success: true,
            callback_arguments: [
                this.database.visible_users,
                {
                    start: 1,
                    end: 1,
                    current: 1,
                    count: Object.keys(this.database.visible_users).length
                }
            ]
        };
    }
    getUser(data) {
        let userId = 'visible_'+data.id;
        if (!!this.database.visible_users[userId]) {
            return {
                callback_success: true,
                callback_arguments: [this.database.visible_users[userId]]
            };
        }
        return {callback_success: false};
    }
    getMe(data) {
        return {
            callback_success: true,
            callback_arguments: [this.database.users[Object.keys(this.database.users)[0]]]
        };
    }
    getAccessToken(data) {
        return {callback_success: false};
    }
    _unknown(data) {
        window.console.log('Unknown Message:', data);
        return {callback_success: false,};
    }
}

export default Server;
