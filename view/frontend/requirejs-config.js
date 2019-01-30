/**
 * Override Magento classes
 *
 * @type {{map: {"*": {"Magento_Tax/js/view/checkout/shipping_method/price": string, "Magento_Checkout/js/model/shipping-save-processor/default": string}}}}
 */
var config = {
    map: {
        '*': {
            'Magento_Tax/js/view/checkout/shipping_method/price': 'MyParcelBE_Magento/js/action/price',
            "Magento_Checkout/js/model/shipping-save-processor/default" : "MyParcelBE_Magento/js/model/shipping-save-processor-default"
        }
    }
};
