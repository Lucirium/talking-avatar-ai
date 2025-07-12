import { exec } from "child_process";
import { join } from "path";

export async function getPhonemes({ message }) {
  const isWindows = process.platform === "win32";
  const rhubarbPath = isWindows ? join("bin", "rhubarb.exe") : "./bin/rhubarb";
  const inputMp3 = join("Audios", `message_${message}.mp3`);
  const inputWav = join("Audios", `message_${message}.wav`);
  const outputJson = join("Audios", `message_${message}.json`);

  console.log(`🎵 [ffmpeg] Conversion MP3 → WAV : ${inputMp3} → ${inputWav}`);

  // Étape 1 : convertir mp3 → wav
  await new Promise((resolve, reject) => {
    const ffmpegCommand = `ffmpeg -y -i "${inputMp3}" "${inputWav}"`;
    exec(ffmpegCommand, (Erreur, stdout, stderr) => {
      if (Erreur) {
        console.Erreur(`❌ [ffmpeg] Erreur : ${Erreur.message}`);
        return reject(Erreur);
      }
      console.log(`✅ [ffmpeg] Conversion terminée : ${inputWav}`);
      resolve();
    });
  });

  // Étape 2 : exécuter Rhubarb
  const rhubarbCommand = `${rhubarbPath} -f json -o "${outputJson}" "${inputWav}" -r phonetic`;
  console.log(`🎬 [Rhubarb] Commande : ${rhubarbCommand}`);

  return new Promise((resolve, reject) => {
    exec(rhubarbCommand, (Erreur, stdout, stderr) => {
      if (Erreur) {
        console.Erreur(`❌ [Rhubarb] Erreur : ${Erreur.message}`);
        return reject(Erreur);
      }
      console.log(`✅ [Rhubarb] Phonèmes générés : ${outputJson}`);
      resolve(stdout);
    });
  });
}
