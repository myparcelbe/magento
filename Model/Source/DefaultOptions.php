<?php
/**
 * All functions to handle insurance
 *
 * If you want to add improvements, please create a fork in our GitHub:
 * https://github.com/myparcelbe
 *
 * @author      Reindert Vetter <info@sendmyparcel.be>
 * @copyright   2010-2019 MyParcel
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US  CC BY-NC-ND 3.0 NL
 * @link        https://github.com/myparcelbe/magento
 * @since       File available since Release v0.1.0
 */

namespace MyParcelBE\Magento\Model\Source;

use Magento\Sales\Model\Order;
use MyParcelBE\Magento\Helper\Checkout;
use MyParcelBE\Magento\Helper\Data;
use MyParcelBE\Magento\Services\Normalizer\ConsignmentNormalizer;
use MyParcelBE\Magento\Model\Sales\Package;
use MyParcelBE\Magento\Model\Sales\Repository\PackageRepository;
use MyParcelNL\Sdk\src\Model\Consignment\AbstractConsignment;

class DefaultOptions
{
    // Maximum characters length of company name.
    const COMPANY_NAME_MAX_LENGTH = 50;

    /**
     * @var Data
     */
    private static $helper;

    /**
     * @var Order
     */
    private static $order;

    /**
     * @var array
     */
    private static $chosenOptions;

    /**
     * Insurance constructor.
     *
     * @param $order Order
     * @param $helper Data
     */
    public function __construct(Order $order, Data $helper)
    {
        self::$helper = $helper;
        self::$order  = $order;

        self::$chosenOptions = json_decode(self::$order->getData(Checkout::FIELD_DELIVERY_OPTIONS), true);
    }

    /**
     * Get default of the option
     *
     * @param $option 'only_recipient'|'signature'|'return'|'large_format'
     *
     * @return bool
     */
    public function getDefault($option)
    {
        // Check that the customer has already chosen this option in the checkout
        if (is_array(self::$chosenOptions) &&
            key_exists('shipmentOptions', self::$chosenOptions) &&
            key_exists($option, self::$chosenOptions['shipmentOptions']) &&
            self::$chosenOptions['shipmentOptions'][$option] == true
        ) {
            return true;
        }

        $carrierPath = Data::CARRIERS_XML_PATH_MAP;
        $data        = (new ConsignmentNormalizer(self::$helper))->normalize(self::$chosenOptions);
        $total       = self::$order->getGrandTotal();

        foreach ($carrierPath as $carrier => $path) {
            $settings = self::$helper->getCarrierConfig('default_options', $path);

            if ($data['carrier'] !== $carrier || ! isset($settings[$option . '_active'])) {
                continue;
            }

            if ('1' == $settings[$option . '_active'] &&
                (! $settings[$option . '_from_price'] || $total > (int)$settings[$option . '_from_price'])
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param string|null $company
     *
     * @return string|null
     */
    public function getMaxCompanyName(?string $company): ?string
    {
        if (null !== $company && (strlen($company) > self::COMPANY_NAME_MAX_LENGTH)) {
            $company = substr($company, 0, self::COMPANY_NAME_MAX_LENGTH - 3) . '...';
        }

        return $company;
    }

    /**
     * Get default value of options without price check
     *
     * @param string $option
     *
     * @return bool
     */
    public function getDefaultLargeFormat(string $option): bool
    {
        $price  = self::$order->getGrandTotal();
        $weight = self::$order->getWeight();

        $settings = self::$helper->getStandardConfig('default_options');
        if (isset($settings[$option . '_active']) &&
            $settings[$option . '_active'] == 'weight' &&
            $weight >= PackageRepository::DEFAULT_LARGE_FORMAT_WEIGHT
        ) {
            return true;
        }

        if (isset($settings[$option . '_active']) &&
            $settings[$option . '_active'] == 'price' &&
            $price >= $settings[$option . '_from_price']
        ) {
            return true;
        }

        return false;
    }

    /**
     * @param string $option
     *
     * @return bool
     */
    public function getDefaultOptionsWithoutPrice(string $option): bool
    {
        $settings = self::$helper->getStandardConfig('default_options');

        return $settings[$option . '_active'] === '1';
    }

    /**
     * Get default value of insurance based on order grand total
     *
     * @return int
     */
    public function getDefaultInsurance()
    {
        if ($this->getDefault('insurance_500')) {
            return 500;
        }

        if ($this->getDefault('insurance_250')) {
            return 250;
        }

        if ($this->getDefault('insurance_100')) {
            return 100;
        }

        return 0;
    }

    /**
     * Get default of digital stamp weight
     *
     * @return bool
     */
    public function getDigitalStampDefaultWeight()
    {
        return self::$helper->getCarrierConfig('digital_stamp/default_weight', 'myparcelbe_magento_postnl_settings/');
    }

    /**
     * Get package type
     *
     * @return int 1|2|3|4
     */
    public function getPackageType()
    {
        if ($this->isDigitalStampOrMailbox(AbstractConsignment::PACKAGE_TYPE_MAILBOX_NAME)) {
            return AbstractConsignment::PACKAGE_TYPE_MAILBOX;
        }

        if ($this->isDigitalStampOrMailbox(AbstractConsignment::PACKAGE_TYPE_DIGITAL_STAMP_NAME)) {
            return AbstractConsignment::PACKAGE_TYPE_DIGITAL_STAMP;
        }

        return AbstractConsignment::PACKAGE_TYPE_PACKAGE;
    }

    /**
     * @param string $option
     *
     * @return bool
     */
    private function isDigitalStampOrMailbox(string $option): bool
    {
        $country = self::$order->getShippingAddress()->getCountryId();
        if ($country != 'NL') {
            return false;
        }

        if (
            is_array(self::$chosenOptions) &&
            key_exists('packageType', self::$chosenOptions) &&
            self::$chosenOptions['packageType'] === $option
        ) {
            return true;
        }

        return false;
    }
}
