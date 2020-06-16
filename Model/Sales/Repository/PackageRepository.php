<?php
/**
 * This class contain all functions to check type of package
 *
 * LICENSE: This source file is subject to the Creative Commons License.
 * It is available through the world-wide-web at this URL:
 * http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 *
 * If you want to add improvements, please create a fork in our GitHub:
 * https://github.com/myparcelbe/magento
 *
 * @author      Reindert Vetter <info@sendmyparcel.be>
 * @copyright   2010-2019 MyParcel
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US  CC BY-NC-ND 3.0 NL
 * @link        https://github.com/myparcelbe/magento
 * @since       File available since Release 2.0.0
 */

namespace MyParcelBE\Magento\Model\Sales\Repository;

use Magento\Catalog\Model\ResourceModel\Product;
use Magento\Quote\Model\Quote\Item;
use MyParcelBE\Magento\Model\Sales\Package;

class PackageRepository extends Package
{
    const DEFAULT_WEIGHT = 2000;

    /**
     * @var bool
     */
    public $deliveryOptionsDisabled = false;

    /**
     * Get package type
     *
     * If package type is not set, calculate package type
     *
     * @return int 1|3
     */
    public function getPackageType()
    {
        // return type if type is set
        if (parent::getPackageType() !== null) {
            return parent::getPackageType();
        }

        return parent::getPackageType();
    }

    /**
     * Set weight depend on product weight from product
     *
     * @param Item[] $products
     *
     * @return $this
     */
    public function setWeightFromQuoteProducts($products)
    {
        if (empty($products)) {
            return $this;
        }

        $this->setWeight(0);
        foreach ($products as $product) {
            $this->setWeightFromOneQuoteProduct($product);
        }

        return $this;
    }

    /**
     * @param array $products
     *
     * @return PackageRepository
     */
    public function productWithoutDeliveryOptions(array $products): self
    {
        foreach ($products as $product) {
            $this->isDeliveryOptionsDisabled($product);
        }

        return $this;
    }

    /**
     * @param Item $product
     *
     * @return $this
     */
    private function setWeightFromOneQuoteProduct($product)
    {
        if ($product->getWeight() > 0) {
            $this->addWeight($product->getWeight() * $product->getQty());
        } else {
            $this->setAllProductsFit(false);
        }

        return $this;
    }

    /**
     * @param $products
     *
     * @return float
     */
    public function getProductsWeight(array $products): float
    {
        $weight = 0;
        foreach ($products as $item) {
            $weight += ($item->getWeight() * $item->getQty());
        }

        return $weight;
    }

    /**
     * @param Item $product
     * @param string                          $column
     *
     * @return null|int
     */
    private function getAttributesProductsOptions($product, string $column): ?int
    {
        $attributeValue = $this->getAttributesFromProduct('catalog_product_entity_varchar', $product, $column);

        if (empty($attributeValue)) {
            $attributeValue = $this->getAttributesFromProduct('catalog_product_entity_int', $product, $column);
        }

        if ($attributeValue) {
            return (int) $attributeValue;
        }

        return null;
    }

    /**
     * @param string                          $tableName
     * @param Item $product
     * @param string                          $column
     *
     * @return null|string
     */
    private function getAttributesFromProduct(string $tableName, $product, string $column): ?string
    {
        /**
         * @var Product $resourceModel
         */
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();

        $resource   = $objectManager->get('Magento\Framework\App\ResourceConnection');
        $entityId   = $product->getProduct()->getEntityId();
        $connection = $resource->getConnection();

        $attributeId    = $this->getAttributeId($connection, $resource->getTableName('eav_attribute'), $column);
        $attributeValue = $this
            ->getValueFromAttribute(
                $connection,
                $resource->getTableName($tableName),
                $attributeId,
                $entityId
            );

        return $attributeValue;
    }

    /**
     * @param        $connection
     * @param string $tableName
     * @param string $databaseColumn
     *
     * @return mixed
     */
    private function getAttributeId($connection, string $tableName, string $databaseColumn)
    {
        $sql = $connection
            ->select('entity_type_id')
            ->from($tableName)
            ->where('attribute_code = ?', 'myparcelbe_' . $databaseColumn);

        return $connection->fetchOne($sql);
    }

    /**
     * @param        $connection
     * @param string $tableName
     * @param string $attributeId
     * @param string $entityId
     *
     * @return mixed
     */
    private function getValueFromAttribute($connection, string $tableName, string $attributeId, string $entityId)
    {
        $sql = $connection
            ->select()
            ->from($tableName, ['value'])
            ->where('attribute_id = ?', $attributeId)
            ->where('entity_id = ?', $entityId);

        return $connection->fetchOne($sql);
    }

    /**
     * @param $products
     *
     * @return PackageRepository
     */
    public function isDeliveryOptionsDisabled(array $products): self
    {
        $deliveryOptionsEnabled = $this->getAttributesProductsOptions($products, 'disable_checkout');

        if ($deliveryOptionsEnabled) {
            $this->deliveryOptionsDisabled = true;
        }

        return $this;
    }

}
