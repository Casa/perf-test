#!/usr/bin/env node

const ElectrumCli = require('electrum-client')
const bitcoin = require('bitcoinjs-lib')

const openSockets = [];
const promises = [];
const electrumHost = '127.0.0.1';
const electrumNetwork = 'mainnet';
const electrumPort = '50001';
const electrumProto = 'tcp';

const ADDR_MAINNET = '1AGyaDKdHWo8TcGADUCWd8JYXMQrky8Uko';
//const ADDR_MAINNET = '3EBaaBxgShLxq8w2dDjhSfeb476wRScjKK';
//const ADDR_TESTNET = '2MsFEwgnorZrd6Eypb2L9cL4gdB4hHSpJMu';

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

const main = async () => {
  const scriptHash = getScriptHash(ADDR_MAINNET);
  
  for (let i = 0; i < 100; i++) {
    const ecl = new ElectrumCli(electrumPort, electrumHost, electrumProto);
    await ecl.connect();

    openSockets.push(ecl);
  
    // Fire off the get balance call but don't wait for it before continuing the loop.
    const get_balanceStart = new Date();
    const get_balancePromise = ecl.blockchainScripthash_getBalance(scriptHash).then(() => {
      const get_balanceTime = new Date() - get_balanceStart
      console.log('get_balance time:', get_balanceTime);
    })
  
    // Keep track of the promise so we can wait for all of them to finish later
    promises.push(get_balancePromise)
  
    // Now go open another socket!
  }
  
  // Wait for all the promises to finish.
  // Note that with Promise.all, if one promise fails, the result of Promise.all fails
  console.log('waiting for all promises to finish');
  await Promise.all(promises);
  console.log('all promises finished');
  
  // Close up all the sockets
  openSockets.forEach(socket => {
    socket.close;
  });
  console.log('all sockets closed');
  process.exit();
}
main()
