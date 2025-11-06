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
    
    // For Vercel deployment, we'll simulate saving and return success
    // In a real application, you would save to a database or cloud storage
    
    // Process images (convert to base64 URLs for demo)
    $imageUrls = [];
    foreach ($images as $index => $imageData) {
        // For demo purposes, we'll just store the base64 data as the URL
        // In production, you'd upload to cloud storage like Cloudinary, AWS S3, etc.
        $imageUrls[] = $imageData;
    }
    
    // Update product data with image URLs
    $productData['images'] = $imageUrls;
    $productData['savedAt'] = date('Y-m-d H:i:s');
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Product saved successfully (demo mode)',
        'product' => $productData,
        'note' => 'This is running in demo mode. In production, integrate with a database and cloud storage.'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>
