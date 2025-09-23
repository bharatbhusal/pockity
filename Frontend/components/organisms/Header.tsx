/* eslint-disable @typescript-eslint/no-unused-vars */
// Client/components/Header.tsx
import Link from "next/link";
import { BiHomeCircle } from "react-icons/bi";
import { FiPlusCircle, FiArrowLeft, FiArrowRight, FiSettings } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";
import { Button } from "../atoms";
import { ModalActionTypes, ModalTypes } from "@/types/modal";

export function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasAuthCookie } = useAppSelector((state) => state.authReducer);

  const handleBack = () => {
    router.back();
  };
  const handleForward = () => {
    router.forward();
  };

  return (
    <div className="flex w-full items-center justify-between">
      <Button
        onClick={handleBack}
        disabled={!hasAuthCookie}
      >
        <FiArrowLeft
          size={24}
          color="white"
        />
      </Button>
      <Button
        onClick={handleForward}
        disabled={!hasAuthCookie}
      >
        <FiArrowRight
          size={24}
          color="white"
        />
      </Button>

      <Link
        href="/"
        className="flex w-fit"
      >
        <Button disabled={!hasAuthCookie}>
          <BiHomeCircle
            size={24}
            color="white"
          />
        </Button>
      </Link>

      <Button
        disabled={!hasAuthCookie}
        onClick={() => dispatch({ type: ModalActionTypes.OPEN_MODAL, payload: { type: ModalTypes.SETTINGS } })}
      >
        <FiSettings
          color="white"
          size={24}
        />
      </Button>
    </div>
  );
}
