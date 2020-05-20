#!/usr/bin/env node

const config = require('./lib/config').parse(process.argv)
const { setPort, readAddressFile, kvOut, getScriptHash } = require('./lib/utils')

const ElectrumCli = require('electrum-client')

// Update configuration
quietOutput = config.output_quiet;
compactOutput = config.output_compact;

electrumHost = config.host;
electrumNetwork = (config.testnet) ? 'testnet' : 'mainnet';
electrumPort = setPort(electrumNetwork, config.ssl, config.port);
electrumProto = 'tcp'
electrumSsl = config.ssl;

addresses = readAddressFile(config.addr);

testBalance = config.get_balance
testHistory = config.get_history
testUnspent = config.listunspent
testAll = (testBalance || testHistory || testUnspent) ? false : true;


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
      if (compactOutput) {
        header = 'address'
        if (testBalance || testAll) header += ',get_balanceTime';
        if (testHistory || testAll) header += ',get_historyCount,get_historyTime';
        if (testUnspent || testAll) header += ',listunspentCount,listunspentTime';
        console.log(header)
      }
    }

    for (i = 0; i < addresses.length; i++) {
      address = addresses[i];
      if (address == '') continue;
      addrCountTotal++;
      if (!compactOutput) console.log('address:', address);

      const scriptHash = getScriptHash(address);
      result = address

      try {
        if (testBalance || testAll ) {
          const get_balanceStart = new Date()
          const get_balance = await ecl.blockchainScripthash_getBalance(scriptHash)
          const get_balanceTime = new Date() - get_balanceStart
          result += ',' + get_balanceTime
          if (!compactOutput) console.log('get_balance result:', get_balance);
          if (!compactOutput) kvOut('get_balance time:', get_balanceTime);
        }
        if (testHistory || testAll) {
          const get_historyStart = new Date();
          const get_history = await ecl.blockchainScripthash_getHistory(scriptHash)
          const get_historyTime = new Date() - get_historyStart;
          result += ',' + get_history.length + ',' + get_historyTime
          if (!compactOutput) kvOut('get_history count:', get_history.length);
          if (!compactOutput) kvOut('get_history time:', get_historyTime);
        }
        if (testUnspent || testAll) {
          const listunspentStart = new Date();
          const unspent = await ecl.blockchainScripthash_listunspent(scriptHash)
          const listunspentTime = new Date() - listunspentStart;
          result += ',' + unspent.length + ',' + listunspentTime
          if (!compactOutput) kvOut('listunspent count:', unspent.length);
          if (!compactOutput) kvOut('listunspent time:', listunspentTime);
        }
        if (compactOutput) console.log(result);
      } catch(e) {
        addrCountErr++;
        if (!compactOutput) console.log('error', e);
      }
      if (!compactOutput) console.log();
    }

    if (!quietOutput) {
      if (compactOutput) console.log();
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
