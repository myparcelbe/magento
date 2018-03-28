<?php
/**
 * Set MyParcel Shipping methods
 *
 * LICENSE: This source file is subject to the Creative Commons License.
 * It is available through the world-wide-web at this URL:
 * http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 *
 * If you want to add improvements, please create a fork in our GitHub:
 * https://github.com/myparcelbe
 *
 * @author      Reindert Vetter <reindert@myparcel.nl>
 * @copyright   2010-2017 MyParcel
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US  CC BY-NC-ND 3.0 NL
 * @link        https://github.com/myparcelbe/magento
 * @since       File available since Release 0.1.0
 */

namespace MyParcelBE\Magento\Model\Checkout;

use Magento\Quote\Model\Quote\Address\RateResult\Error;
use Magento\Quote\Model\Quote\Address\RateRequest;
use Magento\Shipping\Model\Carrier\AbstractCarrierOnline;
use Magento\Shipping\Model\Carrier\CarrierInterface;
use Magento\Shipping\Model\Rate\Result;
use Magento\Shipping\Model\Simplexml\Element;
use Magento\Ups\Helper\Config;
use Magento\Framework\Xml\Security;
use MyParcelBE\Magento\Helper\Checkout;
use MyParcelBE\Magento\Helper\Data;
use MyParcelBE\Magento\Model\Sales\Repository\PackageRepository;

class Carrier extends AbstractCarrierOnline implements CarrierInterface
{
    const CODE = 'mypa';
    protected $_code = self::CODE;
    protected $_localeFormat;
    protected $configHelper;

    /**
     * @var \Magento\Quote\Model\Quote
     */
    private $quote;

    /**
     * @var Checkout
     */
    private $myParcelHelper;

    /**
     * @var PackageRepository
     */
    private $package;

    /**
     * Carrier constructor.
     * @param \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
     * @param \Magento\Quote\Model\Quote\Address\RateResult\ErrorFactory $rateErrorFactory
     * @param \Psr\Log\LoggerInterface $logger
     * @param Security $xmlSecurity
     * @param \Magento\Shipping\Model\Simplexml\ElementFactory $xmlElFactory
     * @param \Magento\Shipping\Model\Rate\ResultFactory $rateFactory
     * @param \Magento\Quote\Model\Quote\Address\RateResult\MethodFactory $rateMethodFactory
     * @param \Magento\Shipping\Model\Tracking\ResultFactory $trackFactory
     * @param \Magento\Shipping\Model\Tracking\Result\ErrorFactory $trackErrorFactory
     * @param \Magento\Shipping\Model\Tracking\Result\StatusFactory $trackStatusFactory
     * @param \Magento\Directory\Model\RegionFactory $regionFactory
     * @param \Magento\Directory\Model\CountryFactory $countryFactory
     * @param \Magento\Directory\Model\CurrencyFactory $currencyFactory
     * @param \Magento\Directory\Helper\Data $directoryData
     * @param \Magento\CatalogInventory\Api\StockRegistryInterface $stockRegistry
     * @param \Magento\Checkout\Model\Session $session
     * @param Config $configHelper
     * @param Checkout $myParcelHelper
     * @param PackageRepository $package
     * @param array $data
     */
    public function __construct(
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Quote\Model\Quote\Address\RateResult\ErrorFactory $rateErrorFactory,
        \Psr\Log\LoggerInterface $logger,
        Security $xmlSecurity,
        \Magento\Shipping\Model\Simplexml\ElementFactory $xmlElFactory,
        \Magento\Shipping\Model\Rate\ResultFactory $rateFactory,
        \Magento\Quote\Model\Quote\Address\RateResult\MethodFactory $rateMethodFactory,
        \Magento\Shipping\Model\Tracking\ResultFactory $trackFactory,
        \Magento\Shipping\Model\Tracking\Result\ErrorFactory $trackErrorFactory,
        \Magento\Shipping\Model\Tracking\Result\StatusFactory $trackStatusFactory,
        \Magento\Directory\Model\RegionFactory $regionFactory,
        \Magento\Directory\Model\CountryFactory $countryFactory,
        \Magento\Directory\Model\CurrencyFactory $currencyFactory,
        \Magento\Directory\Helper\Data $directoryData,
        \Magento\CatalogInventory\Api\StockRegistryInterface $stockRegistry,
        \Magento\Checkout\Model\Session $session,
        Config $configHelper,
        Checkout $myParcelHelper,
        PackageRepository $package,
        array $data = []
    ) {
        parent::__construct(
            $scopeConfig,
            $rateErrorFactory,
            $logger,
            $xmlSecurity,
            $xmlElFactory,
            $rateFactory,
            $rateMethodFactory,
            $trackFactory,
            $trackErrorFactory,
            $trackStatusFactory,
            $regionFactory,
            $countryFactory,
            $currencyFactory,
            $directoryData,
            $stockRegistry,
            $data
        );
        $this->quote = $session->getQuote();
        $this->configHelper = $configHelper;
        $this->myParcelHelper = $myParcelHelper;
        $this->package = $package;
    }

    protected function _doShipmentRequest(\Magento\Framework\DataObject $request)
    {
    }

    public function collectRates(RateRequest $request)
    {
        /** @var \Magento\Quote\Model\Quote\Address\RateRequest $result */
        $result = $this->_rateFactory->create();
        $result = $this->addShippingMethods($result);

        return $result;
    }

    public function proccessAdditionalValidation(\Magento\Framework\DataObject $request) {
        return true;
    }

    /**
     * Get allowed shipping methods
     *
     * @return array
     */
    public function getMethods()
    {
	    $methods = [
            'signature' => 'delivery/signature_',
            'only_recipient' => 'delivery/only_recipient_',
            'signature_only_recip' => 'delivery/signature_and_only_recipient_',
            'pickup' => 'pickup/',
        ];

        return $methods;
    }

    /**
     * Get allowed shipping methods
     *
     * @return array
     */
    public function getAllowedMethods()
    {
        $methods = $this->getMethods();
        return $methods;
    }

    /**
     * @param \Magento\Quote\Model\Quote\Address\RateRequest $result
     * @return mixed
     */
    private function addShippingMethods($result)
    {
        $products = $this->quote->getAllItems($result);
        if (count($products) > 0){
            $this->package->setWeightFromQuoteProducts($products);
        }

        foreach ($this->getAllowedMethods() as $alias => $settingPath) {

            $active = $this->myParcelHelper->getConfigValue(Data::XML_PATH_CHECKOUT . $settingPath . 'active') === '1';
            if ($active) {
                $method = $this->getShippingMethod($alias, $settingPath);
                $result->append($method);
            }
        }

        return $result;
    }

    /**
     * @param $alias
     * @param string $settingPath
     *
     * @return \Magento\Quote\Model\Quote\Address\RateResult\Method
     */
    private function getShippingMethod($alias, $settingPath)
    {
        $title = $this->createTitle($settingPath);
        $price = $this->createPrice($settingPath);

        /** @var \Magento\Quote\Model\Quote\Address\RateResult\Method $method */
        $method = $this->_rateMethodFactory->create();
        $method->setCarrier($this->_code);
        $method->setCarrierTitle($alias);
        $method->setMethod($alias);
        $method->setMethodTitle($title);
        $method->setPrice($price);

        return $method;
    }

    /**
     * Create title for method
     * If no title isset in config, get title from translation
     *
     * @param $settingPath
     * @return \Magento\Framework\Phrase|mixed
     */
    private function createTitle($settingPath)
    {
        $title = $this->myParcelHelper->getConfigValue(Data::XML_PATH_CHECKOUT . $settingPath . 'title');

        if ($title === null) {
            $title = __($settingPath . 'title');
        }

        return $title;
    }

	/**
	 * Create price
	 * Calculate price if multiple options are chosen
	 *
	 * @param $alias
	 * @param $settingPath
	 * @return float
	 */
	private function createPrice($settingPath) {
		$price = 0;
		$price += $this->myParcelHelper->getMethodPrice($settingPath . 'fee');

		return $price;
	}
}
