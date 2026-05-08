import { IMAGE_PLACEHOLDERS } from "./imagePlaceholders";
import { ImageFolder } from "../constants/imageFolders";

const IMAGE_CDN = process.env.NEXT_PUBLIC_IMAGE_URL!;

export const getImageUrl = (
  folder: ImageFolder,
  fileName?: string | null
) => {
  const finalFile = fileName || IMAGE_PLACEHOLDERS[folder];

  if (finalFile.startsWith("http")) {
    return finalFile;
  }

  return `${IMAGE_CDN}${folder}/${finalFile}`;
};