# 🍬 Q99 Jelzy Candy Rush — Interactive 3D Experience

A **next-generation interactive landing experience** for a candy-themed mobile game, built using **React Three Fiber, GSAP, and custom WebGL shaders**.

This is not just a landing page — it's a **playable, immersive candy world** where users interact, explore, and experience game-like feedback directly in the browser.

---

## 🎮 Experience Highlights

* 🍹 **Dynamic Soda Simulation**
  Real-time liquid shader with rising gradients, bubble systems, and interactive distortion.

* 🍬 **Physics-Based Candy Interactions**
  Floating, popping, and reactive candy elements driven by physics-inspired animations.

* 🎥 **Cinematic Scroll Journey**
  Smooth camera transitions powered by GSAP ScrollTrigger — no hard section cuts.

* ✨ **Micro-Interactions Everywhere**
  Every element responds to user input (hover, click, movement) with delightful feedback.

---

## 🧠 Core Philosophy

> “Don’t build sections. Build a world.”

* Scroll = camera movement
* UI = part of the 3D environment
* Interaction = reward system

---

## 🚀 Tech Stack

* **Framework:** React 19 + TypeScript
* **Bundler:** Vite 8
* **3D Engine:** Three.js + React Three Fiber + Drei
* **Physics (planned):** React Three Rapier
* **Animations:** GSAP + ScrollTrigger
* **Styling:** Tailwind CSS 4
* **Shaders:** GLSL (vite-plugin-glsl)
* **State Management (planned):** Zustand

---

## 🏗️ Architecture Overview

```text
src/
├── components/
│   ├── soda/              # Core liquid simulation system
│   │   ├── shaders/       # GLSL liquid + bubble shaders
│   │   ├── LiquidMesh.tsx
│   │   ├── SodaScene.tsx
│   │   └── useSodaAnimation.ts
│   │
│   ├── hero/              # Entry experience layer
│   ├── reveal/            # Scroll-triggered animations
│   ├── global/            # Shared UI + utilities
│   └── layout/            # Layout wrappers
│
├── scenes/                # (Planned expansion)
│   ├── CandyLabScene.tsx
│   ├── Match3Scene.tsx
│   ├── PowerupScene.tsx
│   └── LeaderboardScene.tsx
│
├── systems/               # (Planned)
│   ├── animation.ts
│   ├── interaction.ts
│   └── physics.ts
│
├── hooks/                 # Custom hooks (GSAP, animation logic)
├── utils/                 # Helpers and constants
```

---

## ✨ Current Features

* ✅ Custom GLSL liquid shader (wave + gradient animation)
* ✅ Rising soda simulation with animated bubbles
* ✅ Scroll-triggered cinematic transitions
* ✅ Modular animation hooks using GSAP

---

## 🧪 Upcoming Interactive Sections

### 🍭 Candy Lab

* Morphing candy blobs (noise-based deformation)
* Drag interaction with elastic physics feel

### 🎮 Match-3 Mini Game

* Playable grid with swap + match detection
* Combo system + particle explosions

### ⚡ Power-Up Orbit System

* Rotating candy abilities with interactive triggers

### 🍩 Candy Rain Leaderboard

* Instanced falling candies + interaction field

---

## 🎨 Shader & Visual Direction

* Glossy candy materials with **Fresnel highlights**
* Gradient-driven color transitions
* Particle-based feedback (sparkles, bursts)
* Subtle post-processing (bloom, vignette)

---

## ⚡ Performance Strategy

* InstancedMesh for repeated objects
* Lazy loading of 3D scenes
* Optimized shader calculations
* Controlled physics usage

---

## 🛠️ Getting Started

### Prerequisites

* Node.js (LTS recommended)
* pnpm / npm / yarn

### Installation

```bash
git clone [repository-url]
pnpm install
```

### Development

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
```

---

## 💅 Code Quality

* ESLint + Prettier configured
* Husky + lint-staged for pre-commit checks

---

## 🎯 Vision

The goal is to create a **highly engaging, playful web experience** that blends:

* 🎮 Game design principles
* 🎨 Motion design
* ⚙️ Real-time 3D rendering

---

## 📌 Status

🚧 Actively evolving into a full interactive 3D experience

---

## 🧑‍💻 Author

Built with creativity and experimentation in WebGL & interactive design.

---

## 📄 License

Private
