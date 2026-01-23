<?php
class JWT {
    public static function encode($payload, $key, $alg = 'HS256') {
        $header = ['typ' => 'JWT', 'alg' => $alg];
        $header = self::base64UrlEncode(json_encode($header));
        $payload = self::base64UrlEncode(json_encode($payload));
        $signature = self::sign($header . "." . $payload, $key, $alg);
        return $header . "." . $payload . "." . self::base64UrlEncode($signature);
    }

    public static function decode($token, $key, $verify = true) {
        $parts = explode('.', $token);
        if (count($parts) != 3) return false;
        
        list($header64, $payload64, $sig64) = $parts;
        
        if ($verify) {
            $sig = self::base64UrlDecode($sig64);
            $checkSig = self::sign($header64 . "." . $payload64, $key, 'HS256');
            if ($sig !== $checkSig) return false;
        }

        return json_decode(self::base64UrlDecode($payload64));
    }

    private static function sign($msg, $key, $alg) {
        return hash_hmac('sha256', $msg, $key, true);
    }

    private static function base64UrlEncode($data) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode($data) {
        $urlUnsafeData = str_replace(['-', '_'], ['+', '/'], $data);
        $paddedData = str_pad($urlUnsafeData, strlen($data) % 4, '=', STR_PAD_RIGHT);
        return base64_decode($paddedData);
    }
}
?>