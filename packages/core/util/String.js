export const capitalize = (string) => {
  return string.toLowerCase().replace(/([A-zÀ-ú])([A-zÀ-ú]*)/g, (match, group1, group2) => group1.toUpperCase() + group2)
}
