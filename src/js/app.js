App = {
	web3Provider: null,
	contracts: {},
	account: '0x0',
	loading: false,
	tokenPrice: 1000000000000000,
	tokensSold: 0,
	tokensAvailable: 750000,

	init: function() {
		console.log("App initialized...")
		return App.initWeb3();
	},

	initWeb3: function() {
		if (typeof web3 !== 'undefined') {
			// If a web3 instance is already provided by Meta Mask.
			App.web3Provider = ethereum //web3.currentProvider;
			web3 = new Web3(ethereum);
		} else {
			// Specify default instance if no web3 instance provided
			App.web3Provider = new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/b6213ee75b9e4ef3a64a39ae17840210'); //http://localhost:7545');
			web3 = new Web3(App.web3Provider);
		}
		return App.initContracts();
	},

	initContracts: function() {
		$.getJSON("CTTokenSale.json", function(CTTokenSale) {
			App.contracts.CTTokenSale = TruffleContract(CTTokenSale);
			App.contracts.CTTokenSale.setProvider(App.web3Provider);
			App.contracts.CTTokenSale.deployed().then(function(CTTokenSale) {
				console.log("Dapp Token Sale Address:", CTTokenSale.address);
			});
		}).done(function() {
			$.getJSON("CTToken.json", function(CTToken) {
				App.contracts.CTToken = TruffleContract(CTToken);
				App.contracts.CTToken.setProvider(App.web3Provider);
				App.contracts.CTToken.deployed().then(function(CTToken) {
					console.log("Dapp Token Address:", CTToken.address);
				});

				App.listenForEvents();
				return App.render();
			});
		})
	},

	// Listen for events emitted from the contract
	listenForEvents: function() {
		App.contracts.CTTokenSale.deployed().then(function(instance) {
			instance.Sell({}, {
				fromBlock: 0,
				toBlock: 'latest',
			}).watch(function(error, event) {
				console.log("event triggered", event);
				App.render();
			})
		})
	},

	render: function() {
		if (App.loading) {
			return;
		}
		App.loading = true;

		var loader  = $('#loader');
		var content = $('#content');

		loader.show();
		content.hide();

		// Load account data
		web3.eth.getCoinbase(function(err, account) {
			if(err === null) {
				App.account = account;
				$('#accountAddress').html("Your Account: " + account);
			}
		})

		// Load token sale contract
		App.contracts.CTTokenSale.deployed().then(function(instance) {
			CTTokenSaleInstance = instance;
			return CTTokenSaleInstance.tokenPrice();
		}).then(function(tokenPrice) {
			App.tokenPrice = tokenPrice;
			$('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
			return CTTokenSaleInstance.tokensSold();
		}).then(function(tokensSold) {
			App.tokensSold = tokensSold.toNumber();
			$('.tokens-sold').html(App.tokensSold);
			$('.tokens-available').html(App.tokensAvailable);

			var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
			$('#progress').css('width', progressPercent + '%');

			// Load token contract
			App.contracts.CTToken.deployed().then(function(instance) {
				CTTokenInstance = instance;
				return CTTokenInstance.balanceOf(App.account);
			}).then(function(balance) {
				$('.dapp-balance').html(balance.toNumber());
				App.loading = false;
				loader.hide();
				content.show();
			})
		});
	},

	buyTokens: function() {
		$('#content').hide();
		$('#loader').show();
		var numberOfTokens = $('#numberOfTokens').val();
		App.contracts.CTTokenSale.deployed().then(function(instance) {
			return instance.buyTokens(numberOfTokens, {
				from: App.account,
				value: numberOfTokens * App.tokenPrice,
				gas: 500000 // Gas limit
			});
		}).then(function(result) {
			console.log("Tokens bought...")
			$('form').trigger('reset') // reset number of tokens in form
			// Wait for Sell event
		});
	}
}

$(function() {
	$(window).load(function() {
		App.init();
	})
});
