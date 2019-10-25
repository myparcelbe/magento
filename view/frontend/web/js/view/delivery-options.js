define(
  [
    'ko',
    'uiRegistry',
    'Magento_Customer/js/model/customer',
    'Magento_Checkout/js/model/quote',
    'MyParcelBE_Magento/js/model/checkout',
    'MyParcelBE_Magento/js/polyfill/array_prototype_find',
    'MyParcelBE_Magento/js/vendor/myparcel',
  ],
  function(
    ko,
    registry,
    customer,
    quote,
    checkout
  ) {
    'use strict';

    var deliveryOptions = {
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
        checkout.allowedShippingMethods.subscribe(deliveryOptions.hideShippingMethods);

        deliveryOptions.hideShippingMethods();
        deliveryOptions.addListeners();
        deliveryOptions.updateAddress();
      },

      /**
       * Add event listeners to shipping methods and address as well as the delivery options module.
       */
      addListeners: function() {
        quote.shippingAddress.subscribe(deliveryOptions.updateAddress);
        quote.shippingMethod.subscribe(deliveryOptions.onShippingMethodUpdate);

        document.addEventListener(
          deliveryOptions.updatedDeliveryOptionsEvent,
          deliveryOptions.onUpdatedDeliveryOptions
        );
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
        window.MyParcelConfig.address = deliveryOptions.getAddress(address);
        deliveryOptions.triggerEvent(deliveryOptions.updateDeliveryOptionsEvent);
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
          number: address.street ? deliveryOptions.getHouseNumber(address.street.join(' ')) : '',
          cc: address.countryId || '',
          postalCode: address.postcode || '',
          city: address.city || '',
        };
      },

      /**
       * Triggered when the delivery options have been updated. Put the received data in the created data input. Then
       *  do the request that tells us which shipping method needs to be selected.
       *
       * @param {CustomEvent} event - The event that was sent.
       */
      onUpdatedDeliveryOptions: function(event) {
        deliveryOptions.deliveryOptions = event.detail;
        document.querySelector(deliveryOptions.hiddenDataInput).value = JSON.stringify(event.detail);

        /**
         * If the delivery options were emptied, don't request a new shipping method.
         */
        if (JSON.stringify(deliveryOptions.deliveryOptions) === '{}') {
          return;
        }

        checkout.convertDeliveryOptionsToShippingMethod(event.detail, {
          onSuccess: function(response) {
            quote.shippingMethod(deliveryOptions.getNewShippingMethod(response[0].element_id));
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

        if (JSON.stringify(deliveryOptions.shippingMethod) !== JSON.stringify(newShippingMethod)) {
          deliveryOptions.shippingMethod = newShippingMethod;

          if (!isMyParcelMethod && !methodIsAllowed) {
            deliveryOptions.triggerEvent(deliveryOptions.disableDeliveryOptionsEvent);
          }
        }
      },

      /**
       * Hide the shipping methods the delivery options should replace.
       */
      hideShippingMethods: function() {
        checkout.allowedShippingMethods().forEach(function(shippingMethod) {
          var element = deliveryOptions.getShippingMethodRow(shippingMethod);

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

      /**
       * Get the new shipping method that should be saved.
       *
       * @param {String} methodCode - Method code to use to find a method.
       *
       * @returns {Object}
       */
      getNewShippingMethod: function(methodCode) {
        var newShippingMethod = [];
        var matchingShippingMethod = checkout.findRateByMethodCode(methodCode);

        if (matchingShippingMethod) {
          return matchingShippingMethod;
        } else {
          /**
           * If the method doesn't exist, loop through the allowed shipping methods and return the first one that
           *  matches.
           */
          window.MyParcelConfig.methods.forEach(function(method) {
            var foundMethod = checkout.findRateByMethodCode(method);

            if (foundMethod) {
              newShippingMethod.push(foundMethod);
            }
          });

          return newShippingMethod.length ? newShippingMethod[0] : null;
        }
      },
    };

    return deliveryOptions;
  }
);
