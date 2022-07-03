var CTToken = artifacts.require("./CTToken.sol");
var CTTokenSale = artifacts.require("./CTTokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(CTToken, 1000000).then(function() {
    // Token price is 0.001 Ether
    var tokenPrice = 1000000000000000;
    return deployer.deploy(CTTokenSale, CTToken.address, tokenPrice);
  });
};
