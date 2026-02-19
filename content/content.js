(function() {
  try {
    // Get page title
    const pageTitle = document.title || 'Untitled Page';

    // Extract all image URLs
    const images = [];
    const imageElements = document.querySelectorAll('img');

    imageElements.forEach(img => {
      let src = img.src;

      // Skip data URLs (base64 encoded images) for now
      if (src && !src.startsWith('data:')) {
        // Convert relative URLs to absolute
        try {
          const absoluteUrl = new URL(src, window.location.href);
          images.push(absoluteUrl.href);
        } catch (error) {
          console.warn('Invalid image URL:', src);
        }
      }
    });

    // Remove duplicates
    const uniqueImages = [...new Set(images)];

    // Initialize Turndown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
    });

    // Add custom rules for better conversion
    turndownService.addRule('strikethrough', {
      filter: ['del', 's', 'strike'],
      replacement: function(content) {
        return '~~' + content + '~~';
      }
    });

    // Handle tables better
    turndownService.addRule('tableCell', {
      filter: ['th', 'td'],
      replacement: function(content, node) {
        return ' ' + content.trim() + ' |';
      }
    });

    // Get the page content
    // Clone the document to avoid modifying the actual page
    const clonedBody = document.body.cloneNode(true);

    // Remove script and style tags
    const scripts = clonedBody.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());

    // Convert to HTML string
    const htmlContent = clonedBody.innerHTML;

    // Convert HTML to Markdown
    const markdown = turndownService.turndown(htmlContent);

    // Add title as H1 at the beginning
    const fullMarkdown = `# ${pageTitle}\n\n${markdown}`;

    // Return the data
    return {
      markdown: fullMarkdown,
      images: uniqueImages,
      pageTitle: pageTitle
    };

  } catch (error) {
    console.error('Content script error:', error);
    return {
      markdown: '# Error\n\nFailed to extract page content: ' + error.message,
      images: [],
      pageTitle: 'Error'
    };
  }
})();
