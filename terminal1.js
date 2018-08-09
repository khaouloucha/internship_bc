const crypto = require('crypto')
const Swarm = require('discovery-swarm')
const defaults = require('dat-swarm-defaults')
const getPort = require('get-port')
const readline = require('readline')

//-----Blockchain Code
const SHA256 = require("crypto-js/sha256");

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("BLOCK MINED: " + this.hash);
    }
}


class Blockchain{
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
    }

    createGenesisBlock() {
        return new Block(0, "01/01/2017", "Genesis block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }

        return true;
    }
}
//----Blockchain Code

//----main
var bc = new Blockchain();
console.log('*** T1: New block created ***');
var b = new Block(1, "20/07/2017", { amount: 4 });
var h = b.calculateHash();
//----main

//----Conx Code
console.log('*** T1: Establishing connection ***');
const peers = {}
let connSeq = 0
const myId = crypto.randomBytes(32)
console.log(' identity: ' + myId.toString('hex'))
let rl

function log () {
    if (rl) {
      rl.clearLine()    
      rl.close()
      rl = undefined
    }
    for (let i = 0, len = arguments.length; i < len; i++) {
      console.log(arguments[i])
    }
    askUser()
}

const askUser = async () => {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
   
    //!!!!!!!!!!!!!!!!
    rl.question('Send message: ', message => {
        message = h + ',' + b.index + ',' + b.previousHash + ',' + b.timestamp + ',' + JSON.stringify(b.data)
      // Broadcast to peers
      for (let id in peers) {
        peers[id].conn.write(message)  
      }
      rl.close()
      rl = undefined
      askUser()
    });
    //!!!!!!!!!!!!!!!!
}

const config = defaults({
    // peer-id
    id: myId,
})

const sw = Swarm(config);

(async () => {
    const port = await getPort()

    sw.listen(port)
    console.log('Listening to port: ' + port)

    sw.join('our-fun-channel')

    sw.on('connection', (conn, info) => {
      // Connection id
      const seq = connSeq
  
      const peerId = info.id.toString('hex')
      log(`Connected #${seq} to peer: ${peerId}`)
  
      // Keep alive TCP connection with peer
      if (info.initiator) {
        try {
          conn.setKeepAlive(true, 600)
        } catch (exception) {
          log('exception', exception)
        }
      }
    
      conn.on('data', data => {
        // Here we handle incomming messages
        log(
          'Received Message from peer ' + peerId,
          '----> ' + data.toString()
        )
      })
  
      conn.on('close', () => {
        // Here we handle peer disconnection
        log(`Connection ${seq} closed, peer id: ${peerId}`)
        // If the closing connection is the last connection with the peer, removes the peer
        if (peers[peerId].seq === seq) {
          delete peers[peerId]
        }
      })
  
      // Save the connection
      if (!peers[peerId]) {
        peers[peerId] = {}
      }
      peers[peerId].conn = conn
      peers[peerId].seq = seq
      connSeq++
  
    })
  
    // Read user message from command line
    askUser()  
  
  })()

//----Connection Code 

//----main
console.log('*** T1 : validating block ***');



if(bc.isChainValid()){
const askUser = async () => {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question('Send message: ', message => {
        message = 'Valid';
      for (let id in peers) {
        peers[id].conn.message  
      }
      rl.close()
      rl = undefined
      askUser()
    });}
    bc.addBlock(b);
}
 else {
    const askUser = async () => {
        rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })
        rl.question('Send message: ', message => {
            message = 'Not valid';
          for (let id in peers) {
            peers[id].conn.message  
          }
          rl.close()
          rl = undefined
          askUser()
        });}
}

//----main

