// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ClaimRegistry is Ownable, ReentrancyGuard {
    
    uint256 private _claimIdCounter;

    enum ClaimStatus { SUBMITTED, PROCESSING, APPROVED, REJECTED, SETTLED }
    enum ClaimType { AUTO, HOME, HEALTH }

    struct Claim {
        uint256 id;
        address claimant;
        ClaimType claimType;
        ClaimStatus status;
        uint256 requestedAmount;
        uint256 approvedAmount;
        string ipfsHash; // Stores documents/photos
        string aiAssessmentHash;
        bool fraudulent;
        string fraudReason;
    }

    struct AIAssessment {
        uint256 confidenceScore; // 0-100
        uint256 riskScore; // 0-100
        uint256 recommendedAmount;
        string[] agentReports;
        bool fraudDetected;
    }

    // Events
    event ClaimSubmitted(uint256 indexed claimId, address indexed claimant, ClaimType claimType, uint256 requestedAmount);
    event AIAssessmentUpdated(uint256 indexed claimId, address indexed agent, bool fraudDetected);
    event ClaimApproved(uint256 indexed claimId, uint256 approvedAmount, address indexed approvedBy);
    event ClaimRejected(uint256 indexed claimId, string reason, address indexed rejectedBy);
    event ClaimSettled(uint256 indexed claimId, uint256 settledAmount, address indexed claimant);

    // Storage
    mapping(uint256 => Claim) public claims;
    mapping(uint256 => AIAssessment) public aiAssessments;
    mapping(address => uint256[]) public userClaims;
    mapping(address => bool) public authorizedAgents;
    mapping(address => bool) public validators;

    // Modifiers
    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender], "Not authorized agent");
        _;
    }

    modifier onlyValidator() {
        require(validators[msg.sender], "Not authorized validator");
        _;
    }

    modifier claimExists(uint256 claimId) {
        require(claims[claimId].id != 0, "Claim does not exist");
        _;
    }

    // Constructor
    constructor(address initialOwner) Ownable(initialOwner) {
        validators[initialOwner] = true; // Initial owner is validator
    }

    // Submit new claim (backend-triggered)
    function submitClaim(
        uint256 _claimId, // <-- ADD THIS
        address _claimant,
        ClaimType _claimType,
        uint256 _requestedAmount,
        string memory _ipfsHash
    ) external onlyOwner returns (uint256) {
        require(_requestedAmount > 0, "Invalid amount");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        require(claims[_claimId].id == 0, "Claim ID already exists"); // <-- ADD THIS CHECK

        claims[_claimId] = Claim({
            id: _claimId,
            claimant: _claimant,
            claimType: _claimType,
            status: ClaimStatus.SUBMITTED,
            requestedAmount: _requestedAmount,
            approvedAmount: 0,
            ipfsHash: _ipfsHash,
            aiAssessmentHash: "",
            fraudulent: false,
            fraudReason: ""
        });

        userClaims[_claimant].push(_claimId);
        emit ClaimSubmitted(_claimId, _claimant, _claimType, _requestedAmount);
        return _claimId;
    }

    // AI agent updates claim with assessment
    function updateAIAssessment(
        uint256 _claimId,
        uint256 _confidenceScore,
        uint256 _riskScore,
        uint256 _recommendedAmount,
        string[] memory _agentReports,
        bool _fraudDetected
    ) external onlyAuthorizedAgent claimExists(_claimId) {
        require(claims[_claimId].status == ClaimStatus.SUBMITTED, "Invalid status");

        aiAssessments[_claimId] = AIAssessment({
            confidenceScore: _confidenceScore,
            riskScore: _riskScore,
            recommendedAmount: _recommendedAmount,
            agentReports: _agentReports,
            fraudDetected: _fraudDetected
        });

        claims[_claimId].aiAssessmentHash = string(abi.encodePacked("ipfs://assessment-", _claimId));
        claims[_claimId].status = _fraudDetected ? ClaimStatus.REJECTED : ClaimStatus.PROCESSING;
        if (_fraudDetected) {
            claims[_claimId].fraudulent = true;
            claims[_claimId].fraudReason = "AI detected fraud";
            emit ClaimRejected(_claimId, "AI detected fraud", msg.sender);
        }
        emit AIAssessmentUpdated(_claimId, msg.sender, _fraudDetected);
    }

    // Validator approves claim
    function approveClaim(uint256 _claimId, uint256 _approvedAmount) external onlyValidator claimExists(_claimId) {
        require(claims[_claimId].status == ClaimStatus.PROCESSING, "Invalid status");
        require(_approvedAmount > 0, "Invalid amount");
        require(!claims[_claimId].fraudulent, "Fraudulent claim");

        claims[_claimId].status = ClaimStatus.APPROVED;
        claims[_claimId].approvedAmount = _approvedAmount;
        emit ClaimApproved(_claimId, _approvedAmount, msg.sender);
    }

    // Validator rejects claim
    function rejectClaim(uint256 _claimId, string memory _reason) external onlyValidator claimExists(_claimId) {
        require(claims[_claimId].status == ClaimStatus.PROCESSING, "Invalid status");
        claims[_claimId].status = ClaimStatus.REJECTED;
        claims[_claimId].fraudReason = _reason;
        emit ClaimRejected(_claimId, _reason, msg.sender);
    }

    // Settle approved claim
    function settleClaim(uint256 _claimId) external payable onlyValidator claimExists(_claimId) nonReentrant {
        require(claims[_claimId].status == ClaimStatus.APPROVED, "Claim not approved");
        require(msg.value == claims[_claimId].approvedAmount, "Incorrect amount");

        claims[_claimId].status = ClaimStatus.SETTLED;
        (bool success, ) = payable(claims[_claimId].claimant).call{value: claims[_claimId].approvedAmount}("");
        require(success, "Transfer failed");
        emit ClaimSettled(_claimId, claims[_claimId].approvedAmount, claims[_claimId].claimant);
    }

    // Manage authorized agents
    function addAuthorizedAgent(address _agent) external onlyOwner {
        authorizedAgents[_agent] = true;
    }

    function removeAuthorizedAgent(address _agent) external onlyOwner {
        authorizedAgents[_agent] = false;
    }

    // Manage validators
    function addValidator(address _validator) external onlyOwner {
        validators[_validator] = true;
    }

    function removeValidator(address _validator) external onlyOwner {
        validators[_validator] = false;
    }

    // Utility functions
    function getCurrentClaimId() external view returns (uint256) {
        return _claimIdCounter;
    }

    function getUserClaimsCount(address user) external view returns (uint256) {
        return userClaims[user].length;
    }

    function getUserClaim(address user, uint256 index) external view returns (uint256) {
        require(index < userClaims[user].length, "Index out of bounds");
        return userClaims[user][index];
    }
}