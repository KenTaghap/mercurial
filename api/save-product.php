<?php
// Suppress all PHP errors and warnings to ensure clean JSON output
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get the JSON data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    $productData = $data['product'];
    $images = $data['images'] ?? [];
    
    // Check if we're running locally or on Vercel
    $isLocal = !isset($_ENV['VERCEL']) && !isset($_SERVER['VERCEL']);
    $imageUrls = [];
    $saveMode = 'demo';
    
    if ($isLocal) {
        // Try to save files locally for development
        try {
            // Create directories if they don't exist
            if (!file_exists('../data')) {
                mkdir('../data', 0755, true);
            }
            if (!file_exists('../images')) {
                mkdir('../images', 0755, true);
            }
            
            // Save images to files
            foreach ($images as $index => $imageData) {
                // Extract base64 data
                $imageInfo = explode(',', $imageData);
                if (count($imageInfo) !== 2) {
                    continue;
                }
                
                $imageBase64 = $imageInfo[1];
                $imageBinary = base64_decode($imageBase64);
                
                // Get file extension from mime type
                $mimeType = $imageInfo[0];
                $extension = 'jpg'; // default
                if (strpos($mimeType, 'png') !== false) {
                    $extension = 'png';
                } elseif (strpos($mimeType, 'gif') !== false) {
                    $extension = 'gif';
                } elseif (strpos($mimeType, 'webp') !== false) {
                    $extension = 'webp';
                }
                
                // Create filename
                $fileName = $productData['id'] . '_' . $index . '.' . $extension;
                $filePath = '../images/' . $fileName;
                
                // Save image file
                if (file_put_contents($filePath, $imageBinary)) {
                    $imageUrls[] = 'images/' . $fileName;
                }
            }
            
            // Save to products.json
            $productsFile = '../data/products.json';
            $existingProducts = [];
            if (file_exists($productsFile)) {
                $existingData = file_get_contents($productsFile);
                $existingProducts = json_decode($existingData, true) ?: [];
            }
            
            // Update product data with image URLs
            $productData['images'] = $imageUrls;
            
            // Check if this is an update or new product
            $productIndex = -1;
            for ($i = 0; $i < count($existingProducts); $i++) {
                if ($existingProducts[$i]['id'] === $productData['id']) {
                    $productIndex = $i;
                    break;
                }
            }
            
            if ($productIndex >= 0) {
                // Update existing product
                $existingProducts[$productIndex] = $productData;
            } else {
                // Add new product
                $existingProducts[] = $productData;
            }
            
            // Save updated products list
            $jsonData = json_encode($existingProducts, JSON_PRETTY_PRINT);
            if (file_put_contents($productsFile, $jsonData)) {
                $saveMode = 'local';
            }
            
        } catch (Exception $localError) {
            // If local save fails, fall back to demo mode
            foreach ($images as $index => $imageData) {
                $imageUrls[] = $imageData;
            }
            $productData['images'] = $imageUrls;
        }
    } else {
        // Vercel/Production mode - just store base64 data
        foreach ($images as $index => $imageData) {
            $imageUrls[] = $imageData;
        }
        $productData['images'] = $imageUrls;
    }
    
    $productData['savedAt'] = date('Y-m-d H:i:s');
    
    // Return success response
    $message = $saveMode === 'local' ? 'Product saved successfully to local files' : 'Product saved successfully (demo mode)';
    echo json_encode([
        'success' => true,
        'message' => $message,
        'product' => $productData,
        'saveMode' => $saveMode
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>
