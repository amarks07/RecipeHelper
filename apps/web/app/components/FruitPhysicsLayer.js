"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";

export default function FruitPhysicsLayer({ fruits }) {
  const layerRef = useRef(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const engine = Matter.Engine.create();
    engine.gravity.scale = 0;
    engine.positionIterations = 8;
    engine.velocityIterations = 6;

    const parent = layer.parentElement;
    const logo = parent?.querySelector(".home-wordmark");
    const getStarted = document.querySelector('main > a[href="/auth/login"]');
    const explicitObstacles = parent?.querySelectorAll(".fruit-physics-obstacle");
    const obstacleElements = explicitObstacles?.length
      ? [...explicitObstacles]
      : [logo, getStarted].filter(Boolean);
    const elements = [...layer.querySelectorAll(".produce-icon")].filter(
      (element) => window.getComputedStyle(element).display !== "none"
    );

    const sprites = elements.map((element, index) => {
      const bounds = element.getBoundingClientRect();
      const layerBounds = layer.getBoundingClientRect();
      const radius = Math.max(element.offsetWidth, element.offsetHeight) * 0.44;
      const body = Matter.Bodies.circle(
        bounds.left - layerBounds.left + bounds.width / 2,
        bounds.top - layerBounds.top + bounds.height / 2,
        radius,
        { restitution: 1, friction: 0, frictionStatic: 0, frictionAir: 0.0004, density: 0.001 }
      );
      const direction = index * 2.399963229728653;
      const speed = 0.95 + Math.random() * 0.55;
      Matter.Body.setVelocity(body, {
        x: Math.cos(direction) * speed,
        y: Math.sin(direction) * speed,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.018);
      return { element, body, radius, direction };
    });

    Matter.World.add(engine.world, sprites.map(({ body }) => body));

    let walls = [];
    let obstacles = [];

    const syncStaticBodies = () => {
      Matter.World.remove(engine.world, [...walls, ...obstacles]);
      const { width, height } = layer.getBoundingClientRect();
      const thickness = 100;
      walls = [
        Matter.Bodies.rectangle(width / 2, -thickness / 2, width + thickness * 2, thickness, { isStatic: true, restitution: 1, friction: 0 }),
        Matter.Bodies.rectangle(width / 2, height + thickness / 2, width + thickness * 2, thickness, { isStatic: true, restitution: 1, friction: 0 }),
        Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height + thickness * 2, { isStatic: true, restitution: 1, friction: 0 }),
        Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height + thickness * 2, { isStatic: true, restitution: 1, friction: 0 }),
      ];

      const layerBounds = layer.getBoundingClientRect();
      obstacles = obstacleElements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return Matter.Bodies.rectangle(
          bounds.left - layerBounds.left + bounds.width / 2,
          bounds.top - layerBounds.top + bounds.height / 2,
          bounds.width + 14,
          bounds.height + 12,
          { isStatic: true, restitution: 1, friction: 0 }
        );
      });

      Matter.World.add(engine.world, [...walls, ...obstacles]);
    };

    const handlePointerMove = (event) => {
      const bounds = layer.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;

      sprites.forEach(({ body, radius }) => {
        const dx = body.position.x - pointerX;
        const dy = body.position.y - pointerY;
        const distance = Math.max(Math.hypot(dx, dy), 1);
        const influenceRadius = radius + 180;

        if (distance < influenceRadius) {
          const strength = 0.5 + (1 - distance / influenceRadius) * 1.5;
          Matter.Body.setVelocity(body, {
            x: body.velocity.x + (dx / distance) * strength,
            y: body.velocity.y + (dy / distance) * strength,
          });
        }
      });
    };

    syncStaticBodies();
    window.addEventListener("resize", syncStaticBodies);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    let animationFrame = 0;
    const render = () => {
      sprites.forEach(({ element, body, direction }) => {
        const speed = Matter.Vector.magnitude(body.velocity);
        if (speed > 2.5) {
          Matter.Body.setVelocity(body, Matter.Vector.mult(body.velocity, 2.5 / speed));
        } else if (speed < 0.75) {
          const angle = speed > 0.02 ? Math.atan2(body.velocity.y, body.velocity.x) : direction;
          Matter.Body.setVelocity(body, {
            x: Math.cos(angle) * 0.75,
            y: Math.sin(angle) * 0.75,
          });
        }
        element.style.left = `${body.position.x}px`;
        element.style.top = `${body.position.y}px`;
        element.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      animationFrame = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", syncStaticBodies);
      window.removeEventListener("pointermove", handlePointerMove);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, [fruits]);

  return (
    <div className="produce-scatter" aria-hidden="true" ref={layerRef}>
      {fruits.map((fruit) => (
        <img
          key={fruit}
          src={`/fruit-icons/${fruit}.png`}
          alt=""
          className={`produce-icon produce-icon--${fruit}`}
          draggable="false"
        />
      ))}
    </div>
  );
}