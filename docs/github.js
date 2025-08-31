export class GitHubManager {
    constructor() {
        this.config = {
            owner: '',
            repo: '',
            token: '',
            csvPath: 'flashcards.csv'
        };
    }
    
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    
    async apiRequest(endpoint, options = {}) {
        if (!this.config.token) {
            throw new Error('Token GitHub non configuré');
        }
        
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur GitHub: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    }
    
    async listDecks() {
        try {
            const contents = await this.apiRequest('/contents/');
            return contents
                .filter(item => item.type === 'file' && item.name.endsWith('.csv'))
                .map(file => file.name);
        } catch (error) {
            console.error('Erreur de liste des decks:', error);
            return ['flashcards.csv']; // Deck par défaut
        }
    }
    
    async loadDeck(deckName) {
        const content = await this.apiRequest(`/contents/${deckName}`);
        const csvData = atob(content.content);
        return this.parseCSV(csvData);
    }
    
    async saveDeck(deckName, flashcards) {
        const csvData = this.convertToCSV(flashcards);
        const content = btoa(unescape(encodeURIComponent(csvData)));
        
        // Vérifier si le fichier existe déjà pour obtenir son SHA
        let sha = null;
        try {
            const existingFile = await this.apiRequest(`/contents/${deckName}`);
            sha = existingFile.sha;
        } catch (error) {
            // Le fichier n'existe pas encore, on le créera
        }
        
        await this.apiRequest(`/contents/${deckName}`, {
            method: 'PUT',
            body: JSON.stringify({
                message: `Mise à jour des flashcards ${new Date().toISOString()}`,
                content: content,
                sha: sha
            })
        });
    }
    
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim());
        const flashcards = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === 0) continue;
            
            flashcards.push({
                id: i, // ID simple basé sur la ligne
                question: values[0] || '',
                questionImage: values[1] || '',
                answer: values[2] || '',
                answerImage: values[3] || '',
                box: parseInt(values[4]) || 1,
                lastReview: values[5] ? new Date(values[5]).getTime() : Date.now()
            });
        }
        
        return flashcards;
    }
    
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values.map(v => v.replace(/^"(.*)"$/, '$1').trim());
    }
    
    convertToCSV(flashcards) {
        const headers = ['question', 'questionImage', 'answer', 'answerImage', 'box', 'lastReview'];
        const lines = [headers.join(',')];
        
        flashcards.forEach(card => {
            const row = [
                `"${card.question.replace(/"/g, '""')}"`,
                `"${card.questionImage.replace(/"/g, '""')}"`,
                `"${card.answer.replace(/"/g, '""')}"`,
                `"${card.answerImage.replace(/"/g, '""')}"`,
                card.box,
                new Date(card.lastReview).toISOString()
            ];
            lines.push(row.join(','));
        });
        
        return lines.join('\n');
    }
}