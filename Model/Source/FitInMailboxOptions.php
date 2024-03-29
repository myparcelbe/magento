<?php
/**
 * Get percentages of the volume of the product. So we can figure out later whether the product fits into a mailbox.
 *
 * LICENSE: This source file is subject to the Creative Commons License.
 * It is available through the world-wide-web at this URL:
 * http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 *
 * If you want to add improvements, please create a fork in our GitHub:
 * https://github.com/myparcelbe
 *
 * @author      Reindert Vetter <info@sendmyparcel.be>
 * @copyright   2010-2017 MyParcel
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US  CC BY-NC-ND 3.0 NL
 * @link        https://github.com/myparcelbe/magento
 * @since       File available since Release 0.1.0
 */

namespace MyParcelBE\Magento\Model\Source;

use Magento\Eav\Model\Entity\Attribute\Source\AbstractSource;

class FitInMailboxOptions extends AbstractSource
{
    /**
     * Get percentages of the volume of the product. So we can figure out later whether the product fits into a mailbox.
     *
     * @return array
     */
    public function getOptionArray()
    {
        return [
            ['value' => '0', 'label'=>__('Look to weight')],
            ['value' => '101', 'label'=>__('No')],
            ['value' => '100', 'label'=>__('One product (100%)')],
            ['value' => '50', 'label'=>__('2 products (50%)')],
            ['value' => '33', 'label'=>__('3 products (33%)')],
            ['value' => '25', 'label'=>__('4 products (25%)')],
            ['value' => '10', 'label'=>__('10 products (10%)')],
            ['value' => '5', 'label'=>__('20 products (5%)')],
        ];
    }

    /**
     * Retrieve All options
     *
     * @return array
     */
    public function getAllOptions()
    {
        return $this->getOptionArray();
    }
}
