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


function getScriptHash (address) {
  let network;

  if (address.startsWith('2') || address.startsWith('tb1') ||
    address.startsWith('m') || address.startsWith('n')) {
    network = TESTNET_P2SH_P2WSH;
  }

  let script = bitcoin.address.toOutputScript(address, network);
  let hash = bitcoin.crypto.sha256(script);
  let reversedHash = Buffer.from(hash.reverse())

  return reversedHash.toString('hex');
};

module.exports = {
  getPort: (electrumNetwork, electrumSsl, electrumPort) => {
    if (electrumPort) return electrumPort;
    if (electrumSsl) {
      return electrumPort = (electrumNetwork == 'mainnet') ? '50002' : '60002';
      console.log("ssl not yet supported")
      process.exit()
    }
    return (electrumNetwork == 'mainnet') ? '50001' : '60001';
  },
  
  readAddressFile: (inputFile) => {
    try {
      return fs.readFileSync(inputFile).toString().split("\n").filter(Boolean);
    } catch(e) {
      console.log("Error reading addresses file:", e)
      process.exit(1)
    }
  },
  
  run_measurement: async (ecl, address, measurement) => {
    const scriptHash = getScriptHash(address)
    let result = address;

    try {
      if (measurement.get_balance || measurement.all) {
        const get_balanceStart = new Date()
        const get_balance = await ecl.blockchainScripthash_getBalance(scriptHash)
        const get_balanceTime = new Date() - get_balanceStart
        result += ',' + get_balance.confirmed + ',' + get_balance.unconfirmed + ',' + get_balanceTime
      }
      if (measurement.get_history || measurement.all) {
        const get_historyStart = new Date();
        const get_history = await ecl.blockchainScripthash_getHistory(scriptHash)
        const get_historyTime = new Date() - get_historyStart
        result += ',' + get_history.length + ',' + get_historyTime
      }
      if (measurement.listunspent || measurement.all) {
        const listunspentStart = new Date()
        const unspent = await ecl.blockchainScripthash_listunspent(scriptHash)
        const listunspentTime = new Date() - listunspentStart
        result += ',' + unspent.length + ',' + listunspentTime
      }
      console.log(result)
    } catch (e) {
      if (measurement.verbose) console.error(`run_measurement error for ${address}: ${e}`)
    }
  }
};
