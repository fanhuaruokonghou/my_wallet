pragma solidity ^0.5.0;

import "./token.sol";

contract transaction is token {
    
    uint256 constant DAY_IN_SECONDS = 86400; 
    uint256 constant MONTH_IN_SECONDS = 2592000; 
    uint256 private lastbuytimeInSeconds; 
    uint256 private timeinterval;
    uint256 private totalmoney;
    uint256 private buycontributionvalue;
    uint256 private sellcontributionvalue;
    uint256 private buyrebate; 
    uint256 private sellrebate; 
    uint256 private fee; 
    uint256 private buyerpayment;
    uint256 private sellercollection;
    uint256 private commission;
    uint256 private feeProportion = 1000; 
    uint256 private commissionProportion = 100; 
    uint256 private totalvalue; 
    uint8 private needSubsellercredit;
    uint8 private realSubsellercredit; 
    uint8 private needAddsellercredit; 
    uint8 private realAddsellercredit; 
    uint8 private _buyerTotalScore; 
    uint8 private _sellerTotalScore; 
    uint8 private sellercreditScore; 
    event SuccessFunds(address target, bool success);
    mapping (address => uint256) private _buycontributionvalue;
    mapping (address => uint256) private _sellcontributionvalue;
    mapping (address => uint256) private _lastbuytime;
    mapping (address => uint8[3]) private _sellercredit;
    mapping (address => uint256) private _totalbuyerpayment;
    mapping (address => uint256) private _totalsellercollection;

    function min(uint8 a, uint8 b) internal pure returns (uint8) {
        return a < b ? a : b;
    }
    
    function setProportion(uint256 newfeeProportion, uint256 newcommissionProportion) onlyOwner public whenNotPaused{
        feeProportion = newfeeProportion;
        commissionProportion = newcommissionProportion; 
    } 
   
    function _Buyerpayment(uint256 totalprice) internal whenNotPaused returns (uint256){
        fee = totalprice / feeProportion;       
        if(fee!=0){        
            buyerpayment = fee + totalprice; 
        }
        else{
            buyerpayment = 1 + totalprice;
        }
        return buyerpayment;
  }
  
    function _Sellercollection(uint256 totalprice) internal whenNotPaused returns (uint256){
        commission = totalprice / commissionProportion;      
        if(commission!=0){        
            sellercollection = totalprice - commission;  
        }
        else{
            sellercollection = totalprice - 1;
        }
        return sellercollection;
  }
  
//用户
    function Lastbuytime() external view returns (uint256) {
        return _lastbuytime[msg.sender];    
    } 
   
//管理员
    function LastbuytimeOnlyOwner(address who) external view onlyOwner returns (uint256) {
        return _lastbuytime[who];    
    }  

    function _UpdateLastbuytime(address buyer)  internal whenNotPaused{
        _lastbuytime[buyer] = now;  
    }
//用户
    function contributionvalue(uint256 i) external view returns (uint256) {
        if(i == 1){
            return _buycontributionvalue[msg.sender];
        }
        if(i == 2){
            return _sellcontributionvalue[msg.sender];
        }
    } 
//管理员
    function contributionvalueOnlyOwner(address who, uint256 i) external view onlyOwner returns (uint256) {
        if(i == 1){
            return _buycontributionvalue[who];
        }
        if(i == 2){
            return _sellcontributionvalue[who];
        }
    } 

    function _Updatecontributionvalue(address target, uint256 totalprice, uint256 i)  internal whenNotPaused{
        if(totalprice >= 2000){
            if(i == 1){
                _buycontributionvalue[target] += 1;
            }
            if(i == 2){
                _sellcontributionvalue[target] += 1;
            }  
        }
    }
//用户
    function TotalbuyerpaymenORsellercollection(uint256 i) external view returns (uint256) {
        if(i == 1){
            return _totalbuyerpayment[msg.sender];
        }
        if(i == 2){
            return _totalsellercollection[msg.sender];
        }
    }
//管理员
    function TotalbuyerpaymenORsellercollectionOnlyOwner(address who, uint256 i) external view onlyOwner returns (uint256) {
        if(i == 1){
            return _totalbuyerpayment[who];
        }
        if(i == 2){
            return _totalsellercollection[who];
        }
    }

    function _UpdateTotalbuyerpaymentORsellercollection(address target, uint256 totalprice, uint256 i) internal whenNotPaused{
        if(i == 1){
            _totalbuyerpayment[target] += totalprice; 
        }
        if(i == 2){
            _totalsellercollection[target] += totalprice;  
        }    
    }

//用户
    function Sellercredit(uint256 i) external view returns (uint256) {
        return _sellercredit[msg.sender][i];
    }
//管理者
    function SellercreditOnlyOwner(address who, uint256 i) external view onlyOwner returns (uint256) {
        return _sellercredit[who][i];
    }

    function _UpdateRelatedSellercredit(address target, uint256 i)  internal whenNotPaused{
        if(i == 1){
            _sellercredit[target][1] += 1;  
        }
        if(i == 2){
            _sellercredit[target][2] += 1;  
        }        
    }

    function _DecreaseSellercredit(address target)  internal whenNotPaused{
        if(_sellercredit[target][1] == 10){   
            if(_sellercredit[target][0] > 0){
                _sellercredit[target][0] -= 1;  
                _sellercredit[target][1] = 0;   
            }
            if(_sellercredit[target][0] == 0){   
                _sellercredit[target][0] = 0;   
            }
        }
        if(_sellercredit[target][1] > 10){  
            needSubsellercredit = _sellercredit[target][1] / 10;  
            realSubsellercredit = min(needSubsellercredit, _sellercredit[target][0]);  
            _sellercredit[target][0] -= realSubsellercredit;     
            _sellercredit[target][1] -= realSubsellercredit * 10;  
        }
    }

    function _IncreaseSellercredit(address target)  internal whenNotPaused{
        if(_sellercredit[target][2] == 50){ 
            if(_sellercredit[target][0] < 40){ 
                _sellercredit[target][0] += 1;  
                _sellercredit[target][2] = 0;          
            }
            if(_sellercredit[target][0] == 40){   
                _sellercredit[target][0] = 40;  
            }
        } 
        if(_sellercredit[target][2] > 50){   
            needAddsellercredit = _sellercredit[target][2] / 50;  
            realAddsellercredit = min(needAddsellercredit, 40 - _sellercredit[target][0]);  
            _sellercredit[target][0] += realAddsellercredit;    
            _sellercredit[target][2] -= realAddsellercredit * 50;  
        }
    }

    function LastbuytimeScore(address who) internal whenNotPaused returns (uint8) {
        lastbuytimeInSeconds = _lastbuytime[who]; 
        timeinterval = now - lastbuytimeInSeconds; 
        if(timeinterval >= MONTH_IN_SECONDS * 3){ 
            return 0;
        }
        if(timeinterval < MONTH_IN_SECONDS * 3 && timeinterval >= MONTH_IN_SECONDS){  
            return 10;
        }
        if(timeinterval < MONTH_IN_SECONDS && timeinterval >= DAY_IN_SECONDS * 3){  
            return 20;
        }
        if(timeinterval < DAY_IN_SECONDS * 3 && timeinterval >= 0){  
            return 30;
        }
    }
    
    function BuycontributionvalueScore(address who) internal whenNotPaused returns (uint8) {
        buycontributionvalue = _buycontributionvalue[who]; 
        if(buycontributionvalue >= 10000){  
            return 20;
        }
        if(buycontributionvalue < 10000 && buycontributionvalue >= 1000){  
            return 15;
        }
        if(buycontributionvalue < 1000 && buycontributionvalue >= 100){  
            return 10;
        }
        if(buycontributionvalue < 100 && buycontributionvalue >= 10){  
            return 5;
        }
        if(buycontributionvalue < 10 && buycontributionvalue >= 0){ 
            return 0;
        }
    }

    function TotalbuyerpaymentScoreORsellercollectionScore(address who, uint256 i) internal whenNotPaused returns (uint8) {
        if(i == 1){
            totalmoney = _totalbuyerpayment[who]; 
        }
        if(i == 2){
            totalmoney = _totalsellercollection[who]; 
        }
        if(totalmoney >= 20000000){ 
            return 20;
        }
        if(totalmoney < 20000000 && totalmoney >= 2000000){ 
            return 15;
        }
        if(totalmoney < 2000000 && totalmoney >= 200000){  
            return 10;
        }
        if(totalmoney < 200000 && totalmoney >= 20000){  
            return 5;
        }
        if(totalmoney < 20000 && totalmoney >= 0){ 
            return 0;
        }
    }

    function BuyergradeScore(uint8 buyergrade) internal view whenNotPaused returns (uint8) { 
        if(buyergrade == 0){ 
            return 10;       
        }
        if(buyergrade == 1){ 
            return 20;       
        }
        if(buyergrade == 2){ 
            return 30;       
        }
    }

    function SellcontributionvalueScore(address who) internal whenNotPaused returns (uint8) {
        sellcontributionvalue = _sellcontributionvalue[who]; 
        if(sellcontributionvalue >= 10000){  
            return 40;
        }
        if(sellcontributionvalue < 10000 && sellcontributionvalue >= 1000){  
            return 30;
        }
        if(sellcontributionvalue < 1000 && sellcontributionvalue >= 100){  
            return 20;
        }
        if(sellcontributionvalue < 100 && sellcontributionvalue >= 10){  
            return 10;
        }
        if(sellcontributionvalue < 10 && sellcontributionvalue >= 0){ 
            return 0;
        }
    }

    function BuyRebate(uint256 totalprice, address who, uint8 buyergrade) internal whenNotPaused returns (uint256) { 
        
        fee = totalprice / feeProportion;      
        _buyerTotalScore = LastbuytimeScore(who) + BuycontributionvalueScore(who) + TotalbuyerpaymentScoreORsellercollectionScore(who, 1) + BuyergradeScore(buyergrade);     
        if(_buyerTotalScore <= 100 && _buyerTotalScore >= 90){  
            buyrebate = fee * 9 / 10;
        }
        if(_buyerTotalScore < 90 && _buyerTotalScore >= 80){  
            buyrebate = fee * 8 / 10;
        }
        if(_buyerTotalScore < 80 && _buyerTotalScore >= 70){  
            buyrebate = fee * 7 / 10;
        }
        if(_buyerTotalScore < 70 && _buyerTotalScore >= 60){ 
            buyrebate = fee * 6 / 10;
        }
        if(_buyerTotalScore < 60 && _buyerTotalScore >= 50){ 
            buyrebate = fee * 5 / 10;
        }
        if(_buyerTotalScore < 50 && _buyerTotalScore >= 40){ 
            buyrebate = fee * 4 / 10;
        }
        if(_buyerTotalScore < 40 && _buyerTotalScore >= 30){ 
            buyrebate = fee * 3 / 10;
        }
        if(_buyerTotalScore < 30 && _buyerTotalScore >= 20){ 
            buyrebate = fee * 2 / 10;
        }
        if(_buyerTotalScore < 20 && _buyerTotalScore >= 10){ 
            buyrebate = fee * 1 / 10;
        }
        if(_buyerTotalScore < 10 && _buyerTotalScore >= 0){ 
            buyrebate = 0;
        }
        return buyrebate;
    }

    function SellRebate(uint256 totalprice, address who) internal whenNotPaused returns (uint256) { 
        
        commission = totalprice / commissionProportion;    
        sellercreditScore = _sellercredit[who][0]; 
        _sellerTotalScore = SellcontributionvalueScore(who) + TotalbuyerpaymentScoreORsellercollectionScore(who, 2) + sellercreditScore; 
        if(_sellerTotalScore <= 100 && _sellerTotalScore >= 90){  
            sellrebate = commission * 9 / 10;
        }
        if(_sellerTotalScore < 90 && _sellerTotalScore >= 80){  
            sellrebate = commission * 8 / 10;
        }
        if(_sellerTotalScore < 80 && _sellerTotalScore >= 70){  
            sellrebate = commission * 7 / 10;
        }
        if(_sellerTotalScore < 70 && _sellerTotalScore >= 60){ 
            sellrebate = commission * 6 / 10;
        }
        if(_sellerTotalScore < 60 && _sellerTotalScore >= 50){ 
            sellrebate = commission * 5 / 10;
        }
        if(_sellerTotalScore < 50 && _sellerTotalScore >= 40){ 
            sellrebate = commission * 4 / 10;
        }
        if(_sellerTotalScore < 40 && _sellerTotalScore >= 30){ 
            sellrebate = commission * 3 / 10;
        }
        if(_sellerTotalScore < 30 && _sellerTotalScore >= 20){ 
            sellrebate = commission * 2 / 10;
        }
        if(_sellerTotalScore < 20 && _sellerTotalScore >= 10){ 
            sellrebate = commission * 1 / 10;
        }
        if(_sellerTotalScore < 10 && _sellerTotalScore >= 0){ 
            sellrebate = 0;
        }
        return sellrebate;
    }

    function beforeDataTransaction(address _to, uint256 totalprice, address _from) public whenNotPaused{
        require(!frozenAccount[_from]);             
        require(!frozenAccount[_to]);               
        buyerpayment = _Buyerpayment(totalprice);  
        _transfer(_from, address(this), buyerpayment); 
        emit SuccessFunds(_from, true);
  }
  
    function afterDataTransaction(address  _from, address  _to, uint256 totalprice, uint8 buyergrade) public whenNotPaused{
        sellercollection = _Sellercollection(totalprice);   
        sellercollection += SellRebate(totalprice, _to); 
        _transfer(address(this), _to, sellercollection); 
        buyrebate = BuyRebate(totalprice, _from, buyergrade); 
        _transfer(address(this), _from, buyrebate); 
        _Updatecontributionvalue(_from, totalprice, 1);
        _Updatecontributionvalue(_to, totalprice, 2);
        _UpdateTotalbuyerpaymentORsellercollection(_from, totalprice, 1);
        _UpdateTotalbuyerpaymentORsellercollection(_to, totalprice, 2);
        _UpdateRelatedSellercredit(_to, 2);
        _IncreaseSellercredit(_to);
        _DecreaseSellercredit(_to);
        _UpdateLastbuytime(_from); 
    }

    function dataTransactionRefund(address _from, address _to, uint256 totalprice) public whenNotPaused{
        buyerpayment = _Buyerpayment(totalprice);  
        _transfer( address(this), _from, buyerpayment);  
        _UpdateRelatedSellercredit(_to, 1);
        _DecreaseSellercredit(_to);
        _IncreaseSellercredit(_to);
    }

     function beforeRealTimeTransaction(uint256 addressNumber, uint256 value, address _from) public whenNotPaused{
        require(!frozenAccount[_from]);             
        totalvalue = addressNumber * value;   
        buyerpayment = _Buyerpayment(totalvalue);  
        _transfer(_from, address(this), buyerpayment); 
        emit SuccessFunds(_from, true);
  }
 
    function afterRealTimeTransaction(address _from, address[] memory _to, uint256 value, uint8 buyergrade) public whenNotPaused{
        for(uint256 i = 0; i < _to.length; i++){
            sellercollection = _Sellercollection(value);   
            sellercollection += SellRebate(value, _to[i]); 
            _transfer(address(this), _to[i], sellercollection); 
            _Updatecontributionvalue(_to[i], value, 2);
            _UpdateTotalbuyerpaymentORsellercollection(_to[i], value, 2);
            _UpdateRelatedSellercredit(_to[i], 2);
            _IncreaseSellercredit(_to[i]);
            _DecreaseSellercredit(_to[i]);
        }
        buyrebate = BuyRebate(value * _to.length, _from, buyergrade); 
        _transfer(address(this), _from, buyrebate);
        _Updatecontributionvalue(_from, value * _to.length, 1);
        _UpdateTotalbuyerpaymentORsellercollection(_from, value * _to.length, 1);
        _UpdateLastbuytime(_from); 
}
   
    function realTimeTransactionRefund(address _from, address[] memory _to, uint256 value) public whenNotPaused{
        totalvalue = _to.length * value;  
        buyerpayment = _Buyerpayment(totalvalue);  
        _transfer( address(this), _from, buyerpayment);  
        for(uint256 i = 0; i < _to.length; i++){
            _UpdateRelatedSellercredit(_to[i], 1);
            _DecreaseSellercredit(_to[i]);
            _IncreaseSellercredit(_to[i]);
        }
    }
}