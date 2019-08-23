define(
    ['jquery'],
    function ($) {
        'use strict';

        return function NewShipment(options, element)
        {

            var model = {

                /**
                 * Initializes observable properties.
                 *
                 * @returns {NewShipment} Chainable.
                 */
                initialize: function (options, element) {
                    this.options = options;
                    this.element = element;
                    this._setOptionsObserver();
                    return this;
                },

                /**
                 * MyParcel action observer
                 *
                 * @protected
                 */
                _setOptionsObserver: function () {
                    var parentThis = this;
                    $("input[name='mypa_create_from_observer']").on(
                        "change",
                        function () {
                            if ($('#mypa_create_from_observer').prop('checked')) {
                                console.log('mypa_create_from_observer yes');
                                $('.mypa-option-toggle').slideDown();
                                parentThis._checkPackageField();
                            } else {
                                $('.mypa-option-toggle').slideUp();
                            }
                        }
                    );
                    $("#mypa_carrier_bpost").click(
                        function () {
                            var selValue = $("#mypa_carrier_bpost").val();
                            console.log(selValue);
                            if ($('#mypa_carrier_bpost').prop("checked", true)) {
                                $('.mypa-option-toggle').slideDown();
                                parentThis._checkPackageField();
                            } else {
                                $('.mypa-option-toggle').slideUp();
                            }
                        }
                    );

                    $("input[name='mypa_package_type']").on(
                        "change",
                        function () {
                            parentThis._checkPackageField();
                        }
                    );

                    return this;
                },

                _checkPackageField: function () {
                    if ($('#mypa_package_type-package').prop('checked')) {
                        $('.mypa_package-toggle').show();
                    } else {
                        $('.mypa_package-toggle').hide();
                    }
                }
            };

            model.initialize(options, element);
            return model;
        };
    }
);