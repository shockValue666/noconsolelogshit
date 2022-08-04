const basePath = process.cwd();
const { MODE } = require(`${basePath}/constants/blend_mode.js`);
const { NETWORK } = require(`${basePath}/constants/network.js`);

const network = NETWORK.sol;

// General metadata for Ethereum
const namePrefix = "my cock";
const description = "Remember to replace your life";
const baseUri = "ipfs://NewUriToReplace";

const solanaMetadata = {
  symbol: "MyC",
  seller_fee_basis_points: 1000, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "none",
  creators: [
    {
      address: "z6KUp66TzewgHuv512rGgtg3uuTcYYDnC3PfjEsy1n5",
      share: 100,
    },
  ],
};

// If you have selected Solana then the collection starts from 0 automatically
const layerConfigurations = [
  {
    growEditionSizeTo: 15,
    layersOrder: [
      // { name: "heading" },
      // { name: "hair" },
      // { name: "eyes" },
      // { name: "midface" },
      // { name: "mouth" },
      // { name: "ears" },
      // { name: "horns" },
      // { name: "earrings" },

      { name: "Background" },
      { name: "hands" },
      { name: "arms" },
      { name: "legs" },
      { name: "body" },

      { name: "face" },
      { name: "head" },

      { name: "heading" },
      { name: "hair" },
      { name: "eyes" },
      { name: "midface" },
      { name: "mouth" },
      { name: "ears" },
      { name: "horns" },
      { name: "earrings" },

      {name: "lizardFace"},
      {name: "lizardEyes"},
      {name: "lizardMidface"},
      {name: "lizardHorns"},
      {name: "lizardEarrings"},

      {name: "rings"},
    ],
  },
];


//cool feature
const shuffleLayerConfigurations = false;

//more interesting stuff
const debugLogs = false;

const format = {
  width: 2000,
  height: 2500,
  smoothing: false,
};

const gif = {
  export: false,
  repeat: 0,
  quality: 100,
  delay: 500,
};

const text = {
  only: false,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
};

const pixelFormat = {
  ratio: 10 / 128,
};

const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
};

const extraMetadata = {};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 5,
  thumbWidth: 50,
  imageRatio: format.height / format.width,
  imageName: "preview.png",
};

const preview_gif = {
  numberOfImages: 5,
  order: "ASC", // ASC, DESC, MIXED
  repeat: 0,
  quality: 100,
  delay: 500,
  imageName: "preview.gif",
};

module.exports = {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  pixelFormat,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
  preview_gif,
};
