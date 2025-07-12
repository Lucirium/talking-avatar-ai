import { exec } from 'child_process';
import { join } from 'path';
import fs from 'fs';

export async function textToSpeech({ text, fileName }) {
  const mp3Path = join(fileName); // On garde exactement le path passé
  const safeText = text.replace(/"/g, "'"); // éviter les erreurs de guillemets

  return new Promise((resolve, reject) => {
    const command = `gtts-cli "${safeText}" --lang fr --output ${mp3Path}`;
    console.log(`🎤 gTTS génération : ${command}`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ gTTS erreur : ${error.message}`);
        return reject(error);
      }
      if (fs.existsSync(mp3Path)) {
        console.log(`✅ gTTS OK : fichier généré ${mp3Path}`);
        resolve(mp3Path);
      } else {
        console.error(`❌ gTTS échec : fichier non trouvé ${mp3Path}`);
        reject(new Erreur(`Fichier non généré : ${mp3Path}`));
      }
    });
  });
}
