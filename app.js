//Configure Express and middleware
const express = require('express');
require('dotenv').config();
const cors = require('cors') // Cross-Origin Resource Sharing) is a system, consisting of transmitting HTTP headers, that determines whether browsers block frontend JavaScript code from accessing responses for cross-origin requests. The same-origin security policy forbids cross-origin access to resources
const app = express();
const path = __dirname;
const port = 3000;

app.use(cors());
//app.use('/',express.static(path+'/public'));//Now, you can load the files that are in the public directory from the /static path prefix. IE http://localhost:3000/static/images/kitten.jpg ----- & ----- http://localhost:3000/static/css/style.css
app.use(express.static(__dirname + '/public'));

var bodyParser = require('body-parser')
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())


// open up the index page in the browser on start up
app.get('/', (req, res) => {
    res.sendFile(path + '/views/index.html')
});

//receive the post request from the brower at end point
app.post('/recAndSendData/', async (req, res) => { //include async to allow await for async function
    const myMessage = req.body.myMessage;
    const opiResponse = await converse(myMessage);
    res.json({ response: opiResponse }); 
});

app.listen(port, () => {
    console.log('listening on port ' + port)
})


//get my utilities modules
const appSettings = require('./appSettings');
const appUtilities = require('./appUtilities');
const openIAUtilities=require('./openAIUtilities');
const dataLogsUtilities=require('./dataLogsUtilities');

//set up app constants and variables
const chatSummaryLogMaxSize=500;
const embeddingsMaxSize=500;
const chatArrayLogMaxSize=500;

//define format of log objects
const chatArrayLogObject=(id,time,chatArray)=>{return{id:id,time:time,chatArray:chatArray}};
const chatSummaryLogObject=(id,time,summary)=>{return {id:id,time:time,summary:summary}};
const embeddingsObject=(id,chatSummaryId,time,dialog,embeddingVector)=>{return {id:id,chatSummaryId:chatSummaryId,time:time,dialog:dialog,embeddingVector:embeddingVector}};

var currentConversationArray = []; //array to hold current disucssion of all messages during current chat.
var fullSummary;
var previousConversationSummary;
var chatNumber;
var dialogNumber;
var optputLogId;
var timer;
var newChat;




setUpApp();

async function setUpApp(){
 
    await dataLogsUtilities.createDataFolder();

  optputLogId =  await dataLogsUtilities.getLastId('outputLogs');
  chatNumber = await dataLogsUtilities.getLastId('chatArrayLog');
  dialogNumber = await dataLogsUtilities.getLastId('embeddings');

  console.log("set last outputLog id:"+optputLogId);
  console.log('set last chatNumber:'+chatNumber);
  console.log('set last dialogNumber:'+dialogNumber);

  setUpNewChat()
 
}

async function setUpNewChat(){
   // WE INCRESE THE CHAT NUMBER WITHIN THE LOGGING OF THE CHATS AND DIALOG
    console.log('NEW CHAT');
    newChat=true;
    previousConversationSummary='';
    //if it is not the fist ever chat...
    if(chatNumber>0){
        var lastSummaryNumber = await dataLogsUtilities.getLastId('chatSummaryLogs');
        var lastChatNumber = chatNumber;
        //if the summary of the last chat has not already been created
        if(lastSummaryNumber<lastChatNumber){
        // then create chat summary.
        var previousChatArray = await dataLogsUtilities.getData('chatArrayLog',chatNumber,chatArrayLogMaxSize);
        createChatSummarys(previousChatArray);
        }else{
            previousConversationSummary = (await dataLogsUtilities.getData('chatSummaryLogs',lastSummaryNumber,chatSummaryLogMaxSize)).summary;
            //fullSummary =(await dataLogsUtilities.getData('fullSummaryLog',1,1)).summary;
        }

    }
    fullSummary =(await dataLogsUtilities.getData('fullSummaryLog',1,1)).summary;
    chatNumber++; //THIS IS WHERE WE INCREASE THE CHAT NUMBER.
    currentConversationArray=[];
}


async function converse(message){

    //should check if conversation is getting large - if so then we should look to summarize

    clearTimeout(timer);
    var messageTime = new Date().getTime();

    //Analyse the user prompt to detmine the context around it so that appropriet memmories can be searched and stored.
    var messageAnalysisPrompt=[];
    messageAnalysisPrompt = messageAnalysisPrompt.concat(openIAUtilities.chatObject('user', 'Today is '+appUtilities.convertTimeToDate(messageTime)+'\n'+appSettings.messageAnalyisPromptHeader));
    messageAnalysisPrompt = messageAnalysisPrompt.concat(openIAUtilities.chatObject('user','This is a description of me, the user:\n'+fullSummary));
    messageAnalysisPrompt = messageAnalysisPrompt.concat(currentConversationArray);
    messageAnalysisPrompt = messageAnalysisPrompt.concat(openIAUtilities.chatObject('user','How can I, the user, say: "'+message+appSettings.messageAnalyisPromptFooter));

    var messageAnalysis = await openIAUtilities.getChatResponse(messageAnalysisPrompt,appSettings.chatTemperature);
    // console.log('message analysis Prompt:');
    // console.log(messageAnalysisPrompt);
    // console.log('message Analysis');
    // console.log(messageAnalysis); 


    var messageEmbedding = await openIAUtilities.getEmbedingVector(messageAnalysis);
    
    //take embeddings and return most relevent memories
    var memories = await getMostSimmilarChats(messageEmbedding);
    var randomMemory = (await dataLogsUtilities.getData('chatSummaryLogs',Math.floor(Math.random() * chatNumber) + 1,chatSummaryLogMaxSize)).summary;

    //create main message prompt
    var prompt=[];
    var p1 = openIAUtilities.chatObject('assistant', 'Today is '+appUtilities.convertTimeToDate(messageTime)+'\n'+appSettings.assistantInroduction);
    var p2=openIAUtilities.chatObject('assistant',appSettings.userIntroduction+'\n'+fullSummary);
    var p3=openIAUtilities.chatObject('assistant',appSettings.memoriesIntroduction+'\n'+previousConversationSummary+'\n'+memories+'\nA random memory is:\n'+randomMemory);

    prompt = prompt.concat(p1);
    prompt = prompt.concat(p2);
    prompt = prompt.concat(p3);
    prompt = prompt.concat(currentConversationArray);
    prompt = prompt.concat(openIAUtilities.chatObject('user',appSettings.promptDislaimer+message));
    //console.log(prompt);

    //5.Receive response and check if memories are acceptable.
    var response = await openIAUtilities.getChatResponse(prompt,appSettings.chatTemperature);
 
    //Create memories
    logDialogAndEmbeddings(message,messageAnalysis,messageTime,messageEmbedding,response);

    //set up new chat if time out or if conversation is greater than max size.
    console.log('chatSize:'+currentConversationArray.length)
    if(currentConversationArray.length>appSettings.maxChatSize){
        setUpNewChat();
    }else{
         timer = setTimeout(setUpNewChat, appSettings.chatTimeOut); // Start timer to beging new chat if no more conversation within givien time out
    }
    //return response
    return response;
   
}

//called after each dialog interaction.
async function logDialogAndEmbeddings(message,messageAnalysis,messageTime,messageEmbedding,response){
    //push diaolg onto conversationArray
    currentConversationArray.push(openIAUtilities.chatObject('user',message));
    currentConversationArray.push(openIAUtilities.chatObject('assistant',response));
    //log the conversationArry
    if(newChat){
        //chatNumber++; //THIS IS WHERE WE INCREASE THE CHAT NUMBER.
         newChat=false;
        await dataLogsUtilities.addData('chatArrayLog',chatArrayLogObject(chatNumber,messageTime,currentConversationArray),chatArrayLogMaxSize); 
    }else{
        await dataLogsUtilities.updateData('chatArrayLog',chatNumber,chatArrayLogMaxSize,chatArrayLogObject(chatNumber,messageTime,currentConversationArray));
    }
    //get & log the embeddings (message embedding already present)
    var responseEmbedding = await openIAUtilities.getEmbedingVector(response); 
    dialogNumber++; //INCREASE THE DIALOG NUMBER
    await dataLogsUtilities.addData('embeddings',embeddingsObject(dialogNumber,chatNumber,messageTime,messageAnalysis,messageEmbedding),embeddingsMaxSize);
    dialogNumber++; //INCREASE THE DIALOG NUMBER
    await dataLogsUtilities.addData('embeddings',embeddingsObject(dialogNumber,chatNumber,messageTime,response,responseEmbedding),embeddingsMaxSize);
    
};

//called at the start of a new chat if the summary has not already been produced.
async function createChatSummarys(previousChatArray){
    //console.log('previousChatArrayForSummary');
    //console.log(previousChatArray);
    chatString = openIAUtilities.conversationString(previousChatArray.chatArray);
    chatTime = previousChatArray.time;
    chatSummaryId = previousChatArray.id;
    var summaryLog ='On the '+ appUtilities.convertTimeToDate(chatTime)+' we discussed:\n' +
     await openIAUtilities.getChatResponse([openIAUtilities.chatObject(
    'user',appSettings.summaryPropmpt+'\n'+chatString
    )],0);
    await dataLogsUtilities.addData('chatSummaryLogs',chatSummaryLogObject(chatSummaryId,chatTime,summaryLog),chatSummaryLogMaxSize);
    previousConversationSummary = summaryLog;
    //console.log('SUMMARY LOGED');
    var fullSummaryLog=(await dataLogsUtilities.getData('fullSummaryLog',1,1)).summary;
    var prompt = appSettings.fullSummaryPropmpt+'\nOur Previous Conversation:\n'+summaryLog+'\nDescription of the user:\n'+fullSummaryLog;
    //console.log('full summary Prompt:'+prompt);
    fullSummary = await openIAUtilities.getChatResponse([openIAUtilities.chatObject('user',prompt)],0);
    await dataLogsUtilities.updateData('fullSummaryLog',1,1,{"id":1,"summary":fullSummary});
    //console.log('new summary'+fullSummary);
}

async function getMostSimmilarChats(messageEmbedding){
    var similarMemories=' ';
    var chatNumberLength = 100;//SHOULD BE SET AS GLOBAL CONST - DICTATES HOW MANY ITERATIONS OF DEEPER THINKING INTO MEMEORY.
    var embeddingsSearchDepth = appSettings.embeddingsSearchDepth;//how far into embeddings history to search.
    var simmilarChats=[];//set up list of similar chat summary numbers
    

    //work though all embeddings.
    const noOfFiles = await dataLogsUtilities.countFilesInDirectory('embeddings');
    for(let i=noOfFiles;i>0;i--){
        if(i<(noOfFiles-embeddingsSearchDepth)){
            break;
        }

         var file=await dataLogsUtilities.getFullDataFile('embeddings',i);
        
             const matches = await file.map(doc => ({
                summaryId: doc.chatSummaryId,
                time: doc.time,
                similarity:appUtilities.cosineSimilarity(messageEmbedding, doc.embeddingVector)
            }))
  
            simmilarChats = simmilarChats.concat(matches);
            
            simmilarChats= appUtilities.sortBySimilarityAndTime(simmilarChats); // sort by time
            simmilarChats = appUtilities.eliminateDuplicates(simmilarChats,'summaryId');//elimate duplicate chats
            simmilarChats = appUtilities.eliminateByFieldValue(simmilarChats,'summaryId',chatNumber);//remove current chat
            simmilarChats = appUtilities.eliminateByFieldValue(simmilarChats,'summaryId',(chatNumber-1));//remove previous chat.
            simmilarChats = simmilarChats.slice(0, chatNumberLength);//elliminate lowest scorers
            //console.log('chatNo:'+chatNumber);
            //console.log('similarChatArray');
            //console.log(simmilarChats);    
    }
    simmilarChats = simmilarChats.slice(0,appSettings.QtyMemoriesToReturn);
    simmilarChats.sort((a,b)=>b.time-a.time);
    //console.log(simmilarChats);

    for (const element of simmilarChats) {
        var chatSummaryObject = await dataLogsUtilities.getData('chatSummaryLogs', element.summaryId, chatSummaryLogMaxSize);
        var chatSummary = chatSummaryObject.summary;
        similarMemories = similarMemories + chatSummary+'\n';
      };

    return similarMemories;

    //set up list of chat numbers

}