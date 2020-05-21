#!/usr/bin/env node

const config = require('./lib/config').parse(process.argv)
const { setPort, readAddressFile, kvOut, getScriptHash } = require('./lib/utils')

const ElectrumCli = require('electrum-client')

// Update configuration
const quiet = config.output_quiet;
const verbose = (quiet) ? 0 : config.output_verbose;

electrumHost = config.host;
electrumNetwork = (config.testnet) ? 'testnet' : 'mainnet';
electrumPort = setPort(electrumNetwork, config.ssl, config.port);
electrumProto = 'tcp'
electrumSsl = config.ssl;

let addresses;
const ADDR_MAINNET = ['1AGyaDKdHWo8TcGADUCWd8JYXMQrky8Uko','3EBaaBxgShLxq8w2dDjhSfeb476wRScjKK'];
const ADDR_TESTNET = ['2MsFEwgnorZrd6Eypb2L9cL4gdB4hHSpJMu','2MsFPKF1QNDPcP5UHgHwqVXCF5esDaHQYRr'];

if (config.addr) {
  if (verbose) console.error(`\nReading address list from file: ${config.addr}`);
  addresses = readAddressFile(config.addr);
} else {
  if (verbose) console.error('\nUsing built-in test addresses');
  addresses = (electrumNetwork == 'mainnet') ? ADDR_MAINNET : ADDR_TESTNET;
}

testBalance = config.get_balance
testHistory = config.get_history
testUnspent = config.listunspent
testAll = (testBalance || testHistory || testUnspent) ? false : true;


// Main

const main = async () => {
  if (!quiet) console.error(`\nConnecting to Electrum server: ${electrumHost}:${electrumPort}`);
  const ecl = new ElectrumCli(electrumPort, electrumHost, electrumProto);
  try {
      await ecl.connect();
  } catch (e) {
      console.error('Error connecting:', e);
      process.exit(1);
  }
  try {
    addrCountTotal = 0;
    addrCountErr = 0;

    const ver = await ecl.server_version("CasaPerfTest", "1.4");
    const fee = await ecl.blockchainEstimatefee(4)
    if (verbose) {
      console.error(`  server version: ${ver}`);
      console.error(`  fee estimate: ${fee}`)
    }
    if (!quiet) console.error();

    let header = 'address'
    if (testBalance || testAll) header += ',get_balanceTime';
    if (testHistory || testAll) header += ',get_historyCount,get_historyTime';
    if (testUnspent || testAll) header += ',listunspentCount,listunspentTime';
    console.log(header)

    for (i = 0; i < addresses.length; i++) {
      address = addresses[i];
      if (address == '') continue;
      addrCountTotal++;
      if (verbose > 1) console.log(`address: ${address}`);

      const scriptHash = getScriptHash(address);
      let result = 'address';

      try {
        if (testBalance || testAll ) {
          const get_balanceStart = new Date()
          const get_balance = await ecl.blockchainScripthash_getBalance(scriptHash)
          const get_balanceTime = new Date() - get_balanceStart
          result += ',' + get_balanceTime
          if (verbose > 1) {
            console.log('get_balance result:', get_balance);
            kvOut('get_balance time:', get_balanceTime);
          }
        }
        if (testHistory || testAll) {
          const get_historyStart = new Date();
          const get_history = await ecl.blockchainScripthash_getHistory(scriptHash)
          const get_historyTime = new Date() - get_historyStart;
          result += address + ',' + get_history.length + ',' + get_historyTime
          if (verbose > 1) {
            console.log(`get_history count: ${get_history.length}`);
            console.log(`get_history time: ${get_historyTime}`);
          }
        }
        if (testUnspent || testAll) {
          const listunspentStart = new Date();
          const unspent = await ecl.blockchainScripthash_listunspent(scriptHash)
          const listunspentTime = new Date() - listunspentStart;
          result += ',' + unspent.length + ',' + listunspentTime
          if (verbose > 1) {
            console.log(`listunspent count: ${unspent.length}`);
            console.log(`listunspent time: ${listunspentTime}`);
          }
        }
        if (verbose < 2) console.log(result);
      } catch(e) {
        addrCountErr++;
        if (verbose) console.log('error', e);
      }
    }

    if (!quiet) {
      console.error(`\nAddresses tested: ${addrCountTotal}`);
      console.error(`Addresses errored: ${addrCountErr}\n`);
    }

  } catch(e) {
    console.error(e)
  }
  await ecl.close()
}
main()
// EOF
