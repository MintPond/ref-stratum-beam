'use strict';

const
    precon = require('@mintpond/mint-precon'),
    mu = require('@mintpond/mint-utils'),
    buffers = require('@mintpond/mint-utils').buffers,
    bi = require('@mintpond/mint-utils').bi,
    algorithm = require('./service.algorithm'),
    StratumError = require('./class.StratumError');


class Share {

    /**
     * Constructor.
     *
     * @param args
     * @param args.client {Client}
     * @param args.stratum {Stratum}
     * @param args.workerName {string}
     * @param args.jobId {string}
     * @param args.nonceHex {string}
     * @param args.outputHex {string}
     */
    constructor(args) {
        precon.notNull(args.client, 'client');
        precon.notNull(args.stratum, 'stratum');
        precon.string(args.jobId, 'jobId');
        precon.string(args.nonceHex, 'nonceHex');
        precon.string(args.outputHex, 'outputHex');

        const _ = this;
        _._client = args.client;
        _._stratum = args.stratum;
        _._jobId = args.jobId;
        _._nonceHex = args.nonceHex;
        _._outputHex = args.outputHex;

        _._stratumDiff = _._client.diff;
        _._shareDiff = 0;
        _._expectedBlocks = 0;

        _._submitTime = mu.now();
        _._job = null;
        _._isValidShare = null;
        _._isValidBlock = false;
        _._isBlockAccepted = false;
        _._error = null;
        _._blockId = null;
    }

    /**
     * Get the client that submitted the share.
     * @returns {Client}
     */
    get client() { return this._client; }

    /**
     * Get the job ID of the share.
     * @returns {string}
     */
    get jobId() { return this._jobId; }

    /**
     * Get the Beam stratum job Id.
     * This value is not available until a job has been associated with the share via the #validate function.
     * @returns {string}
     */
    get beamJobId() { return this._job ? this._job.beamJobId : ''; }

    /**
     * Get the job height of the share.
     * This value is not available until a job has been associated with the share via the #validate function.
     * @returns {number}
     */
    get jobHeight() { return this._job ? this._job.height : 0; }

    /**
     * Get the time of the share submission in epoch seconds.
     * @returns {number}
     */
    get submitTime() { return this._submitTime; }

    /**
     * Get the subscription ID of the client that submitted the share.
     * @returns {string}
     */
    get subscriptionIdHex() { return this._client.subscriptionIdHex; }

    /**
     * Get the mining address of the client that submitted the share.
     * @returns {string}
     */
    get minerAddress() { return this._client.minerAddress; }

    /**
     * Get the share difficulty.
     * This value is not available until it is calculated in the #validate function.
     * @returns {number}
     */
    get shareDiff() { return this._shareDiff; }

    /**
     * Get the stratum difficulty of the share.
     * @returns {number}
     */
    get stratumDiff() { return this._stratumDiff; }

    /**
     * Get the expected blocks of the share.
     * This value is not available until it is calculated in the #validate function.
     * @returns {number}
     */
    get expectedBlocks() { return this._expectedBlocks; }

    /**
     * Determine if the share is a valid block.
     * This value is not available until it is calculated in the #validate function.
     * @returns {boolean}
     */
    get isValidBlock() { return this._isValidBlock; }
    set isValidBlock(isValid) {
        precon.boolean(isValid, 'isValidBlock');
        this._isValidBlock = isValid;
    }

    /**
     * Determine if the share is valid.
     * This value is not available until it is calculated in the #validate function.
     * @returns {boolean}
     */
    get isValidShare() { return this._isValidShare; }

    /**
     * Determine if the share as a block was accepted by the coin daemon.
     * This value is not available until the block ID is set via the #blockId property.
     * @returns {boolean}
     */
    get isBlockAccepted() { return this._isBlockAccepted; }

    /**
     * Get the stratum error of the share.
     * This value is not available until it is calculated in the #validate function.
     * @returns {null|StratumError}
     */
    get error() { return this._error; }

    /**
     * Get the block ID of the valid block.
     * This value is only available when it is externally set.
     * @returns {null|string}
     */
    get blockId() { return this._blockId; }
    set blockId(id) {
        precon.opt_string(id, 'blockId');
        this._blockId = id;
        this._isBlockAccepted = !!id;
    }

    /**
     * Get share nonce as a Buffer
     * @returns {Buffer}
     */
    get nonceHex() { return this._nonceHex; }

    /**
     * Get share extraNonce2 as a Buffer
     * @returns {Buffer}
     */
    get outputHex() { return this._outputHex; }


    /**
     * Validate the share.
     *
     * @returns {boolean} True if validated. False if the share is invalid.
     */
    validate() {
        const _ = this;

        if (mu.isBoolean(_._isValidShare))
            return _._isValidShare;

        _._job = _._stratum.jobManager.validJobsOMap[_._jobId];

        // check valid job
        if (!_._job)
            return _._setError(StratumError.STALE_SHARE);

        // check nonce size
        if (_._isInvalidNonceSize())
            return false;

        // check output size
        if (_._isInvalidSolutionSize())
            return false;

        // check duplicate share
        if (_._isDuplicateShare())
            return false;

        const inputBuf = Buffer.from(_._job.inputHex, 'hex');
        const outputBuf = Buffer.from(_._outputHex, 'hex');
        const nonceBuf = Buffer.from(_._nonceHex, 'hex');

        const isValid = algorithm.verify(inputBuf, nonceBuf, outputBuf);
        if (!isValid) {
            _._setError(StratumError.INVALID_SOLUTION);
            return false;
        }

        // check valid block
        _._validateBlock(outputBuf);

        if (_._isValidBlock)
            console.log(`Winning nonce submitted: ${_._nonceHex}`);

        // check low difficulty
        if (_._isLowDifficulty())
            return false;

        // calculate expected blocks
        _._expectedBlocks = _._calculateExpectedBlocks();

        return _._isValidShare = true;
    }


    toJSON() {
        const _ = this;
        return {
            jobId: _.jobId,
            jobHeight: _.jobHeight,
            submitTime: _.submitTime,
            subscriptionIdHex: _.subscriptionIdHex,
            minerAddress: _.minerAddress,
            workerName: _._client.workerName,
            shareDiff: _.shareDiff,
            stratumDiff: _.stratumDiff,
            expectedBlocks: _.expectedBlocks,
            isValidBlock: _.isValidBlock,
            isValidShare: _.isValidShare,
            isBlockAccepted: _.isBlockAccepted,
            error: _.error,
            blockId: _.blockId
        };
    }


    _calculateExpectedBlocks() {
        const _ = this;
        return _._stratumDiff / _._job.pDiff;
    }


    _isInvalidNonceSize() {
        const _ = this;
        if (_._nonceHex.length !== 16) {
            _._setError(StratumError.INCORRECT_NONCE_SIZE);
            return true;
        }
        return false;
    }


    _isInvalidSolutionSize() {
        const _ = this;
        if (_._outputHex.length !== 208) {
            _._setError(StratumError.INCORRECT_SOLUTION_SIZE);
            return true;
        }
        return false;
    }


    _isDuplicateShare() {
        const _ = this;
        if (!_._job.registerShare(_)) {
            _._setError(StratumError.DUPLICATE_SHARE);
            return true;
        }
        return false;
    }


    _isLowDifficulty() {
        const _ = this;
        const diffFactor = _._shareDiff / _._stratumDiff;
        if (diffFactor < 0.999) {
            _._setError(StratumError.LOW_DIFFICULTY);
            return true;
        }
        return false;
    }


    _setError(error) {
        precon.notNull(error, 'error');

        const _ = this;
        _._error = error;
        return _._isValidShare = false;
    }


    _validateBlock(outputBuf) {
        const _ = this;

        const outputHashBuf = buffers.sha256(outputBuf);
        const headerBi = bi.fromBufferBE(outputHashBuf);

        _._shareDiff = algorithm.diff1 / Number(headerBi) * algorithm.multiplier;
        _._isValidBlock = _._shareDiff >= _._job.pDiff;
    }
}

module.exports = Share;