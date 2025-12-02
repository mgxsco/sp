// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SoulboundERC1155
 * @dev Soulbound ERC1155 - tokens can be minted but NEVER transferred
 *
 * Features:
 * - Anyone can mint NEW tokens with their own artwork/URI
 * - Auto-incrementing token IDs (0, 1, 2, 3...)
 * - Configurable mint price (can be free or paid)
 * - Per-wallet mint limits (optional)
 * - SOULBOUND: Tokens cannot be transferred after minting
 */
contract SoulboundERC1155 is ERC1155, ERC1155Supply, Ownable {
    using Strings for uint256;

    string public name;
    string public symbol;

    // Token counter for auto-incrementing IDs
    uint256 private _currentTokenId;

    // Global settings
    uint256 public mintPrice;
    uint256 public maxPerWallet;  // 0 = unlimited
    bool public mintingEnabled;

    // Per-token settings
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) public tokenCreator;  // Track who created each token

    // Per-wallet tracking
    mapping(address => uint256) public walletMintCount;

    // Events
    event TokenCreated(uint256 indexed tokenId, address indexed creator, string uri);
    event MintPriceUpdated(uint256 newPrice);
    event MaxPerWalletUpdated(uint256 newLimit);
    event MintingStatusUpdated(bool enabled);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _mintPrice,
        uint256 _maxPerWallet
    ) ERC1155("") Ownable(msg.sender) {
        name = _name;
        symbol = _symbol;
        mintPrice = _mintPrice;
        maxPerWallet = _maxPerWallet;
        mintingEnabled = true;
    }

    // ============ Public Minting ============

    /**
     * @dev Anyone can mint a NEW soulbound token with their own URI
     * Creates the next token ID and mints it to the caller
     * TOKEN CANNOT BE TRANSFERRED AFTER MINTING
     * @param tokenURI The metadata URI for this NFT
     * @return tokenId The ID of the newly created token
     */
    function mintNew(string memory tokenURI) external payable returns (uint256) {
        require(mintingEnabled, "Minting is disabled");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(bytes(tokenURI).length > 0, "URI cannot be empty");

        // Check per-wallet limit
        if (maxPerWallet > 0) {
            require(
                walletMintCount[msg.sender] + 1 <= maxPerWallet,
                "Exceeds wallet limit"
            );
        }

        // Create new token
        uint256 newTokenId = _currentTokenId++;
        _tokenURIs[newTokenId] = tokenURI;
        tokenCreator[newTokenId] = msg.sender;

        // Update wallet count and mint
        walletMintCount[msg.sender] += 1;
        _mint(msg.sender, newTokenId, 1, "");

        emit TokenCreated(newTokenId, msg.sender, tokenURI);
        return newTokenId;
    }

    /**
     * @dev Get the next token ID that will be minted
     */
    function nextTokenId() external view returns (uint256) {
        return _currentTokenId;
    }

    // ============ Owner Functions ============

    /**
     * @dev Owner can mint new soulbound token (bypasses payment)
     */
    function ownerMintNew(
        address to,
        string memory tokenURI
    ) external onlyOwner returns (uint256) {
        require(bytes(tokenURI).length > 0, "URI cannot be empty");

        uint256 newTokenId = _currentTokenId++;
        _tokenURIs[newTokenId] = tokenURI;
        tokenCreator[newTokenId] = to;

        _mint(to, newTokenId, 1, "");

        emit TokenCreated(newTokenId, to, tokenURI);
        return newTokenId;
    }

    /**
     * @dev Update token URI (owner only)
     */
    function setTokenURI(uint256 tokenId, string memory tokenURI) external onlyOwner {
        require(bytes(_tokenURIs[tokenId]).length > 0, "Token does not exist");
        _tokenURIs[tokenId] = tokenURI;
    }

    /**
     * @dev Set mint price (owner only)
     */
    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
        emit MintPriceUpdated(_mintPrice);
    }

    /**
     * @dev Set per-wallet limit (owner only)
     */
    function setMaxPerWallet(uint256 _maxPerWallet) external onlyOwner {
        maxPerWallet = _maxPerWallet;
        emit MaxPerWalletUpdated(_maxPerWallet);
    }

    /**
     * @dev Enable/disable minting (owner only)
     */
    function setMintingEnabled(bool _enabled) external onlyOwner {
        mintingEnabled = _enabled;
        emit MintingStatusUpdated(_enabled);
    }

    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }

    // ============ View Functions ============

    /**
     * @dev Get token URI
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(bytes(_tokenURIs[tokenId]).length > 0, "Token does not exist");
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Get total number of tokens created
     */
    function totalTokens() external view returns (uint256) {
        return _currentTokenId;
    }

    /**
     * @dev Check if a token exists
     */
    function tokenExists(uint256 tokenId) external view returns (bool) {
        return bytes(_tokenURIs[tokenId]).length > 0;
    }

    /**
     * @dev Get remaining mints for a wallet (returns max uint256 if unlimited)
     */
    function remainingMintsForWallet(address wallet) external view returns (uint256) {
        if (maxPerWallet == 0) {
            return type(uint256).max;
        }
        if (walletMintCount[wallet] >= maxPerWallet) {
            return 0;
        }
        return maxPerWallet - walletMintCount[wallet];
    }

    /**
     * @dev Returns true to indicate this is a soulbound token
     */
    function isSoulbound() external pure returns (bool) {
        return true;
    }

    // ============ Soulbound Override ============

    /**
     * @dev Override _update to prevent transfers (only allow minting)
     * Minting: from == address(0)
     * Burning: to == address(0) (also blocked)
     * Transfer: from != address(0) && to != address(0) (blocked)
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        // Only allow minting (from == address(0))
        // Block all transfers and burns
        require(from == address(0), "Soulbound: transfers are disabled");

        super._update(from, to, ids, values);
    }

    /**
     * @dev Override setApprovalForAll to prevent approvals (not needed for soulbound)
     */
    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: approvals are disabled");
    }
}
