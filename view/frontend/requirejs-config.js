var config = {
    map: {
        '*': {
            'Magento_Tax/js/view/checkout/shipping_method/price': 'MyParcelBE_Magento/js/action/price',
            "Magento_Checkout/js/model/shipping-save-processor/default" : "MyParcelBE_Magento/js/model/shipping-save-processor-default",
            'myparcelnl_init_shipping_options': 'MyParcelBE_Magento/js/checkout/shipping_method/show-myparcel-shipping-method',
            'myparcelbe_lib_myparcel': 'MyParcelBE_Magento/js/lib/myparcel',
            'myparcelbe_options_template': 'text!MyParcelBE_Magento/template/checkout/options.html',
            'myparcelbe_options_css-dynamic': 'text!MyParcelBE_Magento/css/checkout/options-dynamic.min.css'
        }
    }
};
