'use strict';

const beamhash = require('@mintpond/hasher-beamhash');

module.exports = {
    name: 'BeamHashIII',
    diff1: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
    multiplier: 1,
    verify: (inputBuf, nonceBuf, outputBuf) => {
        return beamhash.verify3(inputBuf, nonceBuf, outputBuf);
    }
};