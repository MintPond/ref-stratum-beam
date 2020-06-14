'use strict';

const
    EventEmitter = require('events'),
    precon = require('@mintpond/mint-precon'),
    Counter = require('@mintpond/mint-utils').Counter,
    BeamMiningClient = require('@mintpond/mint-beam').BeamMiningClient,
    Job = require('./class.Job');


class JobManager extends EventEmitter {

    /**
     * Constructor.
     *
     * @param args
     * @param args.stratum {Stratum}
     */
    constructor(args) {
        precon.notNull(args.stratum, 'stratum');

        super();

        const _ = this;
        _._stratum = args.stratum;

        _._currentJob = null;
        _._validJobsOMap = {};
        _._jobCounter = new Counter();
        _._jobInterval = null;
        _._blockInterval = null;
    }


    /**
     * The name of the event emitted when a new job is started.
     */
    static get EVENT_NEXT_JOB() { return 'nextJob'; }


    /**
     * Get the most recent Job created.
     * @returns {Job}
     */
    get currentJob() { return this._currentJob; }

    /**
     * An object map of valid Job instances by job ID.
     * @returns {{...}}
     */
    get validJobsOMap() { return this._validJobsOMap; }


    /**
     * Initialize job manager.
     *
     * @param [callback] {function()}
     */
    init(callback) {
        const _ = this;

        if (_._stratum.beamClient.currentJob)
            _._processBeamJob(_._stratum.beamClient.currentJob);

        _._stratum.beamClient.on(BeamMiningClient.EVENT_JOB, beamJob => {
            _._processBeamJob(beamJob);
        });

        callback && callback();
    }


    /**
     * Destroy job manager.
     */
    destroy() {
        const _ = this;
        clearInterval(_._jobInterval);
        clearInterval(_._blockInterval);
    }


    _processBeamJob(beamJob, callback) {

        const _ = this;
        const currentJob = _.currentJob;
        const isNewBlock = !currentJob || currentJob.height !== beamJob.height;

        if (currentJob && beamJob.height < currentJob.height) {
            callback && callback();
            return;
        }

        _._nextJob(beamJob, isNewBlock);

        callback && callback();
    }


    _nextJob(beamJob, isNew) {

        const _ = this;

        const job = _._createJob(_._jobCounter.next().toString(), beamJob);

        _._currentJob = job;

        if (isNew)
            _._validJobsOMap = {};

        _._validJobsOMap[job.idHex] = job;

        _.emit(JobManager.EVENT_NEXT_JOB, { job: job, isNewBlock: isNew });
    }


    _createJob(idHex, beamJob) {
        const _ = this;
        return new Job({
            idHex: idHex,
            beamJob: beamJob,
            stratum: _._stratum
        });
    }
}

module.exports = JobManager;