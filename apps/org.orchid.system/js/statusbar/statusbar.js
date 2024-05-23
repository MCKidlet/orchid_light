!(function (exports) {
  'use strict';

  class Statusbar {
    constructor (element) {
      this.element = element;

      this.init();
    }

    init () {
      this.element.classList.add('statusbar');
      this.element.innerHTML = '';

      this.iconHolder = document.createElement('div');
      this.iconHolder.classList.add('statusbar-icons');
      this.element.appendChild(this.iconHolder);

      this.leftIconHolder = document.createElement('div');
      this.leftIconHolder.classList.add('left');
      this.iconHolder.appendChild(this.leftIconHolder);

      this.rightIconHolder = document.createElement('div');
      this.rightIconHolder.classList.add('right');
      this.iconHolder.appendChild(this.rightIconHolder);

      this.focusIcon = new StatusbarFocusIcon(this.leftIconHolder);
      this.timeIcon = new StatusbarTimeIcon(this.leftIconHolder);
      this.carrierLabel = new StatusbarCarrierLabel(this.leftIconHolder);
      this.airplaneIcon = new StatusbarAirplaneIcon(this.leftIconHolder);
      this.muteIcon = new StatusbarMuteIcon(this.leftIconHolder);
      this.warmColorsIcon = new StatusbarWarmColorsIcon(this.leftIconHolder);
      this.readerModeIcon = new StatusbarReaderModeIcon(this.leftIconHolder);

      this.batteryIcon = new StatusbarBatteryIcon(this.rightIconHolder);
      this.cellularIcon = new StatusbarCellularDataIcon(this.rightIconHolder);
      this.audioIcon = new StatusbarAudioIcon(this.rightIconHolder);
      this.wifiIcon = new StatusbarWifiIcon(this.rightIconHolder);
      this.dataIcon = new StatusbarDataIcon(this.rightIconHolder);
    }
  }

  exports.Statusbar = Statusbar;
})(window);
