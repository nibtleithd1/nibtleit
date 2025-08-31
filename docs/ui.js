export class UIManager {
    init(app) {
        this.app = app;
        this.bindEvents();
    }
    
    populateDeckSelector(decks) {
        const selector = document.getElementById('deck-selector');
        selector.innerHTML = '<option value="">Sélectionnez un deck</option>';
        
        decks.forEach(deck => {
            const option = document.createElement('option');
            option.value = deck;
            option.textContent = deck.replace('.csv', '');
            selector.appendChild(option);
        });
    }
    
    updateBoxes(flashcards) {
        const boxesContainer = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-5.gap-4.mb-6');
        boxesContainer.innerHTML = '';
        
        for (let i = 1; i <= 5; i++) {
            const boxCards = flashcards.filter(card => card.box === i);
            const boxElement = this.createBoxElement(i, boxCards.length);
            boxesContainer.appendChild(boxElement);
        }
    }
    
    createBoxElement(boxNumber, cardCount) {
        const box = document.createElement('div');
        box.className = `box box-border-${boxNumber} bg-white rounded-lg shadow-md p-4 text-center cursor-pointer hover:-translate-y-1 transition-transform`;
        box.dataset.boxNumber = boxNumber;
        
        const colorClass = `text-box${boxNumber}`;
        
        box.innerHTML = `
            <h2 class="text-xl font-bold mb-2 ${colorClass}">Boîte ${boxNumber}</h2>
            <div class="box-counter text-sm text-gray-600">${cardCount} carte(s)</div>
            <div class="box-next-review text-xs text-gray-400 mt-1"></div>
        `;
        
        box.addEventListener('click', () => {
            this.showCardsList(boxNumber);
        });
        
        return box;
    }
    
    showCardsList(boxNumber) {
        const boxCards = this.app.flashcards.filter(card => card.box === boxNumber);
        const cardsList = document.getElementById('cards-list');
        cardsList.innerHTML = '';
        
        if (boxCards.length === 0) {
            cardsList.innerHTML = '<p class="text-gray-500">Aucune carte</p>';
        } else {
            boxCards.forEach(card => {
                const cardElement = this.createCardElement(card);
                cardsList.appendChild(cardElement);
            });
        }
        
        document.getElementById('current-box-number').textContent = boxNumber;
        document.getElementById('cards-list-container').classList.remove('hidden');
    }
    
    createCardElement(card) {
        const element = document.createElement('div');
        element.className = 'card-item flex items-start gap-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer';
        element.dataset.cardId = card.id;
        
        let thumbnailHtml = '';
        if (card.questionImage) {
            thumbnailHtml = `
                <div class="thumbnail-container flex-shrink-0">
                    <img src="${card.questionImage}" 
                         alt="Miniature" 
                         class="thumbnail-image w-12 h-12 object-cover rounded border border-gray-200">
                </div>
            `;
        }
        
        const displayText = card.question || (card.questionImage ? 'Carte avec image' : 'Carte sans texte');
        element.innerHTML = `
            ${thumbnailHtml}
            <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 truncate">${displayText}</div>
                <div class="card-next-review text-xs text-gray-500 mt-1">
                    Rev.: ${this.formatTime(card.lastReview + this.app.leitner.getInterval(card.box) * 3600 * 1000)}
                </div>
            </div>
        `;
        
        element.addEventListener('click', () => {
            this.showCardViewer(card);
        });
        
        return element;
    }
    
    showCardViewer(card) {
        this.app.currentCard = card;
        
        document.getElementById('question-content').innerHTML = '';
        document.getElementById('answer-content').innerHTML = '';
        
        // Afficher la question
        if (card.question) {
            const textElement = document.createElement('div');
            textElement.textContent = card.question;
            document.getElementById('question-content').appendChild(textElement);
        }
        
        if (card.questionImage) {
            const imgElement = document.createElement('img');
            imgElement.src = card.questionImage;
            imgElement.alt = 'Image question';
            imgElement.className = 'mx-auto my-3 max-w-full max-h-[300px] w-auto h-auto object-scale-down';
            document.getElementById('question-content').appendChild(imgElement);
        }
        
        // Préparer la réponse
        if (card.answer) {
            const textElement = document.createElement('div');
            textElement.textContent = card.answer;
            document.getElementById('answer-content').appendChild(textElement);
        }
        
        if (card.answerImage) {
            const imgElement = document.createElement('img');
            imgElement.src = card.answerImage;
            imgElement.alt = 'Image réponse';
            imgElement.className = 'mx-auto my-3 max-w-full max-h-[300px] w-auto h-auto object-scale-down';
            document.getElementById('answer-content').appendChild(imgElement);
        }
        
        document.getElementById('last-reviewed').textContent = 
            `Dernière révision: ${new Date(card.lastReview).toLocaleString('fr-FR')}`;
        
        document.getElementById('answer-section').classList.add('hidden');
        document.getElementById('show-answer-btn').style.display = 'block';
        document.getElementById('flashcard-container').classList.remove('hidden');
    }
    
    hideCardViewer() {
        document.getElementById('flashcard-container').classList.add('hidden');
    }
    
    showCardEditor(card = null) {
        const form = document.getElementById('card-form');
        const title = document.getElementById('editor-title');
        
        if (card) {
            // Mode édition
            title.textContent = 'Modifier la carte';
            document.getElementById('card-id').value = card.id;
            document.getElementById('card-question').value = card.question;
            document.getElementById('card-question-image').value = card.questionImage;
            document.getElementById('card-answer').value = card.answer;
            document.getElementById('card-answer-image').value = card.answerImage;
        } else {
            // Mode création
            title.textContent = 'Nouvelle carte';
            form.reset();
            document.getElementById('card-id').value = '';
        }
        
        document.getElementById('card-editor').classList.remove('hidden');
    }
    
    hideCardEditor() {
        document.getElementById('card-editor').classList.add('hidden');
    }
    
    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const now = Date.now();
        const date = new Date(timestamp);
        
        if (timestamp <= now) {
            return 'Maintenant';
        }
        
        const today = new Date();
        if (date.getDate() === today.getDate() && 
            date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear()) {
            return date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
        }
        
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute:'2-digit'
        });
    }
    
    bindEvents() {
        // Bouton nouvelle carte
        document.getElementById('add-card-btn').addEventListener('click', () => {
            this.showCardEditor();
        });
        
        // Annuler l'édition
        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.hideCardEditor();
        });
        
        // Soumission du formulaire
        document.getElementById('card-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.app.crud.saveCard({
                id: document.getElementById('card-id').value,
                question: document.getElementById('card-question').value,
                questionImage: document.getElementById('card-question-image').value,
                answer: document.getElementById('card-answer').value,
                answerImage: document.getElementById('card-answer-image').value,
                box: 1,
                lastReview: Date.now()
            });
        });
        
        // Boutons dans le visualisateur de carte
        document.getElementById('edit-card-btn').addEventListener('click', () => {
            this.hideCardViewer();
            this.showCardEditor(this.app.currentCard);
        });
        
        document.getElementById('delete-card-btn').addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette carte?')) {
                this.app.crud.deleteCard(this.app.currentCard.id);
                this.hideCardViewer();
            }
        });
        
        // Bouton voir la réponse
        document.getElementById('show-answer-btn').addEventListener('click', () => {
            document.getElementById('answer-section').classList.remove('hidden');
            document.getElementById('show-answer-btn').style.display = 'none';
        });
        
        // Gestion des réponses
        document.getElementById('wrong-answer').addEventListener('click', () => {
            this.app.leitner.processAnswer(false);
        });
        
        document.getElementById('right-answer').addEventListener('click', () => {
            this.app.leitner.processAnswer(true);
        });
    }
}