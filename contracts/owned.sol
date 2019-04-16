pragma solidity ^0.5.0;

contract owned {
    address public owner;
//��ʼ������
    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
//ʵ������Ȩ��ת��
    function transferOwnership(address newOwner) onlyOwner public {
        owner = newOwner;
    }
}