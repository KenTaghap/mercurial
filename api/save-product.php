<?php
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
    
    // Create directories if they don't exist
    if (!file_exists('data')) {
        mkdir('data', 0755, true);
    }
    if (!file_exists('images')) {
        mkdir('images', 0755, true);
    }
    
    // For edit mode: Delete old images first
    $productsFile = 'data/products.json';
    if (file_exists($productsFile)) {
        $existingData = file_get_contents($productsFile);
        $existingProducts = json_decode($existingData, true) ?: [];
        
        // Find existing product and delete its old images
        foreach ($existingProducts as $existingProduct) {
            if ($existingProduct['id'] === $productData['id'] && isset($existingProduct['images'])) {
                foreach ($existingProduct['images'] as $oldImage) {
                    if (file_exists($oldImage)) {
                        unlink($oldImage); // Delete old image file
                    }
                }
                break;
            }
        }
    }
    
    // Save new images
    $imageUrls = [];
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
        $filePath = 'images/' . $fileName;
        
        // Save image file
        if (file_put_contents($filePath, $imageBinary)) {
            $imageUrls[] = $filePath;
        }
    }
    
    // Update product data with image URLs
    $productData['images'] = $imageUrls;
    
    // Load existing products
    $productsFile = 'data/products.json';
    $existingProducts = [];
    if (file_exists($productsFile)) {
        $existingData = file_get_contents($productsFile);
        $existingProducts = json_decode($existingData, true) ?: [];
    }
    
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
        echo json_encode([
            'success' => true,
            'message' => 'Product saved successfully',
            'product' => $productData
        ]);
    } else {
        throw new Exception('Failed to save products.json');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>