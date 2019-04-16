pragma solidity ^0.5.0;

import "./owned.sol";
import "./ERC20.sol";

/******************************************/

/*       ADVANCED TOKEN STARTS HERE       */

/******************************************/

contract MyAdvancedToken is owned, ERC20 {
    uint256 public sellPrice;//卖出的汇率,一个代币，可以卖出多少个以太币，单位是wei
    uint256 public buyPrice;//买入的汇率,买一个代币需要花多少以太币
    uint256 public initialSupply = 10000000;
    string public tokenName = "HT";
    string public tokenSymbol = "XY";
    mapping (address => bool) public frozenAccount;//是否冻结帐户的列表
    
    /* This generates a public event on the blockchain that will notify clients */
    event FrozenFunds(address target, bool frozen);//定义一个事件，当有资产被冻结的时候，通知正在监听事件的客户端

    /* Initializes contract with initial supply tokens to the creator of the contract */
    constructor () ERC20(initialSupply, tokenName, tokenSymbol) payable public {}

    /* Internal transfer, only can be called by this contract */
    function _transfer(address _from, address _to, uint _value) internal {
        require (_to != address(0));                               // Prevent transfer to 0x0 address. Use burn() instead
        require (_balances[_from] >= _value);               // Check if the sender has enough
        require (_balances[_to] + _value > _balances[_to]); // Check for overflows
        require(!frozenAccount[_from]);                     // Check if sender is frozen
        require(!frozenAccount[_to]);                       // Check if recipient is frozen
        _balances[_from] -= _value;                         // Subtract from the sender
        _balances[_to] += _value;                           // Add the same to the recipient
        emit Transfer(_from, _to, _value); //通知任何监听该交易的客户端
    }
    
    //代币增发
    /// @notice Create `mintedAmount` tokens and send it to `target`
    /// @param target Address to receive the tokens
    /// @param mintedAmount the amount of tokens it will receive
    function mintToken(address target, uint256 mintedAmount) onlyOwner public {
        _balances[target] += mintedAmount;
        _totalSupply += mintedAmount;
        emit Transfer(address(0), address(this), mintedAmount);
        emit Transfer(address(this), address(target), mintedAmount);
    }
    
    //资产冻结
    /// @notice `freeze? Prevent | Allow` `target` from sending & receiving tokens
    /// @param target Address to be frozen
    /// @param freeze either to freeze it or not
    function freezeAccount(address target, bool freeze) onlyOwner public {
        frozenAccount[target] = freeze;
        emit FrozenFunds(target, freeze);
    }

    //查看账户是否冻结
    function ifAccountFrozen(address account) external view returns (bool) {
        return frozenAccount[account];
    }

    //查看当前冻结了那些账户
    //买卖价格的设置
    /// @notice Allow users to buy tokens for `newBuyPrice` eth and sell tokens for `newSellPrice` eth
    /// @param newSellPrice Price the users can sell to the contract
    /// @param newBuyPrice Price users can buy from the contract
    function setPrices(uint256 newSellPrice, uint256 newBuyPrice) onlyOwner public {
        sellPrice = newSellPrice;
        buyPrice = newBuyPrice;
    }
    
    //使用以太币购买代币
    /// @notice Buy tokens from contract by sending ether
    function buy() payable public {
        uint amount = msg.value / buyPrice;               // calculates the amount
        _transfer(address(this), msg.sender, amount);              // makes the transfers
    }

    //卖出代币
    /// @notice Sell `amount` tokens to contract
    /// @param amount amount of tokens to be sold
    function sell(uint256 amount) public {
        require(address(this).balance >= amount * sellPrice);      // checks if the contract has enough ether to buy
        _transfer(msg.sender, address(this), amount);              // makes the transfers
        msg.sender.transfer(amount * sellPrice);          // sends ether to the seller. It's important to do this last to avoid recursion attacks
    }
}

