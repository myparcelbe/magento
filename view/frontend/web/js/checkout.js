/* eslint-disable no-underscore-dangle */
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

    window.addEventListener('load', function() {

      if (!window.hasOwnProperty('MyParcel')) {

      }

      var MyParcelFrontend = {
        split_street_regex: /(.*?)\s?(\d{1,4})[/\s-]{0,2}([A-z]\d{1,3}|-\d{1,4}|\d{2}\w{1,2}|[A-z][A-z\s]{0,3})?$/,
        is_using_split_address_fields: parseInt(wcmp_display_settings.isUsingSplitAddressFields),

        // checkout_updating: false,
        shipping_method_changed: false,
        force_update: false,

        selected_shipping_method: false,
        updated_shipping_method: false,
        selected_country: false,
        updated_country: false,

        shipping_methods: JSON.parse(wcmp_delivery_options.shipping_methods),
        always_display: wcmp_delivery_options.always_display,

        /**
         * @type {Element}
         */
        shippingFields: document.querySelector('.woocommerce-shipping-fields'),

        /**
         * @type {String}
         */
        addressType: null,

        /**
         * Ship to different address field.
         *
         * @type {String}
         */
        shipToDifferentAddressField: '#ship-to-different-address-checkbox',
        checkoutDataField: '#mypa-input',

        houseNumberField: 'house_number',
        addressField: 'address_1',
        countryField: 'country',
        postcodeField: 'postcode',

        updateCheckoutEvent: 'myparcel_update_checkout',
        updatedCheckoutEvent: 'myparcel_checkout_updated',
        updatedAddressEvent: 'address_updated',

        /**
         * Initialize the script.
         */
        init: function() {
          MyParcelFrontend.addListeners();

          document.querySelector(this.shipToDifferentAddressField).addEventListener('load', this.addListeners);
          document.querySelector(this.shipToDifferentAddressField).addEventListener('change', this.addListeners);

          document.addEventListener(this.updatedAddressEvent, function(event) {
            this.setAddress(event.detail);
          });

          document.addEventListener(this.updatedCheckoutEvent, function() {
            console.warn(MyParcelFrontend.updatedCheckoutEvent, document.querySelector(this.checkoutDataField).value);
          });
        },

        /**
         * Update the #mypa-input with new data.
         *
         * @param {Object} content - Content that will be converted to JSON string.
         */
        updateInput: function(content) {
          content = content || '';
          document.querySelector('#mypa-input').value = JSON.stringify(content);
        },

        /**
         * If split fields are used add house number to the fields. Otherwise use address line 1.
         *
         * @return {string}
         */
        getSplitField: function() {
          return this.is_using_split_address_fields ? MyParcelFrontend.houseNumberField : MyParcelFrontend.addressField;
        },

        updateCountry: function() {
          MyParcelFrontend.updated_country = MyParcelFrontend.getField('country').value;
        },

        /**
         * Add event listeners to the address fields. Remove them first if they already exist.
         */
        addListeners: function() {
          // The fields to add listeners to.
          var fields = [MyParcelFrontend.countryField, MyParcelFrontend.postcodeField, this.getSplitField()];

          // If address type is already set, remove the existing listeners before adding new ones.
          if (MyParcelFrontend.addressType) {
            MyParcelFrontend.getField(MyParcelFrontend.countryField).removeEventListener(
              'change',
              MyParcelFrontend.updateCountry
            );

            fields.forEach(function(field) {
              MyParcelFrontend.getField(field).removeEventListener('change', MyParcelFrontend.update_settings);
            })
          }

          MyParcelFrontend.getAddressType();
          MyParcelFrontend.selected_country = MyParcelFrontend.getField(MyParcelFrontend.countryField).value;

          MyParcelFrontend.getField(MyParcelFrontend.countryField).addEventListener(
            'change',
            MyParcelFrontend.updateCountry
          );

          fields.forEach(function(field) {
            MyParcelFrontend.getField(field).addEventListener('change', MyParcelFrontend.update_settings);
          });

          MyParcelFrontend.update_settings();
        },

        /**
         * Get field by name. Will return element with this selector: "#<billing|shipping>_<name>".
         *
         * @param {string} name - The part after `shipping/billing` in the id of an element in WooCommerce.
         *
         * @returns {Element}
         */
        getField: function(name) {
          return document.querySelector('#' + MyParcelFrontend.addressType + '_' + name);
        },

        /**
         * Update address type.
         */
        getAddressType: function() {
          this.addressType = document.querySelector(MyParcelFrontend.shipToDifferentAddressField).checked
            ? 'shipping'
            : 'billing';
        },

        /**
         * Get the house number from either the house_number field or the address_1 field. If it's the address field use
         * the split street regex to extract the house number.
         *
         * @return {String}
         */
        getHouseNumber: function() {
          if (MyParcelFrontend.is_using_split_address_fields) {
            return MyParcelFrontend.getField('house_number').value;
          }

          var address = MyParcelFrontend.getField('address_1').value;
          var result = MyParcelFrontend.split_street_regex.exec(address);
          var numberIndex = 2;

          return result ? result[numberIndex] : null;
        },

        /**
         * @return {boolean}
         */
        checkCountry: function() {
          console.log('checkCountry');
          if (MyParcelFrontend.updated_country !== false
        && MyParcelFrontend.updated_country !== MyParcelFrontend.selected_country
        // && !isEmptyObject(window.MyParcel.data)
          ) {
            this.update_settings();
            MyParcelFrontend.triggerEvent(MyParcelFrontend.updateCheckoutEvent);
            MyParcelFrontend.selected_country = MyParcelFrontend.updated_country;
          }

          if (MyParcelFrontend.selected_country !== 'NL' && MyParcelFrontend.selected_country !== 'BE') {
            MyParcelFrontend.hideDeliveryOptions();
            return false;
          }

          return true;
        },

        /**
         *
         * @return {*}
         */
        getShippingMethod: function() {
          var shipping_method;
          /* check if shipping is user choice or fixed */
          if (document.querySelector('#order_review .shipping_method').length > 1) {
            shipping_method = document.querySelector('#order_review .shipping_method:checked').value;
          } else {
            shipping_method = document.querySelector('#order_review .shipping_method').value;
          }
          return shipping_method;
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
         *
         * @returns {boolean}
         */
        isUpdated: function() {
          if (MyParcelFrontend.updated_country !== MyParcelFrontend.selected_country
        || MyParcelFrontend.force_update === true) {
            MyParcelFrontend.force_update = false; /* only force once */
            return true;
          }

          return false;
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
         * Set the values of the WooCommerce fields.
         *
         * @param {Object} address
         */
        setAddress: function(address) {
          if (!customer.isLoggedIn()
              || typeof quote === 'undefined'
              || typeof quote.shippingAddress === 'undefined'
              || typeof quote.shippingAddress._latestValue === 'undefined'
              || typeof quote.shippingAddress._latestValue.street === 'undefined'
              || typeof quote.shippingAddress._latestValue.street[0] === 'undefined'
          ) {
            return;
          }

          if (address.postalCode) {
            MyParcelFrontend.getField('postcode').value = address.postalCode;
          }

          if (address.city) {
            MyParcelFrontend.getField('city').value = address.city
          }

          if (address.number) {
            MyParcelFrontend.setHouseNumber(address.number);
          }
        },

        /**
         * Set the house number.
         *
         * @param {String|Number} number
         */
        setHouseNumber: function(number) {
          if (MyParcelFrontend.is_using_split_address_fields) {
            var address = MyParcelFrontend.getField('address_1').value;
            var oldHouseNumber = MyParcelFrontend.getHouseNumber();

            console.log(oldHouseNumber);
            if (oldHouseNumber) {
              MyParcelFrontend.getField('address_1').value = address.replace(oldHouseNumber, number);
            } else {
              MyParcelFrontend.getField('address_1').value = address + number;
            }
          } else {
            MyParcelFrontend.getField('number').value = number;
          }
        },
      };

    });
  }
);
