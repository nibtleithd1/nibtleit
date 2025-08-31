export class LeitnerSystem {
    init(app) {
        this.app = app;
        this.reviewIntervals = [1, 3, 9, 27, 81]; // Intervalles en heures
    }
    
    getInterval(boxNumber) {
        return this.reviewIntervals[boxNumber - 1] || 1;
    }
    
    processAnswer(isCorrect) {
        const card = this.app.currentCard;
        card.lastReview = Date.now();
        card.box = isCorrect ? Math.min(card.box + 1, 5) : 1;
        
        // Mettre à jour la carte dans la liste
        const index = this.app.flashcards.findIndex(c => c.id === card.id);
        if (index !== -1) {
            this.app.flashcards[index] = card;
        }
        
        // Mettre à jour l'interface
        this.app.ui.updateBoxes(this.app.flashcards);
        this.app.ui.hideCardViewer();
        
        // Sauvegarder (optionnel, pourrait être fait plus tard)
        this.app.saveFlashcards().catch(console.error);
    }
    
    getNextReviewTime(boxNumber) {
        const boxCards = this.app.flashcards.filter(card => card.box === boxNumber);
        if (boxCards.length === 0) return null;
        
        return boxCards.reduce((min, card) => {
            const cardNextReview = card.lastReview + this.getInterval(card.box) * 3600 * 1000;
            return Math.min(min, cardNextReview);
        }, Infinity);
    }
}