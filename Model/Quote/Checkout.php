<?php
/**
 * Created by PhpStorm.
 * User: reindert
 * Date: 01/06/2017
 * Time: 14:51
 */

namespace MyParcelBE\Magento\Model\Quote;


use MyParcelBE\Magento\Model\Sales\Repository\PackageRepository;

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
     * Checkout constructor.
     * @param \Magento\Checkout\Model\Session $session
     * @param \Magento\Checkout\Model\Cart $cart
     * @param \MyParcelBE\Magento\Helper\Checkout $helper
     * @param PackageRepository $package
     */
    public function __construct(
        \Magento\Checkout\Model\Session $session,
        \Magento\Checkout\Model\Cart $cart,
        \MyParcelBE\Magento\Helper\Checkout $helper,
        PackageRepository $package
    ) {
        $this->helper = $helper;
        $this->quoteId = $session->getQuoteId();
        $this->products = $cart->getItems();
        $this->package = $package;
    }

    /**
     * Get settings for MyParcel checkout
     *
     * @return array
     */
    public function getCheckoutSettings()
    {
        $this->helper->setBasePriceFromQuote($this->quoteId);

        $this->data = [
            'general' => $this->getGeneralData(),
            'delivery' => $this->getDeliveryData(),
            'pickup' => $this->getPickupData(),
        ];

        $this
            ->setExcludeDeliveryTypes();

        return ['root' => [
            'version' => (string)$this->helper->getVersion(),
            'data' => (array)$this->data
        ]];
    }

    /**
     * Get general data
     *
     * @return array)
     */
    private function getGeneralData()
    {
        return [
            'base_price' => $this->helper->getMoneyFormat($this->helper->getBasePrice()),
            'cutoff_time' => $this->helper->getTimeConfig('general/cutoff_time'),
            'dropoff_days' => $this->helper->getArrayConfig('general/dropoff_days'),
            'dropoff_delay' => $this->helper->getIntergerConfig('general/dropoff_delay'),
            'parent_carrier' => $this->helper->getParentCarrierNameFromQuote($this->quoteId),
            'parent_method' => $this->helper->getParentMethodNameFromQuote($this->quoteId),
        ];
    }

    /**
     * Get delivery data
     *
     * @return array)
     */
    private function getDeliveryData()
    {
        $deliveryData = [
            'delivery_title' => $this->helper->getCheckoutConfig('delivery/delivery_title'),
            'signature_active' => $this->helper->getBoolConfig('delivery/signature_active'),
            'signature_title' => $this->helper->getCheckoutConfig('delivery/signature_title'),
            'signature_fee' => $this->helper->getMethodPriceFormat('delivery/signature_fee', false),
            'saturday_active' => $this->helper->getBoolConfig('delivery/saturday_active'),
            'saturday_title' => $this->helper->getCheckoutConfig('delivery/saturday_title'),
            'saturday_fee' => $this->helper->getMethodPriceFormat('delivery/saturday_fee', false),
        ];

        if ($deliveryData['signature_active'] === false) {
            $deliveryData['signature_fee'] = 'disabled';
        }

	    if ($deliveryData['saturday_active'] === false) {
		    $deliveryData['saturday_fee'] = 'disabled';
	    }

        return $deliveryData;
    }

    /**
     * Get pickup data
     *
     * @return array)
     */
    private function getPickupData()
    {
        return [
            'active' => $this->helper->getBoolConfig('pickup/active'),
            'title' => $this->helper->getCheckoutConfig('pickup/title'),
            'fee' => $this->helper->getMethodPriceFormat('pickup/fee'),
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

        if ($this->data['pickup']['active'] == false) {
            $excludeDeliveryTypes[] = '4';
        }

        $result = implode(';', $excludeDeliveryTypes);

        $this->data['general']['exclude_delivery_types'] = $result;

        return $this;
    }
}
