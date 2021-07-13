define(
  ['jquery'],
  function($) {
    'use strict';

    return function NewShipment(options, element) {

      var model = {

        /**
         * Initializes observable properties.
         *
         * @returns {NewShipment} Chainable.
         */
        initialize: function(options, element) {
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
        _setOptionsObserver: function() {
          var parentThis = this;
          $('input[name=\'mypa_create_from_observer\']').on(
            'change',
            function() {
              if ($('#mypa_create_from_observer').prop('checked')) {
                $('.mypa_carrier-toggle').slideDown();
                parentThis._checkCarrierField();
                parentThis._checkOptionsField();

              } else {
                $('.mypa-option-toggle').slideUp();
                $('.mypa_carrier-toggle').slideUp();
              }
            },
          );

          $('input[name=\'mypa_carrier\']').on(
            'change',
            function() {
              parentThis._checkOptionsField();
            },
          );

          return this;
        },

        _checkOptionsField: function() {
          if ($('#mypa_carrier_PostNL').prop('checked')) {
            $('.mypa-option-toggle-PostNL').slideDown();
            $('.mypa-option-toggle-bpost').slideUp();
          } else if ($('#mypa_carrier_bpost').prop('checked')) {
            $('.mypa-option-toggle-PostNL').slideUp();
            $('.mypa-option-toggle-bpost').slideDown();
          } else {
            $('.mypa-option-toggle-PostNL').slideUp();
            $('.mypa-option-toggle-bpost').slideUp();
          }
        },

        _checkCarrierField: function() {
          $('.mypa_carrier-toggle').show();
        },
      };

      model.initialize(options, element);
      return model;
    };
  },
);
