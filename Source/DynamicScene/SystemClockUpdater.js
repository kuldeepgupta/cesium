/*global define*/
define(['../Core/DeveloperError',
        '../Core/defaultValue',
        '../Core/incrementalGet'
    ], function(
         DeveloperError,
         defaultValue,
         incrementalGet) {
    "use strict";

    /**
     * A updater that retrieves data from the URL at the specified refreshRate based on the system clock.
     *
     * @alias SystemClockUpdater
     * @constructor
     *
     * @param {CzmlProcessor} czmlProcessor The document manager.
     * @param {DynamicObjectCollection} dynamicObjectCollection The dynamic object collection to update.
     * @param {DynamicExternalDocument} dynamicExternalDocument The external properties used by the SystemClockUpdater.
     * @param {function} [fillFunction={@link incrementalGet}] The function used to fill the {@link DynamicObjectCollection}.
     *
     * @exception {DeveloperError} czmlProcessor is required.
     * @exception {DeveloperError} dynamicObjectCollection is required.
     * @exception {DeveloperError} dynamicExternalDocument is required.
     *
     * @see incrementalGet
     */
    var SystemClockUpdater = function SystemClockUpdater(czmlProcessor, dynamicObjectCollection, dynamicExternalDocument, fillFunction) {
        if (typeof czmlProcessor === 'undefined') {
            throw new DeveloperError('czmlProcessor is required.');
        }
        if (typeof dynamicObjectCollection === 'undefined') {
            throw new DeveloperError('dynamicObjectCollection is required.');
        }
        if (typeof dynamicExternalDocument === 'undefined') {
            throw new DeveloperError('dynamicExternalDocument is required.');
        }

        if (typeof fillFunction === 'undefined') {
            fillFunction = incrementalGet;
        }

        this._czmlProcessor = czmlProcessor;
        this._dynamicObjectCollection = dynamicObjectCollection;
        var refreshInterval = {getValue:function(){return 60;}};
        if(typeof dynamicExternalDocument.pollingUpdate === 'undefined'){
            this._refreshInterval = refreshInterval;
        }else{
            this._refreshInterval = defaultValue(dynamicExternalDocument.pollingUpdate.refreshInterval, refreshInterval);//default to 60 seconds
        }
        this._fillFunction = fillFunction;
        this._url = dynamicExternalDocument.url;
        this._lastUpdateTime = new Date();
    };

    /**
     * Called during the Cesium update loop.
     * @memberof SystemClockUpdater
     *
     * @param {JulianDate} currentTime The current time of the animation.
     */
    SystemClockUpdater.prototype.update = function(currentTime) {
        var now = new Date();
        if(typeof this._lastUpdateTime === 'undefined' || now.valueOf() >= this._lastUpdateTime.valueOf() + this._refreshInterval.getValue(currentTime) * 1000){
            this._lastUpdateTime = now;
            if (typeof this._handle === 'undefined') {
                var self = this;
                var storeHandle = true;
                var url = this._url.getValue(currentTime);
                var handle = this._fillFunction(url,
                        function(item){
                            self._czmlProcessor.process(item, self._dynamicObjectCollection, url);
                        },
                        function(czmlData) {
                            storeHandle = false;
                            self._handle = undefined;
                        }
                );
                if (storeHandle) {
                    this._handle = handle;
                }
            }
        }
    };

    /**
     * Aborts the current connection.
     * @memberof SystemClockUpdater
     */
    SystemClockUpdater.prototype.abort = function() {
        if (typeof this._handle !== 'undefined') {
            this._handle();
            this._handle = undefined;
        }
    };

    return SystemClockUpdater;
});