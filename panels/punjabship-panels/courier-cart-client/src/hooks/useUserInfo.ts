import { useQuery } from "@tanstack/react-query";
import { getUserInfo } from "../api/user";

export const useUserInfo = () =>
  useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfo(),
    enabled: true,
    refetchOnWindowFocus: false,
  });
