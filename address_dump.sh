#!/bin/bash

# This script requires jq for JSON parsing
[ "$(jq --version &>/dev/null ; echo $?)" != 0 ] && echo jq not found && exit 1

# Look up the latest block if none is specified
block_head="$(bitcoin-cli getblockchaininfo | jq .blocks)"
block_num="${1:-$block_head}"

# Get list of all transaction IDs in block
block_hash="$(bitcoin-cli getblockhash $block_num)"
block_txids="$(bitcoin-cli getblock $block_hash | jq -cr .tx | sed 's/,/\n/g' | tr -d '",[]')"

# Print the output address(es) of each transaction
for tx in $block_txids; do
  bitcoin-cli getrawtransaction $tx true | jq -c '.vout[].scriptPubKey.addresses' | sed 's/,/\n/g' | tr -d '",[]' | grep -ve '^null$'
done
