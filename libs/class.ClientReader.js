'use strict';

const
    precon = require('@mintpond/mint-precon'),
    mu = require('@mintpond/mint-utils'),
    Share = require('./class.Share'),
    StratumError = require('./class.StratumError');


class ClientReader {

    /**
     * Constructor.
     *
     * @param args
     * @param args.stratum {Stratum}
     * @param args.client {Client}
     * @param args.writer {ClientWriter}
     */
    constructor(args) {
        precon.notNull(args.stratum, 'stratum');
        precon.notNull(args.client, 'client');
        precon.notNull(args.writer, 'writer');

        const _ = this;
        _._stratum = args.stratum;
        _._client = args.client;
        _._writer = args.writer;
    }


    /* Override */
    handleMessage(message) {
        precon.notNull(message, 'message');

        const _ = this;

        if (_._client.isSubscribed && _._client.isAuthorized) {
            return _._handleAuthSubbed(message);
        }
        else if (_._client.isSubscribed) {
            return _._handleSubbed(message);
        }
        else {
            if (message.method === 'mining.subscribe')
                return _._miningSubscribe(message);

            _._client.disconnect('Not subscribed');
            return true;
        }
    }


    _handleAuthSubbed(message) {

        const _ = this;

        switch (message.method) {

            case 'mining.extranonce.subscribe':
                _._writer.reply({
                    replyId: message.id,
                    result: false
                });
                return true/*isHandled*/;

            case 'mining.submit':
                _._client.lastActivity = mu.now();
                return _._miningSubmit(message);

            default:
                if (mu.isNumber(message.id)) {
                    _._writer.reply({
                        replyId: message.id,
                        result: false
                    });
                }
                return false/*isHandled*/;
        }
    }


    _handleSubbed(message) {

        const _ = this;

        switch (message.method) {

            case 'mining.authorize':
                return _._miningAuthorize(message);

            case 'mining.submit':
                _._client.disconnect('Share submit but not subscribed');
                return true/*isHandled*/;

            default:
                _._writer.reply({
                    replyId: message.id,
                    result: false
                });
                return false/*isHandled*/;
        }
    }


    _miningSubscribe(message) {
        const _ = this;

        if (_._client.isSubscribed) {
            _._client.disconnect('Subscribed but already subscribed');
            return true/*isHandled*/;
        }

        _._client.isSubscribed = true;

        // send subscribe response
        _._writer.replySubscribe({
            replyId: message.id
        });

        return true/*isHandled*/;
    }


    _miningAuthorize(message) {

        const _ = this;

        const workerName = message.params[0];
        if (!workerName || !mu.isString(workerName)) {

            _._writer.reply({
                replyId: message.id,
                error: StratumError.UNAUTHORIZED_WORKER,
            });
            return true/*isHandled*/;
        }

        _._client.workerName = workerName;

        _._stratum.canAuthorizeWorker(_._client, (err, isAuthorized) => {

            if (err) {
                _._client.disconnect('Error while authorizing');
                return;
            }

            _._writer.reply({
                replyId: message.id,
                result: isAuthorized,
                error: isAuthorized ? null : StratumError.UNAUTHORIZED_WORKER
            });

            if (isAuthorized) {
                _._client.isAuthorized = true; // setting this triggers event
                _._client.setJob({
                    job: _._stratum.jobManager.currentJob,
                    isNewBlock: true
                });
            }
        });

        return true/*isHandled*/;
    }


    _miningSubmit(message) {
        const _ = this;

        if (!_._client.isAuthorized) {
            _._writer.reply({
                replyId: message.id,
                error: StratumError.UNAUTHORIZED_WORKER
            });
            return true/*isHandled*/;
        }

        if (!_._client.isSubscribed) {
            _._writer.reply({
                replyId: message.id,
                error: StratumError.NOT_SUBSCRIBED
            });
            return true/*isHandled*/;
        }

        if (!Array.isArray(message.params)) {
            _._client.emit(Client.EVENT_MALFORMED_MESSAGE, { message: message });
            return true/*isHandled*/;
        }

        const workerName = message.params[0];
        if (!workerName || !mu.isString(workerName)) {
            _._client.emit(Client.EVENT_MALFORMED_MESSAGE, { message: message });
            return true/*isHandled*/;
        }

        const jobIdHex = _._hex(message.params[1]);
        const extraNonce2Hex = _._hex(message.params[2]);
        const nTimeHex = _._hex(message.params[3]);
        const nonceHex = _._hex(message.params[4]);

        const share = new Share({
            client: _._client,
            stratum: _._stratum,
            workerName: workerName,
            jobIdHex: jobIdHex,
            extraNonce2Hex: extraNonce2Hex,
            nTimeHex: nTimeHex,
            nonceHex: nonceHex
        });

        const isValid = share.validate();

        _._stratum.submitShare(_._client, share);

        _._writer.reply({
            replyId: message.id,
            result: isValid,
            error: share.error
        });

        return true/*isHandled*/;
    }


    _hex(val) {

        let value;

        if (mu.isString(val)) {

            if (val.startsWith('0x'))
                val = val.substr(2);

            value = val.toLowerCase();
        }
        else {
            value = '';
        }

        return value;
    }
}

module.exports = ClientReader;