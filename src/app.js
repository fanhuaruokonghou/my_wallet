App = {
  provider: null,
  cancelScrypt: false,
  activeWallet: null,
  contract: null,

  setupWallet: function (wallet) {  //初始化钱包
    showWallet();

    //建立一个provider对象
    App.provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");

    // App.provider = ethers.getDefaultProvider('ropsten');
    //  将钱包连接到节点
    App.activeWallet = wallet.connect(App.provider);

    //从前端获取钱包账户地址
    var inputWalletAddress = $('#wallet-address');
    inputWalletAddress.val(wallet.address);

    $('#save-keystore').click(App.exportKeystore);

    App.setupSendEther();
    App.refreshUI();  //刷新ui界面，显示最新余额

    App.initToken();  //初始化代币合约对象App.contract
    App.setupSendToken();  //
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
                showAccout();
            });
        } else {
            alert('Unknown JSON wallet format');
        }
    });
  },

  initLoadKey: function() {  //设置私钥
    var inputPrivatekey = $('#select-privatekey');
    var submit = $('#select-submit-privatekey');

    // 生成一个默认的私钥
    let randomNumber = ethers.utils.bigNumberify(ethers.utils.randomBytes(32));
    inputPrivatekey.val(randomNumber._hex);

    submit.click(function() {  //绑定事件到id为select-submit-privatekey的按钮上
        if (submit.hasClass('disable')) { return; }
        var privateKey = inputPrivatekey.val();
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


  exportKeystore: function() {  //导出私钥为json格式
    var pwd = $('#save-keystore-file-pwd');

    showLoading('导出私钥...');
    App.cancelScrypt = false;

    App.activeWallet.encrypt(pwd.val(), App.updateLoading).then(function(json) {
      showWallet();
      var blob = new Blob([json], {type: "text/plain;charset=utf-8"});
      saveAs(blob, "keystore.json");

    });
  },

  initMnemonic: function() {
    var inputPhrase = $('#select-mnemonic-phrase');  //输入助记词
    var inputPath = $('#select-mnemonic-path');  //钱包密钥路径
    var submit = $('#select-submit-mnemonic');  //按钮

// 生成助记词
    var mnemonic = ethers.utils.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
    inputPhrase.val(mnemonic);

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

  refreshUI: function() {
    var inputBalance = $('#wallet-balance');
    var inputTransactionCount = $('#wallet-transaction-count');

    $("#wallet-submit-refresh").click(function() {
      App.addActivity('> Refreshing details...');
      // 获取余额时， 包含当前正在打包的区块
      App.activeWallet.getBalance('pending').then(function(balance) {
          App.addActivity('< Balance: ' + balance.toString(10));
          inputBalance.val(ethers.utils.formatEther(balance, { commify: true }));  //显示余额
      }, function(error) {
          showError(error);
      });

      App.activeWallet.getTransactionCount('pending').then(function(transactionCount) {
          App.addActivity('< TransactionCount: ' + transactionCount);
          inputTransactionCount.val(transactionCount);
      }, function(error) {
          showError(error);
      });
    });

// 模拟一次点击获取数据
    $("#wallet-submit-refresh").click();

  },

  initToken: function() {

    $.getJSON('TokenERC20.json', function(data) {
      // 智能合约地址
      const address = data.networks["5777"].address;
      console.log(address);

      // 创建智能合约对象
      App.contract = new ethers.Contract(address, data.abi, App.provider);
      console.log(App.contract)
      // const contract = web3.eth.contract(data.abi).at(address);
      // contract.transfer.estimateGas("0x627306090abaB3A6e1400e9345bC60c78a8BEf57", 1, {from: App.activeWallet.address}, function (gas) {
      //   console.log("gas:" + gas);
      // });

      console.log("contract:" + App.contract);

      App.refreshToken();
    });
  },

  refreshToken: function() {  //刷新代币余额
    var tokenBalance = $('#wallet-token-balance');
         // 直接调用合约方法
    App.contract.balanceOf1(App.activeWallet.address).then(function(balance){
        tokenBalance.val(balance);
    });
  },

  addActivity: function(message) {
    var activity = $('#wallet-activity');
    activity.append("</br>" + message);
  },

  //
  setupSendEther: function() {
    var inputTargetAddress = $('#wallet-send-target-address');  //转账的目标地址
    var inputAmount = $('#wallet-send-amount');  //转账金额
    var submit = $('#wallet-submit-send');  //转账按钮

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
        var targetAddress = ethers.utils.getAddress(inputTargetAddress.val());
        /// ether -> wei
        var amountWei = ethers.utils.parseEther(inputAmount.val());

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
    var inputTargetAddress = $('#wallet-token-send-target-address');
    var inputAmount = $('#wallet-token-send-amount');
    var submit = $('#wallet-token-submit-send');

    // Validate the address and value (to enable the send button)
    function check() {
        try {
            ethers.utils.getAddress(inputTargetAddress.val());
        } catch (error) {
            submit.addClass('disable');
            console.log('sorry' + inputTargetAddress.val())
            return;
        }
        submit.removeClass('disable');
    }

    inputTargetAddress.on("input", check);  //监视输入
    inputAmount.on("input",check);


    // Send token
    submit.click(function() {
        var targetAddress = ethers.utils.getAddress(inputTargetAddress.val());
        var amount = inputAmount.val();

        // https://ethgasstation.info/json/ethgasAPI.json
        // https://ethgasstation.info/gasrecs.php
        App.provider.getGasPrice().then((gasPrice) => {
            // gasPrice is a BigNumber; convert it to a decimal string
            gasPriceString = gasPrice.toString();

            console.log("Current gas price: " + gasPriceString);
          });

        // App.contract.estimate.transfer(targetAddress, amount)
        App.contract.estimate.transfer(targetAddress, amount)
          .then(function(gas) {
              console.log("gas:" +  gas);
          });


      // 必须关联一个有过签名钱包对象
        let contractWithSigner = App.contract.connect(App.activeWallet);
        //  发起交易，前面2个参数是函数的参数，第3个是交易参数
        contractWithSigner.transfer(targetAddress, amount, {
          gasLimit: 500000,
          // 偷懒，直接是用 2gwei
          gasPrice: ethers.utils.parseUnits("2", "gwei"),
        }).then(function(tx) {
            console.log(tx);

            App.addActivity('< Token sent: ' + tx.hash.substring(0, 20) + '...');
            alert('Success!');

            inputTargetAddress.val('');
            inputAmount.val('') ;
            submit.addClass('disable');

            App.refreshToken();
        }, function(error) {
            console.log(error);
            App.showError(error);
        });
    });
  }
}


App.init();

// 0x627306090abaB3A6e1400e9345bC60c78a8BEf57
// var privateKey = 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3';
// App.setupWallet(new ethers.Wallet(privateKey));
