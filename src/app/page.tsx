import Image from "next/image";
import { Robot } from "@/components/shared/Robot";

export default function Home() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-gradient-to-br from-[#d4e8f0] via-[#e8f4f8] to-[#0a4d7e]">
      {/* Background waves*/}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[54vw] min-w-[360px] z-0"
      >
        <div className="absolute inset-0 bg-[url('/assets/curvy-bg1.svg')] bg-no-repeat bg-left [background-size:100%]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[54vw] min-w-[360px] z-0"
      >
        <div className="absolute inset-0 bg-[url('/assets/curvy-bg2.svg')] bg-no-repeat bg-right [background-size:60%]" />
      </div>

      {/* Timi Assistant*/}
      <Robot />

      {/* Main card */}
      <div className="relative z-10 grid place-content-center  min-h-[100svh] p-6 md:ml-8">
        <div className="w-full max-w-[600px] rounded-[40px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-10 md:p-14">
          {/* Logo */}
          <div className="mx-auto mb-6 flex items-center justify-center">
            <Image
              src="/assets/lv-logo.svg"
              alt="La Verdad Christian College"
              width={80}
              height={80}
              className="drop-shadow-sm"
            />
          </div>

          {/* Heading */}
          <h1 className="text-center text-[28px] md:text-[32px] font-normal text-black">
            Hi{" "}
            <span className="text-[#0693D2] font-semibold">La Verdarian</span> !
          </h1>

          {/* Subheading */}
          <p className="mt-2 text-center text-[32px] md:text-[36px] font-normal text-black leading-tight">
            Welcome to Ticket-Team
          </p>

          {/* Description */}
          <p className="mt-6 text-center text-[14px] md:text-[15px] text-gray-600 leading-relaxed px-4">
            You can now create a ticket anytime to request MIS assistance
            efficiently.
            <br />
            Track and resolve concerns faster
          </p>

          {/* CTA Button */}
          <div className="mt-10 flex justify-center">
            <a
              href="/login"
              className="w-full inline-flex items-center justify-center gap-3 rounded-[20px] px-8 py-4 text-[18px] md:text-[20px] font-semibold text-white bg-[#003B73] shadow-lg hover:bg-[#002C5A] transition-all duration-200"
            >
              Get Started
              {/* <span className="text-2xl" aria-hidden="true">
                →
              </span> */}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
