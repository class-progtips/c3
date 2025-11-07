import { evaluate } from 'mathjs';
import './style.css';

class Calculator {
    private display: HTMLElement;
    private currentInput: string = '0';
    private shouldResetDisplay: boolean = false;

    constructor() {
        this.display = document.getElementById('display')!;
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
            // Заменяем отображаемые символы на математические
            let expression = this.currentInput
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-');

            // Вычисляем выражение с помощью mathjs
            const result = evaluate(expression);
            
            // Форматируем результат
            this.currentInput = this.formatResult(result);
            this.shouldResetDisplay = true;
            this.updateDisplay();
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
}

// Инициализация калькулятора при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});

