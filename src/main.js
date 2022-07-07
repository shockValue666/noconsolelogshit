const basePath = process.cwd();
const { NETWORK } = require(`${basePath}/constants/network.js`);
const fs = require("fs");
const sha1 = require(`${basePath}/node_modules/sha1`);
const { createCanvas, loadImage } = require(`${basePath}/node_modules/canvas`);
const buildDir = `${basePath}/build`;
const layersDir = `${basePath}/layers`;
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
} = require(`${basePath}/src/config.js`);
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;
var metadataList = [];
var attributesList = [];
var dnaList = new Set();
const DNA_DELIMITER = "-";
const HashlipsGiffer = require(`${basePath}/modules/HashlipsGiffer.js`);

let hashlipsGiffer = null;

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(`${buildDir}/json`);
  fs.mkdirSync(`${buildDir}/images`);
  if (gif.export) {
    fs.mkdirSync(`${buildDir}/gifs`);
  }
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  const withoutOptions = removeQueryStrings(_str);
  var dna = Number(withoutOptions.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      if (i.includes("-")) {
        throw new Error(`layer name can not contain dashes, please fix: ${i}`);
      }
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layerObj.name}/`), // returns an array of objects representing each element of the layer for example {id:0,name:"whitehand",filename:whitehand.png,path:`layers/layerName/whiteband.png,weight:40`}
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
    bypassDNA:
      layerObj.options?.["bypassDNA"] !== undefined
        ? layerObj.options?.["bypassDNA"]
        : false,
  }));
  return layers;
};


const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (_dna, _edition) => {
  let dateTime = Date.now();
  let tempMetadata = {
    name: `${namePrefix} #${_edition}`,
    description: description,
    image: `${baseUri}/${_edition}.png`,
    dna: sha1(_dna),
    edition: _edition,
    date: dateTime,
    ...extraMetadata,
    attributes: attributesList,
    compiler: "HashLips Art Engine",
  };
  if (network == NETWORK.sol) {
    tempMetadata = {
      //Added metadata for solana
      name: tempMetadata.name,
      symbol: solanaMetadata.symbol,
      description: tempMetadata.description,
      //Added metadata for solana
      seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
      image: `${_edition}.png`,
      //Added metadata for solana
      external_url: solanaMetadata.external_url,
      edition: _edition,
      ...extraMetadata,
      attributes: tempMetadata.attributes,
      properties: {
        files: [
          {
            uri: `${_edition}.png`,
            type: "image/png",
          },
        ],
        category: "image",
        creators: solanaMetadata.creators,
      },
    };
  }
  metadataList.push(tempMetadata);
  attributesList = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.name,
  });
};

const loadLayerImg = async (_layer) => {
  console.log("eimai karaflomalias loadedLayerImg: ",_layer)
  console.log("eimai karaflomalias gamw ti panagia loadedLayerImg: ",_layer.selectedElement)
  if(_layer.selectedElement){
    if(_layer.selectedElement.path){
        try {
        return new Promise(async (resolve) => {
          console.log("eimai karaflomalias gamw ti panagia loadedLayerImg inside the try catch shit: ",_layer.selectedElement.path)
          const image = await loadImage(`${_layer.selectedElement.path}`);
          resolve({ layer: _layer, loadedImage: image });
        });
      } catch (error) {
        console.error("Error loading image:", error);
      }
    }else{
      console.log("there must be something really wrong here bro cause path doesn't exist" , _layer)   
    }
  }else{
    console.log("there must be something really wrong here bro cause _layer.selectedElement doesn't exist" , _layer)
  }
};

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

const drawElement = (_renderObject, _index, _layersLen) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;
  text.only
    ? addText(
        `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
        text.xGap,
        text.yGap * (_index + 1),
        text.size
      )
    : ctx.drawImage(
        _renderObject.loadedImage,
        0,
        0,
        format.width,
        format.height
      );

  addAttributes(_renderObject);
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  console.log("_dna: ",_dna)
  console.log("_layers: ",_layers) // i am so close bro
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );
    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

/**
 * In some cases a DNA string may contain optional query parameters for options
 * such as bypassing the DNA isUnique check, this function filters out those
 * items without modifying the stored DNA.
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const dnaItems = _dna.split(DNA_DELIMITER);
  const filteredDNA = dnaItems.filter((element) => {
    const query = /(\?.*$)/;
    const querystring = query.exec(element);
    if (!querystring) {
      return true;
    }
    const options = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return options.bypassDNA;
  });

  return filteredDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  // console.log("removeQueryStrings _dna: ",_dna)
  const query = /(\?.*$)/;
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  console.log("isDNAunique: ",_dna)
  const _filteredDNA = filterDNAOptions(_dna);
  return !_DnaList.has(_filteredDNA);
};

const createDna = (_layers) => {
  let randNum = [];
  let skinType;
  let clothType;
  let clothDesign;
  _layers.forEach((layer) => { // for everyone of these {id:0,elements:[...{id:0,name:"whitehand",filename:whitehand.png,path:`layers/layerName/whiteband.png,weight:40`}],name:background,blend:"source-over",bypassDna:false}
    var totalWeight = 0;
    console.log(layer.name)
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });// for every layer's element it adds its rarity. so if we have 10 elements with 40 rarity each, totalWeight = 400
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight); // something between (0,400) ig
    let randomPlaceHolder = random;
    console.log('layer elements length: ',layer.elements.length)
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight; // random 
      // console.log('random: ',random,' i: ', i,' layerName: ',layer.name,' layer id: ',layer.id)
      if (random < 0) {
        if(layer.name=="Background"){
          console.log("background: ",layer.elements[i].filename)
          console.log("layer name is background ")
              return randNum.push(
              `${layer.elements[i].id}:${layer.elements[i].filename}${
                layer.bypassDNA ? "?bypassDNA=true" : ""
              }`
            );
        } // arms are going to define the layer Type
        else if(layer.name=="hands"){
          let handType = layer.elements[i].filename.split("_")[0].trim();
          console.log("handType: ",handType)
          
          if(handType == "Red" || handType == "Blue" || handType == "White"){
            skinType = handType
            console.log("handType is now skinType")
          }
          // else if(handType =="InvertedCross" || handType=="Black" || handType=="FireShirt" || handType =="Gown" || handType=="Skeleton"){
          //   clothType = handType;
          //   console.log("handType is now clothType")
          // }
          return randNum.push(
            `${layer.elements[i].id}:${layer.elements[i].filename}${
              layer.bypassDNA ? "?bypassDNA=true" : ""
            }`
          );
        }
        else if(layer.name=="arms"){
            if(skinType==layer.elements[i].filename.split("_")[0].trim() || layer.elements[i].filename.split("_")[0].trim()=="None"){
              console.log("MATCHED !!!!!!! \n")
              clothType = layer.elements[i].filename.split("_")[1]
              clothDesign = layer.elements[i].filename.split("_")[2].split("#")[0]
              console.log("clothDesign: ",clothDesign, " \n" )
              return randNum.push(
                `${layer.elements[i].id}:${layer.elements[i].filename}${
                  layer.bypassDNA ? "?bypassDNA=true" : ""
                }`
              );
            }else{
              console.log("random: : : ",random)
              console.log("NO MATCH IN COLOR in ARMS: skinType is: ",skinType," while layerType is : ",layer.elements[i].filename.split("_")[0].trim(), "proof: ",skinType==layer.elements[i].filename.split("_")[0].trim())
              i=-1;
              random = Math.floor(Math.random() * totalWeight);
            }
        }//we don't care about the background
        else if(layer.name=="legs"){
          if(!layer.elements[i].filename.split("_")[1]){
              return randNum.push(
                `${layer.elements[i].id}:${layer.elements[i].filename}${
                  layer.bypassDNA ? "?bypassDNA=true" : ""
                }`
              );
          }
          if(skinType==layer.elements[i].filename.split("_")[0].trim()){
            console.log("MATCHED !!!!!!! \n")
            return randNum.push(
                `${layer.elements[i].id}:${layer.elements[i].filename}${
                  layer.bypassDNA ? "?bypassDNA=true" : ""
                }`
              );
          }else{
              console.log("random: : : ",random)
              console.log("NO MATCH IN COLOR IN LEGS: skinType is: ",skinType," while legType is : ",layer.elements[i].filename.split("_")[0].trim(), "proof: ",skinType==layer.elements[i].filename.split("_")[0].trim())
              random = Math.floor(Math.random() * totalWeight);
              i=-1;
          }
        }
        else if(layer.name=="body"){
          console.log("layer.elements[i].filename: ",layer.elements[i].filename)

            // clothtypes=[Gown,InvertedCross,FireShirt,Skeleton,Black]

            if(clothDesign == "Xray"){
              // let properElements = layer.element
              layer.elements.filter(element=>{
                console.log("element.filename.split(_)[2].split(#)[0].trim(): ",element.filename.split("_")[2].split("#")[0].trim())
                console.log("clothDesign: ",clothDesign)
              })
              // let properElements = layer.elements.filter(element => element.filename.split("_")[2].split("#")[0].trim() == clothDesign)
              let properElements = layer.elements.filter(element => element.filename.split("_")[2].split("#")[0].trim() == clothDesign)
              let realProperElements = properElements.filter(element => element.name.split("_")[0].trim() == skinType)
              let result = realProperElements[0]
              console.log("XRAY:::::: ",realProperElements)
              // let result = properElements[Math.floor(Math.random()*properElements.length)]
              console.log("result: ",result)
              return randNum.push(
              `${result.id}:${result.filename}${
                layer.bypassDNA ? "?bypassDNA=true" : ""
              }`)
            }
            else if(clothDesign == "AlienDrip"){
              layer.elements.filter(element=>{
                console.log("element.filename.split(_)[2].split(#)[0].trim(): ",element.filename.split("_")[2].split("#")[0].trim())
                console.log("clothDesign: ",clothDesign)
              })

              let properElements = layer.elements.filter(element => element.filename.split("_")[2].split("#")[0].trim() == clothDesign)
              let realProperElements = properElements.filter(element => element.name.split("_")[0].trim() == skinType)
              let result = realProperElements[0]
              console.log(realProperElements)
              // let result = properElements[Math.floor(Math.random()*properElements.length)]
              console.log("result: ",result)
              return randNum.push(
              `${result.id}:${result.filename}${
                layer.bypassDNA ? "?bypassDNA=true" : ""
              }`)
            }
            else if(clothDesign == "InverseCross"){
              layer.elements.filter(element=>{
                console.log("element.filename.split(_)[2].split(#)[0].trim(): ",element.filename.split("_")[2].split("#")[0].trim())
                console.log("clothDesign: ",clothDesign)
              })
              let properElements = layer.elements.filter(element => element.filename.split("_")[2].split("#")[0].trim() == clothDesign)
              let realProperElements = properElements.filter(element => element.name.split("_")[0].trim() == skinType)
              let result = realProperElements[0]
              console.log(realProperElements)
              // let result = properElements[Math.floor(Math.random()*properElements.length)]
              console.log("result: ",result)
              return randNum.push(
              `${result.id}:${result.filename}${
                layer.bypassDNA ? "?bypassDNA=true" : ""
              }`)
            }
            else if(clothDesign == "Suppreme"){
              layer.elements.filter(element=>{
                console.log("element.filename.split(_)[2].split(#)[0].trim(): ",element.filename.split("_")[2].split("#")[0].trim())
                console.log("clothDesign: ",clothDesign)
              })
              layer.elements.filter(element => element.filename.split("_")[2].split("#")[0].trim())
              let properElements = layer.elements.filter(element => element.filename.split("_")[2].split("#")[0].trim() == clothDesign)
              let realProperElements = properElements.filter(element => element.name.split("_")[0].trim() == skinType)
              let result = realProperElements[0]
              console.log("result: ",result)
              return randNum.push(
              `${result.id}:${result.filename}${
                layer.bypassDNA ? "?bypassDNA=true" : ""
              }`)
            }

            else if(clothDesign == "Sad"){
              layer.elements.filter(element=>{
                console.log("element.filename.split(_)[2].split(#)[0].trim(): ",element.filename.split("_")[2].split("#")[0].trim())
                console.log("clothDesign: ",clothDesign)
              })
              layer.elements.filter(element => element.filename.split("_")[2].split("#")[0].trim())
              let properElements = layer.elements.filter(element => element.filename.split("_")[2].split("#")[0].trim() == clothDesign)
              let realProperElements = properElements.filter(element => element.name.split("_")[0].trim() == skinType)
              let result = realProperElements[0]
              console.log("result: ",result)
              return randNum.push(
              `${result.id}:${result.filename}${
                layer.bypassDNA ? "?bypassDNA=true" : ""
              }`)
            }

            else if(clothDesign == "Fire"){
              layer.elements.filter(element=>{
                console.log("element.filename.split(_)[2].split(#)[0].trim(): ",element.filename.split("_")[2].split("#")[0].trim())
                console.log("clothDesign: ",clothDesign)
              })
              layer.elements.filter(element => element.filename.split("_")[2].split("#")[0].trim())
              let properElements = layer.elements.filter(element => element.filename.split("_")[2].split("#")[0].trim() == clothDesign)
              let realProperElements = properElements.filter(element => element.name.split("_")[0].trim() == skinType)
              let result = realProperElements[0]
              console.log("result: ",result)
              return randNum.push(
              `${result.id}:${result.filename}${
                layer.bypassDNA ? "?bypassDNA=true" : ""
              }`)
            }

            if(layer.elements[i].filename.split("_")[1].trim() == clothType){
              if(clothType=="Sweat"){
                let properElements = layer.elements.filter(element => element.filename.split("_")[1].trim() == clothType)     
                let result = properElements[Math.floor(Math.random()*properElements.length)]
                console.log("result: ",result)
                return randNum.push(
                `${result.id}:${result.filename}${
                  layer.bypassDNA ? "?bypassDNA=true" : ""
                }`)

              }
              if(layer.elements[i].filename.split("_")[0].trim() == skinType ){
                console.log("layer.elements[i].filename.split('_')[0].trim(): ", layer.elements[i].filename.split("_")[0].trim()," ||| skinType: ", skinType, " |||| layer.elements[i].filename.split('_')[1].trim(): ", layer.elements[i].filename.split("_")[1].trim()," ||| clothType: ",clothType)
                return randNum.push(
                `${layer.elements[i].id}:${layer.elements[i].filename}${
                  layer.bypassDNA ? "?bypassDNA=true" : ""
                }`
                ); 
              }else{
                console.log("random: : : ",random)
                console.log("NO MATCH IN COLOR IN BODY skinType: skinType is: ",skinType," while our skinType is : ",layer.elements[i].filename.split("_")[0].trim(), "proof: ",skinType==layer.elements[i].filename.split("_")[0].trim())
                console.log("NO MATCH IN COLOR IN BODY clothType: clothType is: ",clothType," while our clothType is : ",layer.elements[i].filename.split("_")[1].trim(), "proof: ",clothType==layer.elements[i].filename.split("_")[1].trim())
                let properElements = layer.elements.filter(element => (element.filename.split("_")[0].trim() == skinType && element.filename.split("_")[1].trim() == clothType))
                console.log("properElements: ",properElements)
                if(properElements.length == 1) {
                  let result = properElements[0];
                  console.log("result: ",result)
                  return randNum.push(
                `${result.id}:${result.filename}${
                  layer.bypassDNA ? "?bypassDNA=true" : ""
                }`)
                }else if(properElements.length==0){
                  console.log("properElements is empty, properElements: ",properElements," clothTypeSearching: ",clothType)
                }else{
                  let result = properElements[Math.floor(Math.random()*properElements.length)]
                  console.log("result: ",result)
                    return randNum.push(
                `${result.id}:${result.filename}${
                  layer.bypassDNA ? "?bypassDNA=true" : ""
                }`)
                // console.log("proper elements: ",properElements,"element.filename.split(_)[0].trim(): ",element.filename.split("_")[0].trim()," skinType: ",skinType," element.filename.split(_)[1].trim(): ",element.filename.split("_")[1].trim()," clothType: ",clothType," proof: ", (element.filename.split("_")[0].trim() == skinType && element.filename.split("_")[1].trim() == clothType))
                }
                random = Math.floor(Math.random() * totalWeight);
                i=-1;
              }  
              // return randNum.push(
              //   `${layer.elements[i].id}:${layer.elements[i].filename}${
              //     layer.bypassDNA ? "?bypassDNA=true" : ""
              //   }`)
            }else{
                console.log("random: : : ",random)
                console.log("NO MATCH IN COLOR IN BODY clothType: clothType is: ",clothType," while our clothtype is : ",layer.elements[i].filename.split("_")[1].trim(), "proof: ",clothType==layer.elements[i].filename.split("_")[1].trim())
                random = Math.floor(Math.random() * totalWeight);
                i=-1;
            }

          // if(layer.elements[i].filename.split("_")[0].trim() == skinType){
          //   console.log("MATCHED WITH COLOUR !!!!!!! \n")

          //   if(!clothType){
          //       return randNum.push(
          //       `${layer.elements[i].id}:${layer.elements[i].filename}${
          //         layer.bypassDNA ? "?bypassDNA=true" : ""
          //       }`
          //     );
          //   }
          //   if(layer.elements[i].filename.split("_")[1].trim() == clothType){
          //       return randNum.push(
          //       `${layer.elements[i].id}:${layer.elements[i].filename}${
          //         layer.bypassDNA ? "?bypassDNA=true" : ""
          //       }`
          //     );
          //   }else{
          //       console.log("random: : : ",random)
          //       console.log("NO MATCH IN COLOR IN BODY clothType: clothType is: ",clothType," while our clothtype is : ",layer.elements[i].filename.split("_")[1].trim(), "proof: ",clothType==layer.elements[i].filename.split("_")[1].trim())
          //       random = Math.floor(Math.random() * totalWeight);
          //       i=-1;
          //   }
          // }else{
          //     console.log("random: : : ",random)
          //     console.log("NO MATCH IN COLOR IN body: skinType is: ",skinType," while bodyType is : ",layer.elements[i].filename.split("_")[0].trim(), "proof: ",skinType==layer.elements[i].filename.split("_")[0].trim())
          //     random = Math.floor(Math.random() * totalWeight);
          //     i=-1;
          // }
        }
        else if(layer.name=="face"){
          if(layer.elements[i].filename.split("_")[0].trim() == skinType){
            return randNum.push(
                `${layer.elements[i].id}:${layer.elements[i].filename}${
                  layer.bypassDNA ? "?bypassDNA=true" : ""
                }`
              );
          }else{
              console.log("random: : : ",random)
              console.log("NO MATCH IN COLOR IN face: skinType is: ",skinType," while face is : ",layer.elements[i].filename.split("_")[0].trim(), "proof: ",skinType==layer.elements[i].filename.split("_")[0].trim())
              random = Math.floor(Math.random() * totalWeight);
              i=-1;
          }
        }
        else if(layer.name=="head"){
          return randNum.push(
                `${layer.elements[i].id}:${layer.elements[i].filename}${
                  layer.bypassDNA ? "?bypassDNA=true" : ""
                }`
              );
        }
      }
    }
  });
  return randNum.join(DNA_DELIMITER);
};
//layers: //returns an array with layersOrder.length elements. each elemeent is an object: {id:0,elements:[...{id:0,name:"whitehand",filename:whitehand.png,path:`layers/layerName/whiteband.png,weight:40`}],name:background,blend:"source-over",bypassDna:false} 

//returns a number


const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  
  console.log("GAMW TI POUTANA TI PANAGIA")
  for (
    let i = network == NETWORK.sol ? 0 : 1;
    i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo; //apo 0 i 1 22 kserwgw, ginetai export apo to config.js
    i++ // afxanomeno kata 1
  ) {
    abstractedIndexes.push(i); // zbrwxnw to 1 mesa sto array abstractedIndexes, to opoio orisame prin ligo
  }
  if (shuffleLayerConfigurations) { // na tsekarw ti ginetai an to kanw true
    abstractedIndexes = shuffle(abstractedIndexes); // anakatevei ta indexes mesa sto array 
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  while (layerConfigIndex < layerConfigurations.length) {
    console.log("\n\n\ LAYERcONFIGURATION LENGTH:  \n\n",layerConfigurations.length)
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    ); //returns an array with layersOrder.length elements. each elemeent is an object: {id:0,elements:[...{id:0,name:"whitehand",filename:whitehand.png,path:`layers/layerName/whiteband.png,weight:40`}],name:background,blend:"source-over",bypassDna:false} 
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
      let newDna = createDna(layers); //returns a number
      console.log("newDnaaaaaaaaaaaaaa: ",newDna)
      // layerConfigIndex++ //delete
      if (isDnaUnique(dnaList, newDna)) {
        let results = constructLayerToDna(newDna, layers); //dn uparxei selectedElement sto body object
        console.log("eimai mikropsolis RESULTS:::: ",results)
        let loadedElements = [];
        console.log("eimai gkrizomalis loadedElements::: ",loadedElements)

        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });

        await Promise.all(loadedElements).then((renderObjectArray) => {
          debugLogs ? console.log("Clearing canvas") : null;
          ctx.clearRect(0, 0, format.width, format.height);
          if (gif.export) {
            hashlipsGiffer = new HashlipsGiffer(
              canvas,
              ctx,
              `${buildDir}/gifs/${abstractedIndexes[0]}.gif`,
              gif.repeat,
              gif.quality,
              gif.delay
            );
            hashlipsGiffer.start();
          }
          if (background.generate) {
            drawBackground();
          }
          renderObjectArray.forEach((renderObject, index) => {
            drawElement(
              renderObject,
              index,
              layerConfigurations[layerConfigIndex].layersOrder.length
            );
            if (gif.export) {
              hashlipsGiffer.add();
            }
          });
          if (gif.export) {
            hashlipsGiffer.stop();
          }
          debugLogs
            ? console.log("Editions left to create: ", abstractedIndexes)
            : null;
          saveImage(abstractedIndexes[0]);
          addMetadata(newDna, abstractedIndexes[0]);
          saveMetaDataSingleFile(abstractedIndexes[0]);
          console.log(
            `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
              newDna
            )}`
          );
        });
        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        abstractedIndexes.shift();
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          process.exit();
        }
      }
    }
    layerConfigIndex++;
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup, getElements };
