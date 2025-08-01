/* eslint-disable @typescript-eslint/no-explicit-any */
// components/providers/modal-provider.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ModalKey = string;

interface ModalState {
    key: ModalKey;
    title?: string;
    props?: Record<string, any>;
}

interface ModalContextType {
    openModal: (
        key: ModalKey,
        options?: {
            title?: string;
            props?: Record<string, any>;
        }
    ) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = () => {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error("useModal must be used inside ModalProvider");
    return ctx;
};

interface ModalProviderProps {
    modals: Record<
        ModalKey,
        React.ComponentType<{ close: () => void; props?: Record<string, any> }>
    >;
    children: ReactNode;
}

export const ModalProvider = ({ modals, children }: ModalProviderProps) => {
    const [state, setState] = useState<ModalState | null>(null);

    const openModal = (key: ModalKey, options?: { title?: string; props?: Record<string, any> }) => {
        setState({ key, title: options?.title, props: options?.props });
    };

    const closeModal = () => {
        setState(null);
    };

    const ActiveModal = state ? modals[state.key] : null;

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            <Dialog open={!!state} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="max-w-lg">
                    <DialogTitle className={cn("mb-6", !state?.title && "hidden")}>{state?.title}</DialogTitle>
                    {ActiveModal && <ActiveModal close={closeModal} props={state?.props} />}
                </DialogContent>
            </Dialog>
        </ModalContext.Provider>
    );
};