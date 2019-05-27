pragma solidity ^0.5.0;

import "./owned.sol";

contract pausable is owned {

    bool public paused = false;//函数是否暂停，初始时设为不暂停

    event Pause();
    event Unpause();

    modifier whenNotPaused() {
        require(!paused);
        _;
    }

    modifier whenPaused {
        require(paused);
        _;
    }

//外部函数
//暂停函数
    function pauseTransaction() external onlyOwner whenNotPaused returns (bool) {
        paused = true;
        emit Pause();
        return true;
    }

//公有函数
//取消暂停函数
    function unpauseTransaction() public onlyOwner whenPaused returns (bool) {
        paused = false;
        emit Unpause();
        return true;
    }

}