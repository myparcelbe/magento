<?php

namespace MyParcelBE\Magento\Model\Checkout;

use Exception;
use Magento\Checkout\Model\Session;
use MyParcelBE\Magento\Api\ShippingMethodsInterface;

/**
 * @since 3.0.0
 */
class ShippingMethods implements ShippingMethodsInterface
{
    private $session;

    public function __construct(Session $session)
    {
        $this->session = $session;
    }

    /**
     * @param mixed $deliveryOptions
     *
     * @return mixed[]
     * @throws Exception
     */
    public function getFromDeliveryOptions($deliveryOptions): array
    {
        if (! $deliveryOptions[0]) {
            return [];
        }

        try {
            $shipping = new DeliveryOptionsToShippingMethods($deliveryOptions[0]);

            $response = [
                'root' => [
                    'element_id' => $shipping->getShippingMethod(),
                ],
            ];
        } catch (Exception $e) {
            $response = [
                'code'    => '422',
                'message' => $e->getMessage(),
            ];
        }

        $quote = $this->session->getQuote();
        $quote->addData(['myparcel_delivery_options'=> json_encode($deliveryOptions[0])]);
        $quote->save();
        $response[] = [
            'delivery_options'=>$deliveryOptions[0],
            'message'=>'shipping method persisted in quote ' . $quote->getId()
        ];

        return $response;
    }
}
