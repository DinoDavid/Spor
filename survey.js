document.addEventListener('DOMContentLoaded', () => {
    const questionContainer = document.getElementById('question-container');
    const nextButton = document.getElementById('next-button');
    const backButton = document.getElementById('back-button');
    const skipButton = document.getElementById('skip-button');
    const showYesButton = document.getElementById('show-yes-button');
    const exportButton = document.getElementById('export-button');
    const resultContainer = document.getElementById('result-container');
    const statisticsContainer = document.getElementById('statistics');
    const yesQuestionsContainer = document.getElementById('yes-questions');
    const resetButton = document.getElementById('reset-button');

    let currentQuestionIndex = 0;
    const answers = { JA: 0, NEI: 0 };
    const yesQuestions = [];
    const questionHistory = [];
    let questions = [];

    function calculateScore() {
        return answers.JA;
    }

    function getAssessmentResponse(score) {
        if (score === 0) {
            return "Ingen JA-svar. Du rapporterer ingen symptomer på personlighetsforstyrrelse på de evaluerte områdene.";
        } else if (score > 0 && score <= 15) {
            return "Noen JA-svar. Dette kan indikere lette symptomer eller problemer som kan være verdt å undersøke nærmere.";
        } else if (score > 15 && score <= 40) {
            return "Moderate JA-svar. Du viser tegn på moderate utfordringer på flere områder, som kan kreve ytterligere vurdering eller støtte.";
        } else if (score > 40) {
            return "Mange JA-svar. Dette kan indikere omfattende symptomer på personlighetsforstyrrelse som kan kreve grundig klinisk vurdering.";
        }
    }

    function showResults() {
        questionContainer.style.display = 'none';
        resultContainer.style.display = 'block';

        const score = calculateScore();

        statisticsContainer.innerHTML = `
            <p>JA: ${answers.JA}</p>
            <p>NEI: ${answers.NEI}</p>
            <p>Vurderingsrespons: ${getAssessmentResponse(score)}</p>
        `;

        if (yesQuestions.length > 0) {
            showYesButton.style.display = 'inline-block';
        }

        // Skjul navigasjonsknappene
        backButton.style.display = 'none';
        skipButton.style.display = 'none';
        nextButton.style.display = 'none';
    }

    function showYesQuestions() {
        const isVisible = yesQuestionsContainer.style.display === 'block';
        yesQuestionsContainer.style.display = isVisible ? 'none' : 'block';
        exportButton.style.display = isVisible ? 'none' : 'inline-block';

        if (!isVisible) {
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Spørsmål Nr.</th>
                        <th>ID</th>
                        <th>Spørsmålstekst</th>
                    </tr>
                </thead>
                <tbody>
                    ${yesQuestions.map((q, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${q.id}</td>
                            <td>${q.text}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            yesQuestionsContainer.innerHTML = '<h3>Spørsmål besvart med JA:</h3>';
            yesQuestionsContainer.appendChild(table);
        }
    }

    function exportTableAsPNG() {
        const originalDisplay = yesQuestionsContainer.style.display;
        
        // Temporarily set the container to be fully visible and large enough to show all content
        yesQuestionsContainer.style.display = 'block';
        yesQuestionsContainer.style.maxHeight = 'none';
        yesQuestionsContainer.style.overflow = 'visible';
        
        // Get the height of the container to ensure the canvas covers all content
        const totalHeight = yesQuestionsContainer.scrollHeight;
    
        // Create a canvas with the appropriate height
        html2canvas(yesQuestionsContainer, {
            height: totalHeight,
            windowHeight: totalHeight,
            useCORS: true,
            scrollY: -window.scrollY, // Adjust for scroll position
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'ja_sporsmal.png';
            link.href = canvas.toDataURL();
            link.click();
    
            // Reset to original state
            yesQuestionsContainer.style.display = originalDisplay;
            yesQuestionsContainer.style.maxHeight = '';
            yesQuestionsContainer.style.overflow = '';
        }).catch(err => {
            console.error('Error exporting table as PNG:', err);
            
        });
    }
    
    

    function resetSurvey() {
        currentQuestionIndex = 0;
        answers.JA = 0;
        answers.NEI = 0;
        yesQuestions.length = 0;
        questionHistory.length = 0;

        questionContainer.style.display = 'block';
        resultContainer.style.display = 'none';
        yesQuestionsContainer.style.display = 'none';
        showYesButton.style.display = 'none';
        exportButton.style.display = 'none';
        
        showQuestion(currentQuestionIndex);
    }

    function showQuestion(index) {
        if (index < questions.length) {
            const question = questions[index];
            questionContainer.innerHTML = `
                <div class="question-id">ID: ${question.id}</div>
                <div class="question-number">Spørsmål ${index + 1}</div>
                <h2>${question.text}</h2>
                <div class="answer-container">
                    <div class="answer-button" id="yes-button">JA</div>
                    <div class="answer-button" id="nei-button">NEI</div>
                </div>
            `;
            backButton.style.display = index > 0 ? 'inline-block' : 'none';
            skipButton.style.display = index < questions.length - 1 ? 'inline-block' : 'none';

            document.getElementById('yes-button').addEventListener('click', () => handleAnswer('JA'));
            document.getElementById('nei-button').addEventListener('click', () => handleAnswer('NEI'));
        } else {
            showResults();
        }
    }

    function handleAnswer(answer) {
        answers[answer]++;
        if (answer === 'JA') {
            const questionText = document.querySelector('h2').textContent;
            const questionId = document.querySelector('.question-id').textContent.replace('ID: ', '');
            yesQuestions.push({ text: questionText, id: questionId });
        }
        questionHistory.push(currentQuestionIndex);
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    }

    nextButton.addEventListener('click', () => { });

    backButton.addEventListener('click', () => {
        if (questionHistory.length > 0) {
            currentQuestionIndex = questionHistory.pop();
            showQuestion(currentQuestionIndex);
        }
    });

    skipButton.addEventListener('click', () => {
        showResults();
    });

    showYesButton.addEventListener('click', () => {
        showYesQuestions();
    });

    exportButton.addEventListener('click', () => {
        exportTableAsPNG();
    });

    resetButton.addEventListener('click', () => {
        resetSurvey();
    });

    fetch('questions.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Questions loaded:', data);
            questions = data.questions;
            showQuestion(currentQuestionIndex);
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            questionContainer.innerHTML = '<p>Feil ved lasting av spørsmål. Vennligst prøv igjen senere.</p>';
        });
});
