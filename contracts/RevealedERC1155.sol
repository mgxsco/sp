// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RevealedERC1155
 * @dev ERC1155 contract for revealed NFTs from burned Seeds
 *
 * Features:
 * - Only users with pending reveals can mint
 * - Each revealed NFT has unique token ID and URI
 * - Tracks creator of each token
 */
contract RevealedERC1155 is ERC1155, ERC1155Supply, Ownable {
    string public name = "ABXD Revealed";
    string public symbol = "ABXD";

    // Token counter
    uint256 private _currentTokenId;

    // Seed contract reference
    address public seedContract;

    // Per-token data
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) public tokenCreator;

    // Events
    event TokenRevealed(uint256 indexed tokenId, address indexed creator, string uri);
    event SeedContractUpdated(address newSeedContract);

    constructor(address _seedContract) ERC1155("") Ownable(msg.sender) {
        seedContract = _seedContract;
    }

    // ============ Public Functions ============

    /**
     * @dev Mint a revealed NFT - requires pending reveal from seed contract
     */
    function mintRevealed(string memory tokenURI) external returns (uint256) {
        require(bytes(tokenURI).length > 0, "URI cannot be empty");

        // Check and consume pending reveal from seed contract
        ISeedContract(seedContract).consumeReveal(msg.sender);

        // Create new token
        uint256 newTokenId = _currentTokenId++;
        _tokenURIs[newTokenId] = tokenURI;
        tokenCreator[newTokenId] = msg.sender;

        _mint(msg.sender, newTokenId, 1, "");

        emit TokenRevealed(newTokenId, msg.sender, tokenURI);
        return newTokenId;
    }

    // ============ View Functions ============

    function uri(uint256 tokenId) public view override returns (string memory) {
        require(bytes(_tokenURIs[tokenId]).length > 0, "Token does not exist");
        return _tokenURIs[tokenId];
    }

    function totalTokens() external view returns (uint256) {
        return _currentTokenId;
    }

    function nextTokenId() external view returns (uint256) {
        return _currentTokenId;
    }

    function tokenExists(uint256 tokenId) external view returns (bool) {
        return bytes(_tokenURIs[tokenId]).length > 0;
    }

    // ============ Owner Functions ============

    function setSeedContract(address _seedContract) external onlyOwner {
        seedContract = _seedContract;
        emit SeedContractUpdated(_seedContract);
    }

    /**
     * @dev Owner can mint without pending reveal (for special cases)
     */
    function ownerMint(address to, string memory tokenURI) external onlyOwner returns (uint256) {
        require(bytes(tokenURI).length > 0, "URI cannot be empty");

        uint256 newTokenId = _currentTokenId++;
        _tokenURIs[newTokenId] = tokenURI;
        tokenCreator[newTokenId] = to;

        _mint(to, newTokenId, 1, "");

        emit TokenRevealed(newTokenId, to, tokenURI);
        return newTokenId;
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

// Interface for Seed contract
interface ISeedContract {
    function consumeReveal(address user) external;
    function pendingReveals(address user) external view returns (uint256);
}
