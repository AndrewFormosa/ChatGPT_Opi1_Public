// Create a new speech synthesis object
// console.log("Loaded Speach");
const sleeping=true;
const synth = window.speechSynthesis;
 

// Get a list of available voices
var MaleVoice;

// Wait for the voices to be loaded
synth.onvoiceschanged = () => {
    // Get the list of available voices
    const voices = synth.getVoices();
    MaleVoice = voices[3];
    // Log the list of voices to the console
    // console.log(voices);
};

  function speakAnswer(answer){
    // Create a new utterance object
    const utterance = new SpeechSynthesisUtterance(answer); 
utterance.onboundary = function(event) {
    // Toggle the background color of the square between red and white
    if (event.name === "word") {
     // square.style.backgroundColor = "red";
     square.style.backgroundImage='url("/robot2.png")';
      setTimeout(function() {
        //square.style.backgroundColor = "white";
        square.style.backgroundImage='url("/robot1.png")';
      }, event.elapsedTime/4);
    }
  };

    // Speak the utterance
    utterance.voice=MaleVoice;
    utterance.pitch=1.5; // between 0 -2
    utterance.rate=1.5; //between 0.1 and 10
    synth.speak(utterance);
   }

const RobotImageArray=['url("/robot3.png")','url("/robot4.png")','url("/robot5.png")'];
square.style.backgroundImage=RobotImageArray[0];
// Define the function that you want to run
function doSomething() {

  console.log('blink');
  square.style.backgroundImage = RobotImageArray [0];

  setTimeout(function (){
    square.style.backgroundImage = 'url("/robot1.png")';
    setTimeout(function () {
      doSomething();
     },getRandomSeconds(5,15)*1000);

  }, 100);
}

    // Define a function that generates a random number of seconds between min and max
    function getRandomSeconds(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
function wakeUp()
{
    doSomething();
}
