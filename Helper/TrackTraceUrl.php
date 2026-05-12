<?php declare(strict_types=1);

namespace MyParcelBE\Magento\Helper;

class TrackTraceUrl
{
    private const BASE_URL = 'https://sendmyparcel.me/track-trace/';

    public static function create(
        string $barcode,
        string $postalCode,
        ?string $countryCode = null
    ): string {
        $postalCode = str_replace(' ', '', $postalCode);
        $url        = self::BASE_URL . "$barcode/$postalCode";

        if ($countryCode) {
            $url .= "/$countryCode";
        }

        return $url;
    }
}
