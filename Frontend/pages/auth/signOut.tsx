/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect } from "react";
import { signOut } from "@/redux/actions/authAction";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/store";

export default function SignOutPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    const signOutUser = async () => {
      await dispatch(signOut());
    };
    signOutUser();
    router.replace("/");
  }, []);

  return <></>;
}
