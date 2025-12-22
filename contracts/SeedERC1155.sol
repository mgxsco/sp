// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SeedERC1155
 * @dev ERC1155 contract for Seed tokens that can be burned to reveal AI-generated NFTs
 *
 * Features:
 * - Mint Seed tokens (token ID 0)
 * - Burn Seeds to enable image generation
 * - Configurable mint price and max supply
 * - Admin can toggle multiple burns per wallet
 * - Tracks burn count per wallet
 */
contract SeedERC1155 is ERC1155, ERC1155Supply, Ownable {
    string public name = "ABXD Seed";
    string public symbol = "SEED";

    // Seed is always token ID 0
    uint256 public constant SEED_TOKEN_ID = 0;

    // Settings
    uint256 public mintPrice;
    uint256 public maxSupply;
    bool public mintingEnabled;
    bool public allowMultipleBurns; // If false, wallet can only burn once ever

    // Tracking
    uint256 public totalMinted;
    mapping(address => uint256) public walletMintCount;
    mapping(address => uint256) public walletBurnCount;
    mapping(address => bool) public hasBurned; // For one-time burn mode

    // Pending reveals - tracks wallets that burned but haven't minted revealed yet
    mapping(address => uint256) public pendingReveals;

    // Events
    event SeedMinted(address indexed to, uint256 amount);
    event SeedBurned(address indexed burner, uint256 burnCount);
    event RevealClaimed(address indexed claimer);
    event MintPriceUpdated(uint256 newPrice);
    event MaxSupplyUpdated(uint256 newSupply);
    event MintingStatusUpdated(bool enabled);
    event MultipleBurnsUpdated(bool allowed);

    constructor(
        uint256 _mintPrice,
        uint256 _maxSupply
    ) ERC1155("") Ownable(msg.sender) {
        mintPrice = _mintPrice;
        maxSupply = _maxSupply;
        mintingEnabled = true;
        allowMultipleBurns = true;
    }

    // ============ Public Functions ============

    /**
     * @dev Mint a Seed token
     */
    function mintSeed() external payable {
        require(mintingEnabled, "Minting is disabled");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(totalMinted < maxSupply, "Max supply reached");

        totalMinted += 1;
        walletMintCount[msg.sender] += 1;
        _mint(msg.sender, SEED_TOKEN_ID, 1, "");

        emit SeedMinted(msg.sender, 1);
    }

    /**
     * @dev Burn a Seed token to enable image generation
     */
    function burnSeed() external {
        require(balanceOf(msg.sender, SEED_TOKEN_ID) > 0, "No seed to burn");

        if (!allowMultipleBurns) {
            require(!hasBurned[msg.sender], "Already burned once");
            hasBurned[msg.sender] = true;
        }

        _burn(msg.sender, SEED_TOKEN_ID, 1);
        walletBurnCount[msg.sender] += 1;
        pendingReveals[msg.sender] += 1;

        emit SeedBurned(msg.sender, walletBurnCount[msg.sender]);
    }

    /**
     * @dev Called by revealed contract to consume a pending reveal
     */
    function consumeReveal(address user) external {
        require(pendingReveals[user] > 0, "No pending reveals");
        pendingReveals[user] -= 1;
        emit RevealClaimed(user);
    }

    // ============ View Functions ============

    function getSeedBalance(address account) external view returns (uint256) {
        return balanceOf(account, SEED_TOKEN_ID);
    }

    function canBurn(address account) external view returns (bool) {
        if (balanceOf(account, SEED_TOKEN_ID) == 0) return false;
        if (!allowMultipleBurns && hasBurned[account]) return false;
        return true;
    }

    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalMinted;
    }

    // ============ Owner Functions ============

    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
        emit MintPriceUpdated(_mintPrice);
    }

    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        require(_maxSupply >= totalMinted, "Cannot set below minted");
        maxSupply = _maxSupply;
        emit MaxSupplyUpdated(_maxSupply);
    }

    function setMintingEnabled(bool _enabled) external onlyOwner {
        mintingEnabled = _enabled;
        emit MintingStatusUpdated(_enabled);
    }

    function setAllowMultipleBurns(bool _allowed) external onlyOwner {
        allowMultipleBurns = _allowed;
        emit MultipleBurnsUpdated(_allowed);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Owner can grant pending reveals (for airdrops/special cases)
     */
    function grantPendingReveal(address user, uint256 amount) external onlyOwner {
        pendingReveals[user] += amount;
    }

    // ============ Required Overrides ============

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}
