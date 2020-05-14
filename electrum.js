const ElectrumCli = require('electrum-client')
const bitcoin = require('bitcoinjs-lib')
const yargs = require('yargs')
const fs = require('fs')

// Default configuration & constants

electrumHost = '127.0.0.1'
electrumPort = 50001
electrumProto = 'tcp'
electrumSsl = false
electrumNetwork = 'mainnet'
addresses = [
  '1AGyaDKdHWo8TcGADUCWd8JYXMQrky8Uko',
  '3EBaaBxgShLxq8w2dDjhSfeb476wRScjKK',
  '3Fs5uFKJRshVoPfhbSrZ9Z4yg5F93b2qAg'
];

const TESTNET_P2SH_P2WSH = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'tb',
   bip32: {
      public: 0x024289ef,
      private: 0x024285b5,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};


// Parse CLI parameters

const argv = yargs
  .usage('Usage: $0 [args]')
  .help()
  .showHelpOnFail(false, 'Specify --help for available options')
  .option('host', {
    alias: 'h',
    description: 'Electrum server hostname or IP address (default: 127.0.0.1)',
    type: 'string'
  })
  .option('port', {
    alias: 'p',
    description: 'Electrum server hostname or IP address (default: 127.0.0.1)',
    type: 'string'
  })
  .option('ssl', {
    alias: 's',
    description: 'Use SSL (default: false)',
    type: 'boolean'
  })
  .option('testnet', {
    description: 'Use bitcoin testnet (default: false)',
    type: 'boolean'
  })
  .option('addr', {
    alias: 'a',
    description: 'Address file',
    type: 'string'
  })
  .argv;

if (argv.ssl) {
  //electrumSsl = true;
  console.log("ssl not yet supported")
  process.exit()
}
if (argv.host) electrumHost = argv.host;
if (argv.port) electrumPort = argv.port;
if (argv.testnet) electrumNetwork = 'testnet';
if (argv.addr) addresses = readAddressFile(argv.addr);


// Update configuration

if (electrumNetwork == 'testnet' && !electrumSsl) electrumPort = 60001;


// Utility functions
function readAddressFile(inputFile) {
  console.log("Reading address list from file: ", inputFile);
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
  const ecl = new ElectrumCli(electrumPort, electrumHost, electrumProto);
  try {
      await ecl.connect();
  } catch (e) {
      console.log('Error connecting to Electrum:');
      console.log(e);
  }
  try {
    const ver = await ecl.server_version("CasaPerfTest", "1.4");
    const fee = await ecl.blockchainEstimatefee(4)
    console.log('server version:', ver);
    console.log('fee estimate: ' + fee)
    console.log()

    for (i = 0; i < addresses.length; i++) {
      address = addresses[i];
      if (address == '') continue;
      console.log(`address: ${address}`);

      const scriptHash = getScriptHash(address);

      const getBalanceStart = new Date();
      try {
        const balance = await ecl.blockchainScripthash_getBalance(scriptHash)
        const getBalanceTime = new Date() - getBalanceStart;

        const getTxHistoryStart = new Date();
        const history = await ecl.blockchainScripthash_getHistory(scriptHash)
        const getTxHistoryTime = new Date() - getTxHistoryStart;

        const getUtxoStart = new Date();
        const unspent = await ecl.blockchainScripthash_listunspent(scriptHash)
        const getUtxoTime = new Date() - getUtxoStart;

        console.log('balance: ', balance);
        kvOut('history count: ', history.length);
        kvOut('utxo count: ', unspent.length);
        kvOut('getBalance time: ', getBalanceTime);
        kvOut('getTxHistory time: ', getTxHistoryTime);
        kvOut('getUtxo time: ', getUtxoTime);
      } catch(e) {
        console.log('error: ', e)
      }
      console.log()
    }

  } catch(e) {
    console.log(e)
  }
  await ecl.close()
}
main()
// EOF
