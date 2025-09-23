import { useAppSelector, useAppDispatch } from "@/redux/store";
import { ModalActionTypes, ModalTypes } from "@/types/modal";
import Image from "next/image";
import React, { useEffect } from "react";
import { BiEdit } from "react-icons/bi";
import { getUserById } from "@/redux/actions/userAction";
import { useRouter } from "next/router";
import { Button } from "@/components/atoms";

export default function UserPage() {
  const router = useRouter();
  const { userId } = router.query as { userId: string };
  const { authUser } = useAppSelector((state) => state.authReducer);
  const { selectedUser } = useAppSelector((state) => state.userReducer);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (userId) dispatch(getUserById(userId));
  }, [userId]);

  if (!authUser) {
    router.push("/SignIn");
    return;
  }

  if (!selectedUser) {
    return (
      <div className="min-h-screen  text-white">
        <div className="mx-auto max-w-5xl px-4 pt-24">User not found.</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-y-scroll rounded-lg text-white">
      {/* Global top header */}

      {/* Wrap main content with padding top to prevent overlap */}
      <div className="">
        {/* Cover area */}
        <section className="relative h-96 w-full">
          {/* Cover image */}
          <div className="absolute inset-0">
            {selectedUser.cover ? (
              <Image
                src={selectedUser.cover as string}
                alt="cover"
                fill
                priority
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-zinc-800 to-slate-900" />
            )}
            {/* subtle dark overlay for readability */}
            <div className="absolute inset-0 bg-black/30" />
          </div>
        </section>

        {/* Name + quick meta row */}
        <section className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between gap-3 pt-14">
            <div>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                {selectedUser?.name?.first || selectedUser.username}
                {selectedUser?.name?.last ? ` ${selectedUser.name.last}` : ""}
              </h1>
              <p className="text-sm text-zinc-300">@{selectedUser.username}</p>
            </div>
            <Button
              onClick={() =>
                dispatch({ type: ModalActionTypes.OPEN_MODAL, payload: { type: ModalTypes.UPDATE_PROFILE } })
              }
            >
              <BiEdit size={20} />
            </Button>
          </div>
          <div className="text-sm text-zinc-300">
            {selectedUser.bio && (
              <p>
                <span className="font-medium italic text-zinc-200">{selectedUser.bio}</span>
              </p>
            )}
          </div>
        </section>

        {/* Sticky tabs */}
        <nav className="sticky top-14 border-b border-t border-white/10 bg-black/60 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4">
            <ul className="no-scrollbar flex gap-6 overflow-x-auto text-sm">
              <li>
                <a
                  href="#about"
                  className="inline-block py-3 text-zinc-300 hover:text-white"
                >
                  About
                </a>
              </li>
            </ul>
          </div>
        </nav>

        {/* Content sections */}
        <main className="mx-auto max-w-5xl px-4">
          {/* About */}
          <section
            id="about"
            className="py-6"
          >
            <h2 className="mb-3 text-lg font-semibold">About</h2>
            <div className="grid grid-cols-1 gap-4 text-sm text-zinc-300">
              <div>
                <p className="text-zinc-400">Full Name</p>
                <p className="text-white">
                  {`${selectedUser.name?.first ?? ""} ${selectedUser.name?.middle ?? ""} ${selectedUser.name?.last ?? ""}`.trim() ||
                    "—"}
                </p>
              </div>
              <div>
                <p className="text-zinc-400">Location</p>
                <p className="text-white">{selectedUser.location || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-zinc-400">Bio</p>
                <p className="whitespace-pre-wrap text-white">{selectedUser.bio || "—"}</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
