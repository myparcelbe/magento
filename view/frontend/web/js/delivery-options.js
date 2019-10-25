var STATUS_SUCCESS = 200;
var STATUS_ERROR = 400;

define(
  [
    'ko',
    'mage/url',
    'uiRegistry',
    'Magento_Customer/js/model/customer',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/model/shipping-service',
    'MyParcelBE_Magento/js/polyfill/array_prototype_find',
    'MyParcelBE_Magento/js/vendor/myparcel',
  ],
  function(
    ko,
    mageUrl,
    registry,
    customer,
    quote,
    shippingService
  ) {
    'use strict';

    var MyParcelFrontend = {
      splitStreetRegex: /(.*?)\s?(\d{1,4})[/\s-]{0,2}([A-z]\d{1,3}|-\d{1,4}|\d{2}\w{1,2}|[A-z][A-z\s]{0,3})?$/,

      updateDeliveryOptionsEvent: 'myparcel_update_delivery_options',
      disableDeliveryOptionsEvent: 'myparcel_disable_delivery_options',

      updatedDeliveryOptionsEvent: 'myparcel_updated_delivery_options',
      updatedAddressEvent: 'myparcel_updated_address',

      /**
       * The selector of the field we use to get the delivery options data into the order.
       *
       * @type {String}
       */
      hiddenDataInput: '[name="myparcel_delivery_options"]',

      /**
       * Initialize the script. Start by requesting the plugin settings, then initialize listeners.
       */
      initialize: function() {
        doRequest(MyParcelFrontend.getMagentoSettings, {
          onSuccess: function(response) {
            MyParcelFrontend.setConfig(response[0].data);
            MyParcelFrontend.hideShippingMethods();
            MyParcelFrontend.addListeners();
            MyParcelFrontend.updateAddress();
          },
        });
      },

      /**
       * Add event listeners to shipping methods and address as well as the delivery options module.
       */
      addListeners: function() {
        MyParcelFrontend.rates = shippingService.getShippingRates()();

        shippingService.getShippingRates().subscribe(function(rates) {
          MyParcelFrontend.rates = rates;
        });

        quote.shippingAddress.subscribe(MyParcelFrontend.updateAddress);
        quote.shippingMethod.subscribe(MyParcelFrontend.onShippingMethodUpdate);

        document.addEventListener(
          MyParcelFrontend.updatedDeliveryOptionsEvent,
          MyParcelFrontend.onUpdatedDeliveryOptions
        );
      },

      /**
       * Set window.MyParcelConfig with the given config. Puts all the data in the correct properties.
       *
       * @param {Object} config - Response from the delivery_options request.
       */
      setConfig: function(config) {
        window.MyParcelConfig = config;
      },

      /**
       * Run the split street regex on the given full address to extract the house number and return it.
       *
       * @param {String} address - Full address.
       *
       * @returns {String|undefined} - The house number, if found. Otherwise null.
       */
      getHouseNumber: function(address) {
        var result = this.splitStreetRegex.exec(address);
        var numberIndex = 2;
        return result ? result[numberIndex] : null;
      },

      /**
       * Trigger an event on the document body.
       *
       * @param {String} identifier - Name of the event.
       */
      triggerEvent: function(identifier) {
        var event = document.createEvent('HTMLEvents');
        event.initEvent(identifier, true, false);
        document.querySelector('body').dispatchEvent(event);
      },

      /**
       * Get address data and put it in the global MyParcelConfig.
       *
       * @param {Object?} address - Quote.shippingAddress from Magento.
       */
      updateAddress: function(address) {
        window.MyParcelConfig.address = MyParcelFrontend.getAddress(address);
        MyParcelFrontend.triggerEvent(MyParcelFrontend.updateDeliveryOptionsEvent);
      },

      /**
       * Get the address entered by the user depending on if they are logged in or not.
       *
       * @returns {Object}
       * @param {Object} address - Quote.shippingAddress from Magento.
       */
      getAddress: function(address) {
        address = address || quote.shippingAddress();

        return {
          number: address.street ? MyParcelFrontend.getHouseNumber(address.street.join(' ')) : '',
          cc: address.countryId || '',
          postalCode: address.postcode || '',
          city: address.city || '',
        };
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
       * @returns {XMLHttpRequest}
       */
      convertDeliveryOptionsToShippingMethod: function() {
        return sendRequest(
          'rest/V1/shipping_methods',
          'POST',
          JSON.stringify({deliveryOptions: [MyParcelFrontend.deliveryOptions]})
        );
      },

      /**
       * Triggered when the delivery options have been updated. Put the received data in the created data input. Then
       *  do the request that tells us which shipping method needs to be selected.
       *
       * @param {CustomEvent} event - The event that was sent.
       */
      onUpdatedDeliveryOptions: function(event) {
        MyParcelFrontend.deliveryOptions = event.detail;
        document.querySelector(MyParcelFrontend.hiddenDataInput).value = JSON.stringify(event.detail);

        /**
         * If the delivery options were emptied, don't request a new shipping method.
         */
        if (JSON.stringify(MyParcelFrontend.deliveryOptions) === '{}') {
          return;
        }

        doRequest(MyParcelFrontend.convertDeliveryOptionsToShippingMethod, {
          onSuccess: function(response) {
            quote.shippingMethod(MyParcelFrontend.getNewShippingMethod(response[0].element_id));
          },
        });
      },

      /**
       * Change the shipping method and disable the delivery options if needed.
       *
       * @param {Object} newShippingMethod - The shipping method that was selected.
       */
      onShippingMethodUpdate: function(newShippingMethod) {
        var methodIsAllowed = window.MyParcelConfig.methods.indexOf(newShippingMethod.method_code) > -1;
        var isMyParcelMethod = newShippingMethod.method_code.indexOf('myparcel') > -1;

        if (JSON.stringify(MyParcelFrontend.shippingMethod) !== JSON.stringify(newShippingMethod)) {
          MyParcelFrontend.shippingMethod = newShippingMethod;

          if (!isMyParcelMethod && !methodIsAllowed) {
            MyParcelFrontend.triggerEvent(MyParcelFrontend.disableDeliveryOptionsEvent);
          }
        }
      },

      /**
       * Hide the shipping methods the delivery options should replace.
       */
      hideShippingMethods: function() {
        window.MyParcelConfig.methods.forEach(function(shippingMethod) {
          var element = MyParcelFrontend.getShippingMethodRow(shippingMethod);

          if (!element) {
            return;
          }

          element.style.display = 'none';
        });
      },

      /**
       * @param {String} shippingMethod - Shipping method to get the row of.
       * @param {String?} child - Any additional selector string.
       *
       * @returns {Element}
       */
      getShippingMethodRow: function(shippingMethod, child) {
        var classSelector = '[class*="shipping-method--' + shippingMethod + '"]';
        var childSelector = (child ? ' ' + child : '');
        return document.querySelector(classSelector + childSelector);
      },

      findRateByMethodCode: function(methodCode) {
        return MyParcelFrontend.rates.find(function(rate) {
          return rate.method_code === methodCode;
        });
      },

      /**
       * Get the new shipping method that should be saved.
       *
       * @param {String} methodCode - Method code to use to find a method.
       *
       * @returns {Object}
       */
      getNewShippingMethod: function(methodCode) {
        var newShippingMethod = [];
        var matchingShippingMethod = MyParcelFrontend.findRateByMethodCode(methodCode);

        if (matchingShippingMethod) {
          return matchingShippingMethod;
        } else {
          /**
           * If the method doesn't exist, loop through the allowed shipping methods and return the first one that
           *  matches.
           */
          window.MyParcelConfig.methods.forEach(function(method) {
            var foundMethod = MyParcelFrontend.findRateByMethodCode(method);

            if (foundMethod) {
              newShippingMethod.push(foundMethod);
            }
          });

          return newShippingMethod.length ? newShippingMethod[0] : null;
        }
      },
    };

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

    return MyParcelFrontend;
  }
);
