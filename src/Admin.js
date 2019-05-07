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
        App.initToken();  //初始化代币合约对象App.contract
    },

    //进度条
    updateLoading: function(progress) {
        console.log(progress);
        $("#loading-status").val( parseInt(progress * 100) + '%');
    },

    //通过keystore文件导入密钥
    //json  keystore文件的json字符串
    //password  用户用于解密keystore文件的密钥
    initLoadJson: function(json, password) {
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

    //导出私钥为json格式
    //password  私钥的加密密钥设置
    exportKeystore: function(privateName, password) {
        App.activeWallet.encrypt(password).then(function(json) {
            let blob = new Blob([json], {type: "text/plain;charset=utf-8"});
            saveAs(blob.toString(), privateName+'.json');
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

    refreshUI: function() {  //刷新以太余额以及代币余额
        // 获取余额时， 包含当前正在打包的区块
        let ethBalance = 0;
        let tokenBalance = 0;
        let nonce = null;
        App.activeWallet.getBalance('pending').then(function(balance) {
            ethBalance = ethers.utils.formatEther(balance, { commify: true });  //以太余额
        });

        App.contract.balanceOf(App.activeWallet.address).then(function(balance){
            tokenBalance = balance;  //代币余额
        });

        App.activeWallet.getTransactionCount('pending').then(function(transactionCount) {
            nonce = transactionCount;  //账户交易序号nonce
        });
        let balance = '{"ethBalance": ' + ethBalance + ', "tokenBalance": ' + tokenBalance +', "nonce": ' + nonce + '}';
        return balance;
    },

    initToken: function() {  //初始化代币合约
        $.getJSON('TxControl.json', function(data) {
            // 智能合约地址
            const address = data.networks["1001"].address;
            console.log(address);

            let createContract = new Promise((resolve, reject) => {
                try {
                    // 初始化智能合约对象
                    App.contract = new ethers.Contract(address, data.abi, App.provider);
                    resolve(App.contract);
                }catch (e) {
                    reject(e);
                }
            });
            createContract.then((contract) => {
                App.contractWithSigner = contract.connect(App.activeWallet);
            });
            console.log(App.contract);
            console.log("contract:" + App.contract);
            App.refreshUI();
        });
    },

    //查询代币余额
    showBalanceOf: function(address){
        if (App.contract !== null){
            App.contract.balanceOf(address).then(function(balance){
                return balance;
            });
        } else {
            console.log("请初始化合约对象");
        }
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
                App.refreshUI();
            }, function(error) {
                console.log(error);
                alert('Error \u2014 ' + error.message);
            });
            App.refreshUI();
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
                App.refreshUI();
            }, function(error) {
                console.log(error);
                alert('Error \u2014 ' + error.message);
            });
            App.refreshUI();
        }else {
            console.log("地址错误！！")
        }
    },

    //代币充值
    //ethAmount  充值金额
    rechargeToken: function (ethAmount, uint) {
        App.contractWithSigner.recharge({
            gasLimit: 500000,
            // 偷懒，直接使用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei"),
            value: ethers.utils.parseUnits(ethAmount, uint)
        });

    },

    //提现
    //tokenAmount 提现的代币金额
    withdrawToken: function (tokenAmount) {
        App.contractWithSigner.withdraw(tokenAmount, {
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        App.refreshUI();
    },


    /*
    *
    * administered的功能
    *
    * */
    //转移合约的所有权
    //address 转移所有权目的账户地址
    transferOwner: function (address) {
        App.contractWithSigner.transferOwnership(address, {
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
    },


    //暂停交易
    pauseTx: function () {
        let result = App.contractWithSigner.pauseTransaction({
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        return result;
    },

    //取消暂停交易
    unPauseTx: function () {
        let result = App.contractWithSigner.unpauseTransaction({
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        return result;
    },

    //查看代币发行总量
    inquireTotalSupply: function () {
        let Token = App.contractWithSigner.totalSupply({
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        return Token;
    },

    //查询该地址的交易序号nonce
    inquireNonce: function(){
        let nonce = null;
        App.activeWallet.getTransactionCount('pending').then(function(transactionCount) {
            nonce = transactionCount;  //账户交易序号nonce
        });
        return nonce;
    },

    //查询代币余额
    inquireToken: function(address){
        let Tokenbalance = App.contractWithSigner.balanceOfOnlyOwner(address, {
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        return Tokenbalance;
    },

    //查询账户允许的最大交易额
    inquireAllowance: function (addressOwner, addressSpender) {
        let allowanceBalance = App.contractWithSigner.allowance(addressOwner, addressSpender, {
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        return allowanceBalance;
    },

    //转移以太币
    //targetAddress  目标地址
    //ethAmount  金额
    //uint 货币单位
    setupSendEther: function(targetAddress, ethAmount, uint) {
        if(App.checkAddress(targetAddress)){
            App.activeWallet.sendTransaction({
                to: ethers.utils.getAddress(targetAddress),
                value: ethers.utils.parseUnits(ethAmount, uint)
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
            // 关联一个有过签名钱包对象
            //  发起交易，前面2个参数是函数的参数，第3个是交易参数
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

    //强制转移代币
    forceSendToken: function (addressFrom, addressTo, tokenValue) {
        App.contractWithSigner.transferFrom(addressFrom,  addressTo, tokenValue, {
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

    //设置账户的最大交易代币数
    setApprove: function (addressTarget, tokenAmount) {
        App.contractWithSigner.approve(addressTarget, tokenAmount, {
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

    //增发代币
    //addressTarget 接受代币地址
    //mintedAmount  代币数量
    setMintToken: function (addressTarget, mintedAmount) {
        App.contractWithSigner.mintToken(addressTarget, mintedAmount, {
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

    //冻结账户
    //addressTarget  冻结的目标账户
    //freeze 为true设置为冻结， false设置为解冻
    setFreezeAccount: function (addressTarget, freeze) {
        App.contractWithSigner.freezeAccount(addressTarget, freeze, {
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

    //查询账户是否冻结
    checkIsFrozen: function (addressTarget) {
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
    
    //设置充值以及提现的汇率
    //withdrawPrice  提现汇率
    //rechargePrice  充值汇率
    // 请确保 0 < withdrawPrice < rechargePrice   且都为整数
    setExchangeRate: function (withdrawPrice, rechargePrice) {
        App.contractWithSigner.setPrices(withdrawPrice, rechargePrice, {
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

    //将合约总多余的以太币提现到拥有者的账户
    withrawFromContract: function () {
        App.contractWithSigner.heyueTixian( {
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

    //查询合约中的以太币数量
    inquireContractEtherBalance: function () {
        let result = App.contractWithSigner.heyueYitaibi( {
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
    
    //向合约中转入以太币
    //Ether  正整数  字符串类型
    //uint  以太币单位  字符串类型  'wei' 'gwei' 'finney' 'ether'  1 ether = 1000 finney = 1000000000 gwei = 1000000000000000000 wei
    rechargeEtherToContract: function (Ether, uint) {
        App.contractWithSigner.transferHeyue( {
            gasLimit: 500000,
            // 偷懒，直接使用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei"),
            value: ethers.utils.parseUnits(Ether, uint)
        }).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
    },

    //设置买卖双方的交易手续费
    //newFeeProportion 正整数
    //newCommissionProportion 正整数
    setProportionbuyerAndseller: function (newFeeProportion, newCommissionProportion) {
        App.contractWithSigner.setProportion(newFeeProportion, newCommissionProportion,{
            gasLimit: 500000,
            // 偷懒，直接使用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei"),
        }).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
    },

    //查询用户最后一次购买时间
    inquireLastBuyTime: function (addressTarget) {
        let result = App.contractWithSigner.LastbuytimeOnlyOwner(addressTarget, {
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

    //查询addressTarget账户的贡献值
    // asBuyerOrSeller  可取1或2，其中1为查看账户作为买家贡献值，2为查看账户作为卖家贡献值
    inquireContribution: function (addressTarget, asBuyerOrSeller) {
        let result = App.contractWithSigner.contributionvalue(addressTarget, asBuyerOrSeller).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
        return result;
    },

    //用户查询账户作为买家或买家的交易金额
    inquireTotalTxmoney: function (addressTarget, asBuyerOrSeller) {
        let result = App.contractWithSigner.TotalbuyerpaymenORsellercollectionOnlyOwner(addressTarget, asBuyerOrSeller).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
        return result;
    },

    //查用户的信用值   i可为0(返回卖家信用值),1(返回退款次数),2(返回成功交易次数)
    inquireCredit: function (addressTarget, i) {
        let result = App.contractWithSigner.SellercreditOnlyOwner(addressTarget, i).then(function(tx) {
            console.log(tx);
            alert('Success!');
        }, function(error) {
            console.log(error);
            alert('Error \u2014 ' + error.message);
        });
        return result;
    },

    //非定制数据退款
    //i 交易序号
    refundDataByBuyer: function(i){
        App.contractWithSigner.refundData(i, {
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

    //定制数据退款
    refundRealTimeDataByBuyer: function (i) {
        App.contractWithSigner.refundRealTime(i, {
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
    


}