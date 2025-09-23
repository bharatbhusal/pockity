import localFont from "next/font/local";

export const quantumLemon = localFont({
  src: [
    {
      path: "./QuantumLemon/Quantum-Lemon-Normal.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./QuantumLemon/Quantum-Lemon-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./QuantumLemon/Quantum-Lemon-Italics.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-quantum-lemon",
});

export const ubuntu = localFont({
  src: [
    {
      path: "./Ubuntu/Ubuntu-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./Ubuntu/Ubuntu-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./Ubuntu/Ubuntu-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-ubuntu",
});
