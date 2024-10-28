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
        reject(new Error(`Failed to download image: ${url} (Status: ${response.statusCode})`));
        return;
      }

      const writer = fs.createWriteStream(filepath);
      response.pipe(writer);

      writer.on('finish', resolve);
      writer.on('error', reject);
    }).on('error', (err) => reject(err));
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: image_extractor <prefix>');
    process.exit(1);
  }

  const prefix = args[0];
  const cwd = process.cwd();

  const files = fs.readdirSync(cwd).filter(file => file.endsWith('.md'));

  if (files.length === 0) {
    console.error('No .md files found in the current directory.');
    process.exit(1);
  }

  let imageUrls = [];
  const fileImagesMap = new Map();

  for (const file of files) {
    const content = fs.readFileSync(path.join(cwd, file), 'utf-8');
    const regex = /!\[.*?\]\((.*?)\)/g;
    let match;
    let urls = [];
    while ((match = regex.exec(content)) !== null) {
      urls.push(match[1]);
    }
    fileImagesMap.set(file, urls);
    imageUrls = imageUrls.concat(urls);
  }

  if (imageUrls.length === 0) {
    console.error('No images found in the markdown files.');
    process.exit(1);
  }

  const urlToLocalMap = new Map();
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    const imageNumber = i + 1;
    const urlObj = new URL(imageUrl);
    let ext = path.extname(urlObj.pathname);
    if (!ext) {
      ext = '.jpg';
    } else {
      ext = ext.split('?')[0];
    }
    const filename = `${prefix}${imageNumber}${ext}`;
    const filepath = path.join(cwd, filename);

    console.log(`Downloading image ${imageNumber}: ${imageUrl}`);

    try {
      await downloadImage(imageUrl, filepath);
      console.log(`Saved image as ${filename}`);
      urlToLocalMap.set(imageUrl, filename);
    } catch (err) {
      console.error(`Failed to download ${imageUrl}: ${err.message}`);
    }
  }

  for (const [file, urls] of fileImagesMap.entries()) {
    let content = fs.readFileSync(path.join(cwd, file), 'utf-8');
    urls.forEach((url) => {
      const localFilename = urlToLocalMap.get(url);
      if (localFilename) {
        content = content.replace(url, `./${localFilename}`);
      }
    });
    fs.writeFileSync(path.join(cwd, file), content, 'utf-8');
    console.log(`Updated image paths in ${file}`);
  }
}

main();
