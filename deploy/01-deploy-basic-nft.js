const { network } = require("hardhat");

const { developmentChains } = require("../helper-hardhat-config");
const { ETHERSCAN_API_KEY } = require("../secret");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const basicNFT = await deploy("BasicNFT", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (!developmentChains.includes(network.name) && ETHERSCAN_API_KEY) {
    log("Verifying.....");
    await verify(basicNFT.address, []);
  }
};

module.exports.tags = ["all", "basicNFT"];
