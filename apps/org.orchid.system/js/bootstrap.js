'use strict';

class Bootstrap extends OrchidJS.Framework {
  screen = null;
  inactivityScreen = null;
  statusbar = null;

  settings = [
    'audio.volume.music',
    'battery.percentage.visible',
    'ftu.enabled',
    'general.lang.code',
    'general.software_buttons.enabled',
    'video.brightness',
    'video.dark_mode.enabled',
    'video.reader_mode.enabled',
    'video.warm_colors.enabled'
  ];
  static SETTINGS_AUDIO_VOLUME_MUSIC = 0;
  static SETTINGS_BATTERY_PERCENTAGE_VISIBILITY = 1;
  static SETTINGS_FTU_ENABLED = 2;
  static SETTINGS_GENERAL_LANG_CODE = 3;
  static SETTINGS_GENERAL_SOFTWARE_BUTTONS = 4;
  static SETTINGS_VIDEO_BRIGHTNESS = 5;
  static SETTINGS_VIDEO_DARK_MODE = 6;
  static SETTINGS_VIDEO_READER_MODE = 7;
  static SETTINGS_VIDEO_WARM_COLORS = 8;

  network = {};

  constructor() {
    super();
  }

  whenReady() {
    OrchidJS.registerComponent('motion-wallpaper', null);
    OrchidJS.registerComponent('status-bar', null);
    OrchidJS.registerComponent('carousel-cards', null);
    OrchidJS.registerComponent('carousel-card', null);
    OrchidJS.registerComponent('blink-fade-label', null);
    OrchidJS.registerComponent('lock-screen', null);
    OrchidJS.registerComponent('lock-screen-time', null);
    OrchidJS.registerComponent('lock-screen-date', null);
    OrchidJS.registerComponent('lock-screen-widgets', null);
    OrchidJS.registerComponent('lock-screen-widget', null);
    OrchidJS.registerComponent('app-workspace', null);
    OrchidJS.registerComponent('app-frame', null);
    OrchidJS.registerComponent('app-chrome', null);
    OrchidJS.registerComponent('app-chrome-tab', null);
    OrchidJS.registerComponent('web-view', null);
    OrchidJS.registerComponent('modal-dialog', null);
    OrchidJS.registerComponent('wallpaper-background', null);
    OrchidJS.registerComponent('notifications-container', null);
    OrchidJS.registerComponent('notifications-group', null);
    OrchidJS.registerComponent('notification-toaster', null);
    OrchidJS.registerComponent('quick-settings-button', null);
    OrchidJS.registerComponent('quick-settings-slider', null);
    OrchidJS.registerComponent('quick-settings-widget', null);
    OrchidJS.registerComponent('tray-devices', null);
    OrchidJS.registerComponent('card-view', null);

    this.checkNetwork();
  }

  checkNetwork() {
    WifiManager.getCurrentConnections()
      .then((networks) => {
        this.networks = networks;

        if (!networks || !this.networks[0]) {
          return;
        }

        this.network = this.networks[0];
        this.network.signalStrength = Math.min(100, this.networks[0].quality);

        clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout(this.update.bind(this), 1000);
      })
      .catch((error) => {
        console.error(error);

        clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout(this.update.bind(this), 1000);
      });
  }

  /**
   * Initializes various settings and event listeners for the application.
   */
  initialize() {
    this.screen = document.getElementById('screen');
    this.inactivityScreen = document.getElementById('inactivity-screen');

    OrchidJS.Settings.getValue(this.settings[Bootstrap.SETTINGS_BATTERY_PERCENTAGE_VISIBILITY]).then(
      this.handleBatteryPercentageVisibility.bind(this)
    );
    OrchidJS.Settings.getValue(this.settings[Bootstrap.SETTINGS_GENERAL_LANG_CODE]).then(this.handleLanguage.bind(this));
    OrchidJS.Settings.getValue(this.settings[Bootstrap.SETTINGS_GENERAL_SOFTWARE_BUTTONS]).then(
      this.handleSoftwareButtons.bind(this)
    );
    OrchidJS.Settings.getValue(this.settings[Bootstrap.SETTINGS_VIDEO_BRIGHTNESS]).then(this.handleBrightness.bind(this));
    OrchidJS.Settings.getValue(this.settings[Bootstrap.SETTINGS_VIDEO_WARM_COLORS]).then(this.handleWarmColors.bind(this));
    OrchidJS.Settings.getValue(this.settings[Bootstrap.SETTINGS_VIDEO_READER_MODE]).then(this.handleReaderMode.bind(this));

    OrchidJS.Settings.addObserver(this.settings[Bootstrap.SETTINGS_AUDIO_VOLUME_MUSIC], this.handleMusicVolume.bind(this));
    OrchidJS.Settings.addObserver(
      this.settings[Bootstrap.SETTINGS_BATTERY_PERCENTAGE_VISIBILITY],
      this.handleBatteryPercentageVisibility.bind(this)
    );
    OrchidJS.Settings.addObserver(this.settings[Bootstrap.SETTINGS_GENERAL_LANG_CODE], this.handleLanguageChange.bind(this));
    OrchidJS.Settings.addObserver(
      this.settings[Bootstrap.SETTINGS_GENERAL_SOFTWARE_BUTTONS],
      this.handleSoftwareButtons.bind(this)
    );
    OrchidJS.Settings.addObserver(this.settings[Bootstrap.SETTINGS_VIDEO_BRIGHTNESS], this.handleBrightness.bind(this));
    OrchidJS.Settings.addObserver(this.settings[Bootstrap.SETTINGS_VIDEO_DARK_MODE], this.handleColorScheme.bind(this));
    OrchidJS.Settings.addObserver(this.settings[Bootstrap.SETTINGS_VIDEO_WARM_COLORS], this.handleWarmColors.bind(this));
    OrchidJS.Settings.addObserver(this.settings[Bootstrap.SETTINGS_VIDEO_READER_MODE], this.handleReaderMode.bind(this));

    document.addEventListener('visibilitychange', this.handleWindowBlur.bind(this));
    window.addEventListener('focus', this.handleWindowFocus.bind(this));

    LazyLoader.load('js/simulator.js');
    LazyLoader.load('js/music_controller.js', () => {
      MusicController.play('/resources/music/theme_music.wav', false);
      OrchidJS.Settings.getValue(this.settings[Bootstrap.SETTINGS_AUDIO_VOLUME_MUSIC]).then(
        this.handleMusicVolume.bind(this)
      );
      OrchidJS.Settings.getValue(this.settings[Bootstrap.SETTINGS_FTU_ENABLED]).then(this.handleFirstLaunch.bind(this));
      MusicController.audio.onended = () => {
        MusicController.play('/resources/music/theme_music_loop.wav', true);
        OrchidJS.Settings.getValue(this.settings[Bootstrap.SETTINGS_AUDIO_VOLUME_MUSIC]).then(
          this.handleMusicVolume.bind(this)
        );
      };
    });

    // Load with AppsManager to ensure existing webapps.json and correct
    // load time that isnt too early and is low with loading overhead
    OrchidJS.AppsManager.getAllApps().then(() => {
      if (OrchidJS.deviceType === 'desktop') {
        this.statusbar = document.getElementById('software-buttons-statusbar');
      } else {
        this.statusbar = document.getElementById('statusbar');
      }

      LazyLoader.load('js/lockscreen/lockscreen.js');
      LazyLoader.load('js/lockscreen/motion.js');
      LazyLoader.load('js/lockscreen/clock.js');
      LazyLoader.load('js/lockscreen/date.js');
      LazyLoader.load('js/lockscreen/notifications.js');
      LazyLoader.load('js/lockscreen/pin_lock.js');
      // TODO: Implement a multi-user system
      // LazyLoader.load('js/lockscreen/login.js');

      // TODO: Implement working achievements
      // LazyLoader.load('js/achievements.js');

      LazyLoader.load('js/daemons/alarms_handler.js');
      LazyLoader.load('js/assistants.js');
      LazyLoader.load('js/dock/dock_icon.js', () => {
        LazyLoader.load('js/dock/dock.js');
      });
      LazyLoader.load('js/dynamic_toaster.js');
      LazyLoader.load('js/keybinds.js');
      LazyLoader.load('js/message_handler.js');
      LazyLoader.load('js/platform_classifier.js');
      LazyLoader.load('js/rocketbar.js');

      LazyLoader.load('js/utility_tray/utility_tray.js', () => {
        LazyLoader.load('js/utility_tray/motion.js');
        LazyLoader.load('js/utility_tray/wifi_button.js');
        LazyLoader.load('js/utility_tray/clock.js');
        LazyLoader.load('js/utility_tray/date.js');
      });

      LazyLoader.load('js/wallpaper_manager.js');
      LazyLoader.load('js/webapp/webapps.js', () => {
        // Hide splash screen when everything is loaded and done
        Splashscreen.hide();
      });

      if (window.deviceType === 'desktop') {
        LazyLoader.load('js/webapp/app_switcher.js');

        LazyLoader.load('js/app_launcher/app_launcher.js');
        LazyLoader.load('js/app_launcher/icon.js', () => {
          LazyLoader.load('js/app_launcher/pagination_dots.js', () => {
            LazyLoader.load('js/app_launcher/apps.js');
          });
        });

        LazyLoader.load('js/dashboard.js');
      }

      // Enable more complex visuals when specifications are met
      if (navigator.hardwareConcurrency > 2) {
        if (navigator.deviceMemory >= 2) {
          this.screen.classList.add('gpu-capable');
        }
        if (navigator.hardwareConcurrency > 4) {
          if (navigator.deviceMemory > 4) {
            this.screen.classList.add('gpu-fully-capable');
          }
        }
      }

      if (Environment.type === 'development') {
        LazyLoader.load('js/notification_toaster.js', () => {
          OrchidJS.notify('Development Environment', {
            body: 'OrchidOS has detected a active development environment so we wish you a happy straightforward development :D',
            source: 'System',
            badge: '/style/icons/system_64.png',
            icon: 'http://shared.localhost:9920/icons/shared_64.png',
            actions: [
              {
                label: 'Thanks',
                recommend: true
              },
              {
                label: 'Orchid Docs'
              }
            ]
          });
        });
      }
    });

    window.addEventListener('orchid-services-ready', this.onServicesLoad.bind(this));
  }

  /**
   * Set the music volume based on the value passed by OrchidJS.Settings.
   *
   * @param {number} value
   * Volume level as an integer in the range of 0-100.
   */
  handleMusicVolume(value) {
    // Set the volume of the music player to the passed value
    // from the Settings API as a percentage of maximum volume.
    MusicController.setVolume(value / 100, 1); // max = 1
  }

  /**
   * Toggle the visibility of the battery percentage based on the value
   * passed by OrchidJS.Settings.
   *
   * @param {boolean} value
   * True if the battery percentage should be visible, false otherwise.
   */
  handleBatteryPercentageVisibility(value) {
    console.log(value);
    this.screen.classList.toggle('battery-percentage-visible', value);
  }

  /**
   * Handle language change event from OrchidJS.Settings.
   *
   * @param {string} value
   * Language code as a string. See
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
   */
  handleLanguage(value) {
    OrchidJS.L10n.currentLanguage = value;
  }

  /**
   * Handle language change event from OrchidJS.Settings.
   *
   * @param {string} value
   * Language code as a string. See
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
   */
  handleLanguageChange(value) {
    if (OrchidJS.L10n.currentLanguage === value) {
      return;
    }

    LoadingScreen.show();
    // Show loading message
    LoadingScreen.element.textContent = OrchidJS.L10n.get('changingLanguage');
    // Listen for the end of the loading animation
    LoadingScreen.element.addEventListener('transitionend', () => {
      // Set the new language
      OrchidJS.L10n.currentLanguage = value;
      // Show another loading message
      LoadingScreen.element.textContent = OrchidJS.L10n.get('changingLanguage');
      // Hide the loading screen
      LoadingScreen.hide();
    });
  }

  /**
   * Handle brightness change event from OrchidJS.Settings.
   *
   * @param {number} value
   * Brightness value between 0 and 1 as a float number.
   */
  handleBrightness(value) {
    DisplayManager.setBrightness(value);
  }

  /**
   * Handle color scheme change event from OrchidJS.Settings.
   *
   * @param {boolean} value
   * If true, apply 'dark' theme. If false, apply 'light' theme.
   */
  handleColorScheme(value) {
    const targetTheme = value ? 'dark' : 'light';
    IPC.send('change-theme', targetTheme); // Notify the main process to change the theme. See: src/main.js
  }

  handleSoftwareButtons(value) {
    this.screen.classList.toggle('software-buttons-enabled', value);
  }

  handleWarmColors(value) {
    this.screen.classList.toggle('warm-colors', value);
  }

  handleReaderMode(value) {
    this.screen.classList.toggle('reader-mode', value);
  }

  handleWindowFocus() {
    this.screen.classList.remove('hidden');
    this.inactivityScreen.classList.remove('visible');
  }

  handleWindowBlur() {
    if (document.visibilityState === 'hidden') {
      this.screen.classList.add('hidden');
      this.inactivityScreen.classList.add('visible');
    }
  }

  handleFirstLaunch(value) {
    if (value) {
      LockscreenMotion.hideMotionElement();
      const appWindow = new AppWindow('http://ftu.localhost:9920/manifest.webapp', {});
    } else {
      LazyLoader.load('js/webapp/homescreen_launcher.js');
    }
  }

  /**
   * Callback function for when Orchid Services have fully loaded.
   *
   * Shows a notification to the user indicating that the system is
   * ready to use.
   */
  onServicesLoad() {
    _os.devices.ensureDevice(); // Ensure device is created
    LazyLoader.load(['js/syncing_data.js', 'js/notification_toaster.js'], function () {
      OrchidJS.notify(
        'Orchid is ready to use!', // Notification title
        {
          // Notification options
          body: 'Orchid Services have loaded successfully.', // Notification body
          source: 'System', // Source of the notification
          icon: '/style/icons/orchidsuite_64.png', // Icon to display
          actions: [
            // Actions to display as buttons
            { label: 'Okay', recommend: true }, // Recommended action
            { label: 'Learn More' } // Secondary action
          ]
        }
      );
    });
  }
}

OrchidJS.setInstance(new Bootstrap());
