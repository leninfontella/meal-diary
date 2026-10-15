import type { Area } from 'react-easy-crop';

const MAX_WORKING_SIZE = 2400;
const MAX_OUTPUT_SIZE = 1400;

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível abrir esta imagem.'));
    image.src = source;
  });
}

function rotatedSize(width: number, height: number, rotation: number) {
  const radians = rotation * Math.PI / 180;
  return {
    width: Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
    height: Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Não foi possível recortar esta imagem.'));
    }, 'image/jpeg', 0.9);
  });
}

export async function cropImage(file: File, crop: Area, rotation: number) {
  const source = URL.createObjectURL(file);

  try {
    const image = await loadImage(source);
    const bounds = rotatedSize(image.naturalWidth, image.naturalHeight, rotation);
    const scale = Math.min(1, MAX_WORKING_SIZE / Math.max(bounds.width, bounds.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bounds.width * scale));
    canvas.height = Math.max(1, Math.round(bounds.height * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Seu navegador não conseguiu preparar o recorte.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(rotation * Math.PI / 180);
    context.drawImage(
      image,
      -image.naturalWidth * scale / 2,
      -image.naturalHeight * scale / 2,
      image.naturalWidth * scale,
      image.naturalHeight * scale,
    );

    const sourceX = Math.max(0, crop.x * scale);
    const sourceY = Math.max(0, crop.y * scale);
    const sourceWidth = Math.min(crop.width * scale, canvas.width - sourceX);
    const sourceHeight = Math.min(crop.height * scale, canvas.height - sourceY);
    const outputSize = Math.max(1, Math.min(MAX_OUTPUT_SIZE, Math.round(Math.min(crop.width, crop.height))));
    const output = document.createElement('canvas');
    output.width = outputSize;
    output.height = outputSize;

    const outputContext = output.getContext('2d');
    if (!outputContext) throw new Error('Seu navegador não conseguiu preparar o recorte.');
    outputContext.imageSmoothingEnabled = true;
    outputContext.imageSmoothingQuality = 'high';
    outputContext.drawImage(canvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputSize, outputSize);

    const blob = await canvasToBlob(output);
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'refeicao';
    return new File([blob], `${baseName}-recortada.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(source);
  }
}
