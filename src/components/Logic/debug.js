import { settings } from '../../data/game.data.js';


export default function debugLog(...message) {
    if (settings.debugMode) {
        console.log(...message);
    }
}
