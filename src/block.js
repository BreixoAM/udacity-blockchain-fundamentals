const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {

	constructor(data) {
		this.hash = null;
		this.height = 0;
		this.body = Buffer.from(JSON.stringify(data)).toString('hex');
		this.time = 0;
		this.previousBlockHash = null;
    }

    validate() {
        let self = this;
        return new Promise((resolve) => {
            let currentHash = self.hash;
            let recalculatedHash = this.generateHash();

            resolve(currentHash === recalculatedHash)
        });
    }

    getBData() {
        let self = this;
        return new Promise((resolve, reject) => {
            if (0 === self.height) {
                reject('Access to the genesis block is not allowed');
            }

            let decodedData = hex2ascii(self.body);

            resolve(JSON.parse(decodedData));
        });
    }

    generateHash() {
        let block = {
            height: this.height,
            body: this.body,
            time: this.time,
            previousBlockHash: this.previousBlockHash
        }

        return SHA256(JSON.stringify(block)).toString();
    }
}

module.exports.Block = Block;
