// hooks/useKycTextExtractor.ts
import { useState } from "react";
import { extractTextFromFile } from "../../api/user";

export const useKycTextExtractor = () => {
  const [extractedText, setExtractedText] = useState<Record<string, string>>(
    {}
  );
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<Record<string, string>>({});

  const extract = async (field: string, fileUrl: string, type?: string) => {
    try {
      setLoadingKey(field);
      setErrorKey((prev) => ({ ...prev, [field]: "" }));
      let text = "";
      if (fileUrl) text = await extractTextFromFile(fileUrl, type);
      setExtractedText((prev) => ({ ...prev, [field]: text }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrorKey((prev) => ({ ...prev, [field]: error.message }));
    } finally {
      setLoadingKey(null);
    }
  };

  return {
    extractedText,
    loadingKey,
    errorKey,
    extract,
  };
};
