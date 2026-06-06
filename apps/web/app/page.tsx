"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRelay } from "./lib/store";
import { Remote } from "./components/Remote";
import { Connect } from "./components/Connect";

export default function Page() {
  const connectBridge = useRelay((s) => s.connectBridge);
  const phase = useRelay((s) => s.phase);
  const connectedDevice = useRelay((s) => s.connectedDevice);

  useEffect(() => {
    connectBridge();
  }, [connectBridge]);

  const connected = phase === "connected" && Boolean(connectedDevice);

  return (
    <main
      className="flex w-full flex-col justify-center px-5"
      style={{
        minHeight: "100dvh",
        paddingTop: "max(2rem, env(safe-area-inset-top))",
        paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={connected ? "remote" : "connect"}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.2, 0.7, 0.3, 1] }}
        >
          {connected ? <Remote /> : <Connect />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
