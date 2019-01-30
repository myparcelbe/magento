/**
 * Copyright © 2013-2017 Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */
/*browser:true*/
/*global define*/
define(
    [
        'uiComponent',
        'Magento_Checkout/js/model/quote',
        'Magento_Catalog/js/price-utils',
        'myparcelbe_init_shipping_options'
        'MyParcelBE_Magento/js/checkout/shipping_method/show-myparcel-shipping-method'
    ],
    function (Component, quote, priceUtils, MyParcelBE) {
        "use strict";

        return Component.extend({
            defaults: {
                template: 'Magento_Tax/checkout/shipping_method/price'
            },

            isDisplayShippingPriceExclTax: window.checkoutConfig.isDisplayShippingPriceExclTax,
            isDisplayShippingBothPrices: window.checkoutConfig.isDisplayShippingBothPrices,
            isPriceEqual: function(item) {
                return item.price_excl_tax != item.price_incl_tax;
            },
            getFormattedPrice: function (price) {
                //todo add format data

                MyParcelBE.loadOptions();

                return priceUtils.formatPrice(price, quote.getPriceFormat());
            }
        });
    }
);
