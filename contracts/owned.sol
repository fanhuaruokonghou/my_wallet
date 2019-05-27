pragma solidity ^0.5.0;

contract owned {

    address payable public owner;

//构造函数
    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

//公有函数
//实现所有权的转移
    function transferOwnership(address payable newOwner) public onlyOwner {
        require(newOwner != address(0));//确保新的管理者地址不为0x0，因为0x0地址代表销毁
        owner = newOwner;
    }

}