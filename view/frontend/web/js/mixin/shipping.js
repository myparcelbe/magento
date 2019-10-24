define([
  'mage/utils/wrapper',
  'uiRegistry',
  '../delivery-options',
], function(
  wrapper,
  uiRegistry,
  MyParcelFrontend
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

    initialize: function() {
      this._super();

      /*
       * Add properties to the module.
       */

      this.afterRenderShippingMethod = afterRenderShippingMethod;
      this.shippingMethodRowClass = shippingMethodRowClass;
    },

    selectShippingMethod: function(newShippingMethod) {
      MyParcelFrontend.onShippingMethodUpdate(newShippingMethod);
      this._super();
    },
  };

  /**
   * Triggered after each shipping method is rendered. Once they are all loaded, initialize the MyParcelFrontend script.
   *
   * @see MyparcelBE/Magento/view/frontend/web/template/shipping-address/shipping-method-list.html
   *
   * @param {Object} elements - The rendered elements for each method.
   * @param {Array.<Object>} rates - All rates that will be rendered.
   */
  function afterRenderShippingMethod(elements, rates) {
    if (document.querySelectorAll('.' + shippingMethodRowClass).length === rates.length) {
      MyParcelFrontend.initialize();
    }
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
