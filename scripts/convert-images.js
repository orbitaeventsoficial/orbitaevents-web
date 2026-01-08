const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

let totalOriginalSize = 0;
let totalConvertedSize = 0;
let convertedCount = 0;
let skippedCount = 0;

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

async function convertImages(dir = './public/img') {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(dir, file.name);

      if (file.isDirectory()) {
        await convertImages(filePath);
        continue;
      }

      // Skip if already WebP or not an image
      if (!/\.(jpg|jpeg|png)$/i.test(file.name)) {
        continue;
      }

      const outputPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

      // Skip if WebP already exists
      try {
        await fs.access(outputPath);
        skippedCount++;
        console.log(`⏭️  Skipped (already exists): ${file.name}`);
        continue;
      } catch {
        // WebP doesn't exist, continue with conversion
      }

      try {
        const originalSize = await getFileSize(filePath);

        // Determine quality based on directory
        let quality = 85; // default
        if (filePath.includes('portfolio')) {
          quality = 80; // portfolio images
        } else if (filePath.includes('hero') || filePath.includes('banner')) {
          quality = 90; // hero images need higher quality
        } else if (filePath.includes('thumb')) {
          quality = 75; // thumbnails can be lower
        }

        await sharp(filePath)
          .webp({ quality: quality })
          .toFile(outputPath);

        const convertedSize = await getFileSize(outputPath);
        totalOriginalSize += originalSize;
        totalConvertedSize += convertedSize;
        convertedCount++;

        const savings = ((1 - convertedSize / originalSize) * 100).toFixed(1);
        console.log(`✅ Converted: ${file.name} → ${path.basename(outputPath)} (${savings}% smaller, quality: ${quality})`);
      } catch (error) {
        console.error(`❌ Error converting ${file.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error.message);
  }
}

async function main() {
  console.log('🖼️  Starting image optimization...\n');
  console.log('📁 Converting images in public/img/\n');

  const startTime = Date.now();

  await convertImages();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Conversion complete!');
  console.log('='.repeat(60));
  console.log(`✅ Converted: ${convertedCount} images`);
  console.log(`⏭️  Skipped: ${skippedCount} images (already exist)`);
  console.log(`📊 Original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📊 New size: ${(totalConvertedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`💾 Total saved: ${((totalOriginalSize - totalConvertedSize) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱️  Time taken: ${duration} seconds`);
  console.log('='.repeat(60));
  console.log('\n⚠️  Next steps:');
  console.log('1. Verify WebP images in browser');
  console.log('2. Update Image components to use .webp extensions');
  console.log('3. Test build: pnpm build');
  console.log('4. If all good, delete original JPG/PNG files');
}

main().catch(console.error);
