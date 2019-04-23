App = {
    provider: null,
    cancelScrypt: false,
    activeWallet: null,
    contract: null,


    setupWallet: function (wallet) {  //初始化钱包
        //建立一个provider对象连接到以太坊的节点
        App.provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
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
            App.cancelScrypt = false;
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

    initLoadKey: function(privateKey) {  //导入私钥
        submit.click(function() {  //绑定事件到id为select-submit-privatekey的按钮上
            if (submit.hasClass('disable')) { return; }
            if (privateKey.substring(0, 2) !== '0x') { privateKey = '0x' + privateKey; }
            // 创建对应的钱包
            App.setupWallet(new ethers.Wallet(privateKey));
        });
    },

    checkMnemonic: function(mnemonic){  //判断输入的是否是助记词
        if(ethers.utils.HDNode.isValidMnemonic(mnemonic)){
            return true;
        }else{
            return false;
        }
    },

    initMnemonic: function(mnemonic, path) {  //导入助记词
        if(App.checkMnemonic(mnemonic)){
            App.setupWallet(ethers.Wallet.fromMnemonic(inputPhrase.val(), inputPath.val()));
        }else {
            console.log("助记词错误！")
        }
    },

    exportKeystore: function(password) {  //导出私钥为json格式
        App.activeWallet.encrypt(password, App.updateLoading).then(function(json) {
            let blob = new Blob([json], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "keystore.json");
    });
    },

    creatHDwallet: function(HDName, password, path){  //创建HD钱包
        let bip39 = require('bip39');
        let bip32 = require('bip32');
        let mnemonic = ethers.utils.HDNode.entropyToMnemonic(ethers.utils.randomBytes(32));
        let seed= bip39.mnemonicToSeedSync(mnemonic, password);
        let key = bip32.fromSeed(seed);
        let privateKey = key.derivePath(path).privateKey.toString('hex');
        let wallet = new ethers.Wallet(privateKey)
        App.createWallet(wallet);
        //存入？？？？




        console.log("bip:" + privateKey);
        console.log("addr:" + wallet.address);
        console.log("seed:" + seed.toString('hex'));
        console.log("mnemonic:" + mnemonic);
    },

    createPrivWallet: function(PrivName, password){  //创建公私钥对钱包
        let randomNumber = ethers.utils.bigNumberify(ethers.utils.randomBytes(32));
        let privateKey = randomNumber._hex;
        let storage = window.localStorage;
        if (privateKey.substring(0, 2) !== '0x') { privateKey = '0x' + privateKey; }
        let provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
        let wallet = new ethers.Wallet(privateKey);
        let activeWallet = wallet.connect(provider);
        activeWallet.encrypt(password).then(function(json) {
            storage.setItem(PrivName, json);
            console.log(storage.getItem(PrivName));
        });
        App.setupWallet(wallet);
    },

    refreshUI: function() {  //刷新以太余额以及代币余额
        // 获取余额时， 包含当前正在打包的区块
        let ethBalance = 0;
        let tokenBalance = 0;
        let nonce = null;
        App.activeWallet.getBalance('pending').then(function(balance) {
            ethBalance = ethers.utils.formatEther(balance, { commify: true });  //以太余额
        }, function(error) {
            showError(error);
        });

        App.contract.balanceOf(App.activeWallet.address).then(function(balance){
            tokenBalance = balance;  //代币余额
        });

        App.activeWallet.getTransactionCount('pending').then(function(transactionCount) {
            nonce = transactionCount;  //账户交易序号nonce
        }, function(error) {
            showError(error);
        });
    },

    initToken: function() {  //初始化代币合约
        // $.getJSON('MyAdvancedToken.json', function(data) {
        // 智能合约地址
        const address = data.networks["5777"].address;
        console.log(address);

        // 初始化智能合约对象
        App.contract = new ethers.Contract(address, data.abi, App.provider);
        console.log(App.contract);
        console.log("contract:" + App.contract);
        App.refreshUI();
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

    //检验地址以及转换金额
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
                showError(error);
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
            let contractWithSigner = App.contract.connect(App.activeWallet);
            //  发起交易，前面2个参数是函数的参数，第3个是交易参数
            contractWithSigner.transfer(targetTokenAddress, tokenAmount, {
                gasLimit: 500000,
                // 偷懒，直接是用 2gwei
                gasPrice: ethers.utils.parseUnits("2", "gwei")
            }).then(function(tx) {
                console.log(tx);
                alert('Success!');
                App.refreshUI();
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
    recharge: function (ethAmount) {
        let contractWithSigner = App.contract.connect(App.activeWallet);
        contractWithSigner.buy({
            gasLimit: 500000,
            // 偷懒，直接是用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei"),
            value: ethers.utils.parseEther(ethAmount)
        });
        App.refreshUI();
    },

    //提现
    //tokenAmount 提现的代币金额
    withdraw: function (tokenAmount) {
        let contractWithSigner = App.contract.connect(App.activeWallet);
        contractWithSigner.sell(tokenAmount, {
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        App.refreshUI();
    }
}