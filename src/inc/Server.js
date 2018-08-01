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
                    connectionType: "WLAN",
                    serverUrl: "http://localhost",
                    pushStatus: true,
                    deviceOs: "WINDOWS",
                    deviceOsVersion: "10",
                    deviceType: "BROWSER",
                    uuid: "89ad771b-520a-1e72-7cac-3916e3aa35bf",
                    deviceBrowser: "CHROME",
                    appVersion: "3.0.3.0-fake",
                    country: this.database.users[Object.keys(this.database.users)[0]].lang,
                    organisationToken: this.database.clients[Object.keys(this.database.clients)[0]].orgShort,
                    timezone: "Europe/Berlin",
                    internetConnection: "WLAN",
                    language: this.database.users[Object.keys(this.database.users)[0]].lang+'-'+this.database.users[Object.keys(this.database.users)[0]].lang,
                    build: "185",
                    environment: "PRODUCTION",
                    short_url: 'msgapp://'
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
