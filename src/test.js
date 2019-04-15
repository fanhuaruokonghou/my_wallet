var mnemonic = ethers.utils.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
console.log(mnemonic);