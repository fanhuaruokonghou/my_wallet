App = {
    provider: null,
    cancelScrypt: false,
    activeWallet: null,
    contract: null,

    setupWallet: function (wallet) {  //初始化钱包
        showWallet();

        //建立一个provider对象
        App.provider = new ethers.providers.JsonRpcProvider("http://45.102.203.221:8545");

        //  将钱包连接到节点
        App.activeWallet = wallet.connect(App.provider);

        //从前端获取钱包账户地址
        let inputWalletAddress = $('#wallet-address');
        inputWalletAddress.val(wallet.address);

        $('#save-keystore').click(App.exportKeystore);

        App.initToken();  //初始化代币合约对象App.contract
        App.setupSendEther();
        App.setupSendToken();  //
        App.refreshUI();  //刷新ui界面，显示最新余额

    },

    init: function() {  //导入钱包
        App.initLoadJson();  //通过keystory
        App.initLoadKey();  //通过私钥
        App.initMnemonic();  //通过助记词
    },

    updateLoading: function(progress) {  //进度条
      console.log(progress);
      $("#loading-status").val( parseInt(progress * 100) + '%');
      return App.cancelScrypt;
    },

    initLoadJson: function() {
        showAccout()
        setupDropFile(function(json, password) {
            if (ethers.utils.getJsonWalletAddress(json)) {
                showLoading('解密账号...');
                App.cancelScrypt = false;

                ethers.Wallet.fromEncryptedJson(json, password, App.updateLoading).then(function(wallet) {
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
        });
    },

    initLoadKey: function() {  //设置私钥
        let inputPrivatekey = $('#select-privatekey');
        let submit = $('#select-submit-privatekey');

        // 生成一个默认的私钥
        // let randomNumber = ethers.utils.bigNumberify(ethers.utils.randomBytes(32));
        // inputPrivatekey.val(randomNumber._hex);

        submit.click(function() {  //绑定事件到id为select-submit-privatekey的按钮上
            if (submit.hasClass('disable')) { return; }
            let privateKey = inputPrivatekey.val();
            if (privateKey.substring(0, 2) !== '0x') { privateKey = '0x' + privateKey; }
            // 创建对应的钱包
            App.setupWallet(new ethers.Wallet(privateKey));

        });

        inputPrivatekey.on("input", function() {
            if (inputPrivatekey.val().match(/^(0x)?[0-9A-Fa-f]{64}$/)) {
                submit.removeClass('disable');
            } else {
                submit.addClass('disable');
            }
        });

    },

    initMnemonic: function() {
        let inputPhrase = $('#select-mnemonic-phrase');  //输入助记词
        let inputPath = $('#select-mnemonic-path');  //钱包密钥路径
        let submit = $('#select-submit-mnemonic');  //按钮

    // 生成助记词
    //     let mnemonic = ethers.utils.HDNode.entropyToMnemonic(ethers.utils.randomBytes(32));
    //     inputPhrase.val(mnemonic);

        function check() {
            if (ethers.utils.HDNode.isValidMnemonic(inputPhrase.val())) {
                submit.removeClass('disable');
            } else {
                submit.addClass('disable');
            }
        }
        inputPhrase.on("input", check);
        inputPath.on("input", check);

        submit.click(function() {
            if (submit.hasClass('disable')) { return; }
            App.setupWallet(ethers.Wallet.fromMnemonic(inputPhrase.val(), inputPath.val()));
        });

    },

    exportKeystore: function() {  //导出私钥为json格式
        let pwd = $('#save-keystore-file-pwd');

        showLoading('导出私钥...');
        App.cancelScrypt = false;

        App.activeWallet.encrypt(pwd.val(), App.updateLoading).then(function(json) {
            showWallet();
            let blob = new Blob([json], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "keystore.json");

    });
    },

    createWallet: function(){
        showCreate();
        let submit = $('#mnemonic');  //创建HD钱包
        let submit1 = $('#private-key');  //创建私钥
        let HD_passwd = $('#HD-wallet-password');
        let pri_passwd = $('#private-wallet-password');

        HD_passwd.on('input', () => {
            if (HD_passwd.val() !== '') {
                submit.removeClass('disable');
            } else {
                submit.addClass('disable');
            }
        });
        pri_passwd.on('input', () => {
            if (pri_passwd.val() !== '') {
                submit1.removeClass('disable');
            } else {
                submit1.addClass('disable');
            }
        });

        submit.click(function () {
            if(HD_passwd.val() === ''){
                return;
            }else{
                submit.removeClass('disable');
            }
            let mnemonic = ethers.utils.HDNode.entropyToMnemonic(ethers.utils.randomBytes(32));
            console.log("mnemonic:" + mnemonic);
        });

        submit1.click(function () {
            let randomNumber = ethers.utils.bigNumberify(ethers.utils.randomBytes(32));
            let privateKey = randomNumber._hex;
            let storage = window.localStorage;
            if (privateKey.substring(0, 2) !== '0x') { privateKey = '0x' + privateKey; }
            let provider = new ethers.providers.JsonRpcProvider("http://45.102.203.221:8545");
            let wallet = new ethers.Wallet(privateKey);
            let activeWallet = wallet.connect(provider);

            App.cancelScrypt = false;

            activeWallet.encrypt(pri_passwd.val()).then(function(json) {
                storage.setItem('a', json);
                console.log(storage.getItem('a'));
            });
            App.setupWallet(wallet);

        });

    },

    refreshUI: function() {
    let inputBalance = $('#wallet-balance');
    let inputTransactionCount = $('#wallet-transaction-count');
    let inputTokenBalance = $('#wallet-token-balance');

    $("#wallet-submit-refresh").click(function() {
        App.addActivity('> Refreshing details...');
          // 获取余额时， 包含当前正在打包的区块
        App.activeWallet.getBalance('pending').then(function(balance) {
            App.addActivity('< Balance: ' + balance.toString(10));
            inputBalance.val(ethers.utils.formatEther(balance, { commify: true }));  //显示余额
        }, function(error) {
            showError(error);
        });

        App.contract.balanceOf(App.activeWallet.address).then(function(balance){
            inputTokenBalance.val(balance);
        });

        App.activeWallet.getTransactionCount('pending').then(function(transactionCount) {
            App.addActivity('< TransactionCount: ' + transactionCount);
            inputTransactionCount.val(transactionCount);
        }, function(error) {
            showError(error);
        });
    });

    // 模拟一次点击获取数据
    if(App.contract !== null){
        $("#wallet-submit-refresh").click();
    }
    },

    initToken: function() {

    $.getJSON('MyAdvancedToken.json', function(data) {
      // 智能合约地址
      const address = data.networks["1001"].address;
      console.log(address);

      // 创建智能合约对象
      App.contract = new ethers.Contract(address, data.abi, App.provider);
      console.log(App.contract);
      // const contract = web3.eth.contract(data.abi).at(address);
      // contract.transfer.estimateGas("0x627306090abaB3A6e1400e9345bC60c78a8BEf57", 1, {from: App.activeWallet.address}, function (gas) {
      //   console.log("gas:" + gas);
      // });

      console.log("contract:" + App.contract);

      App.refreshUI();
    });
    },

    // refreshUI: function() {  //刷新代币余额
    //     let tokenBalance = $('#wallet-token-balance');
    //          // 直接调用合约方法
    //     App.contract.balanceOf(App.activeWallet.address).then(function(balance){
    //         tokenBalance.val(balance);
    //     });
    // },

    addActivity: function(message) {
    let activity = $('#wallet-activity');
    activity.append("</br>" + message);
    },
    //显示余额
    showBalanceOf: function(){
        // let submit = $('#wallet-token-submit-refresh');
        let tokenBalance = $('#balanceToken');
        let addr = $('#address').val();
        // submit.click(function () {
        App.contract.balanceOf(addr).then(function(balance){
            tokenBalance.val(balance);
        });
        // });
    },
    //
    setupSendEther: function() {
    let inputTargetAddress = $('#wallet-send-target-address');  //转账的目标地址
    let inputAmount = $('#wallet-send-amount');  //转账金额
    let submit = $('#wallet-submit-send');  //转账按钮

    // Validate the address and value (to enable the send button)
    function check() {
        try {
            ethers.utils.getAddress(inputTargetAddress.val());
            ethers.utils.parseEther(inputAmount.val());
        } catch (error) {
            submit.addClass('disable');
            return;
        }
        submit.removeClass('disable');
    }
    inputTargetAddress.on("input", check);
    inputAmount.on("input", check);

    // Send ether
    submit.click(function() {
            // 得到一个checksum 地址
        let targetAddress = ethers.utils.getAddress(inputTargetAddress.val());
        /// ether -> wei
        let amountWei = ethers.utils.parseEther(inputAmount.val());

        App.activeWallet.sendTransaction({
            to: targetAddress,
            value: amountWei,
            //gasPrice: activeWallet.provider.getGasPrice(),
            //gasLimit: 21000,
        }).then(function(tx) {
            console.log(tx);

            App.addActivity('< Transaction sent: ' + tx.hash.substring(0, 20) + '...');
            alert('Success!');

            inputTargetAddress.val('');
            inputAmount.val('');
            submit.addClass('disable');

            App.refreshUI();
        }, function(error) {
            console.log(error);
            showError(error);
        });
    })
    },

    setupSendToken: function() {
    let inputTargetAddress = $('#wallet-token-send-target-address');
    let inputAmount = $('#wallet-token-send-amount');
    let submit = $('#wallet-token-submit-send');

    // Validate the address and value (to enable the send button)
    function check() {
        try {
            ethers.utils.getAddress(inputTargetAddress.val());
        } catch (error) {
            alert('hello')
            submit.addClass('disable');
            console.log('sorry' + inputTargetAddress.val())
            return;
        }
        submit.removeClass('disable');
    }

    inputTargetAddress.on("input", check);  //监视输入
    // inputAmount.on("input",check);


    // Send token
    submit.click(function() {
        let targetAddress = ethers.utils.getAddress(inputTargetAddress.val());
        let amount = inputAmount.val();

        // https://ethgasstation.info/json/ethgasAPI.json
        // https://ethgasstation.info/gasrecs.php
        App.provider.getGasPrice().then((gasPrice) => {
            // gasPrice is a BigNumber; convert it to a decimal string
            gasPriceString = gasPrice.toString();

            console.log("Current gas price: " + gasPriceString);
          });

        // App.contract.estimate.transfer(targetAddress, amount)
        // App.contract.transfer(targetAddress, amount)
        //   .then(function(gas) {
        //       console.log("gas:" +  gas);
        //   });


      // 必须关联一个有过签名钱包对象
        let contractWithSigner = App.contract.connect(App.activeWallet);
        //  发起交易，前面2个参数是函数的参数，第3个是交易参数
        contractWithSigner.transfer(targetAddress, amount, {
          gasLimit: 500000,
          // 偷懒，直接是用 2gwei
          gasPrice: ethers.utils.parseUnits("2", "gwei")
        }).then(function(tx) {
            console.log(tx);

            App.addActivity('< Token sent: ' + tx.hash.substring(0, 20) + '...');
            alert('Success!');

            inputTargetAddress.val('');
            inputAmount.val('') ;
            submit.addClass('disable');

            App.refreshUI();
        }, function(error) {
            console.log(error);
            App.showError(error);
        });
    });
    },

    start_choose: function() {
        showLogin();
        let submit = $('#login');
        let submit1 = $('#create');
        submit.click(function() {
          App.init();
          });
        submit1.click(function() {
          App.createWallet();
        });
        },

    recharge: function () {
        console.log(App.contract);
        let msg_value = $('#Recharge');
        let contractWithSigner = App.contract.connect(App.activeWallet);
        let recharge_value = msg_value.val();
        contractWithSigner.buy({
            gasLimit: 500000,
            //     // 偷懒，直接是用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei"),
            value: ethers.utils.parseEther(recharge_value)
        });
        App.refreshUI();
            // contractWithSigner.sell(recharge_value, {
            //     // nonce: App.activeWallet.getTransactionCount('pending'),
            //     gasLimit: 500000,
            //     // 偷懒，直接是用 2gwei
            //     gasPrice: ethers.utils.parseUnits("2", "gwei")
            // });
    },

    withdraw: function () {
        let withdraw_ = $('#withdraw');
        let contractWithSigner = App.contract.connect(App.activeWallet);
        let withdraw_value = withdraw_.val();
        contractWithSigner.sell(withdraw_value, {
            gasLimit: 500000,
            // 偷懒，直接是用 2gwei
            gasPrice: ethers.utils.parseUnits("2", "gwei")
        });
        App.refreshUI();
        alert(withdraw_value)
    }
}

App.start_choose();

// App.init();
// 0x627306090abaB3A6e1400e9345bC60c78a8BEf57
// let privateKey = 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3';
// App.setupWallet(new ethers.Wallet(privateKey));
