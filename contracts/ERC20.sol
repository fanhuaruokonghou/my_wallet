pragma solidity ^0.5.0;

interface tokenRecipient { function receiveApproval(address _from, uint256 _value, address _token, bytes calldata _extraData ) external; }

import "./owned.sol";

contract TokenERC20 is owned {
    string public name;
    string public symbol;
    uint8 public decimals = 18;  // decimals 可以有的小数点个数，最小的代币单位。18 是建议的默认值
    uint256 public _totalSupply;
    // 用mapping保存每个地址对应的余额
    mapping (address => uint256) public _balances;
    // 存储对账号的控制
    // mapping (address => mapping (address => uint256)) public allowance;
    mapping (address => mapping (address => uint256)) private _allowed;
    // 事件，用来通知客户端交易发生
    event Transfer(address indexed from, address indexed to, uint256 value);
    // 事件，用来通知客户端代币被消费
    event Burn(address indexed from, uint256 value);
    /**
     * 初始化构造
     */
    constructor(uint256 initialSupply, string memory tokenName, string memory tokenSymbol) public {
        _totalSupply = initialSupply * 10 ** uint256(decimals);  // 供应的份额，份额跟最小的代币单位有关，份额 = 币数 * 10 ** decimals。
        _balances[msg.sender] = _totalSupply;                // 创建者拥有所有的代币
        name = tokenName;                                   // 代币名称
        symbol = tokenSymbol;                               // 代币符号
    }
    
    //发行代币总量
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    //查询账户代币余额
    function balanceOf(address who) external view returns (uint256) {
        return _balances[who];
    }
    
    //查看账号及允许其可花费的代币数
    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowed[owner][spender];
    }
    
    /**
     * 代币交易转移的内部实现
     */
    function _transfer(address _from, address _to, uint _value) internal {
        // 确保目标地址不为0x0，因为0x0地址代表销毁
        require(_to != address(0));
        // 检查发送者余额
        require(_balances[_from] >= _value);
        // 确保转移为正数个
        require(_balances[_to] + _value > _balances[_to]);
        // 以下用来检查交易，
        uint previousBalances = _balances[_from] + _balances[_to];
        // Subtract from the sender
        _balances[_from] -= _value;
        // Add the same to the recipient
        _balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        // 用assert来检查代码逻辑。
        assert(_balances[_from] + _balances[_to] == previousBalances);
    }

    /**
     *  代币交易转移
     * 从创建交易者账号发送`_value`个代币到 `_to`账号
     *
     * @param _to 接收者地址
     * @param _value 转移数额
     */
    function transfer(address  _to, uint256 _value) external returns (bool) {
        _transfer(msg.sender, _to, _value);
    }

    /**
     * 账号之间代币交易转移
     * @param _from 发送者地址
     * @param _to 接收者地址
     * @param _value 转移数额
     */
    function transferFrom(address payable _from, address payable _to, uint256 _value) onlyOwner external returns (bool) {
        require(_value <= _allowed[owner][_from]);     // Check allowance
        // allowance[_from][msg.sender] -= _value;
        _allowed[owner][_from] -= _value;
        _transfer(_from, _to, _value);
        return true;
    }

    /**
     * 设置某个地址（合约）可以交易者名义花费的代币数。
     *
     * 允许发送者`_spender` 花费不多于 `_value` 个代币
     *
     * @param _spender The address authorized to spend
     * @param _value the max amount they can spend
     */
    function approve(address _spender, uint256 _value) onlyOwner external
        returns (bool) {
        // allowance[msg.sender][_spender] = _value;
        _allowed[owner][_spender] = _value;
        return true;
    }


    /**
     * 销毁创建者账户中指定个代币
     */
    function burn(uint256 _value) onlyOwner public returns (bool success) {
        require(_balances[msg.sender] >= _value);   // Check if the sender has enough
        _balances[msg.sender] -= _value;            // Subtract from the sender
        _totalSupply -= _value;                      // Updates totalSupply
        emit Burn(msg.sender, _value);
        return true;
    }

    /**
     * 销毁用户账户中指定个代币
     *
     * Remove `_value` tokens from the system irreversibly on behalf of `_from`.
     *
     * @param _from the address of the sender
     * @param _value the amount of money to burn
     */
    function burnFrom(address _from, uint256 _value) onlyOwner public returns (bool success) {
        require(_balances[_from] >= _value);                // Check if the targeted balance is enough
        require(_value <= _allowed[owner][_from]);    // Check allowance
        _balances[_from] -= _value;                         // Subtract from the targeted balance
        _allowed[owner][_from] -= _value;             // Subtract from the sender's allowance
        _totalSupply -= _value;                              // Update totalSupply
        emit Burn(_from, _value);
        return true;
    }
}