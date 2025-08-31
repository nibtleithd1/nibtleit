import { GitHubManager } from './github.js';
import { UIManager } from './ui.js';
import { LeitnerSystem } from './leitner.js';
import { CRUDManager } from './crud.js';

class LeitnerApp {
    constructor() {
        this.github = new GitHubManager();
        this.ui = new UIManager();
        this.leitner = new LeitnerSystem();
        this.crud = new CRUDManager();
        
        this.flashcards = [];
        this.currentDeck = '';
        
        this.init();
    }
    
    init() {
        // Charger la configuration
        this.loadConfig();
        
        // Initialiser les gestionnaires
        this.ui.init(this);
        this.crud.init(this);
        this.leitner.init(this);
        
        // Événements
        this.bindEvents();
        
        // Charger les decks disponibles
        this.loadDecks();
    }
    
    loadConfig() {
        const config = JSON.parse(localStorage.getItem('leitnerConfig') || '{}');
        this.github.setConfig(config);
    }
    
    saveConfig(config) {
        localStorage.setItem('leitnerConfig', JSON.stringify(config));
        this.github.setConfig(config);
    }
    
    async loadDecks() {
        try {
            const decks = await this.github.listDecks();
            this.ui.populateDeckSelector(decks);
        } catch (error) {
            console.error('Erreur de chargement des decks:', error);
        }
    }
    
    async loadFlashcards(deck) {
        try {
            this.flashcards = await this.github.loadDeck(deck);
            this.currentDeck = deck;
            this.leitner.updateBoxes(this.flashcards);
            this.ui.hideCardEditor();
            this.ui.hideCardViewer();
        } catch (error) {
            console.error('Erreur de chargement des flashcards:', error);
            alert('Erreur de chargement: ' + error.message);
        }
    }
    
    async saveFlashcards() {
        try {
            await this.github.saveDeck(this.currentDeck, this.flashcards);
            alert('Flashcards sauvegardées avec succès!');
        } catch (error) {
            console.error('Erreur de sauvegarde:', error);
            alert('Erreur de sauvegarde: ' + error.message);
        }
    }
    
    bindEvents() {
        // Configuration GitHub
        document.getElementById('save-config').addEventListener('click', () => {
            const config = {
                owner: document.getElementById('repo-owner').value,
                repo: document.getElementById('repo-name').value,
                token: document.getElementById('github-token').value,
                csvPath: document.getElementById('csv-path').value
            };
            this.saveConfig(config);
            alert('Configuration sauvegardée!');
        });
        
        // Sélection de deck
        document.getElementById('deck-selector').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadFlashcards(e.target.value);
            }
        });
        
        // Sauvegarde manuelle
        document.getElementById('save-cards-btn').addEventListener('click', () => {
            this.saveFlashcards();
        });
        
        // Chargement manuel
        document.getElementById('load-cards-btn').addEventListener('click', () => {
            if (this.currentDeck) {
                this.loadFlashcards(this.currentDeck);
            } else {
                alert('Veuillez sélectionner un deck first');
            }
        });
    }
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', () => {
    window.leitnerApp = new LeitnerApp();
});