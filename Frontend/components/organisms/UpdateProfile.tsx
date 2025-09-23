import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import Modal from "./Modal";
import { ModalActionTypes, ModalTypes } from "@/types/modal";
import { RiLoader2Line } from "react-icons/ri";
import { IoSendSharp } from "react-icons/io5";
import { Button } from "../atoms";
import { AuthActionTypes } from "@/types/auth";
import { updateUser } from "@/redux/actions/authAction";

const UpdateProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, tempUser } = useAppSelector((state) => state.authReducer);
  const modalReducer = useAppSelector((state) => state.modalReducer);

  // Section state: "basic" | "bio" | "location" | "dob" | null
  const [section, setSection] = useState<"basic" | "bio" | "location" | "dob" | null>("basic");

  if (!modalReducer[ModalTypes.UPDATE_PROFILE].isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    // Handle file input for avatar and cover
    if (name === "avatar" || name === "cover") {
      if (files && files[0]) {
        const file = files[0];
        dispatch({
          type: AuthActionTypes.SELF_ON_CHANGE,
          payload: { [name]: file },
        });
      }
      return;
    }
    if (name === "firstName" || name === "middleName" || name === "lastName") {
      dispatch({
        type: AuthActionTypes.SELF_ON_CHANGE,
        payload: {
          name: {
            ...tempUser?.name,
            ...(name === "firstName" ? { first: value } : {}),
            ...(name === "middleName" ? { middle: value } : {}),
            ...(name === "lastName" ? { last: value } : {}),
          },
        },
      });
    } else {
      dispatch({ type: AuthActionTypes.SELF_ON_CHANGE, payload: { [name]: value } });
    }
  };

  const handleCancel = () => {
    dispatch({ type: ModalActionTypes.CLOSE_MODAL, payload: { type: ModalTypes.UPDATE_PROFILE } });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();

    if (section === "basic") {
      if (tempUser?.name) {
        if (tempUser.name.first !== undefined) formData.append("name[first]", tempUser.name.first);
        if (tempUser.name.middle !== undefined) formData.append("name[middle]", tempUser.name.middle);
        if (tempUser.name.last !== undefined) formData.append("name[last]", tempUser.name.last);
      }
    } else if (section === "bio") {
      if (tempUser?.bio !== undefined) formData.append("bio", tempUser.bio);
    } else if (section === "location") {
      if (tempUser?.location !== undefined) formData.append("location", tempUser.location);
    } else if (section === "dob") {
      if (tempUser?.dob !== undefined) formData.append("dob", tempUser.dob);
    } else if (section === "avatar") {
      if (tempUser?.avatar instanceof File) {
        formData.append("avatar", tempUser.avatar);
      }
    } else if (section === "cover") {
      if (tempUser?.cover instanceof File) {
        formData.append("cover", tempUser.cover);
      }
    }

    await dispatch(updateUser(formData));
    handleCancel();
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleCancel}
      title="Update Profile"
    >
      <form
        onSubmit={handleSave}
        className="space-y-4 text-sm text-gray-200"
      >
        {/* Section selector */}
        <div>
          <label
            className="mb-1 block"
            htmlFor="sectionSelect"
          >
            Select Section to Update
          </label>
          <select
            id="sectionSelect"
            className="w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={section || ""}
            onChange={(e) => setSection(e.target.value as typeof section)}
          >
            <option value="basic">Basic Info</option>
            <option value="avatar">Avatar</option>
            <option value="cover">Cover</option>
            <option value="bio">Bio</option>
            <option value="location">Location</option>
            <option value="dob">Date of Birth</option>
          </select>
        </div>

        {/* Conditionally render only the selected section */}
        {section === "basic" && (
          <>
            <div>
              <label
                className="mb-1 block"
                htmlFor="firstName"
              >
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className="w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
                value={tempUser?.name?.first}
                onChange={handleChange}
              />
            </div>
            <div>
              <label
                className="mb-1 block"
                htmlFor="middleName"
              >
                Middle Name
              </label>
              <input
                id="middleName"
                name="middleName"
                type="text"
                className="w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
                value={tempUser?.name?.middle || ""}
                onChange={handleChange}
              />
            </div>
            <div>
              <label
                className="mb-1 block"
                htmlFor="lastName"
              >
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
                value={tempUser?.name?.last || ""}
                onChange={handleChange}
              />
            </div>
          </>
        )}
        {section === "bio" && (
          <div>
            <label
              className="mb-1 block"
              htmlFor="bio"
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              className="w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
              value={tempUser?.bio || ""}
              onChange={handleChange}
              rows={3}
            />
          </div>
        )}
        {section === "location" && (
          <div>
            <label
              className="mb-1 block"
              htmlFor="location"
            >
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              className="w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
              value={tempUser?.location || ""}
              onChange={handleChange}
            />
          </div>
        )}
        {section === "dob" && (
          <div>
            <label
              className="mb-1 block"
              htmlFor="dob"
            >
              Date of Birth
            </label>
            <input
              id="dob"
              name="dob"
              type="date"
              className="w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
              value={tempUser?.dob || ""}
              onChange={handleChange}
            />
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            onClick={handleCancel}
            className="rounded-md bg-gray-700 px-4 py-2 hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="rounded-md bg-green-600 px-4 py-2 hover:bg-green-700"
          >
            {loading ? (
              <RiLoader2Line
                size={22}
                className="animate-spin"
              />
            ) : (
              <IoSendSharp size={22} />
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateProfile;
