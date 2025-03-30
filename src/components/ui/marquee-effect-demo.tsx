import { MarqueeAnimation } from "./marquee-effect";

function MarqueeEffectDoubleExample() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <MarqueeAnimation
        direction="left"
        baseVelocity={-5}
        className="bg-green-500 text-white py-3 md:py-4"
      >
        #chatlinks
      </MarqueeAnimation>
      <MarqueeAnimation
        direction="right"
        baseVelocity={-5}
        className="bg-purple-500 text-white py-3 md:py-4"
      >
        #chatlinks
      </MarqueeAnimation>
    </div>
  );
}

export { MarqueeEffectDoubleExample };