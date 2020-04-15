<?php

declare(strict_types=1);

namespace MyParcelBE\Magento\Adapter;

use MyParcelNL\Sdk\src\Adapter\DeliveryOptions\AbstractDeliveryOptionsAdapter;
use MyParcelNL\Sdk\src\Adapter\DeliveryOptions\AbstractShipmentOptionsAdapter;

class ShipmentOptionsFromAdapter extends AbstractShipmentOptionsAdapter
{
    const DEFAULT_INSURANCE = 0;

    /**
     * @param array $inputData
     */
    public function __construct(array $inputData)
    {
        $options              = $inputData ?? [];
        $this->signature      = ($options['signature'] ?? false);
        $this->only_recipient = ($options['only_recipient'] ?? false);
        $this->insurance      = ($options['insurance'] ?? self::DEFAULT_INSURANCE);
    }
}
