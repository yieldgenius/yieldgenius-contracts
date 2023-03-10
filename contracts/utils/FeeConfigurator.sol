// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract FeeConfigurator is OwnableUpgradeable {
    struct FeeCategory {
        /**
         *@notice total fee charged on each harvest
         */
        uint256 total;
        /**
         *@notice split of total fee going to beefy fee batcher
         */
        uint256 beefy;
        /**
         *@notice split of total fee going to harvest caller
         */
        uint256 call;
        /**
         *@notice split of total fee going to developer of the strategy
         */
        uint256 strategist;
        /**
         *@notice description of the type of fee category
         */
        string label;
        /**
         *@notice on/off switch for fee category
         */
        bool active;
    }

    address public keeper;
    uint256 public totalLimit;
    uint256 constant DIVISOR = 1 ether;

    mapping(address => uint256) public stratFeeId;
    mapping(uint256 => FeeCategory) internal feeCategory;

    event SetStratFeeId(address indexed strategy, uint256 indexed id);
    event SetFeeCategory(
        uint256 indexed id,
        uint256 total,
        uint256 beefy,
        uint256 call,
        uint256 strategist,
        string label,
        bool active
    );
    event Pause(uint256 indexed id);
    event Unpause(uint256 indexed id);
    event SetKeeper(address indexed keeper);

    function initialize(
        address _keeper,
        uint256 _totalLimit
    ) public initializer {
        __Ownable_init();

        keeper = _keeper;
        totalLimit = _totalLimit;
    }

    /**
     *@notice checks that caller is either owner or keeper
     */
    modifier onlyManager() {
        require(msg.sender == owner() || msg.sender == keeper, "!manager");
        _;
    }

    /**
     *@notice Get strategy fees
     *@param _strategy Strategy address
     */
    function getFees(
        address _strategy
    ) external view returns (FeeCategory memory) {
        return getFeeCategory(stratFeeId[_strategy], false);
    }

    /**
     *@notice fetch fees for a strategy, _adjust option to view fees as % of total harvest instead of % of total fee
     *@param _strategy Strategy address
     *@param _adjust true/false
     */
    function getFees(
        address _strategy,
        bool _adjust
    ) external view returns (FeeCategory memory) {
        return getFeeCategory(stratFeeId[_strategy], _adjust);
    }

    /**
     *@notice fetch fee category for an id if active, otherwise return default category
     *@notice _adjust == true: view fees as % of total harvest instead of % of total fee
     *@param _id fee id
     *@param _adjust true/false
     *@return fees Fees
     */
    function getFeeCategory(
        uint256 _id,
        bool _adjust
    ) public view returns (FeeCategory memory fees) {
        uint256 id = feeCategory[_id].active ? _id : 0;
        fees = feeCategory[id];
        if (_adjust) {
            uint256 _totalFee = fees.total;
            fees.beefy = (fees.beefy * _totalFee) / DIVISOR;
            fees.call = (fees.call * _totalFee) / DIVISOR;
            fees.strategist = (fees.strategist * _totalFee) / DIVISOR;
        }
    }

    /**
     *@notice set a fee category id for a strategy that calls this function directly
     *@notice _adjust == true: view fees as % of total harvest instead of % of total fee
     *@param _feeId Fee id
     */
    function setStratFeeId(uint256 _feeId) external {
        _setStratFeeId(msg.sender, _feeId);
    }

    /**
     *@notice set a fee category id for a strategy by a manager
     *@param _strategy Strategy address
     *@param _feeId Fee id
     */
    function setStratFeeId(
        address _strategy,
        uint256 _feeId
    ) external onlyManager {
        _setStratFeeId(_strategy, _feeId);
    }

    /**
     *@notice set fee category ids for multiple strategies at once by a manager
     *@param _strategies Strategy address
     *@param _feeIds Fee id
     */
    function setStratFeeId(
        address[] memory _strategies,
        uint256[] memory _feeIds
    ) external onlyManager {
        uint256 stratLength = _strategies.length;
        for (uint256 i = 0; i < stratLength; i++) {
            _setStratFeeId(_strategies[i], _feeIds[i]);
        }
    }

    /**
     *@notice internally set a fee category id for a strategy
     *@param _strategy Strategy address
     *@param _feeId Fee id
     */
    function _setStratFeeId(address _strategy, uint256 _feeId) internal {
        stratFeeId[_strategy] = _feeId;
        emit SetStratFeeId(_strategy, _feeId);
    }

    /**
     *@notice set values for a fee category using the relative split for call and strategist
     *@notice i.e. call = 0.01 ether == 1% of total fee
     *@notice _adjust == true: input call and strat fee as % of total harvest
     *@param _id Fee id
     *@param _total Total fee
     *@param _call call fee
     *@param _strategist strategist fee
     *@param _label label
     *@param _active activity indicator
     *@param _adjust true/false
     */
    function setFeeCategory(
        uint256 _id,
        uint256 _total,
        uint256 _call,
        uint256 _strategist,
        string memory _label,
        bool _active,
        bool _adjust
    ) external onlyOwner {
        require(_total <= totalLimit, ">totalLimit");
        if (_adjust) {
            _call = (_call * DIVISOR) / _total;
            _strategist = (_strategist * DIVISOR) / _total;
        }
        uint256 beefy = DIVISOR - _call - _strategist;

        FeeCategory memory category = FeeCategory(
            _total,
            beefy,
            _call,
            _strategist,
            _label,
            _active
        );
        feeCategory[_id] = category;
        emit SetFeeCategory(
            _id,
            _total,
            beefy,
            _call,
            _strategist,
            _label,
            _active
        );
    }

    /**
     *@notice deactivate a fee category making all strategies with this fee id revert to default fees
     *@param _id fee id
     */
    function pause(uint256 _id) external onlyManager {
        feeCategory[_id].active = false;
        emit Pause(_id);
    }

    /**
     *@notice reactivate a fee category
     *@param _id fee id
     */
    function unpause(uint256 _id) external onlyManager {
        feeCategory[_id].active = true;
        emit Unpause(_id);
    }

    /**
     *@notice change keeper
     *@param _keeper keeper address
     */
    // change keeper
    function setKeeper(address _keeper) external onlyManager {
        keeper = _keeper;
        emit SetKeeper(_keeper);
    }
}
