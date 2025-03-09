// Calculator class
class Calculator {
    constructor() {
      this.stack = [0, 0, 0, 0, 0, 0, 0, 0]; // Initialize stack with 8 zeros
    }
  
    // Push the input value to the stack
    enter() {
      const inputValue = document.getElementById('input-box').value;
      const number = parseFloat(inputValue);
      if (!isNaN(number)) {
        this.stack.unshift(number); // Add to the top of the stack
        if (this.stack.length > 8) this.stack.pop(); // Keep stack size to 8
        this.clearInput();
        this.updateDisplay();
      } else {
        alert('Please enter a valid number.');
      }
    }
  
    // Add the top two numbers in the stack
    add() {
      if (this.stack.length >= 2) {
        const number1 = this.stack.shift();
        const number2 = this.stack.shift();
        const result = number2 + number1;
        this.stack.unshift(result);
        this.updateDisplay();
      } else {
        alert('Not enough operands in the stack.');
      }
    }
  
    // Subtract the top two numbers in the stack
    subtract() {
      if (this.stack.length >= 2) {
        const number1 = this.stack.shift();
        const number2 = this.stack.shift();
        const result = number2 - number1;
        this.stack.unshift(result);
        this.updateDisplay();
      } else {
        alert('Not enough operands in the stack.');
      }
    }
  
    // Multiply the top two numbers in the stack
    multiply() {
      if (this.stack.length >= 2) {
        const number1 = this.stack.shift();
        const number2 = this.stack.shift();
        const result = number2 * number1;
        this.stack.unshift(result);
        this.updateDisplay();
      } else {
        alert('Not enough operands in the stack.');
      }
    }
  
    // Divide the top two numbers in the stack
    divide() {
      if (this.stack.length >= 2) {
        const number1 = this.stack.shift();
        const number2 = this.stack.shift();
        if (number1 === 0) {
          alert('Division by zero is not allowed.');
          this.stack.unshift(number2);
          this.stack.unshift(number1);
        } else {
          const result = number2 / number1;
          this.stack.unshift(result);
          this.updateDisplay();
        }
      } else {
        alert('Not enough operands in the stack.');
      }
    }
  
    // Clear the stack and reset input
    clear() {
      this.stack = [0, 0, 0, 0, 0, 0, 0, 0];
      this.clearInput();
      this.updateDisplay();
    }
  
    // Clear the input field
    clearInput() {
      document.getElementById('input-box').value = '';
    }
  
    // Update the stack display
    updateDisplay() {
      for (let i = 1; i <= 8; i++) {
        document.getElementById('stack-' + i).value = this.stack[i - 1] || '0';
      }
    }
  }
  
  // Create a new calculator instance
  const calculator = new Calculator();
  
  // Event listeners for buttons
  document.getElementById('enter').addEventListener('click', () => {
    calculator.enter();
  });
  
  document.getElementById('plus').addEventListener('click', () => {
    calculator.add();
  });
  
  document.getElementById('minus').addEventListener('click', () => {
    calculator.subtract();
  });
  
  document.getElementById('multiply').addEventListener('click', () => {
    calculator.multiply();
  });
  
  document.getElementById('divide').addEventListener('click', () => {
    calculator.divide();
  });
  
  document.getElementById('clear').addEventListener('click', () => {
    calculator.clear();
  });