'use strict';

const Stratum = require('./libs/class.Stratum');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const stratum = new Stratum({
    host: '0.0.0.0',
    port: {
        number: 3020,
        diff: 1024,
        // SSL
        // - these are placeholder files that may not exist or be accessible due to permissions
        // - remove these for non-SSL connection
        tlsCert: 'file:/etc/ssl/certs/ssl-cert-snakeoil.pem',
        tlsKey: 'file:/etc/ssl/private/ssl-cert-snakeoil.key'
    },
    beam: {
        host: '172.16.3.104',
        port: 17021,
        apiKey: 'abcd1234',
        useTLS: false
    }
});

stratum.init();

stratum.on(Stratum.EVENT_CLIENT_CONNECT, ev => {
    console.log(`Client connected: ${ev.client.socket.remoteAddress}`);
});

stratum.on(Stratum.EVENT_CLIENT_DISCONNECT, ev => {
    console.log(`Client disconnected: ${ev.client.socket.remoteAddress} ${ev.reason}`);
});

stratum.on(Stratum.EVENT_SHARE_SUBMITTED, ev => {
    if (ev.share.isValidBlock) {
        console.log(`Valid block submitted by ${ev.share.client.workerName}`)
    }
    else if (ev.share.isValidShare) {
        console.log(`Valid share submitted by ${ev.share.client.workerName}`)
    }
    else {
        console.log(`Valid share submitted by ${ev.share.client.workerName} ${ev.share.error.message}`)
    }
});

// Make sure Error can be JSON serialized
if (!Error.prototype.toJSON) {
    Error.prototype.toJSON = function () {
        const jsonObj = {};

        Object.getOwnPropertyNames(this).forEach(key => {
            jsonObj[key] = this[key];
        }, this);

        return jsonObj;
    }
}