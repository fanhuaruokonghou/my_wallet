var MyAdvancedToken = artifacts.require("./MyAdvancedToken.sol.sol");

module.exports = function(deployer) {
  deployer.deploy(MyAdvancedToken);
};
