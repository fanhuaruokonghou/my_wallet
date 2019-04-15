pragma solidity ^0.5.0;

contract owned {
    address public owner;
//初始化构造
    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
//实现所有权的转移
    function transferOwnership(address newOwner) onlyOwner public {
        owner = newOwner;
    }
}