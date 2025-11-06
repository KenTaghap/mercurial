document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const productForm = document.getElementById('productForm');
    const imageUpload = document.getElementById('imageUpload');
    const dropZone = document.getElementById('dropZone');
    const imagePreview = document.getElementById('imagePreview');
    const successModal = document.getElementById('successModal');
    const addAnotherBtn = document.getElementById('addAnother');
    
    // Maximum number of images allowed
    const MAX_IMAGES = 5;
    
    // Store uploaded files
    let uploadedFiles = [];
    
    // Initialize the admin panel
    function initAdmin() {
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Click on dropzone to open file dialog
        dropZone.addEventListener('click', () => {
            imageUpload.click();
        });
        
        // Handle file selection
        imageUpload.addEventListener('change', handleFileSelect);
        
        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        // Handle dropped files
        dropZone.addEventListener('drop', handleDrop, false);
        
        // Form submission
        productForm.addEventListener('submit', handleFormSubmit);
        
        // Add another product
        if (addAnotherBtn) {
            addAnotherBtn.addEventListener('click', resetForm);
        }
        
        // Clear form button
        const clearFormBtn = document.getElementById('clearForm');
        if (clearFormBtn) {
            clearFormBtn.addEventListener('click', resetForm);
        }
    }
    
    // Prevent default drag behaviors
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop zone
    function highlight() {
        dropZone.style.borderColor = '#3498db';
        dropZone.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
    }
    
    // Remove highlight from drop zone
    function unhighlight() {
        dropZone.style.borderColor = '';
        dropZone.style.backgroundColor = '';
    }
    
    // Handle dropped files
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Handle file selection via file input
    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }
    
    // Process selected files
    function handleFiles(files) {
        // Convert FileList to array
        const fileArray = Array.from(files);
        
        // Check if adding these files would exceed the maximum
        if (uploadedFiles.length + fileArray.length > MAX_IMAGES) {
            alert(`You can only upload a maximum of ${MAX_IMAGES} images.`);
            return;
        }
        
        // Filter out non-image files
        const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
        
        // Check file size (max 5MB)
        const validFiles = [];
        imageFiles.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum size is 5MB.`);
            } else {
                validFiles.push(file);
            }
        });
        
        // Add to uploaded files
        uploadedFiles = [...uploadedFiles, ...validFiles];
        
        // Update preview
        updateImagePreview();
    }
    
    // Update the image preview section
    function updateImagePreview() {
        // Get or create new images container
        let newImageContainer = imagePreview.querySelector('#newImagesContainer');
        if (!newImageContainer) {
            newImageContainer = document.createElement('div');
            newImageContainer.className = 'new-images-container';
            newImageContainer.id = 'newImagesContainer';
            imagePreview.appendChild(newImageContainer);
        }
        
        // Clear new images container
        newImageContainer.innerHTML = '';
        
        // Create preview for each new file
        uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item new-image';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="New Image ${index + 1}">
                    <div class="remove-image" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </div>
                    <div class="image-label new-label">New Image</div>
                `;
                
                // Add click event to remove image
                const removeBtn = previewItem.querySelector('.remove-image');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeImage(index);
                });
                
                newImageContainer.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // Remove an image from the preview
    function removeImage(index) {
        uploadedFiles.splice(index, 1);
        updateImagePreview();
    }
    
    // Function to convert image file to base64
    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Function to save product to server
    async function saveProductToServer(productData, imageFiles) {
        // Convert images to base64
        const images = [];
        for (const file of imageFiles) {
            const base64 = await convertImageToBase64(file);
            images.push(base64);
        }
        
        // Send to PHP backend
        const response = await fetch('api/save-product.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product: productData,
                images: images
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save product');
        }
        
        return await response.json();
    }

    // Handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Basic form validation
        const productName = document.getElementById('productName').value.trim();
        const productPrice = document.getElementById('productPrice').value;
        const productDescription = document.getElementById('productDescription').value.trim();
        const productCategory = document.getElementById('productCategory').value;
        const productStock = document.getElementById('productStock').value;
        const productSku = document.getElementById('productSku').value.trim() || `ST-${Date.now()}`;
        const productId = document.querySelector('input[name="productId"]')?.value;
        
        if (!productName || !productPrice || !productDescription || !productCategory) {
            alert('Please fill in all required fields.');
            return;
        }
        
        if (uploadedFiles.length === 0) {
            alert('Please upload at least one image.');
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = productForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            // Create product data
            const productData = {
                id: productId || Date.now().toString(),
                name: productName,
                price: parseFloat(productPrice),
                description: productDescription,
                category: productCategory,
                stock: parseInt(productStock) || 0,
                sku: productSku,
                createdAt: new Date().toISOString()
            };
            
            // Save product to server (automatically saves to files)
            const result = await saveProductToServer(productData, uploadedFiles);
            
            if (result.success) {
                // Show success message
                showSuccessMessage();
                
                // Reset form after successful save
                setTimeout(() => {
                    resetForm();
                }, 1500);
            } else {
                throw new Error(result.error || 'Failed to save product');
            }
            
        } catch (error) {
            alert(`Error: ${error.message || 'Failed to save product. Please try again.'}`);
        } finally {
            // Reset button state
            const submitBtn = productForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Save Product';
            }
        }
    }
    
    // Show success message
    function showSuccessMessage() {
        successModal.style.display = 'flex';
        setTimeout(() => {
            successModal.classList.add('show');
        }, 10);
    }
    
    // Reset the form
    function resetForm() {
        // Hide success modal
        successModal.classList.remove('show');
        setTimeout(() => {
            successModal.style.display = 'none';
        }, 300);
        
        // Reset form fields
        productForm.reset();
        
        // Clear uploaded files
        uploadedFiles = [];
        updateImagePreview();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Initialize the admin panel
    initAdmin();
});
