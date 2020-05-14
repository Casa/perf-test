const ElectrumCli = require('electrum-client')
const bitcoin = require('bitcoinjs-lib')

// Run command: node electrumTest.js

const ADDRESSES_SMALL = [
  '1AGyaDKdHWo8TcGADUCWd8JYXMQrky8Uko',
  '3EBaaBxgShLxq8w2dDjhSfeb476wRScjKK',
  '3Fs5uFKJRshVoPfhbSrZ9Z4yg5F93b2qAg'
];

const ADDRESSES_LARGE = [
  '16FSBGvQfy4K8dYvPPWWpmzgKM6CvrCoVy',
  '35hK24tcLEWcgNA4JxpvbkNkoAcDGqQPsP',
  '3Kzh9qAqVWQhEsfQz7zEQL1EuSx5tyNLNS',
  '16ftSEQ4ctQFDtVZiUBusQUjRrGhM3JYwe',
  '3C6qQDSRZVahLm5JryiF2zQFTeKzNQPfnH',
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

  // console.log(address, ' maps to ', reversedHash.toString('hex'))
  // console.log('hash ' + hash.toString('hex'));
  // console.log('reversed hash ' + reversedHash.toString('hex'));

  return reversedHash.toString('hex');
}


const main = async () => {
    const ecl = new ElectrumCli(60001, '127.0.0.1', 'tcp') // tcp or tls
    try {
        await ecl.connect() // connect(promise)
    } catch (e) {
        console.log('Caught an error while connecting to Electrum');
        console.log(e);
    }
    // ecl.subscribe.on('blockchain.headers.subscribe', (v) => console.log(v)) // subscribe message(EventEmitter)
    try {
        const ver = await ecl.server_version("CasaPerfTest", "1.4") // json-rpc(promise)
        console.log('server version:', ver);

        const fee = await ecl.blockchainEstimatefee(4)
        console.log('fee estimate: ' + fee)

        //const proof = await ecl.blockchainAddress_getProof("12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX")
        //console.log(proof)

        addresses = ADDRESSES_SMALL.concat(ADDRESSES_LARGE, ADDRESSES_GIGANTIC);
        addresses.forEach(function(address) {
          console.log(`address: ${address}`);

          const scriptHash = getScriptHash(address);

          const getBalanceStart = new Date();
          const balance = await ecl.blockchainScripthash_getBalance(scriptHash)
          const getBalanceTime = new Date() - getBalanceStart;
          console.log('balance: ', balance);
          console.log('getBalanceTime: ', getBalanceTime);

          const getTxHistoryStart = new Date();
          const history = await ecl.blockchainScripthash_getHistory(scriptHash)
          const getTxHistoryTime = new Date() - getTxHistoryStart;
          console.log('tx history: ', history);
          console.log('getTxHistoryTime: ', getTxHistoryTime);

          const getUtxoStart = new Date();
          const unspent = await ecl.blockchainScripthash_listunspent(scriptHash)
          const getUtxoTime = new Date() - getUtxoStart;
          console.log('UTXOs: ', unspent);
          console.log('getUtxoTime: ', getUtxoTime);
        });

    }catch(e){
        console.log(e)
    }
    await ecl.close() // disconnect(promise)
}
main()
