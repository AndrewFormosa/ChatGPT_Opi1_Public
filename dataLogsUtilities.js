const { error } = require('console');
const fs=require('fs');

//path to the data folders
const dataPath='./data';
//path to the folder hoding the logs
const folderPath=(folder)=>dataPath+"/"+folder;
//path to the full file of the log including the index at the end and json file ext.
const FullFilePath=(folder,FolderNumber)=>dataPath+'/'+folder+'/'+folder+FolderNumber+'.json';

//This utility will allow CRUD operations on json files within given folders it will allow us to
//manipulate json files so that each json file is set to be only n objects long.
//We shall use the json id and the folder name and a fixedLengthOfJson to create a fileName to go in that folder.
//We will carry out all operations on those
//We cannot simply return a full json file however. we can only return sections of, otherwise we defeat the object of the exersie.
//There for we can return information about the folder such as, how many files, the length of the last file, the total length of the jsons, and the json



//function to get the last id number within the full batch of log files within a given folder.
async function getLastId(folder){
  numberOfFiles = await countFilesInDirectory(folder);
  if(numberOfFiles>0){
    pathOfLastJson=FullFilePath(folder,numberOfFiles);
    lastObject = await operateOnJSONFile(pathOfLastJson,null,'lastObject');
    return lastObject.id;
  }else{
    return 0;
  }
}

//function to to get one full json file within a given logs folder.
async function getFullDataFile(folder,fileNumber){
  numberOfFiles = await countFilesInDirectory(folder);
  if(numberOfFiles>=fileNumber){
    const  pathOfRequiredJson=FullFilePath(folder,fileNumber);
    data = await operateOnJSONFile(pathOfRequiredJson,'null','read');
    return data;
  }
}


//function to get a single json object with a specified id. (requires max json size for those logs)
async function getData(folder,id,maxJsonSize){
  numberOfFiles = await countFilesInDirectory(folder);
  const fileNumber =Math.floor((id-1)/maxJsonSize)+1;
  if(numberOfFiles>=fileNumber){
    const  pathOfRequiredJson=FullFilePath(folder,fileNumber);
    data = await operateOnJSONFile(pathOfRequiredJson,id,'lookUp');
    if(data!=null){
    return data}else{error('no id');return{};}
  }else{
    error('no files');return{};
  }
}

//function to update a single json object with a specified id (requiers max json size)
async function updateData(folder,id,maxJsonSize,data){
  numberOfFiles = await countFilesInDirectory(folder);
  const fileNumber =Math.floor((id-1)/maxJsonSize)+1;
  console.log('fileNo:'+fileNumber);
  if(numberOfFiles>=fileNumber){
    const  pathOfRequiredJson=FullFilePath(folder,fileNumber);
    operateOnJSONFile(pathOfRequiredJson,data,'update');
  }
}


//carry out normal CRUD, but work on ids and filename to manange files.

//function to add json object into a folder - will create a new file if required.
async function addData(folder,data,maxJsonSize){
    //check how many files are in that folder
    //if there are more than 0 then within the last file, check the length of the json.
    //if the length of last json == the maxJsonSize or no of files is 0 then create a new file with name folder+length+1 and write the json;
    //else push the data onto existing last json file.
    numberOfFiles = await countFilesInDirectory(folder);
    if(numberOfFiles>0){
        pathOfLastJson=FullFilePath(folder,numberOfFiles);
        lastJsonSize = await operateOnJSONFile(pathOfLastJson,null,'length');
        if(lastJsonSize<maxJsonSize){
            operateOnJSONFile(pathOfLastJson,data,'create');
        }else{
            pathOfNewJson = FullFilePath(folder,(numberOfFiles+1))
            data=[data];
            createJsonFile(pathOfNewJson,data);
        }
    }else{
        pathOfNewJson = FullFilePath(folder,1)
        data=[data];
            createJsonFile(pathOfNewJson,data);
    }
}

//returns the number of files within a given data log folder. (can be used to iterate through all logs);
async function countFilesInDirectory(folder) {
    return new Promise((resolve, reject) => {
      const dirPath = folderPath(folder);
      fs.readdir(dirPath, (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(files.length);
      });
    });
  }


//INTERNAL FUNCTION TO CREATE NEW JSON FILE
async function createJsonFile(filePath, data) {
    const jsonData = JSON.stringify(data);
    fs.writeFile(filePath, jsonData, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  }

  

  

//INTERNAL FUNCTION TO OPERATE ON INDIVIDUAL JSON FILES
async function operateOnJSONFile(filename, jsonObj, operation) {
    try {
      // Read the existing JSON data from the file
      let existingData = fs.readFileSync(filename);
      let data = JSON.parse(existingData);
     
      switch (operation) {
        case 'create':
          // Add the new JSON object to the data array
          data.push(jsonObj);
          break;
        case 'read':
          // Return the entire JSON object
          return data;
        case 'update':
          // Update the existing JSON object with the new data
          let indexToUpdate = data.findIndex(item => item.id === jsonObj.id);
          if (indexToUpdate !== -1) {
            data[indexToUpdate] = jsonObj;
          }
          break;
          case 'lookUp':
            // Look up index;
            let indexToLookUp = data.findIndex(item => item.id === jsonObj);
            if (indexToLookUp !== -1) {
              return data[indexToLookUp];
            }
            break;
        case 'delete':
          // Delete the JSON object with the matching ID
          data = data.filter(item => item.id !== jsonObj.id);
          break;
          //overwrite the json
          case 'overwrite':
            // Delete the JSON object with the matching ID
            data = jsonObj;
            break;
            //Return the length of the json
        case 'length':
          return Object.keys(data).length;
          break;
          //Return the value of the last Id (the last id in the json)
        case 'lastKey':
          return data[Object.keys(data).length-1].id;
          break;
          //Return the object in the json)
        case 'lastObject':
          return data[Object.keys(data).length-1];
          break;
        default:
          throw new Error(`Invalid operation: ${operation}`);
      }
     
      // Write the updated JSON data back to the file
      fs.writeFileSync(filename, JSON.stringify(data));
    } catch (err) {
      console.error(err);
    }
  }


  async function createDataFolder() {
    const dataFolderPath = dataPath;
  
    // Check if 'data' folder already exists
    if (fs.existsSync(dataFolderPath)) {
      console.log('Data folder already exists.');
      return;
    }
  
    // Create 'data' folder
    fs.mkdirSync(dataFolderPath);
    console.log('Data folder created.');
  
    // Create other folders within 'data'
    const subFolders = ['chatArrayLog', 'chatLogs', 'chatSummaryLogs','embeddings','fullSummaryLog','outputLogs'];
    subFolders.forEach((folder) => {
      const folderPath = `${dataFolderPath}/${folder}`;
      fs.mkdirSync(folderPath);
      console.log(`Created folder: ${folderPath}`);
    });

    //create initial full summary log json

    let emptyFullSummaryJson = [{"id":1,"summary":""}];
    createJsonFile(FullFilePath('fullSummaryLog',1),emptyFullSummaryJson);

  }




module.exports = { 
  createJsonFile,
  countFilesInDirectory,
  addData,
  getLastId,
  getData,
  getFullDataFile,
  updateData,
  createDataFolder};
