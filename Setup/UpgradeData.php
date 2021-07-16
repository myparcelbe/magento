<?php

/**
 * Update data for update
 *
 * If you want to add improvements, please create a fork in our GitHub:
 * https://github.com/myparcelbe
 *
 * @author      Richard Perdaan <info@sendmyparcel.be>
 * @copyright   2010-2019 MyParcel
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US  CC BY-NC-ND 3.0 NL
 * @link        https://github.com/myparcelbe/magento
 * @since       File available since Release v3.0.0
 */

namespace MyParcelBE\Magento\Setup;

use Magento\Catalog\Setup\CategorySetupFactory;
use Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface;
use Magento\Eav\Setup\EavSetup;
use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\ModuleContextInterface;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\UpgradeDataInterface;

/**
 * Upgrade Data script
 * @codeCoverageIgnore
 */
class UpgradeData implements UpgradeDataInterface
{

    const groupName = 'MyParcelBE Options';

    /**
     * Category setup factory
     *
     * @var CategorySetupFactory
     */
    private $categorySetupFactory;

    /**
     * EAV setup factory
     *
     * @var EavSetupFactory
     */
    private $eavSetupFactory;

    /**
     * Init
     *
     * @param \Magento\Catalog\Setup\CategorySetupFactory $categorySetupFactory
     * @param EavSetupFactory                             $eavSetupFactory
     */
    public function __construct(\Magento\Catalog\Setup\CategorySetupFactory $categorySetupFactory, EavSetupFactory $eavSetupFactory)
    {
        $this->categorySetupFactory = $categorySetupFactory;
        $this->eavSetupFactory      = $eavSetupFactory;
    }

    /**
     * Upgrades data for a module
     *
     * @param \Magento\Framework\Setup\ModuleDataSetupInterface $setup
     * @param \Magento\Framework\Setup\ModuleContextInterface   $context
     */
    public function upgrade(ModuleDataSetupInterface $setup, ModuleContextInterface $context)
    {

       $connection = $setup->getConnection();
       $table      = $setup->getTable('core_config_data');

        /** @var EavSetup $eavSetup */
        $eavSetup = $this->eavSetupFactory->create(['setup' => $setup]);

        // Add the option 'HS code for products'
        if (version_compare($context->getVersion(), '3.2.0', '<=')) {
            $setup->startSetup();

            // Add attributes to the eav/attribute
            $eavSetup->addAttribute(
                \Magento\Catalog\Model\Product::ENTITY,
                'myparcelbe_classification',
                [
                    'group'                   => self::groupName,
                    'note'                    => 'HS Codes are used for world shipments, you can find the appropriate code on the site of the Belgium Customs',
                    'type'                    => 'int',
                    'backend'                 => '',
                    'frontend'                => '',
                    'label'                   => 'HS code',
                    'input'                   => 'text',
                    'class'                   => '',
                    'source'                  => '',
                    'global'                  => ScopedAttributeInterface::SCOPE_GLOBAL,
                    'visible'                 => true,
                    'required'                => false,
                    'user_defined'            => true,
                    'default'                 => '0',
                    'searchable'              => true,
                    'filterable'              => true,
                    'comparable'              => true,
                    'visible_on_front'        => false,
                    'used_in_product_listing' => true,
                    'unique'                  => false,
                    'apply_to'                => '',
                ]
            );

            // Enable / Disable checkout with this product.
            $setup->startSetup();

            // Add attributes to the eav/attribute
            $eavSetup->addAttribute(
                \Magento\Catalog\Model\Product::ENTITY,
                'myparcelbe_disable_checkout',
                [
                    'group'                   => self::groupName,
                    'note'                    => 'With this option you can disable the delivery options for this product.',
                    'type'                    => 'int',
                    'backend'                 => '',
                    'frontend'                => '',
                    'label'                   => 'Disable checkout with this product',
                    'input'                   => 'boolean',
                    'class'                   => '',
                    'source'                  => '',
                    'global'                  => ScopedAttributeInterface::SCOPE_GLOBAL,
                    'visible'                 => true,
                    'required'                => false,
                    'user_defined'            => true,
                    'default'                 => 0,
                    'searchable'              => true,
                    'filterable'              => true,
                    'comparable'              => true,
                    'visible_on_front'        => false,
                    'used_in_product_listing' => false,
                    'unique'                  => false,
                    'apply_to'                => '',
                ]
            );

            // Set a dropoff delay for this product.
            $setup->startSetup();

            // Add attributes to the eav/attribute
            $eavSetup->addAttribute(
                \Magento\Catalog\Model\Product::ENTITY,
                'myparcelbe_dropoff_delay',
                [
                    'group'                   => self::groupName,
                    'note'                    => 'This option allows you to set the number of days it takes you to pick, pack and hand in your parcels when ordered before the cutoff time.',
                    'type'                    => 'varchar',
                    'backend'                 => '',
                    'frontend'                => '',
                    'label'                   => 'Dropoff-delay',
                    'input'                   => 'select',
                    'class'                   => '',
                    'source'                  => 'MyParcelBE\Magento\Model\Source\DropOffDelayDays',
                    'global'                  => ScopedAttributeInterface::SCOPE_GLOBAL,
                    'visible'                 => true,
                    'required'                => false,
                    'user_defined'            => true,
                    'default'                 => null,
                    'searchable'              => false,
                    'filterable'              => false,
                    'comparable'              => false,
                    'visible_on_front'        => false,
                    'used_in_product_listing' => true,
                    'unique'                  => false,
                    'apply_to'                => '',
                ]
            );

            // Move paper type from print to basic settings
            $selectPaperTypeSetting = $connection->select()->from(
                $table,
                ['config_id', 'path', 'value']
            )->where(
                '`path` = "myparcelbe_magento_general/print/paper_type"'
            );

            $paperType = $connection->fetchAll($selectPaperTypeSetting) ?? [];

            foreach ($paperType as $value) {
                $fullPath = 'myparcelbe_magento_general/basic_settings/paper_type';
                $bind     = ['path' => $fullPath, 'value' => $value['value']];
                $where    = 'config_id = ' . $value['config_id'];
                $connection->update($table, $bind, $where);
            }
        }

        if (version_compare($context->getVersion(), '4.0.0', '<=')) {

            $setup->startSetup();
               /** @var EavSetup $eavSetup */
               $eavSetup = $this->eavSetupFactory->create(['setup' => $setup]);

               // get entity type id so that attribute are only assigned to catalog_product
               $entityTypeId = $eavSetup->getEntityTypeId('catalog_product');
               // Here we have fetched all attribute set as we want attribute group to show under all attribute set
               $attributeSetIds = $eavSetup->getAllAttributeSetIds($entityTypeId);

               foreach ($attributeSetIds as $attributeSetId) {
                   $eavSetup->addAttributeGroup($entityTypeId, $attributeSetId, self::groupName, 19);
                   $attributeGroupId = $eavSetup->getAttributeGroupId($entityTypeId, $attributeSetId, self::groupName);

               }

            if ($connection->isTableExists($table) == true) {

                // Move shipping_methods to myparcelbe_magento_general
                $selectShippingMethodSettings = $connection->select()->from(
                    $table,
                    ['config_id', 'path', 'value']
                )->where(
                    '`path` = "myparcelbe_magento_checkout/general/shipping_methods"'
                );

                $shippingMethodData = $connection->fetchAll($selectShippingMethodSettings) ?? [];
                foreach ($shippingMethodData as $value) {
                    $fullPath = 'myparcelbe_magento_general/shipping_methods/methods';
                    $bind     = ['path' => $fullPath, 'value' => $value['value']];
                    $where    = 'config_id = ' . $value['config_id'];
                    $connection->update($table, $bind, $where);
                }

                // Move default_delivery_title to general settings
                $selectDefaultDeliveryTitle = $connection->select()->from(
                    $table,
                    ['config_id', 'path', 'value']
                )->where(
                    '`path` = "myparcelbe_magento_checkout/delivery/standard_delivery_title"'
                );

                $defaultDeliveryTitle = $connection->fetchAll($selectDefaultDeliveryTitle) ?? [];
                foreach ($defaultDeliveryTitle as $value) {
                    $fullPath = 'myparcelbe_magento_general/delivery_titles/standard_delivery_title';
                    $bind     = ['path' => $fullPath, 'value' => $value['value']];
                    $where    = 'config_id = ' . $value['config_id'];
                    $connection->update($table, $bind, $where);
                }

                // Move delivery_title to general settings
                $selectDeliveryTitle = $connection->select()->from(
                    $table,
                    ['config_id', 'path', 'value']
                )->where(
                    '`path` = "myparcelbe_magento_checkout/delivery/delivery_title"'
                );

                $deliveryTitle = $connection->fetchAll($selectDeliveryTitle) ?? [];
                foreach ($deliveryTitle as $value) {
                    $fullPath = 'myparcelbe_magento_general/delivery_titles/delivery_title';
                    $bind     = ['path' => $fullPath, 'value' => $value['value']];
                    $where    = 'config_id = ' . $value['config_id'];
                    $connection->update($table, $bind, $where);
                }

                // Move signature_title to general settings
                $selectSignatureTitle = $connection->select()->from(
                    $table,
                    ['config_id', 'path', 'value']
                )->where(
                    '`path` = "myparcelbe_magento_checkout/delivery/delivery_title"'
                );

                $signatureTitle = $connection->fetchAll($selectSignatureTitle) ?? [];
                foreach ($signatureTitle as $value) {
                    $fullPath = 'myparcelbe_magento_general/delivery_titles/signature_title';
                    $bind     = ['path' => $fullPath, 'value' => $value['value']];
                    $where    = 'config_id = ' . $value['config_id'];
                    $connection->update($table, $bind, $where);
                }

                // Move pickup_title to general settings
                $selectPickupTitle = $connection->select()->from(
                    $table,
                    ['config_id', 'path', 'value']
                )->where(
                    '`path` = "myparcelbe_magento_checkout/pickup/title"'
                );

                $pickupTitle = $connection->fetchAll($selectPickupTitle) ?? [];
                foreach ($pickupTitle as $value) {
                    $fullPath = 'myparcelbe_magento_general/delivery_titles/pickup_title';
                    $bind     = ['path' => $fullPath, 'value' => $value['value']];
                    $where    = 'config_id = ' . $value['config_id'];
                    $connection->update($table, $bind, $where);
                }

                // Move insurance_500_active to carrier settings
                $selectDefaultInsurance = $connection->select()->from(
                    $table,
                    ['config_id', 'path', 'value']
                )->where(
                    '`path` LIKE "myparcelbe_magento_standard/options/insurance_500%"'
                );

                $insuranceData = $connection->fetchAll($selectDefaultInsurance) ?? [];
                foreach ($insuranceData as $value) {
                    $path    = $value['path'];
                    $path    = explode("/", $path);
                    $path[0] = 'myparcelbe_magento_postnl_settings';
                    $path[1] = 'default_options';

                    $fullPath = implode("/", $path);

                    $bind  = ['path' => $fullPath, 'value' => $value['value']];
                    $where = 'config_id = ' . $value['config_id'];
                    $connection->update($table, $bind, $where);
                }

                // Move signature_active to carrier settings
                $selectDefaultSignature = $connection->select()->from(
                    $table,
                    ['config_id', 'path', 'value']
                )->where(
                    '`path` LIKE "myparcelbe_magento_standard/options/signature%"'
                );

                $signatureData = $connection->fetchAll($selectDefaultSignature) ?? [];
                foreach ($signatureData as $value) {
                    $path    = $value['path'];
                    $path    = explode("/", $path);
                    $path[0] = 'myparcelbe_magento_postnl_settings';
                    $path[1] = 'default_options';

                    $fullPath = implode("/", $path);

                    $bind  = ['path' => $fullPath, 'value' => $value['value']];
                    $where = 'config_id = ' . $value['config_id'];
                    $connection->update($table, $bind, $where);
                }

                // Move myparcelbe_magento_checkout to myparcelbe_magento_postnl_settings
                $selectCheckoutSettings = $connection->select()->from(
                    $table,
                    ['config_id', 'path', 'value']
                )->where(
                    '`path` LIKE "myparcelbe_magento_checkout/%"'
                );

                $checkoutData = $connection->fetchAll($selectCheckoutSettings) ?? [];
                foreach ($checkoutData as $value) {
                    $path    = $value['path'];
                    $path    = explode("/", $path);
                    $path[0] = 'myparcelbe_magento_postnl_settings';

                    $fullPath = implode("/", $path);

                    $bind  = ['path' => $fullPath, 'value' => $value['value']];
                    $where = 'config_id = ' . $value['config_id'];
                    $connection->update($table, $bind, $where);
                }

                // Insert postnl enabled data

                $selectDeliveryActive = $connection->select()->from(
                    $table,
                    ['config_id', 'path', 'value']
                )->where(
                    '`path` = "myparcelbe_magento_postnl_settings/delivery/active"'
                );

                $deliveryActive = $connection->fetchAll($selectDeliveryActive) ?? [];

                if (! $deliveryActive){
                    $connection->insert(
                        $table,
                        [
                            'scope'    => 'default',
                            'scope_id' => 0,
                            'path'     => 'myparcelbe_magento_postnl_settings/delivery/active',
                            'value'    => 1
                        ]
                    );
                }
            }
        }

        if (version_compare($context->getVersion(), '4.1.0', '<=')) {
            // Add compatibility for new weight option for large format
            $selectLargeFormatData = $connection->select()->from($table,
                ['config_id', 'path', 'value']
            )->where(
                '`path` = "myparcelbe_magento_postnl_settings/default_options/large_format_active"'
            );

            $largeFormatData = $connection->fetchAll($selectLargeFormatData);

            foreach ($largeFormatData as $value) {
                if ($value['value'] === '1') {
                    $bind  = ['path' => $value['path'], 'value' => 'price'];
                    $where = 'config_id = ' . $value['config_id'];
                    $connection->update($table, $bind, $where);
                }
            }
        }

        $setup->endSetup();
    }
}
