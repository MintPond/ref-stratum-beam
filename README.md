ref-stratum-beam
================

This Reference Stratum is a simple implementation used as a basis for testing, experimentation, and 
demonstration purposes. It is not intended for production use.

This project has been developed and tested on [Node v10](https://nodejs.org/) and [Ubuntu 16.04](http://releases.ubuntu.com/16.04/)

## Install ##
__Dependencies__
```bash
sudo apt-get install build-essential libboost-dev ssl-cert

# Dependencies may require that you have a Github personal access token to install.
npm config set @mintpond:registry https://npm.pkg.github.com/mintpond
npm config set //npm.pkg.github.com/:_authToken <PERSONAL_ACCESS_TOKEN>
```
[Creating a personal access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line)

__Download from Github__
```bash
git clone https://github.com/MintPond/ref-stratum-beam

# install
cd ref-stratum-beam
npm install
```

## Usage ##
The stratum can be used as a module in a pool:
```javascript
const Stratum = require('@mintpond/ref-stratum-beam').Stratum;

class MyStratum extends Stratum {
    /* Override */
    canAuthorizeWorker(client, callback) {
        // implement your own logic
        if (client.minerAddress === 'bad') {
            // do not authorize worker
            callback(null/*error*/, false/*isAuthorized*/);
        }
        else {
            // authorize worker
            callback(null/*error*/, true/*isAuthorized*/);
        }
    }
}

const stratum = new MyStratum({
    host: '0.0.0.0', // address the stratum will listen on
    port: {
        number: 3025, // port the stratum will listen on
        diff: 1024,    // stratum difficulty
        // SSL
        // - these are placeholder files that may not exist or be accessible due to permissions
        // - remove these for non-SSL connection
        tlsCert: 'file:/etc/ssl/certs/ssl-cert-snakeoil.pem',
        tlsKey: 'file:/etc/ssl/private/ssl-cert-snakeoil.key'
    },
    beam: {
        host: '127.0.0.1',  // Beam node host
        port: 17021,        // Beam node port
        apiKey: 'abcd1234', // Beam node stratum API key
        useTLS: true       
    }
});

stratum.on(Stratum.EVENT_SHARE_SUBMITTED, ev => {
    console.log(ev.share);    
});

stratum.init();
```

### Start Script ###
There is a start script (`start.js`) included which contains further
examples. It can also be run in order to get a Stratum going for test
purposes. You will need to open and modify the config inside before
running it.
```
> node start
```

## Areas of Interest ##
- [ClientReader](libs/class.ClientReader.js) - Handles messages received from a client.
- [ClientWriter](libs/class.ClientWriter.js) - Handles sending messages to a client.
- [Share](libs/class.Share.js) - Processes shares, validates proofs.
- [algorithm](libs/service.algorithm.js) - Contains BeamHash constants and hash verification.


## Resources ##
- [Beam](https://beam.mw/) - MimbleWimble based privacy cryptocurrency.
- [MintPond Mining Pool](https://mintpond.com) - Beam mining pool.