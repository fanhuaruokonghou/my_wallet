App = {
    provider: null,
    activeWallet: null,
    contract: null,
    contractWithSigner: null,

    setupWallet: function (wallet) {  //初始化钱包
        //建立一个provider对象连接到以太坊的节点
        App.provider = new ethers.providers.JsonRpcProvider("http://47.102.203.221:8545");
        //  将钱包连接到节点
        App.activeWallet = wallet.connect(App.provider);
        // 关联一个有过签名钱包对象
        App.contractWithSigner = App.contract.connect(App.activeWallet);

        App.initToken();  //初始化代币合约对象App.contract
    },

    //进度条
    updateLoading: function(progress) {
      console.log(progress);
      $("#loading-status").val( parseInt(progress * 100) + '%');
    },

    //通过keystore文件导入密钥
    //privateName  私钥钱包名字
    //json  keystore文件的json字符串
    //password  用户用于解密keystore文件的密钥
    initLoadJson: function(privateName, json, password) {
        let storage = window.localStorage;
        if (ethers.utils.getJsonWalletAddress(json)) {
            ethers.Wallet.fromEncryptedJson(json, password).then(function(wallet) {
                App.setupWallet(wallet);
                storage.setItem(privateName, json);
            }, function(error) {
                if (error.message === 'invalid password') {
                    alert('Wrong Password');
                } else {
                  alert('解密账号发生错误...');
                  console.log(error);
                }
            });
        } else {
            alert('Unknown JSON wallet format');
        }
    },

    //导入私钥
    //privateKey  私钥  64位的16进制字符，即256bit
    initLoadKey: function(privateKey) {
        if (privateKey.substring(0, 2) !== '0x') { privateKey = '0x' + privateKey; }
        // 创建对应的钱包
        App.setupWallet(new ethers.Wallet(privateKey));
    },

    //判断输入的是否是助记词
    //mnemonic  助记词
    checkMnemonic: function(mnemonic){
        if(ethers.utils.HDNode.isValidMnemonic(mnemonic)){
            return true;
        }else{
            return false;
        }
    },

    //通过助记词导入钱包
    //mnemonic  助记词12-24个单词
    //HDName  钱包名字
    initMnemonic: function(HDName, mnemonic, password) {
        let privateKey = null;
        let wallet = null;
        let path = "m/44'/60'/0'/0/0";
        let storage = window.localStorage;
        if(password === ''){
            wallet = new ethers.Wallet.fromMnemonic(mnemonic, path);
        }else{
            let bip39 = require('bip39');
            let bip32 = require('bip32');
            let seed= bip39.mnemonicToSeedSync(mnemonic, password);
            let key = bip32.fromSeed(seed);
            privateKey = key.derivePath(path).privateKey.toString('hex');
            wallet = new ethers.Wallet(privateKey);
        }
        App.setupWallet(wallet);
        storage.setItem(HDName, mnemonic);
    },

    //导出私钥为json格式
    //password  私钥的加密密钥设置
    exportKeystore: function(privateName, password) {
        App.activeWallet.encrypt(password).then(function(json) {
            let blob = new Blob([json], {type: "text/plain;charset=utf-8"});
            saveAs(blob, privateName + '.json');
    });
    },

    //创建HD钱包
    //HDName 钱包名字
    // password  HD钱包的密钥
    creatHDwallet: function(HDName, password){
        let mnemonic = ethers.utils.HDNode.entropyToMnemonic(ethers.utils.randomBytes(32));
        let privateKey = null;
        let wallet = null;
        let path = "m/44'/60'/0'/0/0";
        let storage = window.localStorage;
        if(password === ''){
            wallet = new ethers.Wallet.fromMnemonic(mnemonic, path);
        }else{
            let bip39 = require('bip39');
            let bip32 = require('bip32');
            let seed= bip39.mnemonicToSeedSync(mnemonic, password);
            let key = bip32.fromSeed(seed);
            privateKey = key.derivePath(path).privateKey.toString('hex');
            wallet = new ethers.Wallet(privateKey);
        }
        App.setupWallet(wallet);
        storage.setItem(HDName, mnemonic);
    },

    //切换到HD钱包衍生的第index账户
    //HDName  钱包名字
    //password  密码
    //index  由数字组成的字符串 0 <= index <= 2^32 - 1
    switchAccounts: function(HDName, password, index){
        let storage = window.localStorage;
        let mnemonic = storage.getItem(HDName);
        let privateKey = null;
        let wallet = null;
        let path = "m/44'/60'/0'/0/" + index;
        if(password === ''){
            wallet = new ethers.Wallet.fromMnemonic(mnemonic, path);
        }else{
            let bip39 = require('bip39');
            let bip32 = require('bip32');
            let seed= bip39.mnemonicToSeedSync(mnemonic, password);
            let key = bip32.fromSeed(seed);
            privateKey = key.derivePath(path).privateKey.toString('hex');
            wallet = new ethers.Wallet(privateKey);
        }
        App.setupWallet(wallet);
    },

    //创建公私钥对钱包
    //privateName  私钥钱包名字
    //password  密码
    createPrivWallet: function(privateName, password){
        let randomNumber = ethers.utils.bigNumberify(ethers.utils.randomBytes(32));
        let privateKey = randomNumber._hex;
        let storage = window.localStorage;
        if (privateKey.substring(0, 2) !== '0x') { privateKey = '0x' + privateKey; }
        let provider = new ethers.providers.JsonRpcProvider("http://47.102.203.221:8545");
        let wallet = new ethers.Wallet(privateKey);
        let activeWallet = wallet.connect(provider);
        activeWallet.encrypt(password).then(function(json) {
            storage.setItem(privateName, json);
            console.log(storage.getItem(privateName));
        });
        App.setupWallet(wallet);
    },

    //切换到私钥钱包
    //privateName  私钥钱包名字
    //password  密码
    switchPrivateKey: function(privateName, password){
        let storage = window.localStorage;
        let json = storage.getItem(privateName);
        if (ethers.utils.getJsonWalletAddress(json)) {
            ethers.Wallet.fromEncryptedJson(json, password).then(function(wallet) {
                App.setupWallet(wallet);
            }, function(error) {
                if (error.message === 'invalid password') {
                    alert('Wrong Password');
                } else {
                    alert('解密账号发生错误...');
                    console.log(error);
                }
            });
        } else {
            alert('Unknown JSON wallet format');
        }
    },

    initToken: function() {  //初始化代币合约
        $.getJSON('MyAdvancedToken.json', function(data) {
            // 智能合约地址
            const address = data.networks["1001"].address;
            console.log(address);

            // 初始化智能合约对象
            App.contract = new ethers.Contract(address, data.abi, App.provider);
            console.log(App.contract);
            console.log("contract:" + App.contract);
        });
    },


    //检验地址
    checkAddress: function(targetAddress) {
        try {
            ethers.utils.getAddress(targetAddress);
            return true;
        } catch (error) {
            return false;
        }
    },

    //转移以太币
    //targetAddress  目标地址
    //ethAmount  金额
    setupSendEther: function(targetAddress, ethAmount) {
        if(App.checkAddress(targetAddress)){
            App.activeWallet.sendTransaction({
                to: ethers.utils.getAddress(targetAddress),
                value: ethers.utils.parseEther(ethAmount),
            }).then(function(tx) {
                console.log(tx);
                alert('Success!');
                
            }, function(error) {
                console.log(error);
                alert('Error \u2014 ' + error.message);
            });
            
        }else {
            console.log("地址或金额错误！")
        }
    },

    //转移代币
    //targetTokenAddress  目标地址
    //tokenAmount  代币金额
    setupSendToken: function(targetTokenAddress, tokenAmount) {
        if(App.checkAddress(targetTokenAddress)){
            App.provider.getGasPrice().then((gasPrice) => {
                // gasPrice is a BigNumber; convert it to a decimal string
                gasPriceString = gasPrice.toString();
                console.log("Current gas price: " + gasPriceString);
            });
            App.contractWithSigner.transfer(targetTokenAddress, tokenAmount, {
                gasLimit: 500000,
                // 偷懒，直接使用 2gwei
                gasPrice: ethers.utils.parseUnits("2", "gwei")
            }).then(function(tx) {
                console.log(tx);
                alert('Success!');
            }, function(error) {
                console.log(error);
                alert('Error \u2014 ' + error.message);
            });
            
        }else {
            console.log("地址错误！！")
        }
    },

    //代币充值
    //ethAmount  充值金额
    rechargeToken: function (ethAmount) {
        App.contractWithSigner.recharge({
            gasLimit: 500000,
            // 偷懒，直接使用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei"),
            value: ethers.utils.parseEther(ethAmount)
        });
        
    },

    //提现
    //tokenAmount 提现的代币金额
    withdrawToken: function (tokenAmount) {
        App.contractWithSigner.withdraw(tokenAmount, {
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        
    },

    //在注册的时候生成用于用户协商密钥的mnemonic
    createECDHNemonic: function(userId, password){
        let storage = window.localStorage;
        let mnemonic = ethers.utils.HDNode.entropyToMnemonic(ethers.utils.randomBytes(32));
        let privateKey = ethers.utils.bigNumberify(ethers.utils.randomBytes(32));
        let wallet = new ethers.Wallet(privateKey);
        wallet.encrypt(password).then(function(json) {
            storage.setItem(userId + 'priv', json);
            console.log(storage.getItem(privateName));
        });
        storage.setItem(userId + 'ECDH', mnemonic);
    },



    //密钥协商  可以用于发布交易时，也可以用于用户解密时
    ECDH: function (userId, nonce, password, method) {
        const crypto = require('crypto');
        const alice = crypto.createECDH('secp256k1');
        let getPrivate = new Promise(function (resolve, reject) {
            try {
                let privateKey =  App.getPublicKey(userId, nonce, password);
                resolve(privateKey);
            }catch (e) {
                reject(e);
            }
        });
        getPrivate.then((privateKey) =>{
            alice.setPrivateKey(privateKey, 'hex');
            let publicKey = alice.getPublicKey('hex');
            if(method === 'tx'){
                return publicKey;
            }else {
                const alice_secret = alice.computeSecret(publicKey, null, 'hex');
            }

        }).catch((err) =>{
            console.log(err);
        });
        // const alice_secret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
        // const bob_secret = bob.computeSecret(alice.getPublicKey(), null, 'hex');
    },

    //生成确定性密钥
    //userId  用户的唯一名字
    //nonce  该用户的交易数
    //password  解密密钥
    getPublicKey: function (userId, nonce, password) {
        let privateKey = null;
        let path = "m/44'/60'/0'/0/";
        let storage = window.localStorage;
        let json = storage.getItem(userId + 'priv');
        if (ethers.utils.getJsonWalletAddress(json)) {
            ethers.Wallet.fromEncryptedJson(json, password).then(function(wallet) {
                privateKey = wallet.privateKey;
                let bip39 = require('bip39');
                let bip32 = require('bip32');
                let seed= bip39.mnemonicToSeedSync(mnemonic, privateKey);
                let key = bip32.fromSeed(seed);
                let publicKey = key.derivePath(path + nonce).publicKey.toString('hex').substr(2,64);  //压缩格式的公钥
                return publicKey;
            }, function(error) {
                if (error.message === 'invalid password') {
                    alert('Wrong Password');
                } else {
                    alert('解密账号发生错误...');
                    console.log(error);
                }
            });
        } else {
            alert('Unknown JSON wallet format');
        }
    },

    //购买非定制数据
    //seller  卖家地址
    //buyerGrade 买家等级
    //txType 交易类型  1表示拥有权 2表示所有权
    //tokenAmount 交易代币总额
    purchaseData: function (seller, buyerGrade, txType, tokenAmount) {
        let result = App.contractWithSigner.buyData(seller, txType, tokenAmount, buyerGrade, {
            gasLimit: 500000,
            // 偷懒，直接使用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        }).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
        return result;
    },

    //非定制数据交易确认
    makeSureDataTx: function(i){
        App.contractWithSigner.makeSureTx(i, {
            gasLimit: 500000,
            // 偷懒，直接使用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        }).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
    },

    //购买定制数据
    //password  买家输入的密钥
    //IP或者特征值
    //交易代币总额
    purchaseRealTimeData: function (userId, password, ipOrEigenvalues, value, accountsNumber, buyerGrade, duration) {
        let nonce = null;
        let getNonce = new Promise((resolve, reject) => {
            try {
                App.activeWallet.getTransactionCount('pending').then(function(transactionCount) {
                    nonce = transactionCount;  //账户交易序号nonce
                    resolve(nonce);
                });
            }catch (e) {
                reject(e);
            }
        });
        let publicKeyCheck = null;
        getNonce.then(() => {
            publicKeyCheck = App.ECDH(userId, nonce, password);
        });
        setTimeout(
            App.contractWithSigner.buyRealTimeData(nonce, publicKeyCheck, ipOrEigenvalues, value, accountsNumber, buyerGrade, duration, userId, {
                gasLimit: 500000,
                // 偷懒，直接使用 2gwei
                gasPrice: ethers.utils.parseUnits("2", "gwei")
            }).then(function(tx) {
                console.log(tx);
                alert('Success!');
            }, function(error) {
                console.log(error);
                alert('Error \u2014 ' + error.message);
            }), 0
    );
        return nonce;
    },

    //设设置定制数据的卖家地址
    setSellerAddress: function (addressList) {
        App.contractWithSigner.setAddress(addressList, {
            gasLimit: 500000,
            // 偷懒，直接使用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        }).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
    },

    //定制数据交易确认
    makeSureRealTimeTxByBuyer: function(i){
        App.contractWithSigner.makeSureRealTimeTx(i, {
            gasLimit: 500000,
            // 偷懒，直接使用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        }).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
    },

    /*
    *
    * 合约相关功能
    *
    * */

    //查看代币发行总量
    InquireTotalSupply: function () {
        let Token = App.contractWithSigner.totalSupply({
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        return Token;
    },

    //查询以太余额

    InquireEth: function(){
        let ethBalance = 0;
        App.activeWallet.getBalance('pending').then(function(balance) {
            ethBalance = ethers.utils.formatEther(balance, { commify: true });  //以太余额
        });
        return ethBalance;
    },

    //查询代币余额
    InquireToken: function(){
        let Tokenbalance = App.contractWithSigner.balanceOf({
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        return Tokenbalance;
    },

    //查询该地址的交易序号nonce
    InquireNonce: function(){
        let nonce = null;
        App.activeWallet.getTransactionCount('pending').then(function(transactionCount) {
            nonce = transactionCount;  //账户交易序号nonce
        });
        return nonce;
    },

    //查询账户交易的最大代币数
    inquireAllowance: function (addressOwner, addressSpender) {
        let allowanceBalance = App.contractWithSigner.allowance(addressOwner, addressSpender, {
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        return allowanceBalance;
    },

    //查询账户是否冻结
    checkisFrozen: function (addressTarget) {
        let result = App.contractWithSigner.ifAccountFrozen(addressTarget, {
            gasLimit: 500000,
            // 偷懒，直接使用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        }).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
        return result;
    },

    //用户查询最后一次购买时间
    inquireLastBuyTime: function () {
        let result = App.contractWithSigner.Lastbuytime().then(function(tx) {x
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
        return result;
    },

    //查询贡献值
    // asBuyerOrSeller  可取1或2，其中1为查看自己作为买家贡献值，2为查看自己作为卖家贡献值
    inquireContribution: function (asBuyerOrSeller) {
        let result = App.contractWithSigner.contributionvalue(asBuyerOrSeller).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
        return result;
    },

    //用户查询自己作为买家或买家的交易金额
    inquireTotalTxmoney: function (asBuyerOrSeller) {
        let result = App.contractWithSigner.TotalbuyerpaymenORsellercollection(asBuyerOrSeller).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
        return result;
    },

    //查自己的信用值   i可为0(返回卖家信用值),1(返回退款次数),2(返回成功交易次数)
    inquireCredit: function (i) {
        let result = App.contractWithSigner.Sellercredit(i).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
        return result;
    },
}