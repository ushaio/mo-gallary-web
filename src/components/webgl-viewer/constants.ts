import type {
  AlignmentAnimationConfig,
  DoubleClickConfig,
  PanningConfig,
  PinchConfig,
  VelocityAnimationConfig,
  WheelConfig,
} from './types/interface'

export const defaultWheelConfig: WheelConfig = {
  step: 0.1,
  wheelDisabled: false,
  touchPadDisabled: false,
}

export const defaultPinchConfig: PinchConfig = {
  step: 0.5,
  disabled: false,
}

export const defaultDoubleClickConfig: DoubleClickConfig = {
  step: 2,
  disabled: false,
  mode: 'toggle',
  animationTime: 200,
}

export const defaultPanningConfig: PanningConfig = {
  disabled: false,
  velocityDisabled: true,
}

export const defaultAlignmentAnimation: AlignmentAnimationConfig = {
  sizeX: 0,
  sizeY: 0,
  velocityAlignmentTime: 0.2,
}

export const defaultVelocityAnimation: VelocityAnimationConfig = {
  sensitivity: 1,
  animationTime: 0.2,
}
