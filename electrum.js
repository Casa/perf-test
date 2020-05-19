#!/usr/bin/env node

const ElectrumCli = require('electrum-client-js')
const bitcoin = require('bitcoinjs-lib')
const yargs = require('yargs')
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

// Parse CLI parameters
const argv = yargs
  .group(['addr'], 'Input options:')
  .option('addr', {
    alias: 'a',
    description: 'Address file',
    type: 'string'
  })
  .group(['compact','quiet'], 'Output options:')
  .option('compact', {
    description: 'Compact output, line per address',
    type: 'boolean',
    default: false
  })
  .option('quiet', {
    alias: 'q',
    description: 'Suppress header & footer output',
    type: 'boolean',
    default: false
  })
  .group(['get_balance','get_history','listunspent'], 'Tests to run:')
  .option('get_balance', {
    description: 'Measure balance lookup',
    type: 'boolean',
    default: false
  })
  .option('get_history', {
    descrption: 'Measure total inputs',
    type: 'boolean',
    default: false
  })
  .option('listunspent', {
    description: 'Measure UTXOs',
    type: 'boolean',
    default: false
  })
  .group(['host','port','ssl','testnet'], 'Electrum server options:')
  .option('host', {
    alias: 'H',
    description: 'Server hostname or IP',
    type: 'string',
    default: '127.0.0.1'
  })
  .option('port', {
    alias: 'P',
    description: 'Server port',
    type: 'string',
    default: '50001'
  })
  .option('ssl', {
    alias: 's',
    description: 'Use SSL',
    type: 'boolean',
    default: false
  })
  .option('testnet', {
    alias: 't',
    description: 'Use bitcoin testnet',
    type: 'boolean',
    default: false
  })
  .usage('Usage: $0 [args]')
  .help()
  .alias('help', 'h')
  .showHelpOnFail(true, 'Specify --help for available options')
  .argv;

// Update configuration
quietOutput = argv.quiet;
compactOutput = argv.compact;

electrumHost = argv.host;
electrumNetwork = (argv.testnet) ? 'testnet' : 'mainnet';
electrumPort = setPort(electrumNetwork, argv.ssl, argv.port);
electrumProto = 'tcp'
electrumSsl = argv.ssl;

addresses = readAddressFile(argv.addr);

testBalance = argv.get_balance
testHistory = argv.get_history
testUnspent = argv.listunspent
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
  const ecl = new ElectrumCli(electrumHost, electrumPort, electrumProto);
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
          const get_balance = await ecl.blockchain_scripthash_getBalance(scriptHash)
          const get_balanceTime = new Date() - get_balanceStart
          result += ',' + get_balanceTime
          if (!compactOutput) console.log('get_balance result:', get_balance);
          if (!compactOutput) kvOut('get_balance time:', get_balanceTime);
        }
        if (testHistory || testAll) {
          const get_historyStart = new Date();
          const get_history = await ecl.blockchain_scripthash_getHistory(scriptHash)
          const get_historyTime = new Date() - get_historyStart;
          result += ',' + get_history.length + ',' + get_historyTime
          if (!compactOutput) kvOut('get_history count:', get_history.length);
          if (!compactOutput) kvOut('get_history time:', get_historyTime);
        }
        if (testUnspent || testAll) {
          const listunspentStart = new Date();
          const unspent = await ecl.blockchain_scripthash_listunspent(scriptHash)
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
