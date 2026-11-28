let cachedFace = null;

const listeners = new Set();

export function getCachedFace() {
  return cachedFace;
}

export function subscribeToStellaFace(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function publishStellaFace(face) {
  if (cachedFace) return;

  cachedFace = face;

  listeners.forEach((listener) => listener());
}
