var STATUS_SUCCESS = 200;
var STATUS_ERROR = 400;

define(
  [
    'ko',
    'mage/url',
    'Magento_Customer/js/model/customer',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/checkout-data',
    'Magento_Checkout/js/action/set-shipping-information',
    'MyParcelBE_Magento/js/vendor/myparcel',
    'MyParcelBE_Magento/js/polyfill/object_assign',
    'domReady!',
  ],
  function(
    ko,
    mageUrl,
    customer,
    quote,
    checkoutData,
    setShippingInformationAction
  ) {
    'use strict';

    var MyParcelFrontend = {
      splitStreetRegex: /(.*?)\s?(\d{1,4})[/\s-]{0,2}([A-z]\d{1,3}|-\d{1,4}|\d{2}\w{1,2}|[A-z][A-z\s]{0,3})?$/,

      // todo
      updateMagentoCheckoutEvent: 'update_checkout',

      updateDeliveryOptionsEvent: 'myparcel_update_delivery_options',
      updatedDeliveryOptionsEvent: 'myparcel_updated_delivery_options',
      updatedAddressEvent: 'myparcel_updated_address',

      /**
       * The selector of the field we use to get the delivery options data into the order.
       *
       * @type {String}
       */
      hiddenDataInput: '[name="myparcel_delivery_options"]',

      postcodeField: 'postcode',
      countryField: 'country_id',
      cityField: 'city',

      /**
       * Initialize the script. Start by requesting the plugin settings, then initialize listeners.
       */
      initialize: function() {
        doRequest(MyParcelFrontend.getMagentoSettings, {
          onSuccess: function(response) {
            MyParcelFrontend.setConfig(response[0].data);
            MyParcelFrontend.addListeners();
            MyParcelFrontend.updateAddress();
          },
        });
      },

      /**
       * Add event listeners to Magento's address fields updating the address on change.
       */
      addListeners: function() {
        var fields = [MyParcelFrontend.postcodeField, MyParcelFrontend.countryField, MyParcelFrontend.cityField];

        fields.forEach(function(field) {
          MyParcelFrontend.getField(field).addEventListener('change', MyParcelFrontend.updateAddress);
        });

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
       * Get field by name. Will return element with this selector: "#<billing|shipping>_<name>".
       *
       * @param {string} name - The part after `shipping/billing` in the id of an element in WooCommerce.
       *
       * @returns {Element}
       */
      getField: function(name) {
        return document.querySelector('[name=' + name + ']');
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
       * Get data from form fields and put it in the global MyParcelConfig.
       *
       * @param e
       */
      updateAddress: function() {
        var data = window.MyParcelConfig;

        data.address = {
          cc: MyParcelFrontend.getField(MyParcelFrontend.countryField).value,
          postalCode: MyParcelFrontend.getField(MyParcelFrontend.postcodeField).value,
          number: MyParcelFrontend.getHouseNumber(),
          city: MyParcelFrontend.getField(MyParcelFrontend.cityField).value,
        };

        window.MyParcelConfig = data;
        console.log('triggering ' + MyParcelFrontend.updateDeliveryOptionsEvent);
        MyParcelFrontend.triggerEvent(MyParcelFrontend.updateDeliveryOptionsEvent);
      },

      /**
       * Get the address entered by the user depending on if they are logged in or not.
       *
       * @returns {Object}
       */
      getAddress: function() {
        var address;
        var regExp = /[<>=]/g;
        var street = [
          address.street0,
          address.street1,
          address.street2,
        ].join(' ');
        var number = this.getHouseNumber(street);

        if (customer.isLoggedIn() &&
          typeof quote !== 'undefined' &&
          typeof quote.shippingAddress !== 'undefined' &&
          typeof quote.shippingAddress._latestValue !== 'undefined' &&
          typeof quote.shippingAddress._latestValue.street !== 'undefined' &&
          typeof quote.shippingAddress._latestValue.street[0] !== 'undefined'
        ) {
          address = this.getLoggedInAddress();
        } else {
          address = this.getNoLoggedInAddress();
        }

        return {
          number: number,
          cc: address.country.replace(regExp, ''),
          postcode: address.postcode.replace(/[\s<>=]/g, ''),
          city: address.city.replace(regExp, ''),
        };
      },

      /**
       * Get the address for a logged in user.
       *
       * @returns {Object}
       */
      getLoggedInAddress: function() {
        var street0 = quote.shippingAddress._latestValue.street[0];
        var street1 = quote.shippingAddress._latestValue.street[1];
        var street2 = quote.shippingAddress._latestValue.street[2];
        var country = quote.shippingAddress._latestValue.countryId;
        var postcode = quote.shippingAddress._latestValue.postcode;
        var city = quote.shippingAddress._latestValue.postcode;

        return {
          street0: street0 ? street0 : '',
          street1: street1 ? street1 : '',
          street2: street2 ? street2 : '',
          country: country ? country : '',
          postcode: postcode ? postcode : '',
          city: city ? city : '',
        };
      },

      /**
       * Get the address assuming the user is not logged in.
       *
       * @returns {Object}
       */
      getNoLoggedInAddress: function() {
        var classPrefix = 'checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset.';

        var street0 = registry.get(classPrefix + 'street.0');
        var street1 = registry.get(classPrefix + 'street.1');
        var street2 = registry.get(classPrefix + 'street.2');
        var country = registry.get(classPrefix + 'country_id');
        var postcode = registry.get(classPrefix + 'postcode');
        var city = registry.get(classPrefix + 'city');

        return {
          street0: street0 ? street0.get('value') : '',
          street1: street1 ? street1.get('value') : '',
          street2: street2 ? street2.get('value') : '',
          country: country ? country.get('value') : '',
          postcode: postcode ? postcode.get('value') : '',
          city: city ? city.get('value') : '',
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
       * Triggered when the delivery options have been updated. Put the received data in the created data input.
       *
       * @param {CustomEvent} event - The event that was sent.
       */
      onUpdatedDeliveryOptions: function(event) {
        MyParcelFrontend.deliveryOptions = event.detail;
        document.querySelector(MyParcelFrontend.hiddenDataInput).value = JSON.stringify(event.detail);

        doRequest(MyParcelFrontend.convertDeliveryOptionsToShippingMethod, {
          onSuccess: function(response) {
            var shippingMethod = response[0].element_id;
            var respectiveInput = document.querySelector('[id="' + shippingMethod + '"] input');

            if (respectiveInput) {
              respectiveInput.checked = true;

              /**
               * Manually trigger the shipping method update event.
               */
              MyParcelFrontend.onShippingMethodUpdate(shippingMethod);
            } else {
              console.warn('No matching element found for ' + shippingMethod + '.');
            }
          },
        });
      },

      /**
       * @param {Object} newShippingMethod - The shipping method that was selected.
       */
      onShippingMethodUpdate: function(newShippingMethod) {
        if (JSON.stringify(MyParcelFrontend.shippingMethod) !== JSON.stringify(newShippingMethod)) {
          MyParcelFrontend.shippingMethod = newShippingMethod;
          console.log(newShippingMethod);
          console.log('shipping method changed to ' + newShippingMethod);
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
