import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Subtle blockchain-style mesh behind the hero bullion (pre–“clear mesh” look).
 */
export function HeroBullionNetwork() {
  const rootRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const nodes = gsap.utils.toArray<SVGCircleElement>('.hero-chain__node', root)
        const links = gsap.utils.toArray<SVGPathElement | SVGLineElement>('.hero-chain__link', root)
        const packets = gsap.utils.toArray<SVGCircleElement>('.hero-chain__packet', root)

        gsap.set(nodes, { transformOrigin: '50% 50%' })
        gsap.set(packets, { opacity: 0 })

        nodes.forEach((node, i) => {
          gsap.to(node, {
            y: i % 2 === 0 ? -2.5 : 2.2,
            x: i % 3 === 0 ? 1.4 : -1.2,
            duration: 3.2 + (i % 4) * 0.45,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: i * 0.18,
          })
          gsap.to(node, {
            attr: { r: Number(node.getAttribute('r') || 2.2) * 1.35 },
            opacity: 0.55,
            duration: 2.4 + (i % 3) * 0.35,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: i * 0.22,
          })
        })

        links.forEach((link, i) => {
          const length =
            typeof (link as SVGGeometryElement).getTotalLength === 'function'
              ? (link as SVGGeometryElement).getTotalLength()
              : 80
          gsap.set(link, {
            strokeDasharray: `${Math.max(10, length * 0.22)} ${Math.max(18, length * 0.55)}`,
            strokeDashoffset: 0,
          })
          gsap.to(link, {
            strokeDashoffset: -length,
            duration: 9 + (i % 4) * 1.4,
            ease: 'none',
            repeat: -1,
          })
          gsap.to(link, {
            opacity: 0.22,
            duration: 2.8 + (i % 3) * 0.4,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: i * 0.3,
          })
        })

        packets.forEach((packet, i) => {
          const path = root.querySelector<SVGPathElement>(`#hero-chain-path-${i + 1}`)
          if (!path) return
          const len = path.getTotalLength()
          const prog = { t: 0 }
          gsap.set(packet, { opacity: 0 })

          const tl = gsap.timeline({ repeat: -1, delay: i * 1.6, repeatDelay: 1.4 })
          tl.to(packet, { opacity: 0.65, duration: 0.4, ease: 'sine.out' })
            .to(
              prog,
              {
                t: 1,
                duration: 5 + i * 0.35,
                ease: 'none',
                onUpdate: () => {
                  const pt = path.getPointAtLength(prog.t * len)
                  packet.setAttribute('cx', String(pt.x))
                  packet.setAttribute('cy', String(pt.y))
                },
              },
              0,
            )
            .to(packet, { opacity: 0, duration: 0.45, ease: 'sine.in' }, '-=0.5')
            .set(prog, { t: 0 })
        })
      }, root)
      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  return (
    <div className="home-hero-bullion-stage__chain" aria-hidden="true">
      <svg
        ref={rootRef}
        className="hero-chain"
        viewBox="0 0 200 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="hero-chain__links" opacity="0.55">
          <path
            id="hero-chain-path-1"
            className="hero-chain__link"
            d="M28 72 C48 48, 72 36, 100 30 C128 36, 152 48, 172 72"
          />
          <path
            id="hero-chain-path-2"
            className="hero-chain__link"
            d="M22 110 C40 88, 58 78, 78 74 C98 70, 118 74, 138 86"
          />
          <path
            id="hero-chain-path-3"
            className="hero-chain__link"
            d="M178 110 C160 132, 142 148, 118 158 C96 166, 74 164, 52 150"
          />
          <line className="hero-chain__link" x1="34" y1="54" x2="58" y2="38" />
          <line className="hero-chain__link" x1="166" y1="54" x2="142" y2="38" />
          <line className="hero-chain__link" x1="24" y1="148" x2="48" y2="168" />
          <line className="hero-chain__link" x1="176" y1="148" x2="152" y2="168" />
          <line className="hero-chain__link" x1="100" y1="22" x2="100" y2="40" />
          <line className="hero-chain__link" x1="48" y1="88" x2="72" y2="102" />
          <line className="hero-chain__link" x1="152" y1="88" x2="128" y2="102" />
          <line className="hero-chain__link" x1="64" y1="176" x2="88" y2="188" />
          <line className="hero-chain__link" x1="136" y1="176" x2="112" y2="188" />
        </g>

        <g className="hero-chain__nodes">
          <circle className="hero-chain__node" cx="100" cy="24" r="2.4" />
          <circle className="hero-chain__node" cx="34" cy="54" r="2.1" />
          <circle className="hero-chain__node" cx="166" cy="54" r="2.1" />
          <circle className="hero-chain__node" cx="22" cy="110" r="2.3" />
          <circle className="hero-chain__node" cx="178" cy="110" r="2.3" />
          <circle className="hero-chain__node" cx="36" cy="162" r="2" />
          <circle className="hero-chain__node" cx="164" cy="162" r="2" />
          <circle className="hero-chain__node" cx="76" cy="196" r="1.9" />
          <circle className="hero-chain__node" cx="124" cy="196" r="1.9" />
          <circle className="hero-chain__node" cx="58" cy="38" r="1.6" />
          <circle className="hero-chain__node" cx="142" cy="38" r="1.6" />
          <circle className="hero-chain__node" cx="70" cy="128" r="1.5" />
          <circle className="hero-chain__node" cx="130" cy="128" r="1.5" />
        </g>

        <g className="hero-chain__packets">
          <circle className="hero-chain__packet" cx="28" cy="72" r="1.7" />
          <circle className="hero-chain__packet" cx="22" cy="110" r="1.5" />
          <circle className="hero-chain__packet" cx="178" cy="110" r="1.5" />
        </g>
      </svg>
    </div>
  )
}
