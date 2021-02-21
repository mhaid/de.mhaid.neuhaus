'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

class Neumann_NLG_CCT extends ZigBeeDevice 
{

	// this method is called when the device is inited and values are changed
	async onNodeInit({ zclNode }) {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// capabilities
		// onoff
		this.registerCapability('onoff', CLUSTER.ON_OFF);
		
		// dim
		this.registerCapability('dim', CLUSTER.LEVEL_CONTROL);
		
		// lightHue
		this.registerCapability('light_temperature', CLUSTER.COLOR_CONTROL, {
			set: 'moveToColorTemperature',
			setParser(value, opts = {}) {
				const colorTemperature = Math.round(mapValueRange(
					0,
					1,
					150,
					500,
					value,
				));
				return {
					colorTemperature,
					transitionTime: 0,
				};
			},
			get: 'colorTemperatureMireds',
			getOpts: {
			getOnStart: true,
			getOnOnline: true,
			},
			report: 'colorTemperatureMireds',
			reportParser(value) {
				return mapValueRange(150,500, 0, 1, value);
			}
		});
    }
}

function mapValueRange(originalRangeStart,originalRangeEnd,newRangeStart,newRangeEnd,value) {
	return newRangeStart + ((newRangeEnd - newRangeStart) / (originalRangeEnd - originalRangeStart))
    * (Math.min(Math.max(originalRangeStart, value), originalRangeEnd) - originalRangeStart);
}

module.exports = Neumann_NLG_CCT;