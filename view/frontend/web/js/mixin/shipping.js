define([
  'ko',
  'MyParcelBE_Magento/js/view/delivery-options',
  'MyParcelBE_Magento/js/model/checkout',
], function(
  ko,
  deliveryOptions,
  checkout
) {
  'use strict';

  var shippingMethodRowClass = 'shipping-methods__row';

  /**
   * Extend, add or modify any functionality in this object.
   *
   * @type {Object}
   */
  var mixin = {
    defaults: {
      shippingMethodListTemplate: 'MyParcelBE_Magento/shipping-address/shipping-method-list',
      shippingMethodItemTemplate: 'MyParcelBE_Magento/shipping-address/shipping-method-item',
    },

    /**
     * Override the initialize module, using it to add new properties to the original module. Without this they can't
     *  be called from the shipping method item template, for example.
     */
    initialize: function() {
      this._super();

      /**
       * Bind the boolean dictating whether the delivery options can be showed or not. Influences whether the delivery
       *  options div is rendered.
       *
       * @type {Boolean}
       *
       * @see template/shipping-method-list.html
       */
      this.hasMyParcelDeliveryOptions = checkout.hasDeliveryOptions;

      /**
       * Handler used in afterRender attribute of shipping methods.
       *
       * @type {function}
       *
       * @see template/shipping-method-item.html
       */
      this.afterRenderShippingMethod = afterRenderShippingMethod;

      /**
       * To not have to repeat a string multiple times and put it hard coded into templates.
       *
       * @type {String}
       *
       * @see template/shipping-method-item.html
       */
      this.shippingMethodRowClass = shippingMethodRowClass;
    },
  };

  /**
   * Triggered after each shipping method is rendered. Once they are all loaded, initialize the checkout script and
   *  based on that initialize the delivery options (or not.
   *
   * @see MyparcelBE/Magento/view/frontend/web/template/shipping-address/shipping-method-list.html
   *
   * @param {Object} elements - The rendered elements for each method.
   * @param {Array.<Object>} rates - All rates that will be rendered.
   */
  function afterRenderShippingMethod(elements, rates) {
    var allRatesRendered = document.querySelectorAll('.' + shippingMethodRowClass).length === rates.length;

    if (allRatesRendered) {
      checkout.initialize();
    }

    /**
     * Subscribe to the hasDeliveryOptions boolean. If it is true, initialize the delivery options module.
     */
    checkout.hasDeliveryOptions.subscribe(function(bool) {
      if (bool === true) {
        deliveryOptions.initialize();
      }
    });
  }

  /**
   * Return the original module, extended by our mixin.
   *
   * @param {function} targetModule - The extended module.
   *
   * @returns {*}
   */
  return function(targetModule) {
    return targetModule.extend(mixin);
  };
});
