var STATUS_SUCCESS = 200;
var STATUS_ERROR = 400;

define([
  'ko',
  'mage/url',
  'Magento_Checkout/js/model/shipping-service',
],
function(
  ko,
  mageUrl,
  shippingService
) {
  'use strict';

  var Model = {
    /**
     * Bind the observer to this model.
     */
    rates: shippingService.getShippingRates(),

    /**
     * The allowed and present shipping methods for which the delivery options would be shown.
     */
    allowedShippingMethods: ko.observable(null),

    /**
     * Whether the delivery options will be shown or not.
     */
    hasDeliveryOptions: ko.observable(false),

    /**
     * Initialize by requesting the MyParcel settings configuration from Magento.
     */
    initialize: function() {
      doRequest(Model.getMagentoSettings, {onSuccess: Model.onInitializeSuccess});
    },

    /**
     * Fill in the observable variables and decide whether the delivery options should be showed or not.
     *
     * @param {Array} response - Response from request.
     */
    onInitializeSuccess: function(response) {
      /**
       * Filter the allowed shipping methods by checking if they are actually present in the checkout. If not they will
       *  be filtered out.
       */
      var allowedShippingMethods = response[0].data.methods.filter(function(rate) {
        return !!Model.findRateByMethodCode(rate);
      });

      Model.allowedShippingMethods(allowedShippingMethods);

      window.MyParcelConfig = response[0].data;

      if (allowedShippingMethods.length) {
        Model.hasDeliveryOptions(true);
      }
    },

    /**
     * Search the rates for the given method code.
     *
     * @param {String} methodCode - Method code to search for.
     *
     * @returns {Object} - The found rate, if any.
     */
    findRateByMethodCode: function(methodCode) {
      return Model.rates().find(function(rate) {
        return rate.method_code === methodCode;
      });
    },

    /**
     * Execute the delivery_options request to retrieve the settings object.
     *
     * @returns {XMLHttpRequest}
     */
    getMagentoSettings: function() {
      return sendRequest('rest/V1/delivery_options/get');
    },

    /**
     * Execute the shipping_methods request to convert delivery options to a shipping method id.
     *
     * @param {Object} deliveryOptions - Delivery options data.
     * @param {Object} handlers - Object with handlers to run on different outcomes of the request.
     */
    convertDeliveryOptionsToShippingMethod: function(deliveryOptions, handlers) {
      doRequest(
        function() {
          return sendRequest(
            'rest/V1/shipping_methods',
            'POST',
            JSON.stringify({deliveryOptions: [deliveryOptions]})
          );
        }, handlers
      );
    },
  };

  return Model;

  /**
   * Request function. Executes a request and given handlers.
   *
   * @param {function} request - The request to execute.
   * @param {Object} handlers - Object with handlers to run on different outcomes of the request.
   * @property {function} handlers.onSuccess - Function to run on Success handler.
   * @property {function} handlers.onError - Function to run on Error handler.
   * @property {function} handlers.always - Function to always run.
   */
  function doRequest(request, handlers) {
    /**
     * Execute a given handler by name if it exists in handlers.
     *
     * @param {string} handlerName - Name of the handler to check for.
     * @param {*?} params - Parameters to pass to the handler.
     * @returns {*}
     */
    handlers.doHandler = function(handlerName, params) {
      if (handlers.hasOwnProperty(handlerName) && typeof handlers[handlerName] === 'function') {
        return handlers[handlerName](params);
      }
    };

    request().onload = function() {
      var response = JSON.parse(this.response);

      if (this.status >= STATUS_SUCCESS && this.status < STATUS_ERROR) {
        handlers.doHandler('onSuccess', response);
      } else {
        handlers.doHandler('onError', response);
      }

      handlers.doHandler('always', response);
    };
  }

  /**
   * Send a request to given endpoint.
   *
   * @param {String} endpoint - Endpoint to use.
   * @param {String} [method='GET'] - Request method.
   * @param {String} [body={}] - Request body.
   *
   * @returns {XMLHttpRequest}
   */
  function sendRequest(endpoint, method, body) {
    var url = mageUrl.build(endpoint);
    var request = new XMLHttpRequest();

    method = method || 'GET';
    body = body || {};

    request.open(method, url, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(body);

    return request;
  }
});
