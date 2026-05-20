/**
 * Download utilities for browser environment
 */

/**
 * Download a file with the specified content and filename
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download content as JSON file
 */
export function downloadAsJson(content: string, filename: string): void {
  downloadFile(content, filename, "application/json;charset=utf-8");
}

/**
 * Download content as Markdown file
 */
export function downloadAsMarkdown(content: string, filename: string): void {
  downloadFile(content, filename, "text/markdown;charset=utf-8");
}

/**
 * Download content as CSV file
 */
export function downloadAsCsv(content: string, filename: string): void {
  // Add BOM for Excel compatibility with Japanese characters
  const bom = "\uFEFF";
  downloadFile(bom + content, filename, "text/csv;charset=utf-8");
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Open file picker and read selected file
 */
export function openFilePicker(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;

    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      resolve(file);
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

/**
 * Open file picker and read file content as text
 */
export async function openAndReadFile(accept: string): Promise<{ file: File; content: string } | null> {
  const file = await openFilePicker(accept);

  if (!file) {
    return null;
  }

  const content = await readFileAsText(file);
  return { file, content };
}
