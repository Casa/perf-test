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

socketCount = config.socket_count;
socketPool = [];
socketPromises = [];

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

  // Create socket pool
  for (let i = 0; i < socketCount; i++) {
    const ecl = new ElectrumCli(electrumPort, electrumHost, electrumProto);
    if (!quiet) console.error(`\nConnecting to Electrum server: ${electrumHost}:${electrumPort}`);
    try {
      await ecl.connect();
    } catch (e) {
      console.error('Error connecting:', e);
      process.exit(1);
    }
    if (verbose) {
      const ver = await ecl.server_version("CasaPerfTest", "1.4");
      const fee = await ecl.blockchainEstimatefee(4)
      console.error(`  server version: ${ver}`);
      console.error(`  fee estimate: ${fee}`)
    }
    if (!quiet) console.error();
    socketPool.push(ecl);
  }

  // Iterate over addresses & sockets
  let addrTotal = addresses.length;
  let addrErr = 0;
  while (addresses.length > 0) {
    for (let i = 0; i < socketPool.length; i++) {
      try {
        let address = addresses.pop();
        socketPromises.push(run_measurement(socketPool[i], address, measurement));
        if (addresses.length == 0) break;
      } catch (e) {
        addrErr++;
        if (verbose > 2) console.error('addr error:', e);
      }
    }
  }
  if(verbose) console.log(`Created ${socketPromises.length} promises. Now waiting for them to finish`);

  // Print header
  let header = 'address'
  if (measurement.get_balance || measurement.all) header += ',get_balanceConfirmed,get_balanceUnconfirmed,get_balanceTime';
  if (measurement.get_history || measurement.all) header += ',get_historyCount,get_historyTime';
  if (measurement.listunspent || measurement.all) header += ',listunspentCount,listunspentTime';
  console.log(header)

  // Wait for promises to finish
  await Promise.all(socketPromises);

  // Print summary
  if (!quiet) {
    console.error(`\nAddresses tested: ${addrTotal}`);
    console.error(`Addresses errored: ${addrErr.length}\n`);
  }

  // Close sockets
  for (let i = 0; i < socketPool.length; i++) {
    await socketPool[i].close()
  }
}
main()
// EOF
