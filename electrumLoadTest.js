const ElectrumCli = require('electrum-client')
const bitcoin = require('bitcoinjs-lib')

// Run command: node electrumTest.js

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


const main = async () => {
  const ecl = new ElectrumCli(50001, '127.0.0.1', 'tcp');
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
      const balance = await ecl.blockchainScripthash_getBalance(scriptHash)
      const getBalanceTime = new Date() - getBalanceStart;

      const getTxHistoryStart = new Date();
      const history = await ecl.blockchainScripthash_getHistory(scriptHash)
      const getTxHistoryTime = new Date() - getTxHistoryStart;

      const getUtxoStart = new Date();
      const unspent = await ecl.blockchainScripthash_listunspent(scriptHash)
      const getUtxoTime = new Date() - getUtxoStart;

      console.log('balance: ', balance);
      console.log('history count: ', history.length);
      console.log('utxo count: ', unspent.length);
      console.log('getBalance time: ', getBalanceTime);
      console.log('getTxHistory time: ', getTxHistoryTime);
      console.log('getUtxo time: ', getUtxoTime);
      console.log()
    }

  } catch(e) {
    console.log(e)
  }
  await ecl.close()
}
main()
