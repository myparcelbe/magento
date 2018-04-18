define(
    [
        'mage/url',
        'uiComponent',
        'Magento_Checkout/js/model/quote',
        'Magento_Customer/js/model/customer',
        'Magento_Checkout/js/checkout-data',
        'jquery',
        'myparcelbe_options_template',
        'MyParcelBE_Magento/js/lib/moment.min',
        'myparcelbe_lib_myparcel'
    ],
    function(mageUrl, uiComponent, quote, customer, checkoutData, $, optionsHtml, moment, MyParcel) {
        'use strict';

        var  originalShippingRate, optionsContainer, isLoading, myparcel, delivery_options_input, myparcel_method_alias, myparcel_method_element, isLoadingAddress;

        return {
            loadOptions: loadOptions,
            showOptions: showOptions,
            hideOptions: hideOptions
        };

        function loadOptions() {
            if (typeof window.mypa === 'undefined') {
                window.mypa = {isLoading: false, fn: {}};
            }
            window.mypa.fn.hideOptions = hideOptions;
            window.mypa.moment = moment;

            if (window.mypa.isLoading === false) {
                _hideRadios();
                window.mypa.isLoading = true;
                isLoading = setTimeout(function(){
                    clearTimeout(isLoading);
                    _hideRadios();

                    $.ajax({
                        url: mageUrl.build('rest/V1/delivery_settings/get'),
                        type: "GET",
                        dataType: 'json',
                        showLoader: true
                    }).done(function (response) {
                        window.mypa.data = response[0].data;
                        init();

                        window.mypa.isLoading = false;
                    });

                }, 50);
            }
        }

        function init() {
            if ((myparcel_method_alias = window.mypa.data.general.parent_carrier) === null) {
                return void 0;
            }

            myparcel_method_element = "input[id^='s_method_" + myparcel_method_alias + "_']";
            checkAddress();
        }

        function checkAddress() {
            isLoadingAddress = setTimeout(function(){
                clearTimeout(isLoadingAddress);
                _setAddress();
                _hideRadios();

                if (_getCcIsLocal() && _getHouseNumber() !== null) {
                    _appendTemplate();
                    _setParameters();
                    showOptions();
                } else {
                    $(myparcel_method_element + ":first").parent().parent().show();
                    hideOptions();
                }
            }, 1000);
        }

        function _setAddress() {
            if (customer.isLoggedIn()) {
                var street0 = quote.shippingAddress._latestValue.street[0];
                if (typeof street0 === 'undefined') street0 = '';
                var street1 = quote.shippingAddress._latestValue.street[1];
                if (typeof street1 === 'undefined') street1 = '';
                var street2 = quote.shippingAddress._latestValue.street[2];
                if (typeof street2 === 'undefined') street2 = '';
                var country = quote.shippingAddress._latestValue.countryId;
                if (typeof country === 'undefined') country = '';
                var postcode = quote.shippingAddress._latestValue.postcode;
                if (typeof postcode === 'undefined') postcode = '';
            } else {
                var street0 = $("input[name='street[0]']").val();
                if (typeof street0 === 'undefined') street0 = '';
                var street1 = $("input[name='street[1]']").val();
                if (typeof street1 === 'undefined') street1 = '';
                var street2 = $("input[name='street[2]']").val();
                if (typeof street2 === 'undefined') street2 = '';
                var country = $("select[name='country_id']").val();
                if (typeof country === 'undefined') country = '';
                var postcode = $("input[name='postcode']").val();
                if (typeof postcode === 'undefined') postcode = '';
            }

            window.mypa.address = [];
            window.mypa.address.street0 = street0.replace(/[<>=]/g,'');
            window.mypa.address.street1 = street1.replace(/[<>=]/g,'');
            window.mypa.address.street2 = street2.replace(/[<>=]/g,'');
            window.mypa.address.cc = country.replace(/[<>=]/g,'');
            window.mypa.address.postcode = postcode.replace(/[\s<>=]/g,'');
        }

        function showOptions() {
            originalShippingRate = $("td[id^='label_carrier_" + window.mypa.data.general.parent_method + "']").parent();
            optionsContainer.show();

            if (typeof originalShippingRate !== 'undefined') {
                originalShippingRate.hide();
            }
        }

        function hideOptions() {
            if (typeof optionsContainer != 'undefined') {
                optionsContainer.hide();
            }
            $(myparcel_method_element + ':first').parent().parent().show();
        }

        function _hideRadios() {
            $(
                "td[id^='label_method_signature']," +
                "td[id^='label_method_pickup']," +
                "td[id^='label_method_saturday']"
            ).parent().hide();
        }

        function _getCcIsLocal() {
            if (window.mypa.address.cc !== 'BE') {
                return false;
            }

            return true;
        }

        function _getFullStreet() {
            return (window.mypa.address.street0 + ' ' + window.mypa.address.street1 + ' ' + window.mypa.address.street2).trim();
        }

        function _getHouseNumber() {
            var fullStreet = _getFullStreet();
            var streetParts = fullStreet.match(/[^\d]+([0-9]{1,4})[^\d]*/);
            if (streetParts !== null) {
                return streetParts[1];
            } else {
                var streetParts = fullStreet.match(/(.*?)\s?(([\d]+)[\s|-]?([a-zA-Z/\s]{0,5}$|[0-9/]{0,5}$|\s[a-zA-Z]{1}[0-9]{0,3}$|\s[0-9]{2}[a-zA-Z]{0,3}$))$/);
                return streetParts !== null ? streetParts[3] : null;
            }
        }

        function _observeFields() {
            delivery_options_input = $("input[name='delivery_options']");

            $("input[id^='s_method']").parent().on('change', function (event) {
                setTimeout(function(){
                    if ($(myparcel_method_element + ':checked').length === 0) {
                        delivery_options_input.val('');
                        myparcel.optionsHaveBeenModified();
                    }
                }, 50);
            });

            $("input[name^='street'],input[name='postcode'],input[name^='pc_postcode'],select[name^='pc_postcode']").on('change', function (event) {
                setTimeout(function(){
                    checkAddress();
                }, 100);
            });

            delivery_options_input.on('change', function (event) {
                _checkShippingMethod();
            });
        }

        function _setParameters() {
            var data = window.mypa.data;
            var myParcelConfig = {
                apiBaseUrl: 'https://api.myparcel.nl/',
                carrierCode: 2,
                countryCode: 'BE',
                number: _getHouseNumber(),
                street: _getFullStreet(),
                postal_code: window.mypa.address.postcode,
                parent_carrier: data.general.parent_carrier,
                parent_method: data.general.parent_method,
                cutoffTime: data.general.cutoff_time,
                dropOffDelay: data.general.dropoff_delay,
                excludeDeliveryType: data.general.exclude_delivery_types,
                dropOffDays: data.general.dropoff_days,
                allowBpostSaturdayDelivery: data.delivery.saturday_active,
                priceBpostSaturdayDelivery: data.delivery.saturday_fee,
                allowBpostAutograph: data.delivery.signature_active,
                priceBpostAutograph: data.delivery.signature_fee
            };


            MyParcel.init(myParcelConfig);
            MyParcel.bind();
        }

        function _appendTemplate() {
            if ($('#myparcel_td').length === 0) {
                var data = window.mypa.data;

                originalShippingRate = $("td[id^='label_carrier_" + window.mypa.data.general.parent_method + "']").parent();
                optionsContainer = originalShippingRate.parent().prepend('<tr><td colspan="5" id="myparcel_td" >Bezig met laden...</td></tr>').find('#myparcel_td');

                optionsContainer.html(optionsHtml);
                $('#mypa-pickup_title').html(data.pickup.title);
                $('#mypa-delivery_title').html(data.delivery.delivery_title);

                _observeFields();
            }
        }

        function _checkShippingMethod() {
            var inputValue, json, type;

            inputValue = delivery_options_input.val();
            if (inputValue === '') {
                return;
            }

            json = $.parseJSON(inputValue);

            if (typeof json.time[0].price_comment !== 'undefined') {
                type = json.time[0].price_comment;
            } else {
                type = json.price_comment;
            }

            switch (type) {
                case "standard":
                    if (json.options.signature) {
                        _checkMethod('input[value=' + myparcel_method_alias + '_signature' + ']');
                    } else {
                        _checkMethod('input[value=' + myparcel_method_alias + '_' + window.mypa.data.general.parent_method + ']');
                    }
                    myparcel.showDays();
                    break;
                case "retail":
                    _checkMethod('input[value=' + myparcel_method_alias + '_pickup' + ']');
                    myparcel.hideDays();
                    break;
            }
        }

        function _checkMethod(selector) {
            $(".col-method > input[type='radio']").prop("checked", false).change();
            $(selector).prop("checked", true).change().trigger('click');
        }
    }
);
