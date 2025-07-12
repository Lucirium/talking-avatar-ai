import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import getPort from 'get-port';
import { openAIChain, parser } from "./modules/openAI.mjs";
import { lipSync } from "./modules/lip-sync.mjs";
import { sendDefaultMessages, defaultRéponse } from "./modules/defaultMessages.mjs";
import { convertAudioToText } from "./modules/Whisper.mjs";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());

app.post("/tts", async (req, res) => {
  const messageUtilisateur = req.body.message;
  console.log(`🗣️ Message reçu : ${messageUtilisateur}`);

  const defaultMessages = await sendDefaultMessages({ messageUtilisateur });
  if (defaultMessages) {
    res.send({ messages: defaultMessages });
    return;
  }

  let messagesIA;
  try {
    messagesIA = await openAIChain.invoke({
      question: messageUtilisateur,
      format_instructions: parser.getFormatInstructions(),
    });
  } catch (Erreur) {
    console.Erreur(`❌ Erreur GPT : ${Erreur.message}`);
    messagesIA = defaultRéponse;
  }

  try {
    messagesIA = await lipSync({ messages: messagesIA.messages });
  } catch (Erreur) {
    console.Erreur(`❌ Erreur lipSync : ${Erreur.message}`);
  }

  res.send({ messages: messagesIA });
});

app.post("/sts", async (req, res) => {
  const base64Audio = req.body.Audio;
  const donneesAudio = Buffer.from(base64Audio, "base64");

  let messageUtilisateur;
  try {
    messageUtilisateur = await convertAudioToText({ donneesAudio });
    console.log(`📝 Transcrit : ${messageUtilisateur}`);
  } catch (Erreur) {
    console.Erreur(`❌ Erreur Whisper : ${Erreur.message}`);
    res.status(500).send({ Erreur: "Erreur transcription Audio" });
    return;
  }

  let messagesIA;
  try {
    messagesIA = await openAIChain.invoke({
      question: messageUtilisateur,
      format_instructions: parser.getFormatInstructions(),
    });
  } catch (Erreur) {
    console.Erreur(`❌ Erreur GPT : ${Erreur.message}`);
    messagesIA = defaultRéponse;
  }

  try {
    messagesIA = await lipSync({ messages: messagesIA.messages });
  } catch (Erreur) {
    console.Erreur(`❌ Erreur lipSync : ${Erreur.message}`);
  }

  res.send({ messages: messagesIA });
});

(async () => {
  const port = process.env.PORT || await getPort({ port: Array.from({ length: 100 }, (_, i) => 3000 + i) });
  app.listen(port, () => {
    console.log(`🚀 Jack écoute sur le port ${port}`);
  });
})();
