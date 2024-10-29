#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        console.error(`Failed to download image: ${url} (Status: ${response.statusCode})`);
        resolve();
        return;
      }
      const writer = fs.createWriteStream(filepath);
      response.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', (err) => {
        console.error(`Error writing file ${filepath}: ${err.message}`);
        resolve();
      });
    }).on('error', (err) => {
      console.error(`Error downloading ${url}: ${err.message}`);
      resolve();
    });
  });
}

function printHelp() {
  console.log(`Usage:
    markdown-image-extractor <filename> [prefix]
Options:
    --help, -h      Show this help message and exit.
Description:
    Downloads images referenced in a markdown file and updates their paths locally.
    If [prefix] is not provided, defaults to 'img'.
Install Directory:
    ${__dirname}`);
}

function isMarkdownFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const sample = fileContent.slice(0, 1000); // Read the first 1000 characters for detection
    const markdownPatterns = [
      /^#{1,6} /m,            // Headers (#, ##, etc.)
      /^- |\* |\+ /m,         // Lists (-, *, +)
      /\!\[.*?\]\(.*?\)/m,    // Images ![alt](url)
      /\[.*?\]\(.*?\)/m       // Links [text](url)
    ];
    return markdownPatterns.some((pattern) => pattern.test(sample));
  } catch (err) {
    console.error(`Failed to read file for markdown check: ${filePath}. Error: ${err.message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.length < 1) {
    console.error('Usage: markdown-image-extractor <filename> [prefix]');
    process.exit(1);
  }

  const filename = args[0];
  const prefix = args[1] || 'img';
  const cwd = process.cwd();
  const filePath = path.join(cwd, filename);

  try {
    if (!fs.existsSync(filePath) || !isMarkdownFile(filePath)) {
      console.error(`File not found or not a markdown file: ${filename}`);
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const regex = /!\[.*?\]\((.*?)\)/g;
    let match;
    let imageUrls = [];

    while ((match = regex.exec(content)) !== null) {
      imageUrls.push(match[1]);
    }

    if (imageUrls.length === 0) {
      console.error('No images found in the markdown file.');
      return;
    }

    const urlToLocalMap = new Map();
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const imageNumber = i + 1;
      let ext;
      try {
        const urlObj = new URL(imageUrl);
        ext = path.extname(urlObj.pathname) || '.jpg';
      } catch {
        console.error(`Skipping invalid URL: ${imageUrl}`);
        continue;
      }

      const imgFilename = `${prefix}${imageNumber}${ext}`;
      const filepath = path.join(cwd, imgFilename);

      console.log(`Downloading image ${imageNumber}: ${imageUrl}`);

      try {
        await downloadImage(imageUrl, filepath);
        console.log(`Saved image as ${imgFilename}`);
        urlToLocalMap.set(imageUrl, imgFilename);
      } catch (err) {
        console.error(`Failed to download ${imageUrl}: ${err.message}`);
      }
    }

    let updatedContent = content;
    imageUrls.forEach((url) => {
      const localFilename = urlToLocalMap.get(url);
      if (localFilename) {
        updatedContent = updatedContent.replace(url, `./${localFilename}`);
      }
    });

    try {
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      console.log(`Updated image paths in ${filename}`);
    } catch (err) {
      console.error(`Failed to update markdown file: ${err.message}`);
    }
  } catch (err) {
    console.error(`Unexpected error: ${err.message}`);
  }
}

main();
