<?php
/**
 * Get paper types for MyParcel system settings
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

use Magento\Framework\Option\ArrayInterface;

class PaperType implements ArrayInterface
{
    /**
     * Options getter
     *
     * @return array
     */
    public function toOptionArray()
    {
        return [['value' => 'A4', 'label' => __('A4')], ['value' => 'A6', 'label' => __('A6')]];
    }

    /**
     * Get options in "key-value" format
     *
     * @return array
     */
    public function toArray()
    {
        return ['A4' => __('A4'), 'A6' => __('A6')];
    }
}
