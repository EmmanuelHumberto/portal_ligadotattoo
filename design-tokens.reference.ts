export const color = {
  surface: { canvas: "#0B0C0F", base: "#111318", raised: "#171A20", overlay: "#20242C" },
  text: { primary: "#F4F5F7", secondary: "#A8AFBA", muted: "#747D89" },
  accent: { primary: "#C7FF4A", secondary: "#7B61FF" },
  status: { positive: "#62D995", warning: "#F4C95D", negative: "#FF6B6B" },
} as const;

export const spacing = [0,4,8,12,16,24,32,48,64,96] as const;
export const breakpoints = { sm:640, md:768, lg:1024, xl:1280, "2xl":1536 } as const;
