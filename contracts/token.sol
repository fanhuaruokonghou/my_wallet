pragma solidity ^0.5.0;

interface tokenRecipient { function receiveApproval(address _from, uint256 _value, address _token, bytes calldata _extraData ) external; }

import "./pausable.sol";

contract token is pausable {
    
    string public name; 
    string public symbol; 
    uint8 public decimals = 18;  
    uint256 public _totalSupply; 
    uint256 public withdrawPrice = 9;
    uint256 public rechargePrice = 10;
    uint256 public initialSupply=100000; 
    string public tokenName= "er"; 
    string public tokenSymbol= "e";    
    uint public amount1; 
    
    mapping (address => uint256) public _balances;
    mapping (address => mapping (address => uint256)) public _allowed;
    mapping (address => bool) public frozenAccount;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event FrozenFunds(address target, bool frozen);
    
    constructor() payable public {
        _totalSupply = initialSupply * 10 ** uint256(decimals); 
        _balances[address(this)] = _totalSupply;              
        name = tokenName;                                  
        symbol = tokenSymbol;                              
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf() external view returns (uint256) {
        return _balances[msg.sender];
    }
    
    function balanceOfOnlyOwner(address who) external view onlyOwner returns (uint256) {
        return _balances[who];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowed[owner][spender];
    } 

    function _transfer(address _from, address _to, uint _value) internal {
        require(_to != address(0));
        require(_balances[_from] >= _value);
        require(_balances[_to] + _value >= _balances[_to]);
        require(!frozenAccount[_from]);                    
        require(!frozenAccount[_to]);    
        uint previousBalances = _balances[_from] + _balances[_to];
        _balances[_from] -= _value;
        _balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        assert(_balances[_from] + _balances[_to] == previousBalances);
    }

    function transfer(address  _to, uint256 _value) external whenNotPaused returns (bool) {
        require (msg.data.length==68);        
        _transfer(msg.sender, _to, _value);
    }

    function transferFrom(address payable _from, address payable _to, uint256 _value) onlyOwner external whenNotPaused returns (bool) {
        require(_value <= _allowed[owner][_from] || _allowed[owner][_from]==0);    
        if(_allowed[owner][_from] != 0){
            _allowed[owner][_from] -= _value;   
        }
        _transfer(_from, _to, _value); 
        return true;
    }

    function approve(address _spender, uint256 _value) onlyOwner external whenNotPaused returns (bool) {
        _allowed[owner][_spender] = _value;
        return true;
    }
    
    function mintToken(address target, uint256 mintedAmount) onlyOwner public whenNotPaused{
        _balances[target] += mintedAmount; 
        _totalSupply += mintedAmount; 
        emit Transfer(address(0), address(this), mintedAmount);
        emit Transfer(address(this), address(target), mintedAmount);
    }
    
    function freezeAccount(address target, bool freeze) onlyOwner public whenNotPaused{
        frozenAccount[target] = freeze;  
        emit FrozenFunds(target, freeze);
    }

    function ifAccountFrozen(address account) external view returns (bool) {
        return frozenAccount[account];
    }

    function setPrices(uint256 newwithdrawPrice, uint256 newrechargePrice) onlyOwner public whenNotPaused{
       if(newwithdrawPrice <= newrechargePrice){
        withdrawPrice = newwithdrawPrice;
        rechargePrice = newrechargePrice; 
       }
    }
    
    function recharge() payable public whenNotPaused{
        uint amount = msg.value / rechargePrice;       
        _transfer(address(this), msg.sender, amount);   
    }

    function withdraw(uint256 amount) public whenNotPaused{
        require(address(this).balance >= amount * withdrawPrice); 
        _transfer(msg.sender, address(this), amount);             
        msg.sender.transfer(amount * withdrawPrice);         
    }
    
    function () payable external { }
    
    function heyueTixian() onlyOwner public whenNotPaused{
        amount1=address(this).balance - (_totalSupply - _balances[address(this)]) * withdrawPrice; 
        owner.transfer(amount1);
    }
    
    function heyueYitaibi() external view returns (uint256) {
        return address(this).balance;
    } 
    
    function transferHeyue() payable public whenNotPaused{
       
    }
}