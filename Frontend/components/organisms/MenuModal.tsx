/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/redux/store";

import Modal from "./Modal";
import { ModalActionTypes, ModalTypes } from "@/types/modal";
import { Button } from "../atoms";
import { RiLoader2Fill } from "react-icons/ri";
import { IoIosNotifications, IoIosNotificationsOff } from "react-icons/io";

import { BiLogOut } from "react-icons/bi";
import { signOut } from "@/redux/actions/authAction";
import { CgProfile } from "react-icons/cg";

export function SettingsModal() {
  const dispatch = useAppDispatch();
  const modalReducer = useAppSelector((state) => state.modalReducer);
  const { authUser, hasAuthCookie } = useAppSelector((state) => state.authReducer);

  const handleClose = () => {
    dispatch({ type: ModalActionTypes.CLOSE_MODAL, payload: { type: ModalTypes.SETTINGS } });
  };

  const handleSignOut = async () => {
    try {
    } catch (error) {}
    await dispatch(signOut());
  };
  if (!modalReducer[ModalTypes.SETTINGS] || !modalReducer[ModalTypes.SETTINGS].isOpen) return null;

  return (
    <Modal
      isOpen={modalReducer[ModalTypes.SETTINGS].isOpen}
      onClose={handleClose}
      title="Settings"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex-2 flex flex-row items-center justify-between">
          <Link
            href={`/profile/${authUser?._id}`}
            onClick={handleClose}
          >
            <Button>
              <CgProfile
                size={24}
                color="white"
              />
            </Button>
          </Link>

          {hasAuthCookie && authUser && (
            <Link href="/auth/signIn">
              <Button
                disabled={!authUser}
                onClick={handleSignOut}
              >
                <BiLogOut
                  size={24}
                  color="white"
                />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );
}
