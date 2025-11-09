import { evaluate } from 'mathjs';
import './style.css';

interface Operation {
    expression: string;
    result: string;
    timestamp: Date;
}

class Calculator {
    private display: HTMLElement;
    private currentInput: string = '0';
    private shouldResetDisplay: boolean = false;
    private themeToggle: HTMLElement;
    private currentTheme: string = 'dark';
    private operations: Operation[] = [];
    private historyContainer: HTMLElement;
    private historyList: HTMLElement;
    private historyToggle: HTMLElement;
    private clearHistoryBtn: HTMLElement;
    private isHistoryVisible: boolean = false;
    private readonly MAX_HISTORY_ITEMS = 50;

    constructor() {
        this.display = document.getElementById('display')!;
        this.themeToggle = document.getElementById('themeToggle')!;
        this.historyContainer = document.getElementById('historyContainer')!;
        this.historyList = document.getElementById('historyList')!;
        this.historyToggle = document.getElementById('historyToggle')!;
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn')!;
        this.loadTheme();
        this.loadHistory();
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        // Обработка кликов по кнопкам
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const value = target.getAttribute('data-value');
                const action = target.getAttribute('data-action');

                if (value !== null) {
                    this.handleInput(value);
                } else if (action !== null) {
                    this.handleAction(action);
                }
            });
        });

        // Обработка переключения темы
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Обработка переключения журнала
        this.historyToggle.addEventListener('click', () => {
            this.toggleHistory();
        });

        // Обработка очистки журнала
        this.clearHistoryBtn.addEventListener('click', () => {
            this.clearHistory();
        });

        // Обработка клавиатуры
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
    }

    private handleInput(value: string): void {
        if (this.shouldResetDisplay) {
            this.currentInput = '0';
            this.shouldResetDisplay = false;
        }

        if (value === '.' && this.currentInput.includes('.')) {
            return; // Не допускаем несколько точек
        }

        if (this.currentInput === '0' && value !== '.') {
            this.currentInput = value;
        } else {
            this.currentInput += value;
        }

        this.updateDisplay();
    }

    private handleAction(action: string): void {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'clearEntry':
                this.clearEntry();
                break;
            case 'equals':
                this.calculate();
                break;
        }
    }

    private handleKeyboardInput(e: KeyboardEvent): void {
        const key = e.key;

        // Цифры и точка
        if ((key >= '0' && key <= '9') || key === '.') {
            this.handleInput(key);
        }
        // Операторы
        else if (['+', '-', '*', '/', '%'].includes(key)) {
            this.handleInput(key);
        }
        // Enter или = для вычисления
        else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            this.calculate();
        }
        // Escape для очистки
        else if (key === 'Escape') {
            this.clear();
        }
        // Backspace для удаления последнего символа
        else if (key === 'Backspace') {
            e.preventDefault();
            this.clearEntry();
        }
    }

    private calculate(): void {
        try {
            // Сохраняем исходное выражение для истории
            const originalExpression = this.currentInput;
            
            // Заменяем отображаемые символы на математические
            let expression = this.currentInput
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-');

            // Вычисляем выражение с помощью mathjs
            const result = evaluate(expression);
            
            // Форматируем результат
            const formattedResult = this.formatResult(result);
            this.currentInput = formattedResult;
            this.shouldResetDisplay = true;
            this.updateDisplay();
            
            // Добавляем операцию в историю
            this.addToHistory(originalExpression, formattedResult);
        } catch (error) {
            this.currentInput = 'Ошибка';
            this.shouldResetDisplay = true;
            this.updateDisplay();
            
            // Восстанавливаем через 1 секунду
            setTimeout(() => {
                this.clear();
            }, 1000);
        }
    }

    private formatResult(result: number): string {
        // Ограничиваем количество знаков после запятой
        if (Number.isInteger(result)) {
            return result.toString();
        } else {
            // Округляем до 10 знаков после запятой
            return parseFloat(result.toFixed(10)).toString();
        }
    }

    private clear(): void {
        this.currentInput = '0';
        this.shouldResetDisplay = false;
        this.updateDisplay();
    }

    private clearEntry(): void {
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }

    private updateDisplay(): void {
        // Заменяем математические операторы на отображаемые символы
        let displayText = this.currentInput
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/-/g, '−');

        this.display.textContent = displayText;
    }

    private toggleTheme(): void {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
        localStorage.setItem('calculator-theme', this.currentTheme);
    }

    private loadTheme(): void {
        const savedTheme = localStorage.getItem('calculator-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            this.currentTheme = savedTheme;
        } else {
            // Проверяем системные настройки
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }

    private updateThemeIcon(): void {
        const themeIcon = this.themeToggle.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    // Методы работы с историей операций
    private addToHistory(expression: string, result: string): void {
        const operation: Operation = {
            expression: expression,
            result: result,
            timestamp: new Date()
        };

        this.operations.unshift(operation); // Добавляем в начало массива
        
        // Ограничиваем количество записей
        if (this.operations.length > this.MAX_HISTORY_ITEMS) {
            this.operations = this.operations.slice(0, this.MAX_HISTORY_ITEMS);
        }

        this.saveHistory();
        this.renderHistory();
    }

    private renderHistory(): void {
        this.historyList.innerHTML = '';

        if (this.operations.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'history-empty';
            emptyMessage.textContent = 'История операций пуста';
            this.historyList.appendChild(emptyMessage);
            return;
        }

        this.operations.forEach((operation, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.setAttribute('data-index', index.toString());

            const expressionDiv = document.createElement('div');
            expressionDiv.className = 'history-expression';
            expressionDiv.textContent = this.formatDisplayText(operation.expression);
            expressionDiv.addEventListener('click', () => {
                this.insertExpression(operation.expression);
            });

            const resultDiv = document.createElement('div');
            resultDiv.className = 'history-result';
            resultDiv.textContent = operation.result;
            resultDiv.addEventListener('click', () => {
                this.insertExpression(operation.result);
            });

            historyItem.appendChild(expressionDiv);
            historyItem.appendChild(resultDiv);
            this.historyList.appendChild(historyItem);
        });

        // Автопрокрутка к началу (последняя операция)
        this.historyList.scrollTop = 0;
    }

    private formatDisplayText(text: string): string {
        // Заменяем математические операторы на отображаемые символы
        return text
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/-/g, '−');
    }

    private insertExpression(value: string): void {
        this.currentInput = value;
        this.shouldResetDisplay = false;
        this.updateDisplay();
    }

    private saveHistory(): void {
        try {
            const historyData = this.operations.map(op => ({
                expression: op.expression,
                result: op.result,
                timestamp: op.timestamp.toISOString()
            }));
            localStorage.setItem('calculator-history', JSON.stringify(historyData));
        } catch (error) {
            console.error('Ошибка сохранения истории:', error);
        }
    }

    private loadHistory(): void {
        try {
            const savedHistory = localStorage.getItem('calculator-history');
            if (savedHistory) {
                const historyData = JSON.parse(savedHistory);
                this.operations = historyData.map((item: any) => ({
                    expression: item.expression,
                    result: item.result,
                    timestamp: new Date(item.timestamp)
                }));
                this.renderHistory();
            }
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
            this.operations = [];
        }
    }

    private clearHistory(): void {
        this.operations = [];
        this.saveHistory();
        this.renderHistory();
    }

    private toggleHistory(): void {
        this.isHistoryVisible = !this.isHistoryVisible;
        if (this.isHistoryVisible) {
            this.historyContainer.classList.add('visible');
            this.historyToggle.classList.add('active');
        } else {
            this.historyContainer.classList.remove('visible');
            this.historyToggle.classList.remove('active');
        }
    }
}

// Инициализация калькулятора при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});

