/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Базовый тип модалки
export type ModalComponent<P = any> = React.ComponentType<{
    close: () => void;
    props?: P;
}>;

// Тип состояния
interface ModalState {
    key: string;
    title?: string;
    props?: any;
}

interface ModalContextType {
    openModal: (key: string, options?: { title?: string; props?: any }) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = () => {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error("useModal must be used inside ModalProvider");
    return ctx;
};

interface ModalProviderProps<T extends Record<string, ModalComponent>> {
    modals: T;
    children: ReactNode;
}

export const ModalProvider = <T extends Record<string, ModalComponent>>({
    modals,
    children,
}: ModalProviderProps<T>) => {
    const [state, setState] = useState<ModalState | null>(null);

    const openModal = (key: keyof T & string, options?: { title?: string; props?: any }) => {
        setState({ key, title: options?.title, props: options?.props });
    };

    const closeModal = () => setState(null);

    const ActiveModal = state ? modals[state.key] : null;

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            <Dialog open={!!state} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="max-w-lg">
                    <DialogTitle className={cn("mb-6", !state?.title && "hidden")}>
                        {state?.title}
                    </DialogTitle>
                    {ActiveModal && (
                        <ActiveModal close={closeModal} props={state?.props} />
                    )}
                </DialogContent>
            </Dialog>
        </ModalContext.Provider>
    );
};