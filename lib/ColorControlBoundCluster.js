'use strict'

const { BoundCluster } = require('zigbee-clusters')

class ColorControlBoundCluster extends BoundCluster {

  constructor ({
    onMoveToHue,
    onMoveToSaturation,
    onMoveToHueAndSaturation,
    onMoveToColor,
    onMoveToColorTemperature,
    endpoint,
  }) {
    super()
    // From ColorControlCluster
    this._onMoveToHue = onMoveToHue
    this._onMoveToSaturation = onMoveToSaturation
    this._onMoveToHueAndSaturation = onMoveToHueAndSaturation
    this._onMoveToColor = onMoveToColor
    this._onMoveToColorTemperature = onMoveToColorTemperature
    this._endpint = endpoint
  }

  moveToHue (payload) {
    if (typeof this._onMoveToHue === 'function') {
      this._onMoveToHue(payload, this._endpint)
    }
  }

  moveToSaturation (payload) {
    if (typeof this._onMoveToSaturation === 'function') {
      this._onMoveToSaturation(payload, this._endpint)
    }
  }

  moveToHueAndSaturation (payload) {
    if (typeof this._onMoveToHueAndSaturation === 'function') {
      this._onMoveToHueAndSaturation(payload, this._endpint)
    }
  }

  moveToColor (payload) {
    if (typeof this._onMoveToColor === 'function') {
      this._onMoveToColor(payload, this._endpint)
    }
  }

  moveToColorTemperature (payload) {
    if (typeof this._onMoveToColorTemperature === 'function') {
      this._onMoveToColorTemperature(payload, this._endpint)
    }
  }
}

module.exports = ColorControlBoundCluster

/**
 * From zigbee-clusters.CLUSTER.COLOR_CONTROL
 *
 const COMMANDS = {
  moveToHue: {
    id: 0,
    args: {
      hue: ZCLDataTypes.uint8,
      direction: ZCLDataTypes.enum8({ // TODO: ?
        shortestDistance: 0,
        longestDistance: 1,
        up: 2,
        down: 3,
      }),
      transitionTime: ZCLDataTypes.uint16,
    },
  },
  moveToSaturation: {
    id: 3,
    args: { // TODO
      saturation: ZCLDataTypes.uint8,
      transitionTime: ZCLDataTypes.uint16,
    },
  },
  moveToHueAndSaturation: {
    id: 6,
    args: {
      hue: ZCLDataTypes.uint8,
      saturation: ZCLDataTypes.uint8,
      transitionTime: ZCLDataTypes.uint16,
    },
  },
  moveToColor: {
    id: 7,
    args: {
      colorX: ZCLDataTypes.uint16,
      colorY: ZCLDataTypes.uint16,
      transitionTime: ZCLDataTypes.uint16,
    },
  },
  moveToColorTemperature: {
    id: 10,
    args: {
      colorTemperature: ZCLDataTypes.uint16,
      transitionTime: ZCLDataTypes.uint16,
    },
  },
}
 */