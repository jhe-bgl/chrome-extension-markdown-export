# Chrome Extension: Page to Markdown Exporter

A Chrome extension that converts web pages to Markdown format, downloads all images, and packages everything as a ZIP file.

## Features

- Converts entire web pages to clean Markdown format
- Downloads all images from the page
- Organizes images in a separate folder
- Updates image links in Markdown to reference local files
- Packages everything as a ZIP file for easy download

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `chrome-extension-markdown-export` folder

## Usage

1. Navigate to any web page you want to export
2. Click the extension icon in the Chrome toolbar
3. Click "Export Page as Markdown"
4. Wait for the extension to process the page and download images
5. The ZIP file will be downloaded automatically
6. Extract the ZIP to view the Markdown file with images

## Project Structure

```
chrome-extension-markdown-export/
├── manifest.json              # Extension configuration (Manifest V3)
├── popup/
│   ├── popup.html            # Extension popup UI
│   ├── popup.js              # Popup logic and orchestration
│   └── popup.css             # Popup styling
├── content/
│   └── content.js            # Content script for DOM extraction
├── background/
│   └── background.js         # Service worker for image fetching
├── lib/
│   ├── turndown.min.js       # HTML to Markdown converter
│   └── jszip.min.js          # ZIP file creation library
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## How It Works

1. **Content Script** (`content/content.js`):
   - Extracts HTML content from the current page
   - Finds all image URLs
   - Converts HTML to Markdown using Turndown.js

2. **Background Service Worker** (`background/background.js`):
   - Fetches images as blobs (handles CORS better than content scripts)
   - Determines file types and extensions

3. **Popup** (`popup/popup.js`):
   - Orchestrates the export process
   - Creates image filename mapping
   - Replaces image URLs in Markdown with local paths
   - Creates ZIP file with JSZip
   - Triggers download

## Testing

### Test Cases

1. **Simple page with images**: Visit a Wikipedia article or blog post
2. **Page with many images**: Visit an image-heavy site like a photo gallery
3. **Page with relative URLs**: Test with pages that use relative image paths
4. **Large page**: Test with long articles to verify performance

### Verification Steps

After exporting a page:
1. Extract the downloaded ZIP file
2. Verify the Markdown file contains the page content
3. Check that the `images/` folder contains all images
4. Open the Markdown file in a viewer (like VS Code or Typora)
5. Confirm that images display correctly with local paths

## Technical Details

### Libraries Used

- **Turndown.js** (v7.1.2): Converts HTML to Markdown
- **JSZip** (v3.10.1): Creates ZIP archives in the browser

### Permissions

- `activeTab`: Access the current tab's content
- `downloads`: Trigger file downloads
- `scripting`: Inject content scripts
- `<all_urls>`: Fetch images from any domain

### Limitations

- Base64-encoded images (data URLs) are currently skipped
- Very large pages may take some time to process
- Some images may fail to download due to CORS restrictions or 404 errors
- The extension continues processing even if some images fail

## Troubleshooting

### Extension doesn't appear
- Make sure Developer mode is enabled in `chrome://extensions/`
- Try reloading the extension

### Images not downloading
- Check the browser console for errors
- Some sites may block image fetching due to CORS policies
- Verify the images are accessible (not requiring authentication)

### ZIP file not downloading
- Check Chrome's download settings
- Ensure downloads are not blocked for the extension
- Check the popup for error messages

## Future Enhancements

- Support for base64-encoded images
- Option to include/exclude specific elements
- Custom Markdown formatting options
- Progress bar for large pages
- Image optimization/compression
- Support for other export formats

## License

MIT License
