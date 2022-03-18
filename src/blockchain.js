const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

const MAX_TIME_VALIDATION_IN_SECONDS = 300;

class Blockchain {

    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    async initializeChain() {
        if (this.height === -1) {
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    requestMessageOwnershipVerification(address) {
        let self = this;
        return new Promise((resolve, reject) => {
            let timeStamp = self._getCurrentTimeStamp();
            resolve(`${address}:${timeStamp}:starRegistry`);
        });
    }

    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            if (!self._validateTime(message)) {
                return reject('Invalid time message.');
            }

            if (!bitcoinMessage.verify(message, address, signature)) {
                return reject('Invalid signature message.');
            }

            let blockData = {
                star: star,
                owner: address
            }

            let newBlock = new BlockClass.Block(blockData);

            resolve(self._addBlock(newBlock));
        });
    }

    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.hash === hash)[0];
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    getStarsByWalletAddress(address) {
        let self = this;
        let stars = [];
        return new Promise(async (resolve, reject) => {
            for (let i = 1; i < self.chain.length; i++) {
                let block = self.chain[i];
                let data = await block.getBData();
                if (data['owner'] === address) {
                    stars.push(data);
                }
            }

            resolve(stars);
        });
    }

    validateChain() {
        let self = this;
        let errorsLog = [];
        return new Promise(async (resolve, reject) => {
            for (let i = 0; i < self.chain.length; i++) {
                let block = self.chain[i];
                let validateBlockResult = await block.validate();
                if (!validateBlockResult) {
                    errorsLog.push(`Invalid block: ${block.height}`);
                }
            }

            if (errorsLog.length > 0) {
                return reject(errorsLog);
            }

            resolve();
        });
    }

    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve) => {
            let chainHeight = this.height;
            if (chainHeight >= 0) {
                let lastBlock = await self.getBlockByHeight(chainHeight);
                block.previousBlockHash = lastBlock.hash;
            }

            block.height = chainHeight + 1;
            block.time = self._getCurrentTimeStamp();
            block.hash = block.generateHash();

            self.chain.push(block);
            self.height = block.height;

            resolve(block);
        });
    }

    _validateTime(message) {
        let timeStampValidation = parseInt(message.split(':')[1]);
        let timeStampNow = this._getCurrentTimeStamp();
        let diffInSeconds = timeStampNow - timeStampValidation;

        return diffInSeconds <= MAX_TIME_VALIDATION_IN_SECONDS;
    }

    _getCurrentTimeStamp() {
        return ~~(Date.now() / 1000);
    }
}

module.exports.Blockchain = Blockchain;
