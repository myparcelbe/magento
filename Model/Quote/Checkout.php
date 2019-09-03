<?php
/**
 * Created by PhpStorm.
 * User: reindert
 * Date: 01/06/2017
 * Time: 14:51
 */

namespace MyParcelBE\Magento\Model\Quote;

use MyParcelBE\Magento\Helper\Data;
use MyParcelBE\Magento\Model\Sales\Repository\PackageRepository;
use \Magento\Store\Model\StoreManagerInterface;

class Checkout
{
    const carrierPath = 1;
    const carriers    = 0;

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
                $this->getDeliveryData()
            ),
            'strings' => $this->getCheckoutStrings(),
        ];

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
            'apiBaseUrl' => 'https://edie.api.staging.myparcel.nl/', // todo
            'carriers'   => 'bpost,dpd',
            'platform'   => 'belgie',
            'currency'   => $this->currency->getStore()->getCurrentCurrency()->getCode()
        ];
    }

    /**
     * Get delivery data
     *
     * @return array)
     */
    private function getDeliveryData()
    {
        $carriersPath   = $this->get_carriers();
        $myParcelConfig = [];

        foreach ($carriersPath as $carrier) {

            $myParcelConfig["carrierSettings"][$carrier[self::carriers]] = [
                'allowDeliveryOptions' => $this->helper->getBoolConfig($carrier[self::carrierPath], 'general/enabled'),
                'allowSignature'       => $this->helper->getBoolConfig($carrier[self::carrierPath], 'delivery/signature_active'),
                'allowPickupLocations' => $this->helper->getBoolConfig($carrier[self::carrierPath], 'pickup/active'),

                'priceSignature'        => $this->helper->getMethodPriceFormat($carrier[self::carrierPath], 'delivery/signature_fee', false),
                'priceStandardDelivery' => $this->helper->getMoneyFormat($this->helper->getBasePrice()),
                'pricePickup'           => $this->helper->getMethodPriceFormat($carrier[self::carrierPath], 'pickup/fee', false),

                'cutoffTime'         => $this->helper->getTimeConfig($carrier[self::carrierPath], 'general/cutoff_time'),
                'deliveryDaysWindow' => $this->helper->getIntergerConfig($carrier[self::carrierPath], 'general/deliverydays_window'),
                'dropOffDays'        => $this->helper->getArrayConfig($carrier[self::carrierPath], 'general/dropoff_days'),
                'dropOffDelay'       => $this->helper->getIntergerConfig($carrier[self::carrierPath], 'general/dropoff_delay'),
            ];
        }

        return $myParcelConfig;
    }

    /**
     * Get the array of enabled carriers by checking if they have either delivery or pickup enabled.
     *
     * @return array
     */
    private function get_carriers(): array
    {
        $carriersSettings = [
            ['bpost', Data::XML_PATH_BPOST_SETTINGS],
            ['dpd', Data::XML_PATH_DPD_SETTINGS]
        ];

        foreach ($carriersSettings as $carrier) {
            if ($this->helper->getBoolConfig("{$carrier[self::carrierPath]}", 'general/enabled') ||
                $this->helper->getBoolConfig("{$carrier[self::carrierPath]}", 'pickup/active')
            ) {
                $carriers[] = $carrier;
            }
        }
        return $carriers;
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

            'wrongPostalCodeCity' => __('Postcode/city combination unknown'),
            'addressNotFound'     => __('Address details are not entered'),
            'closed'              => __('Closed'),
            'retry'               => __('Again'),
            'pickUpFrom'          => __('Pick up from'),
            'openingHours'        => __('Opening hours'),

            'cityText'       => __('City'),
            'postalCodeText' => __('Postcode'),
            'numberText'     => __('House number'),
            'city'           => __('City'),
            'postcode'       => __('Postcode'),
            'houseNumber'    => __('House number'),
        ];
    }
}
