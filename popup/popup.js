const exportBtn = document.getElementById('exportBtn');
const statusDiv = document.getElementById('status');
const progressDiv = document.getElementById('progress');
const progressText = progressDiv.querySelector('.progress-text');

exportBtn.addEventListener('click', async () => {
  try {
    exportBtn.disabled = true;
    showStatus('Starting export...', 'info');
    showProgress('Extracting page content...');

    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      throw new Error('No active tab found');
    }

    // Inject content script and get page data
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['lib/turndown.min.js']
    });

    const [pageData] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/content.js']
    });

    if (!pageData || !pageData.result) {
      throw new Error('Failed to extract page data');
    }

    const { markdown, images, pageTitle } = pageData.result;

    showProgress(`Found ${images.length} images. Downloading...`);

    // Fetch all images via background script
    const imageBlobs = await fetchImages(images);

    showProgress('Creating ZIP file...');

    // Create ZIP file
    const zipBlob = await createZipFile(markdown, imageBlobs, pageTitle);

    showProgress('Downloading...');

    // Trigger download
    await downloadZip(zipBlob, pageTitle);

    showStatus('Export completed successfully!', 'success');
    hideProgress();

    setTimeout(() => {
      exportBtn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('Export error:', error);
    showStatus(`Error: ${error.message}`, 'error');
    hideProgress();
    exportBtn.disabled = false;
  }
});

async function fetchImages(imageUrls) {
  const imageBlobs = [];

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      showProgress(`Downloading image ${i + 1} of ${imageUrls.length}...`);

      const response = await chrome.runtime.sendMessage({
        action: 'fetchImage',
        url: imageUrls[i]
      });

      if (response.success && response.blob) {
        // Convert base64 back to blob
        const byteCharacters = atob(response.blob);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: response.contentType || 'image/jpeg' });

        imageBlobs.push({
          url: imageUrls[i],
          blob: blob,
          filename: `image_${String(i + 1).padStart(3, '0')}${response.extension || '.jpg'}`
        });
      } else {
        console.warn(`Failed to fetch image: ${imageUrls[i]}`);
        imageBlobs.push(null);
      }
    } catch (error) {
      console.error(`Error fetching image ${imageUrls[i]}:`, error);
      imageBlobs.push(null);
    }
  }

  return imageBlobs;
}

async function createZipFile(markdown, imageBlobs, pageTitle) {
  const zip = new JSZip();

  // Replace image URLs in markdown with local paths
  let updatedMarkdown = markdown;
  imageBlobs.forEach((imageData, index) => {
    if (imageData) {
      const escapedUrl = imageData.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`!\\[([^\\]]*)\\]\\(${escapedUrl}\\)`, 'g');
      updatedMarkdown = updatedMarkdown.replace(regex, `![$1](./images/${imageData.filename})`);

      // Also handle plain URLs in case they weren't converted to markdown images
      updatedMarkdown = updatedMarkdown.replace(new RegExp(escapedUrl, 'g'), `./images/${imageData.filename}`);
    }
  });

  // Add markdown file
  const filename = sanitizeFilename(pageTitle) || 'page';
  zip.file(`${filename}.md`, updatedMarkdown);

  // Add images folder
  const imagesFolder = zip.folder('images');
  imageBlobs.forEach(imageData => {
    if (imageData && imageData.blob) {
      imagesFolder.file(imageData.filename, imageData.blob);
    }
  });

  // Generate ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

async function downloadZip(zipBlob, pageTitle) {
  const url = URL.createObjectURL(zipBlob);
  const filename = `${sanitizeFilename(pageTitle) || 'page'}.zip`;

  await chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });

  // Clean up object URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function sanitizeFilename(filename) {
  if (!filename) return 'page';
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');
}

function showProgress(message) {
  progressText.textContent = message;
  progressDiv.classList.remove('hidden');
}

function hideProgress() {
  progressDiv.classList.add('hidden');
}
