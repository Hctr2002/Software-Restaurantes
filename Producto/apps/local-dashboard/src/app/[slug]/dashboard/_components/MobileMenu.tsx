"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  pathname: string;
  base: string;
  isSigningOut: boolean;
  onSignOut: () => void;
}

export default function MobileMenu({ 
  isOpen, 
  onClose, 
  user, 
  pathname, 
  base, 
  isSigningOut, 
  onSignOut 
}: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-background/95 backdrop-blur-2xl border-r border-foreground/10 z-[70] lg:hidden flex flex-col overflow-hidden shadow-2xl"
          >
            <Sidebar 
              user={user}
              pathname={pathname}
              base={base}
              isSigningOut={isSigningOut}
              onSignOut={onSignOut}
              onCloseMobile={onClose}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
