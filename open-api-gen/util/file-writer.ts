/**
 * Writes a generic object to a JSON file.
 * @param filePath - The path where the JSON file will be written.
 * @param data - The generic object to be written as JSON.
 */
export async function writeObjectToJSONFile<T>(
  filePath: string,
  data: T,
): Promise<void> {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    await Deno.writeTextFile(filePath, jsonData);
    console.log(`Successfully wrote to ${filePath}`);
  } catch (error) {
    console.error(`Failed to write to ${filePath}:`, error);
  }
}

// Use this function to write a generic object to a JSON file.
export const exampleUsage = async () => {
  const exampleData = {
    name: "OpenAPI Spec",
    version: "3.1.0",
    paths: {},
  };

  await writeObjectToJSONFile("openapi-spec.json", exampleData);
};

exampleUsage();
