// ============================================
// IMAGE CONFIGURATION
// ============================================
// Images are automatically detected! No configuration needed.
// Images should follow the naming pattern: {NN}.jpg (zero-padded numbers)
// Images are paired sequentially: 01.jpg & 02.jpg = page 1, 03.jpg & 04.jpg = page 2, etc.
// Example: 01.jpg, 02.jpg, 03.jpg, 04.jpg, 05.jpg, 06.jpg, etc.

// Image path configuration
const IMAGE_BASE_PATH = 'images';
const MAX_IMAGES_TO_CHECK = 100; // Maximum number of images to check (adjust if you have more)

// Check if an image file exists by trying to load it
function checkImageExists(imagePath) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imagePath;
  });
}

// Automatically discover all available image pages
async function discoverImagePages() {
  const pages = [];

  // Check for image pairs sequentially until we find a missing pair
  for (let i = 0; i < MAX_IMAGES_TO_CHECK; i++) {
    const leftImageNum = i * 2 + 1; // 1, 3, 5, 7...
    const rightImageNum = i * 2 + 2; // 2, 4, 6, 8...

    const leftPath = `${IMAGE_BASE_PATH}/${String(leftImageNum).padStart(2, '0')}.jpg`;
    const rightPath = `${IMAGE_BASE_PATH}/${String(rightImageNum).padStart(2, '0')}.jpg`;

    // Check if both images in the pair exist
    const [leftExists, rightExists] = await Promise.all([checkImageExists(leftPath), checkImageExists(rightPath)]);

    // If both images exist, add the page
    if (leftExists && rightExists) {
      pages.push({ left: leftPath, right: rightPath });
    } else {
      // Stop when we find a missing pair
      break;
    }
  }

  return pages;
}

// Global variables (will be initialized after image discovery)
let imagePages = [];
let totalPages = 0;
let currentPage = 0;
let currentImageIndex = 0; // For mobile: tracks individual images

// Get DOM elements
const leftPanel = document.querySelector('.left-panel img');
const rightPanel = document.querySelector('.right-panel img');
const diptych = document.querySelector('.diptych');
const currentPageElement = document.querySelector('.image-number-current');
const totalPagesElement = document.querySelector('.image-number-total');

// Function to check if mobile view
function isMobileView() {
  return window.matchMedia('(max-width: 768px)').matches;
}

// Function to get total images based on viewport
function getTotalImages() {
  if (isMobileView()) {
    // Mobile: total individual images (each page has 2 images: left + right)
    return totalPages * 2;
  } else {
    // Desktop: total pages (showing 2 images at a time)
    return totalPages;
  }
}

// Function to get current image number based on viewport
function getCurrentImageNumber() {
  if (isMobileView()) {
    // Mobile: current individual image index
    return currentImageIndex + 1;
  } else {
    // Desktop: current page number
    return currentPage + 1;
  }
}

// Function to update counter display
function updateCounter() {
  if (currentPageElement && totalPagesElement) {
    const current = getCurrentImageNumber();
    const total = getTotalImages();
    currentPageElement.textContent = String(current).padStart(2, '0');
    totalPagesElement.textContent = String(total).padStart(2, '0');
  }
}

// Function to update images
function updateImages() {
  if (isMobileView()) {
    // Mobile: show individual images
    // Calculate which page and which side (left/right) based on currentImageIndex
    const pageIndex = Math.floor(currentImageIndex / 2);
    const isRightImage = currentImageIndex % 2 === 1;

    if (imagePages[pageIndex]) {
      if (isRightImage) {
        // Show right image in left panel (since right panel is hidden on mobile)
        leftPanel.src = imagePages[pageIndex].right;
      } else {
        // Show left image
        leftPanel.src = imagePages[pageIndex].left;
      }
      // Keep right panel hidden (handled by CSS)
    }
  } else {
    // Desktop: show both images of current page
    if (imagePages[currentPage]) {
      leftPanel.src = imagePages[currentPage].left;
      rightPanel.src = imagePages[currentPage].right;
    }
  }

  // Update counter
  updateCounter();
}

// Function to go to next page/image
function nextPage() {
  if (isMobileView()) {
    // Mobile: navigate through individual images
    const totalImages = totalPages * 2;
    currentImageIndex = (currentImageIndex + 1) % totalImages;
    // Update currentPage to match for consistency
    currentPage = Math.floor(currentImageIndex / 2);
  } else {
    // Desktop: navigate through pages
    if (imagePages.length > 0) {
      currentPage = (currentPage + 1) % imagePages.length;
    } else {
      currentPage = (currentPage + 1) % totalPages;
    }
    // Update currentImageIndex to match for consistency
    currentImageIndex = currentPage * 2;
  }
  updateImages();
}

// Update counter and sync state when window is resized (mobile/desktop switch)
window.addEventListener('resize', () => {
  // Sync currentImageIndex and currentPage when switching views
  if (isMobileView()) {
    // Switching to mobile: calculate image index from current page
    currentImageIndex = currentPage * 2;
  } else {
    // Switching to desktop: calculate page from current image index
    currentPage = Math.floor(currentImageIndex / 2);
  }
  updateImages();
});

// Initialize everything on page load
async function initialize() {
  // Discover available images
  imagePages = await discoverImagePages();
  totalPages = imagePages.length;

  if (imagePages.length === 0) {
    console.warn('No images found! Make sure you have images named 01.jpg, 02.jpg, etc. in the images folder.');
    return;
  }

  // Initialize counter and images
  updateCounter();
  updateImages();

  // Add click event listener to diptych (image area)
  if (diptych) {
    diptych.addEventListener('click', nextPage);
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
