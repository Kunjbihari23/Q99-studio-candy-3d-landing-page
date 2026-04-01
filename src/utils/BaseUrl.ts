export const BaseUrl = "/jelzy-candy-rush/";
export const AssetPath = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${BaseUrl}${cleanPath}`;
};
