//Configure OPEN AI
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


async function getChatResponse(propmtToSendToOpenAI,temperature) {
    const response = await openai.createChatCompletion({ //call the appropriate API from openAi
        model: "gpt-3.5-turbo", //select the model
        messages: propmtToSendToOpenAI, // messages is an array of discussions (see promptToSendToOpenAI above)
        temperature: temperature //settings
        //max_tokens: 7, //settings
    });
    return response.data.choices[0].message.content; // extract the answer from the responceopiResponse and return
}


async function getEmbedingVector(message) {
    const embedding = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: message
  })
  const embeddings = embedding.data.data[0].embedding;
  return embeddings;
  }

  const chatObject=(role,content)=>{return{role:role,content:content};};


function conversationString(converstaionArray){
    var conversationList="conversation:\n";
    converstaionArray.forEach(element => {
     var role="You";
     if(element.role=="user"){
       role="Me";
     }
     let line = role + ':' + element.content + '\n';
     conversationList+=line;
    });
    return conversationList;

}

module.exports = { 
    getChatResponse,
    getEmbedingVector,
    chatObject,
    conversationString
    };