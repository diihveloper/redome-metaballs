const BACKGROUND_COLOR = '#FA5000';
const BALL_COLOR = '#FF6E00';
const BALL_COLOR_HIGHLIGHT = '#FF8C1E';

export interface SceneConfig {
    spacing: number;
    radius: number;
    backgroundColor: string;
    ballColor: string;
    ballColorHighlight: string;
    autoRatio: number;
    enableRatio: number;
}


export const DEFAULT_SCENE_CONFIG: SceneConfig = {
    spacing: 64,
    radius: 16,
    backgroundColor: BACKGROUND_COLOR,
    ballColor: BALL_COLOR,
    ballColorHighlight: BALL_COLOR_HIGHLIGHT,
    autoRatio: 0.5,
    enableRatio: 0.45
}
