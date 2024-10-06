import { WebIO } from './@gltf-transform/core/dist/core.modern.js';
import { dedup, quantize, weld } from './@gltf-transform/functions/dist/functions.modern.js';

const io = new WebIO({ credentials: 'include' });

export class DamdomGLTFOptimizerElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 300px;
          height: 150px;
          background-color: grey;
        }
      </style>
    `;

    let fileSystemDirectoryHandle;

    const convertFile = async (fileName) => {
      const fileHandle = await fileSystemDirectoryHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      console.log(file);
      if (fileName.endsWith('gltf')) {
        const json = JSON.parse(await file.text());
        const document = io.readJSON({
          json,
          resources: {},
        });
        await document.transform(
          weld(),
          quantize(),
          dedup(),
        );
        console.log(document);
        const minifiedFileName = fileName.replace(/(.*)\..*/, '$1.min.glb');
        const minifiedFileHandle = await fileSystemDirectoryHandle.getFileHandle(minifiedFileName, { create: true });
        const writable = await minifiedFileHandle.createWritable();
        await writable.write(io.writeBinary(document));
        await writable.close();
      }
    };

    this.addEventListener('dragover', (event) => {
      event.preventDefault();
    });
    this.addEventListener('drop', async (event) => {
      event.preventDefault();
      for (const item of event.dataTransfer.items) {
        if (item.kind !== 'file') return;
        const handle = await item.getAsFileSystemHandle();
        if (handle.kind === 'file') {
          console.log('file');
          if (!fileSystemDirectoryHandle) console.warn('Drag and drop the directory containing the file first');
          const relativePaths = await fileSystemDirectoryHandle.resolve(handle);
          for (const filePath of relativePaths) {
            convertFile(filePath);
          }
          console.log(relativePaths);
        }
        else if (handle.kind === 'directory') {
          fileSystemDirectoryHandle = handle;
          console.log('directory', handle);
        }
      }
    });
  }
}

window.customElements.define('damdom-gltf-optimizer', DamdomGLTFOptimizerElement);
