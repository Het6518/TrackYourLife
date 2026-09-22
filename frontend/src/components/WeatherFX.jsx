import { useEffect, useRef } from "react";

// Full-screen canvas overlay that animates a weather-appropriate particle
// effect behind the UI: falling snow (winter), rain (monsoon), drifting
// petals (cherry blossom), floating leaves/pollen (spring), or rising sun
// motes (summer). Particles randomly re-spawn (position/speed/size/rotation)
// the moment they leave the screen, so the effect never visibly loops.
export default function WeatherFX({ mode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!mode) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let frameId;

    const counts = { rain: 160, snow: 90, petal: 45, leaf: 35, sun: 60 };
    const count = counts[mode] || 60;

    function randomParticle(spawnAnywhere) {
      const startY = () => (spawnAnywhere ? Math.random() * height : -20);
      switch (mode) {
        case "rain":
          return {
            x: Math.random() * width,
            y: startY(),
            len: 12 + Math.random() * 18,
            speed: 9 + Math.random() * 7,
            drift: 1.2 + Math.random() * 0.8,
            opacity: 0.25 + Math.random() * 0.35,
          };
        case "snow":
          return {
            x: Math.random() * width,
            y: startY(),
            r: 1.5 + Math.random() * 3,
            speed: 0.6 + Math.random() * 1.6,
            drift: Math.random() * 1,
            sway: Math.random() * Math.PI * 2,
            opacity: 0.4 + Math.random() * 0.5,
          };
        case "petal": // cherry blossom — pink petals, tumbling
          return {
            x: Math.random() * width,
            y: startY(),
            size: 6 + Math.random() * 6,
            speed: 0.7 + Math.random() * 1.1,
            drift: 0.6 + Math.random() * 1.2,
            sway: Math.random() * Math.PI * 2,
            spin: Math.random() * Math.PI * 2,
            spinSpeed: (Math.random() - 0.5) * 0.06,
            opacity: 0.55 + Math.random() * 0.35,
            hue: 330 + Math.random() * 20,
          };
        case "leaf": // spring — green leaves/pollen, gentle drift
          return {
            x: Math.random() * width,
            y: startY(),
            size: 5 + Math.random() * 5,
            speed: 0.4 + Math.random() * 0.7,
            drift: 0.8 + Math.random() * 1.4,
            sway: Math.random() * Math.PI * 2,
            spin: Math.random() * Math.PI * 2,
            spinSpeed: (Math.random() - 0.5) * 0.05,
            opacity: 0.4 + Math.random() * 0.35,
            hue: 90 + Math.random() * 40,
          };
        case "sun": // summer — warm motes drifting upward
          return {
            x: Math.random() * width,
            y: spawnAnywhere ? Math.random() * height : height + 20,
            r: 1 + Math.random() * 2.2,
            speed: 0.3 + Math.random() * 0.7,
            drift: (Math.random() - 0.5) * 0.6,
            twinkle: Math.random() * Math.PI * 2,
            opacity: 0.3 + Math.random() * 0.5,
          };
        default:
          return { x: 0, y: 0 };
      }
    }

    let particles = Array.from({ length: count }, () => randomParticle(true));

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);

    function drawPetalOrLeaf(p, isPetal) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = `hsl(${p.hue}, ${isPetal ? "75%" : "45%"}, ${isPetal ? "78%" : "48%"})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);

      if (mode === "rain") {
        ctx.strokeStyle = "rgba(200, 225, 255, 0.6)";
        ctx.lineCap = "round";
        particles.forEach((drop) => {
          ctx.globalAlpha = drop.opacity;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - drop.drift * 3, drop.y + drop.len);
          ctx.stroke();
          drop.x -= drop.drift;
          drop.y += drop.speed;
          if (drop.y > height + 20 || drop.x < -20) Object.assign(drop, randomParticle(false));
        });
      } else if (mode === "snow") {
        ctx.fillStyle = "#ffffff";
        particles.forEach((flake) => {
          ctx.globalAlpha = flake.opacity;
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
          ctx.fill();
          flake.sway += 0.02;
          flake.x += Math.sin(flake.sway) * flake.drift;
          flake.y += flake.speed;
          if (flake.y > height + 10) Object.assign(flake, randomParticle(false));
        });
      } else if (mode === "petal" || mode === "leaf") {
        particles.forEach((p) => {
          drawPetalOrLeaf(p, mode === "petal");
          p.sway += 0.015;
          p.spin += p.spinSpeed;
          p.x += Math.sin(p.sway) * p.drift;
          p.y += p.speed;
          if (p.y > height + 20 || p.x < -20 || p.x > width + 20) Object.assign(p, randomParticle(false));
        });
      } else if (mode === "sun") {
        particles.forEach((m) => {
          m.twinkle += 0.04;
          const flicker = 0.6 + Math.sin(m.twinkle) * 0.4;
          ctx.globalAlpha = m.opacity * flicker;
          ctx.fillStyle = "#ffd98a";
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
          m.x += m.drift;
          m.y -= m.speed;
          if (m.y < -20) Object.assign(m, randomParticle(false));
        });
      }

      ctx.globalAlpha = 1;
      frameId = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, [mode]);

  if (!mode) return null;
  return <canvas ref={canvasRef} className="weather-fx" aria-hidden="true" />;
}
