// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ProductBreakdown is Ownable, ReentrancyGuard {
    struct Stakeholder {
        address payable wallet;
        uint256 percentage;
        string role;
    }

    Stakeholder[] public stakeholders;
    uint256 public totalPercentage;

    event PaymentReceived(address indexed from, uint256 amount);
    event PaymentDistributed(address indexed to, uint256 amount, string role);
    event StakeholderAdded(
        address indexed wallet,
        uint256 percentage,
        string role
    );
    event StakeholderRemoved(address indexed wallet);

    constructor() {}

    function addStakeholder(
        address payable _wallet,
        uint256 _percentage,
        string memory _role
    ) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        require(_percentage > 0, "Percentage must be greater than 0");
        require(
            totalPercentage + _percentage <= 10000,
            "Total percentage exceeds 100%"
        );

        stakeholders.push(
            Stakeholder({wallet: _wallet, percentage: _percentage, role: _role})
        );
        totalPercentage += _percentage;

        emit StakeholderAdded(_wallet, _percentage, _role);
    }

    function distributePayment() external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        require(totalPercentage == 10000, "Total percentage must equal 100%");

        emit PaymentReceived(msg.sender, msg.value);

        for (uint256 i = 0; i < stakeholders.length; i++) {
            uint256 share = (msg.value * stakeholders[i].percentage) / 10000;
            (bool success, ) = stakeholders[i].wallet.call{value: share}("");
            require(success, "Distribution failed");
            emit PaymentDistributed(
                stakeholders[i].wallet,
                share,
                stakeholders[i].role
            );
        }
    }

    function removeStakeholder(uint256 index) external onlyOwner {
        require(index < stakeholders.length, "Invalid index");
        totalPercentage -= stakeholders[index].percentage;
        emit StakeholderRemoved(stakeholders[index].wallet);

        stakeholders[index] = stakeholders[stakeholders.length - 1];
        stakeholders.pop();
    }

    function getStakeholdersCount() external view returns (uint256) {
        return stakeholders.length;
    }

    function getStakeholder(
        uint256 index
    )
        external
        view
        returns (address wallet, uint256 percentage, string memory role)
    {
        require(index < stakeholders.length, "Invalid index");
        Stakeholder memory s = stakeholders[index];
        return (s.wallet, s.percentage, s.role);
    }
}
