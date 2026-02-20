// Import polyfill for Firefox compatibility
// This makes chrome.* APIs work with promises in Firefox
try {
  importScripts('../lib/browser-polyfill.min.js');
} catch (e) {
  // Chrome doesn't support importScripts in service workers in some contexts
  // The polyfill will be available via the global scope if needed
}

// Background service worker for handling image fetches
// This runs with more permissive CORS policies than content scripts

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchImage') {
    fetchImageAsBlob(request.url)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('Error fetching image:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

async function fetchImageAsBlob(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Determine file extension from content type
    let extension = '.jpg';
    if (contentType.includes('png')) {
      extension = '.png';
    } else if (contentType.includes('gif')) {
      extension = '.gif';
    } else if (contentType.includes('webp')) {
      extension = '.webp';
    } else if (contentType.includes('svg')) {
      extension = '.svg';
    } else if (contentType.includes('bmp')) {
      extension = '.bmp';
    } else if (contentType.includes('ico')) {
      extension = '.ico';
    }

    // If no extension from content-type, try to get from URL
    if (extension === '.jpg') {
      const urlExtension = getExtensionFromUrl(url);
      if (urlExtension) {
        extension = urlExtension;
      }
    }

    // Convert blob to base64 for message passing
    const base64 = await blobToBase64(blob);

    return {
      success: true,
      blob: base64,
      contentType: contentType,
      extension: extension
    };

  } catch (error) {
    console.error(`Failed to fetch image from ${url}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i);
    if (match) {
      return '.' + match[1].toLowerCase();
    }
  } catch (error) {
    console.error('Error parsing URL:', error);
  }
  return null;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
