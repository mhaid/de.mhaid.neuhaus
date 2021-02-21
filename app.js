'use strict';

const Homey = require('homey');

class NeuhausApp extends Homey.App {
	onInit() {
		this.log(Homey.manifest.id,'running...');
	}
}

module.exports = NeuhausApp;