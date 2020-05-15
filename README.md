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

### Examples using included datasets
```
# Measure UTXO count & corresponding request duration
#  for mainnet addresses w/many inputs/UTXOs:
node electrum.js --addr data/mainnet/addresses-large --listunspent --compact

# Measure historical input count & corresponding request duration
#  for testnet addresses w/100 or fewer inputs
#  in first 135500 blocks:
node electrum.js --testnet --addr data/testnet/addresses-all_0-135500 --get_history
```
