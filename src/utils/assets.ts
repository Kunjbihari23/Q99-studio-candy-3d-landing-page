import { AssetPath } from "./BaseUrl";
import heroBg from "/Images/hero_bg.png";
import PlaystoreImage from "../../public/playStore.png";
import exp1 from "/Images/experience/exp1.jpeg";
import exp2 from "/Images/experience/exp2.jpeg";
import exp3 from "/Images/experience/exp3.jpeg";
import exp4 from "/Images/experience/exp4.jpeg";

export const ASSETS = {
  images: {
    heroBackground: heroBg,
    heroPlaystoreBtn: PlaystoreImage,
    experiences: [exp1, exp2, exp3, exp4],
  },
  glb: {
    candyMix: AssetPath("/Glb-Models/Mix_candy.glb"),
    candyPrince: AssetPath("/Glb-Models/Candy_prince.glb"),
    candyPink: AssetPath("/Glb-Models/candy_pink.glb"),
    candyGreen: AssetPath("/Glb-Models/candy_model_green.glb"),
    candyColorFull: AssetPath("/Glb-Models/Color_Full_Candy.glb"),
    candyStick: AssetPath("/Glb-Models/candy_stick.glb"),
    candyRed: AssetPath("/Glb-Models/red_candy_monster.glb"),
  },
  fonts: {
    orbitron: {
      regular: AssetPath("/Orbitron/Orbitron-Regular.ttf"),
      bold: AssetPath("/Orbitron/Orbitron-Bold.ttf"),
    },
    rajdhani: {
      regular: AssetPath("/Rajdhani/Rajdhani-Regular.ttf"),
      bold: AssetPath("/Rajdhani/Rajdhani-Bold.ttf"),
    },
    cinzel: {
      regular: AssetPath("/Cinzel/static/Cinzel-Regular.ttf"),
      bold: AssetPath("/Cinzel/static/Cinzel-Bold.ttf"),
    },
  },
} as const;
