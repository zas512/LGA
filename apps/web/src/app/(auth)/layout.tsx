"use client";
import { useState } from "react";
import Image from "next/image";
import type { ReactNode } from "react";

interface LawQuote {
  text: string;
  author: string;
}

const LAW_QUOTES: LawQuote[] = [
  {
    text: "Jurisprudence is the knowledge of things divine and human, the science of the just and the unjust.",
    author: "Ulpian, Digest of Roman Law"
  },
  {
    text: "The law is reason, free from passion.",
    author: "Aristotle"
  },
  {
    text: "Justice is the constant and perpetual will to allot to every man his due.",
    author: "Domitius Ulpianus"
  },
  {
    text: "If we desire respect for the law, we must first make the law respectable.",
    author: "Louis D. Brandeis"
  },
  {
    text: "The law is not a monument, but a garden. It must be cultivated, it must be tended.",
    author: "Justice Felix Frankfurter"
  },
  {
    text: "Let justice be done though the heavens fall.",
    author: "Latin Legal Maxim"
  },
  {
    text: "Where law ends, tyranny begins.",
    author: "John Locke"
  },
  {
    text: "The good of the people is the chief law.",
    author: "Cicero"
  },
  {
    text: "Injustice anywhere is a threat to justice everywhere.",
    author: "Martin Luther King Jr."
  },
  {
    text: "The life of the law has not been logic; it has been experience.",
    author: "Oliver Wendell Holmes Jr."
  },
  {
    text: "Let reverence for the laws be breathed by every mother to the lisping babe that prattles on her lap.",
    author: "Abraham Lincoln"
  },
  {
    text: "If we are to keep our democracy, there must be one commandment: Thou shalt not decide a case by power.",
    author: "Learned Hand"
  },
  {
    text: "Real change, enduring change, happens one step at a time.",
    author: "Justice Ruth Bader Ginsburg"
  },
  {
    text: "The final cause of law is the welfare of society.",
    author: "Benjamin N. Cardozo"
  },
  {
    text: "We are in bondage to the law in order that we may be free.",
    author: "Cicero"
  },
  {
    text: "Laws are like cobwebs, which may catch small flies, but let wasps and hornets break through.",
    author: "Solon"
  },
  {
    text: "Judges ought to be more learned than witty, more reverend than plausible, and more advised than confident.",
    author: "Francis Bacon"
  },
  {
    text: "We don't accomplish anything in this world alone... and whatever happens is the result of the whole tapestry of one's life.",
    author: "Justice Sandra Day O'Connor"
  },
  {
    text: "In recognizing the humanity of our fellow beings, we pay ourselves the highest tribute.",
    author: "Justice Thurgood Marshall"
  },
  {
    text: "Be you never so high, the law is above you.",
    author: "Lord Denning"
  },
  {
    text: "Nothing can destroy a government more quickly than its failure to observe its own laws.",
    author: "Tom Clark"
  },
  {
    text: "Reason is the life of the law, nay the common law itself is nothing else but reason.",
    author: "Sir Edward Coke"
  }
];

export default function AuthLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const [quote] = useState<LawQuote>(() => {
    const randomIndex =
      crypto.getRandomValues(new Uint32Array(1))[0] % LAW_QUOTES.length;
    return LAW_QUOTES[randomIndex];
  });

  return (
    <div className="flex min-h-screen bg-background w-full">
      {/* Left Pane: Branding Sidebar with background image */}
      <section className="relative hidden flex-col w-[60%] justify-between p-12 text-primary-foreground lg:flex border-r border-border/20 overflow-hidden">
        {/* Background image, full cover */}
        <Image
          src="/login.webp"
          alt=""
          fill
          priority
          className="object-cover"
        />
        {/* Dim layer */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Blue overlay, darkened */}
        <div className="absolute inset-0 bg-primary/70" />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/60" />
        {/* Content, above overlays */}
        <div className="relative z-10 flex items-center gap-3 font-sans text-2xl font-bold tracking-tight text-primary-foreground">
          <div>
            <Image
              src="/lgt_white.png"
              alt=""
              width={350}
              height={100}
              className="object-contain"
            />
          </div>
        </div>
        <div className="relative z-10 space-y-3">
          <p className="font-serif text-3xl leading-relaxed tracking-wide text-primary-foreground/90 italic">
            &quot;{quote.text}&quot;
          </p>
          <p className="font-sans text-sm uppercase tracking-widest text-primary-foreground/70 font-bold">
            — {quote.author}
          </p>
        </div>
        <div className="relative z-10 text-sm text-primary-foreground/60 tracking-tight flex items-center justify-between font-medium border-t border-white/40 pt-4">
          <span>Secure Firm Portal v1.0</span>
          <span>© {new Date().getFullYear()} LGA</span>
        </div>
      </section>
      {/* Right Pane: Page Content Surface */}
      <section className="flex flex-1 flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-6">{children}</div>
      </section>
    </div>
  );
}
