<?php

declare(strict_types=1);

namespace MyParcelBE\Magento\Adapter;

use MyParcelNL\Sdk\src\Adapter\DeliveryOptions\AbstractDeliveryOptionsAdapter;

class DeliveryOptionsFromAdapter extends AbstractDeliveryOptionsAdapter
{
    /**
     * WCMP_DeliveryOptionsFromOrderAdapter constructor.
     *
     * @param AbstractDeliveryOptionsAdapter|null $originAdapter
     * @param array                               $inputData
     */
    public function __construct(?AbstractDeliveryOptionsAdapter $originAdapter, array $inputData = [])
    {
        $this->carrier         = $inputData['carrier'] ?? ($originAdapter ? $originAdapter->getCarrier() : null);
        $this->date            = $originAdapter ? $originAdapter->getDate() : null;
        $this->deliveryType    = $inputData['deliveryType'] ?? ($originAdapter ? $originAdapter->getDeliveryType() : null);
        $this->shipmentOptions = new ShipmentOptionsFromAdapter($originAdapter, $inputData);
        $this->pickupLocation  = $originAdapter ? $originAdapter->getPickupLocation() : null;
    }
}
