'use strict';

const StratumErrorCode = {
    get OTHER() { return -32003 },
    get INVALID_SOLUTION() { return -32004 },
    get SOLUTION_SIZE() { return -32005 },
    get DUPLICATE() { return -32006 },
    get NONCE_SIZE() { return -32007 },
    get STALE() { return -32008 },
    get LOW_DIFFICULTY() { return -32009 },
    get UNAUTHORIZED_WORKER() { return -32010 }
}

module.exports = StratumErrorCode;

Object.defineProperties(StratumErrorCode, {
    all: {
        value: [
            StratumErrorCode.OTHER,
            StratumErrorCode.INVALID_SOLUTION,
            StratumErrorCode.SOLUTION_SIZE,
            StratumErrorCode.DUPLICATE,
            StratumErrorCode.NONCE_SIZE,
            StratumErrorCode.STALE,
            StratumErrorCode.LOW_DIFFICULTY,
            StratumErrorCode.UNAUTHORIZED_WORKER
        ],
        enumerable: false
    }
});