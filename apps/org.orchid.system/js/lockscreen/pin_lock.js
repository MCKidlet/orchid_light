!(function (exports) {
  'use strict';

  const LockscreenPIN = {
    lockscreen: document.getElementById('lockscreen'),
    element: document.getElementById('lockscreen-pin'),
    pinInput: document.getElementById('lockscreen-pin-input'),
    keypadButtons: document.querySelectorAll('#lockscreen-pin-keypad button'),
    backspaceButton: document.getElementById('lockscreen-pin-backspace'),
    emergencyButton: document.getElementById('lockscreen-pin-emergency'),

    password: null,

    init: function () {
      OrchidJS.Settings.getValue('lockscreen.pin_number').then((value) => {
        this.password = value;
      });
      OrchidJS.Settings.addObserver('lockscreen.pin_number', (value) => {
        this.password = value;
      });

      for (let index = 0, length = this.keypadButtons.length; index < length; index++) {
        const button = this.keypadButtons[index];

        DirectionalScale.init(button);
        button.addEventListener('click', this.handleButtonClick.bind(this));
      }
    },

    handleButtonClick: function (event) {
      event.preventDefault();
      const buttonValue = event.target.dataset.value;

      if (buttonValue === '0' || (buttonValue >= '1' && buttonValue <= '9')) {
        // Append the clicked button value to the PIN input
        this.pinInput.value += buttonValue;
        if (this.pinInput.value === this.password) {
          LockscreenMotion.hide();
          LockscreenMotion.isDragging = false;
          this.pinInput.value = '';
        }
      } else if (buttonValue === 'backspace') {
        // Remove the last character from the PIN input
        if (this.pinInput.value === '') {
          this.lockscreen.classList.remove('pin-lock-visible');
        } else {
          this.pinInput.value = this.pinInput.value.slice(0, -1);
          if (this.pinInput.value === '') {
            this.backspaceButton.children[0].dataset.icon = 'chevron-back';
          } else {
            this.backspaceButton.children[0].dataset.icon = 'backspace';
          }
        }
      } else if (buttonValue === 'emergency') {
        // TODO: Handle SOS button click
        alert('Emergency SOS button clicked');
      }
    }
  };

  LockscreenPIN.init();
})(window);
