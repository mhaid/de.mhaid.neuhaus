'use strict';

const OnOffBoundCluster = require('../../lib/OnOffBoundCluster');
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster');
const ColorControlBoundCluster = require('../../lib/ColorControlBoundCluster');

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { debug,CLUSTER } = require('zigbee-clusters');
debug(true);

var levelMoveInterval = null;
var currentMoveMode = null;
var dimTapped = false;

class Neumann_NLG_remote extends ZigBeeDevice 
{
	// this method is called when the device is inited and values are changed
	async onNodeInit({ zclNode }) {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// capabilities
		Object.keys(zclNode.endpoints).forEach((endpoint) => {

			zclNode.endpoints[endpoint].bind(CLUSTER.ON_OFF.NAME, new OnOffBoundCluster({
				onSetOff: this._onOffCmd.bind(this),
				onSetOn: this._onOnCmd.bind(this),
				endpoint: endpoint,
			}));
	  
			this.zclNode.endpoints[endpoint].bind(CLUSTER.LEVEL_CONTROL.NAME, new LevelControlBoundCluster({
				onStep: this._onLevelStepCmd.bind(this),
				onStepWithOnOff: this._onLevelStepCmd.bind(this),
				onMove: this._onLevelMoveCmd.bind(this),
				onMoveWithOnOff: this._onLevelMoveCmd.bind(this),
				onStop: this._onLevelStopCmd.bind(this),
				onStopWithOnOff: this._onLevelStopCmd.bind(this),
				endpoint: endpoint,
			}));
	  
			this.zclNode.endpoints[endpoint].bind(CLUSTER.COLOR_CONTROL.NAME, new ColorControlBoundCluster({
				onMoveToColorTemperature: this._onMoveToColorTemperatureCmd.bind(this),
				onMoveToHue: this._onMoveToHueCmd.bind(this),
				onMoveToSaturation: this._onMoveToSaturationCmd.bind(this),
				endpoint: endpoint,
			}));
		});
    }

	//OnOff
	_onOnCmd(endpoint) {
		console.log('_onOn',endpoint);
		this.setCapabilityValue("custom_onoff", true);

		this.triggerFlow({id: "on_changed"}).then().catch(this.error);
	}

	_onOffCmd(endpoint){
		console.log('_onOff',endpoint);
		this.setCapabilityValue("custom_onoff", false);

		this.triggerFlow({id: "off_changed"}).then().catch(this.error);
	}

	//LevelControl
	_onLevelStepCmd ({ mode, stepSize, transitionTime }, endpoint) {
		var stepSizeParsed = stepSize / 255;
		var homeyValue = getCapabilityValue("custom_dim");
		if(mode == 0) {
			//UP
			homeyValue = homeyValue + stepSizeParsed;
			if(homeyValue > 1) { homeyValue = 1; }
		} else {
			//DOWN
			homeyValue = homeyValue - stepSizeParsed;
			if(homeyValue < 0) { homeyValue = 0; }
		}

		console.log('_onLevelStep',mode,stepSize,stepSizeParsed,transitionTime,homeyValue,endpoint);
		this.setCapabilityValue("custom_dim", homeyValue);
		this.triggerFlow({id: "dim_changed",tokens:{dim: stepSizeParsed}}).then().catch(this.error);
	}

	_onLevelStopCmd (endpoint) {
		console.log('_onLevelStop',endpoint);
		if (levelMoveInterval == "stopped") {
			levelMoveInterval = null;
		} else if(levelMoveInterval != null) {

			this.homey.clearInterval(levelMoveInterval);
			if(currentMoveMode == null) {
				currentMoveMode = "Up";
			}

			var homeyValue = this.getCapabilityValue("custom_dim");
			this.triggerFlow({id: "dim_stop",tokens:{moveMode: currentMoveMode}}).then().catch(this.error);
			this.triggerFlow({id: "dim_changed",tokens:{dim: homeyValue}}).then().catch(this.error);
			
			levelMoveInterval = null;
			currentMoveMode = null;
		} else {
			dimTapped = true;
		}
	}

	_onLevelMoveCmd ({ moveMode, rate }, endpoint) {
		var rateParsed = rate/255/100;

		if(levelMoveInterval != null) {
			this._onLevelStopCmd(endpoint);
		}
		currentMoveMode = moveMode;

		console.log('_onLevelMove',moveMode,rate,rateParsed,endpoint);

		this.homey.setTimeout(() => {
			if(dimTapped) {
				// Small Tap on dim (less than 1 seconds)
				if(currentMoveMode == null) {
					currentMoveMode = "Up";
				}

				this.triggerFlow({id: "dim_tap",tokens:{moveMode: currentMoveMode}}).then().catch(this.error);
				currentMoveMode = null;
				dimTapped = false;
			} else {
				this.triggerFlow({id: "dim_start",tokens:{moveMode: currentMoveMode}}).then().catch(this.error);

				levelMoveInterval = this.homey.setInterval(() => {
					var newVal = this.getCapabilityValue("custom_dim");
					if(moveMode=="up"){newVal += rateParsed; if(newVal>1){newVal=1;}}
					else{newVal -= rateParsed; if(newVal<0){newVal=0;}}
					this.setCapabilityValue("custom_dim", newVal);
					this.triggerFlow({id: "dim_step",tokens:{dim: newVal,moveMode: moveMode}}).then().catch(this.error);
		
					if(newVal == 0 || newVal == 1) {
						this._onLevelStopCmd(endpoint);
						levelMoveInterval = "stopped";
					}
				}, 10);
			}
		}, 1000);
	}

	//ColorControl
	_onMoveToHueCmd ({ hue }, endpoint) {
		hueParsed = parseFloat((hue / 0xFE).toFixed(2));

		console.log('_onMoveToHue',hue,hueParsed,endpoint);
		this.setCapabilityValue("light_temperature", hueParsed);

		this.triggerFlow({id: "color_changed",tokens:{color: hueParsed}}).then().catch(this.error);
	}
	
	_onMoveToSaturationCmd ({ saturation }, endpoint) {
		var saturationParsed = parseFloat((saturation / 0xFE).toFixed(2));

		console.log("_onMoveToSaturation",saturation,saturationParsed,endpoint);
		this.setCapabilityValue("light_temperature", colorTemperatureParsed);

		this.triggerFlow({id: "color_changed",tokens:{color: saturationParsed}}).then().catch(this.error);
	}
	
	_onMoveToColorTemperatureCmd ({ colorTemperature, transitionTime }, endpoint) {
		const tempVal = mapValueRange(155, 450, 0, 1, colorTemperature)
		var colorTemperatureParsed = parseFloat(tempVal.toFixed(2));

		console.log("_onMoveToColorTemperature",colorTemperature,colorTemperatureParsed,transitionTime,endpoint);
		this.setCapabilityValue("light_temperature", colorTemperatureParsed);

		this.triggerFlow({id: "color_changed",tokens:{color: colorTemperatureParsed}}).then().catch(this.error);
	}
}

function mapValueRange(originalRangeStart,originalRangeEnd,newRangeStart,newRangeEnd,value) {
	return newRangeStart + ((newRangeEnd - newRangeStart) / (originalRangeEnd - originalRangeStart))
    * (Math.min(Math.max(originalRangeStart, value), originalRangeEnd) - originalRangeStart);
}

module.exports = Neumann_NLG_remote;