pragma solidity ^0.5.0;

contract owned {
    
    address payable public owner; 

    constructor() public {
        owner = msg.sender; 
    }

    modifier onlyOwner {
        require(msg.sender == owner); 
        _;
    }

    function transferOwnership(address payable newOwner) onlyOwner public {
        require(newOwner != address(0)); 
        owner = newOwner;
    }
}