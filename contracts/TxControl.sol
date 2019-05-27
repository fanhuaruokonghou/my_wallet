pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './transaction.sol';

contract TxControl is transaction{

    struct txSave{
        address buyer;
        address seller;
        uint8 txType;
        bool txStatus;
        uint256 value;
        uint8 buyerGrade;
    }

    struct txSaveRealTime{
        address buyer;
        string ipOrEigenvalues;
        string publicKeyCheck;
        bool txStatus;
        uint256 value;
        uint32 accountsNumber;
        uint8 buyerGrade;
        uint64 duration;
        uint256 buyerId;
        uint256 nonce;
    }

    mapping(address => address[]) public collectionAddress;
    address owner = msg.sender;
    uint256 startTx = 0;
    uint256 startRealTimeTx = 0;
    txSave[] txList;
    txSaveRealTime[] txRealTimeList;
    event addTx(address seller, uint256[] fileNUmberList, string publicKeyCheck);
    event addRealTimeTx(uint256 buyerId, uint256 nonce, string publicKeyCheck, string ipOrEigenvalues, uint64 duration);
    event confirmTx(uint256 i);
    event confirmRealTimeTx(uint256 i);

    modifier onlyOwnerOrBuyerTx(uint256 i){
        require(owner == msg.sender || msg.sender == txList[i].buyer);
        require(!txList[i].txStatus);
        _;
    }

    modifier onlyOwnerOrBuyerRealTimeTx(uint256 i){
        require(owner == msg.sender || msg.sender == txRealTimeList[i].buyer);
        require(!txRealTimeList[i].txStatus);
        _;
    }

    modifier onlyOwner(){
        require(owner == msg.sender);
        _;
    }
    function ()external payable { }

    function buyData(address _seller, uint8 _txType, uint256 _value, uint8 _buyerGrade) public returns(uint256){
        txSave memory txData = txSave({
            buyer: msg.sender,
            seller: _seller,
            txType: _txType,
            txStatus: false,
            value: _value,
            buyerGrade: _buyerGrade
        });
        txList.push(txData);
        beforeDataTransaction(msg.sender, _value, _seller);
        return txList.length - 1;
    }

    function refundData(uint256 i) public onlyOwnerOrBuyerTx(i) {
        dataTransactionRefund(txList[i].buyer,txList[i].seller, txList[i].value);
    }

    function makeSureTx(uint256 i) public onlyOwnerOrBuyerTx(i){
        afterDataTransaction(txList[i].buyer,txList[i].seller, txList[i].value, txList[i].buyerGrade);
        txList[i].txStatus = true;
        emit confirmTx(i);
    }

    function InquireUnconfirm(uint256 i) public view onlyOwner returns(uint256[] memory){
        uint256[] memory h = new uint256[](txRealTimeList.length);
        uint256 j = 0;
        for(i; i < txList.length; i++){
            if(!txList[i].txStatus){
                h[j] = i;
                j++;
            }
        }
        return h;
    }

    function InquireTx(uint256 i) public view returns(address, address, uint8, bool, uint256, uint8) {
        return (txList[i].buyer, txList[i].seller, txList[i].txType, txList[i].txStatus, txList[i].value, txList[i].buyerGrade);
    }

    function buyRealTimeData(uint256 _nonce, string memory _publicKeyCheck, string memory _ipOrEigenvalues, uint256 _value, uint32 _accountsNumber, uint8 _buyerGrade, uint64 _duration, uint256 _buyerId) public returns(uint256){
        txSaveRealTime memory txRealTimeData = txSaveRealTime({
            buyer: msg.sender,
            publicKeyCheck: _publicKeyCheck,
            ipOrEigenvalues: _ipOrEigenvalues,
            txStatus: false,
            value: _value,
            accountsNumber: _accountsNumber,
            buyerGrade: _buyerGrade,
            duration: _duration,
            buyerId: _buyerId,
            nonce: _nonce
        });
        txRealTimeList.push(txRealTimeData);
        beforeRealTimeTransaction(_accountsNumber,_value, msg.sender);
        emit addRealTimeTx(_buyerId, _nonce, _publicKeyCheck, _ipOrEigenvalues, _duration);
        return txRealTimeList.length - 1;
    }

    function setAddress(address[] memory addressList) public {
        collectionAddress[msg.sender] = addressList;
    }

    function makeSureRealTimeTx(uint256 i) public onlyOwnerOrBuyerRealTimeTx(i){
        afterRealTimeTransaction(txRealTimeList[i].accountsNumber, msg.sender, collectionAddress[msg.sender], txRealTimeList[i].value, txRealTimeList[i].buyerGrade);
        txRealTimeList[i].txStatus = true;
        delete collectionAddress[msg.sender];
        emit confirmRealTimeTx(i);
    }

    function refundRealTime(uint256 i) public onlyOwnerOrBuyerRealTimeTx(i) {
        realTimeTransactionRefund(txRealTimeList[i].buyer, collectionAddress[msg.sender], txRealTimeList[i].value);
    }

    function InquireUnconfirmReal(uint256 i) public view onlyOwner returns(uint256[] memory){
        uint256[] memory h = new uint256[](txRealTimeList.length) ;
        uint256 j = 0;
        for(i; i < txRealTimeList.length; i++){
            if(!txRealTimeList[i].txStatus){
                h[j] = i;
                j++;
            }
        }
        return h;
    }

    function InquireRealDataTx(uint256 i) public view returns(txSaveRealTime memory, address[] memory) {
        return (txRealTimeList[i], collectionAddress[txRealTimeList[i].buyer]);
    }
}