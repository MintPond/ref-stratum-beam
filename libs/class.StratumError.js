'use strict';

const
    precon = require('@mintpond/mint-precon'),
    StratumErrorCode = require('./const.StratumErrorCode');


class StratumError {

    /**
     * Constructor.
     *
     * @param errorCode {number} (StratumErrorCode) Error code number
     * @param message {string}
     */
    constructor(errorCode, message) {
        precon.oneOf(errorCode, StratumErrorCode.all, 'errorCode');
        precon.string(message, 'message');

        const _ = this;
        _._code = errorCode;
        _._message = message;
    }

    /**
     * Incorrect nonce byte length.
     * @returns {StratumError}
     */
    static get INCORRECT_NONCE_SIZE() { return INCORRECT_NONCE_SIZE }

    /**
     * Incorrect solution byte length.
     * @returns {StratumError}
     */
    static get INCORRECT_SOLUTION_SIZE() { return INCORRECT_SOLUTION_SIZE }

    /**
     * Solution is not valid.
     * @returns {StratumError}
     */
    static get INVALID_SOLUTION() { return INVALID_SOLUTION }

    /**
     * Job share belongs to is not valid or found.
     * @returns {StratumError}
     */
    static get STALE_SHARE() { return STALE_SHARE }

    /**
     * Share already submitted.
     * @returns {StratumError}
     */
    static get DUPLICATE_SHARE() { return DUPLICATE_SHARE }

    /**
     * Difficulty of share is below stratum difficulty.
     * @returns {StratumError}
     */
    static get LOW_DIFFICULTY() { return LOW_DIFFICULTY }

    /**
     * Worker is not recognized or authorized.
     * @returns {StratumError}
     */
    static get UNAUTHORIZED_WORKER() { return UNAUTHORIZED_WORKER }

    /**
     * Create a custom error.
     *
     * @param message {string} The error message.
     * @returns {StratumError}
     */
    static custom(message) {
        return new StratumError(StratumErrorCode.OTHER, message);
    }


    /**
     * The stratum error code.
     * @returns {number} (StratumErrorCode)
     */
    get code() { return this._code; }

    /**
     * The stratum error message.
     * @returns {string}
     */
    get message() { return this._message; }

    /**
     * The array used in stratum error response.
     * @returns {[number,string,null]}
     */
    get responseArr() { return [this._code, this._message, null]; }


    toJSON() {
        const _ = this;
        return {
            code: _.code,
            error: _.message
        };
    }
}

const INVALID_SOLUTION = new StratumError(StratumErrorCode.INVALID_SOLUTION, 'Invalid solution');
const INCORRECT_SOLUTION_SIZE = new StratumError(StratumErrorCode.SOLUTION_SIZE, 'Incorrect size of solution');
const DUPLICATE_SHARE = new StratumError(StratumErrorCode.DUPLICATE, 'Duplicate share');
const INCORRECT_NONCE_SIZE = new StratumError(StratumErrorCode.NONCE_SIZE, 'Incorrect size of nonce');
const STALE_SHARE = new StratumError(StratumErrorCode.STALE, 'Stale share - Job not found');
const LOW_DIFFICULTY = new StratumError(StratumErrorCode.LOW_DIFFICULTY, 'Low difficulty');
const UNAUTHORIZED_WORKER = new StratumError(StratumErrorCode.UNAUTHORIZED_WORKER, 'Unauthorized worker');

module.exports = StratumError;