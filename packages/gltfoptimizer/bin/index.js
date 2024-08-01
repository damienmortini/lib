#!/usr/bin/env node

import fbx2gltf from 'fbx2gltf';
import { existsSync, mkdirSync, readdirSync } from 'fs';

let inputDirectory = process.cwd();
let outputDirectory = process.cwd();
let dracoCompression = false;

const args = process.argv.slice(2);
for (const [index, value] of args.entries()) {
  if (value === '--help' || value === '-h') {
    console.log(`
      Usage: gltfoptimizer [options]

      Options:
        --help, -h      Show this help message
        --draco, -d      Enable DRACO conversion
        --input, -i     Input directory
        --output, -o    Output directory
    `);
    process.exit(0);
  }
  if (value === '--input' || value === '-i') {
    inputDirectory = `${inputDirectory}/${args[index + 1]}`;
  }
  if (value === '--output' || value === '-o') {
    outputDirectory = `${outputDirectory}/${args[index + 1]}`;
  }
  if (value === '--draco' || value === '-d') {
    dracoCompression = true;
  }
}

const convertAndOptimizeModels = async (path) => {
  const relativeDirectory = path.replace(inputDirectory, '');
  for (const dirent of readdirSync(path, { withFileTypes: true })) {
    if (dirent.isDirectory()) {
      convertAndOptimizeModels(`${path}/${dirent.name}/`);
      continue;
    }
    const fullFileName = dirent.name.toLowerCase();
    if (fullFileName.endsWith('.fbx')) {
      console.log(`Converting ${path}/${dirent.name}`);
      const fileName = fullFileName.replace(/\.fbx$/, '');
      const fullOutputDirectory = `${outputDirectory}${relativeDirectory}`;
      if (!existsSync(fullOutputDirectory)) {
        mkdirSync(fullOutputDirectory, { recursive: true });
      }
      const options = [];
      if (dracoCompression) {
        options.push('--draco');
      }
      await fbx2gltf(`${path}/${dirent.name}`, `${outputDirectory}${relativeDirectory}/${fileName}.glb`, options);
    }
    // const fileName = dirent.name.replace(/\.gltf|\.glb/, '')
    // execSync(`gltf-pipeline -i ${path}${dirent.name} -o models/${fileName}.glb`)
    // Convert to GLTF
    // await convert(`${path}${fileName}.fbx`, `${path}${fileName}.glb`);
    // execSync(`gltf-transform copy ${path}${fileName}.gltf ./models/${fileName}.gltf`);
    // execSync(`gltf-pipeline -i ./models/${fileName}.gltf -o models/${fileName}.glb`);
    // Add AO
    // execSync(`gltf-transform ao ${path}${fileName}.glb ${path}${fileName}.glb`);
    // execSync(`gltf-transform repack ${path}${fileName}.glb ${path}${fileName}.glb`);
    // execSync(`gltf-transform prune ${path}${fileName}.glb ${path}${fileName}.glb`);
  }
};

convertAndOptimizeModels(inputDirectory);
