var TokenERC20 = artifacts.require("./TokenERC20.sol");

module.exports = function(deployer) {
  deployer.deploy(TokenERC20);
};
