# API
The API is made of two things:
- a JSON file which is showing all the data at the current time - used for bootstraping.
- an web socket which gives changes in real time.
## Base Stats
### JSON path
/stats.json
### Data Structure
#### totalsupply
Total supply of Verium.
- type: Number (float)

#### difficulty
Mining difficulty.
- type: Number (float)

#### blocks
Number of blocks
- type: Number (integer)

#### blocktime
Current block time.
- type: Number (float)

#### blockreward
The vrm that you will be rewarded for finding the next block.
- type: Number (float)

#### nethashrate
The hash rate of the network in kH/m
- type: Number (float)

#### blocktime_log
Record of the blocktime of the last 12 blocks.
- type Array(Number)
- limit 12

#### nethashrate_log
Record of the last 12 hash rate changes.
- type Array(Number)
- limit 12

#### blockdata
Record of the last 12 blocks.

- type Array(Object)
- limit 12
- inner object properties:
 * height: block number
     - type Number (float)
 * age: age of the block in unix time (seconds)
     - type: Number (integer)
 * size: size of the block in bytes
     - type: Number (integer)
 * transactions: Number of transaction in that block
     - type: Number (integer)
 * sent: vrm sent in that block
     - type: Number (float)

### Web Socket
It's just a partal of the stat.json.
- Every property that is not array should just replace the old one.
- Every property that is an array should be pushed in a FIFO manner.

## Location numbers
### JSON Path
/loc_num.json
### Data Structure
- type Array(Object)
- inner object properties:
   * country abbreviation (key)
      - type: String
      - size: 2
   * number of clients from that country (value)
      - type: Number (integer)

### Web Socket
- type Object
- inner object properties:
 * keys
     - inc_country: request to increment the number of peers on that country
     - dec_country: request to decrement the number of peers on that country
 * value
    - country abbreviation
      * type: String
      * size: 2
