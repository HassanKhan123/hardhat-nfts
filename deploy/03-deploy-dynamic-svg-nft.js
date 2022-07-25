const { network, ethers } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const fs = require("fs");
const { ETHERSCAN_API_KEY } = require("../secret");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let ethUsdPriceFeedAddress;

  if (developmentChains.includes(network.name)) {
    // Find ETH/USD price feed
    const EthUsdAggregator = await ethers.getContract("MockV3Aggregator");
    ethUsdPriceFeedAddress = EthUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
  }

  console.log("addrwes=----", ethUsdPriceFeedAddress);

  const lowSVG = await fs.readFileSync("./images/dynamicNft/frown.svg", {
    encoding: "utf8",
  });
  const highSVG = await fs.readFileSync("./images/dynamicNft/happy.svg", {
    encoding: "utf8",
  });

  log("----------------------------------------------------");
  let arguments = [ethUsdPriceFeedAddress, lowSVG, highSVG];
  const dynamicSvgNft = await deploy("DynamicSvgNft", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  // Verify the deployment
  if (!developmentChains.includes(network.name) && ETHERSCAN_API_KEY) {
    log("Verifying...");
    await verify(dynamicSvgNft.address, arguments);
  }
};

module.exports.tags = ["all", "dynamicsvg", "main"];
