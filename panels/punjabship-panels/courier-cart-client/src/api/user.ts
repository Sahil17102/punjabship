import axiosInstance from "./axiosInstance";

export const getUserInfo = async () => {
  const { data } = await axiosInstance.get(`/user/user-info`);
  return data; //
};

export const completeUserOnboarding = async (
  step: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
) => {
  const response = await axiosInstance.post("/user/complete-user-onboarding", {
    step,
    data,
  });
  return response.data;
};

export async function extractTextFromFile(
  fileUrl: string,
  type?: string
): Promise<string> {
  const res = await axiosInstance.post(
    "/profile/extract-text",
    {
      fileUrl,
      ...(type && { type }),
    },
    {
      timeout: 60000, // ✅ 60 seconds
    }
  );

  return res?.data?.text;
}
