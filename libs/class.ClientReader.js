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


    handleMessage(message) {
        precon.notNull(message, 'message');

        const _ = this;

        if (_._client.isSubscribed && _._client.isAuthorized) {
            return _._handleAuthSubbed(message);
        }
        else {
            if (message.method === 'login')
                return _._login(message);

            _._client.disconnect('Not logged in');
            return true;
        }
    }


    _handleAuthSubbed(message) {

        const _ = this;

        switch (message.method) {

            case 'solution':
                _._client.lastActivity = mu.now();
                return _._solution(message);

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


    _login(message) {
        const _ = this;

        if (_._client.isSubscribed) {
            _._client.disconnect('Login but already logged in');
            return true/*isHandled*/;
        }

        _._client.isSubscribed = true;

        const apiKey = message.api_key;
        //const userAgent = message.agent;

        if (!apiKey || !mu.isString(apiKey)) {
            _._writer.reply({
                replyId: message.id,
                error: StratumError.UNAUTHORIZED_WORKER,
            });
            return true/*isHandled*/;
        }

        _._client.workerName = apiKey;

        _._stratum.canAuthorizeWorker(_._client, (err, isAuthorized) => {

            if (err) {
                _._client.disconnect('Error while authorizing');
                return;
            }

            if (isAuthorized) {
                _._client.isAuthorized = true; // setting this triggers event
                _._writer.replyLoginSuccess({
                    replyId: message.id,
                    noncePrefix: _._client.extraNonce1Hex
                });
                _._client.setJob({
                    job: _._stratum.jobManager.currentJob,
                    isNewBlock: true
                });
            }
            else {
                _._writer.replyLoginFail({
                    replyId: message.id
                });
            }
        });

        return true/*isHandled*/;
    }


    _solution(message) {
        const _ = this;

        if (!_._client.isSubscribed || !_._client.isAuthorized) {
            _._writer.replyError({
                replyId: message.id,
                error: StratumError.UNAUTHORIZED_WORKER
            });
            return true/*isHandled*/;
        }

        const jobId = message.id;
        const nonceHex = message.nonce;
        const outputHex = message.output;

        if (!mu.isString(jobId)) {
            _._client.disconnect('Malformed message: jobId is not a string');
            return;
        }

        if (!mu.isString(nonceHex)) {
            _._client.disconnect('Malformed message: nonceHex is not a string');
            return;
        }

        if (!mu.isString(outputHex)) {
            _._client.disconnect('Malformed message: outputHex is not a string');
            return;
        }

        const share = new Share({
            client: _._client,
            stratum: _._stratum,
            jobId: jobId,
            nonceHex: nonceHex.toLowerCase(),
            outputHex: outputHex.toLowerCase()
        });

        share.validate();

        _._stratum.submitShare(_._client, share);

        _._writer.replyShare({
            replyId: message.id,
            share: share
        });

        return true/*isHandled*/;
    }
}

module.exports = ClientReader;