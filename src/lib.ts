export const getCataloge = async () => {
  return (await getJsonFile("catalogue.json")) as {
    files: string[];
  };
};

export const getJsonFile = async (fileName: string) => {
  try {
    const response = await fetch(fileName);
    return await response.json();
  } catch (e) {
    throw new Error("Error fetching JSON data " + fileName);
  }
};

