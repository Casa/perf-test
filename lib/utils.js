'use strict';

const fs = require('fs')
const bitcoin = require('bitcoinjs-lib')

const TESTNET_P2SH_P2WSH = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'tb',
  bip32: { public: 0x024289ef, private: 0x024285b5, },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};

module.exports = {
  setPort: (electrumNetwork, electrumSsl, electrumPort) => {
    if (electrumPort) return electrumPort;
    if (electrumSsl) {
      return electrumPort = (electrumNetwork == 'mainnet') ? '50002' : '60002';
      console.log("ssl not yet supported")
      process.exit()
    }
    return electrumPort = (electrumNetwork == 'mainnet') ? '50001' : '60001';
  },
  
  readAddressFile: (inputFile) => {
    try {
      return fs.readFileSync(inputFile).toString().split("\n").filter(Boolean);
    } catch(e) {
      console.log("Error reading addresses file:", e)
      process.exit(1)
    }
  },
  
  kvOut: (key, value) => {
    console.log(key.toString().padEnd(20), value.toString().padStart(8))
  },
  
  getScriptHash: (address) => {
    let network;
  
    if (address.startsWith('2') || address.startsWith('tb1') ||
      address.startsWith('m') || address.startsWith('n')) {
      network = TESTNET_P2SH_P2WSH;
    }
  
    let script = bitcoin.address.toOutputScript(address, network);
    let hash = bitcoin.crypto.sha256(script);
    let reversedHash = Buffer.from(hash.reverse())
  
    return reversedHash.toString('hex');
  }
};
