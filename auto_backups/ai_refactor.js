const fs = require('fs');
const path = require('path');

const TRANSLATIONS = {
    'Message reçu': 'Message reçu',
    'Erreur': 'Erreur',
    'Traitement en cours': 'Traitement en cours',
    'Jack écoute': 'Jack écoute',
    'Génération des données labiales': 'Génération des données labiales',
    'Conversion terminée': 'Conversion terminée',
    'Erreur de transcription audio': 'Erreur de transcription audio',
    'Réponse par défaut': 'Réponse par défaut',
};

const VARIABLE_RENAMES = {
    messageUtilisateur: 'messageUtilisateur',
    messagesIA: 'messagesIA',
    donneesAudio: 'donneesAudio',
};

const REPORT = [];

function scanFolder(folderPath) {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            scanFolder(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
            translateFile(fullPath);
        }
    }
}

function translateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    for (const [eng, fr] of Object.entries(TRANSLATIONS)) {
        const regex = new RegExp(escapeRegExp(eng), 'g');
        content = content.replace(regex, fr);
    }

    for (const [oldVar, newVar] of Object.entries(VARIABLE_RENAMES)) {
        const regex = new RegExp(`\\b${oldVar}\\b`, 'g');
        content = content.replace(regex, newVar);
    }

    content = content.replace(/const DEFAULT_PORT = process.env.PORT || 3000;/, 'const DEFAULT_PORT = process.env.PORT || 3000;');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        REPORT.push(`✅ Modifications appliquées à : ${filePath}`);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateReport() {
    const reportPath = 'AI_REPORT.md';
    const reportContent = `# Rapport de Refactorisation IA

**Date :** ${new Date().toLocaleString()}

## Fichiers modifiés :
${REPORT.map(line => '- ' + line).join('\n')}

⚡ Script exécuté automatiquement. Pense à relire les changements !
`;

    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    console.log(`\n📝 Rapport généré : ${reportPath}`);
}

function main() {
    console.log('🚀 Démarrage du refactor...');
    scanFolder('./');
    generateReport();
    console.log('✨ Refactor terminé.');
}

main();
