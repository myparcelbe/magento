/* eslint-disable max-len,no-unused-vars */

/**
 * Override Magento classes.
 *
 * @type {Object}
 */
var config = {
  config: {
    mixins: {
      'Magento_Checkout/js/view/shipping': {'MyParcelBE_Magento/js/mixin/shipping': true},
    },
  },
  map: {
    '*': {
      'Magento_Checkout/js/model/shipping-save-processor/default': 'MyParcelBE_Magento/js/model/shipping-save-processor-default',
    },
  },
};
