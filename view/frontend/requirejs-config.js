/* eslint-disable max-len,no-unused-vars */

/**
 * Override Magento classes.
 *
 * @type {Object}
 */
var config = {
  map: {
    '*': {
      'Magento_Checkout/js/model/shipping-save-processor/default': 'MyParcelBE_Magento/js/model/shipping-save-processor-default',
      'Magento_Checkout/js/view/shipping': 'MyParcelBE_Magento/js/view/shipping',
    },
  },
};
