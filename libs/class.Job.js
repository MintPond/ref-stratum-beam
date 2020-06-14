'use strict';

const
    precon = require('@mintpond/mint-precon'),
    mu = require('@mintpond/mint-utils'),
    algorithm = require('./service.algorithm'),
    Share = require('./class.Share');


class Job {

    /**
     * Constructor.
     *
     * @param args
     * @param args.idHex {string}
     * @param args.beamJob {object}
     * @param args.stratum {Stratum}
     */
    constructor(args) {
        precon.string(args.idHex, 'idHex');
        precon.notNull(args.beamJob, 'beamJob');
        precon.notNull(args.stratum, 'stratum');

        const _ = this;
        _._idHex = args.idHex;
        _._beamJob = args.beamJob;
        _._stratum = args.stratum;

        _._time = mu.now();
        _._inputHex = _._beamJob.input;
        _._height = _._beamJob.height;

        _._nDiff = _._beamJob.difficulty;
        _._pDiff = _._nDiff * algorithm.multiplier;

        _._submitSet = new Set();
    }


    /**
     * Get the job ID.
     * @returns {string}
     */
    get idHex() { return this._idHex; }

    /**
     * Get the ID of the beam stratum job.
     * @returns {string}
     */
    get beamJobId() { return this._beamJob.id; }

    /**
     * Get the time of job instantiation.
     * @returns {number}
     */
    get time() { return this._time; }

    /**
     * Get the block chain height of the job.
     * @returns {number}
     */
    get height() { return this._height; }

    /**
     * Get the network scale difficulty of the job.
     * @returns {number}
     */
    get nDiff() { return this._nDiff; }

    /**
     * Get the pool scale difficulty of the job.
     * @returns {number}
     */
    get pDiff() { return this._pDiff; }

    /**
     * Get the input hex.
     * @returns {string}
     */
    get inputHex() { return this._inputHex; }


    /**
     * Register a share and check if the share is a duplicate.
     *
     * @param share {Share}
     * @returns {boolean} True if the share is successfully registered, false if ist is a duplicate.
     */
    registerShare(share) {
        precon.instanceOf(share, Share, 'share');
        precon.string(share.nonceHex, 'nonceHex');
        precon.string(share.outputHex, 'outputHex');

        const _ = this;
        const nonceHex = share.nonceHex;
        const outputHex = share.outputHex;

        const submitId = `${nonceHex}:${outputHex}`;

        if (_._submitSet.has(submitId))
            return false;

        _._submitSet.add(submitId);
        return true;
    }
}

module.exports = Job;