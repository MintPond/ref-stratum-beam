'use strict';

const
    beamDiff = require('@mintpond/mint-beam').beamDiff,
    precon = require('@mintpond/mint-precon'),
    Share = require('./class.Share'),
    StratumError = require('./class.StratumError'),
    algorithm = require('./service.algorithm');


class ClientWriter {

    /**
     * Constructor.
     *
     * @param args
     * @param args.client {Client}
     */
    constructor(args) {
        precon.notNull(args.client, 'client');

        const _ = this;
        _._client = args.client;
        _._port = _._client.port;
        _._socket = _._client.socket;
    }


    replyLoginFail(args) {
        precon.string(args.replyId, 'replyId');
        precon.opt_string(args.failReason, 'failReason');

        const _ = this;
        const replyId = args.replyId;
        const failReason = args.failReason;

        _._socket.send({
            id: replyId,
            method: 'result',
            code: -32003,
            description: failReason ? `Login failed: ${failReason}` : 'Login failed.',
            jsonrpc: '2.0'
        });
    }


    replyLoginSuccess(args) {
        precon.string(args.replyId, 'replyId');
        precon.string(args.noncePrefix, 'noncePrefix');

        const _ = this;
        const replyId = args.replyId;
        const noncePrefix = args.noncePrefix;

        _._socket.send({
            id: replyId,
            method: 'result',
            code: 0,
            description: 'Login success.',
            nonceprefix: noncePrefix,
            jsonrpc: '2.0',
            ..._._client.stratum.beamClient.forkHeightOMap
        });
    }


    replyError(args) {
        precon.string(args.replyId, 'replyId');
        precon.instanceOf(args.error, StratumError, 'error');

        const _ = this;
        const replyId = args.replyId;
        const error = args.error;

        _._socket.send({
            id: replyId,
            method: 'result',
            code: error.code,
            description: error.message,
            jsonrpc: '2.0'
        });
    }


    replyShare(args) {
        precon.string(args.replyId, 'replyId');
        precon.instanceOf(args.share, Share, 'share');

        const _ = this;
        const replyId = args.replyId;
        const share = args.share;

        if (share.isValidShare) {
            _._socket.send({
                id: replyId,
                method: 'result',
                code: 1,
                description: 'accepted',
                jsonrpc: '2.0'
            });
        }
        else {
            _._socket.send({
                id: replyId,
                method: 'result',
                code: share.error.code,
                description: share.error.message,
                jsonrpc: '2.0'
            });
        }
    }


    job(args) {
        const _ = this;
        const job = args.job;
        const diff = args.diff;

        _._socket.send({
            id: job.idHex,
            method: 'job',
            height: job.height,
            difficulty: beamDiff.pack(diff * algorithm.multiplier),
            input: job.inputHex,
            jsonrpc: '2.0'
        });
    }
}

module.exports = ClientWriter;