import { textToSpeech as convertTextToSpeech } from "./gtts.mjs";
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, audioFileToBase64 } from "../utils/files.mjs";

const MAX_RETRIES = 10;
const RETRY_DELAY = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function lipSync({ messages }) {
  for (const [index, message] of messages.entries()) {
    const mp3File = `audios/message_${index}.mp3`;

    // Étape 1 : texte → mp3
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await convertTextToSpeech({ text: message.text, fileName: mp3File });
        await delay(RETRY_DELAY);
        break;
      } catch (error) {
        if (attempt < MAX_RETRIES - 1) {
          console.warn(`⚠️ Retry ${attempt + 1} for TTS message_${index}`);
          await delay(RETRY_DELAY);
        } else {
          console.error(`❌ Erreur TTS message_${index}:`, error);
        }
      }
    }
    console.log(`✅ TTS généré pour message_${index}`);

    // Étape 2 : générer phonèmes
    try {
      await getPhonemes({ message: index });
      console.log(`✅ Phonèmes générés pour message_${index}`);
    } catch (error) {
      console.error(`❌ Erreur phonèmes message_${index}:`, error);
      continue; // on passe au suivant
    }

    // Étape 3 : récupérer audio en base64
    try {
      message.audio = await audioFileToBase64({ fileName: mp3File });
      message.lipsync = await readJsonTranscript({
        fileName: `audios/message_${index}.json`,
      });
    } catch (error) {
      console.error(`❌ Erreur lecture fichiers message_${index}:`, error);
    }
  }
  return messages;
}
