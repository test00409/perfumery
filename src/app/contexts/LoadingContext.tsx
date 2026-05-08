"use client";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS } from "../../constants/colors";

export default function Loader() {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F8F5F0",
          zIndex: 9999,
        }}
      >
        <div style={{ position: "relative", width: "52px", height: "52px" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "3px solid #e8e3dc",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "3px solid transparent",
              borderTopColor: COLORS.Primary,
              borderRadius: "50%",
              animation: "loader-spin 0.75s linear infinite",
            }}
          />
        </div>
        <style>{`@keyframes loader-spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    </AnimatePresence>
  );
}