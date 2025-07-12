import os
import re
import shutil

# Liste des extensions à analyser
EXTENSIONS = ['.js', '.mjs']

# Motifs regex pour traduire console.log simples
TRANSLATIONS = {
    r"console\.log\(['\"]AI Refactor started['\"]\)": "console.log('AI Refactor démarré')",
    r"console\.log\(['\"]Done['\"]\)": "console.log('Terminé')"
}

def backup_file(filepath):
    backup_path = filepath + '.bak'
    shutil.copy(filepath, backup_path)
    print(f'🛡 Backup créé : {backup_path}')

def translate_console_logs(content):
    for pattern, replacement in TRANSLATIONS.items():
        content = re.sub(pattern, replacement, content)
    return content

def detect_mixed_modules(content):
    has_import = re.search(r'^\s*import ', content, re.MULTILINE)
    has_module_exports = re.search(r'\bmodule\.exports\b', content)
    return has_import and has_module_exports

def process_file(filepath, report):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    modified = False

    # Check and translate console logs
    new_content = translate_console_logs(content)
    if new_content != content:
        modified = True
        report.append(f'✅ Traduction console.log dans {filepath}')
        content = new_content

    # Check mixed module systems
    if detect_mixed_modules(content):
        report.append(f'⚠️ Mélange ESModule/CommonJS détecté dans {filepath}')

    # If modifications, backup and overwrite
    if modified:
        backup_file(filepath)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

def walk_project(root_dir):
    report = []
    for root, _, files in os.walk(root_dir):
        for file in files:
            if any(file.endswith(ext) for ext in EXTENSIONS):
                filepath = os.path.join(root, file)
                process_file(filepath, report)
    return report

def write_report(report_lines):
    report_file = 'AI_AUTOREPORT.md'
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write('# Rapport Auto Refactor\n\n')
        for line in report_lines:
            f.write(f'- {line}\n')
    print(f'📄 Rapport écrit : {report_file}')

if __name__ == '__main__':
    print('🚀 Lancement de l’analyse auto...')
    project_dir = '.'  # Dossier actuel
    report = walk_project(project_dir)
    write_report(report)
    print('✅ Analyse terminée.')
