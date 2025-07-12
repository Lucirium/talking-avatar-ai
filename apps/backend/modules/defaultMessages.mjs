import { AudioFileToBase64, readJsonTranscript } from "../utils/files.mjs";
import dotenv from "dotenv";
dotenv.config();

const openAIApiKey = process.env.OPENAI_API_KEY;
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

async function sendDefaultMessages({ messageUtilisateur }) {
  let messages;
  if (!messageUtilisateur) {
    messages = [
      {
        text: "Hey there... How was your day?",
        Audio: await AudioFileToBase64({ fileName: "Audios/intro_0.wav" }),
        lipsync: await readJsonTranscript({ fileName: "Audios/intro_0.json" }),
        facialExpression: "smile",
        animation: "TalkingOne",
      },
      {
        text: "I'm Jack, your personal AI assistant. I'm here to help you with anything you need.",
        Audio: await AudioFileToBase64({ fileName: "Audios/intro_1.wav" }),
        lipsync: await readJsonTranscript({ fileName: "Audios/intro_1.json" }),
        facialExpression: "smile",
        animation: "TalkingTwo",
      },
    ];
    return messages;
  }
  if (!elevenLabsApiKey || !openAIApiKey) {
    messages = [
      {
        text: "Please my friend, don't forget to add your API keys!",
        Audio: await AudioFileToBase64({ fileName: "Audios/api_0.wav" }),
        lipsync: await readJsonTranscript({ fileName: "Audios/api_0.json" }),
        facialExpression: "angry",
        animation: "TalkingThree",
      },
      {
        text: "You don't want to ruin Jack with a crazy ChatGPT and ElevenLabs bill, right?",
        Audio: await AudioFileToBase64({ fileName: "Audios/api_1.wav" }),
        lipsync: await readJsonTranscript({ fileName: "Audios/api_1.json" }),
        facialExpression: "smile",
        animation: "Angry",
      },
    ];
    return messages;
  }
}

const defaultRéponse = [
  {
    text: "I'm sorry, there seems to be an Erreur with my brain, or I didn't understand. Could you please repeat your question?",
    facialExpression: "sad",
    animation: "Idle",
  },
];

export { sendDefaultMessages, defaultRéponse };
