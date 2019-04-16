pragma solidity ^0.5.0;

interface tokenRecipient { function receiveApproval(address _from, uint256 _value, address _token, bytes calldata _extraData ) external; }

import "./owned.sol";

contract TokenERC20 is owned {
    string public name;
    string public symbol;
    uint8 public decimals = 18;  // decimals �����е�С�����������С�Ĵ��ҵ�λ��18 �ǽ����Ĭ��ֵ
    uint256 public _totalSupply;
    // ��mapping����ÿ����ַ��Ӧ�����
    mapping (address => uint256) public _balances;
    // �洢���˺ŵĿ���
    // mapping (address => mapping (address => uint256)) public allowance;
    mapping (address => mapping (address => uint256)) private _allowed;
    // �¼�������֪ͨ�ͻ��˽��׷���
    event Transfer(address indexed from, address indexed to, uint256 value);
    // �¼�������֪ͨ�ͻ��˴��ұ�����
    event Burn(address indexed from, uint256 value);
    /**
     * ��ʼ������
     */
    constructor(uint256 initialSupply, string memory tokenName, string memory tokenSymbol) public {
        _totalSupply = initialSupply * 10 ** uint256(decimals);  // ��Ӧ�ķݶ�ݶ����С�Ĵ��ҵ�λ�йأ��ݶ� = ���� * 10 ** decimals��
        _balances[msg.sender] = _totalSupply;                // ������ӵ�����еĴ���
        name = tokenName;                                   // ��������
        symbol = tokenSymbol;                               // ���ҷ���
    }
    
    //���д�������
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    //��ѯ�˻��������
    function balanceOf(address who) external view returns (uint256) {
        return _balances[who];
    }
    
    //�鿴�˺ż�������ɻ��ѵĴ�����
    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowed[owner][spender];
    }
    
    /**
     * ���ҽ���ת�Ƶ��ڲ�ʵ��
     */
    function _transfer(address _from, address _to, uint _value) internal {
        // ȷ��Ŀ���ַ��Ϊ0x0����Ϊ0x0��ַ��������
        require(_to != address(0));
        // ��鷢�������
        require(_balances[_from] >= _value);
        // ȷ��ת��Ϊ������
        require(_balances[_to] + _value > _balances[_to]);
        // ����������齻�ף�
        uint previousBalances = _balances[_from] + _balances[_to];
        // Subtract from the sender
        _balances[_from] -= _value;
        // Add the same to the recipient
        _balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        // ��assert���������߼���
        assert(_balances[_from] + _balances[_to] == previousBalances);
    }

    /**
     *  ���ҽ���ת��
     * �Ӵ����������˺ŷ���`_value`�����ҵ� `_to`�˺�
     *
     * @param _to �����ߵ�ַ
     * @param _value ת������
     */
    function transfer(address  _to, uint256 _value) external returns (bool) {
        _transfer(msg.sender, _to, _value);
    }

    /**
     * �˺�֮����ҽ���ת��
     * @param _from �����ߵ�ַ
     * @param _to �����ߵ�ַ
     * @param _value ת������
     */
    function transferFrom(address payable _from, address payable _to, uint256 _value) onlyOwner external returns (bool) {
        require(_value <= _allowed[owner][_from]);     // Check allowance
        // allowance[_from][msg.sender] -= _value;
        _allowed[owner][_from] -= _value;
        _transfer(_from, _to, _value);
        return true;
    }

    /**
     * ����ĳ����ַ����Լ�����Խ��������廨�ѵĴ�������
     *
     * ��������`_spender` ���Ѳ����� `_value` ������
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
     * ���ٴ������˻���ָ��������
     */
    function burn(uint256 _value) onlyOwner public returns (bool success) {
        require(_balances[msg.sender] >= _value);   // Check if the sender has enough
        _balances[msg.sender] -= _value;            // Subtract from the sender
        _totalSupply -= _value;                      // Updates totalSupply
        emit Burn(msg.sender, _value);
        return true;
    }

    /**
     * �����û��˻���ָ��������
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