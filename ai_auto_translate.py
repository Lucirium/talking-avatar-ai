import os
import shutil
import re

BACKUP_FOLDER = 'auto_backups'
EXTENSIONS = ['.js', '.mjs', '.ts', '.jsx', '.tsx']

TRADUCTIONS = {
    r'console\.log\((.*?)Hello': r'console.log(\1Salut',
    r'console\.log\((.*?)Hi': r'console.log(\1Salut',
    r'Listening on port': 'Écoute sur le port',
    r'Error:': 'Erreur :',
    r'Warning:': 'Attention :',
    r'Success': 'Succès',
    r'Starting': 'Démarrage',
    r'Done': 'Terminé',
    r'Shutting down': 'Extinction',
    r'Ready': 'Prêt',
    r'Connecting': 'Connexion',
    r'Connection': 'Connexion',
    r'Response': 'Réponse',
    r'Request': 'Requête',
}

def backup_file(file_path):
    os.makedirs(BACKUP_FOLDER, exist_ok=True)
    backup_path = os.path.join(BACKUP_FOLDER, os.path.basename(file_path))
    if os.path.abspath(file_path) != os.path.abspath(backup_path):
        shutil.copy2(file_path, backup_path)

def translate_text(content):
    for eng, fr in TRADUCTIONS.items():
        content = re.sub(eng, fr, content, flags=re.IGNORECASE)
    return content

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'require(' in content or 'import ' in content:
        print(f"⚠️ Skip module code : {file_path}")
        return
    translated = translate_text(content)
    if content != translated:
        backup_file(file_path)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(translated)
        print(f"✅ Traduit : {file_path}")

def scan_and_translate(directory):
    for root, _, files in os.walk(directory):
        if BACKUP_FOLDER in root:
            continue  # ⛔ ignore auto_backups folder
        for file in files:
            if any(file.endswith(ext) for ext in EXTENSIONS):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    print("🚀 Démarrage de la traduction intelligente FR...")
    scan_and_translate('.')
    print("✅ Traduction terminée ! Les fichiers originaux sont sauvegardés dans /auto_backups")
