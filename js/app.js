// app.js - основной JavaScript для голосового чат-интерфейса

// Состояние приложения
const state = {
    isRecording: false,
    recognition: null,
    currentModel: 'gpt-4',
    messages: []
};

// Инициализация приложения
function initApp() {
    console.log('Инициализация голосового чат-интерфейса...');
    
    // Проверка поддержки Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Ваш браузер не поддерживает распознавание речи. Пожалуйста, используйте Chrome или Edge.');
        return;
    }
    
    // Инициализация распознавания речи
    initSpeechRecognition();
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Загрузка истории сообщений
    loadSampleMessages();
    
    console.log('Приложение готово к работе.');
}

// Инициализация распознавания речи
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recognition = new SpeechRecognition();
    
    state.recognition.continuous = false;
    state.recognition.interimResults = true;
    state.recognition.lang = 'ru-RU';
    
    state.recognition.onstart = () => {
        console.log('Распознавание речи началось...');
        state.isRecording = true;
        updateRecordingUI(true);
    };
    
    state.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Обновление текстового поля промежуточным результатом
        if (interimTranscript) {
            document.getElementById('text-input').value = interimTranscript;
        }
        
        // Если есть финальный результат, добавляем сообщение
        if (finalTranscript) {
            addMessage(finalTranscript, 'user');
            document.getElementById('text-input').value = '';
            
            // Имитация ответа AI
            simulateAIResponse(finalTranscript);
        }
    };
    
    state.recognition.onerror = (event) => {
        console.error('Ошибка распознавания речи:', event.error);
        updateRecordingUI(false);
        
        if (event.error === 'not-allowed') {
            alert('Доступ к микрофону запрещен. Пожалуйста, разрешите использование микрофона.');
        }
    };
    
    state.recognition.onend = () => {
        console.log('Распознавание речи завершено.');
        state.isRecording = false;
        updateRecordingUI(false);
    };
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка микрофона
    const microphoneBtn = document.getElementById('microphone-btn');
    microphoneBtn.addEventListener('click', toggleRecording);
    
    // Кнопка отправки текста
    const sendBtn = document.getElementById('send-btn');
    sendBtn.addEventListener('click', sendTextMessage);
    
    // Текстовое поле (отправка по Enter)
    const textInput = document.getElementById('text-input');
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendTextMessage();
        }
    });
    
    // Кнопка очистки чата
    const clearBtn = document.getElementById('clear-btn');
    clearBtn.addEventListener('click', clearChat);
    
    // Переключатель голосового режима
    const voiceToggle = document.getElementById('voice-toggle');
    voiceToggle.addEventListener('change', (e) => {
        const isVoiceMode = e.target.checked;
        microphoneBtn.disabled = !isVoiceMode;
        microphoneBtn.title = isVoiceMode ? 'Начать запись голоса' : 'Голосовой режим отключен';
        
        if (!isVoiceMode && state.isRecording) {
            stopRecording();
        }
    });
    
    // Выбор модели AI
    const modelSelect = document.getElementById('model-select');
    modelSelect.addEventListener('change', (e) => {
        state.currentModel = e.target.value;
        updateConnectionStatus(`Подключено к ${getModelName(state.currentModel)}`);
    });
    
    // Кнопка настроек
    document.getElementById('settings-btn').addEventListener('click', () => {
        alert('Настройки пока не реализованы. В будущих версиях здесь будут настройки языка, громкости и т.д.');
    });
    
    // Кнопка истории
    document.getElementById('history-btn').addEventListener('click', () => {
        alert('История диалогов пока не реализована. В будущих версиях здесь будет сохраненная история.');
    });
}

// Переключение записи
function toggleRecording() {
    if (state.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// Начать запись
function startRecording() {
    if (!state.recognition) {
        initSpeechRecognition();
    }
    
    try {
        state.recognition.start();
    } catch (error) {
        console.error('Ошибка при запуске распознавания:', error);
        alert('Не удалось запустить распознавание речи. Проверьте доступ к микрофону.');
    }
}

// Остановить запись
function stopRecording() {
    if (state.recognition && state.isRecording) {
        state.recognition.stop();
    }
}

// Обновление UI записи
function updateRecordingUI(isRecording) {
    const microphoneBtn = document.getElementById('microphone-btn');
    const recordingIndicator = document.getElementById('recording-indicator');
    
    if (isRecording) {
        microphoneBtn.classList.add('recording');
        microphoneBtn.innerHTML = '<i class="fas fa-stop"></i> <span>Стоп</span>';
        recordingIndicator.classList.add('active');
    } else {
        microphoneBtn.classList.remove('recording');
        microphoneBtn.innerHTML = '<i class="fas fa-microphone"></i> <span>Говорите</span>';
        recordingIndicator.classList.remove('active');
    }
}

// Отправка текстового сообщения
function sendTextMessage() {
    const textInput = document.getElementById('text-input');
    const message = textInput.value.trim();
    
    if (!message) return;
    
    addMessage(message, 'user');
    textInput.value = '';
    
    // Имитация ответа AI
    simulateAIResponse(message);
}

// Добавление сообщения в чат
function addMessage(text, sender) {
    const message = {
        id: Date.now(),
        text,
        sender,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    state.messages.push(message);
    renderMessage(message);
    
    // Прокрутка вниз
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Отрисовка сообщения
function renderMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageElement = document.createElement('article');
    messageElement.className = `message ${message.sender}-message`;
    
    const senderName = message.sender === 'ai' ? 'AI Ассистент' : 'Вы';
    const iconClass = message.sender === 'ai' ? 'fa-robot' : 'fa-user';
    
    messageElement.innerHTML = `
        <header>
            <div class="message-header">
                <i class="fas ${iconClass}"></i>
                <strong>${senderName}</strong>
                <small>${message.timestamp}</small>
            </div>
        </header>
        <p>${escapeHtml(message.text)}</p>
    `;
    
    chatMessages.appendChild(messageElement);
}

// Имитация ответа AI
function simulateAIResponse(userMessage) {
    // Задержка для имитации "думания"
    setTimeout(() => {
        const responses = [
            `Я понял: "${userMessage}". Это интересно!`,
            `Спасибо за сообщение: "${userMessage}". Как я могу помочь?`,
            `Вы сказали: "${userMessage}". Продолжайте, я слушаю.`,
            `Отличный вопрос! "${userMessage}". Давайте обсудим это подробнее.`,
            `Записал: "${userMessage}". Что еще вас интересует?`
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage(randomResponse, 'ai');
    }, 1000 + Math.random() * 2000); // Случайная задержка 1-3 секунды
}

// Очистка чата
function clearChat() {
    if (!confirm('Вы уверены, что хотите очистить весь чат?')) return;
    
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    state.messages = [];
    
    // Добавляем приветственное сообщение
    addMessage('Чат очищен. Нажмите на микрофон и говорите!', 'ai');
}

// Загрузка примерных сообщений
function loadSampleMessages() {
    // Уже есть примерные сообщения в HTML, так что просто добавляем их в состояние
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => {
        const sender = msg.classList.contains('ai-message') ? 'ai' : 'user';
        const text = msg.querySelector('p')?.textContent || '';
        const timestamp = msg.querySelector('small')?.textContent || new Date().toLocaleTimeString();
        
        if (text) {
            state.messages.push({
                id: Date.now() + Math.random(),
                text,
                sender,
                timestamp
            });
        }
    });
}

// Обновление статуса подключения
function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.innerHTML = `<i class="fas fa-circle"></i> ${status}`;
    }
}

// Получение имени модели по значению
function getModelName(modelValue) {
    const modelNames = {
        'gpt-4': 'GPT-4',
        'claude': 'Claude',
        'gemini': 'Gemini',
        'local': 'Локальная модель'
    };
    
    return modelNames[modelValue] || modelValue;
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Экспорт для тестирования (если нужно)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initApp,
        addMessage,
        clearChat,
        toggleRecording
    };
}