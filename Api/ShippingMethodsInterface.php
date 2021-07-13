<?php

namespace MyParcelBE\Magento\Api;

/**
 * Get delivery options
 */
interface ShippingMethodsInterface
{
    /**
     * @param mixed $deliveryOptions
     *
     * @return mixed[]
     * @api
     */
    public function getFromDeliveryOptions($deliveryOptions);
}
