<?php

declare(strict_types=1);

namespace MyParcelBE\Magento\Services\Normalizer;

use MyParcelBE\Magento\Helper\Data;
use MyParcelNL\Sdk\src\Model\Consignment\AbstractConsignment;
use MyParcelNL\Sdk\src\Model\Consignment\BpostConsignment;

class ConsignmentNormalizer
{
    /**
     * @var array|null
     */
     private $helper;

    /**
     * ConsignmentNormalizer constructor.
     *
     * @param Data $helper
     */
    public function __construct(
        Data $helper
    ) {
        $this->helper = $helper;
    }

    public function normalize(?array $data): array
    {
        $data['carrier']      = $data['carrier'] ?? BpostConsignment::CARRIER_NAME;
        $data['deliveryType'] = $data['deliveryType'] ?? AbstractConsignment::DELIVERY_TYPE_STANDARD_NAME;
        $data['package_type'] = $data['package_type'] ?? AbstractConsignment::PACKAGE_TYPE_PACKAGE;

        $key           = (AbstractConsignment::DELIVERY_TYPE_PICKUP === $data['deliveryType'])
            ? 'pickup/active'
            : 'delivery/active';
        $validCarriers = [];

        foreach (Data::CARRIERS_XML_PATH_MAP as $carrier => $path) {
            if ('1' === $this->helper->getCarrierConfig($key, $path)) {
                $validCarriers[] = $carrier;
            }
        }

        if ($validCarriers && ! in_array($data['carrier'], $validCarriers)) {
            $data['carrier'] = $validCarriers[0];
        }

        return $data;
    }
}
