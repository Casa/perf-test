#!/usr/bin/env node

const config = require('./lib/config').parse(process.argv)
const { setPort, readAddressFile, run_measurement } = require('./lib/utils')

const ElectrumCli = require('electrum-client')

// Update configuration
const quiet = config.output_quiet;
const verbose = (quiet) ? 0 : config.output_verbose;

electrumHost = config.host;
electrumNetwork = (config.testnet) ? 'testnet' : 'mainnet';
electrumPort = setPort(electrumNetwork, config.ssl, config.port);
electrumProto = 'tcp'
electrumSsl = config.ssl;

let addresses = [];
const ADDR_MAINNET = ['1AGyaDKdHWo8TcGADUCWd8JYXMQrky8Uko','3EBaaBxgShLxq8w2dDjhSfeb476wRScjKK'];
const ADDR_TESTNET = ['2MsFEwgnorZrd6Eypb2L9cL4gdB4hHSpJMu','2MsFPKF1QNDPcP5UHgHwqVXCF5esDaHQYRr'];

if (config.addr) {
  if (verbose) console.error(`\nReading address list from file: ${config.addr}`);
  addresses = readAddressFile(config.addr);
} else {
  if (electrumNetwork == 'mainnet') {
    if (verbose) console.error('\nUsing built-in mainnet addresses');
    addresses = ADDR_MAINNET
  } else {
    if (verbose) console.error('\nUsing built-in testnet addresses');
    addresses = ADDR_TESTNET
  }
}

measurement = config.measure_options;
measurement.all = !Object.values(measurement).some(Boolean);
if (verbose > 2) console.log('measurement:', measurement);

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
    let addrTotal = addresses.length;
    let addrErr = [];

    const ver = await ecl.server_version("CasaPerfTest", "1.4");
    const fee = await ecl.blockchainEstimatefee(4)
    if (verbose) {
      console.error(`  server version: ${ver}`);
      console.error(`  fee estimate: ${fee}`)
    }
    if (!quiet) console.error();

    let header = 'address'
    if (measurement.get_balance || measurement.all) header += ',get_balanceConfirmed,get_balanceUnconfirmed,get_balanceTime';
    if (measurement.get_history || measurement.all) header += ',get_historyCount,get_historyTime';
    if (measurement.listunspent || measurement.all) header += ',listunspentCount,listunspentTime';
    console.log(header)

    while (addresses.length) {
      address = addresses.pop();
      if (address == '') continue;
      //if (verbose > 1) console.log(`\naddress: ${address}`);

      //const scriptHash = getScriptHash(address);
      //let result = 'address';

      //try {
        //if (testBalance || testAll ) {
        //  const get_balanceStart = new Date()
        //  const get_balance = await ecl.blockchainScripthash_getBalance(scriptHash)
        //  const get_balanceTime = new Date() - get_balanceStart
        //  result += ',' + get_balanceTime
        //  if (verbose > 1) {
        //    console.log('get_balance result:', get_balance);
        //    console.log('get_balance time:', get_balanceTime);
        //  }
        //}
        //if (testHistory || testAll) {
        //  const get_historyStart = new Date();
        //  const get_history = await ecl.blockchainScripthash_getHistory(scriptHash)
        //  const get_historyTime = new Date() - get_historyStart;
        //  result += address + ',' + get_history.length + ',' + get_historyTime
        //  if (verbose > 1) {
        //    console.log(`get_history count: ${get_history.length}`);
        //    console.log(`get_history time: ${get_historyTime}`);
        //  }
        //}
        //if (testUnspent || testAll) {
        //  const listunspentStart = new Date();
        //  const unspent = await ecl.blockchainScripthash_listunspent(scriptHash)
        //  const listunspentTime = new Date() - listunspentStart;
        //  result += ',' + unspent.length + ',' + listunspentTime
        //  if (verbose > 1) {
        //    console.log(`listunspent count: ${unspent.length}`);
        //    console.log(`listunspent time: ${listunspentTime}`);
        //  }
        //}
        //if (verbose < 2) console.log(result);
      //} catch(e) {
      //  addrErr.push(e);
      //}
      await run_measurement(ecl, address, measurement);
      //.then(
      //  result => console.log(result),
      //  error => console.error(error)
      //);
    }

    if (!quiet) {
      console.error(`\nAddresses tested: ${addrTotal}`);
      console.error(`Addresses errored: ${addrErr.length}\n`);
    }

  } catch(e) {
    console.error(e)
  }
  await ecl.close()
}
main()
// EOF
