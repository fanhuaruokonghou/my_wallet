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
    uint256 public amount1;

    //用mapping保存每个地址对应的余额
    mapping (address => uint256) public _balances;
    //存储对账号的控制
    mapping (address => mapping (address => uint256)) public _allowed;
    //是否冻结帐户的列表
    mapping (address => bool) public frozenAccount;

    //事件，用来通知客户端代币转移的发生
    event Transfer(address indexed from, address indexed to, uint256 value);
    //事件，用来通知客户端代币被销毁
    event FrozenFunds(address target, bool frozen);

//构造函数
//代币初始化
    constructor() payable public {
        _totalSupply = initialSupply * 10 ** uint256(decimals);
        _balances[address(this)] = _totalSupply;
        name = tokenName;
        symbol = tokenSymbol;
    }

//回退函数
//合约接收以太币
    function () external payable  { }

//外部函数
//查看代币发行总量
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

//查看代币名称
    function tName() external view returns (string memory) {
        return name;
    }

//查看代币符号
    function tSymbol() external view returns (string memory) {
        return symbol;
    }

//用户查询自己账户代币余额
    function balanceOf() external view returns (uint256) {
        return _balances[msg.sender];
    }

//管理员查询某用户账户代币余额
    function balanceOfOnlyOwner(address who) external view onlyOwner returns (uint256) {
        return _balances[who];
    }

//管理员查看某用户可花费的最大代币数
    function allowanceOnlyOwner(address owner, address spender) external view onlyOwner returns (uint256) {
        return _allowed[owner][spender];
    }

//代币交易转移：从创建者账户转移到其他账户
    function transfer(address  _to, uint256 _value) external whenNotPaused returns (bool) {
        //防止以太坊短地址攻击
        require (msg.data.length==68);
        _transfer(msg.sender, _to, _value);
    }

//账号之间代币交易转移
    function transferFrom(address payable _from, address payable _to, uint256 _value) external onlyOwner whenNotPaused returns (bool) {
        require(_value <= _allowed[owner][_from] || _allowed[owner][_from]==0);
        if(_allowed[owner][_from] != 0){
            _allowed[owner][_from] -= _value;
        }
        _transfer(_from, _to, _value);
        return true;
    }

//设置某个地址（合约）可以交易者名义花费的最大代币总数
    function approve(address _spender, uint256 _value) external onlyOwner whenNotPaused returns (bool) {
        _allowed[owner][_spender] = _value;
        return true;
    }

//用户查看自己的账户是否冻结
    function ifAccountFrozen() external view returns (bool) {
        return frozenAccount[msg.sender];
    }

//管理员查看某用户账户是否冻结
    function ifAccountFrozenOnlyOwner(address account) external view onlyOwner returns (bool) {
        return frozenAccount[account];
    }

//查看合约地址中的以太币数量
    function heyueYitaibi() external view returns (uint256) {
        return address(this).balance;
    }

//公有函数
//代币增发
    function mintToken(address target, uint256 mintedAmount) public onlyOwner whenNotPaused {
        _balances[target] += mintedAmount;
        _totalSupply += mintedAmount;
        emit Transfer(address(0), address(this), mintedAmount);
        emit Transfer(address(this), address(target), mintedAmount);
    }

//资产冻结
    function freezeAccount(address target, bool freeze) public onlyOwner whenNotPaused {
        frozenAccount[target] = freeze;
        emit FrozenFunds(target, freeze);
    }

//买卖价格的设置
    function setPrices(uint256 newwithdrawPrice, uint256 newrechargePrice) public onlyOwner whenNotPaused {
       if(newwithdrawPrice <= newrechargePrice){
        withdrawPrice = newwithdrawPrice;
        rechargePrice = newrechargePrice;
       }
    }

//充值
    function recharge() public payable whenNotPaused {
        uint amount = msg.value / rechargePrice;
        _transfer(address(this), msg.sender, amount);
    }

//提现
    function withdraw(uint256 amount) public whenNotPaused {
        require(address(this).balance >= amount * withdrawPrice);
        _transfer(msg.sender, address(this), amount);
        msg.sender.transfer(amount * withdrawPrice);
    }

//将合约中的以太币提取到创建者账户
    function heyueTixian() public onlyOwner whenNotPaused {
        amount1 = address(this).balance - (_totalSupply - _balances[address(this)]) * withdrawPrice;
        owner.transfer(amount1);
    }

//向合约中转入以太币
    function transferHeyue() public payable whenNotPaused { }

//内部函数
//代币交易转移的内部实现
    function _transfer(address _from, address _to, uint _value) internal {
        require(_to != address(0));//确保目标地址不为0x0，因为0x0地址代表销毁
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

}