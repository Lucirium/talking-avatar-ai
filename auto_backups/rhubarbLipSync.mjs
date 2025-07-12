import { exec } from "child_process";
import { join } from "path";

export async function getPhonemes({ message }) {
  const isWindows = process.platform === "win32";
  const rhubarbPath = isWindows ? join("bin", "rhubarb.exe") : "./bin/rhubarb";
  const inputMp3 = join("audios", `message_${message}.mp3`);
  const inputWav = join("audios", `message_${message}.wav`);
  const outputJson = join("audios", `message_${message}.json`);

  console.log(`🎵 [ffmpeg] Conversion MP3 → WAV : ${inputMp3} → ${inputWav}`);

  // Étape 1 : convertir mp3 → wav
  await new Promise((resolve, reject) => {
    const ffmpegCommand = `ffmpeg -y -i "${inputMp3}" "${inputWav}"`;
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ [ffmpeg] Erreur : ${error.message}`);
        return reject(error);
      }
      console.log(`✅ [ffmpeg] Conversion terminée : ${inputWav}`);
      resolve();
    });
  });

  // Étape 2 : exécuter Rhubarb
  const rhubarbCommand = `${rhubarbPath} -f json -o "${outputJson}" "${inputWav}" -r phonetic`;
  console.log(`🎬 [Rhubarb] Commande : ${rhubarbCommand}`);

  return new Promise((resolve, reject) => {
    exec(rhubarbCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ [Rhubarb] Erreur : ${error.message}`);
        return reject(error);
      }
      console.log(`✅ [Rhubarb] Phonèmes générés : ${outputJson}`);
      resolve(stdout);
    });
  });
}
