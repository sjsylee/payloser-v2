"use client";

import { useState } from "react";

type UseMemberAddFormInput = {
  addMember: (displayName: string) => Promise<void>;
};

export function useMemberAddForm({ addMember }: UseMemberAddFormInput) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const submit = async () => {
    await addMember(name);
    setName("");
    setOpen(false);
  };

  return {
    name,
    open,
    setName,
    setOpen,
    submit,
  };
}
