// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title PublicMintERC1155
 * @dev ERC1155 contract with public minting, configurable pricing, and supply limits
 *
 * Features:
 * - Public minting (any wallet can mint)
 * - Per-token max supply limits
 * - Configurable mint price (can be free or paid)
 * - Per-wallet mint limits (optional)
 * - Different artwork/URI for each token ID
 * - Owner can update settings anytime
 */
contract PublicMintERC1155 is ERC1155, ERC1155Supply, Ownable {
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
    mapping(uint256 => uint256) public maxSupply;  // 0 = unlimited

    // Per-wallet tracking
    mapping(address => uint256) public walletMintCount;

    // Events
    event TokenCreated(uint256 indexed tokenId, string uri, uint256 maxSupply);
    event MintPriceUpdated(uint256 newPrice);
    event MaxPerWalletUpdated(uint256 newLimit);
    event MintingStatusUpdated(bool enabled);
    event TokenMinted(address indexed to, uint256 indexed tokenId, uint256 amount);

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
     * @dev Mint an existing token (public)
     * @param tokenId The token ID to mint
     * @param amount Number of tokens to mint
     */
    function mint(uint256 tokenId, uint256 amount) external payable {
        require(mintingEnabled, "Minting is disabled");
        require(bytes(_tokenURIs[tokenId]).length > 0, "Token does not exist");
        require(msg.value >= mintPrice * amount, "Insufficient payment");

        // Check max supply
        if (maxSupply[tokenId] > 0) {
            require(
                totalSupply(tokenId) + amount <= maxSupply[tokenId],
                "Exceeds max supply"
            );
        }

        // Check per-wallet limit
        if (maxPerWallet > 0) {
            require(
                walletMintCount[msg.sender] + amount <= maxPerWallet,
                "Exceeds wallet limit"
            );
        }

        walletMintCount[msg.sender] += amount;
        _mint(msg.sender, tokenId, amount, "");

        emit TokenMinted(msg.sender, tokenId, amount);
    }

    /**
     * @dev Mint to a specific address (public)
     */
    function mintTo(address to, uint256 tokenId, uint256 amount) external payable {
        require(mintingEnabled, "Minting is disabled");
        require(bytes(_tokenURIs[tokenId]).length > 0, "Token does not exist");
        require(msg.value >= mintPrice * amount, "Insufficient payment");

        if (maxSupply[tokenId] > 0) {
            require(
                totalSupply(tokenId) + amount <= maxSupply[tokenId],
                "Exceeds max supply"
            );
        }

        if (maxPerWallet > 0) {
            require(
                walletMintCount[to] + amount <= maxPerWallet,
                "Exceeds wallet limit"
            );
        }

        walletMintCount[to] += amount;
        _mint(to, tokenId, amount, "");

        emit TokenMinted(to, tokenId, amount);
    }

    // ============ Owner Functions ============

    /**
     * @dev Create a new token with URI and optional max supply (owner only)
     * @param tokenURI The metadata URI for this token
     * @param _maxSupply Maximum supply (0 = unlimited)
     */
    function createToken(string memory tokenURI, uint256 _maxSupply) external onlyOwner returns (uint256) {
        uint256 newTokenId = _currentTokenId++;
        _tokenURIs[newTokenId] = tokenURI;
        maxSupply[newTokenId] = _maxSupply;

        emit TokenCreated(newTokenId, tokenURI, _maxSupply);
        return newTokenId;
    }

    /**
     * @dev Create and mint a new token in one transaction (owner only)
     */
    function createAndMint(
        address to,
        string memory tokenURI,
        uint256 _maxSupply,
        uint256 amount
    ) external onlyOwner returns (uint256) {
        uint256 newTokenId = _currentTokenId++;
        _tokenURIs[newTokenId] = tokenURI;
        maxSupply[newTokenId] = _maxSupply;

        if (_maxSupply > 0) {
            require(amount <= _maxSupply, "Amount exceeds max supply");
        }

        _mint(to, newTokenId, amount, "");

        emit TokenCreated(newTokenId, tokenURI, _maxSupply);
        emit TokenMinted(to, newTokenId, amount);
        return newTokenId;
    }

    /**
     * @dev Owner mint (bypasses payment and limits)
     */
    function ownerMint(address to, uint256 tokenId, uint256 amount) external onlyOwner {
        require(bytes(_tokenURIs[tokenId]).length > 0, "Token does not exist");

        if (maxSupply[tokenId] > 0) {
            require(
                totalSupply(tokenId) + amount <= maxSupply[tokenId],
                "Exceeds max supply"
            );
        }

        _mint(to, tokenId, amount, "");
        emit TokenMinted(to, tokenId, amount);
    }

    /**
     * @dev Update token URI (owner only)
     */
    function setTokenURI(uint256 tokenId, string memory tokenURI) external onlyOwner {
        _tokenURIs[tokenId] = tokenURI;
    }

    /**
     * @dev Update max supply for a token (owner only)
     * Can only increase or set to unlimited (0)
     */
    function setMaxSupply(uint256 tokenId, uint256 _maxSupply) external onlyOwner {
        require(
            _maxSupply == 0 || _maxSupply >= totalSupply(tokenId),
            "Cannot set below current supply"
        );
        maxSupply[tokenId] = _maxSupply;
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
     * @dev Get total number of token types created
     */
    function totalTokenTypes() external view returns (uint256) {
        return _currentTokenId;
    }

    /**
     * @dev Check if a token exists
     */
    function tokenExists(uint256 tokenId) external view returns (bool) {
        return bytes(_tokenURIs[tokenId]).length > 0;
    }

    /**
     * @dev Get remaining supply for a token (returns max uint256 if unlimited)
     */
    function remainingSupply(uint256 tokenId) external view returns (uint256) {
        if (maxSupply[tokenId] == 0) {
            return type(uint256).max;
        }
        return maxSupply[tokenId] - totalSupply(tokenId);
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
