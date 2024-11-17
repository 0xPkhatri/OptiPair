// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract OptionAMM {
    struct Option {
        uint strikePrice;
        uint lotSize; // x
        uint premium; // y
        uint k;       // Constant product x * y
        uint expiry;
        bool isCall;
        address creator;
    }

    Option[] public options;
    IERC20 public usdc;  // USDC token contract interface
    AggregatorV3Interface public priceFeed;
    
    // Mapping from option ID to user address to lot count
    mapping(uint => mapping(address => uint)) public optionOwnership;
    
    // Liquidity tracking
    uint public totalLiquidity;
    mapping(address => uint) public liquidityContributions;

    event OptionCreated(uint indexed optionId, uint strikePrice, uint lotSize, uint premium, uint expiry, bool isCall);
    event OptionPurchased(uint indexed optionId, address buyer, uint lotAmount, uint cost);
    event LiquidityAdded(address indexed provider, uint amount);
    event LiquidityRemoved(address indexed provider, uint amount);

    constructor(address _usdcAddress, address _priceFeedAddress) {
        usdc = IERC20(_usdcAddress);
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }
    function createOption(uint _strikePrice, uint _lotSize, uint _premium, uint _expiry, bool _isCall) public {
        uint _k = _lotSize * _premium;
        options.push(Option({
            strikePrice: _strikePrice,
            lotSize: _lotSize,
            premium: _premium,
            k: _k,
            expiry: _expiry,
            isCall: _isCall,
            creator: msg.sender
        }));
        uint optionId = options.length - 1;
        emit OptionCreated(optionId, _strikePrice, _lotSize, _premium, _expiry, _isCall);
    }

    function purchaseOption(uint _optionId, uint _lotAmount) public {
        require(_optionId < options.length, "Option does not exist");
        Option storage option = options[_optionId];
        require(block.timestamp < option.expiry, "Option has expired");
        require(option.lotSize >= _lotAmount, "Not enough options available");

        uint currentPremium = option.k / option.lotSize;
        uint cost = currentPremium * _lotAmount;

        require(usdc.transferFrom(msg.sender, address(this), cost), "Failed to transfer USDC");
        
        option.lotSize -= _lotAmount;  // Decrease lot size available
        option.premium = option.k / option.lotSize;  // Update premium for next buyer
        optionOwnership[_optionId][msg.sender] += _lotAmount;  // Record the purchase

        emit OptionPurchased(_optionId, msg.sender, _lotAmount, cost);
    }

    function addLiquidity(uint _amount) public {
        require(usdc.transferFrom(msg.sender, address(this), _amount), "Failed to transfer USDC");
        liquidityContributions[msg.sender] += _amount;
        totalLiquidity += _amount;
        emit LiquidityAdded(msg.sender, _amount);
    }

    function removeLiquidity(uint _amount) public {
        require(liquidityContributions[msg.sender] >= _amount, "Insufficient liquidity");
        require(usdc.transfer(msg.sender, _amount), "Transfer failed");
        liquidityContributions[msg.sender] -= _amount;
        totalLiquidity -= _amount;
        emit LiquidityRemoved(msg.sender, _amount);
    }

    function settleOption(uint optionId) public {
        require(optionId < options.length, "Option does not exist");
        Option storage option = options[optionId];
        require(block.timestamp >= option.expiry, "Option has not yet expired");
        require(optionOwnership[optionId][msg.sender] > 0, "No option holdings");

        int256 latestPrice = getLatestPrice();
        uint256 lotCount = optionOwnership[optionId][msg.sender];
        uint256 payout = 0;
        bool inTheMoney = false;

        if ((option.isCall && latestPrice > int256(option.strikePrice)) || (option.isCall == false && latestPrice < int256(option.strikePrice))) {
            inTheMoney = true;
            uint256 priceDifference = uint256(abs(latestPrice - int256(option.strikePrice)));
            payout = priceDifference * lotCount;

            // Ensure there is enough liquidity to pay out
            require(totalLiquidity >= payout, "Insufficient liquidity for payout");
            require(usdc.transfer(msg.sender, payout), "Payout failed");
            totalLiquidity -= payout;  // Update liquidity
        }

        // Burn the settled options
        optionOwnership[optionId][msg.sender] = 0;

        emit OptionSettled(optionId, msg.sender, payout, inTheMoney);
    }

    function getLatestPrice() public view returns (int256) {
        (
            /*uint80 roundID*/,
            int256 price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        return price;
    }

    function abs(int x) private pure returns (uint) {
        return x >= 0 ? uint(x) : uint(-x);
    }

    // Additional helper methods can be added here
}
