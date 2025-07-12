import { textToVoix as convertTextToVoix } from "./gtts.mjs";
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, AudioFileToBase64 } from "../utils/files.mjs";

const MAX_RETRIES = 10;
const RETRY_DELAY = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function lipSync({ messages }) {
  for (const [index, message] of messages.entries()) {
    const mp3File = `Audios/message_${index}.mp3`;

    // Étape 1 : texte → mp3
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await convertTextToVoix({ text: message.text, fileName: mp3File });
        await delay(RETRY_DELAY);
        break;
      } catch (Erreur) {
        if (attempt < MAX_RETRIES - 1) {
          console.warn(`⚠️ Retry ${attempt + 1} for TTS message_${index}`);
          await delay(RETRY_DELAY);
        } else {
          console.Erreur(`❌ Erreur TTS message_${index}:`, Erreur);
        }
      }
    }
    console.log(`✅ TTS généré pour message_${index}`);

    // Étape 2 : générer phonèmes
    try {
      await getPhonemes({ message: index });
      console.log(`✅ Phonèmes générés pour message_${index}`);
    } catch (Erreur) {
      console.Erreur(`❌ Erreur phonèmes message_${index}:`, Erreur);
      continue; // on passe au suivant
    }

    // Étape 3 : récupérer Audio en base64
    try {
      message.Audio = await AudioFileToBase64({ fileName: mp3File });
      message.lipsync = await readJsonTranscript({
        fileName: `Audios/message_${index}.json`,
      });
    } catch (Erreur) {
      console.Erreur(`❌ Erreur lecture fichiers message_${index}:`, Erreur);
    }
  }
  return messages;
}
