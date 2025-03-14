!(function (exports) {
  'use strict';

  const CardsView = {
    screen: document.getElementById('screen'),
    wallpapersContainer: document.getElementById('wallpapers'),
    windowContainer: document.getElementById('windows'),

    element: document.getElementById('cards-view'),
    cardsContainer: document.getElementById('cards-view-list'),
    toggleButton: document.getElementById('software-recents-button'),
    cardsViewButton: document.getElementById('software-cards-view-button'),

    emptyMessage: document.getElementById('cards-view-empty'),

    APP_ICON_SIZE: 50 * window.devicePixelRatio,

    isVisible: false,
    isMovingPointer: false,
    targetPreviewElement: null,
    scrollMovement: 0,

    init: function () {
      this.element.addEventListener('click', this.hide.bind(this));
      this.toggleButton.addEventListener('click', this.handleToggleButton.bind(this));
      this.cardsViewButton.addEventListener('click', this.handleToggleButton.bind(this));

      if ('StickyScroll' in window) {
        StickyScroll.init(this.element, '.card-area');
      }
    },

    show: function () {
      this.isVisible = true;

      this.element.classList.add('visible');
      this.screen.classList.add('cards-view-visible');

      const focusedWindow = AppWindow.getFocusedWindow().element;
      focusedWindow.classList.add('to-cards-view');
      focusedWindow.addEventListener('animationend', () => {
        focusedWindow.classList.remove('to-cards-view');
      });

      if ('MusicController' in window) {
        // MusicController.applyMuffleEffect();
      }
      CardsView.element.style.setProperty('--aspect-ratio', `${window.innerWidth} / ${window.innerHeight}`);

      const runningWebapps = Webapps.runningWebapps.filter(obj => obj.instanceID !== 'homescreen');
      this.cardsContainer.innerHTML = '';
      const fragment = document.createDocumentFragment();

      if (runningWebapps.length === 0) {
        this.cardsContainer.classList.add('hidden');
        this.emptyMessage.classList.remove('hidden');
      } else {
        this.cardsContainer.classList.remove('hidden');
        this.emptyMessage.classList.add('hidden');
      }

      for (let index = 0, length = runningWebapps.length; index < length; index++) {
        const runningWebapp = runningWebapps[index];
        this.createCard(runningWebapp, index, fragment);
      }
      this.cardsContainer.appendChild(fragment);
    },

    hide: function () {
      if (!this.isVisible && this.isMovingPointer) {
        return;
      }
      this.element.classList.remove('visible');
      this.screen.classList.remove('cards-view-visible');

      const focusedWindow = AppWindow.getFocusedWindow().element;
      if (this.isVisible) {
        focusedWindow.classList.add('from-cards-view');
        focusedWindow.addEventListener('animationend', () => {
          focusedWindow.classList.remove('from-cards-view');
        });
      }
      this.isVisible = false;

      if ('MusicController' in window) {
        // MusicController.disableMuffleEffect();
      }

      this.element.style.setProperty('--offset-y', null);
      this.element.style.setProperty('--scale', null);

      this.wallpapersContainer.classList.remove('homescreen-to-cards-view');
      this.wallpapersContainer.style.setProperty('--motion-progress', null);
    },

    createCard: async function (runningWebapp, index, parentElement = this.cardsContainer) {
      const rtl = document.dir === 'rtl';
      const x = (window.innerWidth * 0.65 + 15) * index;

      const cardArea = document.createElement('div');
      cardArea.classList.add('card-area');
      cardArea.style.setProperty('--offset-x', `${rtl ? -x : x}px`);
      parentElement.appendChild(cardArea);

      const focusedWindow = AppWindow.getFocusedWindow();
      if (focusedWindow === runningWebapp.appWindow) {
        cardArea.scrollIntoView();
      }

      const card = document.createElement('div');
      card.classList.add('card');
      card.dataset.manifestUrl = runningWebapp.manifestUrl;
      card.addEventListener('pointerup', (event) => {
        if (this.isMovingPointer) {
          return;
        }
        event.stopPropagation();
        Webapps.getWindowById(runningWebapp.appWindow.instanceID).focus();
        this.hide();
      });
      card.addEventListener('pointerdown', (event) => this.onPointerDown(event, card, runningWebapp.appWindow.instanceID));
      cardArea.appendChild(card);

      let manifest;
      await fetch(runningWebapp.manifestUrl)
        .then((response) => response.json())
        .then(function (data) {
          manifest = data;
          // You can perform further operations with the 'manifest' variable here
        })
        .catch(function (error) {
          console.error('Error fetching manifest:', error);
        });

      const preview = document.createElement('img');
      preview.classList.add('preview');
      card.appendChild(preview);

      if (runningWebapp.manifestUrl === focusedWindow.manifestUrl) {
        this.targetPreviewElement = preview;
      }

      const webview = runningWebapp.appWindow.element.querySelector('.browser-container .browser-view.active > .browser');
      try {
        DisplayManager.screenshot(webview.getWebContentsId()).then((data) => {
          preview.src = data;
        });
      } catch (error) {
        webview.addEventListener('dom-ready', () => {
          DisplayManager.screenshot(webview.getWebContentsId()).then((data) => {
            preview.src = data;
          });
        })
      }

      const titlebar = document.createElement('div');
      titlebar.classList.add('titlebar');
      card.appendChild(titlebar);

      const icon = document.createElement('img');
      icon.crossOrigin = 'anonymous';
      icon.onerror = () => {
        icon.src = '/images/default.svg';
      };
      titlebar.appendChild(icon);

      const entries = Object.entries(manifest.icons);
      for (let index = 0, length = entries.length; index < length; index++) {
        const entry = entries[index];

        if (entry[0] >= this.APP_ICON_SIZE) {
          continue;
        }
        const url = new URL(runningWebapp.manifestUrl);
        icon.src = url.origin + entry[1];
      }

      const titles = document.createElement('div');
      titles.classList.add('titles');
      titlebar.appendChild(titles);

      const name = document.createElement('div');
      name.classList.add('name');
      name.textContent = manifest.name;
      titles.appendChild(name);
    },

    handleToggleButton: function (event) {
      if (this.isVisible) {
        this.hide();
      } else {
        this.show();
      }
    },

    // Attach event listeners for mouse/touch events to handle dragging
    onPointerDown: function (event, card, windowId) {
      event.preventDefault();
      event.stopPropagation();
      this.isMovingPointer = false;
      this.startY = event.clientY;

      // Get initial window position
      const initialWindowY = card.offsetTop;

      // Calculate the offset between the initial position and the window position
      const offsetY = this.startY - initialWindowY;

      // Function to handle dragging
      const dragWindow = (event) => {
        event.preventDefault();
        this.isMovingPointer = true;
        const y = event.clientY;

        // Calculate the new position of the window
        const newWindowY = y - offsetY;

        // Set the new position of the window
        const progress = newWindowY / window.innerHeight;
        card.style.setProperty('--card-opacity', 1 - (progress * -1));
        card.style.setProperty('--card-motion-progress', `${100 * progress}%`);

        card.classList.add('dragging');
      }

      // Function to stop dragging
      const stopDrag = (event) => {
        event.preventDefault();
        const currentYPosition = event.clientY;
        const distanceY = currentYPosition - this.startY;
        this.isMovingPointer = false;

        card.classList.add('transitioning');
        card.addEventListener('transitionend', () => card.classList.remove('transitioning'));
        card.classList.remove('dragging');

        if (distanceY <= -100) {
          if (windowId === 'homescreen') {
            card.style.setProperty('--card-opacity', 1);
            card.style.setProperty('--card-motion-progress', 0);
          } else {
            Webapps.getWindowById(windowId).close(true);
            card.style.setProperty('--card-opacity', 0);
            card.style.setProperty('--card-motion-progress', '-100%');
            card.addEventListener('transitionend', () => {
              card.parentElement.remove();

              if (this.cardsContainer.childNodes.length < 1) {
                this.hide();
                Webapps.getWindowById('homescreen').focus();
                Snackbar.notify(L10n.get('cardsView-cleared'));
              }
            });
          }
        } else {
          card.style.setProperty('--card-opacity', 1);
          card.style.setProperty('--card-motion-progress', 0);
        }

        document.removeEventListener('mousemove', dragWindow);
        document.removeEventListener('touchmove', dragWindow);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
      }

      // Attach event listeners for dragging
      document.addEventListener('mousemove', dragWindow);
      document.addEventListener('touchmove', dragWindow);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
    }
  };

  CardsView.init();

  exports.CardsView = CardsView;
})(window);
