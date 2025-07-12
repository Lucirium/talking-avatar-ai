import os
import re
import shutil

PROJECT_DIR = '.'
IGNORE_DIRS = ['node_modules', '.git', 'venv', '__pycache__']
REPORT_FILE = 'AI_REPORT_FR.md'
BACKUP_FOLDER = 'backup_ai_refactor'

def scan_file(filepath):
    suggestions = []
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        # Détecter console.log ou print en anglais
        if re.search(r'console\.log\([\'\"].*[a-zA-Z]{3,}.*[\'\"]\)', content):
            suggestions.append('✅ Console.log avec texte anglais → traduire en français.')
        # Détecter port codé en dur
        if re.search(r'port\s*=\s*["\']?3000["\']?', content):
            suggestions.append('✅ Port 3000 codé en dur → remplacer par PORT dynamique.')
        # Vérifier import/export mix ESModule/CommonJS
        if 'import ' in content and 'module.exports' in content:
            suggestions.append('⚠️ Mélange ESModule/CommonJS → unifier.')
    return suggestions

def backup_file(filepath):
    backup_path = os.path.join(BACKUP_FOLDER, filepath)
    os.makedirs(os.path.dirname(backup_path), exist_ok=True)
    shutil.copy(filepath, backup_path)

def main():
    report = []
    for root, dirs, files in os.walk(PROJECT_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            if file.endswith(('.js', '.mjs', '.jsx', '.ts', '.tsx', '.py')):
                filepath = os.path.join(root, file)
                suggestions = scan_file(filepath)
                if suggestions:
                    report.append(f'### {filepath}\n' + '\n'.join(f'- {s}' for s in suggestions) + '\n')
                    # backup_file(filepath)  # Décommente si tu veux sauvegarder les fichiers avant modif

    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        if report:
            f.write('# Rapport AI Refactor (fr)\n\n' + '\n'.join(report))
            print(f'✅ Rapport généré : {REPORT_FILE}')
        else:
            f.write('# Rapport AI Refactor (fr)\n\nAucun problème détecté.')
            print(f'✅ Aucun problème détecté. Rapport généré : {REPORT_FILE}')

if __name__ == "__main__":
    main()
