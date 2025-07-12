import { exec } from "child_process";
import { promises as fs } from "fs";

const execCommand = ({ command }) => {
  return new Promise((resolve, reject) => {
    exec(command, (Erreur, stdout, stderr) => {
      if (Erreur) reject(Erreur);
      resolve(stdout);
    });
  });
};

const readJsonTranscript = async ({ fileName }) => {
  const data = await fs.readFile(fileName, "utf8");
  return JSON.parse(data);
};

const AudioFileToBase64 = async ({ fileName }) => {
  const data = await fs.readFile(fileName);
  return data.toString("base64");
};

export { execCommand, readJsonTranscript, AudioFileToBase64 };
