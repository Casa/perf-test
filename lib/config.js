'use strict';

const yargs = require('yargs')

class ElectrumLoadTestConfig {
  addr;
  output_compact;
  output_quiet;
  measure_get_balance;
  measure_get_history;
  measure_listunspent;
  host;
  port;
  ssl;
  testnet;

  constructor(argv) {
    const config = yargs
      .group(['addr'], 'Input options:')
      .option('addr', {
        alias: 'a',
        description: 'Address file',
        type: 'string'
      })
      .group(['compact','quiet'], 'Output options:')
      .option('compact', {
        description: 'Compact output, line per address',
        type: 'boolean',
        default: false
      })
      .option('quiet', {
        alias: 'q',
        description: 'Suppress header & footer output',
        type: 'boolean',
        default: false
      })
      .group(['get_balance','get_history','listunspent'], 'Tests to run:')
      .option('get_balance', {
        description: 'Measure balance lookup',
        type: 'boolean',
        default: false
      })
      .option('get_history', {
        descrption: 'Measure total inputs',
        type: 'boolean',
        default: false
      })
      .option('listunspent', {
        description: 'Measure UTXOs',
        type: 'boolean',
        default: false
      })
      .group(['host','port','ssl','testnet'], 'Electrum server options:')
      .option('host', {
        alias: 'H',
        description: 'Server hostname or IP',
        type: 'string',
        default: '127.0.0.1'
      })
      .option('port', {
        alias: 'P',
        description: 'Server port',
        type: 'string',
        default: '50001'
      })
      .option('ssl', {
        alias: 's',
        description: 'Use SSL',
        type: 'boolean',
        default: false
      })
      .option('testnet', {
        alias: 't',
        description: 'Use bitcoin testnet',
        type: 'boolean',
        default: false
      })
      .usage('Usage: $0 [args]')
      .help()
      .alias('help', 'h')
      .showHelpOnFail(true, 'Specify --help for available options')
      .argv;

    this.addr = config.addr;
    this.output_compact = config.compact;
    this.output_quiet = config.quiet;
    this.measure_get_balance = config.get_balance;
    this.measure_get_history = config.get_history;
    this.measure_listunspent = config.listunspent;
    this.host = config.host;
    this.port = config.port;
    this.ssl = config.ssl;
    this.testnet = config.testnet;
  };

  static parse(argv) {
    return new ElectrumLoadTestConfig(argv);
  }
}

module.exports = ElectrumLoadTestConfig;
