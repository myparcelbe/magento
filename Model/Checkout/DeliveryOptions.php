<?php
/**
 * Get delivery prices and settings
 *
 * If you want to add improvements, please create a fork in our GitHub:
 * https://github.com/myparcelbe
 *
 * @author      Reindert Vetter <info@sendmyparcel.be>
 * @copyright   2010-2019 MyParcel
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US  CC BY-NC-ND 3.0 NL
 * @link        https://github.com/myparcelbe/magento
 * @since       File available since Release v2.0.0
 */

namespace MyParcelBE\Magento\Model\Checkout;


use Exception;
use MyParcelBE\Magento\Api\DeliveryOptionsInterface;
use MyParcelBE\Magento\Model\Quote\Checkout;
use MyParcelNL\Sdk\src\Factory\DeliveryOptionsAdapterFactory;

class DeliveryOptions implements DeliveryOptionsInterface
{
    /**
     * @var Checkout
     */
    private $settings;

    /**
     * Checkout constructor.
     * @param Checkout $settings
     */
    public function __construct(
        Checkout $settings
    ) {
        $this->settings = $settings;
    }

    public function get()
    {
        return $this->settings->getDeliveryOptions();
    }

    /**
     * @param mixed $deliveryOptions
     *
     * @return array
     * @throws Exception
     */
    public function convertToShippingMethod($deliveryOptions): array
    {
        $response = [];

        try {
            foreach ($deliveryOptions as $value) {
                $newDeliveryOptions = DeliveryOptionsAdapterFactory::create($value);

                $response[] = $newDeliveryOptions->toArray();
            }

            $response = [
                "code"    => "200",
                "data"    => json_encode($response),
            ];
        } catch (Exception $e) {
            $response = [
                "code"    => "422",
                "message" => $e->getMessage(),
            ];
        }

        return $response;
    }
}
