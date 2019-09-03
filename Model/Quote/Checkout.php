<?php
/**
 * Created by PhpStorm.
 * User: reindert
 * Date: 01/06/2017
 * Time: 14:51
 */

namespace MyParcelBE\Magento\Model\Quote;

use MyParcelBE\Magento\Model\Sales\Repository\PackageRepository;
use \Magento\Store\Model\StoreManagerInterface;

class Checkout
{
    /**
     * @var array
     */
    private $data = [];

    /**
     * @var \MyParcelBE\Magento\Helper\Checkout
     */
    private $helper;

    /**
     * @var \Magento\Quote\Model\Quote
     */
    private $quoteId;
    /**
     * @var PackageRepository
     */
    private $package;

    /**
     * @var \Magento\Eav\Model\Entity\Collection\AbstractCollection[]
     */
    private $products;

    /**
     * @var \Magento\Store\Model\StoreManagerInterface
     */
    private $currency;

    /**
     * Checkout constructor.
     *
     * @param \Magento\Checkout\Model\Session            $session
     * @param \Magento\Checkout\Model\Cart               $cart
     * @param \MyParcelBE\Magento\Helper\Checkout        $helper
     * @param PackageRepository                          $package
     * @param \Magento\Store\Model\StoreManagerInterface $currency
     */
    public function __construct(
        \Magento\Checkout\Model\Session $session,
        \Magento\Checkout\Model\Cart $cart,
        \MyParcelBE\Magento\Helper\Checkout $helper,
        PackageRepository $package,
        StoreManagerInterface $currency
    ) {
        $this->helper   = $helper;
        $this->quoteId  = $session->getQuoteId();
        $this->products = $cart->getItems();
        $this->package  = $package;
        $this->currency = $currency;
    }

    /**
     * Get settings for MyParcel checkout
     *
     * @return array
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    public function getCheckoutSettings()
    {
        $this->helper->setBasePriceFromQuote($this->quoteId);

        $this->data = [
            'config'  => array_merge(
                $this->getGeneralData(),
                $this->getDeliveryData(),
                $this->getPickupData()
            ),
            'strings' => $this->getCheckoutStrings(),
        ];

        $this->setExcludeDeliveryTypes();

        return [
            'root' => [
                'version' => (string) $this->helper->getVersion(),
                'data'    => (array) $this->data
            ]
        ];
    }

    /**
     * Get general data
     *
     * @return array)
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    private function getGeneralData()
    {
        return [
            'carriers' => 'bpost,dpd', // todo
            'platform' => 'belgie',
            'currency' =>  $this->currency->getStore()->getCurrentCurrency()->getCode(),

            'cutoffTime'         => $this->helper->getTimeConfig('general/cutoff_time'),
            'deliveryDaysWindow' => $this->helper->getIntergerConfig('general/deliverydays_window'),
            'dropOffDays'        => $this->helper->getArrayConfig('general/dropoff_days'),
            'dropOffDelay'       => $this->helper->getIntergerConfig('general/dropoff_delay'),

            'carrierSettings' => [], // todo
        ];
    }

    /**
     * Get delivery data
     *
     * @return array)
     */
    private function getDeliveryData()
    {
        return [
            'allowDeliveryOptions'  => true, // todo
            'allowSignature'        => $this->helper->getBoolConfig('delivery/signature_active'),
            'allowSaturdayDelivery' => $this->helper->getBoolConfig('general/saturday_active'),

            'priceSignature'        => $this->helper->getMethodPriceFormat('delivery/signature_fee', false),
            'priceStandardDelivery' => $this->helper->getMoneyFormat($this->helper->getBasePrice()),
            'priceSaturdayDelivery' => $this->helper->getMethodPriceFormat('general/saturday_fee', false),
        ];
    }

    /**
     * Get pickup data
     *
     * @return array)
     */
    private function getPickupData()
    {
        return [
            'allowPickupPoints' => $this->helper->getBoolConfig('pickup/active'),
            'pricePickup'       => $this->helper->getMethodPriceFormat('pickup/fee', false),
        ];
    }

    /**
     * Get checkout text
     *
     * @return array
     */
    private function getCheckoutStrings()
    {
        return [

            'deliveryTitle'         => $this->helper->getGeneralConfig('delivery_titles/delivery_title'),
            'deliveryStandardTitle' => $this->helper->getGeneralConfig('delivery_titles/standard_delivery_title'),
            'pickupTitle'           => $this->helper->getGeneralConfig('delivery_titles/pickup_title'),
            'signatureTitle'        => $this->helper->getGeneralConfig('delivery_titles/signature_title'),
            'saturdayDeliveryTitle' => $this->helper->getGeneralConfig('delivery_titles/saturday_title'),

            'wrongPostalCodeCity'   => __('Postcode/city combination unknown'),
            'addressNotFound'       => __('Address details are not entered'),
            'closed'                => __('Closed'),
            'retry'                 => __('Again'),
            'pickUpFrom'            => __('Pick up from'),
            'openingHours'          => __('Opening hours'),

            'cityText'              => __('City'),
            'postalCodeText'        => __('Postcode'),
            'numberText'            => __('House number'),
            'city'                  => __('City'),
            'postcode'              => __('Postcode'),
            'houseNumber'           => __('House number'),
        ];
    }

    /**
     * This options allows the Merchant to exclude delivery types
     *
     * @return $this
     */
    private function setExcludeDeliveryTypes()
    {
        $excludeDeliveryTypes = [];

        if ($this->data['config']['allowPickupPoints'] == false) {
            $excludeDeliveryTypes[] = '4';
        }

        $result = implode(';', $excludeDeliveryTypes);

        $this->data['general']['exclude_delivery_types'] = $result;

        return $this;
    }
}
