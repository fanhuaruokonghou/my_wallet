// const crypto = require('crypto')
// const alice = crypto.createECDH('secp256k1');
// const bob = crypto.createECDH('secp256k1');
//
// //生成公钥和私钥
// alice.setPrivateKey('880f21dd86691d4ffcbdc8097959b1eafe95f906ea73f7e3bda5b7c851e023a7', 'hex');
// bob.setPrivateKey('77315fe58ddd21b61dff54a89995fdb4ee19148e3f8a61d87017ce3d686b15eb', 'hex');
//
// // alice.generateKeys()
// // bob.generateKeys()
// console.log('alice:' + alice.getPublicKey().toString('hex'))
// console.log('alice:' + alice.getPrivateKey().toString('hex'))
// console.log('bob:' + bob.getPublicKey().toString('hex'))
// console.log('bob:' + bob.getPrivateKey().toString('hex'))
// //计算共享密钥相同
// const alice_secret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
// const bob_secret = bob.computeSecret(alice.getPublicKey(), null, 'hex');
//
// //两个共享密钥应该相同
// console.log(alice_secret == bob_secret);    //true
//
// console.log(alice_secret)





// generate message to sign
// const msg = randomBytes(32)
// console.log(msg.toString('hex'))
// generate privKey
// let privKey
// do {
//     privKey = randomBytes(32)
// } while (!secp256k1.privateKeyVerify(privKey))
//
// // get the public key in a compressed format
// const pubKey = secp256k1.publicKeyCreate(privKey)
// console.log("pub:" + pubKey.toString('hex'))
// // sign the message
// const sigObj = secp256k1.sign(msg, privKey)
//
// // verify the signature
// console.log(secp256k1.verify(msg, sigObj.signature, pubKey))
// => true
APP = {
    hello:function (index) {
        const bip39 = require('bip39');
        const bip32 = require('bip32');
        const ethers = require('./ethers-v4.min');
        let privateKeyList = new Array(index.length);
        // import {ethers} from './ethers-v4.min.js';
        // import {bip39} from './bip39.js'
        let priv = ethers.utils.bigNumberify(ethers.utils.randomBytes(32));
        let mnemonic = ethers.utils.HDNode.entropyToMnemonic(ethers.utils.randomBytes(32));
        let path = "m/44'/60'/0'/0/";
        priv = priv._hex;
        console.log(priv);
        console.log(mnemonic);
        let wallet = new ethers.Wallet(priv);
        let seed= bip39.mnemonicToSeedSync(mnemonic, wallet.privateKey);
        let key = bip32.fromSeed(seed);
        for (let i = 0; i < index.length; i++) {
            privateKeyList[i] = key.derivePath(path + index[i]).publicKey.toString('hex').substr(2,64);
            console.log(key.derivePath(path + index[i]).publicKey.toString('hex'))
        }
        return privateKeyList;
    }

}

let e = APP.hello([1,2,3,4,5,6,7]);

for (let i = 0; i < e.length; i++) {
    console.log(e[i]);
}


