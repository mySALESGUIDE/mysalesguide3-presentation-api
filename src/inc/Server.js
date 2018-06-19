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
                {version: '3.0.0-fake'}
            ]
        };
    }
    openShortLink(data) {
        if (data.close_presentation) {
            window.location.href = data.url;
        } else {
            window.open(data.url);
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
