import { Suspense, useEffect, useRef, useState } from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";

function StellaModel({ animation, scale }) {
  const { scene, animations } = useGLTF("/models/agente-stella.glb");

  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    const selectedAction =
      actions[animation] || actions.fluttua || Object.values(actions)[0];

    if (!selectedAction) return;

    selectedAction.reset().fadeIn(0.3).play();

    return () => {
      selectedAction.fadeOut(0.3);
    };
  }, [actions, animation]);

  return <primitive object={scene} scale={scale} position={[0, -0.1, 0]} />;
}

function StellaAvatar({
  animation = "fluttua",
  width = 100,
  height = 100,
  scale = 1,
}) {
  return (
    <div
      style={{
        width,
        height,
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 40, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 3, 4]} intensity={2} />

        <Suspense fallback={null}>
          <StellaModel animation={animation} scale={scale} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One-time snapshot of Stella, used as a flat image beside messages.  */
/* A hidden 3D canvas renders her once, saves a PNG, then removes      */
/* itself. Every small avatar reuses that same PNG, so the page never  */
/* needs more than one extra WebGL context, and only for a moment.     */
/* ------------------------------------------------------------------ */

let cachedFace = null;
const listeners = new Set();

function FaceCapture() {
  const { gl, scene, camera } = useThree();
  const frames = useRef(0);

  useFrame(() => {
    if (cachedFace) return;

    frames.current += 1;

    // Give the model a moment to load and settle, and stop trying after a while
    if (frames.current < 40 || frames.current > 400) return;

    // Draw once more right now so the canvas definitely holds Stella
    gl.render(scene, camera);
    const picture = gl.domElement.toDataURL("image/png");

    // If the canvas is still empty, try again on the next frame
    const empty = document.createElement("canvas");
    empty.width = gl.domElement.width;
    empty.height = gl.domElement.height;
    if (picture === empty.toDataURL("image/png")) return;

    cachedFace = picture;
    listeners.forEach((listener) => listener(cachedFace));
  });

  return null;
}

export function useStellaFace() {
  const [face, setFace] = useState(cachedFace);

  useEffect(() => {
    if (cachedFace) {
      setFace(cachedFace);
      return;
    }

    listeners.add(setFace);
    return () => listeners.delete(setFace);
  }, []);

  return face;
}

// Mount this once anywhere. It renders nothing after the snapshot is taken.
export function StellaFaceCapture() {
  const [done, setDone] = useState(Boolean(cachedFace));

  useEffect(() => {
    if (done) return;

    const onCaptured = () => setDone(true);
    listeners.add(onCaptured);
    return () => listeners.delete(onCaptured);
  }, [done]);

  if (done) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: 160,
        height: 160,
        opacity: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 40, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 3, 4]} intensity={2} />

        <Suspense fallback={null}>
          <StellaModel animation="fluttua" scale={1.15} />
          <FaceCapture />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/agente-stella.glb");

export default StellaAvatar;
