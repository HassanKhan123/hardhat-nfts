const { network } = require("hardhat");

const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { ETHERSCAN_API_KEY, UPLOAD_TO_PINATA } = require("../secret");
const {
  storeImages,
  storeTokeUriMetadata,
} = require("../utils/uploadToPinata");
const { verify } = require("../utils/verify");

const imagesLocation = "./images/randomNft";

const metaDataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_types: "Cuteness",
      value: 100,
    },
  ],
};

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Address, subscriptionId;

  let tokenUris = [
    "ipfs://QmWftbwkJZHAA1mVBxJ1Gn3EPzGc8qvcWz5V7ZHpGcroM6",
    "ipfs://QmSdKZHnStsM6g2QmX6x1qC1mjGjPhaw61CzUx4B3EwRsw",
    "ipfs://QmQ1qRt7GWNq1tHVmyir3FJqfjPjdT2EbyYs4VNUbKg541",
  ];

  if (UPLOAD_TO_PINATA) {
    tokenUris = await handleTokenUris();
  }

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const txResponse = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await txResponse.wait(1);
    subscriptionId = txReceipt.events[0].args.subId;
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  const args = [
    vrfCoordinatorV2Address,
    networkConfig[chainId].gasLane,
    subscriptionId,
    networkConfig[chainId].callbackGaslimit,
    tokenUris,
    networkConfig[chainId].mintFee,
  ];

  const randomIpfsNft = await deploy("RandomIpfsNFT", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (!developmentChains.includes(network.name) && ETHERSCAN_API_KEY) {
    log("Verifying.....");
    await verify(randomIpfsNft.address, args);
  }
};

async function handleTokenUris() {
  let tokenUris = [];
  const { responses: imageUploadResponses, files } = await storeImages(
    imagesLocation
  );
  for (let imageUploadResponseIndex in imageUploadResponses) {
    let tokenUriMetadata = { ...metaDataTemplate };
    tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "");
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
    console.log(`Uploading ${tokenUriMetadata.name} to IPFS`);
    const metadataUploadResponse = await storeTokeUriMetadata(tokenUriMetadata);
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }
  console.log("Token uris uploaded!", tokenUris);
  return tokenUris;
}

module.exports.tags = ["all", "randomipfsNFT", "main"];
