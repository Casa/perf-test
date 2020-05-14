const ElectrumCli = require('electrum-client')
const bitcoin = require('bitcoinjs-lib')

// Run command: node electrumTest.js

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
    try{
        // const ver = await ecl.server_version("stacie-test", "1.4") // json-rpc(promise)
        const ver = await ecl.server_version("2.7.11", "2.0") // json-rpc(promise)

        console.log('Electrs Version:');
        console.log(ver) // returns the software version and the protocol version
        console.log();

        // const fee = await ecl.blockchainEstimatefee(4)
        // console.log('fee estimate: ' + fee)

        //const proof = await ecl.blockchainAddress_getProof("12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX")
        //console.log(proof)

        // const address  = '2MyAYcxeaee6MLZPMKL2hi1kK3BDB1FsheT';
        const address = '3Bh9FJxq6Y4csLVP1C6Pbd3BVxXHeMnVzy';
        console.log(`Using address ${address}`);
        console.log();
        const scriptHash = getScriptHash(address);

        // const getBalanceStart = new Date();
        // const balance = await ecl.blockchainScripthash_getBalance(scriptHash)
        // const getBalanceTime = new Date() - getBalanceStart;
        // console.log('Balance: ');
        // console.log(balance);
        // console.log();

        // const getTxHistoryStart = new Date();
        // const history = await ecl.blockchainScripthash_getHistory(scriptHash)
        // const getTxHistoryTime = new Date() - getTxHistoryStart;
        // console.log('Electrum Transaction history');
        // console.log(history)
        // console.log();

        // console.log('Verbose Transaction');
        // Unclear if the verbose param is actually getting picked up. See Keymaster for code that makes the call directly
        // const transaction = await ecl.blockchainTransaction_get(history[0].tx_hash, true);
        // console.log(transaction);
        // console.log();

        const getUtxoStart = new Date();
        const unspent = await ecl.blockchainScripthash_listunspent(scriptHash)
        const getUtxoTime = new Date() - getUtxoStart;
        console.log('UTXOs:');
        console.log(unspent)

    }catch(e){
        console.log(e)
    }
    await ecl.close() // disconnect(promise)
}
main()
