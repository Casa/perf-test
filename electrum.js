#!/usr/bin/env node

const ElectrumCli = require('electrum-client')
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
  .option('addr', {
    alias: 'a',
    description: 'Address file',
    type: 'string'
  })
  .option('testnet', {
    alias: 't',
    description: 'Use bitcoin testnet',
    type: 'boolean',
    default: false
  })
  .option('host', {
    alias: 'H',
    description: 'Electrum server hostname or IP',
    type: 'string',
    default: '127.0.0.1'
  })
  .option('port', {
    alias: 'p',
    description: 'Electrum server port',
    type: 'string',
    default: '50001'
  })
  .option('ssl', {
    alias: 's',
    description: 'Use SSL',
    type: 'boolean',
    default: false
  })
  .option('compact', {
    description: 'Compact output, single-line per address',
    type: 'boolean',
    default: false
  })
  .option('quiet', {
    alias: 'q',
    description: 'Suppress header & footer output',
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

addresses = readAddressFile(argv.addr);
electrumHost = argv.host;
electrumNetwork = (argv.testnet) ? 'testnet' : 'mainnet';
electrumPort = setPort(electrumNetwork, argv.ssl, argv.port);
electrumProto = 'tcp'
electrumSsl = argv.ssl;


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
function compactOut(addr, ) {
  // TODO: csv concat
  //console.log(key.toString().padEnd(20), value.toString().padStart(8))
}

function getScriptHash(address) {

  let network;

  if (address.startsWith('2') || address.startsWith('tb1')
  || address.startsWith('m') || address.startsWith('n')) {
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
      if (compactOutput) console.log('address,txCount,utxoCount,balanceTime,txCountTime,utxoCountTime')
    }

    for (i = 0; i < addresses.length; i++) {
      address = addresses[i];
      if (address == '') continue;
      addrCountTotal++;
      if (!compactOutput) console.log('address:', address);

      const scriptHash = getScriptHash(address);

      try {
        const getBalanceStart = new Date();
        const balance = await ecl.blockchainScripthash_getBalance(scriptHash)
        const getBalanceTime = new Date() - getBalanceStart;

        const getTxHistoryStart = new Date();
        const history = await ecl.blockchainScripthash_getHistory(scriptHash)
        const getTxHistoryTime = new Date() - getTxHistoryStart;

        const getUtxoStart = new Date();
        const unspent = await ecl.blockchainScripthash_listunspent(scriptHash)
        const getUtxoTime = new Date() - getUtxoStart;

        if (!compactOutput) {
          console.log('balance:', balance);
          kvOut('history count:', history.length);
          kvOut('utxo count:', unspent.length);
          kvOut('getBalance time:', getBalanceTime);
          kvOut('getTxHistory time:', getTxHistoryTime);
          kvOut('getUtxo time:', getUtxoTime);
        } else {
          console.log(
            address + ',' +
            history.length + ',' +
            unspent.length + ',' +
            getBalanceTime + ',' +
            getTxHistoryTime + ',' +
            getUtxoTime
          );
        }
      } catch(e) {
        addrCountErr++;
        if (!compactOutput) console.log('error', e);
      }
      if (!compactOutput) console.log();
    }

    if (!quietOutput) {
      console.log();
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
