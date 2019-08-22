/* eslint-disable no-underscore-dangle,id-match,no-undef */
define(
  [
    'mage/url',
    'uiComponent',
    'Magento_Checkout/js/model/quote',
    'Magento_Customer/js/model/customer',
    'Magento_Checkout/js/checkout-data',
    'text!MyParcelBE_Magento/template/checkout/options.html',
    'text!MyParcelBE_Magento/css/checkout/options-dynamic.min.css',
    'MyParcelBE_Magento/js/lib/myparcel',
    'Magento_Checkout/js/action/set-shipping-information',
  ],
  // eslint-disable-next-line max-params,max-lines-per-function
  function(
    mageUrl,
    uiComponent,
    quote,
    customer,
    checkoutData,
    optionsHtml,
    cssDynamic,
    moment,
    setShippingInformationAction
  ) {
    'use strict';

    var MyParcelFrontend = {
      split_street_regex: /(.*?)\s?(\d{1,4})[/\s-]{0,2}([A-z]\d{1,3}|-\d{1,4}|\d{2}\w{1,2}|[A-z][A-z\s]{0,3})?$/,

      checkoutDataField: '#mypa-input',

      updateCheckoutEvent: 'myparcel_update_checkout',
      updatedCheckoutEvent: 'myparcel_checkout_updated',
      updatedAddressEvent: 'address_updated',

      /**
       * Initialize the script.
       */
      init: function() {
        MyParcelFrontend.update_settings();

        /**
         * Event from the checkout
         */
        document.addEventListener(this.updatedCheckoutEvent, function() {
          console.warn(MyParcelFrontend.updatedCheckoutEvent, document.querySelector(this.checkoutDataField).value);
        });
      },

      /**
       * Run the split street regex on the given full address to extract the house number and return it.
       *
       * @param {String} address - Full address.
       *
       * @returns {String|undefined} - The house number, if found. Otherwise null.
       */
      getHouseNumber: function(address) {
        var result = this.split_street_regex.exec(address);
        var numberIndex = 2;

        return result ? result[numberIndex] : null;
      },

      /**
       * Tell the checkout to hide itself.
       */
      hideDeliveryOptions: function() {
        this.triggerEvent('myparcel_hide_checkout');
        if (MyParcelFrontend.isUpdated()) {
          this.triggerEvent('update_checkout');
        }
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
       */
      update_settings: function() {
        var data = JSON.parse(window.MyParcelConfig);

        data.address = {
          cc: MyParcelFrontend.getField('country').value,
          postalCode: MyParcelFrontend.getField('postcode').value,
          number: MyParcelFrontend.getHouseNumber(),
          city: MyParcelFrontend.getField('city').value,
        };

        window.MyParcelConfig = JSON.stringify(data);
        MyParcelFrontend.triggerEvent('myparcel_update_checkout');
      },

      /**
       * Get the address entered by the user depending on if they are logged in or not.
       *
       * @returns {Object}
       */
      getAddress: function() {
        var address;

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

        var regExp = /[<>=]/g;

        var street = [
          address.street0,
          address.street1,
          address.street2,
        ].join(' ');

        var number = this.getHouseNumber(street);

        return {
          number: number,
          cc: address.country.replace(regExp, ''),
          postcode: address.postcode.replace(/[\s<>=]/g, ''),
          city: address.city.replace(regExp, ''),
        }
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
    };
  }
);
