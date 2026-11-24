import { createAnimator } from "./animator.js";
import {
  registerScene,
  hasScene,
  listRegisteredScenes,
  renderScene
} from "./scene-registry.js";
import { registerFlowScene } from "./scenes/flow.js";
import { registerMemoryScenes } from "./scenes/memory.js";
import { registerOnboardingScenes } from "./scenes/onboarding.js";
import { registerBitwiseScenes } from "./scenes/bitwise.js";

registerFlowScene(registerScene);
registerMemoryScenes(registerScene);
registerOnboardingScenes(registerScene);
registerBitwiseScenes(registerScene);

export {
  createAnimator,
  registerScene,
  hasScene,
  listRegisteredScenes,
  renderScene
};
