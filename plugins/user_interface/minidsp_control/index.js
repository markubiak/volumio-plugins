'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var socket = require('socket.io-client').connect('http://localhost:3000');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var spawn = require('child_process').spawn;
var fourteensegment = require('ht16k33-fourteensegment-display');


module.exports = minidspControl;
function minidspControl(context) {
    var self = this;

    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
    this.inputTimeout = null;
}

minidspControl.prototype.onVolumioStart = function()
{
    var self = this;
    var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    return libQ.resolve();
}

minidspControl.prototype.onStart = function() {
    var self = this;
    var defer=libQ.defer();

    self.logger.info("minidsp-control info: spawning script in " + __dirname + "/node_modules/minidsp-control");
    self.process = spawn("/usr/local/bin/node", ["./minidsp-control.js"], {
        cwd: __dirname + "/node_modules/minidsp-control"
    });

    self.process.stderr.on('data', (data) => {
        self.logger.warn("minidsp-control warn: " + data);
    });
     
    self.process.on('error', (err) => {
        self.logger.error("minidsp-control: exited unexpectedly. error: " + err);
    });

    self.process.on('exit', () => {
        self.logger.info("minidsp-control closed");
        new fourteensegment(0x70, 1).clear();
    });

    socket.on('pushState', function (state) {
        if (state.status == 'play') {
            if (self.config.get('inputplay')) {
                fs.writeFileSync("/tmp/MINIDSP-CONTROL", "source-usb");
            }
        }
    });

    // Once the Plugin has successfull started resolve the promise
    defer.resolve();

    return defer.promise;
};

minidspControl.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    if (!self.process.killed) {
        self.process.kill();
    }

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

minidspControl.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

minidspControl.prototype.getConfigurationFiles = function() {
	return ['config.json'];
};

minidspControl.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
            uiconf.sections[0].content[0].value = self.config.get('inputplay');
            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

    return defer.promise;
};

minidspControl.prototype.setUIConfig = function(data) {
    var self = this;
    //Perform your installation tasks here
};

minidspControl.prototype.getConf = function(varName) {
    var self = this;
    //Perform your installation tasks here
};

minidspControl.prototype.setConf = function(varName, varValue) {
    var self = this;
    //Perform your installation tasks here
};

minidspControl.prototype.updateOptions = function (data) {
    var self = this;

    self.config.set('inputplay', data['inputplay']);
    self.commandRouter.pushToastMessage('success', "Configuration Update", "MiniDSP 2x4 HD configuration updated");

    return libQ.resolve();
};

minidspControl.prototype.updateVolume = function (data) {
    var self = this;

    var newvol = Number(data['volume']);
    if (newvol > -128 && newvol <= 0) {
        fs.writeFileSync("/tmp/MINIDSP-CONTROL", "volume-set " + newvol);
        return libQ.resolve();
    } else {
        self.commandRouter.pushToastMessage('error', "Volume Update", "Volume was invalid; please enter a number in the range -127 to 0 without any units (dB)");
        return libQ.reject(new Error());
    }

};

minidspControl.prototype.switchInput = function (data) {
    fs.writeFileSync("/tmp/MINIDSP-CONTROL", "source-" + data);
    return libQ.resolve();
};
