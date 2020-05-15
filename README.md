## Installation
```
npm install 
```

## Usage

### Display help

```
node electrum.js -h
```

### Test connection using sample data
```
node electrum.js [-H <electrum_host>] [-P <electrum_port>]
node electrum.js --testnet
```
### Input options
  - `--addr <address_file>` expects a file with one address per line

### Output options
  - `--compact` lists all metrics on a single line per address, comma separated
  - `--quiet` suppresses headers and footers

### Measurements to run
  - `get_balance` measures time (ms) to complete the [get_balance](https://electrumx.readthedocs.io/en/latest/protocol-methods.html#blockchain-scripthash-get-balance) query
  - `get_history` counts total inputs and measures time (ms) to complete the [get_history](https://electrumx.readthedocs.io/en/latest/protocol-methods.html#blockchain-scripthash-get-history) query
  - `listunspent` counts current UTXOs and measures time (ms) to complete the [listunspent](https://electrumx.readthedocs.io/en/latest/protocol-methods.html#blockchain-scripthash-listunspent) query
  - If no measurements are specified then all measurements will run

### Electrum server options
  - `--host` hostname or IP
  - `--port` port (defaults to 50001 for mainnet, 60001 for testnet)
  - `--ssl` use TLS (not yet implemented)
  - `--testnet` use testnet (default is to use mainnet)

## Bundled datasets

### Mainnet

<dl>
  <dt>addresses-gigantic</dt>
  <dd>Addresses with &gt;1000 inputs, including "Satoshi Dice" (500k tx) and "Free Ross donation" (3472 tx)</dd>
  <dt>addresses-large</dt>
  <dd>Addresses with 100 &lt; inputs &le; 1000 (5 addresses total)</dd>
  <dt>addresses-small</dt>
  <dd>Addresses with &le;100 inputs (3 addresses total)</dd>
  <dt>addresses-100richest</dt>
  <dd>Top 100 richest BTC addresses, as listed by bitinfocharts.com on 2020-05-15</dd>
</dl>

### Testnet

<dl>
  <dt>addresses-all_0-135500</dt>
  <dd>All addresses used as inputs in the first 135500 blocks</dd>
  <dt>addresses-small_0-135500</dt>
  <dd>All addresses with &le;100 inputs in the first 135000 blocks</dd>
</dl>
