import { ImageFolder } from "../constants/imageFolders";

export const IMAGE_PLACEHOLDERS: Record<ImageFolder, string> = {
  [ImageFolder.BANNER]: "banner_placeholder.png",
  [ImageFolder.CATEGORY]: "category.webp",
  [ImageFolder.FEATURE]: "productlist_placeholder.png",
  [ImageFolder.FIRST_PURCHASE]: "productlist_placeholder.png",
  [ImageFolder.NOTE]: "productlist_placeholder.png",
  [ImageFolder.PRODUCT]: "productlist_placeholder.png",
  [ImageFolder.PROFILE]: "profile.webp",
  [ImageFolder.REVIEW]: "review.webp",
  [ImageFolder.VIDEOS]: "videos.webp",
};
