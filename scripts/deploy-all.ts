import { ethers, network } from "hardhat";
import * as fs from "fs";

// Contract deployment parameters
const CONTRACTS = {
  PublicMintERC1155: {
    args: ["MGXS NFT", "MGXS", ethers.parseEther("0"), 0], // name, symbol, mintPrice, maxPerWallet (0 = unlimited)
  },
  SoulboundMintERC1155: {
    args: ["MGXS Soulbound", "MGXS-SB", ethers.parseEther("0"), 0],
  },
  SeedERC1155: {
    args: ["MGXS Seed", "MGXS-SEED", ethers.parseEther("0.01"), 1000], // mintPrice, maxSupply
  },
  RevealedERC1155: {
    args: ["MGXS Revealed", "MGXS-REV", ethers.parseEther("0"), 0],
  },
};

// Network display names
const NETWORK_NAMES: Record<string, string> = {
  mainnet: "MAINNET",
  sepolia: "SEPOLIA",
  polygon: "POLYGON",
  amoy: "AMOY",
};

// Environment variable names for each contract type
const ENV_VAR_PREFIXES: Record<string, string> = {
  PublicMintERC1155: "VITE_CONTRACT",
  SoulboundMintERC1155: "VITE_SOULBOUND_CONTRACT",
  SeedERC1155: "VITE_SEED_CONTRACT",
  RevealedERC1155: "VITE_REVEALED_CONTRACT",
};

interface DeploymentResult {
  network: string;
  contract: string;
  address: string;
  txHash: string;
}

async function deployContract(
  contractName: string,
  args: any[]
): Promise<{ address: string; txHash: string }> {
  console.log(`\n  Deploying ${contractName}...`);

  const Contract = await ethers.getContractFactory(contractName);
  const contract = await Contract.deploy(...args);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash || "";

  console.log(`  ✓ ${contractName}: ${address}`);

  return { address, txHash };
}

async function deployToNetwork(networkName: string): Promise<DeploymentResult[]> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Deploying to ${networkName.toUpperCase()}`);
  console.log("=".repeat(60));

  const results: DeploymentResult[] = [];

  for (const [contractName, config] of Object.entries(CONTRACTS)) {
    try {
      const { address, txHash } = await deployContract(contractName, config.args);
      results.push({
        network: networkName,
        contract: contractName,
        address,
        txHash,
      });
    } catch (error) {
      console.error(`  ✗ Failed to deploy ${contractName}:`, error);
    }
  }

  return results;
}

function generateEnvOutput(results: DeploymentResult[]): string {
  const lines: string[] = [
    "",
    "# Add these to your Vercel Environment Variables:",
    "# ================================================",
    "",
  ];

  // Group by network
  const byNetwork: Record<string, DeploymentResult[]> = {};
  for (const result of results) {
    if (!byNetwork[result.network]) {
      byNetwork[result.network] = [];
    }
    byNetwork[result.network].push(result);
  }

  for (const [networkName, networkResults] of Object.entries(byNetwork)) {
    const envSuffix = NETWORK_NAMES[networkName] || networkName.toUpperCase();
    lines.push(`# ${networkName.toUpperCase()}`);

    for (const result of networkResults) {
      const prefix = ENV_VAR_PREFIXES[result.contract];
      if (prefix) {
        lines.push(`${prefix}_${envSuffix}=${result.address}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  const networkName = network.name;

  console.log("\n🚀 MGXS Multi-Chain Deployment");
  console.log("==============================");
  console.log(`Network: ${networkName}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error("\n❌ Error: Deployer has no funds!");
    process.exit(1);
  }

  const results = await deployToNetwork(networkName);

  // Generate output
  const envOutput = generateEnvOutput(results);
  console.log(envOutput);

  // Save to file
  const outputPath = `./deployments/${networkName}.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        network: networkName,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: results,
      },
      null,
      2
    )
  );
  console.log(`\n📁 Deployment saved to: ${outputPath}`);

  // Append to .env.deployments
  fs.appendFileSync(".env.deployments", envOutput);
  console.log(`📝 Environment variables appended to: .env.deployments`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
