const ElectrumCli = require('electrum-client')
const bitcoin = require('bitcoinjs-lib')
const yargs = require('yargs')

// Default configuration & constants

electrumHost = '127.0.0.1'
electrumPort = 50001
electrumProto = 'tcp'
electrumSsl = false
electrumNetwork = 'mainnet'
const ADDRESSES_SMALL = [
  '1AGyaDKdHWo8TcGADUCWd8JYXMQrky8Uko',
  '3EBaaBxgShLxq8w2dDjhSfeb476wRScjKK',
  '3Fs5uFKJRshVoPfhbSrZ9Z4yg5F93b2qAg'
];
const ADDRESSES_LARGE = [
  '3C6qQDSRZVahLm5JryiF2zQFTeKzNQPfnH',
  '16ftSEQ4ctQFDtVZiUBusQUjRrGhM3JYwe',
  '35hK24tcLEWcgNA4JxpvbkNkoAcDGqQPsP',
  '3Kzh9qAqVWQhEsfQz7zEQL1EuSx5tyNLNS',
  '16FSBGvQfy4K8dYvPPWWpmzgKM6CvrCoVy',
];
const ADDRESSES_GIGANTIC = [
  '1Ross5Np5doy4ajF9iGXzgKaC2Q3Pwwxv',
  '1diceDCd27Cc22HV3qPNZKwGnZ8QwhLTc'
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
  .argv;

if (argv.ssl) {
  //electrumSsl = true;
  console.log("ssl not yet supported")
  process.exit()
}
if (argv.host) electrumHost = argv.host;
if (argv.port) electrumPort = argv.port;
if (argv.testnet) electrumNetwork = 'testnet';


// Update configuration

if (electrumNetwork == 'testnet' && !electrumSsl) electrumPort = 60001;


// Utility functions

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

    //addresses = ADDRESSES_SMALL.concat(ADDRESSES_LARGE, ADDRESSES_GIGANTIC);
    addresses = ADDRESSES_SMALL;
    for (i = 0; i < addresses.length; i++) {
      address = addresses[i];
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
