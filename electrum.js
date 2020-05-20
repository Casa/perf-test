#!/usr/bin/env node

const config = require('./lib/config').parse(process.argv)
const ElectrumCli = require('electrum-client')
const bitcoin = require('bitcoinjs-lib')
const fs = require('fs')

// Constants
const ADDR_MAINNET = ['1AGyaDKdHWo8TcGADUCWd8JYXMQrky8Uko','3EBaaBxgShLxq8w2dDjhSfeb476wRScjKK'];
const ADDR_TESTNET = ['2MsFEwgnorZrd6Eypb2L9cL4gdB4hHSpJMu','2MsFPKF1QNDPcP5UHgHwqVXCF5esDaHQYRr'];
const TESTNET_P2SH_P2WSH = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'tb',
  bip32: { public: 0x024289ef, private: 0x024285b5, },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};

// Update configuration
quietOutput = config.quiet;
compactOutput = config.compact;

electrumHost = config.host;
electrumNetwork = (config.testnet) ? 'testnet' : 'mainnet';
electrumPort = setPort(electrumNetwork, config.ssl, config.port);
electrumProto = 'tcp'
electrumSsl = config.ssl;

addresses = readAddressFile(config.addr);

testBalance = config.get_balance
testHistory = config.get_history
testUnspent = config.listunspent
testAll = (testBalance || testHistory || testUnspent) ? false : true;


// Utility functions

function setPort(electrumNetwork, electrumSsl, electrumPort) {
  if (electrumPort) return electrumPort;
  if (electrumSsl) {
    return electrumPort = (electrumNetwork == 'mainnet') ? '50002' : '60002';
    console.log("ssl not yet supported")
    process.exit()
  }
  return electrumPort = (electrumNetwork == 'mainnet') ? '50001' : '60001';
}

function readAddressFile(inputFile) {
  if (!inputFile) return (electrumNetwork == 'mainnet') ? ADDR_MAINNET : ADDR_TESTNET;
  if (!quietOutput) console.log("Reading address list from file: ", inputFile);
  try {
    return fs.readFileSync(inputFile).toString().split("\n");
  } catch(e) {
    console.log("Error reading addresses file:")
    console.log(e)
    process.exit(1)
  }
}

function kvOut(key, value) {
  console.log(key.toString().padEnd(20), value.toString().padStart(8))
}

function getScriptHash(address) {
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


// Main

const main = async () => {
  if (!quietOutput) console.log("Connecting to Electrum server: ", electrumHost, ":", electrumPort);
  const ecl = new ElectrumCli(electrumPort, electrumHost, electrumProto);
  try {
      await ecl.connect();
  } catch (e) {
      console.log('Error connecting to Electrum:');
      console.log(e);
      process.exit(1);
  }
  try {
    addrCountTotal = 0;
    addrCountErr = 0;

    const ver = await ecl.server_version("CasaPerfTest", "1.4");
    const fee = await ecl.blockchainEstimatefee(4)
    if (!quietOutput) {
      console.log('server version:', ver);
      console.log('fee estimate: ' + fee)
      console.log()
      if (compactOutput) {
        header = 'address'
        if (testBalance || testAll) header += ',get_balanceTime';
        if (testHistory || testAll) header += ',get_historyCount,get_historyTime';
        if (testUnspent || testAll) header += ',listunspentCount,listunspentTime';
        console.log(header)
      }
    }

    for (i = 0; i < addresses.length; i++) {
      address = addresses[i];
      if (address == '') continue;
      addrCountTotal++;
      if (!compactOutput) console.log('address:', address);

      const scriptHash = getScriptHash(address);
      result = address

      try {
        if (testBalance || testAll ) {
          const get_balanceStart = new Date()
          const get_balance = await ecl.blockchainScripthash_getBalance(scriptHash)
          const get_balanceTime = new Date() - get_balanceStart
          result += ',' + get_balanceTime
          if (!compactOutput) console.log('get_balance result:', get_balance);
          if (!compactOutput) kvOut('get_balance time:', get_balanceTime);
        }
        if (testHistory || testAll) {
          const get_historyStart = new Date();
          const get_history = await ecl.blockchainScripthash_getHistory(scriptHash)
          const get_historyTime = new Date() - get_historyStart;
          result += ',' + get_history.length + ',' + get_historyTime
          if (!compactOutput) kvOut('get_history count:', get_history.length);
          if (!compactOutput) kvOut('get_history time:', get_historyTime);
        }
        if (testUnspent || testAll) {
          const listunspentStart = new Date();
          const unspent = await ecl.blockchainScripthash_listunspent(scriptHash)
          const listunspentTime = new Date() - listunspentStart;
          result += ',' + unspent.length + ',' + listunspentTime
          if (!compactOutput) kvOut('listunspent count:', unspent.length);
          if (!compactOutput) kvOut('listunspent time:', listunspentTime);
        }
        if (compactOutput) console.log(result);
      } catch(e) {
        addrCountErr++;
        if (!compactOutput) console.log('error', e);
      }
      if (!compactOutput) console.log();
    }

    if (!quietOutput) {
      if (compactOutput) console.log();
      kvOut('Addresses tested', addrCountTotal);
      kvOut('Addresses errored', addrCountErr);
    }

  } catch(e) {
    console.log(e)
  }
  await ecl.close()
}
main()
// EOF
