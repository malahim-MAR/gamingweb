import { GameArt } from '@/components/game-art';
export function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <span className="tiny-star left-[9%] top-9">✦</span>
      <span className="tiny-star bottom-9 right-[12%]">✧</span>
      <div className="floating-card float-one left-[8%] top-12 h-[215px] w-[200px] rotate-[-12deg] border-4 border-white bg-[#efbd6c]">
        <GameArt slug="2048" className="h-full" />
      </div>
      <div className="floating-card float-two right-[5%] top-6 h-[140px] w-[205px] rotate-[12deg] border-4 border-white bg-[#a8c4a2]">
        <GameArt slug="word-game" className="h-full scale-90" />
      </div>
      <div className="floating-card float-two bottom-5 right-[11%] h-[153px] w-[195px] rotate-[7deg] border-4 border-white bg-[#b3b8e0]">
        <GameArt slug="endless-runner" className="h-full" />
      </div>
      <div className="absolute bottom-9 left-[2%] -rotate-6 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#38463c] shadow-sm">
        ✳ Good times, on repeat.
      </div>
    </div>
  );
}
