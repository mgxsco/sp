// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SoulboundMintERC1155
 * @dev ERC1155 contract with public minting where anyone can create new NFTs
 * Tokens are soulbound (non-transferable) but can be burned by the owner
 *
 * Features:
 * - Anyone can mint NEW tokens with their own artwork/URI
 * - Auto-incrementing token IDs (0, 1, 2, 3...)
 * - Configurable mint price (can be free or paid)
 * - Per-wallet mint limits (optional)
 * - Owner can update settings anytime
 * - SOULBOUND: Transfers are disabled
 * - Token owners can burn their tokens
 */
contract SoulboundMintERC1155 is ERC1155, ERC1155Supply, Ownable {
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
    event TokenBurned(uint256 indexed tokenId, address indexed burner);
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

    // ============ Soulbound: Disable Transfers ============

    /**
     * @dev Override safeTransferFrom to disable transfers
     */
    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure override {
        revert("Soulbound: transfers disabled");
    }

    /**
     * @dev Override safeBatchTransferFrom to disable batch transfers
     */
    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure override {
        revert("Soulbound: transfers disabled");
    }

    /**
     * @dev Override setApprovalForAll to disable approvals (no point if transfers disabled)
     */
    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: approvals disabled");
    }

    // ============ Burn Function ============

    /**
     * @dev Allows token owner to burn their token
     * @param tokenId The ID of the token to burn
     */
    function burn(uint256 tokenId) external {
        require(balanceOf(msg.sender, tokenId) > 0, "Not token owner");
        _burn(msg.sender, tokenId, 1);
        emit TokenBurned(tokenId, msg.sender);
    }

    // ============ Public Minting ============

    /**
     * @dev Anyone can mint a NEW token with their own URI
     * Creates the next token ID and mints it to the caller
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
     * @dev Owner can mint new token (bypasses payment)
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
