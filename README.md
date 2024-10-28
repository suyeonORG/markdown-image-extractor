# Markdown Image Extractor

A simple Node.js tool to extract and download images from markdown files. It’s designed for scenarios where markdown files, such as those from websites like Mathpix, contain images hosted online. This tool downloads those images and updates the markdown to reference local versions instead.

## Features

- Extracts image URLs from markdown syntax `![](<image-url>)`.
- Downloads each image and saves it with a specified prefix.
- Replaces URLs in the markdown file with local paths, making it easy to host the images locally.

## Requirements

- Node.js (v14 or higher recommended)

## Installation

```bash
npm i -g markdown-image-extractor
```

## Usage

Navigate to the directory with your markdown file(s) and run:

```bash
markdown-image-extractor <prefix>
```

Replace `<prefix>` with a string prefix for naming the downloaded images. For example:

```bash
markdown-image-extractor "img"
```

This command will:
1. Search for all `.md` files in the current directory.
2. Extract all image URLs.
3. Download each image, saving it as `img1.jpg`, `img2.jpg`, etc., in the current directory.
4. Update the markdown files, replacing each URL with the path to the downloaded image.

### Example

Given a markdown file (`example.md`) with content like:

```markdown
![Image](https://cdn.domain.tld/cropped/image1.jpg)
Some text.
![Another Image](https://cdn.domain.tld/cropped/image2.png)
```

Running `markdown-image-extractor "img"` will:
1. Download the images as `img1.jpg` and `img2.png`.
2. Update `example.md` to:

   ```markdown
   ![Image](./img1.jpg)
   Some text.
   ![Another Image](./img2.png)
   ```

## Package Scripts

- `start`: Runs the script locally (e.g., `node main.js`).
- `lint`: Lints the codebase with ESLint.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for more details.

## Issues and Contributions

Please report issues at [GitHub Issues](https://github.com/suyeonORG/markdown-image-extractor/issues). Contributions are welcome!