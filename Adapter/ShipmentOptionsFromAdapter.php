<?php

declare(strict_types=1);

namespace MyParcelBE\Magento\Adapter;

use MyParcelNL\Sdk\src\Adapter\DeliveryOptions\AbstractDeliveryOptionsAdapter;
use MyParcelNL\Sdk\src\Adapter\DeliveryOptions\AbstractShipmentOptionsAdapter;

class ShipmentOptionsFromAdapter extends AbstractShipmentOptionsAdapter
{
    const DEFAULT_INSURANCE = 0;

    /**
     * WCMP_ShipmentOptionsFromOrderAdapter constructor.
     *
     * @param AbstractDeliveryOptionsAdapter|null $originAdapter
     * @param array                               $inputData
     */
    public function __construct(?AbstractDeliveryOptionsAdapter $originAdapter, array $inputData)
    {
        $shipmentOptionsAdapter = $originAdapter ? $originAdapter->getShipmentOptions() : null;
        $options                = $inputData['shipment_options'] ?? [];
        $this->signature        = (bool) ($options['signature'] ?? $shipmentOptionsAdapter ? $shipmentOptionsAdapter->hasSignature() : false);
        $this->insurance        = (int) ($options['insurance'] ?? $shipmentOptionsAdapter ? $shipmentOptionsAdapter->getInsurance() : self::DEFAULT_INSURANCE);
    }
}
